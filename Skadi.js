
// REQUIRES
const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const https = require("https");
const Youtube = require('simple-youtube-api');

const Helper = require("./includes/Helper.js");
const Tools = require("./includes/Tools.js");
const GENIUS = require("./includes/Genius.js");
const {
  prefix,
  token,
  youtube_token
} = require("./config.json"); // 3= require("./test-config.json");

const client = new Discord.Client();
const youtube = new Youtube(Tools.youtube_token);

let queue = [];
let voiceChannel, textChannel, connection;
let currentSong;
let playing = false;

let noDescription = false;

client.once("ready", () => {
	 console.log("Registering Commands...");

  // Register Commandhandlers
  Tools.on("play", (message) => {
    start(message);
  }).on("stop", (message) => {
    stop(message);
  }).on("skip", (message) => {
    skip(message);
  }).on("queue", (message) => {
    listQueue(message);
  }).on("clear", (message) => {
    clearChat(message);
  }).on("loop", (message) => {
		// TODO: Implement Looping
  }).on("songs", (message) => {
    showSongs(message);
  }).on("lyrics", (message) => {
    showLyrics(message);
  }).on("search", (message) => {
    search(message);
  }).on("help", () => {
    help();
  });

	 console.log("Ready!");
});

// TODO: Show Loading messages

// When the user writes a message
client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(Tools.prefix)) return;
	textChannel = message.channel;

	// Parse message
	let commands = message.content.substring(Tools.prefix.length).split(" ");

  // Executing Command
  Tools.execute(commands[0], message, () => {
    message.channel.send("For help use **#help**");
  });
});

// Clear all messages from the current chat
// TODO: Delete only messages that don't throw an error (14 days error)
async function clearChat(message) {
	try {
	  let fetched;
	  do {
	    fetched = await message.channel.messages.fetch({
	      limit: 100
	    });
	    message.channel.bulkDelete(fetched);
	  }
	  while (fetched.size >= 2);
	} catch (err) {
		Tools.logError(textChannel, "**I couldn't delete the messages since some of them were older than 14 days!**");
	}
}

// Joins the channel and plays from the head of the queue
async function start(message) {
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
    let song = await fetchQueueSong(queue[queue.length - 1]);
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

// Plays a song from the head of the queue
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

// Streams the audio data from Youtube through the YTDL library
function createAudioDispatcher() {
  const dispatcher = connection.play(ytdl(queue[0]))
    .on("finish", () => {

      // Remove the current song from the queue
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

// Checks if the given YT Video ID exists
async function ytVideoIdExists(id) {
  try {
    return await ytdl.getInfo(id);
  } catch (err) {
    return false;
  }
}

// TODO: Playlists
/*
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
}*/

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

// Shows the current queue
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

// Shows the help embed
function help() {
  textChannel.send(Helper.help("help"));
}

// Fetches and shows the songs from a given artist
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
    else if (songsPerPage < 1) songsPerPage = 5;
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
      for (let s of songList) {
        embed.addField("**" + index + ".  " + Tools.capitalize(s.title.trim()) + "**", Tools.capitalize(s.full_title.trim()), false);
        index++;
      }
      textChannel.send(embed);
    }, err => console.error(err));
  }, (error) => {
    Tools.logError(textChannel, error);
  });
}

// Search for and show the lyrics of a given song
function showLyrics(message) {
  // Parse message
  let commands = Tools.parseMessage(message.content) || "";
  if (commands === "") return;

	// Search for song
  GENIUS.search(commands.str, (song) => {
    let artistName = song.primary_artist.name;
    let artistThumb = song.primary_artist.image_url;
    let songTitle = song.title;

    artistName = Tools.clean(artistName);
    songTitle = Tools.clean(songTitle);
    console.log(artistName, songTitle);

    // Show Lyrics
    GENIUS.getSongLyrics({
      title: songTitle,
      artist: artistName
    }, (lyrics) => {
      showLyricsEmbed(lyrics, artistName, artistThumb, Tools.capitalize(song.title))
    }, (error) => Tools.logError(textChannel, error));
  }, (error) => Tools.logError(textChannel, error));

}

// Searches for a song
function search(message) {
  // Parse message
  let commands = Tools.parseMessage(message.content) || "";
  if (commands === "" || commands.args.all.length < 1) return;

  GENIUS.search(commands.str, (song) => {
    let embed = createGeniusSongEmbed(Tools.capitalize(song.title), [song.primary_artist.name, song.primary_artist.image_url], Tools.capitalize(song.full_title), song.song_art_image_thumbnail_url);
    textChannel.send(embed);
  }, (error) => Tools.logError(textChannel, error));
}

// TODO: Export Embed creation to another module

// Shows the lyrics EMBED
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

  for (let m of messages) {
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
  for (let song of queue) {
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


client.login(Tools.token);
