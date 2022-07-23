'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const settings = {
	aliases : ["po"],
	description : "selects [count] songs from guild history that haven't been played for the longest time and adds them to queue, default [count] is 1",
	usage : "[count]",
	category : "tracking",
	list : true
}

export const playoldest = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const db = wrapper.databaseMenager;
	const guild = await db.getGuild(ID);
	const queue = await wrapper.checkQueue(ID, message, true);
	if (!queue) return;

	if (guild && guild.default_playlist_id) {
		const playlistId = guild.default_playlist_id;
		const amount = args[0] ? parseInt(args[0]) : 1;

		if (isNaN(amount)) {
			message.channel.send({ embeds: [wrapper.messageMenager.invalidArguments("playoldest", settings.aliases, settings.usage)] });
			return;
		}

		let result = await db.getOldestFromPlaylist(playlistId, amount);

		if (result == null || result.length == 0) return;

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
	else {
		message.channel.send({ embeds: [wrapper.messageMenager.trackingRequired()] });
	}
}
