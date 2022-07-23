'use strict'
import { Message } from "discord.js"
import { Wrapper } from "../structures"
import { searchMany } from '../utils';

export const settings = {
	aliases : [],
	description : "Get a link to the song, if no `[query]` is specified previous query will be used, `<position>` is song's position on youtube search result page.",
	usage : "<position> [query]",
	category : "general",
	list : true
}

export const link = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const queue = wrapper.get(ID);
	const position = parseInt(args[0]) - 1;
	const query = args.slice(1).map((element) => { return element }).join(' ');
	let result;

	if (isNaN(position) || position < 0) {
		message.channel.send({embeds: [wrapper.messageMenager.invalidArguments("link", undefined, settings.usage)]});
		return;
	}

	if (query.length > 0) {
		result = await searchMany(message, query);
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
