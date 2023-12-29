"use strict"
import { escapeMarkdown } from "discord.js";
const { EmbedBuilder } = require("discord.js") as any; // incomplete types

import { Song as PrismaSong, Playlist } from "@prisma/client";

import { Song } from "@/structures/Song";
import { secToTimestamp, songsToList, playlistsToList } from "@/utils";
import config from "config";

const GREEN = "#2ECC71";
const RED = "#ff0000";
const BLUE = "#0099ff";
const PURPLE = "#9B59B6";

export class messageManager {
	public static help: (commandInvoke?: string | undefined) => typeof EmbedBuilder;

	public static loop (loop: boolean) {
		return new EmbedBuilder()
			.setColor(PURPLE)
			.setTitle(loop ? '**:repeat:  Loop Enabled**' : '**:repeat:  Loop Disabled**')
	}

	public static quiet (quiet: boolean) {
		return new EmbedBuilder()
			.setColor(PURPLE)
			.setTitle("**:shushing_face:  Quiet Mode " + (quiet ? "Enabled" : "Disabled") + ".**")
	}

	public static play(song?: Song | null) {
		if (song) {
			return new EmbedBuilder()
				.setColor(BLUE)
				.setTitle('**:notes:  Now Playing:**')
				.setURL(song.url)
				.setDescription("**" + escapeMarkdown(song.title) + "**")
				.addFields(
					{ name: 'Author', value: song.author, inline: true },
					{ name: 'Length', value: secToTimestamp(song.duration), inline: true },
					{ name: 'Requested by', value: song.requester, inline: true })
		} else {
			return new EmbedBuilder()
				.setColor(BLUE)
				.setTitle('**:notes:  Nothing Is Playing Right Now.**')
		}
	}

	public static invalidArguments(settings: Record<string, any>) {
		return new EmbedBuilder()
			.setColor(RED)
			.setTitle('**:x:  Invalid Argument**')
			.setDescription('At least one of the provided arguments was invalid!')
			.addFields(
				{
					name: 'Command tamplate:',
					value: `\`${config.prefix}${settings.invokes[0] ? settings.invokes[0] + " " : ""}` +
						`${settings.usage ? (settings.usage) : ""}\``,
					inline: true
				}
			)
	}

	public static outOfScope(name?: string) {
		if (name) {
			return new EmbedBuilder()
				.setColor(RED)
				.setTitle('**:x:  Out Of Scope Argument**')
				.setDescription(`\`${name}\` was out of scope!`)
		} else {
			return new EmbedBuilder()
				.setColor(RED)
				.setTitle('**:x:  Out Of Scope Argument**')
				.setDescription("One of the provided arguments was out of scope!")
		}
	}

	public static invalidCommand(commandInvoke: string) {
		return new EmbedBuilder()
			.setColor(RED)
			.setTitle('**:x:  Invalid Command**')
			.setDescription(
				'Invalid command `' + commandInvoke + '`\n' +
				`Use \`${config.prefix + "help"}\` to see the command list.`
			)
	}

	public static invalidURL(url: string) {
		return new EmbedBuilder()
			.setColor(RED)
			.setTitle('**:x:  Invalid URL**')
			.setDescription(`Invalid URL: \`${url}\``)
	}

	public static noQuery() {
		return new EmbedBuilder()
			.setColor(RED)
			.setTitle('**:x:  No Cached Query**')
			.setDescription('There was no query specifed and no cached query was found!')
	}

	public static noChannelUser(channelName?: string | undefined) {
		if (channelName) {
			return new EmbedBuilder()
				.setColor(RED)
				.setTitle('**:x:  You Need To Join the Channel**')
				.setDescription(`You need to join ${channelName} to use this command!`)
		} else {
			return new EmbedBuilder()
				.setColor(RED)
				.setTitle('**:x:  You Need To Join a Channel!**')
				.setDescription('You need to join a voice channel to use this command!')
		}
	}

