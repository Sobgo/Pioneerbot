"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";

/*
 * This is an example command
 * Each command consists of two parts:
 * 1. Command settings object
 * 2. Command function
 * 
 * Command settings are used to generate help menu and to validate command usage.
 * While all properties are optional, it is recommended to fill them all.
 * List of all properties:
 * name, description - strings, displayed in help menu
 * invokes - array of strings, combined with prefix are what bot is listening for
 * usage - string describing command syntax, displayed in help menu
 * category - string, used to group commands
 * list - boolean, if true command will be displayed in help menu
 */
export const settings: CommandSettings = {
	name: "Example command",
	description: "This is example command",
	invokes: ["example", "ex"],
	usage: '<positon> ["front" | "back"]', // <> required  [] optional | alternative "" - literal text
	// so a valid usage would be: !example 1 5 or !example 1 sometext or !example 3
	category: "general",
	list: false
}

/*
 * Command function is the actual code of the command.
 * It needs to match the name of the file but does not need to match the name from settings.
 * This name is not displayed anywhere and is only used to identify the command.
 * Commmad function needs to be async and take 4 arguments:
 * guildId - string, id of the guild where the command was invoked
 * wrapper - Wrapper, wrapper object containing all the bot data
 * message - Message, message that invoked the command
 * args - string[], array of arguments passed to the command (space separated words)
 */
export const example = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	/*
	 * Since Pioneer is primarily a music bot this example will be music related. However, it can be used for any purpose.
	 * We will implement a simple command that will allow us to move a song in the queue to the front or back.
	 */

	/*
	 * processing arguments
	 * From the usage we can see that this function can take 1 or 2 arguments first being a number and second being either "front" or "back"
	 * This is however only a hint to the user and we cannot guarantee that the user will pass valid arguments.
	 * We need to validate them and handle invalid ones.
	 */

	const position = parseInt(args[0]); // first argument is position, we need to convert it to number

	if (isNaN(position)) {
		// if it is not a number we need to send an error message and return
		// here we are sending a message to the channel
		message.channel.send("Position must be given and it must be a number!");
		return;
	}

	if (position < 1) {
		// position must be greater than 0
		// here we are using a message from messageManager which is a collection of predefined messages
		message.channel.send({ embeds: [wrapper.messageManager.outOfScope("position")] });
		return;
	}

	// second argument is optional, if it is not given we will use "front" as default
	const side = args[1] || "front";
	if (side !== "front" && side !== "back") {
		message.channel.send({ embeds: [wrapper.messageManager.invalidArguments(settings)] });
	}

	/* 
	 * getting the queue
	 * Wrapper also provides access to the queues
	 * There are two ways to get the queue:
	 * wrapper.get() and wrapper.checkQueue()
	 */
	let queue = wrapper.get(guildId);
	/*
	 * this will return either the queue or null if there is no queue for this guild
	 * if we want to ensure that there will always* be a queue we can use wrapper.checkQueue()
	 */
	queue = await wrapper.checkQueue(guildId, message, true);
	/*
	 * this function will not only return the queue but also check if user and bot are in the same voice channel
	 * additionally if last argument is true it will create a new queue if there is none
	 * we still need to check if queue is null because there are cases when it would be impossible to create a queue
	 * for example when the user is not in a voice channel
	*/
	if (!queue) return;

	/*
	 * Now that we have both queue and all arguments validated we can implement the actual logic
	 */
	if (position < queue.length) {
		// queue.remove() returns an array of removed elements 
		// in this case array with only one element
		const song = queue.remove(position - 1)[0];
		
		if (side === "front") {
			queue.add(0, song);
			message.channel.send("Moved song to the front of the queue!");
		} else if (side === "back") {
			queue.push(song);
			message.channel.send("Moved song to the back of the queue!");
		} else {
			message.channel.send({ embeds: [wrapper.messageManager.invalidArguments(settings)] });
		}
	} else {
		// if position is greater than queue length we send an error message
		message.channel.send({ embeds: [wrapper.messageManager.outOfScope("position")] });
	}
}
