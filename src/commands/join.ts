'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const settings = {
	aliases : ["j"],
	description : "Request bot to join a voice channel.",
	usage : "",
	category : "general",
	list : true
}

export const join = async (ID: string, wrapper: Wrapper, message: Message, args:string[] = []) => {
	await wrapper.createConnection(ID, message);
};
