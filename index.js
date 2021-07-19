'use strict';

const { Client } = require('discord.js');
const client = new Client();

const fs = require("fs");
const { getURLVideoID } = require('ytdl-core');
const MessageProvider = require('./src/MessageProvider.js');
const Utils =  require('./src/Utils.js');

const { token: TOKEN } = require('./data/authdata.json');
const { outOfScope } = require('./src/MessageProvider.js');
const PREFIX = MessageProvider.prefix;
const DATA_PATH = "./data/serverdata.json";

let queue = new Utils.Queue();
let serverdata = {};

client.on('ready', () => {
	console.log(`${client.user.username} successfully logged in`);

	// check if serverdata file exists
	fs.access(DATA_PATH, fs.constants.F_OK, async (err) => {
		if(err) {
			// create it if not
			console.log('No serverdata file found, creating new one');
			await writeserverdata();
		}
		// save data from the file to variable
		readserverdata();
	});
	
	// sync variable with file every 5 minutes
	const FIVE_MINUTES = 1000*60*5;
	setInterval(writeserverdata, FIVE_MINUTES);
});

// save data to json file
const writeserverdata = async () => {
	fs.writeFile(DATA_PATH, JSON.stringify(serverdata, null ,2), (err) => {
	  if(err) console.log("couldn't save serverdata. Error:\n" + err);
	});
  }

// read data from json file
const readserverdata = async () => {
	fs.readFile(DATA_PATH, (err, data) => {
	  if(err){
		console.log("couldn't read serverdata");
		throw err;
	  }
	  serverdata = JSON.parse(data);
	});
}

