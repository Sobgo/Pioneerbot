'use strict'
import { Message } from "discord.js"
import { Wrapper } from "../structures"
import { searchMany } from '../utils';

export const settings = {
	name : "Link",
	invokes : ["link"],
	description : "Provides a link to the song appearing in `<position>` when serached with `[query]`, "
				+ "if no `[query]` is specified it will try to use previous cached query.",
	usage : "<position> [query]",
	category : "general",
	list : true
}

export const link = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const queue = wrapper.get(ID);
	const position = parseInt(args[0]) - 1;
	const query = args.slice(1).map((element) => { return element }).join(' ');
	let result;

	console.log(query);

	if (isNaN(position) || position < 0) {
		message.channel.send({embeds: [wrapper.messageMenager.invalidArguments(settings)]});
		return;
	}

	if (query.length > 0) {
		result = await searchMany(message, query, 10);
		if (queue) queue.cache = result;
	}
	else {
		if (queue == null) {
			message.channel.send({embeds: [wrapper.messageMenager.noCache()]});
			return;
		}
		result = queue.cache;
	}

	if (result && result.length > position) {
		const url = result[position].url;
		if (url) message.channel.send(url);
	}
	else {
		message.channel.send({ embeds: [wrapper.messageMenager.noResult()] });
		return;
	}
}
