'use strict'
import { Interaction, Message } from 'discord.js';
import sqlite3 from 'sqlite3';
import { createInterface } from 'readline';
import { writeFile, statSync } from 'fs';
import { Wrapper } from './structures';
import config from '../config.json';

const wrapper = new Wrapper(config.prefix);

new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (err) => {
	if (err) {
		new sqlite3.Database("./database.db", () => {
			init();
		});
	}
	else init();
});

const init = () => {
	if (statSync("./database.db").size == 0) {
		console.warn("You need to build a database from schema. Type: npx prisma db push");
		return;
	}

	if (config.token.length < 1) {
		const rli = createInterface({
			input: process.stdin,
			output: process.stdout
		});
		
		rli.question("Please enter your discord api token: ", (answer) => {
			try { wrapper.client.login(answer); } catch { console.error("Failed to login"); return; }
			config.token = answer;
			rli.close();
			wrapper.commandMenager.importCommands();
		});
	}
	else {
		try { wrapper.client.login(config.token); } catch { console.error("Failed to login"); return; }
		wrapper.commandMenager.importCommands();
	}
};

wrapper.client.on('ready', async () => {
	// if loged in successfully then save config
	if (wrapper.client.user != null) {
		writeFile('./config.json', JSON.stringify(config, null, 2), (err) => {
			if (err) console.warn(err);
		});
		await wrapper.databaseMenager.dbCleenup();
		console.log( `${wrapper.client.user.username} successfully logged in`);
	}
});

// prefixed commands 
wrapper.client.on('messageCreate', async (message: Message) => {
	if (!message.guild) return;
	if (message.author.bot) return;
	if (!message.content.startsWith(wrapper.prefix)) return;

	wrapper.commandMenager.invoke(message.guild.id, wrapper.prefix, wrapper, message);
});

// TODO: discord / commands support
wrapper.client.on('interactionCreate', async (interaction: Interaction) => {
	if (!interaction.isCommand() || !interaction.guild) return;
});
