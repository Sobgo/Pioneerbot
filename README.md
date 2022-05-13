# Pioneer music bot
Pioneer is a discord music bot written in typescript and using discord.js API
It lest you play music from youtube direclty to voice channel
Pioneer is intended for private usage (self hosting) to avoid issues with copyrights

## Available functions
- search videos by URL or query and play them on voice channels
- queue songs to play
- skip or remove songs form queue
- create playlists and track song's likes/dislikes form your discord server users (TODO in version 2.x)

For list of all available commands you can type !help in chat
You can change prefix in config.json

## How to use
Firstly you need to have the following dependencies installed:
Node.js 16.9.0 or newer - https://nodejs.org
FFmpeg - https://ffmpeg.org

To use Pioneer you need to have your own discord API token which you can get if you have discord developer account
Then you will need to either build the application from the source code or use one of release builds (comming soon)
You can also just clone this repository and install it with dev dependencies using:
`npm i -D` (you might want to install ts-node globally for easy access in command line)
and then
`npm run dev`

When first running the app you will be prompted to specify your token in terminal, you can also paste in manually in config.json
Then you will need to invite your bot to one of your discord servers
Also make sure that your bot has all necessary premissions if you're not sure which just give it admin.  

## How to build
I will update this section when I make first build

## Custom commands
You can add your own commands by creating file `[commandname].ts` in commands directory
Inside this file there should be en exported function with the same name as filename taking 4 arguments:
ID: string, queues: Wrapper, message: Message, args: string[]
additionally you maight want to specify three variables aliases: String[], description: String and usage: String
first one contains all command aliases and other two are used in help command

example (commands/hello.ts):
```
import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const aliases = ["hi"];
export const description = "greets you";
export const usage = "[name]"; // everything after (prefix)name that user can type

export const hello = async (ID: string, queues: Wrapper, message: Message, args: string[]) => {
	if (args[0]) {
		message.channel.send("Hi " + args[0] + "!");
	}
	else {
		message.channel.send("Hi human!");
	}
}
```

## Bug reports and contributing
If you find any bugs feel free to report them using guthub issues and if you want to help you can make pull requests.

## License
This project in under MIT license, check `LICENSE` for more information.
