"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";
import { ytsr } from "@/scrapper";

export const settings: CommandSettings = {
	name: "Play",
	invokes: ["play", "p"],
	description: "Searches song with the given `[query]` and adds the first result to the back of the queue"
		+ "if no `[query]` is specified it will instead show currently playing song if any.",
	usage: "[query]",
	category: "general",
	list: true
}

export const play = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const queue = await wrapper.checkQueue(guildId, message, true);
	const query = args.map((element) => { return element }).join(' ');
	if (!queue) return;

	if (args.length != 0) {
		const result = await ytsr(query, { user: message.member });
		if (result.length < 1) {
			wrapper.messageManager.send("noResult", message.channel);
			return;
		}
		const song = result[0];

		queue.push(song);

		if (!queue.current) {
			queue.next();
			if (queue.current) queue.playResource(queue.current);
		} else {
			wrapper.messageManager.send("queueAdd", message.channel, [song], queue.length - 1);
		}
	} else {
		// if no query then show currently playing song
		wrapper.messageManager.send("play", message.channel, queue.current);
	}
}
