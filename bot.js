const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const CommandMapper = require("./commandMapper.js");
const https = require("https");
const Helper = require("./Helper.js");
const Tools = require("./Tools.js");
const Youtube = require('simple-youtube-api');
const GENIUS = require("./Genius.js");
const {
	prefix,
	token,
	genius_token,
	youtube_token
} = require("./config.json");

const client = new Discord.Client();
const youtube = new Youtube(youtube_token);
let list = [];
let playlists = new Map();
let playlistVideos = new Map();
let voiceChannel, textChannel, connection;
let noDescription = false;
let currentSongInfo;
let looping = false;

// Initilize Command
client.once("ready", () => {
	console.log("Ready!");

	// Config Commands
	CommandMapper.on("play", (message) => {
		execute(message);
	}).on("stop", (message) => {
		stop(message);
	}).on("skip", (message) => {
		skip(message);
	}).on("queue", (message) => {
		listQueue(message);
	}).on("clear", (message) => {
		clearChat(message);
	}).on("loop", (message) => {
		loop(message);
	}).on("songs", (message) => {
		showSongs(message);
	}).on("lyrics", (message) => {
		showLyrics(message);
	}).on("search", (message) => {
		search(message);
	}).on("help", () => {
		help();
	});
});

client.on("message", async message => {
	if (message.author.bot) return;
	if (!message.content.startsWith(prefix)) return;

	// Parsing Command
	let command = message.content.substr(prefix.length).split(" ");
	if (command.length === 0) return;
	let sentPrefix = command[0];
	delete command[0];
	let sentArgs = command.join(" ").trim();

	textChannel = message.channel;

	// Executing Command
	CommandMapper.execute(sentPrefix, message, () => {
		message.channel.send("**Jeg forstår deg ikke!** - This command doesn't exist!");
	});
});

async function clearChat(message) {
	let fetched;
	do {
		fetched = await message.channel.messages.fetch({
			limit: 100
		});
		message.channel.bulkDelete(fetched);
	}
	while (fetched.size >= 2);
}

async function execute(message) {
	const args = message.content.split(" ");

	// Parse message
	let commands = Tools.parseMessage(message.content) || "";
	if (commands === "" || commands.args.all.length < 1) return;

	// Check if user is in voice channel
	voiceChannel = message.member.voice.channel;
	if (voiceChannel) {
		textChannel.send(new Discord.MessageEmbed()
			.setColor("#6441a5")
			.setDescription("**Bli med på en talekanal!** - You have to be in a voice channel!"));
		return;
	}


	// Check if bot has permissions
	/*const permissions = voiceChannel.permissionsFor(message.client.user);
	if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
		return message.channel.send(
			"**Jeg har ikke tillatelser!** - I don't have any permissions!"
		);
	}*/

	console.log(commands.str);
	if (url.includes("list=")) {
		await addYTPlaylist(commands.str);
	} else {
		// Update status
		client.user.setActivity("Musikk", {
			type: "STREAMING",
			url: "https://www.youtube.com/watch?v=" + args[1]
		});

		// Get Youtube song infos
		const songInfo = await ytdl.getInfo(args[1]);
		currentSongInfo = songInfo;

		// Save song infos
		let song_thumnails = songInfo.player_response.videoDetails.thumbnail.thumbnails;
		const song = {
			title: songInfo.title,
			url: songInfo.video_url,
			author: songInfo.author,
			channelId: songInfo.channelId,
			description: songInfo.description,
			thumbnail: songInfo.video_thumbnail,
			length: songInfo.length_seconds,
			player: song_thumnails.length > 0 ? song_thumnails[song_thumnails.length - 1] : undefined,
			embed: null
		};

		// If the queue is empty
		if (list.length === 0) {

			// PLAY SONG THE FIRST TIME

			try {
				var c = await voiceChannel.join();
				connection = c;

				list.push(song);
				play(false);
			} catch (err) {
				console.log(err);
				return message.channel.send(err);
			}
		} else {

			// PUT SONG IN QUEUE

			let secs = parseInt(song.length);
			let mins = Math.floor(secs / 60);
			secs -= mins * 60;
			let hs = Math.floor(mins / 60);
			mins -= hs * 60;

			let embed = createEmbed(song.title + " er i køen!", song.url, [song.author.name, song.author.avatar, song.author.channel_url], song.description.substring(0, 122) + "...", song.player.url, [(hs > 0 ? (hs + "h ") : "") + (mins > 0 ? (mins + "m ") : "") + (secs > 0 ? (secs + "s") : ""), song.author.avatar]);


			if (song.embed == null)
				textChannel.send(embed);

			song.embed = embed;
			list.push(song);
		}
	}
}

