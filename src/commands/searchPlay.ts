'use strict'
import { Wrapper } from "../structures";
import { Message } from "discord.js";
import { playSong } from "./play"

export const aliases = ["sp"];

export const searchPlay = async (ID: string, queues: Wrapper, message: Message, args: string[]) => {
	const QUEUE = queues.get(ID);
	if (!QUEUE) return;

	const position = parseInt(args[0]);
	if (isNaN(position) || position < 1) return;
	let query: string | undefined = args.slice(1).map((element) => { return element }).join(' ');
	if(query && query.length > 0) {
		QUEUE.cache = await playSong(ID, queues, message, query, position);
	}
	else {
		if(!QUEUE.cache || QUEUE.cache.length < position ) return;
		await playSong(ID, queues, message, QUEUE.cache[position-1].url, 1);
	}
}
