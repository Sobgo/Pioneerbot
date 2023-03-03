# Pioneer music bot

Pioneer is a discord music bot written in typescript and using discord.js API v14  
It lest you play music from youtube direclty to voice channel  
**It does NOT require youtube API key**  
Pioneer is intended for private usage (self hosting) to avoid issues with copyrights

## Available functions

- Play music from youtube directly to voice channel (even "blocked from display on this website or application" videos)  
- Build-in search function leting you choose the best result to play  
- Enqueue, skip, loop and shuffle songs however you want  
- Save your previously played songs and replay them later
- Create your own playlists and add songs to them
- Works with multiple servers at once!

For list of all available commands you can type `!help` in discord chat.  
You can change "!" prefix in `config.json` file.

## How to use

Firstly you need to have the following dependencies installed:  
Node.js **17.5.0 or newer** - <https://nodejs.org> (I recommend latest available)  
FFmpeg - <https://ffmpeg.org>  
Python 3 (youtube-dl-exec dependency) - <https://www.python.org>  
You can check if you have them installed by typing `node -v`, `ffmpeg -version` and `python3 -V` in terminal.  
if you installed Python and `python3` command doesn't work set symbolic link with: `ln -s python python3`

Then clone this repository and install it with dev dependencies using: `npm i -D`  
Note: You might want to install typescript globally for easy access in command line with: `npm i -g typescript ts-node tslib`

To run Pioneer you will need to provide your own discord API token which you can get by logging in to [discord developer portal](https://discord.com/developers) and creating new application.
After that go to bot section and add new bot. Copy its token and paste it in `config.json` file into token field. (or you can also provide it later in terminal, just don't lose it).  
While you're still in developer portal you will also need to enable "MESSAGE CONTENT INTENT" so that the bot can read commands form chat.  
Then you will need to invite your bot to one of your discord servers.  
Also make sure that your bot will have all necessary premissions like: read messages, use voice etc. If you're not sure which just give it admin.  

Finally you can run Pioneer with `npm start` command.

When first running the app you will be prompted to specify your token in terminal if you didn't already put it in `config.json` file.
You will also be prompted to build database from schema with `npm run migrate` command.

After that your bot should be ready to use. You can check all available commands by typing `!help` in discord chat.

## Configuration

Pioneer uses [yt-dlp](https://github.com/yt-dlp/yt-dlp) to download music streams. You can change download options in `config.json` file.
For example you can change quality of downloaded audio or set maximum download speed.
For list of all options check [yt-dlp documentation](https://github.com/yt-dlp/yt-dlp#usage-and-options).  
**Note: Flags inside `config.json` should be written in `camelCase` not `kebab-case` like in documentation above.**

You can also change bot prefix in `config.json` file.

## Custom commands

You can add your own commands by creating files in `src/commands` directory.  
Inside each command file should be an exported function with the same name as filename taking 4 arguments:  
`ID: string, queues: Wrapper, message: Message, args: string[]`  

Additionally every command should also export a settings object. It is used to set up command invokes and to display command properly in help menu.

The settings object looks like this:

```js
export const settings: CommandSettings = {
    name: "Play", // name of the command displayed in help menu
    invokes: ["play", "p"], // single words that invoke command when used with prefix
    description: "Searches song with the given `[query]` and adds the first result to the back of the queue"
        + "if no `[query]` is specified it will instead show currently playing song if any.",
    // description of the command displayed in help menu
    usage: "[query]", // descirption of command arguments
    category: "general", // used for grouping commands
    list: true // whether to show this command in help menu or not
}
```

For more exhaustive description you can check `commands/example.ts`.

## Building

You can technically build Pioneer from typescript into javascript with: `npx tsc --outDir <yourPathToBuild>` so it won't require dev dependencies to run.
However I don't see any reason to do that and because of that I don't provide any build scripts or prebuilt releases.

## Bug reports and contributing

If you find any bugs feel free to report them using guthub issues and if you want to help you can fork and create pull requests.

## License

This project in under MIT license, check `LICENSE` for more information.
