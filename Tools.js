const Discord = require("discord.js");
const {
  prefix
} = require("./config.json");
const commands = [];

const on = function(command, callback) {
  commands.push({
    command: command,
    callback: callback
  });
  return this;
}

const execute = function(command, message, fallback) {
  for (c of commands) {
    if (c.command === command) {
      c.callback(message);
      return;
    }
  }
  fallback();
}

const wordWrap = function(str, maxWidth) {
  var newLineStr = "#~#~#";
  done = false;
  res = '';
  while (str.length > maxWidth) {
    found = false;
    // Inserts new line at first whitespace of the line
    for (i = maxWidth - 1; i >= 0; i--) {
      if (testWhite(str.charAt(i))) {
        res = res + [str.slice(0, i), newLineStr].join('');
        str = str.slice(i + 1);
        found = true;
        break;
      }
    }
    // Inserts new line at maxWidth position, the word is too long to wrap
    if (!found) {
      res += [str.slice(0, maxWidth), newLineStr].join('');
      str = str.slice(maxWidth);
    }

  }

  return res + str;
}

function testWhite(x) {
  var white = new RegExp(/^\s$/);
  return white.test(x.charAt(0));
};

const secsToString = function(s) {
  let secs = parseInt(s);
  let mins = Math.floor(secs / 60);
  secs -= mins * 60;
  let hs = Math.floor(mins / 60);
  mins -= hs * 60;

  return (hs > 0 ? (hs + "h ") : "") + (mins > 0 ? (mins + "m ") : "") + (secs > 0 ? (secs + "s") : "");
}


const capitalize = function(s) {
  let found = false;
  let result = "";
  for (c of s) {
    if (!found && c.match(/^[A-Za-z]$/)) {
      result += c.toUpperCase();
      found = true;
    } else
      result += c;
  }
  return result;
};

const clean = function(s) {
  let result = "";
  for (c of s) {
    if (c.match(/^[A-Za-z ]$/)) {
      result += c;
    }
  }
  return result;
};

const parseMessage = function(message) {
  if (!message.startsWith(prefix)) return;
  message = message.substr(prefix.length);

  let quotationMarks = (message.match(/\"/g) || []).length;
  if (quotationMarks % 2 == 0) message = quotationEncoder(message);

  let commandArr = message.replace(/[\s]+/g, " ").split(" ");
  let quotEncodedArr = commandArr;
  commandArr = commandArr.map(e => quotationDecoder(e));
  if (commandArr.length <= 0) return;
  else if (commandArr.length === 1) {
    return {
      str: commandArr[0],
      args: {
        all: "",
        first: "",
        last: "",
        allWithoutLast: ""
      }
    };
  }

  commandArr.shift();
  quotEncodedArr.shift();
  let stringForm = commandArr.join(" ");
  let encodedStringForm = quotEncodedArr.join(" ");
  return {
    str: stringForm,
    args: {
      all: commandArr,
      first: commandArr[0],
      last: commandArr[commandArr.length - 1],
      allWithoutLast: quotationDecoder(encodedStringForm.substring(0, encodedStringForm.lastIndexOf(" ")))
    }
  };
}

const quotationEncoder = function(message) {
  let inQuot = false;
  let out = "";
  for (c of message) {
    if (c === "\"") {
      inQuot = !inQuot;
      continue;
    }
    if (inQuot && c === " ") c = "%space%";
    out += c;
  }
  return out;
}

const quotationDecoder = function(message) {
  return message.replace(/\%space\%/g, " ");
}

const logError = function(textChannel, error) {
  textChannel.send(new Discord.MessageEmbed()
    .setColor("#6441a5")
    .setDescription(error));
  console.log(error);
}

const filterSongObject = function(song) {
  let song_thumnails = song.player_response.videoDetails.thumbnail.thumbnails;
  const filteredSong = {
    title: song.title,
    url: song.video_url,
    author: song.author,
    channelId: song.channelId,
    description: song.description,
    thumbnail: song.video_thumbnail,
    length: song.length_seconds,
    player: song_thumnails.length > 0 ? song_thumnails[song_thumnails.length - 1] : undefined,
    embed: null
  };
  return filteredSong;
}

// Checks if user is in voice channel
const isUserInVoiceChannel = function(message, textChannel) {
  voiceChannel = message.member.voice.channel;
  if (!voiceChannel) {
    textChannel.send(new Discord.MessageEmbed()
      .setColor("#6441a5")
      .setDescription("You have to be in a voice channel!"));
    return false;
  }
  return voiceChannel;
}

// Checks if user is in voice channel
const hasBotPermissions = function(bot, voiceChannel, textChannel, perms) {
  const permissions = voiceChannel.permissionsFor(bot);
  for (perm of perms) {
    if (!permissions.has(perm)) {
      Tools.logError(textChannel, "**I need the following permissions to do this:** " + perms.join(" "));
      return false;
    }
  }
  return true;
}

const levenshteinDistance = function(a, b) {
  if (a.length == 0) return b.length;
  if (b.length == 0) return a.length;

  var matrix = [];

  // increment along the first column of each row
  var i;
  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // increment each column in the first row
  var j;
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
          Math.min(matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1)); // deletion
      }
    }
  }

  return matrix[b.length][a.length];
};

module.exports = {
  wordWrap,
  secsToString,
  capitalize,
  clean,
  parseMessage,
  logError,
  on,
  execute,
  filterSongObject,
  isUserInVoiceChannel,
  hasBotPermissions,
  levenshteinDistance
}