// guild message listener
client.on('message', async (message) => {
	
	// Return if message was sent by a bot or if doesn't start with a prefix.
	if(message.author.bot) return;
	if(!message.content.startsWith(PREFIX)) return;

	// slice prefix, divide message into words
	let content = message.content.trim().split(' ');
	let action = content[0].slice(PREFIX.length).toLowerCase();
	content = content.slice(1);

	const ID = message.guild.id;
	const ACTION_LENGTH = PREFIX.length + action.length + 1;

	switch(action){

		case 'help': case 'h': {
			message.channel.send(MessageProvider.help());
			break;
		}

		case 'tracking': case 't': {
			const TRACKING = ID in serverdata;
			let serverQueue = queue.get(ID);

			if(content[0] == undefined){
				if(TRACKING) message.channel.send(MessageProvider.trackingEnabled());
				else message.channel.send(MessageProvider.trackingDisabled());
				return;
			}

			if(content[0] == "enable" || content[0] == "1"){
				if(TRACKING){
					message.channel.send(MessageProvider.trackingAlreadySet(true));
					return;
				}
				serverdata[ID] = {};
				if(serverQueue != null){
					serverQueue.tracking = true;
					if(serverQueue.length() > 0){
						Utils.addSongToData(ID, serverQueue.front(), serverdata);
					}
				}
				message.channel.send(MessageProvider.trackingToggled(true));
				return;
			}
			else if(content[0] == "disable" || content[0] == "0"){
				if(!TRACKING){
					message.channel.send(MessageProvider.trackingAlreadySet(false));
					return;
				}

				delete serverdata[ID];
				if(serverQueue != null) serverQueue.tracking = false;
				message.channel.send(MessageProvider.trackingToggled(false));
				return;
			}
			message.channel.send(MessageProvider.noCommand(message, 2));
			break;
		}

		case 'vote': case 'v': {
			if(!await checkVoice(ID, message)) return;
			let serverQueue = queue.get(ID);

			if(!serverQueue.tracking){
				message.channel.send(MessageProvider.trackingRequired());
				return
			}

			if(serverQueue.length() == 0 || !serverQueue.playing) {
				message.channel.send(MessageProvider.notPlaying());
				return;
			}

			let songId = getURLVideoID(serverQueue.front().url);
			let userId = message.author.id;
			let oldVote = serverdata[ID][songId].votes[userId];
			let newVote = parseInt(content[0]);
			let voteEnum = { yes: 1, no: -1, remove: 0 };

			if(content[0] === undefined){
				// show vote
				if(oldVote === undefined) message.channel.send(MessageProvider.noVote());
				else message.channel.send(MessageProvider.vote(oldVote));
				return;
			}

			if(isNaN(newVote)) newVote = voteEnum[content[0].toLowerCase()];
			if(newVote === undefined){
				message.channel.send(MessageProvider.noCommand(message, 2));
				return;
			}
			if(newVote > 1 || newVote < -1){
				message.channel.send(MessageProvider.outOfScope("vote"));
				return;
			}

			message.channel.send(await setVote(oldVote, newVote, ID, songId, userId));
			break;
		}

		case 'search': case 'sr': {
			if(content[0] === undefined) {
				message.channel.send(MessageProvider.noQuery());
				return;
			}
			const result = await (Utils.searchList(message.content.slice(ACTION_LENGTH), message.member));
			if(result == null) {
				message.channel.send(MessageProvider.noSong());
				return;
			}
			message.channel.send(":mag:  **Results:**\n" + result);
			break;
		}
		
		case 'search-play': case 'sp': {
			if(content[0] == undefined || isNaN(parseInt(content[0]))){
				message.channel.send(MessageProvider.noCommand(message, 1));
				return;
			}
			if(content[1] == undefined){
				message.channel.send(MessageProvider.noQuery());
				return;
			}
			play(ID, message, message.content.slice(ACTION_LENGTH + content[0].length + 1), content[0]);
			break;
		}

		case 'play': case 'p': {
			play(ID, message, message.content.slice(ACTION_LENGTH));
			break;
		}
		
		case 'skip': case 's': {
			if(!await checkVoice(ID, message)) return;

			let serverQueue = queue.get(ID);
			let count = parseInt(content[0]);
			let length = serverQueue.length();

			// input checking
			if(content[0] === undefined) {
				count = 1;
			}
			if(isNaN(count)) {
				message.channel.send(MessageProvider.noCommand(message, 2));
				return;
			}
			if(count > length || count < 1){
				message.channel.send(MessageProvider.outOfScope("skip"));
				return;
			}
			message.channel.send(MessageProvider.skipped(count, serverQueue.front()));
			serverQueue.remove(0, count);
			Utils.play(serverQueue, serverdata);
			break;
		}

		case 'queue': case 'q': {
			if(!await checkVoice(ID, message)) return;
			let serverQueue = queue.get(ID);

			let count = parseInt(content[0]);
			if(isNaN(count)) count = 10;
			// clamp 
			count = Math.min(Math.max(count, 0), serverQueue.length());

			if(serverQueue.toString().length > 0){
				message.channel.send(MessageProvider.queue(serverQueue, count));
			}
			else{
				message.channel.send(MessageProvider.emptyQueue());
			}
			break;
		}
		
		case 'remove': case 'r': {
			if(!await checkVoice(ID, message)) return;

			let serverQueue = queue.get(ID);
			let position = parseInt(content[0]);
			let count = parseInt(content[1]);
			let length = serverQueue.length();

			// input checking
			if(isNaN(position)){
				message.channel.send(MessageProvider.noCommand(message, 2));
				return;
			}
			if(content[1] === undefined) count = 1;
			if(isNaN(count)){
				message.channel.send(MessageProvider.noCommand(message, 3));
				return;
			}
			if(position > length || position + count > length || position < 1 || count < 1){
				message.channel.send(MessageProvider.outOfScope("remove"));
				return;
			}
			let songs = serverQueue.remove(position, count);
			message.channel.send(MessageProvider.removed(songs[0], count));
			break;
		}

		case 'leave': case 'l': {
			let botVoice = (await client.guilds.fetch(ID, 0, 1)).voice;
			let userVoice = message.member.voice;

			if(botVoice === undefined || botVoice.channelID === null) {
				message.channel.send(MessageProvider.noVoiceChannel());
				return;
			}

			if(userVoice === undefined || userVoice.channelID === null || botVoice.channelID != userVoice.channelID) {
				if(botVoice.channel.members.size > 1){
					message.channel.send(MessageProvider.busy(message.member, botVoice.channel));
					return;
				}
			}

			botVoice.channel.leave();
			let serverQueue = queue.get(ID);
			queue.remove(serverQueue);
			break;
		}

		case 'join': case 'j': {
			let userVoice = message.member.voice;
			let botVoice = (await client.guilds.fetch(ID, 0, 1)).voice;

			if(userVoice === undefined || userVoice.channelID === null) {
				message.channel.send(MessageProvider.joinChannel(message.author));
				return;
			}

			if(!(botVoice === undefined || botVoice.channelID === null)) {
				if(botVoice.channelID != userVoice.channelID && botVoice.channel.members.size > 1){
					message.channel.send(MessageProvider.busy(message.member, botVoice.channel));
					return;
				}
			}

			if(queue.get(ID) === null){
				queue.add(ID, new Utils.ServerQueue(ID, userVoice, message.channel, (ID in serverdata)));
			}
			
			queue.get(ID).voice = (await userVoice.channel.join()).voice;
			queue.get(ID).channel = message.channel;
			message.channel.send(MessageProvider.channelSet(message.channel))
			break;
		}
		/* does not work because dispatcher.resume is buggy 
		case "pause": {
			if(!await checkVoice(ID, message)) return;
			let serverQueue = queue.get(ID);
			if(serverQueue.length() > 0){
				Utils.pause(serverQueue);
			}
			break;
		}
		*/

		default: {
			message.channel.send(MessageProvider.noCommand(message, 1));
			break;
		}
	}
});

