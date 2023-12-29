"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";

export const settings: CommandSettings = {
	name: "Playlistplay",
	usage: "playlist \"play\" [count]"
}

export const playlistplay = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const db = wrapper.databaseManager;
	const playlistId = parseInt(args[0]);
	const amount = args[2] ? parseInt(args[2]) : 1;
	const queue = await wrapper.checkQueue(guildId, message, true);
	if (!queue) return;

	if (isNaN(amount)) {
		message.channel.send({ embeds: [wrapper.messageManager.invalidArguments(settings)] });
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
		message.channel.send({ embeds: [wrapper.messageManager.queueAdd(chunk, queue.length)] });
		queue.push(chunk);
	}
}
