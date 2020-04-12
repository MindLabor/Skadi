const commands = [];

const on = function (command, callback) {
	commands.push({
		command: command,
		callback: callback
	});
	return this;
}

const execute = function (command, message, fallback) {
	for (c of commands) {
		if (c.command === command) {
			c.callback(message);
			return;
		}
	}
	fallback();
}

module.exports = {
	on,
	execute
}
