'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";
import { searchMany } from "../utils";

export const settings = {
	aliases : ["pt"],
	description : "Adds a song to the top of the queue and if queue was empty plays added song.",
	usage : "[query]",
	category : "general",
	list : true
}

export const playtop = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const queue = await wrapper.checkQueue(ID, message, true);
	const query = args.map((element) => { return element }).join(' ');
	if (!queue) return;

	if (args[0] && query.length > 0) {
		const result = await searchMany(message, query);
		
		if (result == null || result.length < 1) {
			message.channel.send({ embeds: [wrapper.messageMenager.noResult()] });
			return;
		}


		if (queue.length() == 0) {
			queue.add(0, result[0]);
			queue.playResource();
		}
		else {
			queue.add(1, result[0]);
			result.slice(1);
			message.channel.send({ embeds: [wrapper.messageMenager.queueAdd(result, 1)] });
		}
	}
	else {
		message.channel.send({ embeds: [wrapper.messageMenager.invalidArguments("playtop", settings.aliases, settings.usage)] });
	}
}
