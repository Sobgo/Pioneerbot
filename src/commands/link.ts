'use strict'
import { Message } from "discord.js"
import { messageProvider } from "../messageProvider";
import { Wrapper } from "../structures"

import { searchList } from './search';

export const description = "Get a link to the song, if no `[query]` is specified previous query will be used, `<position>` is song's position on youtube search result page.";
export const usage = "<position> [query]";

export const link = async (ID: string, queues: Wrapper, message: Message, args: string[]) => {
	const QUEUE = queues.get(ID);

	const position = parseInt(args[0]) - 1;

	if (isNaN(position) || position < 0) {
		message.channel.send({embeds: [messageProvider.invalidArguments("link", undefined, usage)]});
		return;
	}

	const query = args.slice(1).map((element) => { return element }).join(' ');
	let result;

	if (query.length > 0) {
		result = await searchList(message, query);
		if (QUEUE) QUEUE.cache = result;
	}
	else {
		if (QUEUE == null) {
			message.channel.send({embeds: [messageProvider.noCache()]});
			return;
		}
		result = QUEUE.cache;
	}

	if (result && result.length > position) {
		const url = result[position].url;
		if (url) message.channel.send(url);
	}
	else {
		message.channel.send({ embeds: [messageProvider.noResult()] });
	}
}