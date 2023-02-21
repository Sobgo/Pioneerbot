"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";
import { getVideoId, isValidUrl } from "@/scrapper";

export const settings: CommandSettings = {
	name: "Erase",
	invokes: ["erase", "e"],
	description: "Removes song from guild history, "
		+ "if no `[link]` is specified it will try to remove currently playing song.",
	usage: "[link]",
	category: "tracking",
	list: true
}

export const erase = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const db = wrapper.databaseMenager;
	const queue = wrapper.get(guildId);
	let toRemove;

	if (await db.checkGuild(guildId)) {
		// if no argument is given, remove the currently playing song
		if (args[0] == undefined) {
			if (queue) {
				const song = queue.current;
				if (song) toRemove = getVideoId(song.url);
			}
		}
		// if argument is given, remove the song with given link
		else if (!isValidUrl(args[0])) {
			message.channel.send({ embeds: [wrapper.messageMenager.invalidArguments(settings)] });
			return;
		}
		else {
			toRemove = getVideoId(args[0]);
		}

		if (toRemove == undefined) return;

		const guild = await db.getGuild(guildId);
		const playlistId = guild?.default_playlist_id;
		if (!playlistId) return;

		const song = await db.getSong(toRemove);
		if (song == null) return;
		db.removeFromPlaylist(playlistId, toRemove);
		message.channel.send({ embeds: [wrapper.messageMenager.erased(song)] });
	}
	else {
		message.channel.send({ embeds: [wrapper.messageMenager.trackingRequired()] });
	}
}
