'use strict'
import { Message } from "discord.js";
import { messageProvider } from "../messageProvider";
import { Wrapper } from "../structures";

export const aliases = ["h"];

export const description = "Show the help menu.";
export const usage = "[command]";

export const help = async (ID: string, queues: Wrapper, message: Message, args: string[]) => {
	message.channel.send({embeds: [messageProvider.help(args[0])]});
}
