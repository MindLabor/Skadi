
// REQUIRES
const Discord = require("discord.js");

// Displays the help embed that corresponds to the given command
const help = function(help) {
  switch (help) {
    case "help":
      return createHelpEmbed();
  }
  return "";
}

// Creates the "help" embed
function createHelpEmbed() {
  return new Discord.MessageEmbed()
    .setColor("#6441a5")
    .setTitle("Help")
    .setAuthor("Skadi Music Bot", "https://i.ibb.co/hcJKwVC/Download.png", "https://github.com/MindLabor/Skadi")
		.setDescription(
			`**1. play:** Play a song or put it in the current queue. \n
			**2. stop:** Stop the music and leave channel. This will delete the current queue. \n
			**3. skip:** Skip the current song and play the next. \n
			**4. queue:** Show all songs in the current queue. \n
			**5. clear:** Clears all messages in a chat. Maximum of 100 messages at a time. \n
			**6. songs:** Show 5 songs from an artist. \n
			**7. lyrics:** Show the lyrics of a given song. \n
			**8. search:** Search a particular song. \n
			**9. help:** Show all available commands.`)
    .setTimestamp()
    .setFooter("Made by MindLabor", "https://avatars0.githubusercontent.com/u/42311986?s=460&u=98d019e97af5c0169bfd9a9d298be22b93833dfc&v=4");
}

// Export ONLY public functions
module.exports = {
  help
}
