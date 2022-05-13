'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";
import { messageProvider } from "../messageProvider";

export const aliases = ["r"];

export const description = "Remove songs from the queue starting from `<position>` and ending at\n `<position> + [count]`, "
+ "if count is not specified, it will remove 1 song and if count exceeds the queue length, it will remove all songs.";

export const usage = "<position> [count]";

export const remove = async (ID: string, queues: Wrapper, message: Message, args: string[]) => {
	const QUEUE = queues.get(ID);
	if (!QUEUE) return;

	const start = parseInt(args[0]);
	const count = args[1] ? parseInt(args[1]) : 1;

	if (isNaN(start) || isNaN(count)) {
		message.channel.send({ embeds: [messageProvider.invalidArguments("remove", aliases, usage)] });
		return;
	}

	if (start <= 0 || count <= 0 || start + count > QUEUE.length()) {
		message.channel.send({ embeds: [messageProvider.outOfScope()]});
		return;
	}

	const songs = QUEUE.remove(start, Math.min(count, QUEUE.length() - start));
	message.channel.send({ embeds: [messageProvider.removed(songs)] });
}
