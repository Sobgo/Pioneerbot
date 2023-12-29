"use strict"

import { EmbedBuilder } from "discord.js"

export type CommandSettings = {
	name?: string
	invokes?: string[]
	description?: string
	usage?: string
	category?: string
	list?: boolean
}
