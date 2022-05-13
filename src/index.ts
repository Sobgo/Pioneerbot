'use strict'
import { Interaction, Message } from 'discord.js';
import { createInterface } from 'readline';
import { writeFile } from 'fs';
import { Wrapper } from './structures';
import { importCommands } from './commandHandler';
import config from '../config.json';

const wrapper = new Wrapper(config.prefix);

if (config.token.length < 1) {
	const rli = createInterface({
		input: process.stdin,
		output: process.stdout
	});

	rli.question("Please enter your discord api token: ", (answer) => {
		config.token = answer;
		wrapper.client.login(answer);
		rli.close();
		importCommands();
	});
}
else {
	wrapper.client.login(config.token);
	importCommands();
}

wrapper.client.on('ready', async () => {
	if (wrapper.client.user != null) {
		writeFile('./config.json', JSON.stringify(config, null, 2), (err) => {
			if (err) console.warn(err);
		});
		console.log( `${wrapper.client.user.username} successfully logged in`);
	}
});

// prefixed commands 
wrapper.client.on('messageCreate', async (message: Message) => {
	if (!message.guild) return;
	if (message.author.bot) return;

	const ID = message.guild.id;
	if (!message.content.startsWith(wrapper.prefix)) return;
	wrapper.commandHandler(ID, wrapper.prefix, wrapper, message);
});

// discord / commands support TODO
wrapper.client.on('interactionCreate', async (interaction: Interaction) => {
	if (!interaction.isCommand() || !interaction.guild) return;
});
