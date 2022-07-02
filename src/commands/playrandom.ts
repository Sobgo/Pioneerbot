'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const settings = {
	aliases : ["pr"],
	description : "selects [count] songs from guild history and adds them to queue, default [count] is 1",
	usage : "[count]",
	category : "tracking",
	list : true
}

export const playrandom = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const db = wrapper.databaseMenager;
	const guild = await db.getGuild(ID);
	const queue = await wrapper.checkQueue(ID, message, true);
	if (!queue) return;

	if (guild && guild.default_playlist_id) {
		const playlistId = guild.default_playlist_id;
		const amount = args[0] ? parseInt(args[0]) : 1;
		let result = await db.getRandomFromPlaylist(playlistId, amount);

		if (result == null || result.length == 0) return;

		if (queue.length() == 0) {
			queue.push(result[0]);
			result = result.slice(1);
			queue.playResource();
		}

		if (result && result.length > 0) {
			message.channel.send({ embeds: [wrapper.messageMenager.queueAdd(result, queue.length())] });
			queue.push(...result);
		}
	}
	else {
		message.channel.send({ embeds: [wrapper.messageMenager.trackingRequired()] });
	}
}