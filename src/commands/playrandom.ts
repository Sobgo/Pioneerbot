'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const settings = {
	name : "Play random",
	invokes : ["playrandom", "pr"],
	description : "Selects `[count]` random songs from guild history and adds them to queue, "
				+ "if no `[count]` is specified it will select one song.",
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

		if (isNaN(amount)) {
			message.channel.send({ embeds: [wrapper.messageMenager.invalidArguments(settings)] });
			return;
		}

		let result = await db.getRandomFromPlaylist(playlistId, amount);

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
