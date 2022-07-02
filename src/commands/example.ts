'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";

// describes the command
export const settings = {
	aliases : ["ex"],
	description : "this is example command",
	usage : "<positon> [count]", // describes how to use the command
	category : "general", // used for grouping commands
	list : false // show this command in help menu
}

// if prefix set to ! then a valid use of this command would be !example 3 10 or !ex 5

// implementation of the command
// function name must be the same as file name and it must take 4 arguments: ID, wrapper, message, args
// ID is the ID of the guild form which the command was called
// wrapper contains all the queues and gives access to menagers
// message is the message object that invoked the command
// args is an array of strings containing all the arguments passed to the command, args are splitted from message by spaces
export const example = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	// getting queue of the guild (can be null)
	const queue = wrapper.get(ID);

	if (queue != null && args.length > 0) {
		const position = parseInt(args[0]);
		const count = isNaN(parseInt(args[1])) ? 1 : parseInt(args[1]);

		if (isNaN(position) || position < 0) {
			// sending message using messageMenager
			message.channel.send({ embeds: [wrapper.messageMenager.invalidArguments("example", settings.aliases, settings.usage)] });
		}

		const text = "this is example command";
		const sliced = text.slice(position, position + count);

		// sending string message
		message.channel.send(sliced);
	}
}
