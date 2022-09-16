'use strict'
import { MessageEmbed, Util } from "discord.js";
import { Song } from "./structures";
import { secToTimestamp, songsToList, playlistsToList } from "./utils";
import config from '../config.json';
import { Song as PrismaSong, Playlist } from "@prisma/client";

const GREEN = "#2ECC71";
const RED = "#ff0000";
const BLUE = "#0099ff";
const PURPLE = "#9B59B6";

export class messageMenager {
	public static help: (commandInvoke?: string | undefined) => MessageEmbed;

	public static play (song?: Song | undefined) {
		if (song) {
			return new MessageEmbed()
				.setColor(BLUE)
				.setTitle('**:notes:  Now Playing:**')
				.setURL(song.url)
				.setDescription("**" + Util.escapeMarkdown(song.title) + "**")
				.addFields(
					{ name: 'Author', value: song.author, inline: true },
					{ name: 'Length', value: secToTimestamp(song.duration), inline: true },
					{ name: 'Requested by', value: song.getUser(), inline: true })
		}
		else {
			return new MessageEmbed()
				.setColor(BLUE)
				.setTitle('**:notes:  Nothing Is Playing Right Now.**')
		}
	}

	public static invalidArguments (settings: Record<string, any>) {
		return new MessageEmbed()
			.setColor(RED)
			.setTitle('**:x:  Invalid Argument**')
			.setDescription('At least one of provided arguments was invalid!')
			.addField(
				'Command tamplate:',
				`\`${config.prefix}${settings.invokes[0] ? settings.invokes[0] + " " : ""}` +
				`${settings.usage ? (settings.usage) : ""}\``
			)
	}

	public static outOfScope () {
		return new MessageEmbed()
			.setColor(RED)
			.setTitle('**:x:  Out Of Scope Argument**')
			.setDescription("One of provided arguments was out of scope!")
	}

	public static invalidCommand (commandInvoke: string) {
		return new MessageEmbed()
			.setColor(RED)
			.setTitle('**:x:  Invalid Command**')
			.setDescription(
				'Invalid command `' + commandInvoke + '`\n' +
				`Use \`${config.prefix + "help"}\` to see command list.`
			)
	}

	public static invalidURL (url: string) {
		return new MessageEmbed()
			.setColor(RED)
			.setTitle('**:x:  Invalid URL**')
			.setDescription(`Invalid URL: \`${url}\``)
	}

	public static noCache () {
		return new MessageEmbed()
			.setColor(RED)
			.setTitle('**:x:  No Cached Query**')
			.setDescription('There was no query specifed and no cached query was found!.')
	}

	public static noChannelUser (channelName?: string | undefined) {
		if (channelName) {
			return new MessageEmbed()
				.setColor(RED)
				.setTitle('**:x:  You Need To Join Channel**')
				.setDescription(`You need to join ${channelName} to use this command!`)
		}
		else {
			return new MessageEmbed()
				.setColor(RED)
				.setTitle('**:x:  You Need To Join Channel!**')
				.setDescription('You need to join a voice channel to use this command!')
		}
	}

	public static noChannelBot () {
		return new MessageEmbed()
			.setColor(RED)
			.setTitle('**:x:  Bot Not In The Channel!**')
			.setDescription(`Bot is not in your voice channel. Use: \`${config.prefix + "join"}\``)
	}

	public static noResult () {
		return new MessageEmbed()
			.setColor(RED)
			.setTitle(':x: No Result Found')
			.setDescription(
				'No result was found for the given query.\n'
				+ 'This video might not exist or is age restricted. Try different one.'
			);
	}

	public static trackingRequired () {
		return new MessageEmbed()
			.setColor(RED)
			.setTitle(':x: Tracking Required')
			.setDescription(
				'Tracking is required to use this command. '
				+ 'Please enable tracking first by typing: `' + config.prefix + 'tracking enable`');
	}

	public static noPlaylist (playlistId: string) {
		return new MessageEmbed()
			.setColor(RED)
			.setTitle(':x: No Playlist')
			.setDescription(
				'**There is no playlist with id: `' + playlistId + '` in this guild! '
				+ 'To see list of all playlist type: \`' + config.prefix + 'list\`**'
			);
	}

	public static queueAdd (songs: Song[], position: number) {
		if (songs.length == 1) {
			const song = songs[0];
			return new MessageEmbed()
				.setColor(PURPLE)
				.setTitle('**:memo:  Added To Queue:**')
				.setURL(song.url)
				.setDescription("**" + Util.escapeMarkdown(song.title) + "**")
				.addFields(
					{ name: 'Author', value: song.author, inline: true },
					{ name: 'Length', value: secToTimestamp(song.duration), inline: true },
					{ name: 'Position in queue', value: '#' + String(position), inline: true })
		}
		else {
			return new MessageEmbed()
				.setColor(PURPLE)
				.setTitle('**:memo:  Added To Queue:**')
				.setDescription("**" + Util.escapeMarkdown(songsToList(songs, position)) + "**")
		}
	}

