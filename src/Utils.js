'use strict';

const { VoiceState, TextChannel, GuildMember } = require('discord.js');
const { getURLVideoID, validateURL } = require('ytdl-core');
const { playing, trackingData } = require('./MessageProvider.js');
const ytdl = require('ytdl-core');
const yts = require('yt-search');
const fs = require("fs");

/**
 * @class
 * Represents an element in the ServerQueue.
 * Contains informations used to play the song
 * and to display informations about it.
 */
class Song {
	/**
	 * @constructor
	 * @param {String} title - Title of a song
	 * @param {String} url - Youtube URL
	 * @param {String} duration - Duration of a song already formated i.e. [3:41]
	 * @param {String} user - DispalyName of a discord user who requested a song
	 */
	constructor(title, url, duration, user) {
		this.title = title;
		this.url = url;
		this.duration = duration;
		this.user = user;
	}

	/**
	 * Returns a string representation of a Song.
	 * @returns A string representation of a Song.
	 * @example console.log(Song.toString()) 
	 * // Logs: Song Title [duration]
	 */
	toString(){
		return `${this.title} | [${this.duration}]`;
	}
}

/**
 * @class
 * Represents a song's queue for each guild and its stored in main Queue object
 */
class ServerQueue {
	/**
	 * @constructor
	 * @param {String} id - discord Guild ID
	 * @param {VoiceState} voice - Client's VoiceState
	 * @param {TextChannel} channel - The channel that messages will be sent to 
	 * @param {Boolean} [tracking] - Whether tracking is enabled for this Guild
	 * @param {Boolean} [playing] - Whether song is currently playing
	 * @param {Boolean} [loop] - Whether to play song in loop
	 */
	constructor(id, voice, channel, tracking = false, playing = false, loop = false) {
		this.id = id;
		this.voice = voice;
		this.channel = channel;
		this.songs = [];
		this.playing = playing;
		this.tracking = tracking;
		this.loop = loop;
	}

	/**
	 * Returns first element form a ServerQueue. If ServerQueue is empty, null is returned.
	 * @returns First element form a ServerQueue or null.
	 */
	front() {
		if(this.songs.length > 0) return this.songs[0];
		else return null;
	}

	/**
	 * Returns a number of elements in ServerQueue.
	 * @returns A number of elements in ServerQueue.
	 */
	length() {
		return this.songs.length;
	}

	/**
	 * Removes first element form a ServerQueue and returns it.
	 * If ServerQueue is empty, undefined is returned and ServerQueue is not modified.
	 * @returns First element form a ServerQueue.
	 */
	pop() {
		return this.songs.shift();
	}

	/**
	* Appends new elements to the end of a ServerQueue and returns the new length of the ServerQueue.
	* @param {...Song} items - New elements to add to the ServerQueue.
	* @returns New length of the ServerQueue.
	*/
	push(...items){
		return this.songs.push(...items);
	}

	/**
	 * Adds new elements to a ServerQueue from specified position inclusive and returns new lenght of the ServerQueue.
	 * @param {Number} start 
	 * @param  {...Song} items 
	 * @returns New length of the ServerQueue.
	 */
	add(start, ...items){
		this.songs.splice(start, 0, ...items);
		return this.songs.length;
	}

	/**
	 * Removes elements form ServerQueue and returns an array containing the elements that were removed.
	 * @param {Number} start - Position in a ServerQueue form which to start removing elements.
	 * @param {Number} count - The number of elements to remove.
	 * @returns An array containing the elements that were removed.
	 */
	remove(start, count = 1){
		return this.songs.splice(start, count);
	}

	/**
	 * Determines whether a ServerQueue contains certain element returning true or false as appropriate.
	 * @param {Song} searchElement 
	 * @returns true or false depending on whether ServerQueue contains searchElement
	 */
	contains(searchElement){
		const id = getURLVideoID(searchElement.url);
		return this.songs.some((element) => { return (getURLVideoID(element.url) == id) });
	}

	/**
	 * Returns a string representation of a ServerQueue.
	 * Note: first element is not returned since it represents currently playing song.
	 * @param {Number} [count] - Number of songs to list. Default is 10.
	 * @returns A string representation of a ServerQueue.
	 * @example console.log(ServerQueue.toString()) // Logs:
	 * // 1. The title of the first song [duration]
	 * // 2. The title of the second song [duration]
	 * // ...
	 */
	toString(count = 10){
		return this.songs.slice(1, count+1).map((element, index) => {
			return `${index + 1}. ${element.toString()}` 
		}).join('\n');
	}
}

