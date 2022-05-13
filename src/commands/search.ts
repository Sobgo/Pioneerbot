'use strict'
import { Message } from "discord.js";
import { Song, Wrapper } from "../structures";
import { messageProvider } from "../messageProvider";
import { ytsr, validateURL } from "../utils";
import config from '../../config.json';

export const aliases = ["sr"];

export const description = `Search for a song with a given \`<query>\`, returns list of songs, to play one of them use \`${config.prefix}searchplay <position>\`.`;
export const usage = "<query>";

export const search = async (ID: string, queues: Wrapper, message: Message, args: string[], limit: number = 10) => {

	const query = args.map((element) => { return element }).join(' ');
	const result = await searchList(message, query, limit);
	if (result && result.length > 0) {
		message.channel.send({embeds: [messageProvider.search(result)]});
		const QUEUE = queues.get(ID);
		if (QUEUE) QUEUE.cache = result;
	}
	else {
		message.channel.send({ embeds: [messageProvider.noResult()] });
	}
}

export const searchList = async (message: Message, query: string, limit: number = 1, position: number = 0): Promise<Song[] | null> => {
	
	if (query.length < 1) {
		message.channel.send({embeds: [messageProvider.invalidArguments("search", aliases, usage)]});
		return null;
	}

	let list: Song[] = [];

	if (validateURL(query)) { // direct link
		let song = await Song.build(query, message.member);
		if (song) list.push(song);
	}
	else { // query
		const videos = (await ytsr(query)).slice(position, limit);
		for (const element of videos) {
			list.push(new Song(element.url, message.member?.toString(), element.title, element.author, element.duration));
		}
	}

	return list;
}
