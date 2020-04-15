
// REQUIRES
const Discord = require("discord.js");
const {
  prefix
} = require("./../config.json");

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
    .setDescription("  ")
    .setAuthor("Skadi Music Bot", "https://i.ibb.co/hcJKwVC/Download.png", "")
    .addField("**1. play**", "Play a song or put it in the current queue.", false)
    .addField("**2. stop**", "Stop the music and leave channel. This will delete the current queue.", false)
    .addField("**3. skip**", "Skip the current song and play the next.", false)
    .addField("**4. queue**", "Show all songs in the current queue.", false)
    .addField("**5. clear**", "Clears all messages in a chat. Maximum of 100 messages at a time.", false)
    .addField("**6. loop**", "Loop the current song. To deactivate the loop use " + prefix + "loop again.", false)
    .addField("**7. songs**", "Show 5 songs from an artist.", false)
    .addField("**8. lyrics**", "Show the lyrics of a given song.", false)
    .addField("**9. search**", "Search a particular song.", false)
    .addField("**10. help**", "Show all available commands.", false)
    .setTimestamp()
    .setFooter("Made by Sexy Norweger");
}

// Export ONLY public functions
module.exports = {
  help
}
