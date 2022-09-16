'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";
import { getVideoId } from "../utils";

export const settings = {
	name : "Erase from queue",
	invokes : ["erasequeue", "eq"],
	description : "Removes song with specified queue position both from queue and guild history.",
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
				message.channel.send({embeds: [wrapper.messageMenager.invalidArguments(settings)]});
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
				message.channel.send({embeds: [wrapper.messageMenager.erased(song)]});
			}
			else {
				message.channel.send({embeds: [wrapper.messageMenager.noChannelBot()]});
			}
		}
	}
	else {
		message.channel.send({ embeds: [wrapper.messageMenager.trackingRequired()] });
	}
}
