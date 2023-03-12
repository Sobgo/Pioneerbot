"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";

export const settings: CommandSettings = {
	name: "Quiet mode",
	invokes: ["quiet"],
	description: "Suppresses messages sent when new song starts playing",
	category: "general",
	list: true
}

export const quiet = async (guildId: string, wrapper: Wrapper, message: Message, _args: string[]) => {
	const queue = await wrapper.checkQueue(guildId, message);
	if (!queue) {
		message.channel.send({ embeds: [wrapper.messageMenager.noChannelBot()] });
		return;
	}

	queue.quiet = !queue.quiet;
	message.channel.send({ embeds: [wrapper.messageMenager.quiet(queue.quiet)] });
}
