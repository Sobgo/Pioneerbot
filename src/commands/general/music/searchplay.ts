"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";
import { ytsr } from "@/scrapper";

export const settings: CommandSettings = {
	name: "Search and play",
	invokes: ["searchplay", "sp"],
	description: "Adds a song appearing in `<position>` when serached with `[query]` to the back of the queue "
		+ "if no `[query]` is specified it will try to use previous cached query.",
	usage: "<position> [query]",
	category: "general",
	list: true
}

export const searchplay = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const queue = await wrapper.checkQueue(guildId, message, true);
	if (queue == null) return;

	const position = parseInt(args[0]) - 1;
	const query = args.slice(1).map((element) => { return element }).join(' ');

	// validate args
	if (isNaN(position)) {
		message.channel.send({ embeds: [wrapper.messageManager.invalidArguments(settings)] });
		return;
	}

	if (position < 0) {
		message.channel.send({ embeds: [wrapper.messageManager.outOfScope()] });
		return;
	}

	// search and set cache
	if (query.length > 0) {
		queue.cachedResult = await ytsr(query, { user: message.member });
	}

	if (queue.cachedResult.length < 1) {
		message.channel.send({ embeds: [wrapper.messageManager.noQuery()] });
		return;
	}

	if (queue.cachedResult.length <= position) {
		message.channel.send({ embeds: [wrapper.messageManager.outOfScope("position")] });
		return;
	}

	// get song form cache
	const song = queue.cachedResult[position];
	queue.push(song);

	if (!queue.current) {
		queue.next();
		if (queue.current) queue.playResource(queue.current);
	} else {
		message.channel.send({ embeds: [wrapper.messageManager.queueAdd([song], queue.length - 1)] });
	}
}
