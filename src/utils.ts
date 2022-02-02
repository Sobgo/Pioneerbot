'use strict';
import { Song } from "./structures";

export const secToTimestamp = (sec: string) => {
	let timestamp = '';
	let secInt = parseInt(sec);
	const hours = Math.floor(secInt / (60*60));
	const minutes = Math.floor(secInt / 60) % 60;
	const seconds = secInt % 60;

	if (hours) timestamp += hours + ":";
	if (hours && minutes < 10) timestamp += "0";
	timestamp += minutes + ":";
	if (seconds < 10) timestamp += "0";
	timestamp += seconds;
	return timestamp;
}

export const toList = (list: Song[]) => {
	return list.map((element, index) => {
		return `${index + 1}. ${element.title} | [${secToTimestamp(element.duration)}]` 
	}).join('\n');
}
