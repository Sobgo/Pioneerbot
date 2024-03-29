"use strict"
import { PrismaClient, Prisma, Content } from "@prisma/client";

import { Song } from "@/structures/Song";
import { timestampToSec } from "@/utils";
import { getVideoId } from "@/scrapper";

const URL = "https://www.youtube.com/watch?v=";

export class databaseManager {

	private db = new PrismaClient();

	public getDb() {
		return this.db;
	}

	public async getGuild(guildId: string) {
		return await this.db.guild.findUnique({
			where: { id: guildId }
		})
	}

	public async getPlaylist(playlistId: number, guildId: string | undefined = undefined) {
		if (guildId == undefined) {
			return await this.db.playlist.findUnique({
				where: { id: playlistId }
			});
		} else {
			return await this.db.playlist.findFirst({
				where: { AND: { id: playlistId, guild_id: guildId } }
			});
		}
	}

	public async getSong(ytid: string) {
		return await this.db.song.findUnique({
			where: { ytid: ytid }
		});
	}

	public async checkGuild(guildId: string,) {
		const guild = await this.getGuild(guildId);
		if (!guild) return false;
		return true;
	}

	public async checkPlaylist(playlistId: number, guildId: string | undefined = undefined) {
		const playlyst = await this.getPlaylist(playlistId, guildId);
		if (!playlyst) return false;
		return true;
	}

	public async checkSong(ytid: string) {
		const song = await this.getSong(ytid);
		if (!song) return false;
		return true;
	}

	public async addGuild(guildId: string) {
		// if guild doesn't exist
		if (!(await this.checkGuild(guildId))) {

			// add guild to database
			const guild = await (this.db.guild.create({
				data: { id: guildId, default_playlist_id: null }
			}));

			// add history/default playlist to database
			const playlist = await this.addPlaylist(guildId, "All");

			if (playlist) {
				// create relation
				await this.db.guild.update({
					where: { id: guildId }, data: { default_playlist_id: playlist.id }
				});
			}

			return guild;
		}
	}

	public async addPlaylist(guildId: string, playlistName: string) {
		if ((await this.checkGuild(guildId))) {
			// check if playlist exists
			const playlist = await this.db.playlist.findFirst({
				where: { AND: { guild_id: guildId, name: playlistName } }
			});

			if (playlist) return;

			// add playlist to database
			return await this.db.playlist.create({
				data: { name: playlistName, guild_id: guildId }
			});
		}
	}

	public async addSong(song: Song) {
		// check if song exists
		const ytid = getVideoId(song.url);
		let result = await this.getSong(ytid);

		if (!result) {
			let duration = parseInt(timestampToSec(song.duration));
			if (isNaN(duration)) duration = 0;

			// add song to database
			result = await this.db.song.create({
				data: { ytid: ytid, title: song.title, author: song.author, duration: duration }
			});
		}

		return result;
	}

	public async removeGuild(guildId: string) {
		await this.db.guild.delete({
			where: { id: guildId }
		});
	}

	public async removePlaylist(playlistId: number) {
		await this.db.playlist.delete({
			where: { id: playlistId }
		});
	}

	public async removeSong(ytid: string) {
		await this.db.song.deleteMany({
			where: { ytid: ytid }
		});
	}

	public async getAllSongs() {
		return await this.db.song.findMany();
	}

	public async checkInPlaylist(ytid: string, playlistId: number | null = null) {
		const result = await this.getFromPlaylist(ytid, playlistId);
		if (result.length == 0) return false;
		return true;
	}

	public async getFromPlaylist(ytid: string, playlistId: number | null = null) {
		if (playlistId) {
			return await this.db.content.findMany({
				where: { AND: { playlist_id: playlistId, song_ytid: ytid } }
			});
		}
		else {
			return await this.db.content.findMany({
				where: { song_ytid: ytid }
			});
		}
	}

	public async addToPlaylist(playlistId: number, song: Song) {
		// add song if it doesn't exist in database
		const songResult = await this.addSong(song);

		// check if default playlist exists
		const playlist = await this.getPlaylist(playlistId);

		if (playlist) {
			// check if relation exists already
			const content = await this.db.content.findFirst({
				where: { AND: { playlist_id: playlistId, song_ytid: songResult.ytid } }
			});

			if (!content) {
				// create relation between song and playlist
				await this.db.content.create({
					data: { song_ytid: songResult.ytid, playlist_id: playlist.id }
				});
			}
		}
	}

	public async removeFromPlaylist(playlistId: number, ytid: string) {
		await this.db.content.deleteMany({
			where: { AND: { playlist_id: playlistId, song_ytid: ytid } }
		});

		if (!(await this.checkInPlaylist(ytid))) {
			await this.removeSong(ytid);
		}
	}

	public async getRandomFromPlaylist(playlistId: number, amount: number) {
		const playlist = await this.getPlaylist(playlistId);
		if (!playlist) return null;

		// raw SQL because random() is not supported in Prisma
		// selects <amount> of songs from playlist with <playlistId> in random order
		const result = await this.db.$queryRaw<Content[]>(Prisma.sql(
			[`SELECT * FROM content WHERE playlist_id = ${playlistId} ORDER BY random() LIMIT ${amount}`]
		));

		// convert to Song objects
		let converted = await (Promise.all(result.map(async content => {
			// fetch song from db by ytid
			const song = await this.getSong(content.song_ytid);
			if (!song) return null;

			return new Song(
				URL + content.song_ytid,
				song.title,
				song.author,
				song.duration.toString(),
				"random"
			);
		})));

		return converted.filter((s): s is Song => s != null);
	}

	public async getByTimeFromPlaylist(playlistId: number, amount: number, order: "asc" | "desc" = "asc") {
		const playlist = await this.getPlaylist(playlistId);
		if (!playlist) return null;

		if (order != "asc" && order != "desc") throw new Error("Invalid order in getByTimeFromPlaylist()");

		const result = await this.db.content.findMany({
			where: { playlist_id: playlistId }, orderBy: { playtime_date: order }, take: amount
		});

		// convert to Song objects
		let converted = await (Promise.all(result.map(async content => {
			// fetch song from db by ytid
			const song = await this.getSong(content.song_ytid);
			if (!song) return null;

			return new Song(
				URL + content.song_ytid,
				song.title,
				song.author,
				song.duration.toString(),
				order == "asc" ? "oldest" : "latest"
			);
		})));

		return converted.filter((s): s is Song => s != null);
	}

	public async updateSongPLaytime(ytid: string, playlistId: number, date: Date = new Date()) {
		// find content id
		const content = await this.db.content.findFirst({
			where: { AND: { playlist_id: playlistId, song_ytid: ytid } }
		});

		if (!content) return;

		// update playtime
		await this.db.content.update({
			where: { id: content.id }, data: { playtime_date: date }
		});
	}

	public async getAllGuildPlaylists(guildId: string) {
		return await this.db.playlist.findMany({
			where: { guild_id: guildId }
		});
	}

	public async getAllSongsInPlaylist(playlistId: number) {
		const contents = await this.db.content.findMany({
			where: { playlist_id: playlistId }
		});

		const songs = await this.db.song.findMany({
			where: { ytid: { in: contents.map(c => c.song_ytid) } }
		});

		return songs;
	}

	public async dbCleenup() {
		// find songs that are not in any playlist
		const songs = await this.getAllSongs();
		for (const song of songs) {
			if (!(await this.checkInPlaylist(song.ytid))) {
				this.removeSong(song.ytid);
				console.log(`Removed song ${song.ytid} -> ${song.title}`);
			}
		}
	}
}
