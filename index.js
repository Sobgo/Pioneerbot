const Discord = require('discord.js');
const client = new Discord.Client();

const ytdl = require("ytdl-core");
const yts = require("yt-search");
const validURL = require('valid-url');
const fs = require('fs');

const authdata = require('./authdata.json');
const messages = require('./messages.js');
const prefix = messages.prefix;

var serverdata = {};
var queue = {};

client.on('ready', () => {
	console.log(`${client.user.username} successfully logged in`);

  // check if serverdata file exists
  fs.access('serverdata.json', fs.constants.F_OK, async (err) => {
    if(err){
      // create it if not
      console.log('No serverdata file found, creating new one');
      await writeserverdata();
    }
    // save file data to variable
    readserverdata();
  });

  // sync variable with file every 5 minutes
  setInterval(writeserverdata, 1000*60*5);
});

// save data to json file
const writeserverdata = async () => {
  fs.writeFile('./serverdata.json', JSON.stringify(serverdata, null ,2), (err) => {
    if(err) console.log("couldn't save serverdata\nerror: " + err);
  });
}

// read data from json file
const readserverdata = async () => {
  fs.readFile('./serverdata.json', (err, data) => {
    if(err){
      console.log("couldn't read serverdata");
      throw err;
    }
    serverdata = JSON.parse(data);
  });
}

// server message listener
client.on('message', async message => {

  // return if message was sent by a bot or if doesn't start with a prefix
  if(message.author.bot) return;
  if(!message.content.startsWith(prefix)) return;

  // slice prefix, divide message into words
  let content = message.content.trim().split(" ");
  let action = content[0].slice(prefix.length);
  content = content.slice(1);

  const id = message.guild.id;

  switch(action){

    case "tracking": case "t":
      tracking(message, content[0]);
      break;

    case "vote": case "v":
      vote(message, content[0]);
      break;
      
    case "play": case "p":
      // add song to queue
      const result = await queueAdd(message, content, prefix.length+action.length+1);
      if(!result) return;

      // if no song is playing start playing first song form queue
      if(queue[id].playing == false){
        queuePlay(message);
      }
      else{
        // else send a message to confirm song being added
        const pos = queue[id].songs.length-1;
        queue[id].tc.send("**:memo:  Added to queue: **" + queue[id].songs[pos].title +
        "\nQueue position: **" + pos + "**");
      }
      break;

    case "skip": case "s": // optional argument how many to skip
      if(content.length > 0) queueSkip(message, parseInt(content[0]));
      else queueSkip(message);
      break;

    case "queue": case "q": // optional argument how many to show
      if(content.length > 0) queueList(message, parseInt(content[0]));
      else queueList(message);
      break;

    case "remove": case "r": // needs positon in queue specified and optional argument how many to remove
      if(content.length > 1) queueRemove(message, parseInt(content[0]), parseInt(content[1]));
      else if(content.length > 0) queueRemove(message, parseInt(content[0]));
      else message.channel.send(":x:  you need to specyfy queue positon!")
      break;

    case "leave": case "l":
      leaveVoiceChannel(message);
      break;

    case "join": case "j":
      joinVoiceChannel(message);
      break;

    case "help": case "h":
      message.channel.send(messages.get("help"));
      break;

    default:
      noCommand(message);
      break;
  }
});

// sends no command message
const noCommand = async (message, length = 1) => {

  let content = message.content.trim().split(" ");
  content[0].slice(prefix.length);

  let msg = "No command:";
  for(let iter = 0; iter < Math.min(length, content.length); iter += 1){
    msg = msg + " " + content[iter].toString();
  }
  msg += ", type: `" + prefix + "help` for command list";
  message.channel.send(msg);
}

// utility for vote function
const setVote = async (id, songid, user, oldVote, newVote) => {
  let msg = "";

  if(oldVote == 0){
    msg = ":white_check_mark:  Vote set";
    serverdata[id][songid].score += newVote;
    serverdata[id][songid].votes[user] = newVote;
    msg += ", song's voting score is now: **" + (serverdata[id][songid].score) + "**";
  }
  else if(oldVote != newVote){
    msg = ":white_check_mark:  Vote changed";
    serverdata[id][songid].score = serverdata[id][songid].score - oldVote + newVote;
    serverdata[id][songid].votes[user] = newVote;
    msg += ", song's voting score is now: **" + (serverdata[id][songid].score) + "**";
  }
  else{
    let voteString;
    if(newVote == 1) voteString = "yes";
    else voteString = "no";
    msg = "You already voted **" + voteString +"** for this song";
  }
  queue[id].tc.send(msg);
}