	public static skipped (songs: Song[] | PrismaSong[]) {
		if (songs.length > 1) {
			return new MessageEmbed()
				.setColor(PURPLE)
				.setTitle('**:fast_forward:  Skipped:**')
				.setDescription("**" + songs.length + " songs**")
		}
		else {
			return new MessageEmbed()
				.setColor(PURPLE)
				.setTitle('**:fast_forward:  Skipped:**')
				.setDescription("**" + Util.escapeMarkdown(songs[0].title) + "**")
		}
	}

	public static removed (songs: Song[] | PrismaSong[]) {
		if (songs.length > 1) {
			return new MessageEmbed()
				.setColor(PURPLE)
				.setTitle('**:white_check_mark:  Removed:**')
				.setDescription("**" + songs.length + " songs**")
		}
		else {
			return new MessageEmbed()
				.setColor(PURPLE)
				.setTitle('**:white_check_mark: Removed:**')
				.setDescription("**" + Util.escapeMarkdown(songs[0].title) + "**")
		}
	}

	public static erased (song: Song | PrismaSong) {
		return new MessageEmbed()
			.setColor(PURPLE)
			.setTitle(':white_check_mark:  Song Removed From History')
			.setDescription('**Removed song "' + Util.escapeMarkdown(song.title));
	}

	public static search (songs: Song[] | PrismaSong[]) {
		return new MessageEmbed()
			.setColor(PURPLE)
			.setTitle('**:mag:  Results:**')
			.setDescription('**' + Util.escapeMarkdown(songsToList(songs)) + '**');
	}

	public static queueList (songs: Song[] | PrismaSong[], position: number = 1) {
		if (songs.length == 0) {
			return new MessageEmbed()
				.setColor(PURPLE)
				.setTitle('**:page_with_curl:  No Songs In Queue**');
		}
		else {
			return new MessageEmbed()
				.setColor(PURPLE)
				.setTitle('**:page_with_curl:  Songs In Queue:**')
				.setDescription('**' + Util.escapeMarkdown(songsToList(songs, position)) + '**');
		}
	}

	public static shuffled () {
		return new MessageEmbed()
			.setColor(PURPLE)
			.setTitle(':twisted_rightwards_arrows:  Queue Shuffled')
	}


	public static trackingEnabled (confirmed: boolean = false) {
		if (confirmed) {
			return new MessageEmbed()
				.setColor(GREEN)
				.setTitle(':white_check_mark: Tracking Enabled')
		}
		else {
			return new MessageEmbed()
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

	public static trackingDisabled (confirmed: boolean = false) {
		if (confirmed) {
			return new MessageEmbed()
				.setColor(GREEN)
				.setTitle(':white_check_mark: Tracking Disabled')
		}
		else {
			return new MessageEmbed()
				.setColor(GREEN)
				.setTitle('This Guild Is Being Tracked')
				.setDescription(
					`**To disable tracking, type:** \`${config.prefix}track disable\`\n`
					+ 'Disabling tracking will remove all guild history. '
					+ 'This action is permanent and cannot be undone. All tracking commands will be disabled.'
				);
		}
	}

	public static playlist (songs: Song[] | PrismaSong[], position: number = 1) {
		if (songs.length == 0) {
			return new MessageEmbed()
				.setColor(GREEN)
				.setTitle('**:page_with_curl:  No Songs In Playlist*');
		}
		else {
			return new MessageEmbed()
				.setColor(GREEN)
				.setTitle('**:page_with_curl:  Songs In Playlist:**')
				.setDescription('**' + Util.escapeMarkdown(songsToList(songs, position)) + '**');
		}
	}

	public static playlists (playlists: Playlist[]) {
		return new MessageEmbed()
			.setColor(GREEN)
			.setTitle(':page_with_curl:  Playlists:')
			.setDescription('**' + Util.escapeMarkdown(playlistsToList(playlists)) + '**');
	}

	public static playlistCreated (playlist: Playlist) {
		return new MessageEmbed()
			.setColor(GREEN)
			.setTitle(':white_check_mark:  Playlist Created')
			.setDescription('**Created playlist "' + Util.escapeMarkdown(playlist.name) + '" with id: ' + playlist.id + '**');
	}

	public static playlistRemoved (playlist: Playlist) {
		return new MessageEmbed()
			.setColor(GREEN)
			.setTitle(':white_check_mark:  Playlist Removed')
			.setDescription('**Removed playlist "' + Util.escapeMarkdown(playlist.name) + '"**');
	}

	public static addedToPlaylist (playlist: Playlist, song: Song | PrismaSong) {
		return new MessageEmbed()
			.setColor(GREEN)
			.setTitle(':white_check_mark:  Song Added To Playlist')
			.setDescription('**Added song "' + Util.escapeMarkdown(song.title) + '" to playlist "' + Util.escapeMarkdown(playlist.name) + '"**');
	}

	public static removedFromPlaylist (playlist: Playlist, song: Song | PrismaSong) {
		return new MessageEmbed()
			.setColor(GREEN)
			.setTitle(':white_check_mark:  Song Removed From Playlist')
			.setDescription('**Removed song "' + Util.escapeMarkdown(song.title) + '" from playlist "' + Util.escapeMarkdown(playlist.name) + '"**');
	}
}
