'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";
import { searchMany } from "../utils";

export const settings = {
	aliases : ["p"],
	description : "Play a song to the voice channel, if no `[query]` specified it will show curently playing song.",
	usage : "[query]",
	category : "general",
	list : true
}

export const play = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const queue = await wrapper.checkQueue(ID, message, true);
	const query = args.map((element) => { return element }).join(' ');
	if (!queue) return;

	if (args.length != 0) {
		// validate and add to queue
		const result = await searchMany(message, query);
		
		if (result == null || result.length < 1) {
			message.channel.send({ embeds: [wrapper.messageMenager.noResult()] });
			return;
		}
	
		queue.push(result[0]);

		if (queue.length() == 1) {
			queue.playResource();
		}
		else {
			result.slice(1);
			message.channel.send({ embeds: [wrapper.messageMenager.queueAdd(result, queue.length() - 1)] });
		}
	}
	else {
		message.channel.send({ embeds: [wrapper.messageMenager.play(queue.front())] });
	}
}
