"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";

export const settings: CommandSettings = {
	name: "Skip",
	invokes: ["skip", "s"],
	description: "Skips the `[count]` songs from the queue, "
		+ "if no `[count]` is specified it will skip currently playing song "
		+ "and if `[count]` exceeds the queue length it will skip all the songs in the queue.",
	usage: "[count]",
	category: "general",
	list: true
}

export const skip = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const queue = await wrapper.checkQueue(guildId, message);
	if (queue == null) return;

	const count = args[0] ? parseInt(args[0]) : 1;

	if (isNaN(count)) {
		message.channel.send({ embeds: [wrapper.messageMenager.invalidArguments(settings)] });
		return;
	}

	if (count < 1) {
		message.channel.send({ embeds: [wrapper.messageMenager.outOfScope()] });
		return;
	}

	if (queue.current) {
		// removes count - 1 songs from queue because currently playing song is included in count
		const songs = [queue.current, ...queue.remove(0, Math.min(count - 1, queue.length))];
		// skips currently playing song and sets new one if queue is not empty
		queue.player.stop();
		message.channel.send({ embeds: [wrapper.messageMenager.skipped(songs)] });
	} else {
		message.channel.send({ embeds: [wrapper.messageMenager.queueEmpty()] });
	}
}
