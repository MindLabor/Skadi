<div align="center">
    <img src="https://github.com/MindLabor/Skadi/raw/master/favi.png" height="128" style="border-radius: 15px;">
    <h2>Skadi Music Bot</h2>
    <p align="center">
        <p>Skadi is a Music Bot for Discord that is written in node.js</p>
    </p>
<a href="https://www.codefactor.io/repository/github/mindlabor/skadi/overview/master"><img src="https://www.codefactor.io/repository/github/mindlabor/skadi/badge/master" alt="CodeFactor" /></a>&nbsp;&nbsp;<img src="https://travis-ci.com/MindLabor/Skadi.svg?branch=master" alt="Travis CI" />
</div>

# Installation
1. Setup API Tokens at [Youtube API](https://console.developers.google.com/apis), [Genius API](https://docs.genius.com/) and [Discord Bot Token](https://discordapp.com/developers/applications)
2. Put API Tokens in the `config.js` file
3. Run `npm install`
4. Start Bot with `node Skadi.js`

# Usage
**Command Structure:** \<prefix\>\<command\> \<args\>

**Commands:**
1. **play:** Play a track or put it in the current queue.
    - **play \<yt id\>:** Play from the youtube video with the given id.
2. **stop:** Stop the track. This will delete the current queue.
3. **skip:** Skip the current track and play the next. 
4. **queue:** Show all tracks in the current queue. 
5. **clear:** Clears all messages in a chat.  
6. **songs:** Show 5 songs from an artist.
    - **songs \<artist\> 14:** Show 14 songs from an artist.
7. **lyrics:** Show the lyrics of a given song.
    - **lyrics \<song\>:** Show the lyrics of a given song.
8. **search:** Search for a particular song. 
    - **search \<video\>:** Searches a video on Youtube.
9. **help:** Show all available commands.
