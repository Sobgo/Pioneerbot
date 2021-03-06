import { Message } from "discord.js";
import { Wrapper } from "../structures";

export const settings = {
	aliases : ["t"],
	description : "check, enable or disable tracking for guild, for more information use track without arguments",
	usage : "[enable/disable]",
	category : "general",
	list : true
}

export const track = async (ID: string, wrapper: Wrapper, message: Message, args: string[]) => {
	const db = wrapper.databaseMenager;
	const queue = wrapper.get(ID);

	const confirmation = args[0] ? args[0] : "";
	const isTracked = await db.checkGuild(ID);

	if (confirmation == "") {
		if(isTracked) {
			message.channel.send({embeds: [wrapper.messageMenager.trackingDisabled()]});
		}
		else {
			message.channel.send({embeds: [wrapper.messageMenager.trackingEnabled()]});
		}
	}
	else if (confirmation == "enable" && !isTracked) {
		await db.addGuild(ID);
		if (queue) queue.tracking = true;
		message.channel.send({embeds: [wrapper.messageMenager.trackingEnabled(true)]});
	}
	else if (confirmation == "disable" && isTracked) {
		await db.removeGuild(ID);
		if (queue) queue.tracking = false;
		message.channel.send({embeds: [wrapper.messageMenager.trackingDisabled(true)]});
	}
	// TODO: message if already tracked
}
