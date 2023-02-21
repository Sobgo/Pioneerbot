"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";
import { ytsr } from "@/scrapper";

export const settings: CommandSettings = {
	name: "Play top",
	invokes: ["playtop", "pt"],
	description: "Searches song with the given `[query]` and adds the first result to the top of the queue"
		+ "if no `[query]` is specified it will instead show currently playing song if any.",
	usage: "[query]",
	category: "general",
	list: true
}

export const playtop = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const queue = await wrapper.checkQueue(guildId, message, true);
	const query = args.map((element) => { return element }).join(' ');
	if (!queue) return;

	if (query.length > 0) {
		const result = await ytsr(query, { user: message.member });
		if (result.length < 1) {
			message.channel.send({ embeds: [wrapper.messageMenager.noResult()] });
			return;
		}
		const song = result[0];

		queue.add(0, song);

		if (!queue.current) {
			queue.next();
			if (queue.current) queue.playResource(queue.current);
		} else {
			message.channel.send({ embeds: [wrapper.messageMenager.queueAdd([song], 0)] });
		}
	} else {
		message.channel.send({ embeds: [wrapper.messageMenager.invalidArguments(settings)] });
	}
}
