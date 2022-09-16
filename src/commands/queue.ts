'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const settings = {
	name : "Queue",
	invokes : ["queue", "q"],
	description : "Shows the current queue from `[position]` up to 10 songs, "
				+ "if no `[position]` is specified it will start form the first song in the queue.",
	usage : "[position]",
	category : "general",
	list : true
}

export const queue = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const queue = wrapper.get(ID);
	if (!queue) return;

	let position = args[0] ? parseInt(args[0]) : 1;
	if (isNaN(position)) {
		message.channel.send({embeds: [wrapper.messageMenager.invalidArguments(settings)]});
		return;
	}

	if (position < 1 || (queue.length() > 0 && position > queue.length())) {
		message.channel.send({embeds: [wrapper.messageMenager.outOfScope()]});
		return;
	}
	
	const toList = queue.songs.slice(position, position + 10);
	message.channel.send({embeds: [wrapper.messageMenager.queueList(toList, position)]});
}
