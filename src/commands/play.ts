'use strict'
import { Message } from "discord.js";
import { Wrapper, Song } from "../structures";
import { messageProvider } from "../messageProvider";

import { join } from './join';
import { searchList } from './search';
import { checkQueue } from "../utils";

export const aliases = ["p"];

export const description = "Play a song to the voice channel, if no `[query]` specified it will show curently playing song.";
export const usage = "[query]";

export const play = async (ID: string, queues: Wrapper, message: Message, args: string[]) => {
	const query = args.map((element) => { return element }).join(' ');
	if (args.length != 0) {
		await playSong(ID, queues, message, query);
	}
	else {
		await getStatus(ID, queues, message);
	}
}

export const playSong = async (ID: string, queues: Wrapper, message: Message, query: string, position: number = 1): Promise<Song[] | null> => { 	
	const QUEUE = await checkQueue(ID, queues, message, true);
	if (QUEUE == null) return null;

	// validate and add to queue
	const result = await searchList(message, query, position, position-1);
	
	if (result == null || result.length < 1) {
		message.channel.send({ embeds: [messageProvider.noResult()] });
		return null;
	}

	QUEUE.push(result[0]);
	
	if(QUEUE.length() == 1) {
		QUEUE.playResource();
	}
	else {
		message.channel.send({ embeds: [messageProvider.queueAdd(result[0], QUEUE.length() - 1)] });
	}

	return result;
}

const getStatus = async (ID: string, queues: Wrapper, message: Message) => {
	if (queues.get(ID) == null) await join(ID, queues, message);
	const QUEUE = queues.get(ID);
	if (QUEUE == null) return null;

	message.channel.send({ embeds: [messageProvider.play(QUEUE.front())] });
}
