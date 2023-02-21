"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";

export const settings: CommandSettings = {
	name: "Leave",
	invokes: ["leave", "l"],
	description: "Requests bot to leave the voice channel.",
	category: "general",
	list: true
}

export const leave = async (guildId: string, wrapper: Wrapper, _message: Message, _args: string[]) => {
	wrapper.remove(guildId);
}
