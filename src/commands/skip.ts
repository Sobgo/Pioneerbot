'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";
import { messageProvider } from "../messageProvider";
import { checkQueue } from "../utils";

export const aliases = ["s"];

export const description = "Skip to `[count]` position in the queue, if no `[count]` is specified it will skip currently playing song "
+ "and if `[count]` exceeds the queue length it will skip to the end of the queue.";

export const usage = "[count]";

export const skip = async (ID: string, queues: Wrapper, message: Message, args: string[]) => {
	const QUEUE = await checkQueue(ID, queues, message);
	if (QUEUE == null) return null;

	const count = args[0] ? parseInt(args[0]) : 1;

	if (isNaN(count)) {
		message.channel.send({embeds: [messageProvider.invalidArguments("skip", aliases, usage)]});
		return;
	}

	if (count < 1) {
		message.channel.send({embeds: [messageProvider.outOfScope()]});
		return;
	}

	let songs = QUEUE.remove(0, Math.min(count - 1, QUEUE.length() - 1));
	let last = QUEUE.front();

	if (!last) {
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
