import { Song } from "../structures";
import { validateURL } from 'ytdl-core';
import { Message } from "discord.js";
import ytsr, { Video } from 'ytsr';
import { secToTimestamp } from "../utils";

export const search = async (message: Message, args: string[], content: string, limit: number = 1): Promise<Song[] | null> => {

	if (args.length < 1) return null;

	let list: Song[] = [];

	if (validateURL(args[0])) { // direct link
		list.push(await Song.build(args[0], message.member));
	}
	else { // query
		const filter = (await ytsr.getFilters(content)).get("Type")?.get("Video");
		if (filter == undefined || filter.url == null) return null;

		const result = (await ytsr(filter.url, {limit: limit})).items;
		const videos = result.filter((o): o is Video => o.type === "video");
		if(videos.length < 1) return null;

		for (const element of videos) {
			list.push((await Song.build(element.url, message.member)));
		}
	}
	return list;
}
