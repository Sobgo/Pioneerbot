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
import { ChannelType, Message, VoiceBasedChannel, TextBasedChannel, SendableChannels } from "discord.js";
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
	public wrapper: Wrapper;

	public player: AudioPlayer | null = null;
	public textChannel: SendableChannels | null = null;
	public voiceChannelId: string | null = null;
	public voiceChannelName: string | null = null;
	public connection: VoiceConnection | null = null;

	public cachedResult: Song[] = [];

	public quiet: boolean = false;
	public loop: boolean = false;
	public tracking: boolean = false;

	public repeat: Message | null = null;

	public inactivityTimer: any;

	public constructor(guildId: string, wrapper: Wrapper) {
		super();

		this.wrapper = wrapper;
		this.guildId = guildId;

		this.voiceChannelId = null;
		this.voiceChannelName = null;
		this.connection = null;
		this.textChannel = null;

		this.inactivityTimer = setInterval(this.checkActivity, FIVE_MINUTES, this);

		if (this.wrapper.verbose) console.log(`Created new queue for Guild: ${guildId}`);
	}

	/**
	 * Creates a connection to a voice channel (the bot user will join the channel).
	 * If connection already existed it will be destroyed and the player will subscribe to a new connection.
	 */
	public createConnection = async (voiceChannel: VoiceBasedChannel) => {
		if (this.connection) {
			this.connection?.disconnect();
			this.connection?.destroy();
		}

		const connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: this.guildId,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
			selfDeaf: false,
		});

		if (this.player == null) {
			this.player = createAudioPlayer();

			// triggers when song ends
			this.player.on(AudioPlayerStatus.Idle, (_, newState: AudioPlayerState) => {
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
			this.player.on(AudioPlayerStatus.Playing, (_, newState: AudioPlayerState) => {
				if (this.wrapper.verbose) console.log(`Guild: ${this.guildId}, Status: ${newState.status}`);

				const song = this.current;
				if (!song) throw "undefined song";

				if (!this.quiet && this.textChannel) {
					this.wrapper.messageManager.send("play", this.textChannel as TextBasedChannel, song);
				}
			});
		}

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

	public async destroyConnection() {
		this.connection?.disconnect();
		this.connection?.destroy();
		this.connection = null;
		this.voiceChannelId = null;
		this.voiceChannelName = null;
		this.player?.stop();
		this.player = null;
	}

	public playResource(song: Song) {
		if (!this.connection || !this.player) return;

		if (this.tracking) {
			this.addToDatabase(song);
		}

		const stream = ytdl(song.url, FLAGS, { stdio: ["ignore", "pipe", "ignore"] });
		
		stream.catch((err) => {
			if (err.exitCode === 1) return;
			if (this.wrapper.verbose) console.error(err);
			else console.log("Error in player child process");
		});

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
			if (queue.wrapper.verbose) console.log(`No users in voice channel: ${channel.id} in Guild: ${queue.guildId}, disconnecting...`);
			await queue.destroyConnection();
		}
	}

	private async invoke() {
		if (this.repeat) await this.wrapper.commandManager.invoke(this.guildId, this.wrapper.prefix, this.wrapper, this.repeat);
	}
}
