'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const settings = {
	name : "Remove",
	invokes : ["remove", "r"],
	description : "Removes `[count]` songs from the queue starting from `<position>`, "
				+ "if no `[count]` is specified it will remove one song and if `[count]` "
				+ "exceeds the queue length it will remove all songs from `<position>` to the end of the queue.",
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
		message.channel.send({ embeds: [wrapper.messageMenager.invalidArguments(settings)] });
		return;
	}

	if (start <= 0 || start >= queue.length() || count <= 0) {
		message.channel.send({ embeds: [wrapper.messageMenager.outOfScope()]});
		return;
	}

	const songs = queue.remove(start, Math.min(count, queue.length() - start));
	message.channel.send({ embeds: [wrapper.messageMenager.removed(songs)] });
}
