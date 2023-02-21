"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";

export const settings: CommandSettings = {
	name: "Join",
	invokes: ["join", "j"],
	description: "Requests bot to join a voice channel.",
	category: "general",
	list: true
}

export const join = async (guildId: string, wrapper: Wrapper, message: Message, _args: string[]) => {
	await wrapper.checkQueue(guildId, message, true);
};
