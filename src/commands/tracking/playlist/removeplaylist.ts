"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";

export const settings: CommandSettings = {
	name: "Remove playlist",
	invokes: ["removeplaylist", "rp"],
	description: "Removes playlist with specified `<playlist id>`.",
	usage: "<playlist id>",
	category: "tracking",
	list: true
}

export const removeplaylist = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const guild = await wrapper.databaseMenager.getGuild(guildId);
	const id = parseInt(args[0]);
	if (!id || isNaN(id)) return;

	if (guild) {
		const playlist = await wrapper.databaseMenager.getPlaylist(id);
		if (!playlist) return;
		await wrapper.databaseMenager.removePlaylist(id);
		message.channel.send({ embeds: [wrapper.messageMenager.playlistRemoved(playlist)] });
	}
	else {
		message.channel.send({ embeds: [wrapper.messageMenager.trackingRequired()] });
	}
}