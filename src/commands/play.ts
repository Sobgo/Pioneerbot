'use strict'
import { Message } from "discord.js";
import { createAudioResource } from "@discordjs/voice";
import { exec as ytdl } from 'youtube-dl-exec'; // fix for abort error in ytdl-core
import { Wrapper, Queue, Song } from "../structures";

import { join } from './join';
import { searchList } from './search';
import { messageProvider } from "../messageProvider";

const FLAGS = {
	output: '-', // output to stdout
	quiet: true, // quiet mode
	format: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio', // output format
	limitRate: '100K' // max download rate in bytes
}

export const aliases = ["p"];

export const play = async (ID: string, queues: Wrapper, message: Message, args: string[]) => {
	const query = args.map((element) => { return element }).join(' ');
	await playSong(ID, queues, message, query);
}

export const playSong = async (ID: string, queues: Wrapper, message: Message, query: string, position: number = 1): Promise<Song[] | null> => { 	
	// get queue
	if (queues.get(ID) == null) await join(ID, queues, message);
	const QUEUE = queues.get(ID);
	if (QUEUE == null) return null;

	// validate and add to queue
	let song: Song;

	const result = await searchList(message, query, position, position-1);
	if (result == null || result.length < 1) return null;
	song = await Song.build(result[0].url, message.member);	

	QUEUE.push(song);
	
	if(QUEUE.length() == 1) {
		playResource(QUEUE);
	}
	else {
		message.channel.send({ embeds: [messageProvider.queueAdd(song)] });
	}

	return result;
}

const playResource = async (QUEUE: Queue) => {
	const song = QUEUE.front();
	if (song == undefined) return;

	const stream = ytdl(song.url, FLAGS, { stdio: ['ignore', 'pipe', 'ignore'] });
	if (!stream.stdout) return;

	const resource = createAudioResource(stream.stdout,  { inlineVolume: true });
	QUEUE.player.play(resource);
}
