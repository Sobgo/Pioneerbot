"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { ytsr, isValidUrl } from "@/scrapper";

export const playlistadd = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const db = wrapper.databaseMenager;
	const playlistId = parseInt(args[0]);
	const link = args[2];
	const playlist = await db.getPlaylist(playlistId, guildId);
	if (playlist == null) return;

	if (link) {
		if (isValidUrl(link)) {
			const song = await ytsr(link, { user: message.member });
			if (!song) return;
			
			await db.addToPlaylist(playlistId, song[0]);
			message.channel.send({ embeds: [wrapper.messageMenager.addedToPlaylist(playlist, song[0])] });
		} else {
			message.channel.send({ embeds: [wrapper.messageMenager.invalidURL(link)] });
			return;
		}
	} else {
		const queue = await wrapper.checkQueue(guildId, message);
		if (!queue) return;
		const song = queue.current;
		if (!song) return;

		await db.addToPlaylist(playlistId, song);
		message.channel.send({ embeds: [wrapper.messageMenager.addedToPlaylist(playlist, song)] });
	}
}
