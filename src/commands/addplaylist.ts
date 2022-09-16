'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const settings = {
	name : "Add playlist",
	invokes : ["addplaylist", "ap"],
	description : "Creates a new playlist.",
	usage : "<playlist name>",
	category : "tracking",
	list : true
}

export const addplaylist = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const guild = await wrapper.databaseMenager.getGuild(ID);
	const name = args.map((element) => { return element }).join(' ');
	if (!name) return;
	
	if (guild) {
		const playlist = await wrapper.databaseMenager.addPlaylist(ID, name);
		if (playlist) {
			message.channel.send({ embeds: [wrapper.messageMenager.playlistCreated(playlist)] });
		}
	}
	else {
		message.channel.send({ embeds: [wrapper.messageMenager.trackingRequired()] });
	}
}
