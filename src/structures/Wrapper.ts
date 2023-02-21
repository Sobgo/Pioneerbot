"use strict"
import { Client, GatewayIntentBits, Message } from "discord.js";

import { GuildQueue } from "@/structures/GuildQueue";
import { messageMenager } from "@/menagers/messageMenager";
import { commandMenager } from "@/menagers/commandMenager";
import { databaseMenager } from "@/menagers/databaseMenager";

export class Wrapper {
	public client: Client;
	public prefix: string;

	private queues: Record<string, GuildQueue> = {};

	public messageMenager = messageMenager;
	public commandMenager = new commandMenager();
	public databaseMenager = new databaseMenager();

	constructor(prefix: string) {
		this.client = new Client({
			intents: [
				GatewayIntentBits.Guilds,
				// GatewayIntentBits.GuildMembers,
				GatewayIntentBits.GuildVoiceStates,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.GuildMessageReactions,
				GatewayIntentBits.DirectMessages,
			]
		});

		this.prefix = prefix;
	}

	/**
	 * binds new Queue to guild id.
	 * @param {string} id - Id of a guild
	 * @param {Queue} element - new Queue
	 */
	public async add(id: string, element: GuildQueue) {
		element.wrapper = this;
		element.tracking = await this.databaseMenager.checkGuild(id);
		this.queues[id] = element;
	}

	/**
	 * Removes Queue with specified id. If no Queue is found false is returned else true is returned.
	 * @param {string} id - Id of a guild
	 */
	public remove(id: string): boolean {
		if (!(id in this.queues)) return false;
		const connection = this.queues[id].connection;
		if (connection) connection.destroy();

		console.log(`Removed queue for guild ${id}`);

		clearInterval(this.queues[id].timer);
		delete this.queues[id];
		return true;
	}

	/**
	 * Returns Queue with specified id or null if no Queue is found.
	 * @param {string} id - Id of a guild
	 */
	public get(id: string): GuildQueue | null {
		if (!(id in this.queues)) return null;
		return this.queues[id];
	}

	/**
	 * Check if queue exists and if user and bot are in the same voice channel.
	 * If toJoin is true then if queue doesn't exist it will be created.
	 * @param {string} guildId - Id of a guild
	 * @param {Message} message - Message from which the command was called
	 * @param {boolean} toJoin - If true then if queue doesn't exist it will be created
	 */
	public async checkQueue(guildId: string, message: Message, toJoin: boolean = false): Promise<GuildQueue | null> {
		let queue = this.get(guildId);
		let memberVoice = message.member?.voice;

		if (memberVoice == undefined || !memberVoice.channel) {
			message.channel.send({ embeds: [this.messageMenager.noChannelUser()] });
			return null;
		}

		if (!queue && toJoin) {
			queue = new GuildQueue(guildId, message.channel, this);
			await this.add(guildId, queue);
			await queue.createConnection(memberVoice.channel);
		}

		if (!queue) return null;

		if (!queue.voiceChannelId) {
			message.channel.send({ embeds: [this.messageMenager.noChannelBot()] });
			return null;
		}

		if (memberVoice == undefined || memberVoice.channelId == null || memberVoice.channelId != queue?.voiceChannelId) {
			message.channel.send({ embeds: [this.messageMenager.noChannelUser(queue.voiceChannelName ? queue.voiceChannelName : undefined)] });
			return null;
		}
		return queue;
	}
}
