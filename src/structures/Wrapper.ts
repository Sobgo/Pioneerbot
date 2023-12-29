"use strict"
import { Client, GatewayIntentBits, Message } from "discord.js";

import { GuildQueue } from "@/structures/GuildQueue";
import { messageManager } from "src/managers/messageManager";
import { commandManager } from "src/managers/commandManager";
import { databaseManager } from "src/managers/databaseManager";

export class Wrapper {
	public client: Client;
	public prefix: string;
	public verbose: boolean = false;

	private queues: Record<string, GuildQueue> = {};

	public messageManager = messageManager;
	public commandManager = new commandManager();
	public databaseManager = new databaseManager();

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
		element.tracking = await this.databaseManager.checkGuild(id);
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

		if (this.verbose) console.log(`Removed queue for Guild: ${id}`);

		clearInterval(this.queues[id].inactivityTimer);
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
			message.channel.send({ embeds: [this.messageManager.noChannelUser()] });
			return null;
		}

		if (!queue && toJoin) {
			queue = new GuildQueue(guildId, message.channel, this);
			await this.add(guildId, queue);
			await queue.createConnection(memberVoice.channel);
		}

		if (!queue) return null;

		if (!queue.voiceChannelId) {
			message.channel.send({ embeds: [this.messageManager.noChannelBot()] });
			return null;
		}

		if (memberVoice == undefined || memberVoice.channelId == null || memberVoice.channelId != queue?.voiceChannelId) {
			message.channel.send({ embeds: [this.messageManager.noChannelUser(queue.voiceChannelName ? queue.voiceChannelName : undefined)] });
			return null;
		}
		return queue;
	}
}
