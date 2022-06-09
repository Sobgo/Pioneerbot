'use strict';
import { exec as ytdl } from 'youtube-dl-exec';
import { secToTimestamp, ytsr, validateURL, getVideoID } from "./utils";
import { TextChannel, GuildMember, DMChannel, NewsChannel, ThreadChannel, PartialDMChannel, Client, Intents, VoiceBasedChannel, VoiceChannel }from "discord.js";
import { AudioPlayer, VoiceConnection, AudioPlayerStatus, createAudioResource, AudioPlayerState } from "@discordjs/voice";
import { messageProvider } from "./messageProvider";
import { commandHandler } from './commandHandler';

type MessageChannel = TextChannel | DMChannel | NewsChannel | ThreadChannel | PartialDMChannel | VoiceChannel;

const TEN_MINUTES = 1000*60*10;

const FLAGS = {
	output: '-', // output to stdout
	quiet: true, // quiet mode
	format: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio', // output format
	limitRate: '100K' // max download rate in bytes
}

/**
 * @param {string} url - url to Youtube video
 * @param {string} user - discord user that requested the song
 * @param {string} title - Youtube video title
 * @param {string} author - Youtube channel name
 * @param {string} duration - length of song in seconds
 */
export class Song {
	public url: string;
	public user: string | undefined;
	public title: string;
	public author: string;
	public duration: string;

	public constructor (url: string, user: string | undefined, title: string, author: string, duration: string) {
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
	public static async build (url: string, user: GuildMember | null = null): Promise<Song | null> {
		if (!validateURL(url)) throw "Url passed to Song builder is invalid!";
			try {
				const info = (await ytsr(url))[0];
				return new Song(url, user?.toString(), info.title, info.author, info.duration);
			}
			catch {
				return null;
			}
	}

	public toString () {
		return `${ this.title } | [${ secToTimestamp(this.duration) }]`;
	}

	public getUser() {
		return this.user ? this.user : "unknown";
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
	public voiceChannelName: string;
	public textChannel: MessageChannel;
	public connection: VoiceConnection;
	public player: AudioPlayer;
	public songs: Song[];
	//public tracking: boolean;
	public loop: boolean;
	public cache: Song[] | null;
	public timer: any;
	public wrapper : Wrapper | null;

	public constructor (guildId: string, voiceChannel: VoiceBasedChannel, text: MessageChannel, connection: VoiceConnection, player: AudioPlayer) {
		this.guildId = guildId;
		this.voiceChannelId = voiceChannel.id;
		this.voiceChannelName = voiceChannel.toString();
		this.textChannel = text;
		this.connection = connection;
		this.player = player;
		this.loop = false;
		this.songs = [];
		this.cache = null;
		this.wrapper = null;

		this.timer = setInterval(this.checkActivity, TEN_MINUTES, this);


		this.player.on(AudioPlayerStatus.Idle, (oldState: AudioPlayerState, newState: AudioPlayerState) => {
			console.log(newState.status);
			this.pop();
			const song = this.front();
			if(song == undefined) return;
			const stream = ytdl(song.url, FLAGS, { stdio: ['ignore', 'pipe', 'ignore'] });
			if (!stream.stdout) {
				console.warn("couldn't read stdout");
				return;
			}
			const resource = createAudioResource(stream.stdout, {});
			this.player.play(resource);
		});

		this.player.on(AudioPlayerStatus.Playing, (oldState: AudioPlayerState, newState: AudioPlayerState) => {
			console.log(newState.status);
			const song = this.front();
			if(song == undefined) throw "undefined song";
			// no property send on VoiceChannel but works, probably types need to be updated
			// @ts-ignore
			this.textChannel.send({ embeds: [messageProvider.play(song)] });
		});
	}
	
	// leave voice channel if no activity and no other users
	private async checkActivity (queue: Queue) {
		if (queue.wrapper) {

			let guild = queue.wrapper.client.guilds.cache
			? queue.wrapper.client.guilds.cache.get(queue.guildId)
			: await (queue.wrapper.client.guilds.fetch(queue.guildId));

			if (guild) {
				let usersNumber = guild.me?.voice.channel?.members.size;
				if (usersNumber && usersNumber < 2) {
					queue.wrapper.remove(queue.guildId);
				}
			}
		}
	}

	public playResource () {
		const song = this.front();
		if (song == undefined) return;
	
		const stream = ytdl(song.url, FLAGS, { stdio: ['ignore', 'pipe', 'ignore'] });
		if (!stream.stdout) return;
	
		const resource = createAudioResource(stream.stdout);
		this.player.play(resource);
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
		const id = getVideoID(searchElement.url);
		return this.songs.some((element) => { return (getVideoID(element.url) == id) });
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
 * Top level container
 */
export class Wrapper {

	private queues: Record<string, Queue> = {};
	public client: Client;
	public commandHandler = commandHandler;
	public prefix: string;

	public constructor (prifex: string) {
		this.client = new Client({
			intents: [ 
				Intents.FLAGS.GUILDS, 
				// Intents.FLAGS.GUILD_MEMBERS,
				Intents.FLAGS.GUILD_VOICE_STATES,
				Intents.FLAGS.GUILD_MESSAGES,
				Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
				Intents.FLAGS.DIRECT_MESSAGES
			]
		});
		this.prefix = prifex;
	}

	/**
	 * binds new Queue to quild id.
	 * @param {String} id - Id of a guild
	 * @param {Queue} element - new Queue
	 */
	public add (id: string, element: Queue): void {
		element.wrapper = this;
		this.queues[id] = element;
	}

	/**
	 * Removes Queue with specified id. If no Queue is found false is returned else true is returned.
	 * @param {String} id - Id of a guild
	 */
	public remove (id: string): boolean {
		if (!(id in this.queues)) return false;
		this.queues[id].connection.destroy();
		clearInterval(this.queues[id].timer);
		delete this.queues[id];
		return true;
	}

	/**
	 * Returns Queue with specified id or null if no Queue is found.
	 * @param {String} id - Id of a guild
	 */
	public get (id: string): Queue | null {
		if (!(id in this.queues)) return null;
		return this.queues[id];
	}
}
