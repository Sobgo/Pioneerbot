"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { ytsr, isValidUrl } from "@/scrapper";

export const playlistadd = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const db = wrapper.databaseManager;
	const playlistId = parseInt(args[0]);
	const link = args[2];
	const playlist = await db.getPlaylist(playlistId, guildId);
	if (playlist == null) return;

	if (link) {
		if (isValidUrl(link)) {
			const song = await ytsr(link, { user: message.member });
			if (!song) return;
			
			await db.addToPlaylist(playlistId, song[0]);
			wrapper.messageManager.send("addedToPlaylist", message.channel, playlist, song[0]);
		} else {
			wrapper.messageManager.send("invalidURL", message.channel, link);
			return;
		}
	} else {
		const queue = await wrapper.checkQueue(guildId, message);
		if (!queue) return;
		const song = queue.current;
		if (!song) return;

		await db.addToPlaylist(playlistId, song);
		wrapper.messageManager.send("addedToPlaylist", message.channel, playlist, song);
	}
}
