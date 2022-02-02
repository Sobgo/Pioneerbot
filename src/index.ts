'use strict';
import { Client, Intents, Interaction, Message } from 'discord.js';
import { commandHandler } from './commandHandler';
import { Wrapper } from './structures';
import config from '../config.json';

// const FIVE_MINUTES = 1000*60*5;

const client = new Client({
	intents: [ 
		Intents.FLAGS.GUILDS, 
		// Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_VOICE_STATES,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.DIRECT_MESSAGES
	]
});

const queues = new Wrapper;

client.login(config.token);

client.on('ready', async () => {
	if (client.user != null) {
		console.log( `${client.user.username} successfully logged in`);
	}
});

// prefixed commands 
client.on('messageCreate', async (message: Message) => {
	
	if (!message.guild) return;
	if (message.author.bot) return;

	if (!(message.member?.voice)) return; // improve
	
	let guilds: { [key: string]: Record<string, string> } = config.guilds;

	const ID = message.guild.id;
	const PREFIX = guilds[ID] ? guilds[ID].prefix : "!";

	if (!message.content.startsWith(PREFIX)) return;

	commandHandler(ID, PREFIX, queues, message);

});

// discord / commands support TODO
client.on('interactionCreate', async (interaction: Interaction) => {
	if (!interaction.isCommand() || !interaction.guild) return;
});
