"use strict"
import fetch from "node-fetch";
import * as cheerio from 'cheerio';
import { isText } from "domhandler";
import { GuildMember } from "discord.js";

import { Song } from "@/structures/Song";
import { getStyledUser, timestampToSec } from "@/utils";

/**
 * @property {number} limit - Maximum number of results to return
 * @property {string} position - Position of the first result to return
 * @property {string} user - Member who requested the search
 */
type SearchOptions = {
	limit?: number;
	position?: number;
	user?: GuildMember | string | null;
}

/**
 * YouTube scrpper
 * @param {string} query - YouTube URL to video or string to search for on YouTube
 * @param {SearchOptions} options - Search options:
 * - `limit: number` - Maximum number of results to return  
 * - `position: number` - Position of the first result to return  
 * - `user: GuildMember | string | null` - Member who requested the search  
 * @returns returns an array of Songs which can be empty if no results were found
 */
export const ytsr = async (query: string, options: SearchOptions = {}) => {
	try {
		if (isValidUrl(query)) {
			return await searchUrl(query, options);
		} else {
			return await searchQuery(query, options);
		}
	} catch (e) {
		console.log("Scrapper error: ", e);
		return [] as Song[];
	}
}

const validUrlRegex = /(?:https?:\/\/)?((?:www|m|music|gaming)?(?:\.))?youtu?(\.)?be?(\.com)?\/?.?(?:watch|embed|v|shorts)?(?:.*v=|v\/|\/)([a-zA-Z0-9-_]{11})$/;
const validIdRegex = /^[a-zA-Z0-9-_]{11}$/;
/**
 * Extracts video id from url.  
 * Will throw an error if url is invalid.
 */
export const getVideoId = (url: string) => {
	const parsed = new URL(url);

	if (!validUrlRegex.test(url)) {
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

	if (!validIdRegex.test(id)) {
		throw Error('Invalid YouTube URL');
	}

	return id;
}

/**
 * Returns true if the given string is a valid YouTube url.
 */
export const isValidUrl = (toValidate: string) => {
	try {
		getVideoId(toValidate);
		return true;
	} catch (e) {
		return false;
	}
}

/**
 * Returns an array containing the song with the given url.  
 * Can return an empty array if no result was found.  
 * And can throw an error if the url is invalid.
 */
const searchUrl = async (url: string, options: SearchOptions = {}) => {
	// normalize url
	const URL = "https://www.youtube.com/watch?v=" + getVideoId(url);

	// fetch video page
	const res = await fetch(URL);
	const html = await res.text();
	const $ = cheerio.load(html);

	// get all script tags and search for the one that contains video info
	const scripts = $('script').toArray();
	const varVideo = 'var ytInitialPlayerResponse = ';
	const varAuthor = 'var ytInitialData = ';

	// get the script tag that contains video info and parse it as JSON
	const videoDetails = JSON.parse((scripts.find(script => {
		return script.children[0] && isText(script.children[0]) && script.children[0].data.startsWith(varVideo);
	})?.children[0] as any).data.slice(varVideo.length, -1)).videoDetails;

	let videoAuthor = null;

	// get different script tag that contains video author info and parse it as JSON
	// this script tag is not always present but when it is the author name is more accurate
	try {
		const page = JSON.parse((scripts.find(script => {
			return script.children[0] && isText(script.children[0]) && script.children[0].data.startsWith(varAuthor);
		})?.children[0] as any).data.slice(varAuthor.length, -1));

		videoAuthor = page.contents.twoColumnWatchNextResults.results.results.contents[1].videoSecondaryInfoRenderer.owner.videoOwnerRenderer.title.runs[0].text;
	} catch (e) {
		console.log("Author not found for: " + videoDetails.title + " using fallback");
		console.log("Error: " + e);
	}

	if (!videoDetails) return [] as Song[];

	const username = options.user instanceof GuildMember
		? getStyledUser(options.user)
		: options.user;

	const song = new Song(
		URL,
		videoDetails.title,
		videoAuthor ? videoAuthor : videoDetails.author,
		videoDetails.lengthSeconds,
		username ? username : "unknown"
	);

	return [song];
}

/**
 * Returns an array containing the songs that match the given query.  
 * Can return an empty array if no results were found.  
 */
const searchQuery = async (query: string, options: SearchOptions = {}) => {
	// construct search url
	const URL = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

	// fetch results page
	const res = await fetch(URL);
	const html = await res.text();
	const $ = cheerio.load(html);

	// get all script tags and search for the one that contains videos info
	const scripts = $('script').toArray();
	const varName = 'var ytInitialData = ';

	// get the script tag that contains video info and parse it as JSON
	const page = JSON.parse((scripts.find(script => {
		return script.children[0] && isText(script.children[0]) && script.children[0].data.startsWith(varName);
	})?.children[0] as any).data.slice(varName.length, -1))
	const videoList = page.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents;

	const songs: Song[] = [];

	const username = options.user instanceof GuildMember
		? getStyledUser(options.user)
		: options.user;

	// for each result create a song object and add it to the array
	videoList.forEach((element: { videoRenderer: any; }) => {
		if (element.videoRenderer) {
			const videoDetails = element.videoRenderer;
			const timestamp = videoDetails.lengthText ? timestampToSec(videoDetails.lengthText.simpleText) : "LIVE"

			const song = new Song(
				"https://www.youtube.com/watch?v=" + videoDetails.videoId,
				videoDetails.title.runs[0].text,
				videoDetails.ownerText.runs[0].text,
				timestamp,
				username ? username : "unknown"
			);

			songs.push(song);
		}
	});

	options.position = options.position ? options.position : 0;
	options.limit = options.limit ? options.limit : 10;

	return songs.slice(options.position, options.position + options.limit);
}
