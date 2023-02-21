"use strict";
import { getVideoId } from "@/scrapper";
import { shuffle } from "@/utils";
import { Song } from "@/structures/Song";

export class Queue {
	public current: Song | null = null;
	private songs: Song[] = [];

	/** 
	 * Returns current length of a Queue.
	 */
	public get length() {
		return this.songs.length;
	}
	
	/**
	 * Returns true if Queue is empty, false otherwise.
	 */
	public empty() {
		return this.length === 0;
	}

	/**
	 * Returns first song form a Queue. If Queue has no songs, undefined is returned.
	 */
	public front(): Song | undefined {
		if (this.songs.length > 0) {
			return this.songs[0];
		}
		return undefined;
	}

	/**
	 * Adds songs to a Queue at `[position]` and returns the new length of the Queue.
	 * @param position - Position in a Queue form which to start adding songs.
	 * @param items - Array of songs to add to the Queue.
	 */
	public add(position: number, ...items: Song[]): number {
		this.songs.splice(position, 0, ...items);
		return this.length;
	}

	/**
	 * Appends songs to the end of a Queue and returns the new length of the Queue.
	 * @param items - Array of songs to add to the Queue.
	 */
	public push(items: Song | Song[]): number {
		if (items instanceof Song) {
			return this.add(this.length, items);
		}
		else {
			return this.add(this.length, ...items);
		}
	}

	/**
	 * Removes `[count]` songs from a Queue starting at `[position]` and returns them.
	 * @param position - Position in a Queue form which to start removing songs.
	 * @param count - The number of songs to remove. Default: 1
	 */
	public remove(position: number, count: number = 1): Song[] {
		return this.songs.splice(position, count);
	}

	/**
	 * Removes first `[count]` songs form a Queue and returns them.
	 * @param count - The number of songs to remove. Default: 1
	 */
	public pop(count: number = 1): Song[] | undefined {
		return this.remove(0, count);
	}

	/**
	 * Sets first song in a Queue as current and returns it.
	 * If Queue is empty, undefined is returned and current song is set to null.
	 */
	public next() {
		const song = this.pop();
		if (song) {
			this.current = song[0];
			return this.current;
		}
		this.current = null;
		return undefined;
	}

	/**
	 * Determines whether the Queue contains certain song, returning true or false appropriately.
	 * @param song - Song to search for.
	 */
	public contains(song: Song): boolean {
		const id = getVideoId(song.url);
		return this.songs.some((element) => { return (getVideoId(element.url) === id) });
	}

	/**
	 * Returns section of the Queue. Works like Array.slice() so negative values can also be used to indicate an offset from the end of the Queue.
	 * @param start - The beginning index of the specified portion of the Queue. If start is undefined, then the section begins at index 0.
	 * @param end - The end index of the specified portion of the Queue. This is exclusive of the element at the index 'end'. If end is undefined, then the section extends to the end of the queue.
	 */
	public get(start?: number, end?: number): Song[] {
		return this.songs.slice(start, end);
	}

	/**
	 * Returns song at `[position]` in a Queue. If position is out of range, undefined is returned.
	 * @param position - Position of a song in a Queue.
	 */
	public at (position: number): Song | undefined {
		return this.songs[position];
	}

	/**
	 * Shuffles the Queue.
	 */
	public shuffle() {
		if (this.length < 2) return;
		this.songs = shuffle(this.get());
	}
}
