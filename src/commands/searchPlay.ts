'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";
import { searchMany } from "../utils";

export const settings = {
	aliases : ["sp"],
	description : "Search and play a song to the voice channel, if no `[query]` is specified previous query will be used, " 
	+ "`<position>` is song's position on youtube search result page.",
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
		message.channel.send({ embeds: [wrapper.messageMenager.invalidArguments("searchplay", settings.aliases, settings.usage)] });
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
