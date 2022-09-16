'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const settings = {
	name : "Shuffle",
	invokes : ["shuffle", "sh"],
	description : "Shuffles the current queue.",
	category : "general",
	list : true
}

export const shuffle = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const queue = wrapper.get(ID);
	if (!queue) return;

	queue.shuffle();

	message.channel.send({embeds: [wrapper.messageMenager.shuffled()]});
}