const checkVoice = async (ID, message) => {
	// Client's and user's VoiceStates.
	let botVoice = await client.guilds.fetch(ID, 0, 1).voice;
	let userVoice = message.member.voice;
	
	// Check if user is in Voice Channel.
	if(userVoice === undefined || userVoice.channelID === null) {
		message.channel.send(MessageProvider.joinChannel(message.author));
		return false;
	}
	
	// Check if Client is in Voice Channel.
	if(botVoice === undefined || botVoice.channelID === null) {
		// If not then join user's Voice Channel
		botVoice = (await userVoice.channel.join()).voice;
	}

	// Send a message if Client's and user's Voice Channels are different and return.
	if(botVoice.channelID != userVoice.channelID) {
		message.channel.send(MessageProvider.joinBotChannel(message.author, botVoice.channel));
		return false;
	}
	
	// Create ServerQueue if doesn't exist.
	if(queue.get(ID) === null) {
		queue.add(ID, new Utils.ServerQueue(ID, botVoice, message.channel, (ID in serverdata)));
	}

	return true;
}

const setVote = async (oldVote, newVote, id, songId, userId) => {

	if(oldVote === undefined) {
		if(newVote == 0) {
			// no vote to remove
			return MessageProvider.cantRemoveVote();
		}
		else {
			// set vote
			serverdata[id][songId].score += newVote;
			serverdata[id][songId].votes[userId] = newVote;
			return MessageProvider.voteSet(newVote, serverdata[id][songId].score);
		}
	}
	else{
		if(newVote == 0) {
			// remove vote
			serverdata[id][songId].score -= oldVote;
			delete serverdata[id][songId].votes[userId];
			return MessageProvider.voteRemoved(serverdata[id][songId].score);
		}
		else if(newVote == oldVote) {
			// already voted
			return MessageProvider.alreadyVoted(newVote);
		}
		else {
			// vote changed
			serverdata[id][songId].score +=  newVote - oldVote;
			serverdata[id][songId].votes[userId] = newVote;
			return MessageProvider.voteChanged(newVote, serverdata[id][songId].score);
		}
	}
}

const play = async (ID, message, query, index = 1) => {
	if(!await checkVoice(ID, message)) return;

	let serverQueue = queue.get(ID);

	if(query.length <= 0) {
		if(serverQueue.length() > 0 && serverQueue.playing){
			let song = serverQueue.front();
			let dataString = (serverQueue.tracking) ? MessageProvider.trackingData(ID, getURLVideoID(song.url), serverdata) : "";
			message.channel.send(MessageProvider.playing(song) + dataString);
		}
		else {
			message.channel.send(MessageProvider.notPlaying());
		}
		return;
	}

	let song = await Utils.search(query, message.member, index-1);
	
	if(song == null){
		message.channel.send(MessageProvider.noSong());
		return;
	}

	if(serverQueue.contains(song)){
		message.channel.send(MessageProvider.duplicate());
		return;
	}

	let position = serverQueue.push(song);

	if(position == 1) {
		serverQueue.playing = true;
		Utils.play(serverQueue, serverdata);
		return;
	}
	message.channel.send(MessageProvider.addedToQueue(song, position - 1));
}

client.login(TOKEN);
