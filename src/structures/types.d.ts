"use strict"
import { DMChannel, NewsChannel, PartialDMChannel, TextChannel, ThreadChannel, VoiceChannel } from "discord.js";

export type CommandSettings = {
	name?: string
	invokes?: string[]
	description?: string
	usage?: string
	category?: string
	list?: boolean
}

export type MessageChannel = TextChannel | DMChannel | NewsChannel | ThreadChannel | PartialDMChannel | VoiceChannel;
