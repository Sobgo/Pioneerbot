"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";

export const settings: CommandSettings = {
	name: "Add playlist",
	invokes: ["addplaylist", "ap"],
	description: "Creates a new playlist.",
	usage: "<playlist name>",
	category: "tracking",
	list: true
}

export const addplaylist = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const guild = await wrapper.databaseManager.getGuild(guildId);
	const name = args.map((element) => { return element }).join(' ');
	if (!name) return;

	if (guild) {
		const playlist = await wrapper.databaseManager.addPlaylist(guildId, name);
		if (playlist) {
			message.channel.send({ embeds: [wrapper.messageManager.playlistCreated(playlist)] });
		}
	}
	else {
		message.channel.send({ embeds: [wrapper.messageManager.trackingRequired()] });
	}
}
