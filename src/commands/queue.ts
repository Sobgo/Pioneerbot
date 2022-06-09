'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";
import { messageProvider } from "../messageProvider";

export const aliases = ["q"];

export const description = "Show the current queue from `[position]` up to 10 songs, default `[position]` is 1.";
export const usage = "[position]";

export const queue = async (ID: string, queues: Wrapper, message: Message, args: string[]) => {
	const QUEUE = queues.get(ID);
	if (!QUEUE) return;

	let position = args[0] ? parseInt(args[0]) : 1;
	if (isNaN(position)) {
		message.channel.send({embeds: [messageProvider.invalidArguments("queue", aliases, usage)]});
		return;
	}

	if (position < 1 || position > QUEUE.length()) {
		message.channel.send({embeds: [messageProvider.outOfScope()]});
		return;
	}

	message.channel.send({embeds: [messageProvider.queueList(QUEUE.songs.slice(position, position + 10), position)]});
}
