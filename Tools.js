const Discord = require("discord.js");
const {
	prefix
} = require("./config.json");

const wordWrap = function (str, maxWidth) {
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

const secsToString = function (s) {
	let secs = parseInt(s);
	let mins = Math.floor(secs / 60);
	secs -= mins * 60;
	let hs = Math.floor(mins / 60);
	mins -= hs * 60;

	return (hs > 0 ? (hs + "h ") : "") + (mins > 0 ? (mins + "m ") : "") + (secs > 0 ? (secs + "s") : "");
}


const capitalize = function (s) {
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

const clean = function (s) {
	let result = "";
	for (c of s) {
		if (c.match(/^[A-Za-z ]$/)) {
			result += c;
		}
	}
	return result;
};

const parseMessage = function (message) {
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

function quotationEncoder(message) {
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

function quotationDecoder(message) {
	return message.replace(/\%space\%/g, " ");
}

function logError(textChannel, error) {
	textChannel.send(new Discord.MessageEmbed()
		.setColor("#6441a5")
		.setDescription(error));
	console.log(error);
}

module.exports = {
	wordWrap,
	secsToString,
	capitalize,
	clean,
	parseMessage,
	logError
}
