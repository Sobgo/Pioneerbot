'use strict'
import { Wrapper } from "../structures";
import { Message } from "discord.js";

export const aliases = ["l"];

export const leave = async (ID: string, queues: Wrapper, message: Message, args: string[]) => {
	const QUEUE = queues.get(ID);
	if (!QUEUE) return;
	QUEUE.connection.destroy();
	queues.remove(ID);
}
