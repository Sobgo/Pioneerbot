'use strict'
import * as fs from "fs";
import { Message, MessageEmbed } from 'discord.js';
import { Wrapper } from './structures';
import { messageMenager } from "./messageMenager";
import config from '../config.json';

export class commandMenager {

	private DIR = `${__dirname}/commands`;

	private commands: Record<string, any> = {
		invokes: {},
		functions: {},
		settings: {},
		categories: []
	};

	public importCommands () {

		console.log("deployed commands:");

		// for each file in commands direcotry
		fs.readdirSync(this.DIR).forEach(async (filename) => {
			// compiled || tsnode
			if (filename.endsWith(".js") || filename.endsWith(".ts")) {
				
				const name = filename.slice(0, -3);
				const command = await import(`./commands/${filename}`);
				
				// check if settings object exists and create one if not
				if (command.settings == undefined) { command.settings = {} };

				// single word phrases that invoke command when used with PREFIX i.e help, h
				// if no prefix is specified the command will not be invokable in text chat
				// but can still be accessed in code as proxy target
				if (command.settings.invokes == undefined) { command.settings.invokes = [] };
				// command name to display in help menu and alerts
				if (command.settings.name == undefined) { command.settings.name = name };
				// command description to disply in help menu
				if (command.settings.description == undefined) { command.settings.description = "" };
				// command category to display in help menu
				if (command.settings.category == undefined) { command.settings.category = "other" };
				// example how to use command i.e <position> [query]
				// the first invoke will be put in front of usage
				if (command.settings.usage == undefined) { command.settings.usage = "" };
				// if command should appear in help menu
				// it will still be invokable and if no invokes specified then this has no effect
				if (command.settings.list == undefined) { command.settings.list = true };

				this.commands.functions[name] = command[name];
				this.commands.settings[name] = command.settings;

				// add to all categories if category not in categories
				command.settings.category = command.settings.category.toLowerCase();
				if (!this.commands.categories.includes(command.settings.category)) {
					if (command.settings.list && command.settings.invokes.length > 0) {
						this.commands.categories.push(command.settings.category);
					}
				}

				// setup all invokes
				for (const invoke of command.settings.invokes) {
					this.commands.invokes[invoke.toLowerCase()] = name;
				}

				console.log(
					command.settings.name + " - (" 
					+ command.settings.invokes.map((invoke: string) => { return invoke }).join(", ") +")"
				);
			}
		});

		// create help menu
		messageMenager.help = (commandInvoke: string | undefined = undefined) => {

			commandInvoke = commandInvoke?.toLowerCase();

			const infoMain = "**Type: `" + config.prefix + "help [category]` to display commands from a category**\n"
						   + "**Available categories:\n**";

			const info = "**All commands are displayed with this pattern:\n"
					   + "`Command Name - (invokes) <required arg> [optional arg]`\n"
					   + "To see command description type: `" + config.prefix + "help [command invoke]`**\n\n";

			const noCommand = new MessageEmbed()
								.setColor("#ff0000")
								.setTitle(`:x:  No command \`${commandInvoke}\``)
								.setDescription("**Use `help` command to see list of all commands.**")
			
			// main menu 
			if (commandInvoke == undefined) {

				let categoryList = this.commands.categories.map((cat: string) => { return cat; }).join("\n");

				return new MessageEmbed()
					.setColor("#2ECC71")
					.setTitle("Help")
					.setDescription(infoMain + categoryList)
			}

			// category
			if (this.commands.categories.includes(commandInvoke)) {

				let commands = "";
				
				Object.keys(this.commands.settings).map( (command: string) => {
					const commandSettings = this.commands.settings[command];
				
					if (commandSettings.category == commandInvoke) {
						if (commandSettings.list && commandSettings.invokes.length > 0) {
							commands += "`" + commandSettings.name + " (" 
									 + commandSettings.invokes.map((invoke: string) => { return invoke }).join(", ")
									 + ") " + commandSettings.usage + "`\n";
						}
					}
				});

				return new MessageEmbed()
					.setColor("#2ECC71")
					.setTitle("**" + commandInvoke + " commands list:**")
					.setDescription(info + "**" + commandInvoke + " commands list:\n**" + commands)
			}

			// single command
			else if (commandInvoke in this.commands.invokes) {

				const filename = this.commands.invokes[commandInvoke];
				const commandSettings = this.commands.settings[filename];

				if (commandSettings.list) {
					return new MessageEmbed()
					.setColor("#2ECC71")
					.setTitle(commandSettings.name)
					.setDescription(commandSettings.description)
					.addField(
						"Example use of this command:",
						`\`${config.prefix}${commandSettings.invokes[0]}` +
						`${commandSettings.usage ? (" " + commandSettings.usage) : ""}\``
					)
					.addField(
						"All command invokes",
						commandSettings.invokes.map((invoke: string) => { return "`" + invoke + "`"}).join(", ")
					)
				}

				else return noCommand;
			}

			// no command
			else return noCommand;
		}
	}

	public async invoke (ID: string, PREFIX: string, wrapper: Wrapper, message: Message) {
		
		// extract from message
		const args = message.content.trim().split(" ");
		const invoke = args.shift()?.toLowerCase().slice(PREFIX.length);

		// if commandName privided and command exists
		if (invoke == undefined || invoke.length == 0) return;
		if (invoke in this.commands.invokes) {
			// invoke command
			const name = this.commands.invokes[invoke];
			await this.commands.functions[name](ID, wrapper, message, args);
		}
		else {
			message.channel.send({embeds: [wrapper.messageMenager.invalidCommand(invoke)]});
		}
	}

	public async proxyInvoke (invoke: string, ID: string, wrapper: Wrapper, message: Message, args: string[]) {
		await this.commands.functions[invoke](ID, wrapper, message, args);
	}

}
