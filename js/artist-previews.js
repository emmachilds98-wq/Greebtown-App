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
  "Peaches": { spotifyArtist: "1gkSl4XpHIHI4I1WQbfXOE", soundcloud: "https://soundcloud.com/peachesnisker", youtubeChannel: "http://www.youtube.com/channel/UCAVB5fxiG2CYxS74w3qUpqw", instagram: "https://www.instagram.com/peachesnisker/" },
  "Kae Tempest": { spotifyArtist: "1O3wYcUD08X9yb6J3xaw5M", soundcloud: "https://soundcloud.com/kaetempest", youtubeChannel: "https://www.youtube.com/channel/UCds3t8SvEFkiqXWwVIi9IQg", instagram: "https://www.instagram.com/kaetempest/" },
  "Hak Baker": { spotifyArtist: "5QsqiLFA5Z2gmpKBbxQB2j", soundcloud: "https://soundcloud.com/hakbaker", youtubeChannel: "https://www.youtube.com/channel/UCCXVm1QtI9bVGH7_Bgcjsgw", instagram: "https://www.instagram.com/hakbaker/" },
  "Panic Shack": { spotifyArtist: "26HCuM5PamldoaHII5Ifxc", youtubeChannel: "https://www.youtube.com/channel/UCMV_H2YjdXmzp5DLRywnIYQ", instagram: "https://www.instagram.com/panicshack/" },
  "Beardyman": { spotifyArtist: "6lITXT7V1VIC7nwlgh8ycO", soundcloud: "https://soundcloud.com/beardyman", youtubeChannel: "https://www.youtube.com/channel/UC-_zxXP5Qo4D4eoWe4gFC_w", instagram: "https://www.instagram.com/beardymanofficial/" },
  "Lynks": { spotifyArtist: "44tV2d4RDeMsS2sLOdcXHD", soundcloud: "https://soundcloud.com/lynksafrikka", youtubeChannel: "https://www.youtube.com/channel/UCfT4PNfVf-NMxgorz02Bsjg", instagram: "https://www.instagram.com/lynkslynkslynks" },
  "Henge": { spotifyArtist: "5R09pajxQjiwdUH6Fw4yM5", soundcloud: "https://soundcloud.com/hengemusic", youtubeChannel: "https://www.youtube.com/channel/UCIsYg7VvHTAw9rk3BuMAipw", instagram: "https://www.instagram.com/henge_cosmicdross" },
  "Rose Gray": { spotifyArtist: "5YYrWH3w4JYijU4JZrOXWA", soundcloud: "https://soundcloud.com/oseray", youtubeChannel: "https://www.youtube.com/channel/UCwBKtW5UEKfHpdRrhbyW3Pw", instagram: "https://www.instagram.com/rosegray_/" },
  "Gurriers": { spotifyArtist: "0bPAi2zCrxUrPBREWdetZ5", youtubeChannel: "https://www.youtube.com/channel/UCNdXGw1baUM2smmk1WPNUxA", instagram: "https://www.instagram.com/gurriersband/" },
  "Dub Pistols": { spotifyArtist: "4LYX3rRdXV2l99wR5YPFoK", soundcloud: "https://soundcloud.com/dubpistols", youtubeChannel: "http://www.youtube.com/channel/UC-ocgQ-8Y7zg81SMSpEgoFQ", instagram: "https://www.instagram.com/dubpistol" },
  "Dutty Moonshine": { spotifyArtist: "2aRD3jAqJXXE6luSkvLp3W", soundcloud: "https://soundcloud.com/duttymoonshine", youtubeChannel: "https://www.youtube.com/user/DuttyMoonshine", instagram: "https://www.instagram.com/duttymoonshinebigband/" },
  "Nubiyan Twist": { spotifyArtist: "5HNkGissAKlCv88sus7rVO", soundcloud: "https://soundcloud.com/nubiyantwist", youtubeChannel: "https://www.youtube.com/user/NubiyanTwist", instagram: "https://www.instagram.com/nubiyantwist/" },
  "999999999": { spotifyArtist: "6uD2LjPHUjxrpax0se17Nc", soundcloud: "https://soundcloud.com/999999999music", instagram: "https://www.instagram.com/999999999_live/" },
  "Brutalismus 3000": { spotifyArtist: "6LtXxYMIiKSy2EGHnz1f5j", soundcloud: "https://soundcloud.com/brutalismus-3000", instagram: "https://www.instagram.com/brutalismus3000/" },
  "Marlon Hoffstadt": { spotifyArtist: "0HHa7ZJZxUQlg5l2mB0N0f", soundcloud: "https://soundcloud.com/marlonhoffstadt", youtubeChannel: "https://www.youtube.com/user/MarlonHoffstadt", instagram: "https://www.instagram.com/marlonhoffstadt/" },
  "VTSS": { spotifyArtist: "0zo109NM3S7CqHpvlXwqEN", soundcloud: "https://soundcloud.com/vtss", youtubeChannel: "https://www.youtube.com/channel/UC1hS4zcYjl9n7ODh29bVsAA", instagram: "https://www.instagram.com/vtss/" },
  "SBTRKT": { spotifyArtist: "1O10apSOoAPjOu6UhUNmeI", soundcloud: "https://soundcloud.com/sbtrkt", youtubeChannel: "https://www.youtube.com/user/SBTRKT", instagram: "https://www.instagram.com/sbtrkt/" },
  "The Bloody Beetroots": { spotifyArtist: "0QJKELJZZuLAjqLOOixJm5", soundcloud: "http://soundcloud.com/thebloodybeetroots", youtubeChannel: "https://www.youtube.com/channel/UCVpnCPbd_jmm2c4WGg9qzqg", instagram: "https://www.instagram.com/thebloodybeetrootsofficial" },
  "Frankie Stew and Harvey Gunn": { spotifyArtist: "1jVvXqdwDHekLwFBamrcUx", soundcloud: "https://soundcloud.com/fsandhg", youtubeChannel: "https://www.youtube.com/channel/UCkXwVPgZgcMVmx0Ts3MDh3A", instagram: "https://www.instagram.com/fsandhg/" },
  "Eats Everything": { spotifyArtist: "4W991QdgKWX4TO864ypInA", soundcloud: "https://soundcloud.com/eatseverything", youtubeChannel: "https://www.youtube.com/user/MrEatsEverything", instagram: "https://www.instagram.com/eatseverything/" },
  "TSHA": { spotifyArtist: "2kLa7JZu4Ijdz1Gle2khZh", soundcloud: "https://soundcloud.com/tshamusic", youtubeChannel: "https://www.youtube.com/channel/UCZmwUDJ4yCqrTgHcnA8ncmQ", instagram: "https://www.instagram.com/tshamusic/" },
  "Ross From Friends": { spotifyArtist: "1Ma3pJzPIrAyYPNRkp3SUF", soundcloud: "https://soundcloud.com/rossfromfriends", youtubeChannel: "https://www.youtube.com/channel/UCQF0bMNU7G-F07QuLJEJ0GQ", instagram: "https://www.instagram.com/rossfromfriends/" },
  "Folamour": { spotifyArtist: "6pJY5At9SiMpAOBrw9YosS", soundcloud: "https://soundcloud.com/folamour", youtubeChannel: "https://www.youtube.com/channel/UC6cU5MIwHhDe-83ycfHEbyA", instagram: "https://www.instagram.com/folamour_fhuo/" },
  "Alix Perez": { spotifyArtist: "4e6pQ61gYReORJoXcrQH1Z", soundcloud: "http://soundcloud.com/alixperez", instagram: "https://www.instagram.com/alixperez1985/" },
  "Hamdi": { spotifyArtist: "7vvicoei9BbKpZix8qSeLg", soundcloud: "https://soundcloud.com/hamdiofficialmusic", youtubeChannel: "https://www.youtube.com/channel/UCsvs03ZW_Mko0LP4HerZG_w", instagram: "https://www.instagram.com/hamdimusic/" }
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
  ["Dutty Moonshine Big Band", "Dutty Moonshine"],
  ["999999999 AV Show", "999999999"],
  ["Sbtrkt DJ Set", "SBTRKT"],
  ["Frankie Stew & Harvey Gunn", "Frankie Stew and Harvey Gunn"],
  ["Alix Perez Ft. Sp:Mc", "Alix Perez"],
].forEach(([alias, canonical])=>{
  if(window.ARTIST_PREVIEWS[canonical]) window.ARTIST_PREVIEWS[alias] = window.ARTIST_PREVIEWS[canonical];
});