const vote = async (message, action) => {

  const result = await queueCheck(message, true);
  if(!result) return false;
  const id = message.guild.id;

  if(queue[id].tracking){ // if tracking enabled
    if(queue[id].songs.length > 0){ // if song is playing

      const songid = ytdl.getURLVideoID(queue[id].songs[0].url);
      const user = message.author.id;
      let vote;

      // get user vote (if exists)
      if(user in serverdata[id][songid].votes) vote = serverdata[id][songid].votes[user];
      else vote = 0;

      if(action != undefined){
        if(action == "yes" || action == 1){
          setVote(id, songid, user, vote, 1);
        }
        else if(action == "no" || action == -1){
          setVote(id, songid, user, vote, -1);
        }
        else if(action == "remove" || action == 0){
          if(vote != 0){
            queue[id].tc.send(":white_check_mark:  Vote removed");
            serverdata[id][songid].score -= vote;
            delete serverdata[id][songid].votes[user];
          }
          else queue[id].tc.send("You didn't vote for this song before");
        }
        else{
          queue[id].tc.send(":x:  Incorrect vote");
        }
      }
      else{
        if(vote == -1) queue[id].tc.send("Your current vote is **no**");
        else if(vote == 1) queue[id].tc.send("Your current vote is **yes**");
        else queue[id].tc.send("You didn't vote for this song before");
      }
    }
    else{
      queue[id].tc.send(":x:  No song playing");
    }
  }
  else{
    queue[id].tc.send(":x:  Tracking is disabled, enable tracking to vote");
  }
}

// enables or disables saving additional information to serverdata
// without action specified shows current tracking option (on/off)
const tracking = async (message, action) => {
  const id = message.guild.id;

  if(action == undefined){
    if(id in serverdata){
      message.channel.send(messages.get("trackingEnabled"));
    }
    else{
      message.channel.send(messages.get("trackingDisabled"));
    }
  }
  else{
    if(action == "enable" || action == 1){
      if(!(id in serverdata)){
        console.log('creating server ' + id + ' in serverdata');
        message.channel.send(":white_check_mark:  **Tracking enabled**");
        serverdata[id] = {};

        // if song is playing add it to serverdata
        // this is to prevent errors with vote function
        // when tracking was enabled after start of the song
        if(queue[id]){
          queue[id].tracking = true;
          if(queue[id].songs.length > 0){
            const songid = ytdl.getURLVideoID(queue[id].songs[0].url);
            serverdata[id][songid] = { "title": queue[id].songs[0].title, "count": 1, "votes": {}, "score": 0 };
          }
        }
      }
      else message.channel.send("Tracking is already enabled");
    }
    else if(action == "disable" || action == 0){
      if(id in serverdata){
        console.log('removing server ' + id + ' from serverdata');
        message.channel.send(":negative_squared_cross_mark:  **Tracking disabled**");
        delete serverdata[id];
        if(queue[id]) queue[id].tracking = false;
      }
      else message.channel.send("Tracking is already disabled");
    }
    else noCommand(message, 2);
  }
}

const queueCheck = async (message, join = false) => {
  const id = message.guild.id;
  
  // check if queue exists
  if(!(id in queue)){
    if(join){
      const result = await joinVoiceChannel(message);
      if(!result) return false;
    }
    else return false;
  }

  // if bot is in voice chat
  if(queue[id].vc){
    // check if user is in the same vioce chat as bot
    if(message.member.voice.channelID != queue[id].vc.channelID){ // user channel can be undefined but still returns false
      message.channel.send(message.author.toString() + " you need to join " + queue[id].vc.channel.toString() + " to use this command!");
      return false;
    }
    else return true;
  }
  // if user is in voice chat
  else if(!message.member.voice.channel){
    message.channel.send(message.author.toString() + " you need to be in a voice channel to use this command!");
    return false;
  }
}

const joinVoiceChannel = async (message) => {
  // join user if user is in voice chat
  if(message.member.voice.channel){
    await message.member.voice.channel.join();
    const id = message.guild.id;
    // create song queue if doesn't exist
    if(queue[id] == undefined){
      queue[id] = { "vc": null, "tc": null, "songs": [], "playing": false, "tracking": (id in serverdata) }
    }
    queue[id].vc = message.guild.voice;
    queue[id].tc = message.channel;
    return true;
  }
  else{
    message.channel.send(message.author.toString() + " you need to be in a voice channel to use this command!");
    return false;
  }
}

const leaveVoiceChannel = async (message) => {
  // delete queue and leave voice chat
  const id = message.guild.id;
  if(queue[id]) delete queue[id];

  if(message.guild.voice){
    await message.guild.voice.channel.leave();
  }
}

