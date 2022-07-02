'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const settings = {
	aliases : ["l"],
	description : "Request bot to leave the voice channel.",
	usage : "",
	category : "general",
	list : true
}

export const leave = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	wrapper.remove(ID);
}
