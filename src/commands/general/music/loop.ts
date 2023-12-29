"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";

export const settings: CommandSettings = {
	name: "Loop",
	invokes: ["loop"],
	description: "Toggles loop mode.",
	category: "general",
	list: true
}

export const loop = async (guildId: string, wrapper: Wrapper, message: Message, _args: string[]) => {
	const queue = await wrapper.checkQueue(guildId, message);
	if (!queue) return;

	queue.loop = !queue.loop;
	message.channel.send({ embeds: [wrapper.messageManager.loop(queue.loop)] });
}
