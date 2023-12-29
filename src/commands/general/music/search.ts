"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";
import { ytsr } from "@/scrapper";

export const settings: CommandSettings = {
	name: "Search",
	invokes: ["search", "sr"],
	description: "Provides up to 10 search results for a given `<query>`, to add one of them to queue use "
		+ "`searchplay` command, if bot is in voice channel the `<query>` will be cached.",
	usage: "<query>",
	category: "general",
	list: true
}

export const search = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const query = args.map((element) => { return element }).join(' ');

	if (query.length < 1) {
		message.channel.send({ embeds: [wrapper.messageManager.invalidArguments(settings)] });
		return;
	}

	const result = await ytsr(query);

	if (result.length > 0) {
		message.channel.send({ embeds: [wrapper.messageManager.search(result)] });
		const queue = wrapper.get(guildId);
		if (queue) queue.cachedResult = result;
	} else {
		message.channel.send({ embeds: [wrapper.messageManager.noResult()] });
	}
}
