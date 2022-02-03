'use strict';
import { getBasicInfo, validateURL, getURLVideoID } from "ytdl-core";
import { exec as ytdl } from 'youtube-dl-exec'; // fix for abort error in ytdl-core
import { secToTimestamp } from "./utils";
import { TextChannel, GuildMember, DMChannel, NewsChannel, ThreadChannel, PartialDMChannel }from "discord.js";
import { AudioPlayer, VoiceConnection, AudioPlayerStatus, createAudioResource } from "@discordjs/voice";
import { messageProvider } from "./messageProvider";

type MessageChannel = TextChannel | DMChannel | NewsChannel | ThreadChannel | PartialDMChannel;

/**
 * @param {string} url - url to Youtube video
 * @param {string} user - discord user that requested the song
 * @param {string} title - Youtube video title
 * @param {string} author - Youtube channel name
 * @param {string} duration - length of song in seconds
 */
export class Song {
	public url: string;
	public user: string;
	public title: string;
	public author: string;
	public duration: string;

	private constructor (url: string, user: string, title: string, author: string, duration: string) {
		this.url = url;
		this.user = user;
		this.title = title;
		this.author = author;
		this.duration = duration;
	}

	/**
	 * @param {string} url - url to Youtube video
	 * @param {string} user - Discord user that requested song
	 */
	public static async build (url: string, user: GuildMember | null = null): Promise<Song> {
		if (!validateURL(url)) throw "Url passed to Song builder is invalid!";
		const info = (await getBasicInfo(url)).videoDetails;
		let name = (user == null) ? "random" : user.toString();

		return new Song(url, name, info.title, info.author.name, info.lengthSeconds);
	}

	public toString () {
		return `${ this.title } | [${ secToTimestamp(this.duration) }]`;
	}
}

/**
 * @param {string} guildId - id of Discord guild
 * @param {string} voiceChannelId - id of voice channel
 * @param {MessageChannel} textChannel - text channel to send annaucements
 * @param {VoiceConnection} connection - bots connection to that quild
 * @param {AudioPlayer} player - audio player for that Queue
 * @param {bool} tracking - is tracking data enabled
 * @param {bool} loop - is loop enabled
 */
export class Queue {
	public guildId: string;
	public voiceChannelId: string;
	public textChannel: MessageChannel;
	public connection: VoiceConnection;
	public player: AudioPlayer;
	public songs: Song[];
	//public tracking: boolean;
	public loop: boolean;
	public cache: Song[] | null;
	public timer: any;

	public constructor (guildId: string, voiceId: string, text: MessageChannel, connection: VoiceConnection, player: AudioPlayer, loop: boolean = false) {
		this.guildId = guildId;
		this.voiceChannelId = voiceId;
		this.textChannel = text;
		this.connection = connection;
		this.player = player;
		//this.tracking = tracking;
		this.loop = loop;
		this.songs = [];
		this.cache = null;
		//this.timer

		this.player.on('stateChange', (oldState, newState) => {
			console.log(newState.status);

			// song finished or skipped
			if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
				this.pop();
				const song = this.front();
				if(song == undefined) return;
				const stream = ytdl(song.url, {
					output: '-',
					quiet: true,
					format: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
					limitRate: '100K'
				}, { stdio: ['ignore', 'pipe', 'ignore'] });
				if (!stream.stdout) {
					console.log("ups");
					return;
				}
				const resource = createAudioResource(stream.stdout);
				this.player.play(resource);
			}
			// song started
			else if (newState.status === AudioPlayerStatus.Playing && oldState.status === AudioPlayerStatus.Buffering) {
				const song = this.front();
				if(song == undefined) throw "undefined song";

				this.textChannel.send({ embeds: [messageProvider.play(song)] });
			}
		});
	}

	/**
	 * Returns first song form a Queue. If Queue has no songs, undefined is returned.
	 */
	public front (): Song | undefined {
		if (this.songs.length > 0) {
			return this.songs[0];
		}
		return undefined;
	}

	/**
	 * Returns a number of songs in Queue.
	 */
	public length (): number {
		return this.songs.length;
	}

	/**
	 * Removes first song form a Queue and returns it.
	 * If Queue has no songs, undefined is returned and Queue is not modified.
	 */
	public pop (): Song | undefined {
		return this.songs.shift();
	}

	/**
	 * Appends songs to the end of a Queue and returns the new length of the Queue.
	 * @param {...Song} items - New songs to add to the Queue.
	 */
	public push (...items: Song[]): number {
		return this.songs.push(...items);
	}

	/**
	 * Adds songs to the Queue from specified position inclusive and returns new lenght of the Queue.
	 * @param {Number} start - Position in a Queue form which to start adding songs.
	 * @param  {...Song} items - New songs to add to the Queue.
	 */
	public add (start: number, ...items: Song[]): number {
		this.songs.splice(start, 0, ...items);
		return this.songs.length;
	}

	/**
	 * Removes songs form Queue and returns an array containing the songs that were removed.
	 * @param {Number} start - Position in a Queue form which to start removing songs.
	 * @param {Number} count - The number of songs to remove.
	 */
	public remove (start: number, count: number = 1): Song[] {
		return this.songs.splice(start, count);
	}

	/**
	 * Determines whether the Queue contains certain song, returning true or false appropriately.
	 * @param {Song} searchElement 
	 */
	public contains (searchElement: Song): boolean {
		const id = getURLVideoID(searchElement.url);
		return this.songs.some((element) => { return (getURLVideoID(element.url) == id) });
	}

	/**
	 * Returns a string representation of the Queue.
	 * Note: first song is not returned since its currently playing song.
	 * @param {Number} [count] - Number of songs to list. Default is 10.
	 * @example console.log(ServerQueue.toString()) // Logs:
	 * // 1. The title of the first song [duration]
	 * // 2. The title of the second song [duration]
	 * // ...
	 */
	public toString (count: number = 10): string {
		return this.songs.slice(1, count+1).map((element, index) => {
			return `${index + 1}. ${element.toString()}` 
		}).join('\n');
	}
}

/**
 * Top level container far all Queues
 */
export class Wrapper {

	private wrapper: Record<string, Queue> = {};

	/**
	 * binds new Queue to quild id.
	 * @param {String} id - Id of a guild
	 * @param {Queue} element - new Queue
	 */
	public add (id: string, element: Queue): void {
		this.wrapper[id] = element;
	}

	/**
	 * Removes Queue with specified id. If no Queue is found false is returned else true is returned.
	 * @param {String} id - Id of a guild
	 */
	public remove (id: string): boolean {
		if (!(id in this.wrapper)) return false;
		delete this.wrapper[id];
		return true;
	}

	/**
	 * Returns Queue with specified id.
	 * @param {String} id - Id of a guild
	 */
	public get (id: string): Queue | null {
		if (!(id in this.wrapper)) return null;
		return this.wrapper[id];
	}
}
