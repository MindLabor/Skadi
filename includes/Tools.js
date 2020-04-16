
// REQUIRES
const Discord = require("discord.js");
const {
  prefix
} = require("./test-config.json"); 
const commands = [];

// Register command for execution
const on = function(command, callback) {
  commands.push({
    command: command,
    callback: callback
  });
  return this;
}

// Execute the function that corresponds to the command
const execute = function(command, message, fallback) {
  for (c of commands) {
    if (c.command === command) {
      c.callback(message);
      return;
    }
  }
  fallback();
}

// Wrap to long strings into an array and try to wrap by a whole word
const wordWrap = function(str, maxWidth) {
	// Temporary placeholder for a new line
	str = str.replace(/#~#~#/g, "");
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

// Test if x is a whitespace character
function testWhite(x) {
  var white = new RegExp(/^\s$/);
  return white.test(x.charAt(0));
}

// Turns seconds to a h:m:s string (3664 => "1h 1m 4s")
const secsToString = function(s) {
  let secs = parseInt(s);
  let mins = Math.floor(secs / 60);
  secs -= mins * 60;
  let hs = Math.floor(mins / 60);
  mins -= hs * 60;
  return (hs > 0 ? (hs + "h ") : "") + (mins > 0 ? (mins + "m ") : "") + (secs > 0 ? (secs + "s") : "");
}

// Capitalize the first non-whitespace character of a string
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

// Clean a string from non-alphabetical characters and allow space (no !.,:\n etc.)
const clean = function(s) {
  let result = "";
  for (c of s) {
    if (c.match(/^[A-Za-zÀ-ž\u0370-\u03FF\u0400-\u04FF ]$/)) {
      result += c;
    }
  }
  return result;
};

// Parse a message/commands into an argument object
const parseMessage = function(message) {
  if (!message.startsWith(prefix)) return;
  message = message.substr(prefix.length);

  let quotationMarks = (message.match(/"/g) || []).length;
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

// Used to consider message arguments that are in quotations
// Encodes Space characters to prevent splitting the argument
const quotationEncoder = function(message) {
  if (!message) return "";
  let quotationMarks = (message.match(/\"/g) || []).length;
  if (quotationMarks % 2 != 0) return message;

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

// Used to consider message arguments that are in quotations
// Decodes Space characters @see quotationEncoder()
const quotationDecoder = function(message) {
  return message.replace(/%space%/g, " ");
}

// Shows an error embed
const logError = function(textChannel, error) {
  textChannel.send(new Discord.MessageEmbed()
    .setColor("#6441a5")
    .setDescription(error));
  console.log(error);
}

// Filters only the needed information from a given song object
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

// Calculates the Levenshtein distance (The amount of single character edits to convert a string to another)
// Used to calculate the similarity of two strings (The lower the result, the more similar are they)
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

// Export ONLY public functions
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
  levenshteinDistance,
  quotationEncoder
}
