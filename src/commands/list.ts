'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const settings = {
	name : "List",
	invokes : ["list", "li"],
	description : "Shows a list of all guild playlists.",
	category : "tracking",
	list : true
}

export const list = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const playlists = await wrapper.databaseMenager.getAllGuildPlaylists(ID);
	const guild = await wrapper.databaseMenager.getGuild(ID);
	
	if (guild) {
		const deaultPlaylistId = guild.default_playlist_id;
		const filtered = playlists.filter((playlist) => { return playlist.id != deaultPlaylistId });
		message.channel.send({embeds: [wrapper.messageMenager.playlists(filtered)]});
	}
	else {
		message.channel.send({ embeds: [wrapper.messageMenager.trackingRequired()] });
	}
}
