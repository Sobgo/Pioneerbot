"use strict"
import { Message } from "discord.js"

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";
import { ytsr } from "@/scrapper"

export const settings: CommandSettings = {
	name: "Link",
	invokes: ["link"],
	description: "Provides a link to the song appearing in `[position]` when serached with `[query]`, "
		+ "if no `[query]` is specified it will try to use previous cached query "
		+ "and if no `[position]` is specified it will provide a link to currently playing song.",
	usage: "[position] [query]",
	category: "general",
	list: true
}

/*
0 !link -> link to currently playing song
1 !link [position] -> link to song at [position] in cached result
2 !link [position] [query] -> link to song at [position] in [query]
*/
export const link = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const queue = wrapper.get(guildId);
	const position = args[0] ? parseInt(args[0]) - 1 : null;
	const query = args.slice(1).map((element) => { return element }).join(' ');
	let result;

	if (position == null) {
		if (queue) {
			const front = queue.current;
			if (front) {
				result = [front]; // 0
			} else {
				// "nothing playing"
				message.channel.send({ embeds: [wrapper.messageMenager.play()] });
				return;
			}
		} else {
			message.channel.send({ embeds: [wrapper.messageMenager.noQuery()] });
			return;
		}
	} else {
		if (isNaN(position)) {
			message.channel.send({ embeds: [wrapper.messageMenager.invalidArguments(settings)] });
			return;
		}

		if (position < 0) {
			message.channel.send({ embeds: [wrapper.messageMenager.outOfScope("position")] });
			return;
		}

		if (query.length > 0) {
			result = await ytsr(query); // 2
			if (queue) queue.cachedResult = result;
			if (!result) {
				message.channel.send({ embeds: [wrapper.messageMenager.noResult()] });
				return;
			}
		} else {
			if (!queue || queue.cachedResult.length < 1) {
				message.channel.send({ embeds: [wrapper.messageMenager.noQuery()] });
				return;
			}
			result = queue.cachedResult; // 1
		}

		if (position >= result.length) {
			message.channel.send({ embeds: [wrapper.messageMenager.outOfScope("position")] });
			return;
		}
	}

	const song = position == null ? result[0] : result[position];
	return message.channel.send(song.url);
}
