'use strict';
import { Queue, Song, Wrapper } from "./structures";
import fetch from "node-fetch";
import * as cheerio from 'cheerio';
import { isText } from 'domhandler';
import { Message } from "discord.js";
import { createConnection } from "./commands/join";
import { messageProvider } from "./messageProvider";

export const getVideoID = (url: string) => {
	const validURLregex = /^https?:\/\/(youtu\.be\/|(www\.)?youtube\.com\/(embed|v|shorts)\/)/;
	const validIDRegex = /^[a-zA-Z0-9-_]{11}$/;

	const parsed = new URL(url);

	if (!validURLregex.test(url)) {
		throw Error('Invalid YouTube URL');
	}

	// url like: 
	// https://www.youtube.com/watch?v=[VideoId]
	// https://m.youtube.com/watch?v=[VideoId]
	// https://music.youtube.com/watch?v=[VideoId]
	// https://gaming.youtube.com/watch?v=[VideoId]
	let id = parsed.searchParams.get('v');

	if (!id) {
		const path = parsed.pathname.split('/');
		// url like: 
		// https://youtu.be/[VideoId]
		if (parsed.hostname === 'youtu.be') id = path[1];
		// url like: 
		// https://www.youtube.com/v/[VideoId]
		// https://www.youtube.com/embed/[VideoId]
		// https://www.youtube.com/shorts/[VideoId]
		else id = path[2];
	}

	if (!validIDRegex.test(id)) {
		throw Error('Invalid YouTube URL');
	}

	return id;
}

export const validateURL = (toValidate: string) => {
	try {
		getVideoID(toValidate);
		return true;
	}
	catch {
		return false;
	}
}

export const checkQueue = async (ID: string, queues: Wrapper, message: Message, toJoin: boolean = false): Promise<Queue | null> => {
	let queue = queues.get(ID);
	let memberVoice = message.member?.voice;

	if (queue == null && toJoin) {
		queue = await createConnection(ID, queues, message);
	}

	if (!queue?.voiceChannelId) {
		message.channel.send({embeds: [messageProvider.noBotChannel()]});
		return null;
	}

	if (memberVoice == undefined || memberVoice.channelId == null || memberVoice.channelId != queue?.voiceChannelId) {
		message.channel.send({embeds: [messageProvider.noChannel(queue?.voiceChannelName)]});
		return null;
	}
	return queue;
}

export const secToTimestamp = (sec: string | number) => {

	if (sec === "LIVE") return sec;

	if (typeof sec === "string") sec = parseInt(sec);
	if (isNaN(sec)) return "0:00";

	const hours = Math.floor(sec / 3600);
	const minutes = Math.floor((sec - (hours * 3600)) / 60);
	const seconds = sec - (hours * 3600) - (minutes * 60);

	let timestamp = "";
	if (hours > 0) timestamp += `${hours}:`;
	timestamp += `${hours > 0 ? minutes < 10 ? `0${minutes}` : minutes : minutes}:`;
	timestamp += seconds < 10 ? `0${seconds}` : seconds;
	return timestamp;
}

export const timestampToSec = (timestamp: string) => {
	
	if (timestamp == "LIVE") return timestamp;

	const parts = timestamp.split(':').reverse();
	let sec = 0;

	for (let i = 0; i < parts.length; i++) {
		sec += parseInt(parts[i]) * Math.pow(60, i);
	}

	return sec;
}

export const songsToList = (list: Song[], startPos: number = 1) => {
	return list.map((element, index) => {
		return `${index + startPos}. ${element.title} | [${secToTimestamp(element.duration)}]` 
	}).join('\n');
}

// makeshift search function (but decently fast)
export const ytsr = async (query: string) => {

	let extracted: Song[] = [];

	if (validateURL(query)) {
		// send GET request to youtube search page
		const url = "https://www.youtube.com/watch?v=" + getVideoID(query);
		const response = await fetch(url);
		const data = await response.text();
		const $ = cheerio.load(data);

		// get all script tags and search for the one that contains vidoe info
		const allscripts = $('script');
		let song = new Song('', undefined, '', '', '');
		let fallback = "";

		for (const script of allscripts) {
			// get title and duration
			if (script.children[0] && isText(script.children[0]) && script.children[0].data.startsWith("var ytInitialPlayerResponse")) {
				const info = JSON.parse(script.children[0].data.slice("var ytInitialPlayerResponse = ".length).slice(0, -1));
				song.url = url;
				song.title = info["videoDetails"]["title"];
				song.duration = info["videoDetails"]["lengthSeconds"];
				fallback = info["videoDetails"]["ownerChannelName"];
				if (song.author != '') break;
			}
			// get author (because [videoDetails][ownerChannelName] doesn't always match up)
			else if (script.children[0] && isText(script.children[0]) && script.children[0].data.startsWith("var ytInitialData")) {
				const info = JSON.parse(script.children[0].data.slice("var ytInitialData = ".length).slice(0, -1));
				try {
					song.author = info["contents"]["twoColumnWatchNextResults"]["results"]["results"]["contents"][1]["videoSecondaryInfoRenderer"]["owner"]["videoOwnerRenderer"]["title"]["runs"][0]["text"];
				}
				catch (e) {
					// shouldn't happen but since the path is so long it's quite prone to unexpected changes
					console.warn(e);
					song.author = fallback;
				}
				if (song.url != '') break;
			}
		}
		extracted.push(song);
	}
	else {
		// send GET request to youtube search page
		const url = "https://www.youtube.com/results?gl=US&hl=en&search_query=" + encodeURIComponent(query);
		const response = await fetch(url);
		const data = await response.text();
		const $ = cheerio.load(data);

		// get all script tags and search for the one that contains the videos
		const allscripts = $('script');
		for (const script of allscripts) {
			if (script.children[0] && isText(script.children[0]) && script.children[0].data.startsWith("var ytInitialData")) {
				
				const info = JSON.parse(script.children[0].data.slice("var ytInitialData = ".length).slice(0, -1));
				const videos: any[] = info["contents"]["twoColumnSearchResultsRenderer"]["primaryContents"]["sectionListRenderer"]["contents"][0]["itemSectionRenderer"]["contents"];

				videos.forEach(element => {
					if (element["videoRenderer"]) {
						extracted.push( new Song(
							"https://www.youtube.com/watch?v=" + element["videoRenderer"]["videoId"],
							undefined,
							element["videoRenderer"]["title"]["runs"][0]["text"],
							element["videoRenderer"]["longBylineText"]["runs"][0]["text"],
							timestampToSec(element["videoRenderer"]["lengthText"] ? element["videoRenderer"]["lengthText"]["simpleText"] : "LIVE").toString()
						));
					}
				});
				break;
			}
		}
	}
	return extracted;
}
