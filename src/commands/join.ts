'use strict'
import { Message } from "discord.js";
import { createAudioPlayer, joinVoiceChannel, entersState, VoiceConnectionStatus, DiscordGatewayAdapterCreator } from "@discordjs/voice";
import { Wrapper, Queue } from "../structures";
import { messageProvider } from "../messageProvider";

export const aliases = ["j"];
export const description = "Request bot to join a voice channel.";
export const usage = "";

export const join = async (ID: string, queues: Wrapper, message: Message, args:string[] = []) => {
	await createConnection(ID, queues, message);
};

export const createConnection = async (ID: string, queues: Wrapper, message: Message) => {

	const voice = message.member?.voice;
	if (voice == undefined || voice.channel == null || voice.channelId == null ){
		message.channel.send({embeds: [messageProvider.noChannel()]});
		return null;
	}

	const player = createAudioPlayer();

	const connection = joinVoiceChannel({
		channelId: voice.channelId,
		guildId: ID,
		adapterCreator: voice.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
		selfDeaf: false
	});

	if (queues.get(ID) == null) {
		queues.add(ID, new Queue(ID, voice.channel, message.channel, connection, player));
	}

	try {
		await entersState(connection, VoiceConnectionStatus.Ready, 10e3);
	}
	catch (err) {
		connection.destroy();
		message.channel.send("couldn't connect to channel");
	}

	connection.subscribe(player);
	return queues.get(ID);
}
