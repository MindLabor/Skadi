<div align="center">
    <img src="https://github.com/MindLabor/Skadi/raw/master/favi.png" height="128" style="border-radius: 15px;">
    <h2>Skadi Music Bot</h2>
    <p align="center">
        <p>Skadi is a Music Bot for Discord that is written in node.js</p>
    </p>
    <a href="https://travis-ci.com/github/MindLabor/Skadi"><img src="https://travis-ci.com/MindLabor/Skadi.svg?branch=master" alt="Travis CI" /></a>&nbsp;&nbsp;<a href="https://www.codefactor.io/repository/github/mindlabor/skadi/overview/master"><img src="https://www.codefactor.io/repository/github/mindlabor/skadi/badge/master" alt="CodeFactor" /></a>

<a href='https://coveralls.io/github/MindLabor/Skadi?branch=master'><img src='https://coveralls.io/repos/github/MindLabor/Skadi/badge.svg?branch=master' alt='Coverage Status' /></a>


</div>

# Installation
1. Setup API Tokens at [Youtube API](https://console.developers.google.com/apis), [Genius API](https://docs.genius.com/) and [Discord Bot Token](https://discordapp.com/developers/applications)
2. Put API Tokens in the `config.js` file
3. Run `npm install`
4. Start Bot with `node Skadi.js` (or `skadi` when on Windows)

# Usage
**Command Structure:** \<prefix\>\<command\> \<args\>

**Commands:**
1. **play:** Play a track or put it in the current queue.
    - **play \<yt id\>:** Play from the YouTube video with the given id.
    - **play \<yt playlist url\>:** Add a YouTube playlist to the queue.
2. **stop:** Stop the track. This will delete the current queue.
3. **skip:** Skip the current track and play the next. 
4. **queue:** Show all tracks in the current queue. 
5. **clear:** Clears all messages in a chat.  
6. **songs:** Show 5 songs from an artist.
    - **songs \<artist\> 14:** Show 14 songs from an artist.
7. **lyrics:** Show the lyrics of a given song.
    - **lyrics \<song\>:** Show the lyrics of a given song.
8. **search:** Search for a particular song. 
    - **search \<video\>:** Searches a video on YouTube.
9. **help:** Show all available commands. 