async function addNext() {
	if (list.length <= 0) return;
	if ((list[0].playlist || "") === "") return;
	if (list[0].remaining <= 0) {
		list.shift();
		return;
	}
	const videos = playlistVideos.get(list[0].playlist);
	const video = await videos[videos.length - list[0].remaining].fetch();
	const id = video.raw.id;

	let songInfo;
	try {
		songInfo = await ytdl.getInfo(id);
	} catch (e) {
		list[0].remaining--;
		addNext();
	}
	currentSongInfo = songInfo;

	// Save song infos
	let song_thumnails = songInfo.player_response.videoDetails.thumbnail.thumbnails;
	const song = {
		title: songInfo.title,
		url: songInfo.url,
		author: songInfo.author,
		channelId: songInfo.author.id,
		description: songInfo.description,
		thumbnail: songInfo.author.avatar,
		length: songInfo.length,
		player: songInfo.player,
		embed: null
	};

	list[0].song = song;
	showPlaylistEmbed(song);
}

async function addYTPlaylist(url) {
	try {
		const playlist = await youtube.getPlaylist(url);
		const videosObj = await playlist.getVideos();
		playlists.put(playlist.raw.id, playlist);
		playlistVideos.put(playlist.raw.id, videosObj);
		const song = {
			playlist: playlist.raw.id,
			remaining: videosObj.length,
			song: ""
		};
		list.push(song);
	} catch (err) {
		Tools.logError(textChannel, err);
	}

}

function showPlaylistEmbed() {
	let embed = createEmbed(song.title || "", song.url || "", [song.author.name, song.author.avatar, song.author.channel_url], song.description.substring(0, 122) + "...", song.player === undefined ? "" : (song.player.url || ""), [Tools.secsToString(song.length), song.author.avatar]);
	textChannel.send(embed);
}

function loop(message) {
	if (!message.member.voice.channel) {
		textChannel.send(new Discord.MessageEmbed()
			.setColor("#6441a5")
			.setDescription("**Bli med på en talekanal!** - You have to be in a voice channel!"));
		return;
	}

	// CHECK IF SONG IS PLAYING

	looping = !looping;
	if (looping) {
		textChannel.send(new Discord.MessageEmbed()
			.setColor("#6441a5")
			.setDescription("**Looping** is on"));
	} else {
		textChannel.send(new Discord.MessageEmbed()
			.setColor("#6441a5")
			.setDescription("**Looping** is off"));
	}
}

function skip(message) {
	if (!message.member.voice.channel) {
		Tools.logError(textChannel, "**Bli med på en talekanal!** - You have to be in a voice channel!");
		return;
	}

	if (list.length === 0) {
		Tools.logError(textChannel, "**Du kan ikke hoppe over!** - There is no song to skip!");
		return;
	} else if (list.length === 1) {
		Tools.logError(textChannel, "**Det er ikke flere sanger i køen!** - There are no more songs in the queue!");
	}

	noDescription = true;
	if (connection) {
		connection.dispatcher.end();
	} else
		Tools.logError(textChannel, "**Ingen musikk spiller!** - There is no music playing!");
}

function stop(message) {
	if (!message.member.voice.channel) {
		Tools.logError(textChannel, "**Bli med på en talekanal!** - You have to be in a voice channel!");
		return;
	}

	list = [];
	if (connection)
		connection.dispatcher.end();
	else
		Tools.logError(textChannel, "**Ingen musikk spiller!** - There is no music playing!");
}

function listQueue(message) {
	if (!message.member.voice.channel) {
		Tools.logError(textChannel, "**Bli med på en talekanal!** - You have to be in a voice channel!");
		return;
	}

	if (list.length <= 0) {
		Tools.logError(textChannel, "**Gjeldende kø er tom!** - The current queue is empty!");
		return;
	}

	textChannel.send(createQueueEmbed());
}

function help() {
	textChannel.send(Helper.help("help"));
}

async function play(originFromSkip) {
	if (list.length <= 0) {
		voiceChannel.leave();
		return;
	}
	if (originFromSkip)
		textChannel.send(createQueueHeadEmbed());
	let song = list[0];
	if ((list[0].playlist || "") !== "")
		song = list[0].song;
	const dispatcher = connection
		.play(ytdl(song.url))
		.on("finish", () => {
			if (!looping) {
				if ((list[0].playlist || "") !== "") {
					list[0].remaining--;
					await addNext();
				} else
					list.shift();
			}
			play(true);
		})
		.on("error", error => console.error(error));
	dispatcher.setVolumeLogarithmic(1);

	let embed = createEmbed(song.title, song.url, [song.author.name, song.author.avatar, song.author.channel_url], song.description.substring(0, 122) + "...", song.player.url, [Tools.secsToString(song.length), song.author.avatar]);

	if (!noDescription)
		textChannel.send(embed);
	noDescription = false;
}

