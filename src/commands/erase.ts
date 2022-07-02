'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";
import { getVideoId, validateURL } from "../utils";

export const settings = {
	aliases : ["e"],
	description : "permanently removes song from guild history, if no `[link]` specified it will remove curently playing song",
	usage : "[link]",
	category : "tracking",
	list : true
}

export const erase = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const db = wrapper.databaseMenager;
	const queue = wrapper.get(ID);
	let toRemove;

	if (await db.checkGuild(ID)) {
		// if no argument is given, remove the currently playing song
		if (!args[0]) {
			if (queue) {
				const song = queue.front();
				if (song) toRemove = getVideoId(song.url);
			}
		}
		// if argument is given, remove the song with given link
		else if (!validateURL(args[0])) {
			message.channel.send({ embeds: [wrapper.messageMenager.invalidArguments("erase", settings.aliases, settings.usage)] });
			return;
		}
		else {
			toRemove = getVideoId(args[0]);
		}
		
		if (toRemove == undefined) return;

		const guild = await db.getGuild(ID);
		const playlistId = guild?.default_playlist_id;
		if (!playlistId) return;

		db.removeFromPlaylist(playlistId, toRemove);
		message.channel.send("removed \`" + toRemove  + "\` from \`" + playlistId + "\`");
	}
	else {
		message.channel.send({ embeds: [wrapper.messageMenager.trackingRequired()] });
	}
}