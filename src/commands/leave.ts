'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const settings = {
	name : "Leave",
	invokes : ["leave", "l"],
	description : "Requests bot to leave the voice channel.",
	category : "general",
	list : true
}

export const leave = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	wrapper.remove(ID);
}
