'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const settings = {
	aliases : ["q"],
	description : "Show the current queue from `[position]` up to 10 songs, default `[position]` is 1.",
	usage : "[position]",
	category : "general",
	list : true
}

export const queue = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const queue = wrapper.get(ID);
	if (!queue) return;

	let position = args[0] ? parseInt(args[0]) : 1;
	if (isNaN(position)) {
		message.channel.send({embeds: [wrapper.messageMenager.invalidArguments("queue", settings.aliases, settings.usage)]});
		return;
	}

	if (position < 1 || (queue.length() > 0 && position > queue.length())) {
		message.channel.send({embeds: [wrapper.messageMenager.outOfScope()]});
		return;
	}

	message.channel.send({embeds: [wrapper.messageMenager.queueList(queue.songs.slice(position, position + 10), position)]});
}