function showSongs(message) {
	// Parse message
	let commands = Tools.parseMessage(message.content) || "";
	if (commands === "" || commands.args.all.length <= 0) return;

	let moreThan1Argument = commands.args.all.length > 1;
	let artistName = moreThan1Argument ? commands.args.allWithoutLast : commands.args.last;
	let songsPerPage = moreThan1Argument ? commands.args.last : 5;
	if (songsPerPage !== 5) {
		try {
			songsPerPage = parseInt(commands.args.last);
		} catch (e) {
			console.log("ERROR: Songsperpage is not a number");
			return;
		}
		if (songsPerPage > 20 || songsPerPage < 1) {
			songsPerPage = 20;
		}
	}
	let artist = "",
		artistThumb = "";
	GENIUS.getArtistIdByName(artistName, () => {
		textChannel.send(new Discord.MessageEmbed()
			.setColor("#6441a5")
			.setDescription("**I did not find any songs from the artist " + artistName.trim() + "**"));
	}).then(artistId => {
		artist = artistId.primary_artist.name;
		artistThumb = artistId.primary_artist.image_url;
		GENIUS.getSongsByArtist(artistId.primary_artist.id, songsPerPage, 'popularity', r => {
			let songList = GENIUS.filterSongList(r.songs);

			//console.log(genius.getSongLyrics("https://api.genius.com/songs/" + data[0].api));
			if (songList.length <= 0) {
				textChannel.send(new Discord.MessageEmbed()
					.setColor("#6441a5")
					.setDescription("**I did not find any songs from the artist " + sentArgs + "**"));
				return;
			}

			let embed = new Discord.MessageEmbed()
				.setAuthor(artist, artistThumb, "")
				.setColor("#6441a5")
				.setTitle(songList.length + " Songs");

			let index = 1;
			for (s of songList) {
				embed.addField("**" + index + ".  " + Tools.capitalize(s.title.trim()) + "**", Tools.capitalize(s.full_title.trim()), false);
				index++;
			}

			textChannel.send(embed);
		}, err => console.error(err));
	}).catch(err => console.error(err));
}

function showLyrics(message) {
	// Parse message
	let commands = Tools.parseMessage(message.content) || "";
	if (commands === "") return;

	GENIUS.search(commands.str, (song) => {
		let artistName = song.primary_artist.name;
		let artistThumb = song.primary_artist.image_url;
		let songTitle = song.title;

		artistName = Tools.clean(artistName);
		songTitle = Tools.clean(songTitle);

		// Show Lyrics
		GENIUS.getSongLyrics({
			title: songTitle,
			artist: artistName
		}, (lyrics) => {
			showLyricsEmbed(lyrics, artistName, artistThumb, Tools.capitalize(song.title))
		}, (error) => Tools.logError(textChannel, error));

	}, (error) => Tools.logError(textChannel, error));

}

function search(message) {
	// Parse message
	let commands = Tools.parseMessage(message.content) || "";
	if (commands === "" || commands.args.all.length < 1) return;

	GENIUS.search(commands.str, (song) => {

		let embed = createGeniusSongEmbed(Tools.capitalize(song.title), [song.primary_artist.name, song.primary_artist.image_url], Tools.capitalize(song.full_title), song.song_art_image_thumbnail_url);
		textChannel.send(embed);

	}, (error) => {
		textChannel.send(new Discord.MessageEmbed()
			.setColor("#6441a5")
			.setDescription(error));
	});
}


function showLyricsEmbed(lyrics, artist, artistThumb, title) {
	let messages = Tools.wordWrap(lyrics, 1850).split("#~#~#");
	if (messages.length <= 0) return;

	let embed = new Discord.MessageEmbed()
		.setAuthor(artist, artistThumb, "")
		.setTitle(title)
		.setColor("#6441a5")
		.setDescription(messages[0]);
	textChannel.send(embed);
	messages.shift();

	for (m of messages) {
		let embed = new Discord.MessageEmbed()
			.setColor("#6441a5")
			.setDescription(m);
		textChannel.send(embed);
	}
}


function createQueueEmbed() {
	let embed = new Discord.MessageEmbed()
		.setColor("#6441a5")
		.setTitle("Køen");

	let secs = 1,
		index = 1;
	for (song of list) {
		let fra = Tools.secsToString(secs);
		let til = Tools.secsToString(secs + parseInt(song.length));
		embed.addField("**" + index + ".  " + song.title + "**", "Fra **" + fra + "** til **" + til + "**", false);
		secs += parseInt(song.length);
		index++;
	}

	return embed;
}

function createQueueHeadEmbed() {
	let embed = new Discord.MessageEmbed()
		.setColor("#6441a5")
		.setTitle("Playing");

	embed.addField("**" + list[0].title + "**", "**Length:** " + Tools.secsToString(list[0].length), false);

	return embed;
}

function createGeniusSongEmbed(title, author, desc, thumb) {
	return new Discord.MessageEmbed()
		.setColor("#6441a5")
		.setTitle(title)
		.setAuthor(...author)
		.setDescription(desc)
		.setImage(thumb)
		.setTimestamp();
}

function createEmbed(title, url, author, desc, thumb, footer) {
	return new Discord.MessageEmbed()
		.setColor("#6441a5")
		.setImage(thumb)
		.setTitle(title)
		.setURL(url)
		.setAuthor(...author)
		.setDescription(desc)
		.setTimestamp()
		.setFooter(...footer);
}


client.login(token);
