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
		wrapper.messageManager.send("noChannelBot", message.channel);
		return;
	}

	queue.quiet = !queue.quiet;
	wrapper.messageManager.send("quiet", message.channel, queue.quiet);
}
