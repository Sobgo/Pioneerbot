'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const settings = {
	aliases : [],
	description : "Toggles loop mode.",
	usage : "",
	category : "general",
	list : true
}

export const loop = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const queue = await wrapper.checkQueue(ID, message, true);
	if (!queue) return;
	queue.loop = !queue.loop;
	message.channel.send("loop" + (queue.loop ? " enabled" : " disabled"));
}
