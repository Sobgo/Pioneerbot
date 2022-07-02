'use strict'
import { Message } from "discord.js";
import { Wrapper } from "../structures";
import {searchMany } from "../utils";
import config from '../../config.json';

export const settings = {
	aliases : ["sr"],
	description : `Search for a song with a given \`<query>\`, returns list of songs, to play one of them use \`${config.prefix}searchplay <position>\`.`,
	usage : "<query>",
	category : "general",
	list : true
}

export const search = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {

	const query = args.map((element) => { return element }).join(' ');
	const LIMIT = 10;

	if (query.length < 1) {
		message.channel.send({embeds: [wrapper.messageMenager.invalidArguments("searchplay", settings.aliases, settings.usage)]});
		return;
	}

	const result = await searchMany(message, query, LIMIT);
	
	if (result && result.length > 0) {
		message.channel.send({ embeds: [wrapper.messageMenager.search(result)] });
		const queue = wrapper.get(ID);
		if (queue) queue.cache = result;
	}
	else {
		message.channel.send({ embeds: [wrapper.messageMenager.noResult()] });
	}
}
