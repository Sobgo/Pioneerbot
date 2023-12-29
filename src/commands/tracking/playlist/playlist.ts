"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";

export const settings: CommandSettings = {
	name: "Playlist",
	invokes: ["playlist", "pl"],
	description: "If used without any arguments "
		+ "it shows a list of all songs in playlist with specified `<playlist id>`.\n\n"

		+ "If used with `\"add\" [link]` it adds song from `[link]` "
		+ "to the playlist with specified `<playlist id>` "
		+ "and if `[link]` is not specified then it will try to add currently playing song.\n\n"

		+ "If used with `\"erase\" [link]` it removes song with `[link]` "
		+ "from the playlist with specified `<playlist id>` "
		+ "and if `[link]` is not specified then it will try to remove currently playing song.\n\n"

		+ "If used with `\"play\" [count]` it will add `[count]` random songs "
		+ "from the playlist with specified `<playlist id>` "
		+ "and if `[count]` is not specified then it will add one song.",
	usage: '<playlist id> ["add" [link] | "erase" [link] | "play" [count]]',
	category: "tracking",
	list: true
}

export const playlist = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const db = wrapper.databaseManager;
	const guild = await db.getGuild(guildId);
	const playlistId = parseInt(args[0]);

	if (!playlistId || isNaN(playlistId)) {
		message.channel.send({ embeds: [wrapper.messageManager.invalidArguments(settings)] });
		return;
	}

	if (guild) {
		const command = args[1];

		if (!await db.checkPlaylist(playlistId, guildId)) {
			message.channel.send({ embeds: [wrapper.messageManager.noPlaylist(playlistId.toString())] });
			return;
		}

		if (command == undefined) {
			const songs = await db.getAllSongsInPlaylist(playlistId);
			let counter = 0;

			while (songs.length > 0) {
				// divide result into messages with max 50 songs each
				const chunk = songs.splice(0, 50);
				message.channel.send({ embeds: [wrapper.messageManager.playlist(chunk, counter)] });
				counter += 50;
			}
			return;
		}

		switch (command) {
			case "add": case "a": {
				wrapper.commandManager.proxyInvoke("playlistadd", guildId, wrapper, message, args);
				break;
			}

			case "erase": case "e": {
				wrapper.commandManager.proxyInvoke("playlisterase", guildId, wrapper, message, args);
				break;
			}

			case "play": case "p": {
				wrapper.commandManager.proxyInvoke("playlistplay", guildId, wrapper, message, args);
				break;
			}
			default: {
				message.channel.send({ embeds: [wrapper.messageManager.invalidArguments(settings)] });
				break;
			}
		}
	} else {
		message.channel.send({ embeds: [wrapper.messageManager.trackingRequired()] });
	}
}
