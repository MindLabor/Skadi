const Discord = require("discord.js");
const ytdl = require("ytdl-core");
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

let queue = [];
let voiceChannel, textChannel, connection;
let currentSong;
let playing = false;

let noDescription = false;
let looping = false;

// Initilize Command
client.once("ready", () => {
	console.log("Ready!");

	// Config Commands
	Tools.on("play", (message) => {
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
	Tools.execute(sentPrefix, message, () => {
		message.channel.send("This command doesn't exist!");
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
	// Check if user is in voice channel
	voiceChannel = Tools.isUserInVoiceChannel(message, textChannel);
	if (!voiceChannel) return;

	// Check if the bot has permissions to connect to the voice channel and to speak in it
	if (!Tools.hasBotPermissions(message.client.user, voiceChannel, textChannel, ["CONNECT", "SPEAK"])) return;

	// Parse message
	let commands = Tools.parseMessage(message.content) || "";
	if (commands === "" || commands.args.all.length < 1) return;

	// Add the url/s to the queue
	// Check if a given url could be a YT playlist
	if (commands.str.includes("list=")) {
		//await addYTPlaylist(commands.str);
		// TODO: Incomplete Implementation
		return;
	} else {
		const id = commands.str;
		const videoExists = await ytVideoIdExists(id);
		if (videoExists) {
			queue.push(`https://www.youtube.com/watch?v=${id}`);
		} else {
			Tools.logError(textChannel, "I did not find the given video on Youtube!");
			return;
		}
	}

	// If there were already a song in the queue (This is not the first song)
	if (queue.length > 1) {
		let song = await fetchQueueSong(queue[queue.length-1]);
		let embed = createEmbed("Added \"" + song.title + "\" to the playlist!", song.url, [song.author.name, song.author.avatar, song.author.channel_url], song.description.substring(0, 122) + "...", song.player.url, [Tools.secsToString(song.length), song.author.avatar]);
		textChannel.send(embed);
		return;
	}

	// Connect to the voice channel and play the queue
	try {
		connection = await voiceChannel.join();
		play(true);
	} catch (err) {
		Tools.logError(textChannel, err);
	}
}

async function play(firstSong) {
	playing = true;

	// If there are no more songs in the queue leave the voice channel
	if (queue.length <= 0) {
		leaveVoiceChannel();
		return;
	}

	// Play song
	createAudioDispatcher();

	// Create and send Discord embed of the current song
	const song = await fetchQueueHeadSong();
	currentSong = song;
	if (firstSong) {
		let embed = createEmbed(song.title, song.url, [song.author.name, song.author.avatar, song.author.channel_url], song.description.substring(0, 122) + "...", song.player.url, [Tools.secsToString(song.length), song.author.avatar]);
		textChannel.send(embed);
	} else {
		let embed = createEmbed("Playing: " + song.title, song.url, [song.author.name, song.author.avatar, song.author.channel_url], "", "", [Tools.secsToString(song.length), song.author.avatar]);
		textChannel.send(embed);
	}

	client.user.setActivity("Music", {
		type: "STREAMING",
		url: queue[0]
	});
}

function createAudioDispatcher() {
	const dispatcher = connection.play(ytdl(queue[0]))
		.on("finish", () => {

			// Remove the current song from the queue
			if (!looping)
				queue.shift();

			// Play the next song in the queue
			play();

		}).on("error", error => console.error(error));
	dispatcher.setVolumeLogarithmic(1);
}


// Get Youtube song infos from the current song (queue head)
async function fetchQueueSong(url) {
		const songInfos = await ytdl.getInfo(url);
		if (!songInfos) return false;
		return Tools.filterSongObject(songInfos);
}

// Get Youtube song infos from the current song (queue head)
async function fetchQueueHeadSong() {
		return await fetchQueueSong(queue[0]);
}

async function ytVideoIdExists(id) {
	try {
		return await ytdl.getInfo(id);
	} catch (err) {
		return false;
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
	const video = await videos[videos.length - queue[0].remaining].fetch();
	const id = video.raw.id;

	let songInfo;
	try {
		songInfo = await ytdl.getInfo(id);
	} catch (e) {
		list[0].remaining--;
		addNext();
	}

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

	// TODO: CHECK IF SONG IS PLAYING

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

// Skips the current playing song
function skip(message) {
	// Check if user is in voice channel
	voiceChannel = Tools.isUserInVoiceChannel(message, textChannel);
	if (!voiceChannel) return;

	// If the queue is empty
	if (queue.length === 0) {
		Tools.logError(textChannel, "**The playlist is already empty!**");
		return;
	}

	if (connection) {
		connection.dispatcher.end();
	} else
		Tools.logError(textChannel, "**There is no music playing!**");
}

// Stops the current playing song, empties the queue and leaves the voice channel
function stop(message) {

	// Check if user is in voice channel
	voiceChannel = Tools.isUserInVoiceChannel(message, textChannel);
	if (!voiceChannel) return;

	queue = [];
	if (connection)
		connection.dispatcher.end();
	else
		Tools.logError(textChannel, "**There is no music playing!**");
}

function listQueue(message) {
	// Check if user is in the voice channel
	if (!Tools.isUserInVoiceChannel)
		return;

	// Check if the queue is empty
	if (queue.length <= 0) {
		Tools.logError(textChannel, "**The current queue is empty!**");
		return;
	}

	textChannel.send(createQueueEmbed());
}

function help() {
	textChannel.send(Helper.help("help"));
}

function showSongs(message) {
	// Parse message
	let commands = Tools.parseMessage(message.content) || "";
	if (commands === "" || commands.args.all.length <= 0) return;

	// Set options
	let artistName = commands.args.allWithoutLast;
	let songsPerPage = 5;

	// Prevent overflow
	songsPerPage = parseInt(commands.args.last.trim());
	if (isNaN(songsPerPage)) {
		songsPerPage = 5;
		artistName = commands.str;
	} else {
		if (songsPerPage > 20) songsPerPage = 20;
		else if(songsPerPage < 1) songsPerPage = 5;
	}

	let artist = "";
	let artistThumb = "";
	// Search artist
	GENIUS.searchArtist(artistName, (response) => {
		artist = response.name;
		artistThumb = response.image_url;

		// Get songs from artist
		GENIUS.getSongsByArtist(response.id, songsPerPage, 'popularity', r => {
			let songList = GENIUS.filterSongList(r.songs);

			// If song list is empty
			if (songList.length <= 0) {
				Tools.logError(textChannel, "**I did not find any songs from the artist " + sentArgs + "!**");
				return;
			}

			// Show songs
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
	}, (error) => {
		Tools.logError(textChannel, error);
	});
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
		console.log (artistName, songTitle);

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
		.setTitle("Current Playlist");

	let secs = 1;
	let index = 1;
	for (song of queue) {
		const from = Tools.secsToString(secs);
		const to = Tools.secsToString(secs + parseInt(currentSong.length));
		embed.addField("**" + index + ".  " + currentSong.title + "**", "From **" + from + "** to **" + to + "**", false);
		secs += parseInt(currentSong.length);
		index++;
	}

	return embed;
}

function createQueueHeadEmbed() {
	let embed = new Discord.MessageEmbed()
		.setColor("#6441a5")
		.setTitle("Playing");

	embed.addField("**" + queue[0].title + "**", "**Length:** " + Tools.secsToString(list[0].length), false);

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
	let embed = new Discord.MessageEmbed()
		.setColor("#6441a5")
		.setTitle(title)
		.setURL(url)
		.setImage(thumb)
		.setAuthor(...author)
		.setDescription(desc)
		.setTimestamp()
		.setFooter(...footer);
	if (thumb !== "")
		embed.setImage(thumb)
	return embed;
}

function leaveVoiceChannel() {
	// TODO: Check if voiceChannel is set
	voiceChannel.leave();
	connection = null;
	playing = false;
}


client.login(token);
