'use strict'
import { MessageEmbed, Util } from "discord.js";
import { Song } from "./structures";
import { secToTimestamp, songsToList } from "./utils";
import config from '../config.json';

export const messageProvider: Record<string, any> = {
	invalidArguments: (commandName: string, aliases: string[], usage: string) => {
		return new MessageEmbed()
			.setColor('#ff0000')
			.setTitle('**:x:  Invalid Argument**')
			.setDescription("One of provided arguments was invalid")
			.addField("Usage", "`" + config.prefix + commandName + (aliases ? " (" + aliases + ")" : "") + (usage ? " " + usage : "") + "`");
	},

	outOfScope: () => {
		return new MessageEmbed()
			.setColor('#ff0000')
			.setTitle('**:x:  Out of scope argument**')
			.setDescription("One of provided arguments was out of scope");
	},

	invalidCommand: (commandName: string) => {
		return new MessageEmbed()
			.setColor('#ff0000')
			.setTitle('**:x:  Invalid Command**')
			.setDescription(
				`Invalid command ${commandName.length == 0 ? "" : "`" +  commandName + "`" }` +
				`, use \`${config.prefix + "help"}\` to see command list`
			);
	},

	noCache: () => {
		return new MessageEmbed()
			.setColor('#ff0000')
			.setTitle('**:x:  No cached query**')
			.setDescription('There was no query specifed and no cached query was found.');
	},

	noChannel: (channelName: string) => {
		if (channelName) {
			return new MessageEmbed()
				.setColor('#ff0000')
				.setTitle('**:x:  You need to join channel**')
				.setDescription(`You need to join ${channelName} to use this command.`);
		}
		else {
			return new MessageEmbed()
				.setColor('#ff0000')
				.setTitle('**:x:  You need to join channel**')
				.setDescription('You need to join a voice channel to use this command.');
		}
	},

	noBotChannel: () => {
		return new MessageEmbed()
			.setColor('#ff0000')
			.setTitle('**:x:  Bot not in a channel**')
			.setDescription(`Bot is not in a channel. use \`${config.prefix + "join"}\``);
	},

	queueAdd: (song: Song, position: Number) => {
		return new MessageEmbed()
			.setColor('#ff0000')
			.setDescription("**" + Util.escapeMarkdown(song.title) + "**")
			.setTitle('**:memo:  Added to queue:**')
			.setURL(song.url)
			.addFields(
				{ name: 'Author', value: song.author, inline: true },
				{ name: 'Length', value: secToTimestamp(song.duration), inline: true },
				{ name: 'Position in queue', value: '#' + String(position), inline: true })
	},

	play: (song: Song | undefined) => {
		if (song) {
			return new MessageEmbed()
				.setColor('#0099ff')
				.setDescription("**" + Util.escapeMarkdown(song.title) + "**")
				.setTitle('**:notes:  Now Playing:**')
				.setURL(song.url)
				.addFields(
					{ name: 'Author', value: song.author, inline: true },
					{ name: 'Length', value: secToTimestamp(song.duration), inline: true },
					{ name: 'Requested by', value: song.getUser(), inline: true });
		}
		else {
			return new MessageEmbed()
			.setColor('#0099ff')
			.setTitle('**:notes:  Nothing is playing right now.**');
		}
	},

	skipped: (songs: Song[]) => {
		if (songs.length > 1) {
			return new MessageEmbed()
				.setColor('#ff0000')
				.setDescription("**" + songs.length + " songs**")
				.setTitle('**:fast_forward:  Skipped:**');
		}
		else {
			return new MessageEmbed()
				.setColor('#ff0000')
				.setDescription("**" + Util.escapeMarkdown(songs[0].title) + "**")
				.setTitle('**:fast_forward:  Skipped:**');
		}
	},

	removed: (songs: Song[]) => {
		if (songs.length > 1) {
			return new MessageEmbed()
				.setColor('#ff0000')
				.setDescription("**" + songs.length + " songs**")
				.setTitle('**:white_check_mark:  Removed:**');
		}
		else {
			return new MessageEmbed()
				.setColor('#ff0000')
				.setDescription("**" + Util.escapeMarkdown(songs[0].title) + "**")
				.setTitle('**:white_check_mark: Removed:**');
		}
	},

	search: (songs: Song[]) => {
		return new MessageEmbed()
			.setColor('#ff0000')
			.setTitle('**:mag:  Results:**')
			.setDescription('**' + Util.escapeMarkdown(songsToList(songs)) + '**');
	},

	queueList: (songs: Song[]) => {
		if (songs.length == 0) {
			return new MessageEmbed()
				.setColor('#ff0000')
				.setTitle('**:page_with_curl:  No songs in queue**');
		}
		else {
			return new MessageEmbed()
				.setColor('#ff0000')
				.setTitle('**:page_with_curl:  Songs in queue:**')
				.setDescription('**' + Util.escapeMarkdown(songsToList(songs)) + '**');
		}
	},

	noResult: () => {
		return new MessageEmbed()
			.setColor('#ff0000')
			.setTitle(':x: No result found')
			.setDescription('No result was found for a given query. This video might not exist or is age restricted. Try different one.');
	}
}
