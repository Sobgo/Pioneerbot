"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";

export const settings: CommandSettings = {
	name: "Help",
	invokes: ["help", "h"],
	description: "Shows the help menu.",
	usage: "[command]",
	category: "general",
	list: true
}

export const help = async (_guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	message.channel.send({ embeds: [wrapper.messageManager.help(args[0])] });
}
