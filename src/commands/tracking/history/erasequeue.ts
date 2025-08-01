"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";
import { getVideoId } from "@/scrapper";

export const settings: CommandSettings = {
	name: "Erase from queue",
	invokes: ["erasequeue", "eq"],
	description: "Removes song with specified queue position both from queue and guild history.",
	usage: "<position>",
	category: "tracking",
	list: true
}

export const erasequeue = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const db = wrapper.databaseManager;
	const queue = wrapper.get(guildId);

	if (await db.checkGuild(guildId)) {
		if (queue) {
			const position = parseInt(args[0]) - 1;

			if (isNaN(position)) {
				wrapper.messageManager.send("invalidArgument", message.channel, settings);
				return;
			}

			if (position < 0 || position >= queue.length) {
				wrapper.messageManager.send("outOfScope", message.channel);
				return;
			}

			const song = queue.at(position);

			const guild = await db.getGuild(guildId);
			const playlistId = guild?.default_playlist_id;
			if (!playlistId) return;

			if (song) {
				const ytid = getVideoId(song.url);
				db.removeFromPlaylist(playlistId, ytid);
				queue.remove(position);
				wrapper.messageManager.send("erased", message.channel, song);
			}
			else {
				wrapper.messageManager.send("noChannelBot", message.channel);
			}
		}
	}
	else {
		wrapper.messageManager.send("trackingRequired", message.channel);
	}
}