	public static noChannelBot() {
		return new EmbedBuilder()
			.setColor(RED)
			.setTitle('**:x:  Bot Not In The Channel!**')
			.setDescription(`Bot is not in your voice channel. Use: \`${config.prefix + "join"}\``)
	}

	public static noResult() {
		return new EmbedBuilder()
			.setColor(RED)
			.setTitle(':x: No Result Found')
			.setDescription(
				'No result was found for the given query.\n'
				+ 'This video might not exist or is age restricted. Try different one.'
			);
	}

	public static trackingRequired() {
		return new EmbedBuilder()
			.setColor(RED)
			.setTitle(':x: Tracking Required')
			.setDescription(
				'Tracking is required to use this command. '
				+ 'Please enable tracking first by typing: `' + config.prefix + 'track enable`');
	}

	public static noPlaylist(playlistId: string) {
		return new EmbedBuilder()
			.setColor(RED)
			.setTitle(':x: No Playlist')
			.setDescription(
				'**There is no playlist with id: `' + playlistId + '` in this guild! '
				+ 'To see the list of all playlists type: \`' + config.prefix + 'list\`**'
			);
	}

	public static queueAdd(songs: Song[], position: number) {
		if (songs.length == 1) {
			const song = songs[0];
			return new EmbedBuilder()
				.setColor(PURPLE)
				.setTitle('**:memo:  Added To The Queue:**')
				.setURL(song.url)
				.setDescription("**" + escapeMarkdown(song.title) + "**")
				.addFields(
					{ name: 'Author', value: song.author, inline: true },
					{ name: 'Length', value: secToTimestamp(song.duration), inline: true },
					{ name: 'Position in queue', value: '#' + String(position + 1), inline: true })
		}
		else {
			return new EmbedBuilder()
				.setColor(PURPLE)
				.setTitle('**:memo:  Added To The Queue:**')
				.setDescription("**" + escapeMarkdown(songsToList(songs, position)) + "**")
		}
	}

	public static skipped(songs: Song[] | PrismaSong[]) {
		if (songs.length > 1) {
			return new EmbedBuilder()
				.setColor(PURPLE)
				.setTitle('**:fast_forward:  Skipped:**')
				.setDescription("**" + songs.length + " songs**")
		} else {
			return new EmbedBuilder()
				.setColor(PURPLE)
				.setTitle('**:fast_forward:  Skipped:**')
				.setDescription("**" + escapeMarkdown(songs[0].title) + "**")
		}
	}

	public static removed(songs: Song[] | PrismaSong[]) {
		if (songs.length > 1) {
			return new EmbedBuilder()
				.setColor(PURPLE)
				.setTitle('**:white_check_mark:  Removed:**')
				.setDescription("**" + songs.length + " songs**")
		} else {
			return new EmbedBuilder()
				.setColor(PURPLE)
				.setTitle('**:white_check_mark: Removed:**')
				.setDescription("**" + escapeMarkdown(songs[0].title) + "**")
		}
	}

	public static erased(song: Song | PrismaSong) {
		return new EmbedBuilder()
			.setColor(PURPLE)
			.setTitle(':white_check_mark:  Song Removed From The History')
			.setDescription('**Removed song: "' + escapeMarkdown(song.title) + '"**');
	}

	public static search(songs: Song[] | PrismaSong[]) {
		return new EmbedBuilder()
			.setColor(PURPLE)
			.setTitle('**:mag:  Results:**')
			.setDescription('**' + escapeMarkdown(songsToList(songs)) + '**');
	}

	public static queueList(songs: Song[] | PrismaSong[], position: number = 0) {
		if (songs.length == 0) {
			return new EmbedBuilder()
				.setColor(PURPLE)
				.setTitle('**:page_with_curl:  No Songs In The Queue**');
		} else {
			return new EmbedBuilder()
				.setColor(PURPLE)
				.setTitle('**:page_with_curl:  Songs In The Queue:**')
				.setDescription('**' + escapeMarkdown(songsToList(songs, position)) + '**');
		}
	}

