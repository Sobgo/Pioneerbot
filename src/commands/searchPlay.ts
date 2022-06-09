'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

import { playSong } from "./play";
import { searchList } from "./search";
import { messageProvider } from "../messageProvider";
import { checkQueue } from "../utils";

export const aliases = ["sp"];

export const description = "Search and play a song to the voice channel, if no `[query]` is specified previous query will be used, " 
+ "`<position>` is song's position on youtube search result page.";

export const usage = "<position> [query]";

export const searchplay = async (ID: string, queues: Wrapper, message: Message, args: string[]) => {
	const QUEUE = await checkQueue(ID, queues, message, true);
	if (QUEUE == null) return null;

	const position = parseInt(args[0]);
	
	if (isNaN(position)) {
		message.channel.send({ embeds: [messageProvider.invalidArguments("searchPlay", aliases, usage)] });
		return;
	}

	if (position < 1) {
		message.channel.send({embeds: [messageProvider.outOfScope()]});
	}

		
	const query = args.slice(1).map((element) => { return element }).join(' ');
	if(query.length > 0) QUEUE.cache = await searchList(message, query, 10);
		
	if (!QUEUE.cache || QUEUE.cache.length < position) {
		message.channel.send({embeds: [messageProvider.noCache()]});
		return;
	}

	await playSong(ID, queues, message, QUEUE.cache[position-1].url, 1);
}
