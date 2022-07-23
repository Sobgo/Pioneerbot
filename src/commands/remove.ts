'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const settings = {
	aliases : ["r"],
	description : "Remove songs from the queue starting from `<position>` and ending at\n `<position> + [count]`, "
	+ "if count is not specified, it will remove 1 song and if count exceeds the queue length, it will remove all songs.",
	usage : "<position> [count]",
	category : "general",
	list : true
}

export const remove = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const queue = wrapper.get(ID);
	if (!queue) return;

	const start = parseInt(args[0]);
	const count = args[1] ? parseInt(args[1]) : 1;

	if (isNaN(start) || isNaN(count)) {
		message.channel.send({ embeds: [wrapper.messageMenager.invalidArguments("remove", settings.aliases, settings.usage)] });
		return;
	}

	if (start <= 0 || start > queue.length() ||count <= 0) {
		message.channel.send({ embeds: [wrapper.messageMenager.outOfScope()]});
		return;
	}

	const songs = queue.remove(start, Math.min(count, queue.length() - start));
	message.channel.send({ embeds: [wrapper.messageMenager.removed(songs)] });
}
