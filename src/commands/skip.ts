'use strict'
import { Song, Wrapper } from "../structures";
import { Message } from "discord.js";
import { messageProvider } from "../messageProvider";

export const aliases = ["s"];

export const skip = async (ID: string, queues: Wrapper, message: Message, args: string[]) => {
	const QUEUE = queues.get(ID);
	if (!QUEUE) return;

	const count = parseInt(args[0]);
	let songs:Song[] = [];

	if (!isNaN(count) && count > 1) {
		songs = QUEUE.remove(0, Math.min(count - 1, QUEUE.length() - 1));
	}
	let last = QUEUE.front();
	if(!last) {
		message.channel.send("queue is empty!");
		return;
	}
	else {
		songs.push(last);
	}
	// force state change
	QUEUE.player.stop();
	message.channel.send({ embeds: [messageProvider.skipped(songs)] });
}
