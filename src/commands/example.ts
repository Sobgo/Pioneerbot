'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";
import { songsToList } from "../utils";

export const settings = {
	name : "Example command",
	invokes : ["example", "ex"],
	description : "This is example command",
	usage : "<positon> [count]", //  <> required  [] optional
	category : "general",
	list : false
}

// if prefix set to ! then a valid use of this command would be !example 3 10 or !ex 5

// implementation of the command
// function name must be the same as filename and it must take 4 arguments: ID, wrapper, message, args
// ID is the ID of the guild form which the command was called
// wrapper contains all the queues and gives access to menagers
// message is the message object that invoked the command
// args is an array of strings containing all the arguments passed to the command
// args are splitted from message by spaces
export const example = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	// getting queue of the guild (can be null)
	const queue = wrapper.get(ID);

	let text = "";

	if (args.length > 0) {

		const position = parseInt(args[0]);
		const count = isNaN(parseInt(args[1])) ? 1 : parseInt(args[1]);

		if (isNaN(position) || position < 0) {
			// sending message using messageMenager
			message.channel.send({ embeds: [wrapper.messageMenager.invalidArguments(settings)] });
		}

		if (queue != null) {
			
			text += "Queue exists\n";

			if (queue.get(0) != null) {
				text += "Currently playing: `" + queue.get(0)?.title + "`\n";
			}

			if (queue.length() <= position) {
				text += "No song at " + position + " position in queue";
			}
			else {
				text += "Song at " + position + " position in queue is: `" + queue.get(position)?.title + "`\n\n";
			}

			text += "**First " + ((count == 1) ? " " : (count + " ")) + "song" + ((count == 1) ? "" : "s") + " in queue "
				 + ((count == 1) ? "is:**\n" : "are:**\n") + songsToList(queue.songs.slice(1, count + 1));
			
			if (queue.length() <= count) {
				text += "No more songs in queue...";
			}
		}
		else {
			text += "Queue doesn't exist\n";
		}

		// sending string message
		message.channel.send(text);
	}
	else {
		message.channel.send({ embeds: [wrapper.messageMenager.invalidArguments(settings)] });
	}
}
