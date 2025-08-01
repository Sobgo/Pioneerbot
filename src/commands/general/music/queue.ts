"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";

export const settings: CommandSettings = {
	name: "Queue",
	invokes: ["queue", "q"],
	description: "Shows the current queue from `[position]` up to 10 songs, "
		+ "if no `[position]` is specified it will start form the first song in the queue.",
	usage: "[position]",
	category: "general",
	list: true
}

export const queue = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const queue = wrapper.get(guildId);
	if (!queue) return;

	let position = args[0] ? parseInt(args[0]) - 1 : 0;
	if (isNaN(position)) {
		wrapper.messageManager.send("invalidArgument", message.channel, settings);
		return;
	}

	if (position < 0 || position > queue.length) {
		wrapper.messageManager.send("outOfScope", message.channel, "position");
		return;
	}

	const toList = queue.get(position, position + 9);
	wrapper.messageManager.send("queueList", message.channel, toList, position);
}
