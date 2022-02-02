'use strict';
import { Message } from 'discord.js';
import { Wrapper } from './structures';
import { toList } from './utils';

import { join } from'./commands/join';
import { search } from './commands/search';
import { play } from './commands/play';


// const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.ts'));
// let commands: {[key: string]: any} = {};

// for (const file of commandFiles) {
// 	const command = require(`./commands/${file}`);
// 	commands[command.data.name] =  command;
// }

export const commandHandler = async (ID: string, PREFIX:string, queues: Wrapper, message: Message) => {

	const args = message.content.trim().split(' ');
	const command = args.shift()?.toLowerCase().slice(PREFIX.length);
	if (command == undefined) return;
	const content = message.content.slice(command.length + PREFIX.length + 1);
	console.log(command);
	console.log(args);

	// if (command in commands) {
	// 	let handler = commands[command];
	// 	handler(ID, queues, message);
	// }

	switch (command) {

		case "join": case "j": {
			await join(ID, queues, message);
			break;
		}

		case "play": case "p": {
			// actually it only adds songs to queue
			play(ID, queues, message, args, content);
			break;
		}

		case "search": case "sr": {
			const result = await search(message, args, content, 10);
			console.log(result);
			if(result) message.channel.send(toList(result));
			break;
		}

		case "leave": case "l": {
			const QUEUE = queues.get(ID);
			if (QUEUE == null) return;
			QUEUE.connection.destroy();
			queues.remove(ID);
			break;
		}

		case "skip": case "s": {
			const QUEUE = queues.get(ID);
			if (QUEUE == null) return;
			QUEUE.player.stop();
			break;
		}

		case "najlepsza_gra": {
			message.channel.send("Red Dead Redemption 2");
			break;
		}

		default:
			message.channel.send("lol");
			break;
	}
}