const queueAdd = async (message, content, prefixLength) => {
  const id = message.guild.id;
  const result = await queueCheck(message, true);
  if(!result) return false;

  // check if message has url
  if(validURL.isUri(content[0])){
    // search and add with url
    const info = await yts({ videoId: ytdl.getURLVideoID(content[0]) });
    for(song of queue[id].songs){
      if(song.url == info.url){
        queue[id].tc.send(":x:  Song is already in queue!");
        return false;
      }
    }
    queue[id].songs.push({ "title": info.title, "url": content[0], "requester": message.member, "duration": info.duration.timestamp });
  }
  else{
    // serach and add with query
    const query = await yts(message.content.slice(prefixLength));
    for(song of queue[id].songs){
      if(song.url == query.videos[0].url){
        queue[id].tc.send(":x:  Song is already in queue!");
        return false;
      }
    }
    queue[id].songs.push({ "title": query.videos[0].title, "url": query.videos[0].url, "requester": message.member, "duration": query.videos[0].duration.timestamp });
  }
  return true;
}

const queuePlay = async (message) => {
  const id = message.guild.id;
  const result = await queueCheck(message);
  if(!result) return;

  // play first song form queue
  if(queue[id].songs.length != 0){
    queue[id].playing = true;

    let msg = "**:notes:  Now Playing:** " + queue[id].songs[0].title + "\nRequested by: " + 
    queue[id].songs[0].requester.displayName + "    Duration: [" + queue[id].songs[0].duration + "]";

    if(queue[id].tracking){ 
      const songid = ytdl.getURLVideoID(queue[id].songs[0].url);
      if(!(songid in serverdata[id])){
        serverdata[id][songid] = { "title": queue[id].songs[0].title, "count": 1, "votes": {}, "score": 0 };
      }
      else{
        serverdata[id][songid].count += 1;
      }
      msg = msg + "\nTotal play count: **" + serverdata[id][songid].count + "**   Voting score: **" +
      (serverdata[id][songid].score) + "**";
    }

    queue[id].tc.send(msg);

    queue[id].vc.connection.play(ytdl(queue[id].songs[0].url, { filter: 'audioonly', quality: 'highestaudio'}))
    .on("finish", () => {
      // after song finishes play next one form queue
      queue[id].songs.shift();
      queuePlay(message);
    });
  }
  else{
    queue[id].playing = false;
    // this is for skipping because skip forces new play but doesn't end current stream
    // and with empty queue there is no new stream to override old one
    if( queue[id].vc.connection.dispatcher){
      queue[id].vc.connection.dispatcher.destroy();
    }
  }
}

const queueList = async (message, length = 10) => {
  const id = message.guild.id;
  const result = await queueCheck(message);
  if(!result) return;

  if(isNaN(length)){
    noCommand(message, 2);
    return;
  }
  
  // if songs in queue (index 0 is currently playing song so it is not considered to be in queue)
  if(queue[id].songs.length <= 1){
    queue[id].tc.send(":page_with_curl: **No songs in queue**");
    return;
  }

  const size = queue[id].songs.length;
  if(length < 0) length = 0;

  // construct message
  let msg = ":page_with_curl:  **Songs in queue:**\n";
  for(let iter = 1; iter < Math.min(size, length+1); iter += 1){
    msg += iter.toString() + ". " + queue[id].songs[iter].title + "\n";
  }
  if(length < size){
    msg += "*and " + (size-length-1).toString() + " more...*";
  }

  queue[id].tc.send(msg);
}

const queueSkip = async (message, count = 1) => {
  const id = message.guild.id;
  const result = await queueCheck(message);
  if(!result) return;

  if(isNaN(count)){
    noCommand(message, 2);
    return;
  }

  if(queue[id].songs.length == 0){
    queue[id].tc.send(":x:  No song to skip");
  }

  if(count > 1){
    queue[id].tc.send(":fast_forward:  Skipped " + Math.min(count, queue[id].songs.length) + " songs from queue");
    queue[id].songs.splice(0, Math.min(count, queue[id].songs.length));
  }
  else if(count == 1){
    queue[id].tc.send(":fast_forward:  Skipped: " + queue[id].songs[0].title);
    queue[id].songs.shift();
  }
  else{
    queue[id].tc.send(":x:  Can't skip " + count + " songs");
    return;
  }
  queuePlay(message);
}

const queueRemove = async (message, pos, count = 1) => {
  const id = message.guild.id;
  const result = await queueCheck(message);
  if(!result) return;

  if(isNaN(pos) || isNaN(count)){
    noCommand(message, 3);
    return;
  }
  
  if(pos >= queue[id].songs.length || pos < 1){
    queue[id].tc.send(":x:  No such positon in queue");
    return;
  }
  
  if(count > 1){
    queue[id].tc.send(":negative_squared_cross_mark:  Removed " + Math.min(count, queue[id].songs.length - pos) + " songs from queue");
    queue[id].songs.splice(pos, Math.min(count, queue[id].songs.length - pos));
  }
  else if(count == 1){
    queue[id].tc.send(":negative_squared_cross_mark:  Removed: " + queue[id].songs[pos].title);
    queue[id].songs.splice(pos, 1);
  }
  else{
    queue[id].tc.send(":x:  Can't remove " + count + " songs");
  }
}

client.login(authdata.login);
