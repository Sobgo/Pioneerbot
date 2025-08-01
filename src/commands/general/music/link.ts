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
				wrapper.messageManager.send("play", message.channel);
				return;
			}
		} else {
			wrapper.messageManager.send("noQuery", message.channel);
			return;
		}
	} else {
		if (isNaN(position)) {
			wrapper.messageManager.send("invalidArgument", message.channel, settings);
		}

		if (position < 0) {
			wrapper.messageManager.send("outOfScope", message.channel, "position");
			return;
		}

		if (query.length > 0) {
			result = await ytsr(query); // 2
			if (queue) queue.cachedResult = result;
			if (!result) {
				wrapper.messageManager.send("noResult", message.channel);
				return;
			}
		} else {
			if (!queue || queue.cachedResult.length < 1) {
				wrapper.messageManager.send("noQuery", message.channel);
				return;
			}
			result = queue.cachedResult; // 1
		}

		if (position >= result.length) {
			wrapper.messageManager.send("outOfScope", message.channel, "position");
			return;
		}
	}

	const song = position == null ? result[0] : result[position];
	console.log(song);
	try {
	message.channel.isSendable() && message.channel.send(song.url);
	} catch (error) {
		console.error(error);
	}
}
