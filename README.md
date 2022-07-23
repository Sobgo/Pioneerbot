# Pioneer music bot

Pioneer is a discord music bot written in typescript and using discord.js API v13  
It lest you play music from youtube direclty to voice channel  
Pioneer is intended for private usage (self hosting) to avoid issues with copyrights

## Available functions

- search videos by URL or query and play them on voice channels
- queue songs to play
- skip or remove songs form queue
- create playlists and track song's likes/dislikes form your discord server users (only partially implemented in 2.x)

For list of all available commands you can type !help in chat  
You can change prefix in config.json

## How to use

Firstly you need to have the following dependencies installed:  
Node.js 16.9.0 or newer - <https://nodejs.org>  
FFmpeg - <https://ffmpeg.org>

To use Pioneer you need to have your own discord API token which you can get if you have discord developer account  
Then you will need to either build the application from the source code or use one of release builds  

You can also just clone this repository and install it with dev dependencies using: `npm i -D` and then `npm run dev`  
(you might want to install ts-node globally for easy access in command line)

When first running the app you will be prompted to specify your token in terminal, you can also paste in manually in config.json  
You will also be prompted to build database from schema with `npx prisma db push`  
Then you will need to invite your bot to one of your discord servers  
Also make sure that your bot has all necessary premissions if you're not sure which just give it admin.

## How to build

`git clone https://github.com/Sobgo/Pioneerbot.git`  
`cd Pioneerbot`  
`npm i -D`  
`npx tsc --outDir <yourPathToBuild>`  
`move node_modules <yourPathToBuild>`  
`cd <yourPathToBuild>`  
`node src/index.js`  

## Custom commands

You can add your own commands by creating file `[commandname].ts` in commands directory  
Inside this file there should be en exported function with the same name as filename taking 4 arguments:  
ID: string, queues: Wrapper, message: Message, args: string[]  

Additionally every command should also export a settings object. It is used to set up aliases and to display command properly in help menu.
You can check example command in commands/example.ts

## Bug reports and contributing

If you find any bugs feel free to report them using guthub issues and if you want to help you can make pull requests.

## License

This project in under MIT license, check `LICENSE` for more information.
