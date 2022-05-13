import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const aliases = ["hi"];
export const description = "greets you";
export const usage = "[name]"; // everything after (prefix)name that user can type

export const hello = async (ID: string, queues: Wrapper, message: Message, args: string[]) => {
	if (args[0]) {
		message.channel.send("Hi " + args[0] + "!");
	}
	else {
		message.channel.send("Hi human!");
	}
}