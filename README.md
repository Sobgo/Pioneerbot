# Pioneer music bot
Pioneer is a discord music bot written in node.js  
As of now it is able to:
+ search videos by URL or query and play them on voice channels
+ queue songs to play
+ skip or remove songs form queue
+ create playlists and track song's likes/dislikes form your discord server users

for list of all commands you can type help in your discord server chat after bot succesfully connects  
All commands need to be preceded by prefix, you can set prefix in `MessageProvider.js` default prefix is `!`

## How to run
open directory in terminal and run `npm install`  
then paste your bot's token in `data/authdata.json`  
finally run `node .`  
This will automatically create serverdata.json which will be used as long term memory for playlists.  
Note: You need to enable tracking with $tracking on your discord server to actually save playlists.  
Also make sure that your bot has all necessary premissions if you're not sure which just give it admin.  

## TO DO
This is not a final version and you can expect the following features to be added in near future:
+ retrieving data form playlists (such as most liked song, length...)
+ playing songs from playlists
+ creating custom playlists
+ ~~searching songs with multiple results to choose from~~ DONE

## Bug reports and contributing
If you find any bugs feel free to report them using guthub issues and if you want to help you can make pull requests. I put some of my ideas for improvements in project called "improvements".

## License
This project in under MIT license, check `LICENSE` for more information.
