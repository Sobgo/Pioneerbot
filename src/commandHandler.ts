'use strict'
import { Message, MessageEmbed } from 'discord.js';
import * as fs from "fs";
import { messageProvider } from './messageProvider';
import { Wrapper } from './structures';
import config from '../config.json';

let loadedCommands: Record<string, any> = {};

const getUsage = (commandName: string, command: Record<string, any>) => {
	return (
		"`" + config.prefix + commandName +
		(command.aliases ? " (" + command.aliases + ")" : "") +
		(command.usage ? " " + command.usage : "") + "`"
	)
}

export const importCommands = () => {

	let commands: Record<string, any> = {};
	
	commands.aliases = {};
	commands.descriptions = {};
	commands.functions = {};
	commands.usages = {};

	console.log("deployed commands:");
	fs.readdirSync(`${__dirname}/commands`).forEach(async (file) => {
		if (file.endsWith(".ts") || file.endsWith(".js")) {
            const fileName = file.slice(0, -3).toLowerCase();
			const command = await import(`./commands/${file}`);
			console.log(fileName  + " (" + command.aliases + ")");
			
			commands.functions[fileName] = command[fileName];
			commands.aliases[fileName] = command.aliases;
			commands.descriptions[fileName] = command.description;
			commands.usages[fileName] = getUsage(fileName, command);
			commands[fileName] = fileName;

			if (command.aliases) {
				for (const alias of command.aliases) {
					commands[alias] = fileName;
				}
			}
		}
	});

	messageProvider.commands = commands;
	messageProvider.help = (commandName: string) => {
		if (commandName) {

			if (!(commandName in commands)) {
				return messageProvider.invalidCommand(commandName, commands.usages["help"]);
			}

			commandName = commands[commandName];

			return new MessageEmbed()
				.setColor('#00ff00')
				.setTitle(commandName)
				.setDescription(commands.descriptions[commandName])
				.addField("Usage", commands.usages[commandName]);
		}
		else {
			return new MessageEmbed()
				.setColor('#0ff000')
				.setTitle('Commands')
				.setDescription(
					"`() - command aliases, <> - required parameter, [] - optional parameter`\n" +
					`type ${commands.usages["help"]} to show command description\n\n` +
					"**List of all commands:**\n" +
					Object.keys(commands.descriptions).map(commandName => {
						return commands.usages[commandName];
					}).join('\n'));
		}
	}

	loadedCommands = commands;
}

export const commandHandler = async (ID: string, PREFIX:string, queues: Wrapper, message: Message) => {

	const args = message.content.trim().split(' ');
	const commandName = args.shift()?.toLowerCase().slice(PREFIX.length);
	if (commandName == undefined) return;

	if (commandName in loadedCommands) {
		await loadedCommands.functions[loadedCommands[commandName]](ID, queues, message, args);
	}
	else { // no such command
		message.channel.send({embeds: [messageProvider.invalidCommand(commandName, loadedCommands.usages["help"])]});
	}
}
