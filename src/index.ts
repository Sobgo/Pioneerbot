'use strict'
import { Interaction, Message } from 'discord.js';
import sqlite3 from 'sqlite3';
import { createInterface } from 'readline';
import { writeFile } from 'fs';
import { Wrapper } from './structures';
import { importCommands } from './commandMenager';
import config from '../config.json';

const wrapper = new Wrapper(config.prefix);

new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (err) => {
	if (err) {
		console.warn("You need to build a database from schema. Type: npx prisma db push");
		new sqlite3.Database("./database.db");
	}
	else {
		if (config.token.length < 1) {
			const rli = createInterface({
				input: process.stdin,
				output: process.stdout
			});
		
			rli.question("Please enter your discord api token: ", (answer) => {
				wrapper.client.login(answer);
				config.token = answer;
				rli.close();
				importCommands();
			});
		}
		else {
			wrapper.client.login(config.token);
			importCommands();
		}
	}
});

wrapper.client.on('ready', async () => {
	// if loged in successfully then save config
	if (wrapper.client.user != null) {
		writeFile('./config.json', JSON.stringify(config, null, 2), (err) => {
			if (err) console.warn(err);
		});
		await dbCleenup();
		console.log( `${wrapper.client.user.username} successfully logged in`);
	}
});

// prefixed commands 
wrapper.client.on('messageCreate', async (message: Message) => {
	if (!message.guild) return;
	if (message.author.bot) return;

	const ID = message.guild.id;
	if (!message.content.startsWith(wrapper.prefix)) return;
	wrapper.commandMeneger(ID, wrapper.prefix, wrapper, message);
});

// TODO: discord / commands support
wrapper.client.on('interactionCreate', async (interaction: Interaction) => {
	if (!interaction.isCommand() || !interaction.guild) return;
});

// quick and dirty
const dbCleenup = async () => {
	const db = wrapper.databaseMenager;
	// find songs that are not in any playlist
	const songs = await db.getAllSongs();
	for (const song of songs) {
		if (!(await db.checkInPlaylist(song.ytid))) {
			db.removeSong(song.ytid);
			console.log(`Removed song ${song.ytid} -> ${song.title}`);
		}
	}
}
