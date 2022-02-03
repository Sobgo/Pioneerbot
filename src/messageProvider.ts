'use strict'
import { MessageEmbed, Util } from "discord.js";
import { Song } from "./structures";
import { secToTimestamp, songsToList } from "./utils";

export const messageProvider = {
	queueAdd: (song: Song) => {
		return new MessageEmbed()
			.setColor('#ff0000')
			.setDescription("**" + Util.escapeMarkdown(song.title) + "**")
			.setTitle('**:memo:  Added to queue:**')
			.setURL(song.url)
			.addFields(
				{ name: 'Author', value: song.author, inline: true },
				{ name: 'Length', value: secToTimestamp(song.duration), inline: true },
				{ name: 'Requested by', value: song.user.toString(), inline: true })
	},

	play: (song: Song) => {
		return new MessageEmbed()
			.setColor('#0099ff')
			.setDescription("**" + Util.escapeMarkdown(song.title) + "**")
			.setTitle('**:notes:  Now Playing:**')
			.setURL(song.url)
			.addFields(
				{ name: 'Author', value: song.author, inline: true },
				{ name: 'Length', value: secToTimestamp(song.duration), inline: true },
				{ name: 'Requested by', value: song.user.toString(), inline: true })
	},

	skipped: (songs: Song[]) => {
		if (songs.length > 1) {
			return new MessageEmbed()
				.setColor('#ff0000')
				.setDescription("**" + songs.length + " songs**")
				.setTitle('**:fast_forward:  Skipped:**')
		}
		else {
			return new MessageEmbed()
				.setColor('#ff0000')
				.setDescription("**" + Util.escapeMarkdown(songs[0].title) + "**")
				.setTitle('**:fast_forward:  Skipped:**')
		}
	},

	removed: (songs: Song[]) => {
		if (songs.length > 1) {
			return new MessageEmbed()
				.setColor('#ff0000')
				.setDescription("**" + songs.length + " songs**")
				.setTitle('**:white_check_mark:  Removed:**')
		}
		else {
			return new MessageEmbed()
				.setColor('#ff0000')
				.setDescription("**" + Util.escapeMarkdown(songs[0].title) + "**")
				.setTitle('**:white_check_mark: Removed:**')
		}
	},

	search: (songs: Song[]) => {
		return new MessageEmbed()
			.setColor('#ff0000')
			.setTitle('**:mag:  Results:**')
			.setDescription('**' + Util.escapeMarkdown(songsToList(songs)) + '**')
	},

	queueList: (songs: Song[]) => {
		if (songs.length == 0) {
			return new MessageEmbed()
				.setColor('#ff0000')
				.setTitle('**:page_with_curl:  No songs in queue**')
		}
		else {
			return new MessageEmbed()
				.setColor('#ff0000')
				.setTitle('**:page_with_curl:  Songs in queue:**')
				.setDescription('**' + Util.escapeMarkdown(songsToList(songs)) + '**')
		}
	}
}