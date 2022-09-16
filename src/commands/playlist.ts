'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const settings = {
	name : "Playlist",
	invokes : ["playlist", "pl"],
	description : "If used without any arguments "
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

	usage : '<playlist id> ["add" [link] / "erase" [link] / "play" [count]]',
	category : "tracking",
	list : true
}

export const playlist = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	
	const db = wrapper.databaseMenager;
	const guild = await db.getGuild(ID);
	const playlistId = parseInt(args[0]);
	if (!playlistId || isNaN(playlistId)) {
		message.channel.send({ embeds: [wrapper.messageMenager.invalidArguments(settings)] });
		return;
	}
	
	if (guild) {

		const command = args[1];

		if (!await db.checkPlaylist(playlistId, ID)) {
			message.channel.send({ embeds: [wrapper.messageMenager.noPlaylist(playlistId.toString())] });
			return;
		}

		if (command == undefined) {
			const songs = await db.getAllSongsInPlaylist(playlistId);
			let counter = 1;

			while (songs.length > 0) {
				// divide result into messages with max 50 songs each
				const chunk = songs.splice(0, 50);
				message.channel.send({ embeds: [wrapper.messageMenager.playlist(chunk, counter)] });
				counter += 50;
			}
			return;
		}

		switch (command) {
			case "add": case "a": {
				wrapper.commandMeneger.proxyInvoke("playlistadd", ID, wrapper, message, args);
				break;
			}

			case "erase": case "e": {
				wrapper.commandMeneger.proxyInvoke("playlisterase", ID, wrapper, message, args);
				break;
			}

			case "play": case "p": {
				wrapper.commandMeneger.proxyInvoke("playlistplay", ID, wrapper, message, args);
				break;
			}
			default : {
				message.channel.send({ embeds: [wrapper.messageMenager.invalidArguments(settings)] });
				break;
			}
		}
	}
	else {
		message.channel.send({ embeds: [wrapper.messageMenager.trackingRequired()] });
	}
}
