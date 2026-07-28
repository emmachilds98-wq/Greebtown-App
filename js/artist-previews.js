// Hand-verified music preview links, keyed by exact artist name — same
// sourcing discipline as js/artist-bios.js: an entry only goes in once
// someone has actually confirmed it's that artist's own official
// Spotify/SoundCloud/YouTube, never guessed from a similar name. Being
// wrong here means playing someone else's music under an artist's name,
// which is worse than having no preview at all.
//
// Shape per entry (all fields optional — include only what's verified):
//   "Artist Name": {
//     spotify: "<track or artist ID from the open.spotify.com/track/<ID> or /artist/<ID> URL>",
//     soundcloud: "<full track or profile URL, e.g. https://soundcloud.com/handle/track-slug>",
//     youtube: "<video ID from youtube.com/watch?v=<ID>>"
//   }
//
// Starts empty deliberately (see js/app.js's artistPreviewEntry() /
// artistPreviewBlockHtml() for how this is used) — every artist still
// gets working "search on Spotify/SoundCloud/YouTube" buttons with no
// verification needed, since a search-by-exact-name link can't
// misattribute anything. Add entries here over time as they're
// individually confirmed, the same way artist-bios.js grew.
window.ARTIST_PREVIEWS = {};
