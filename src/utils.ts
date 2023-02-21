"use strict";

import { GuildMember } from "discord.js";
import { Song as PrismaSong, Playlist } from "@prisma/client";

import { Song } from "@/structures/Song";

export const secToTimestamp = (sec: string | number) => {

	if (sec === "LIVE") return sec;

	if (typeof sec === "string") sec = parseInt(sec);
	if (isNaN(sec)) return "0:00";

	const hours = Math.floor(sec / 3600);
	const minutes = Math.floor((sec - (hours * 3600)) / 60);
	const seconds = sec - (hours * 3600) - (minutes * 60);

	let timestamp = "";
	if (hours > 0) timestamp += `${hours}:`;
	timestamp += `${hours > 0 ? minutes < 10 ? `0${minutes}` : minutes : minutes}:`;
	timestamp += seconds < 10 ? `0${seconds}` : seconds;
	return timestamp;
}

export const timestampToSec = (timestamp: string) => {
	if (!timestamp) return "LIVE";
	const parts = timestamp.split(':').reverse();
	let sec = 0;

	for (let i = 0; i < parts.length; i++) {
		sec += parseInt(parts[i]) * Math.pow(60, i);
	}

	return sec.toString();
}

export const songsToList = (list: Song[] | PrismaSong[], startPos: number = 0) => {
	return list.map((element, index) => {
		return `${index + startPos + 1}. ${element.title} | [${secToTimestamp(element.duration)}]`
	}).join('\n');
}

export const playlistsToList = (list: Playlist[]) => {
	if (!list.length) return "No playlists found";
	return list.map((element) => {
		return `${element.id}. ${element.name}`
	}).join('\n');
}

export const shuffle = (array: any[]) => {
	let currentIndex = array.length;

	// While there remain elements to shuffle.
	while (currentIndex != 0) {
		// Pick a remaining element.
		const randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}

	return array;
}

export const getStyledUser = (user: GuildMember | null) => {
	if (!user) return "Unknown";
	return user.toString();
}
