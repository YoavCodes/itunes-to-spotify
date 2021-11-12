This is a quick and dirty util written in Deno that takes a Library.xml from Apple Music and makes it readable.

Running this:

0. Go to apple music and export your Library.xml file by going to File -> Library -> Export Library and save `Library.xml` in this folder.
1. install docker
2. run the deno docker image, interactively in a shell, with this code mapped to `/code` folder in the container and cd inside of it, (change the ~/code/itunes-to-spotify part to match where you have this on your host machine) with a single command. (this will also fetch the right image if you don't have it already)
`docker run -it --rm -v ~/code/itunes-to-spotify:/code -w /code --init --entrypoint sh -p 3000:3000 denoland/deno`
3. once inside the docker container, run this to execute the code
`deno --allow-read import.ts`
4. if your music library is fairly large it may take a while, but when it's done it'll print out all your tracks and playlists in the console in an easy to read way
