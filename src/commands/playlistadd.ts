'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";
import { searchMany, validateURL } from "../utils";

export const playlistadd = async (ID: string, wrapper: Wrapper, message: Message, args:string[]) => {
	const db = wrapper.databaseMenager;
	const playlistId = parseInt(args[0]);
	const link = args[2];
	const playlist = await db.getPlaylist(playlistId, ID);
	if (playlist == null) return;

	if (link) {
		if (validateURL(link)) {
			const song = await searchMany(message, link);
			if (!song) return;
			await db.addToPlaylist(playlistId, song[0]);
			message.channel.send({ embeds: [wrapper.messageMenager.addedToPlaylist(playlist, song[0])] });
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
		if (!song) return;
		await db.addToPlaylist(playlistId, song);
		message.channel.send({ embeds: [wrapper.messageMenager.addedToPlaylist(playlist, song)] });
	}
}
