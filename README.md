# Pioneer music bot
Pioneer is a discord music bot written in node.js  
As of now it is able to:
+ search videos by URL or query and play them on voice channels
+ queue songs to play
+ skip or remove songs form queue
+ create playlists and track song's likes/dislikes form your discord server users

for list of all commands you can type help in your discord server chat after bot succesfully connects  
All commands need to be preceded by prefix, you can set prefix in `MessageProvider.js` default prefix is `$`

## How to run
open directory in terminal and run `npm install`  
then paste your bot's token in `authdata.json`  
finally run `node index.js`  
this will automatically create serverdata.json which will be used as long term memory for playlists  
note: you need to enable tracking to actually use this feature  
also make sure that your bot has all necessary premissions if you're not sure which just give it admin  

## TO DO
this is not a final version and you can expect the following features to be added in near future:
+ playing songs from serverdata
+ searching songs with multiple results to choose from

Also if you find any bugs feel free to report them or make pull requests

## License
This project in under MIT license, check `LICENSE` for more information
