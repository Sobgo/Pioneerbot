# Pioneer music bot

Pioneer is a discord music bot written in typescript and using discord.js API v13  
It lest you play music from youtube direclty to voice channel  
Pioneer is intended for private usage (self hosting) to avoid issues with copyrights

## Available functions

- search videos by URL or query and play them to voice channels
- queue songs to play
- skip or remove songs form queue
- create playlists and add songs from playlists to queue

For list of all available commands you can type `!help` in discord chat  
You can change prefix in `config.json`

## How to use

Firstly you need to have the following dependencies installed:  
Node.js 16.9.0 or newer - <https://nodejs.org>  
FFmpeg - <https://ffmpeg.org>  
Python 3 (youtube-dl-exec dependency) - <https://www.python.org>  
if you installed Python and `python3` command doesn't work set symbolic link with: `ln -s python python3`

To use Pioneer you need to have your own discord API token which you can get if you have [discord developer account](https://discord.com/developers).  
Then you will need to either build the application from the source code or use one of release builds.  

You can also just clone this repository and install it with dev dependencies using: `npm i -D` and then `npm run dev`  
Note: You might want to install typescript globally for easy access in command line with: `npm i -g typescript ts-node tslib`

When first running the app you will be prompted to specify your token in terminal, you can also paste it in manually in `config.json`  
You will also be prompted to build database from schema with `npx prisma db push`  
Then you will need to invite your bot to one of your discord servers.  
Also make sure that your bot has all necessary premissions if you're not sure which just give it admin.

## How to build

`git clone https://github.com/Sobgo/Pioneerbot.git`  
`cd Pioneerbot`  
`npm i -D`  
`npx tsc --outDir <yourPathToBuild>`  
`move node_modules <yourPathToBuild>` (or install without dev dependenicies)  
`cd <yourPathToBuild>`  
`node src/index.js`  

## Custom commands

You can add your own commands by creating files in command directory.  
Inside this files there should be en exported function with the same name as filename taking 4 arguments:  
`ID: string, queues: Wrapper, message: Message, args: string[]`  

Additionally every command should also export a settings object. It is used to set up command invokes and to display command properly in help menu.

The settings object looks like this:

```js
settings {
 name : "Help", // command name
 invokes : ["help", "h"], // single word phrases that invoke command when used with prefix
 description : "Shows the help menu.", // command description
 usage : "[command]", // describes how to use the command (what are its arguments)
 category : "general", // used for grouping commands
 list : true // whether to show this command in help menu or not
}
```

For more exhaustive description check `commandMennager.ts` and for example check `commands/example.ts`

## Bug reports and contributing

If you find any bugs feel free to report them using guthub issues and if you want to help you can make pull requests.

## License

This project in under MIT license, check `LICENSE` for more information.
