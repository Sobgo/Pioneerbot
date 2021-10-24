'use strict';

// maybe use embeds ???

var MessageProvider = {

	prefix: "!",

	loop: function (state) {

		let stateString = (state) ? "enabled" : "disabled";
		return (
			`:arrows_counterclockwise:  **Loop ${ stateString }!**`
		);
	},

	noQuery: function () {
		return (
			":x: You need to specify search query!"
		);
	},

	channelSet: function (channel) {
		return (
			"Announcements channel set to " + channel.toString() + "."
		);
	},

	removed: function (song, count) {
		if(count > 1) {
			return (
				":white_check_mark:  **Removed** " + count + " songs from queue."
			);
		}
		else {
			return (
				":white_check_mark:  **Removed from queue:** " + song.title
			);
		}

	},

	busy: function (user, channel) {
		user.toString() + " you can't disconnect me form " +  channel.toString() + ". There are users listening to music!"
	},

	vote: function (vote) {
		let voteString = (vote == 1) ? "yes" : "no";
		return (
			"You voted **" + voteString + "** for this song"
		);
	},

	noVote: function () {
		return (
			"You didn't vote for this song yet!"
		);
	},

	trackingData: function (id, songId, data) {
		return (
			"\nTotal play count: **" + data[id][songId].count + "**   Voting score: **" +
			(data[id][songId].score) + "**"
		);
	},

	trackingAlreadySet: function (state) {
		let stateString = (state) ? "enabled" : "disabled";
		return (
			":x:  **Tracking is already" + stateString + "**!"
		);
	},

	trackingToggled: function (state) {
		let stateString = (state) ? "enabled" : "disabled";
		return (
			":white_check_mark:  **Tracking " + stateString + "**!"
		);
	},

	alreadyVoted: function (vote) {
		let voteString = (vote == 1) ? "yes" : "no";
		return (
			":x:  You already voted **" + voteString + "** for this song!"
		);
	},

	voteSet: function (vote, score) {
		let voteString = (vote == 1) ? "yes" : "no";
		return (
			":white_check_mark:  Vote set to **" + voteString + "**. Song's new score is: **" + score + "**!"
		);
	},
	
	voteChanged: function (vote, score) {
		let voteString = (vote == 1) ? "yes" : "no";
		return (
			":white_check_mark:  Vote changed to **" + voteString + "**. Song's new score is: **" + score + "**!"
		);
	}, 

	voteRemoved: function (score) {
		return (
			":white_check_mark:  Vote removed. Song's new score is: **" + score + "**!"
		);
	}, 

	cantRemoveVote: function () {
		return (
			":x:  Can't remove vote. You didn't vote for this song yet!"
		);
	}, 

	skipped: function (count, song = null) {

		if(count > 1){
			return (
				":fast_forward:  **Skipped** " + count + " songs from queue."
			);
		}
		return (
			":fast_forward:  **Skipped**: " + song.title + "."
		);
	},

	trackingRequired: function () {
		return (
			":x:  Tracking is disabled, enable tracking to vote."
		);
	},

	outOfScope: function (action) {
		return (
			":x:  Can't " + action + ".  Specified position does not exist in queue!"
		);
	},

	addedToQueue: function (song, pos) {
		return (
			"**:memo:  Added to queue: **" + song.title +
			"\nQueue position: **" + pos + "**"
		);
	},

	duplicate: function () {
		return (
			":x:  This song is already in queue!"
		);
	},

	noVoiceChannel: function () {
		return (
			":x: I'm not in a voice channel!"
		);
	},

	queue: function (queue, count) {
		let msg = ":page_with_curl:  **Songs in queue:**\n" + queue.toString(count);
		if(queue.length() - count - 1 > 0){
			msg = msg + "\n*and " + (queue.length() - count - 1).toString() + " more...*";
		}
		return msg;
	},

	emptyQueue: function () {
		return (
			":page_with_curl: **No songs in queue**."
		)
	},

	notPlaying: function () {
		return (
			"Nothing is playing right now."
		);
	},

	noSong: function () {
		return (
			":x:  No song was found with given query."
		);
	},

	playing: function (song) {
		return (
			"**:notes:  Now Playing:** " + song.title + "\nAuthor: " + 
			song.author.name + "    Duration: [" + song.duration + "]\nRequested by: " + song.user.displayName
		);
	},

	noCommand: function (message, length = 1) {
		let content = message.content.trim().split(" ");
		content[0].slice(this.prefix.length);

		let msg = "No command:";
		for(let iter = 0; iter < Math.min(length, content.length); iter += 1){
			msg = msg + " " + content[iter].toString();
		}
		msg += ", type: `" + this.prefix + "help` for command list";

		return msg;
	},

	joinChannel: function (user) {
		return (
			user.toString() + " you need to join voice channel to use this command!"
		);
	},

	joinBotChannel: function (user, channel) {
		return (
			user.toString() + "You need to join " + channel.toString()
			+ " to use this command!\n" + "You can also use `" + this.prefix
			+ "join` to make me join your Voice Channel."
		);
	},

	trackingEnabled: function () {
		return (
			":card_box:  Tracking is **enabled** for this server\n"+ 
			"if you want to disable it type: `"+ this.prefix +"tracking disable`\n" + 
			"**Warrning**: this action is irreversable so after doing it all your data will be lost!"
		);
	},

	trackingDisabled: function() {
		return (
			":card_box:  Tracking is **disabled** for this server\n"+
			"If you want to enable it type: `"+ this.prefix +"tracking enable`\n" +
			"When enabled aditional data will be collected about played songs and a server playlist will be created\n" +
			"This also will let you vote on currently playing songs."
		);
	},

	dm: function() {
		return (
			'Hey! I\'m Pioneer a discord music bot! I can play music for you.\n' +
			'You just need to join same server with me and type one of the commands from list below:\n\n'
		);
	},

	info: function() {
		return (
			'\nFor list of commands type: `'+ this.prefix +'help`'
		);
	},

	help: function () {
	// TO DO rewrite this, add sr, sp, loop

		return (
			'**Available commands:**\n' +
			'**•** `'+ this.prefix +'tracking [enable/disable]` `(t [1/0])` *- enables or disables tracking additional data, type: `'+ this.prefix +'tracking` for more info*\n' +
			'**•** `'+ this.prefix +'vote [yes/no/remove]` `(v [1/-1/0])` *- make, check or remove vote form song, requires tracking enabled and song playing*\n' +
			'**•** `'+ this.prefix +'play [<query>/<url>]` `(p)` *- searches song with `<query>` or by `<url>`, adds it to queue and if no song is playing plays it*\n' +
			'**•** `'+ this.prefix +'queue <count>` `(q)` *- lists first `<count>` songs in queue, default `<count>` is 10*\n' +
			'**•** `'+ this.prefix +'skip <pos>` `(s)` *- skips to `<pos>` in queue and starts playing it, default `<pos>` is 1*\n' +
			'**•** `'+ this.prefix +'remove <pos> <count>` `(r)` *- removes `<count>` songs form queue starting form `<position>` inclusive, default `<count>` is 1*\n' +
			'**•** `'+ this.prefix +'join` `(j)` *- connects bot to your voice chat*\n' +
			'**•** `'+ this.prefix +'leave` `(l)` *- disconnects bot from voice chat*\n' +
			'**•** `'+ this.prefix +'help` `(h)` *- shows this list*\n\n'+
			'*All keywords can be repalced with shortened forms from brackets.*'
		);
	}
}

module.exports = MessageProvider;
