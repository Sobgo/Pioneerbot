'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";
import { checkQueue } from "../utils";

export const aliases = ["l"];

export const description = "Request bot to leave the voice channel.";
export const usage = "";

export const leave = async (ID: string, queues: Wrapper, message: Message, args: string[]) => {
	queues.remove(ID);
}
