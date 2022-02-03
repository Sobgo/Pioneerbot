'use strict'
import { Wrapper } from "../structures";
import { Message } from "discord.js";
import { messageProvider } from "../messageProvider";

export const aliases = ["q"];

export const queue = async (ID: string, queues: Wrapper, message: Message, args: string[]) => {
	const QUEUE = queues.get(ID);
	if (!QUEUE) return;
	message.channel.send({embeds: [messageProvider.queueList(QUEUE.songs.slice(1))]});
}
