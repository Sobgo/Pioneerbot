"use strict"
import { Message } from "discord.js";

import { Wrapper } from "@/structures/Wrapper";
import { CommandSettings } from "@/structures/types";

export const settings: CommandSettings = {
	name: "Tracking",
	invokes: ["track", "t"],
	description: "Checks, enables or disables tracking for a guild. "
		+ "When enabled all played songs will be saved to a guild history "
		+ "and you will be able you use commands from tracking category. "
		+ "Disabling tracking removes all guild history.",
	usage: "[\"enable\" / \"disable\"]",
	category: "general",
	list: true
}

export const track = async (guildId: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const db = wrapper.databaseMenager;
	const queue = wrapper.get(guildId);

	const confirmation = args[0] ? args[0] : "";
	const isTracked = await db.checkGuild(guildId);

	if (confirmation == "") {
		if (isTracked) {
			message.channel.send({ embeds: [wrapper.messageMenager.trackingDisabled()] });
		} else {
			message.channel.send({ embeds: [wrapper.messageMenager.trackingEnabled()] });
		}
	} else if (confirmation == "enable" && !isTracked) {
		await db.addGuild(guildId);
		if (queue) queue.tracking = true;
		message.channel.send({ embeds: [wrapper.messageMenager.trackingEnabled(true)] });
	} else if (confirmation == "disable" && isTracked) {
		await db.removeGuild(guildId);
		if (queue) queue.tracking = false;
		message.channel.send({ embeds: [wrapper.messageMenager.trackingDisabled(true)] });
	}
	// TODO: message if already tracked
}
