function GENIUS() {}

const Genius = require("genius-api");
const {
	genius_token
} = require("./config.json");
const {
	getLyrics
} = require("genius-lyrics-api");
const genius = new Genius(genius_token);


const getArtist = function (id) {
	genius.artist(16775).then(function (response) {
		console.log('artist', response.artist);
	});
}

// Get artists ID by their name
const normalizeName = name => name.trim().replace(/\./g, ' ').toLowerCase();
const searchArtist = function (artistName, success, error) {

	// Normalize the name
	const artistNameNormalized = normalizeName(artistName);

	search(artistNameNormalized, (r) => {
		for (song of r.hits) {
			if (song.type === 'song') {
				success(song.result.primary_artist);
				break;
			}
		}
		error("**I did not find any songs related to " + query + "!");
	}, (e) => {
		error(e);
	});
}

const getSongLyrics = function (song, callback, error) {

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
				error("**I did not find any lyrics to the song " + song.full_title + "**")
				return;
			}
			callback(lyrics)
		}).catch(err => error(err));
}

const filterSongList = function (songList) {
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

const getSongsByArtist = function (id, count, sort, success, error) {
	genius.songsByArtist(id, {
			per_page: count,
			sort: sort,
		})
		.then(r => success(r))
		.catch(err => error(err));
}

const search = function (query, success, error) {
	genius.search(query).then(function (response) {
		for (hit of response.hits) {
			if (hit.type === "song") {
				success(hit.result);
				return;
			}
		}
		error("**I did not find any songs related to " + query + "!");
	});
}

module.exports = {
	genius,
	getArtist,
	getSongLyrics,
	filterSongList,
	getSongsByArtist,
	searchArtist,
	search
}
