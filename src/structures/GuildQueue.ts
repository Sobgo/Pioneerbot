"use strict";
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
import { ChannelType, VoiceBasedChannel } from "discord.js";
import { exec as ytdl } from "youtube-dl-exec";

import { Wrapper } from "@/structures/Wrapper";
import { Queue } from "@/structures/Queue";
import { Song } from "@/structures/Song";
import { MessageChannel } from "@/structures/types";
import { getVideoId } from "@/scrapper";
import config from 'config';

const FIVE_MINUTES = 1000 * 60 * 5;
const FLAGS = config.ytdlFlags;

export class GuildQueue extends Queue {
	public guildId: string;
	public textChannel: MessageChannel;
	public player: AudioPlayer;
	public wrapper: Wrapper;

	public voiceChannelId: string | null;
	public voiceChannelName: string | null;

	public connection: VoiceConnection | null;

	public cachedResult: Song[] = [];

	public loop: boolean = false;
	public tracking: boolean = false;

	public timer: any;

	public constructor(guildId: string, textChannel: MessageChannel, wrapper: Wrapper) {
		super();

		console.log(`Created new queue for guild ${guildId}`);

		this.guildId = guildId;
		this.voiceChannelId = null;
		this.voiceChannelName = null;
		this.textChannel = textChannel;
		this.connection = null;
		this.wrapper = wrapper;

		this.timer = setInterval(this.checkActivity, FIVE_MINUTES, this);

		this.player = createAudioPlayer();

		// triggers when song ends
		this.player.on(AudioPlayerStatus.Idle, (_oldState: AudioPlayerState, newState: AudioPlayerState) => {
			console.log(newState.status);

			if (!this.loop) this.next();
			const song = this.current;
			if (!song) return;
			this.playResource(song);
		});

		// triggers when song starts
		this.player.on(AudioPlayerStatus.Playing, (_oldState: AudioPlayerState, newState: AudioPlayerState) => {
			console.log(newState.status);

			const song = this.current;
			if (song == undefined) throw "undefined song";
			this.textChannel.send({ embeds: [this.wrapper.messageMenager.play(song)] });
		});
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
		connection.on('stateChange', (oldState, newState) => {
			const oldNetworking = Reflect.get(oldState, 'networking');
			const newNetworking = Reflect.get(newState, 'networking');
		  
			const networkStateChangeHandler = (_oldNetworkState: any, newNetworkState: any) => {
			  const newUdp = Reflect.get(newNetworkState, 'udp');
			  clearInterval(newUdp?.keepAliveInterval);
			}
		  
			oldNetworking?.off('stateChange', networkStateChangeHandler);
			newNetworking?.on('stateChange', networkStateChangeHandler);
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
		console.log(`Connection created for guild ${this.guildId} in voice channel ${voiceChannel.id}`);

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
		const db = this.wrapper.databaseMenager;

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
			console.log(`No users in voice channel ${channel.id} in guild ${queue.guildId}, disconnecting...`);

		}
		// if no voice channel connected or no users in voice channel remove queue
		queue.wrapper.remove(queue.guildId);
	}
}
