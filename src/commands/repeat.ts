"use strict"
import { Message } from "discord.js"

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";

export const settings: CommandSettings = {
	name: "Repeat",
	invokes: ["repeat", "re"],
	description: "Executes specified [command] instantly and then every time song ends playing,"
	+ "to stop repeating commands invoke it again without [command] specified"
	+ "example usage: `!re !pr`",
	usage: "[command]",
	category: "experimental",
	list: true
}

export const repeat = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const queue = await wrapper.checkQueue(guildId, message, true);
	if (!queue) return;

	const command = args[0];
	
	if (command == "!repeat" || command == "!re") return;

	if (!command) {
		queue.repeat = null;
		message.channel.send("Repeat stopped");
		return;
	}

	message.content = args.join(" ");

	try {
		queue.repeat = message;
		message.channel.send("Repeat command set");
		await wrapper.commandManager.invoke(guildId, wrapper.prefix, wrapper, message);
	} catch (error) {
		message.channel.send("Error occured while executing command");
		if (wrapper.verbose) console.log(error);
	}
}
