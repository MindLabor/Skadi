function GENIUS() {}

// REQUIRES
const Tools = require("./Tools.js");
const Genius = require("genius-api");
const {
  genius_token
} = require("./../config.json");
const {
  getLyrics
} = require("genius-lyrics-api");
const genius = new Genius(genius_token);


// Get an artist from its id
const getArtist = function(id) {
  genius.artist(id).then(function(response) {
    console.log('artist', response.artist);
  });
}

// Get artists ID by their name
const normalizeName = name => name.trim().replace(/\./g, ' ').toLowerCase();
const searchArtist = function(artistName, success, error) {
  // Normalize the name
  const artistNameNormalized = normalizeName(artistName);
  searchAfterField(artistNameNormalized, "artist", (r) => {
    success(r.primary_artist);
  }, () => {
    error("**I did not find the artist " + query + "!**");
  });
}

// Get song lyrics from a given song
const getSongLyrics = function(song, callback, error) {
  // Normalize the name
  const artistNameNormalized = normalizeName(song.artist);
  const options = {
    apiKey: genius_token,
    title: song.title,
    artist: artistNameNormalized,
    optimizeQuery: true
  };

  getLyrics(options)
    .then(lyrics => {
      if ((lyrics || "") === "") {
        error("**I did not find any lyrics to the song \"" + song.title + "\"!**")
        return;
      }
      callback(lyrics)
    }).catch(err => error(err));
}

// Filters only the needed information from a given song list
const filterSongList = function(songList) {
  let filteredSongList = [];
  songList.forEach(song => filteredSongList.push({
    full_title: song.full_title,
    title: song.title,
    url: song.url,
    api: song.id,
    state: song.lyrics_state,
    thumb: song.song_art_image_thumbnail_url,
    artist: song.primary_artist.name,
    artistUrl: song.primary_artist.url,
    artistThumb: song.primary_artist.image_url
  }));
  return filteredSongList;
}

// Get exactly {count} number of songs from a given artist
const getSongsByArtist = function(id, count, sort, success, error) {
  genius.songsByArtist(id, {
      per_page: count,
      sort: sort,
    })
    .then(r => success(r))
    .catch(err => error(err));
}

// Search for a song
const search = function(query, success, error) {
  searchAfterField(query, "song", success, error);
}

// Search for a song that is most similar in its {field} to the query
const searchAfterField = function(query, field, success, error) {
  // TODO: Include popularity and full_title etc. into account
  genius.search(query).then(function(response) {
    let minLevenshteinDistance = 999999;
    let bestMatchedHit = "";
    for (hit of response.hits) {
      if (hit.type === "song") {
        let levenshteinDistance = Tools.levenshteinDistance(getFieldFromHit(hit.result, field, query), query);
        if (levenshteinDistance < minLevenshteinDistance) {
          minLevenshteinDistance = levenshteinDistance;
          bestMatchedHit = hit.result;
        }
      }
    }
    if (bestMatchedHit !== "") success(bestMatchedHit);
    else error();
  });
}

// Get a particular field from a song object [PRIVATE] - @see searchAfterField()
function getFieldFromHit(hit, field, query) {
  switch (field) {
    case "artist":
      return hit.primary_artist.name;
    case "song":
      return hit.title;
  }
  return query;
}

// Export ONLY public functions
module.exports = {
  genius,
  getArtist,
  getSongLyrics,
  filterSongList,
  getSongsByArtist,
  searchArtist,
  search
}
