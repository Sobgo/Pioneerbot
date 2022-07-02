'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const settings = {
	aliases : ["h"],
	description : "Show the help menu.",
	usage : "[command]",
	category : "general",
	list : true
}

export const help = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	if (args[0] && args[0] == "tracking") {
		message.channel.send({embeds: [wrapper.messageMenager.help(args[0], "tracking")]});
	}
	else {
		message.channel.send({embeds: [wrapper.messageMenager.help(args[0], "general")]});
	}
}
