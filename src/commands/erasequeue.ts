'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";
import { getVideoId } from "../utils";

export const settings = {
	aliases : ["eq"],
	description : "removes song with given position form queue and permanently removes it from guild history",
	usage : "<position>",
	category : "tracking",
	list : true
}

export const erasequeue = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const db = wrapper.databaseMenager;
	const queue = wrapper.get(ID);

	if (await db.checkGuild(ID)) {
		if (queue) {
			const position = parseInt(args[0]);

			if (isNaN(position)) {
				message.channel.send({embeds: [wrapper.messageMenager.invalidArguments("erasequeue", settings.aliases, settings.usage)]});
				return;
			}
				
			if (position < 1 || position >= queue.length()) {
				message.channel.send({embeds: [wrapper.messageMenager.outOfScope()]});
				return;
			}

			const song = queue.get(position);

			const guild = await db.getGuild(ID);
			const playlistId = guild?.default_playlist_id;
			if (!playlistId) return;

			if (song) {
				const ytid = getVideoId(song.url);
				db.removeFromPlaylist(playlistId, ytid);
				queue.remove(position);
				message.channel.send("removed \`" + ytid  + "\` from \`" + playlistId + "\`");
			}
			else {
				message.channel.send({embeds: [wrapper.messageMenager.noBotChannel()]});
			}
		}
	}
	else {
		message.channel.send({ embeds: [wrapper.messageMenager.trackingRequired()] });
	}
}