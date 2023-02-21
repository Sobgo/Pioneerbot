"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";

export const settings: CommandSettings = {
	name: "List",
	invokes: ["list", "li"],
	description: "Shows a list of all guild playlists.",
	category: "tracking",
	list: true
}

export const list = async (guildId: string, wrapper: Wrapper, message: Message, _args: string[]) => {
	const playlists = await wrapper.databaseMenager.getAllGuildPlaylists(guildId);
	const guild = await wrapper.databaseMenager.getGuild(guildId);

	if (guild) {
		const deaultPlaylistId = guild.default_playlist_id;
		const filtered = playlists.filter((playlist) => { return playlist.id != deaultPlaylistId });
		message.channel.send({ embeds: [wrapper.messageMenager.playlists(filtered)] });
	}
	else {
		message.channel.send({ embeds: [wrapper.messageMenager.trackingRequired()] });
	}
}
