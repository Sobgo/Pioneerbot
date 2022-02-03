'use strict'
import { Message } from 'discord.js';
import { Wrapper } from './structures';
import * as fs from "fs";

let commands: {[key: string]: any} = {};

const importCommands = async  () => {
	const commandFiles = fs.readdirSync(`${__dirname}/commands`).filter(file => file.endsWith('.ts'));
	console.log("deployed commands:");
	for (const file of commandFiles) {
		const command = file.slice(0, -3);
		const imported = await import(`./commands/${file}`);
		const aliases = imported.aliases;
		console.log(command  + " (" + aliases + ")");

		commands[command] = imported[command];

		if (aliases) {
			for (const alias of imported["aliases"]) {
				commands[alias] = imported[command];
			}
		}
	}
}; importCommands();

export const commandHandler = async (ID: string, PREFIX:string, queues: Wrapper, message: Message) => {

	const args = message.content.trim().split(' ');
	const commandName = args.shift()?.toLowerCase().slice(PREFIX.length);
	if (commandName == undefined) return;

	if (commandName in commands) {
		await commands[commandName](ID, queues, message, args);
	}
	else { // no such command
		message.channel.send(`No command: ${commandName}`);
	}
}
