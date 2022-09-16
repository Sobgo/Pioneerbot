'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";
import { searchMany } from "../utils";

export const settings = {
	name : "Search",
	invokes : ["search", "sr"],
	description : "Provides up to 10 search results for a given `<query>`, to add one of them to queue use "
				+ "`searchplay` command, if bot is in voice channel the `<query>` will be cached.",
	usage : "<query>",
	category : "general",
	list : true
}

export const search = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {

	const query = args.map((element) => { return element }).join(' ');
	const LIMIT = 10;

	if (query.length < 1) {
		message.channel.send({embeds: [wrapper.messageMenager.invalidArguments(settings)]});
		return;
	}

	const result = await searchMany(message, query, LIMIT);
	
	if (result && result.length > 0) {
		message.channel.send({ embeds: [wrapper.messageMenager.search(result)] });
		const queue = wrapper.get(ID);
		if (queue) queue.cache = result;
	}
	else {
		message.channel.send({ embeds: [wrapper.messageMenager.noResult()] });
	}
}