/**
 * @class
 * Represents main Queue object in which ServerQueues are stored.
 */
class Queue {

	/**
	 * Adds new element to Queue as key value pair where key is guild id and value is ServerQueue.
	 * @param {String} id - Id of a guild.
	 * @param {ServerQueue} element - ServerQueue.
	 */
	add(id, element){
		this[id] = element;
	}

	/**
	 * Removes element from Queue. If no element is found false is returned.
	 * @param {String} id - Id of a guild.
	 * @returns Boolian informing if element was removed or not.
	 */
	remove(id){
		if(!(id in this)) return false;
		delete this[id];
		return true;
	}

	/**
	 * Returns element with specified id. If no element is found null is returned.
	 * @param {Stirng} id - Id of a guild.
	 * @returns Element with specified id or null.
	 */
	get(id){
		if(!(id in this)) return null;
		return this[id];
	}
}

/**
 * Plays first song form queue on voice channel using ytdl and Discord.play.
 * @param {ServerQueue} queue - Guild's ServerQueue.
 * @param {Object} [data] - Additional data to display in announcement used only when tracking is enabled.
 */
const play = async (queue, data = null) => {
	let song = queue.front();

	if(song == null) {
		// utility for skipping last song
		if(queue.voice.connection.dispatcher != null) queue.voice.connection.dispatcher.destroy();
		queue.playing = false;
		return;
	}

	queue.playing = true;

	// message
	if(queue.tracking) addSongToData(queue.id, song, data);
	let dataString = (queue.tracking) ? trackingData(queue.id, getURLVideoID(song.url), data) : ""
	queue.channel.send(playing(song) + dataString);

	// play and set listener to start new song after finish
	queue.voice.connection.play(ytdl(song.url, { filter: 'audioonly', quality: 'highestaudio' }))
	.on('finish', () => {
		if(!queue.loop) { 
			queue.pop();
		}
		play(queue, data);
	});
}

// does not work because resume is buggy 
// TO DO: fix with @discord/voice
const pause = async (queue) => {
	console.log(queue.playing);
	if(queue.playing) queue.voice.connection.dispatcher.pause();
	else queue.voice.connection.dispatcher.resume();
	queue.playing = !queue.playing;
}

/**
 * Searches video on youtube with url or query.
 * @param {String} query - Query which will be used to search a song.
 * @param {GuildMember} user - Guild member that wants to search a song.
 * @param {Number} [position] - Which search result to use. Default 0 (first).
 * @returns Song object or null if no result was found
 */
const search = async (query, user, position = 0) => {
	if(validateURL(query)) { // query is url
		// catch when query is invalid (or no result is found)
		try {
			const info = await yts({ videoId: getURLVideoID(query) })
			return new Song(info.title, info.url, info.duration.timestamp, user);
		}
		catch(err) { return null }
	}
	else {
		const info = await yts(query);
		const length = info.videos.length;
		if(length < 1 || position < 0|| position >= length) return null;
		return new Song(info.videos[position].title, info.videos[position].url, info.videos[position].duration.timestamp, user);		
	}
}

/**
 * Searches multiple results with query.
 * @param {String} query -  Query which will be used to search a song.
 * @param {GuildMember} user - Guild member that wants to search a song.
 * @param {Number} [count] - Number of results to show. Default 10.
 * @returns List of first [count] results as string.
 */
const searchList = async (query, user, count = 10) => {
	// if url then return 
	if(validateURL(query)) return (await search(query, user)).toString();

	const info = await yts(query);
	if(info.videos.length < 1) return null;

	return info.videos.slice(0, count).map((element, index) => {
		return `${index + 1}. ${element.title} | [${element.timestamp}]` 
	}).join('\n');
}

/**
 * Utility function that adds song to serverdata.
 * @param {String} id - Guild's ID.
 * @param {Song} song - Song to add to serverdata
 * @param {Object} data - Serverdata reference.
 */
const addSongToData = async (id, song, data) => {
	const songId = ytdl.getURLVideoID(song.url);
	if(!(songId in data[id])){
		data[id][songId] = { "title": song.title, "count": 1, "votes": {}, "score": 0 };
	}
	else{
		data[id][songId].count += 1;
	}
}

module.exports.Song = Song;
module.exports.ServerQueue = ServerQueue;
module.exports.Queue = Queue;
module.exports.play = play;
module.exports.pause = pause;
module.exports.search = search;
module.exports.searchList = searchList;
module.exports.addSongToData = addSongToData;