	public static queueEmpty() {
		return new EmbedBuilder()
			.setColor(PURPLE)
			.setTitle("**:page_with_curl:  The Queue Is Empty.**");
	}

	public static shuffled() {
		return new EmbedBuilder()
			.setColor(PURPLE)
			.setTitle(':twisted_rightwards_arrows:  Queue Shuffled')
	}


	public static trackingEnabled(confirmed: boolean = false) {
		if (confirmed) {
			return new EmbedBuilder()
				.setColor(GREEN)
				.setTitle(':white_check_mark: Tracking Enabled')
		} else {
			return new EmbedBuilder()
				.setColor(GREEN)
				.setTitle('This Guild Is Not Being Tracked')
				.setDescription(
					`**To enable tracking type:** \`${config.prefix}track enable\`\n`
					+ 'Enabling tracking will make the bot save played songs to a database. '
					+ 'This history can be used by tracking commands. '
					+ 'To see all tracking comamands type: \`' + config.prefix + 'help tracking\`'
				);
		}
	}

	public static trackingDisabled(confirmed: boolean = false) {
		if (confirmed) {
			return new EmbedBuilder()
				.setColor(GREEN)
				.setTitle(':white_check_mark: Tracking Disabled')
		} else {
			return new EmbedBuilder()
				.setColor(GREEN)
				.setTitle('This Guild Is Being Tracked')
				.setDescription(
					`**To disable tracking, type:** \`${config.prefix}track disable\`\n`
					+ 'Disabling tracking will remove all guild history. '
					+ 'This action cannot be undone. All tracking commands will be disabled.'
				);
		}
	}

	public static playlist(songs: Song[] | PrismaSong[], position: number = 1) {
		if (songs.length == 0) {
			return new EmbedBuilder()
				.setColor(GREEN)
				.setTitle('**:page_with_curl:  No Songs In The Playlist*');
		} else {
			return new EmbedBuilder()
				.setColor(GREEN)
				.setTitle('**:page_with_curl:  Songs In The Playlist:**')
				.setDescription('**' + escapeMarkdown(songsToList(songs, position)) + '**');
		}
	}

	public static playlists(playlists: Playlist[]) {
		return new EmbedBuilder()
			.setColor(GREEN)
			.setTitle(':page_with_curl:  Playlists:')
			.setDescription('**' + escapeMarkdown(playlistsToList(playlists), { numberedList: true }) + '**');
	}

	public static playlistCreated(playlist: Playlist) {
		return new EmbedBuilder()
			.setColor(GREEN)
			.setTitle(':white_check_mark:  Playlist Created')
			.setDescription('**Created playlist "' + escapeMarkdown(playlist.name) + '" with id: ' + playlist.id + '**');
	}

	public static playlistRemoved(playlist: Playlist) {
		return new EmbedBuilder()
			.setColor(GREEN)
			.setTitle(':white_check_mark:  Playlist Removed')
			.setDescription('**Removed playlist "' + escapeMarkdown(playlist.name) + '"**');
	}

	public static addedToPlaylist(playlist: Playlist, song: Song | PrismaSong) {
		return new EmbedBuilder()
			.setColor(GREEN)
			.setTitle(':white_check_mark:  Song Added To The Playlist')
			.setDescription('**Added song "' + escapeMarkdown(song.title) + '" to playlist "' + escapeMarkdown(playlist.name) + '"**');
	}

	public static removedFromPlaylist(playlist: Playlist, song: Song | PrismaSong) {
		return new EmbedBuilder()
			.setColor(GREEN)
			.setTitle(':white_check_mark:  Song Removed From The Playlist')
			.setDescription('**Removed song "' + escapeMarkdown(song.title) + '" from playlist "' + escapeMarkdown(playlist.name) + '"**');
	}
}
