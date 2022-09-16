'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";
import { getVideoId, validateURL } from "../utils";

export const playlisterase = async (ID: string, wrapper: Wrapper, message: Message, args:string[]) => {
	const db = wrapper.databaseMenager;
	const playlistId = parseInt(args[0]);
	const link = args[2];

	if (link) {
		if (validateURL(link)) {
			const ytid = getVideoId(link);

			// embed
			const song = await db.getSong(ytid);
			const playlist = await db.getPlaylist(playlistId);
			if (playlist == null || song == null) return;
			message.channel.send({ embeds: [wrapper.messageMenager.removedFromPlaylist(playlist, song)] });

			await db.removeFromPlaylist(playlistId, ytid);
			
		}
		else {
			message.channel.send({ embeds: [wrapper.messageMenager.invalidURL(link)] });
			return;
		}
	}
	else {
		const queue = await wrapper.checkQueue(ID, message);
		if (!queue) return;
		
		const song = queue.get(0);
		const playlist = await db.getPlaylist(playlistId);
		if (playlist == null || song == null) return;
		message.channel.send({ embeds: [wrapper.messageMenager.removedFromPlaylist(playlist, song)] });
		
		const ytid = getVideoId(song.url);
		await db.removeFromPlaylist(playlistId, ytid);
	}
}
