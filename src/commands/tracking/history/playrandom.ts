"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";

export const settings: CommandSettings = {
	name: "Play random",
	invokes: ["playrandom", "pr"],
	description: "Selects `[count]` random songs from guild history and adds them to queue, "
		+ "if no `[count]` is specified it will select one song.",
	usage: "[count]",
	category: "tracking",
	list: true
}

export const playrandom = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const db = wrapper.databaseMenager;
	const guild = await db.getGuild(guildId);
	const queue = await wrapper.checkQueue(guildId, message, true);
	if (!queue) return;

	if (guild && guild.default_playlist_id) {
		const playlistId = guild.default_playlist_id;
		const amount = args[0] ? parseInt(args[0]) : 1;

		if (isNaN(amount)) {
			message.channel.send({ embeds: [wrapper.messageMenager.invalidArguments(settings)] });
			return;
		}

		let result = await db.getRandomFromPlaylist(playlistId, amount);
		if (result == null || result.length == 0) return;

		if (!queue.current) {
			queue.push(result.splice(0, 1)[0]);
			queue.next();
			if (queue.current) queue.playResource(queue.current);
		}
	
		while (result.length > 0) {
			// divide result into messages with max 50 songs each
			const chunk = result.splice(0, 50);
			message.channel.send({ embeds: [wrapper.messageMenager.queueAdd(chunk, queue.length)] });
			queue.push(chunk);
		}
	}
	else {
		message.channel.send({ embeds: [wrapper.messageMenager.trackingRequired()] });
	}
}
