"use strict"

import { 
	AudioPlayer, 
	AudioPlayerState, 
	AudioPlayerStatus, 
	createAudioPlayer, 
	createAudioResource, 
	entersState, 
	joinVoiceChannel, 
	VoiceConnection, 
	VoiceConnectionStatus
} from "@discordjs/voice";
import { ChannelType, Message, VoiceBasedChannel, TextBasedChannel } from "discord.js";
import { exec as ytdl } from "youtube-dl-exec";

import { Wrapper } from "@/structures/Wrapper";
import { Queue } from "@/structures/Queue";
import { Song } from "@/structures/Song";
import { getVideoId } from "@/scrapper";
import config from 'config';

const FIVE_MINUTES = 1000 * 60 * 5;
const FLAGS = config.ytdlFlags;

export class GuildQueue extends Queue {
	public guildId: string;
	public textChannel: TextBasedChannel;
	public player: AudioPlayer;
	public wrapper: Wrapper;

	public voiceChannelId: string | null;
	public voiceChannelName: string | null;

	public connection: VoiceConnection | null;

	public cachedResult: Song[] = [];

	public quiet: boolean = false;
	public loop: boolean = false;
	public tracking: boolean = false;

	public repeat: Message | null = null;

	public inactivityTimer: any;

	public constructor(guildId: string, textChannel: TextBasedChannel, wrapper: Wrapper) {
		super();

		this.guildId = guildId;
		this.voiceChannelId = null;
		this.voiceChannelName = null;
		this.textChannel = textChannel;
		this.connection = null;
		this.wrapper = wrapper;

		this.inactivityTimer = setInterval(this.checkActivity, FIVE_MINUTES, this);

		this.player = createAudioPlayer();

		// triggers when song ends
		this.player.on(AudioPlayerStatus.Idle, (_oldState: AudioPlayerState, newState: AudioPlayerState) => {
			if (this.wrapper.verbose) console.log(`Guild: ${this.guildId}, Status: ${newState.status}`);

			if (!this.loop) {
				if (this.empty()) this.invoke();
				this.next();
			}
			const song = this.current;
			if (!song) return;
			this.playResource(song);
		});

		// triggers when song starts
		this.player.on(AudioPlayerStatus.Playing, (_oldState: AudioPlayerState, newState: AudioPlayerState) => {
			if (this.wrapper.verbose) console.log(`Guild: ${this.guildId}, Status: ${newState.status}`);

			const song = this.current;
			if (song == undefined) throw "undefined song";
			if (!this.quiet) this.textChannel.send({ embeds: [this.wrapper.messageManager.play(song)] });
		});

		if (this.wrapper.verbose) console.log(`Created new queue for Guild: ${guildId}`);
	}

	/**
	 * Connects bot to a voice channel.
	 */
	public createConnection = async (voiceChannel: VoiceBasedChannel) => {
		const connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: this.guildId,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
			selfDeaf: false
		});

		// hotfix for https://github.com/discordjs/discord.js/issues/9185
		const networkStateChangeHandler = (_oldNetworkState: any, newNetworkState: any) => {
			const newUdp = Reflect.get(newNetworkState, 'udp');
			clearInterval(newUdp?.keepAliveInterval);
		}

		connection.on('stateChange', (oldState, newState) => {
			Reflect.get(oldState, 'networking')?.off('stateChange', networkStateChangeHandler);
			Reflect.get(newState, 'networking')?.on('stateChange', networkStateChangeHandler);
		});

		this.player.stop();

		try {
			await entersState(connection, VoiceConnectionStatus.Ready, 10e3);
			this.voiceChannelId = voiceChannel.id;
			this.voiceChannelName = voiceChannel.toString();
		}
		catch (err) {
			connection.destroy();
			this.connection = null;
		}

		connection.subscribe(this.player);
		if (this.wrapper.verbose) console.log(`Connection created for Guild: ${this.guildId} in voice channel: ${voiceChannel.id}`);

		this.connection = connection;
		return this.connection;
	}

	public playResource(song: Song) {
		if (!this.connection) return;

		if (this.tracking) {
			this.addToDatabase(song);
		}

		const stream = ytdl(song.url, FLAGS, { stdio: ["ignore", "pipe", "ignore"] });
		if (!stream.stdout) return;
		const resource = createAudioResource(stream.stdout);
		this.player.play(resource);
	}

	private async addToDatabase(song: Song) {
		// add song to database
		const db = this.wrapper.databaseManager;

		if (this.tracking) {
			const guild = await db.getGuild(this.guildId);

			if (guild) {
				const playlistId = guild.default_playlist_id;

				if (playlistId) {
					await db.addToPlaylist(playlistId, song);
					await db.updateSongPLaytime(getVideoId(song.url), playlistId);
				}
			}
		}
	}

	private async checkActivity(queue: GuildQueue) {

		const client = queue.wrapper.client;
		const id = queue.voiceChannelId;

		if (id) {
			const channel = client.channels.cache.get(id) ?
				client.channels.cache.get(id) :
				await client.channels.fetch(id);

			if (!channel || !(channel.type === ChannelType.GuildVoice)) return;

			// check how many users in voice channel
			let count = 0;

			channel.members.map((member) => {
				if (!member.user.bot) count += 1;
			});

			if (count != 0) return;
			if (this.wrapper.verbose) console.log(`No users in voice channel: ${channel.id} in Guild: ${queue.guildId}, disconnecting...`);

		}
		// if no voice channel connected or no users in voice channel remove queue
		queue.wrapper.remove(queue.guildId);
	}

	private async invoke() {
		if (this.repeat) await this.wrapper.commandManager.invoke(this.guildId, this.wrapper.prefix, this.wrapper, this.repeat);
	}
}
