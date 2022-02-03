'use strict'
import { Song, Wrapper } from "../structures";
import { validateURL } from 'ytdl-core';
import { Message } from "discord.js";
import ytsr, { Video } from 'ytsr';
import { messageProvider } from "../messageProvider";

export const aliases = ["sr"];

export const search = async (ID: string, queues: Wrapper, message: Message, args: string[], limit: number = 10) => {

	const query = args.map((element) => { return element }).join(' ');
	const result = await searchList(message, query, limit);
	if (result && result.length > 0) {
		message.channel.send({ embeds: [messageProvider.search(result)] });
		const QUEUE = queues.get(ID);
		if (QUEUE) QUEUE.cache = result;
	}
	else {
		message.channel.send("No result for this query");
	}
}

export const searchList = async (message: Message, query: string, limit: number = 1, position: number = 0): Promise<Song[] | null> => {

	if (query.length < 1) return null;
	let list: Song[] = [];

	if (validateURL(query)) { // direct link
		list.push(await Song.build(query, message.member));
	}
	else { // query
		const filter = (await ytsr.getFilters(query)).get("Type")?.get("Video");
		if (filter == undefined || filter.url == null) return null;

		const result = (await ytsr(filter.url, {limit: limit})).items;
		const videos = result.filter((o): o is Video => o.type === "video");
		if(videos.length < 1) return null;

		for (const element of videos) {
			list.push((await Song.build(element.url, message.member)));
		}
	}

	return list.slice(position);
}
