"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";

export const settings: CommandSettings = {
	name: "Shuffle",
	invokes: ["shuffle", "sh"],
	description: "Shuffles the current queue.",
	category: "general",
	list: true
}

export const shuffle = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const queue = wrapper.get(guildId);
	if (!queue) return;

	queue.shuffle();

	message.channel.send({ embeds: [wrapper.messageMenager.shuffled()] });
}
