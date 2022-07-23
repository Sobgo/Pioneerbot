'use strict'
import { Message, MessageEmbed } from 'discord.js';
import * as fs from "fs";
import { messageMenager } from './messageMenager';
import { Wrapper } from './structures';
import config from '../config.json';

let loadedCommands: Record<string, any> = {};

const getUsage = (commandName: string, commandSettings: Record<string, any>) => {
	return (
		"`" + config.prefix + commandName +
		(commandSettings.aliases ? " (" + commandSettings.aliases + ")" : "") +
		(commandSettings.usage ? " " + commandSettings.usage : "") + "`"
	)
}

export const importCommands = () => {

	let commands: Record<string, any> = {};

	commands.settings = {}
	commands.functions = {};
	commands.categories = [];

	console.log("deployed commands:");

	fs.readdirSync(`${__dirname}/commands`).forEach(async (file) => {
		if (file.endsWith(".ts") || file.endsWith(".js")) {

            const fileName = file.slice(0, -3).toLowerCase();
			const command = await import(`./commands/${file}`);

			console.log(fileName  + " (" + command.settings.aliases + ")");
			
			commands.functions[fileName] = command[fileName];
			commands.settings[fileName] = command.settings;
			commands[fileName] = fileName;

			// add category to commands.categories if same category was not added yet
			if (!commands.categories.includes(command.settings.category)) {
				commands.categories.push(command.settings.category);
			}

			if (command.settings.aliases) {
				for (const alias of command.settings.aliases) {
					commands[alias] = fileName;
				}
			}
		}
	});

	messageMenager.commands = commands;

	// add help message
	messageMenager.help = (commandName: string = "general") => {
		
		if (!(commands.categories.includes(commandName))) {
			if (!(commandName in commands)) {
				return messageMenager.invalidCommand(commandName);
			}

			const name = commands[commandName];

			return new MessageEmbed()
				.setColor('#00ff00')
				.setTitle(name)
				.setDescription(commands.settings[name].description)
				.addField("Usage", getUsage(name, commands.settings[name]));
		}
		else {
			return new MessageEmbed()
				.setColor('#0ff000')
				.setTitle('Commands')
				.setDescription(
					"`() - command aliases, <> - required parameter, [] - optional parameter`\n" +
					`type ${config.prefix}help [command] to show command description\n\n` +
					`**List of ${commandName} commands:**\n` +

					Object.keys(commands.settings).map(command => {
						if (!commands.settings[command].list) return "";
						if (commandName != null) {
							if (commands.settings[command].category != commandName) {
								return "";
							}
						}
						return getUsage(command, commands.settings[command]);
					}).filter((s): s is string => s != "").join('\n')

					+ `\n\n**To see list of other category commands type \`${config.prefix}help [category]\`** \n`
					+ "**available categories:" + commands.categories.map((category: string) => { return ` \`${category}\``}) + "**"
				);
		}
	}

	loadedCommands = commands;
}

export const commandMenager = async (ID: string, PREFIX:string, wrapper: Wrapper, message: Message) => {

	const args = message.content.trim().split(' ');
	const commandName = args.shift()?.toLowerCase().slice(PREFIX.length);
	if (commandName == undefined) return;

	if (commandName in loadedCommands) {
		await loadedCommands.functions[loadedCommands[commandName]](ID, wrapper, message, args);
	}
	else { // no such command
		message.channel.send({embeds: [wrapper.messageMenager.invalidCommand(commandName)]});
	}
}
