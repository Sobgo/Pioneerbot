"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { getVideoId, isValidUrl } from "@/scrapper";

export const playlisterase = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const db = wrapper.databaseMenager;
	const playlistId = parseInt(args[0]);
	const link = args[2];

	if (link) {
		if (isValidUrl(link)) {
			const ytid = getVideoId(link);

			const song = await db.getSong(ytid);
			const playlist = await db.getPlaylist(playlistId);
			if (playlist == null || song == null) return;

			message.channel.send({ embeds: [wrapper.messageMenager.removedFromPlaylist(playlist, song)] });
			await db.removeFromPlaylist(playlistId, ytid);
		} else {
			message.channel.send({ embeds: [wrapper.messageMenager.invalidURL(link)] });
			return;
		}
	} else {
		const queue = await wrapper.checkQueue(guildId, message);
		if (!queue) return;

		const song = queue.current;
		const playlist = await db.getPlaylist(playlistId);
		if (playlist == null || song == null) return;

		message.channel.send({ embeds: [wrapper.messageMenager.removedFromPlaylist(playlist, song)] });

		const ytid = getVideoId(song.url);
		await db.removeFromPlaylist(playlistId, ytid);
	}
}
