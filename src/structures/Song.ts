"use strict"
import { GuildMember } from "discord.js";

import { secToTimestamp, getStyledUser } from "@/utils";
import { ytsr, isValidUrl } from "@/scrapper";

export class Song {
	public url: string;
	public title: string;
	public author: string;
	public duration: string;
	public username: string;

	public constructor(url: string, title: string, author: string, duration: string, username: string) {
		this.url = url;
		this.title = title;
		this.author = author;
		this.duration = duration;
		this.username = username;
	}

	/**
	 * Constructs a Song object from the given URL. Takes optional user parameter to store who requested the song.
	 * 
	 * **Will thorw an error if the URL is invalid!**
	 * @param {string} url - url to Youtube video
	 * @param {string} user - Discord user that requested song
	 */
	public static async build(url: string, user?: GuildMember | string): Promise<Song | null> {
		if (!isValidUrl(url)) {
			throw new Error("Invalid URL passed to Song builder.\nURL: " + url + "\n`");
		}

		const song = await ytsr(url);
		if (!song) return null;

		if (user instanceof GuildMember) {
			user = getStyledUser(user);
		}

		return new Song(song[0].url, song[0].title, song[0].author, song[0].duration, user ? user : "unknown");
	}

	/**
	 * Returns a string representation of the song
	 */
	public toString() {
		return `${this.title} | [${secToTimestamp(this.duration)}]`;
	}
}
