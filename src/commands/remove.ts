'use strict'
import { Wrapper } from "../structures";
import { Message } from "discord.js";
import { messageProvider } from "../messageProvider";

export const aliases = ["r"];

export const remove = async (ID: string, queues: Wrapper, message: Message, args: string[]) => {
	const QUEUE = queues.get(ID);
	if (!QUEUE) return;

	const start = parseInt(args[0]);
	const count = isNaN(parseInt(args[1])) ? 1 : parseInt(args[1]);
	if (isNaN(start) || start <= 0 || start >= QUEUE.length() || count < 1) return;
	const songs = QUEUE.remove(start, Math.min(count, QUEUE.length() - start));
	message.channel.send({ embeds: [messageProvider.removed(songs)] });
}
