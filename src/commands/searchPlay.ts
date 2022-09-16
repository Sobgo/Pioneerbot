'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";
import { searchMany } from "../utils";

export const settings = {
	name : "Search and play",
	invokes : ["searchplay", "sp"],
	description : "Adds a song appearing in `<position>` when serached with `[query]` to the back of the queue "
				+ "if no `[query]` is specified it will try to use previous cached query.",
	usage : "<position> [query]",
	category : "general",
	list : true
}

export const searchplay = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const position = parseInt(args[0]);
	const query = args.slice(1).map((element) => { return element }).join(' ');
	const queue = await wrapper.checkQueue(ID, message, true);
	if (queue == null) return null;

	// validate args
	if (isNaN(position)) {
		message.channel.send({ embeds: [wrapper.messageMenager.invalidArguments(settings)] });
		return;
	}

	if (position < 1) {
		message.channel.send({embeds: [wrapper.messageMenager.outOfScope()]});
	}

	// search and set cache
	if (query.length > 0) {
		queue.cache = await searchMany(message, query, 10);
	}

	if (!queue.cache || queue.cache.length < position) {
		message.channel.send({embeds: [wrapper.messageMenager.noCache()]});
		return;
	}

	// get song form cache
	const song = queue.cache[position - 1];

	queue.push(song);

	if (queue.length() == 1) {
		queue.playResource();
	}
	else {
		message.channel.send({ embeds: [wrapper.messageMenager.queueAdd([song], queue.length() - 1)] });
	}
}
