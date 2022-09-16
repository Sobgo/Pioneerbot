'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const settings = {
	name : "Playlist play",
	usage: "playlist \"play\" [count]"
}

export const playlistplay = async (ID: string, wrapper: Wrapper, message: Message, args:string[]) => {
	const db = wrapper.databaseMenager;
	const playlistId = parseInt(args[0]);
	const amount = args[2] ? parseInt(args[2]) : 1;

	if (isNaN(amount)) {
		message.channel.send({ embeds: [wrapper.messageMenager.invalidArguments(settings)] });
		return;
	}
	
	let result = await db.getRandomFromPlaylist(playlistId, amount);
	if (result == null || result.length == 0) return;
	
	const queue = await wrapper.checkQueue(ID, message, true);
	if (!queue) return;
	
	if (queue.length() == 0) {
		queue.push(result[0]);
		result = result.slice(1);
		queue.playResource();
	}
	
	if (result && result.length > 0) {
		while (result.length > 0) {
			// divide result into messages with max 50 songs each
			const chunk = result.splice(0, 50);
			message.channel.send({ embeds: [wrapper.messageMenager.queueAdd(chunk, queue.length())] });
			queue.push(...chunk);
		}
	}
}
