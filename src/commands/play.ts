'use strict'

import { Message, MessageEmbed, Util } from "discord.js";
import { createAudioResource } from "@discordjs/voice";
import { exec as ytdl } from 'youtube-dl-exec'; // fix for abort error in ytdl-core
import { Wrapper, Queue, Song} from "../structures";
import { secToTimestamp } from '../utils';

import { join } from './join';
import { search } from './search';

const FLAGS = {
	output: '-', // output to stdout
	quiet: true, // quiet mode
	format: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio', // output format
	limitRate: '100K' // max download rate in bytes
}

export const play = async (ID: string, queues: Wrapper, message: Message, args: string[], content: string) => { 
	
	// get queue
	if (queues.get(ID) == null) await join(ID, queues, message);
	const QUEUE = queues.get(ID);
	if (QUEUE == null) return;

	// validate and add to queue
	let song: Song;

	if (args.length < 1) return;
	const result = await search(message, args, content, 1);
	if (result == null || result.length < 1) return;
	song = await Song.build(result[0].url, message.member);	

	QUEUE.push(song);
	
	if(QUEUE.length() == 1) {
		playResource(QUEUE);
	}
	else {
		const response = new MessageEmbed()
		.setColor('#ff0000')
		.setDescription("**" + Util.escapeMarkdown(song.title) + "**")
		.setTitle('**:memo:  Added to queue:**')
		.setURL(song.url)
		.addFields(
			{ name: 'Author', value: song.author, inline: true },
			{ name: 'Length', value: secToTimestamp(song.duration), inline: true },
			{ name: 'Requested by', value: song.user.toString(), inline: true }
		)
		message.channel.send({ embeds: [response] });
	}
}

const playResource = async (QUEUE: Queue) => {
	const song = QUEUE.front();
	if (song == undefined) return;

	const stream = ytdl(song.url, FLAGS, { stdio: ['ignore', 'pipe', 'ignore'] });
	if (!stream.stdout) return;

	const resource = createAudioResource(stream.stdout,  { inlineVolume: true });
	QUEUE.player.play(resource);
}
