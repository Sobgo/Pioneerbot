'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const settings = {
	name : "Skip",
	invokes : ["skip", "s"],
	description : "Skips the `[count]` songs from the queue, "
				+ "if no `[count]` is specified it will skip currently playing song "
				+ "and if `[count]` exceeds the queue length it will skip all the songs in the queue.",
	usage : "[count]",
	category : "general",
	list : true
}

export const skip = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const queue = await wrapper.checkQueue(ID, message);
	if (queue == null) return null;

	const count = args[0] ? parseInt(args[0]) : 1;

	if (isNaN(count)) {
		message.channel.send({embeds: [wrapper.messageMenager.invalidArguments(settings)]});
		return;
	}

	if (count < 1) {
		message.channel.send({embeds: [wrapper.messageMenager.outOfScope()]});
		return;
	}

	const songs = queue.remove(0, Math.min(count - 1, queue.length() - 1));
	const last = queue.front();

	if (!last) {
		message.channel.send("queue is empty!");
		return;
	}
	else {
		songs.push(last);
	}

	// force state change
	queue.player.stop();
	message.channel.send({ embeds: [wrapper.messageMenager.skipped(songs)] });
}
