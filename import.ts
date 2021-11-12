import { PullParser } from "https://deno.land/x/xmlp/mod.ts";

interface Track {  
  name: string;
  artist: string;
  album: string;
}

interface Playlist {
    name: string;
    playlist_items: Track[];
  }
  
  interface Library {
    
      tracks: { [key: string]: Track };
      playlists: Playlist[];
    
  }

interface ParsedTrack extends Track {
    track_id: string,
    [id: string]: any
}

interface ParsedPlaylist {
    name: string;
    playlist_items: Array<{track_id: string}>
}

interface ParsedLibrary {    
    tracks: { [key: string]: ParsedTrack };
      playlists: ParsedPlaylist[];      
}



type TreePositionItem = {[key: string]: any};

const plistToObject = async (filename = "Library.xml"): Promise<{[key: string]: any}> => {    
  const uint8Array = await Deno.readFile(filename);
  
  const parser = new PullParser();
  const events = parser.parse(uint8Array);

  const result = {root: {}};

  const treePosition: TreePositionItem[] = [];
  let currentKey = "";  

  for (const event of events) {
    // @ts-ignore: accessing private method
    const tagName = event.element?._qName;
    const currentTreeItem = treePosition[0];

    if (event.name === "start_element") {
      switch (tagName) {
        case "plist":
          treePosition.unshift(result);
          currentKey = "root";
          break;
        case "dict": {
          const newObject = {};
          if (Array.isArray(currentTreeItem)) {
            // push the new object onto the array
            currentTreeItem.push(newObject);
            treePosition.unshift(newObject);
          } else {
            currentTreeItem[currentKey] = newObject;
            treePosition.unshift(newObject);
          }

          currentKey = "";
          break;
        }
        case "array": {
            const newArray: any[] = [];

            if (Array.isArray(currentTreeItem)) {
                currentTreeItem.push(newArray);
            } else {
                currentTreeItem[currentKey] = newArray;
            }          
          
          treePosition.unshift(newArray);
          currentKey = "";
          break;
        }
        case "key": {
          const textEvent = events.next();
          currentKey = (textEvent.value?.text || '').replace(" ", "_").toLowerCase();
          break;
        }
      }
    } else if (event.name === "end_element") {
      if (
        tagName === "dict" || tagName === "array"
      ) {
        
        treePosition.shift();
        
        
      }
    }

    if (event.name === "text") {
        currentTreeItem[currentKey] = event.text;
      currentKey = "";
    }
  }

  return result.root;
};

const pruneLibraryMetadata = (parsedLibrary: ParsedLibrary): Library => {    
  const {tracks = {}, playlists = []} = parsedLibrary;
  const _tracks: {[key: string]: Track} = {};
  const _playlists: Playlist[] = [];

  Object.values(tracks).forEach((track) => {
    const { name, artist, album, track_id } = track as ParsedTrack;
    _tracks[track_id] = {
      name,
      artist,
      album,
    };
  });

  for (const playlist of playlists) {
    _playlists.push({
        ...playlist,
        playlist_items: playlist.playlist_items.map((item) => {
            return _tracks[item.track_id];
          })
    })
    
  }

  return {
      tracks: _tracks,
      playlists: _playlists,
  };
};

const parsedLibrary: ParsedLibrary = await plistToObject("Library.xml") as ParsedLibrary;
const prunedLibrary = pruneLibraryMetadata(parsedLibrary);

console.log(JSON.stringify(prunedLibrary, null, 2));
