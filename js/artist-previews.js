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
// Every artist still gets working "search on Spotify/SoundCloud/YouTube"
// buttons with no verification needed (see js/app.js's
// artistPreviewEntry() / artistPreviewBlockHtml()) — a search-by-exact-
// name link can't misattribute anything. Entries below add a verified
// layer on top of that: cross-checked via Viberate's artist database
// (matched on exact name + genre + country/city, not just name text),
// which is a licensed music-data source, not a guess from search
// results. Add more here over time the same way artist-bios.js grew.
//
// Shape: spotifyArtist embeds inline (Spotify's artist-page embed
// includes real 30s previews of their popular tracks). soundcloud
// embeds inline too (their widget accepts full profile URLs, not just
// individual tracks). youtubeChannel/instagram have no embeddable
// preview without a specific video ID, so those open the verified
// profile/channel directly instead of a generic search.
window.ARTIST_PREVIEWS = {
  "Skrillex": { spotifyArtist: "5he5w2lnU9x7JFhnwcekXX", soundcloud: "https://soundcloud.com/skrillex", youtubeChannel: "https://www.youtube.com/channel/UC_TVqp_SyG6j5hG-xVRy95A", instagram: "https://www.instagram.com/skrillex" },
  "Four Tet": { spotifyArtist: "7Eu1txygG6nJttLHbZdQOh", soundcloud: "https://soundcloud.com/four-tet", youtubeChannel: "https://www.youtube.com/channel/UC3sZYInu3YYkyIXBif83ZCg", instagram: "https://www.instagram.com/fourtetkieran" },
  "Kneecap": { spotifyArtist: "1ZVACPeq7ccGCoUXwtafUU", soundcloud: "https://soundcloud.com/user-89644332", youtubeChannel: "https://www.youtube.com/channel/UCR8_tdf_kr2tn01dFmRK6wQ", instagram: "https://www.instagram.com/kneecap32/" },
  "Scissor Sisters": { spotifyArtist: "3Y10boYzeuFCJ4Qgp53w6o", soundcloud: "https://soundcloud.com/scissorsisters", youtubeChannel: "https://www.youtube.com/channel/UCAxCX2gP7_73-UvM6n93OWw", instagram: "https://www.instagram.com/scissorsisters/" },
  "Madness": { spotifyArtist: "4AYkFtEBnNnGuoo8HaHErd", youtubeChannel: "http://www.youtube.com/channel/UC0iYPVu2agNaaqbnHFPCBFQ", instagram: "https://www.instagram.com/madnessband" },
  "Faithless": { spotifyArtist: "5T4UKHhr4HGIC0VzdZQtAE", soundcloud: "https://soundcloud.com/faithless", youtubeChannel: "https://www.youtube.com/user/faithlesssound", instagram: "https://www.instagram.com/faithlessofficial/" },
  "Shaggy": { spotifyArtist: "5EvFsr3kj42KNv97ZEnqij", soundcloud: "https://soundcloud.com/direalshaggy", youtubeChannel: "https://www.youtube.com/channel/UCBtln7sL3FYAY6ePguz9sNg", instagram: "https://www.instagram.com/direalshaggy" },
  "Ashnikko": { spotifyArtist: "3PyJHH2wyfQK3WZrk9rpmP", soundcloud: "https://soundcloud.com/ashnikko", youtubeChannel: "https://www.youtube.com/user/ashnick333", instagram: "https://www.instagram.com/ashnikko/" },
  "Groove Armada": { spotifyArtist: "67tgMwUfnmqzYsNAtnP6YJ", soundcloud: "https://soundcloud.com/groove-armada-1", youtubeChannel: "https://www.youtube.com/user/GrooveArmadaLive", instagram: "https://www.instagram.com/groovearmada/" },
  "Floating Points": { spotifyArtist: "2AR42Ur9PcchQDtEdwkv4L", soundcloud: "https://soundcloud.com/floatingpoints", youtubeChannel: "https://www.youtube.com/channel/UC5NbPNPbdLwAPPwWTJw0EbQ", instagram: "https://www.instagram.com/floatingpoints/" },
  "Princess Nokia": { spotifyArtist: "6lay1nwbE6hTx1jivysUAL", soundcloud: "https://soundcloud.com/princessnokia92", youtubeChannel: "https://www.youtube.com/channel/UCOhXzXIP3REaUQMXk9OnIZA", instagram: "https://www.instagram.com/princessnokia" },
  "Sampa the Great": { spotifyArtist: "7fw0E8WHdG3r9SuPBcGmWk", soundcloud: "https://soundcloud.com/sampa-tembo", youtubeChannel: "https://www.youtube.com/channel/UCHPHV1vMBvc-hce4Z5xP88A", instagram: "https://www.instagram.com/sampa_the_great/" },
  "Shy FX": { spotifyArtist: "5oDtp2FC8VqBjTx1aT4P5j", soundcloud: "https://soundcloud.com/shyfx", youtubeChannel: "https://www.youtube.com/channel/UCK9FPiAYUi18SAJRDVEgxOQ", instagram: "https://www.instagram.com/shyfx/" },
  "Sherelle": { spotifyArtist: "2TFDQkQ7LahhuwL9p7R6MO", soundcloud: "https://soundcloud.com/iamsherelle", youtubeChannel: "https://www.youtube.com/channel/UCeRnxh2z9k9QrD4WTgddwEg", instagram: "https://www.instagram.com/sherelle_/" },
  "Vengaboys": { spotifyArtist: "0cwmNvclzPd8mQnoHuIksj", soundcloud: "https://soundcloud.com/vengaboys-official", youtubeChannel: "http://www.youtube.com/channel/UC2-0suM5zJqTlyGRt-4GasA", instagram: "https://www.instagram.com/vengaboys" },
  "DJ EZ": { soundcloud: "https://soundcloud.com/djez", instagram: "https://www.instagram.com/djezofficial/" },
  "Peaches": { spotifyArtist: "1gkSl4XpHIHI4I1WQbfXOE", soundcloud: "https://soundcloud.com/peachesnisker", youtubeChannel: "http://www.youtube.com/channel/UCAVB5fxiG2CYxS74w3qUpqw", instagram: "https://www.instagram.com/peachesnisker/" }
};

// Aliases for exact lineup billing text that differs from the plain
// artist name above ("Groove Armada DJ Set", capitalisation
// differences, "Ft./B2B/AV Show" suffixes) — the preview lookup is an
// exact string match against artist.name, same as artist-bios.js, so
// these need their own entries even though they're the same act.
[
  ["Groove Armada DJ Set", "Groove Armada"],
  ["Floating Points Live", "Floating Points"],
  ["Sampa The Great", "Sampa the Great"],
  ["Shy FX Ft. Rage", "Shy FX"],
  ["Sherelle AV Show", "Sherelle"],
].forEach(([alias, canonical])=>{
  if(window.ARTIST_PREVIEWS[canonical]) window.ARTIST_PREVIEWS[alias] = window.ARTIST_PREVIEWS[canonical];
});
