'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const settings = {
	name : "Help",
	invokes : ["help", "h"],
	description : "Shows the help menu.",
	usage : "[command]",
	category : "general",
	list : true
}

export const help = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	message.channel.send({embeds: [wrapper.messageMenager.help(args[0])]});
}
