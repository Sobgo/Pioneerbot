exports.prefix = "$";

// some longer messages
exports.get = (messageName) => {
	switch(messageName){
		case "trackingEnabled":
			return (
				":card_box:  Tracking is **enabled** for this server\n"+ 
				"if you want to disable it type: `"+ exports.prefix +"tracking disable`\n" + 
				"**Warrning**: this action is irreversable so after doing it all your data will be lost!" 
			);

		case "trackingDisabled":
			return (
				":card_box:  Tracking is **disabled** for this server\n"+
				"If you want to enable it type: `"+ exports.prefix +"tracking enable`\n" +
				"When enabled aditional data will be collected about played songs and a server playlist will be created\n" +
				"This also will let you vote on currently playing songs" 
			);

		case "help":
			return (
				'**Available commands:**\n' +
				'**•** `'+ exports.prefix +'tracking [enable/disable]` `(t [1/0])` *- enables or disables tracking additional data, type: `'+ exports.prefix +'tracking` for more info*\n' +
				'**•** `'+ exports.prefix +'vote [yes/no/remove]` `(v [1/-1/0])` *- make, check or remove vote form song, requires tracking enabled and song playing*\n' +
				'**•** `'+ exports.prefix +'play [<query>/<url>]` `(p)` *- searches song with `<query>` or by `<url>`, adds it to queue and if no song is playing plays it*\n' +
				'**•** `'+ exports.prefix +'queue <count>` `(q)` *- lists first `<count>` songs in queue, default `<count>` is 10*\n' +
				'**•** `'+ exports.prefix +'skip <pos>` `(s)` *- skips to `<pos>` in queue and starts playing it, default `<pos>` is 1*\n' +
				'**•** `'+ exports.prefix +'remove <pos> <count>` `(r)` *- removes `<count>` songs form queue starting form `<position>` inclusive, default `<count>` is 1*\n' +
				'**•** `'+ exports.prefix +'join` `(j)` *- connects bot to your voice chat*\n' +
				'**•** `'+ exports.prefix +'leave` `(l)` *- disconnects bot from voice chat*\n' +
				'**•** `'+ exports.prefix +'help` `(h)` *- shows this list*\n\n'+
				'*All keywords can be repalced with shortened forms from brackets*'
			);
			
		default:
			break;
	}
}
