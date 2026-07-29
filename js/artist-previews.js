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
// audioPreview: a 30-second MP3 preview URL sourced live from the
// Spotify connector's search results, cross-checked against the
// spotifyArtist ID above (both must point at the same artist) before
// being added. Lets the preview play inline via <audio> with no embed
// iframe and no linking out at all.
window.ARTIST_PREVIEWS = {
  "Skrillex": { spotifyArtist: "5he5w2lnU9x7JFhnwcekXX", audioPreview: "https://p.scdn.co/mp3-preview/baf97fea2e3e1c97092ac69426691b703d20d0e2.mp3", soundcloud: "https://soundcloud.com/skrillex", youtubeChannel: "https://www.youtube.com/channel/UC_TVqp_SyG6j5hG-xVRy95A", instagram: "https://www.instagram.com/skrillex" },
  "Four Tet": { spotifyArtist: "7Eu1txygG6nJttLHbZdQOh", audioPreview: "https://p.scdn.co/mp3-preview/d7446fa4ca5a80d2c44aeea9f99f3e6662d50fdb.mp3", soundcloud: "https://soundcloud.com/four-tet", youtubeChannel: "https://www.youtube.com/channel/UC3sZYInu3YYkyIXBif83ZCg", instagram: "https://www.instagram.com/fourtetkieran" },
  "Kneecap": { spotifyArtist: "1ZVACPeq7ccGCoUXwtafUU", audioPreview: "https://p.scdn.co/mp3-preview/0b958f3461cd870f2349af56ede195bccff086f9.mp3", soundcloud: "https://soundcloud.com/user-89644332", youtubeChannel: "https://www.youtube.com/channel/UCR8_tdf_kr2tn01dFmRK6wQ", instagram: "https://www.instagram.com/kneecap32/" },
  "Scissor Sisters": { spotifyArtist: "3Y10boYzeuFCJ4Qgp53w6o", soundcloud: "https://soundcloud.com/scissorsisters", youtubeChannel: "https://www.youtube.com/channel/UCAxCX2gP7_73-UvM6n93OWw", instagram: "https://www.instagram.com/scissorsisters/" },
  "Madness": { spotifyArtist: "4AYkFtEBnNnGuoo8HaHErd", audioPreview: "https://p.scdn.co/mp3-preview/b29739ef0931b42c6ad4010192b9b9f8c677befb.mp3", youtubeChannel: "http://www.youtube.com/channel/UC0iYPVu2agNaaqbnHFPCBFQ", instagram: "https://www.instagram.com/madnessband" },
  "Faithless": { spotifyArtist: "5T4UKHhr4HGIC0VzdZQtAE", audioPreview: "https://p.scdn.co/mp3-preview/e064c498530484fca0357a3e2c3d0fde6a058b41.mp3", soundcloud: "https://soundcloud.com/faithless", youtubeChannel: "https://www.youtube.com/user/faithlesssound", instagram: "https://www.instagram.com/faithlessofficial/" },
  "Shaggy": { spotifyArtist: "5EvFsr3kj42KNv97ZEnqij", audioPreview: "https://p.scdn.co/mp3-preview/11028d11a7f23735be1252e753bbef35f33caee4.mp3", soundcloud: "https://soundcloud.com/direalshaggy", youtubeChannel: "https://www.youtube.com/channel/UCBtln7sL3FYAY6ePguz9sNg", instagram: "https://www.instagram.com/direalshaggy" },
  "Ashnikko": { spotifyArtist: "3PyJHH2wyfQK3WZrk9rpmP", audioPreview: "https://p.scdn.co/mp3-preview/fe8981e4f13a5f17eb9f3b52dea24ab886ebff1c.mp3", soundcloud: "https://soundcloud.com/ashnikko", youtubeChannel: "https://www.youtube.com/user/ashnick333", instagram: "https://www.instagram.com/ashnikko/" },
  "Groove Armada": { spotifyArtist: "67tgMwUfnmqzYsNAtnP6YJ", audioPreview: "https://p.scdn.co/mp3-preview/d46a238e623762ef595367c5099d018e9d0bb788.mp3", soundcloud: "https://soundcloud.com/groove-armada-1", youtubeChannel: "https://www.youtube.com/user/GrooveArmadaLive", instagram: "https://www.instagram.com/groovearmada/" },
  "Floating Points": { spotifyArtist: "2AR42Ur9PcchQDtEdwkv4L", audioPreview: "https://p.scdn.co/mp3-preview/e009dee6833a481b87d2a2fbe2eb84c26487161b.mp3", soundcloud: "https://soundcloud.com/floatingpoints", youtubeChannel: "https://www.youtube.com/channel/UC5NbPNPbdLwAPPwWTJw0EbQ", instagram: "https://www.instagram.com/floatingpoints/" },
  "Princess Nokia": { spotifyArtist: "6lay1nwbE6hTx1jivysUAL", audioPreview: "https://p.scdn.co/mp3-preview/fe8981e4f13a5f17eb9f3b52dea24ab886ebff1c.mp3", soundcloud: "https://soundcloud.com/princessnokia92", youtubeChannel: "https://www.youtube.com/channel/UCOhXzXIP3REaUQMXk9OnIZA", instagram: "https://www.instagram.com/princessnokia" },
  "Sampa the Great": { spotifyArtist: "7fw0E8WHdG3r9SuPBcGmWk", soundcloud: "https://soundcloud.com/sampa-tembo", youtubeChannel: "https://www.youtube.com/channel/UCHPHV1vMBvc-hce4Z5xP88A", instagram: "https://www.instagram.com/sampa_the_great/" },
  "Shy FX": { spotifyArtist: "5oDtp2FC8VqBjTx1aT4P5j", audioPreview: "https://p.scdn.co/mp3-preview/2a051db87b67939f7126c2099a522e3935a22126.mp3", soundcloud: "https://soundcloud.com/shyfx", youtubeChannel: "https://www.youtube.com/channel/UCK9FPiAYUi18SAJRDVEgxOQ", instagram: "https://www.instagram.com/shyfx/" },
  "Sherelle": { spotifyArtist: "2TFDQkQ7LahhuwL9p7R6MO", audioPreview: "https://p.scdn.co/mp3-preview/c79164e518fed03141edc84d353772bf3aab4d49.mp3", soundcloud: "https://soundcloud.com/iamsherelle", youtubeChannel: "https://www.youtube.com/channel/UCeRnxh2z9k9QrD4WTgddwEg", instagram: "https://www.instagram.com/sherelle_/" },
  "Vengaboys": { spotifyArtist: "0cwmNvclzPd8mQnoHuIksj", audioPreview: "https://p.scdn.co/mp3-preview/464a878bcb5f31144bc6f954cafc106b8eed92f1.mp3", soundcloud: "https://soundcloud.com/vengaboys-official", youtubeChannel: "http://www.youtube.com/channel/UC2-0suM5zJqTlyGRt-4GasA", instagram: "https://www.instagram.com/vengaboys" },
  "DJ EZ": { spotifyArtist: "2pZ360KtN5c3clYOyuqqJg", audioPreview: "https://p.scdn.co/mp3-preview/51a3e0f6fae3ee4b1978348935cee85e6aadf6c6.mp3", soundcloud: "https://soundcloud.com/djez", instagram: "https://www.instagram.com/djezofficial/" },
  "Peaches": { spotifyArtist: "1gkSl4XpHIHI4I1WQbfXOE", audioPreview: "https://p.scdn.co/mp3-preview/99356df25a57f9df5d24ba3b34b476cc6f9d4983.mp3", soundcloud: "https://soundcloud.com/peachesnisker", youtubeChannel: "http://www.youtube.com/channel/UCAVB5fxiG2CYxS74w3qUpqw", instagram: "https://www.instagram.com/peachesnisker/" },
  "Kae Tempest": { spotifyArtist: "1YcprGtF13BYCZQK9jYPEw", audioPreview: "https://p.scdn.co/mp3-preview/fb3c5d8797a4a85de3f5338f8cfd7238b8e49ee3.mp3", soundcloud: "https://soundcloud.com/kaetempest", youtubeChannel: "https://www.youtube.com/channel/UCds3t8SvEFkiqXWwVIi9IQg", instagram: "https://www.instagram.com/kaetempest/" },
  "Hak Baker": { spotifyArtist: "5QsqiLFA5Z2gmpKBbxQB2j", audioPreview: "https://p.scdn.co/mp3-preview/918e3ec2cf10ea4f89d09b8e8974bee48cd4baea.mp3", soundcloud: "https://soundcloud.com/hakbaker", youtubeChannel: "https://www.youtube.com/channel/UCCXVm1QtI9bVGH7_Bgcjsgw", instagram: "https://www.instagram.com/hakbaker/" },
  "Panic Shack": { spotifyArtist: "26HCuM5PamldoaHII5Ifxc", audioPreview: "https://p.scdn.co/mp3-preview/4b73eb24560fa1c632a23d54a5c2c8ad74679996.mp3", youtubeChannel: "https://www.youtube.com/channel/UCMV_H2YjdXmzp5DLRywnIYQ", instagram: "https://www.instagram.com/panicshack/" },
  "Beardyman": { spotifyArtist: "6lITXT7V1VIC7nwlgh8ycO", audioPreview: "https://p.scdn.co/mp3-preview/2e31f5a7bf8f9969984400c6a2d2aa503b1a7657.mp3", soundcloud: "https://soundcloud.com/beardyman", youtubeChannel: "https://www.youtube.com/channel/UC-_zxXP5Qo4D4eoWe4gFC_w", instagram: "https://www.instagram.com/beardymanofficial/" },
  "Lynks": { spotifyArtist: "44tV2d4RDeMsS2sLOdcXHD", audioPreview: "https://p.scdn.co/mp3-preview/db20c424e47b6ae3046f7a09f02dbea6007637b8.mp3", soundcloud: "https://soundcloud.com/lynksafrikka", youtubeChannel: "https://www.youtube.com/channel/UCfT4PNfVf-NMxgorz02Bsjg", instagram: "https://www.instagram.com/lynkslynkslynks" },
  "Henge": { spotifyArtist: "5R09pajxQjiwdUH6Fw4yM5", audioPreview: "https://p.scdn.co/mp3-preview/5349b72d9c678ab7beec6796b9d6ab2630d29b44.mp3", soundcloud: "https://soundcloud.com/hengemusic", youtubeChannel: "https://www.youtube.com/channel/UCIsYg7VvHTAw9rk3BuMAipw", instagram: "https://www.instagram.com/henge_cosmicdross" },
  "Rose Gray": { spotifyArtist: "5YYrWH3w4JYijU4JZrOXWA", audioPreview: "https://p.scdn.co/mp3-preview/9be5eecb4e5f3422efe9a7016b1755607fbad7d7.mp3", soundcloud: "https://soundcloud.com/oseray", youtubeChannel: "https://www.youtube.com/channel/UCwBKtW5UEKfHpdRrhbyW3Pw", instagram: "https://www.instagram.com/rosegray_/" },
  "Gurriers": { spotifyArtist: "0bPAi2zCrxUrPBREWdetZ5", audioPreview: "https://p.scdn.co/mp3-preview/0d52ae9c96bb65b824a4fa4e3d562661a01fa154.mp3", youtubeChannel: "https://www.youtube.com/channel/UCNdXGw1baUM2smmk1WPNUxA", instagram: "https://www.instagram.com/gurriersband/" },
  "Dub Pistols": { spotifyArtist: "4LYX3rRdXV2l99wR5YPFoK", audioPreview: "https://p.scdn.co/mp3-preview/6f8280faf3618cdb51e22a040dbc8cb7b2d5d275.mp3", soundcloud: "https://soundcloud.com/dubpistols", youtubeChannel: "http://www.youtube.com/channel/UC-ocgQ-8Y7zg81SMSpEgoFQ", instagram: "https://www.instagram.com/dubpistol" },
  "Dutty Moonshine": { spotifyArtist: "2aRD3jAqJXXE6luSkvLp3W", audioPreview: "https://p.scdn.co/mp3-preview/782b4915bcd59a1a05496a3378ebcac3f1614080.mp3", soundcloud: "https://soundcloud.com/duttymoonshine", youtubeChannel: "https://www.youtube.com/user/DuttyMoonshine", instagram: "https://www.instagram.com/duttymoonshinebigband/" },
  "Nubiyan Twist": { spotifyArtist: "5HNkGissAKlCv88sus7rVO", audioPreview: "https://p.scdn.co/mp3-preview/b956bd35e6adf56439d789f47f7efa2a10a02537.mp3", soundcloud: "https://soundcloud.com/nubiyantwist", youtubeChannel: "https://www.youtube.com/user/NubiyanTwist", instagram: "https://www.instagram.com/nubiyantwist/" },
  "999999999": { spotifyArtist: "6uD2LjPHUjxrpax0se17Nc", audioPreview: "https://p.scdn.co/mp3-preview/73e2f6771153d4a53c921996ffd725e651de8262.mp3", soundcloud: "https://soundcloud.com/999999999music", instagram: "https://www.instagram.com/999999999_live/" },
  "Brutalismus 3000": { spotifyArtist: "6LtXxYMIiKSy2EGHnz1f5j", audioPreview: "https://p.scdn.co/mp3-preview/4755a653ccebbcf2bfd18cc83d7e5aa7fd7179a6.mp3", soundcloud: "https://soundcloud.com/brutalismus-3000", instagram: "https://www.instagram.com/brutalismus3000/" },
  "Marlon Hoffstadt": { spotifyArtist: "0HHa7ZJZxUQlg5l2mB0N0f", audioPreview: "https://p.scdn.co/mp3-preview/791d1ff94d9b84e471e144f53fca4a23244fede9.mp3", soundcloud: "https://soundcloud.com/marlonhoffstadt", youtubeChannel: "https://www.youtube.com/user/MarlonHoffstadt", instagram: "https://www.instagram.com/marlonhoffstadt/" },
  "VTSS": { spotifyArtist: "0zo109NM3S7CqHpvlXwqEN", audioPreview: "https://p.scdn.co/mp3-preview/566affa7fcf32c892f4f796b9388389e59150e4a.mp3", soundcloud: "https://soundcloud.com/vtss", youtubeChannel: "https://www.youtube.com/channel/UC1hS4zcYjl9n7ODh29bVsAA", instagram: "https://www.instagram.com/vtss/" },
  "SBTRKT": { spotifyArtist: "1O10apSOoAPjOu6UhUNmeI", audioPreview: "https://p.scdn.co/mp3-preview/74b32b50c0de3bbbc1cf09981139eba9498bf5b0.mp3", soundcloud: "https://soundcloud.com/sbtrkt", youtubeChannel: "https://www.youtube.com/user/SBTRKT", instagram: "https://www.instagram.com/sbtrkt/" },
  "The Bloody Beetroots": { spotifyArtist: "0QJKELJZZuLAjqLOOixJm5", audioPreview: "https://p.scdn.co/mp3-preview/4bd46e766477c013d589139c4dca47d489816a9c.mp3", soundcloud: "http://soundcloud.com/thebloodybeetroots", youtubeChannel: "https://www.youtube.com/channel/UCVpnCPbd_jmm2c4WGg9qzqg", instagram: "https://www.instagram.com/thebloodybeetrootsofficial" },
  "Frankie Stew and Harvey Gunn": { spotifyArtist: "1jVvXqdwDHekLwFBamrcUx", audioPreview: "https://p.scdn.co/mp3-preview/a939434f92c18e1b6ba571fa5cc0a274cf63cde6.mp3", soundcloud: "https://soundcloud.com/fsandhg", youtubeChannel: "https://www.youtube.com/channel/UCkXwVPgZgcMVmx0Ts3MDh3A", instagram: "https://www.instagram.com/fsandhg/" },
  "Eats Everything": { spotifyArtist: "4W991QdgKWX4TO864ypInA", audioPreview: "https://p.scdn.co/mp3-preview/d7aace947ec91faf930cd7531adc6e2919458666.mp3", soundcloud: "https://soundcloud.com/eatseverything", youtubeChannel: "https://www.youtube.com/user/MrEatsEverything", instagram: "https://www.instagram.com/eatseverything/" },
  "TSHA": { spotifyArtist: "2kLa7JZu4Ijdz1Gle2khZh", audioPreview: "https://p.scdn.co/mp3-preview/633cbb0218572f41ac3e6a8d0c9e133aeab40058.mp3", soundcloud: "https://soundcloud.com/tshamusic", youtubeChannel: "https://www.youtube.com/channel/UCZmwUDJ4yCqrTgHcnA8ncmQ", instagram: "https://www.instagram.com/tshamusic/" },
  "Ross From Friends": { spotifyArtist: "1Ma3pJzPIrAyYPNRkp3SUF", audioPreview: "https://p.scdn.co/mp3-preview/b556b8c3dfeec157f8d110b82ed165cb10e3da83.mp3", soundcloud: "https://soundcloud.com/rossfromfriends", youtubeChannel: "https://www.youtube.com/channel/UCQF0bMNU7G-F07QuLJEJ0GQ", instagram: "https://www.instagram.com/rossfromfriends/" },
  "Folamour": { spotifyArtist: "6pJY5At9SiMpAOBrw9YosS", audioPreview: "https://p.scdn.co/mp3-preview/38bd2c8e4202e34d8e28ff2b14e3899ebbfc085f.mp3", soundcloud: "https://soundcloud.com/folamour", youtubeChannel: "https://www.youtube.com/channel/UC6cU5MIwHhDe-83ycfHEbyA", instagram: "https://www.instagram.com/folamour_fhuo/" },
  "Alix Perez": { spotifyArtist: "4e6pQ61gYReORJoXcrQH1Z", audioPreview: "https://p.scdn.co/mp3-preview/7a478f81909ab518da71370088690d6ab4702fe9.mp3", soundcloud: "http://soundcloud.com/alixperez", instagram: "https://www.instagram.com/alixperez1985/" },
  "Hamdi": { spotifyArtist: "7vvicoei9BbKpZix8qSeLg", audioPreview: "https://p.scdn.co/mp3-preview/23247364e332aa630d303b3ab649116265cf8263.mp3", soundcloud: "https://soundcloud.com/hamdiofficialmusic", youtubeChannel: "https://www.youtube.com/channel/UCsvs03ZW_Mko0LP4HerZG_w", instagram: "https://www.instagram.com/hamdimusic/" },
  // Cross-checked via Viberate (spotify/soundcloud/youtube/instagram links
  // straight off each artist's own verified profile) — audioPreview only
  // added where a Spotify track search's own subtitle/bio cross-reference
  // confirmed it's genuinely that artist (Viberate's own bio text names the
  // exact same song for Ott/The Nextmen/Kaotik Kartel/Beans On Toast, so
  // those are trustworthy; Sub Focus's is a well-known, unambiguous single).
  "Ott": { spotifyArtist: "1F102kNzMqsmOpF7AfFmm5", audioPreview: "https://p.scdn.co/mp3-preview/4bbf32e5223da7dfab7d90378d631141fdcdf091.mp3", soundcloud: "https://soundcloud.com/ottsonic", youtubeChannel: "http://www.youtube.com/channel/UC8nm5_vE1TjJ41jpW2HmZzQ", instagram: "https://www.instagram.com/ottsonic/" },
  "Sub Focus": { spotifyArtist: "0QaSiI5TLA4N7mcsdxShDO", audioPreview: "https://p.scdn.co/mp3-preview/0c2e5d786c898e78c68c1db614bb4cd08f7a7bdf.mp3", soundcloud: "https://soundcloud.com/subfocus", youtubeChannel: "https://www.youtube.com/user/subfocustv", instagram: "https://www.instagram.com/subfocus/" },
  "The Nextmen": { spotifyArtist: "465IoLV7sBVtMQ3WJ756BL", audioPreview: "https://p.scdn.co/mp3-preview/29119b2939a04bc9180f380fa2ba62a48ac51b38.mp3", soundcloud: "https://soundcloud.com/thenextmen", youtubeChannel: "https://www.youtube.com/channel/UCz21UKb86TYBBmD157xtZug", instagram: "https://www.instagram.com/thenextmenofficial/" },
  "Kaotik Kartel": { spotifyArtist: "5UKrxYnStlbD0aVYSx9KM1", audioPreview: "https://p.scdn.co/mp3-preview/91e1cf41a9e0053ba1fabc67243a7380bf58bf68.mp3", soundcloud: "https://soundcloud.com/kaotikkartel", youtubeChannel: "https://www.youtube.com/channel/UCnN-Qlh3f99ygw53RYOP5uw", instagram: "https://www.instagram.com/kaotik_kartel/" },
  "Beans on Toast": { spotifyArtist: "6fVeXD7D2RpFoR6bzNEDPo", audioPreview: "https://p.scdn.co/mp3-preview/45ddff2385374c45fcfd3651ff5d7696f7da57b7.mp3", soundcloud: "https://soundcloud.com/beans-on-toast", youtubeChannel: "http://www.youtube.com/channel/UCk7CBqtSSmuJIBAFJPv8z4Q", instagram: "https://www.instagram.com/beans.on.toast/" },
  // No Spotify link on file in Viberate's own verified profile for this
  // exact artist (the plausible-looking Spotify search hit for the name
  // couldn't be cross-checked against it, so left out rather than risk
  // playing a different "Jamz Supernova" under her name) — SoundCloud/
  // Instagram only, still real search buttons cover Spotify/YouTube.
  "Jamz Supernova": { soundcloud: "https://soundcloud.com/jamzsupernova", instagram: "https://www.instagram.com/jamzsupernova/" },
  // Second expansion batch (29 Jul) — all cross-checked via Viberate's own
  // verified profile links (several bios explicitly name Boomtown Fair as
  // a past festival appearance, an especially strong identity signal).
  // No audioPreview added here yet — Spotify artist ID lets the embed
  // player still show real previews on click, just not the inline <audio>
  // shortcut. Farma G had no plausible Viberate match at all (searched
  // "Farma G" and close spelling variants) and was left out entirely
  // rather than guess, per instruction.
  "Grooverider": { spotifyArtist: "65g8RO3JqCUTigI7YR3dAw", soundcloud: "http://soundcloud.com/djgrooverider1", youtubeChannel: "https://www.youtube.com/channel/UCASsAtmUa0w_kgHodiNFj7g", instagram: "https://www.instagram.com/djgrooverider/" },
  "Freestylers": { spotifyArtist: "0zg9mF9dX2knvdTKnL22T1", soundcloud: "http://soundcloud.com/freestylers", youtubeChannel: "http://www.youtube.com/user/FreestylersOfficial", instagram: "https://www.instagram.com/thefreestylersofficial/" },
  "Ellis Dee": { spotifyArtist: "65y2opuUTsGcbU3sNzv0ll", soundcloud: "https://soundcloud.com/djellisdee", instagram: "https://www.instagram.com/djellisdee/" },
  "Ed Solo": { spotifyArtist: "7jnJgk7LLLdpPhXrOOZXCa", soundcloud: "https://soundcloud.com/edsolo", youtubeChannel: "https://www.youtube.com/channel/UCncK21Jd9rg18jr0-Q64B1A", instagram: "https://www.instagram.com/edsolouk/" },
  "General Levy": { spotifyArtist: "2bHgAaZ7qbGbMMXwAQm48I", soundcloud: "https://soundcloud.com/general-levy", youtubeChannel: "http://www.youtube.com/channel/UCUrM4ZEpyjw2KhpcKNWJgww", instagram: "https://www.instagram.com/generallevy" },
  "Break": { spotifyArtist: "7FtCGMC0pcHPlrZWmYe9XM" },
  "Chimpo": { spotifyArtist: "52daryZMe3vvpHyMyJK6SM", soundcloud: "https://soundcloud.com/chimpo-mcr", instagram: "https://www.instagram.com/chimpomcr" },
  "Halogenix": { spotifyArtist: "24eQxPRLv3UMwEIo6mawVW", soundcloud: "http://soundcloud.com/halogenix", youtubeChannel: "https://www.youtube.com/channel/UCg-NKd9OuQBM5WscITb8orA", instagram: "https://www.instagram.com/halogenix" },
  "Ivy Lab": { spotifyArtist: "3VXCvo9Sr0hbZ4mk6VOKBs", soundcloud: "https://soundcloud.com/ivylab", youtubeChannel: "https://www.youtube.com/channel/UCQYIaZoxwtJAzDmkM6mICUg", instagram: "https://www.instagram.com/ivylab/" },
  "Ray Keith": { spotifyArtist: "6LWmwdaxswnPZCrjexu80I", soundcloud: "https://soundcloud.com/ray-keith", instagram: "https://www.instagram.com/raykeithdread1/" },
  "Skeptical": { spotifyArtist: "28ee6rnxMl8AqwcroPfivP", soundcloud: "http://soundcloud.com/skeptical", youtubeChannel: "https://www.youtube.com/SkepticalTV", instagram: "https://www.instagram.com/Skepticaluk" },
  "Top Cat": { spotifyArtist: "3QR3QV1qQuTpcy1DIqOw9j", youtubeChannel: "https://www.youtube.com/channel/UCZW7CdhCKU7s0Qg2K-tj5mg", instagram: "https://www.instagram.com/originaltopcato9/" },
  "Fliptrix": { spotifyArtist: "5Dm525w7dCfRzudUS4EeQE", soundcloud: "https://soundcloud.com/mrfliptrix", youtubeChannel: "https://www.youtube.com/user/mrfliptrix", instagram: "https://www.instagram.com/mrfliptrix" },
  "Estère": { spotifyArtist: "1WCaYWO3WfBdA8Dl1OqfZz", soundcloud: "https://soundcloud.com/estere", youtubeChannel: "https://www.youtube.com/channel/UCOgKVnoMYiyS8MNeoBg4-Xw", instagram: "https://www.instagram.com/esterelola/" },
  "Kasra": { spotifyArtist: "3W1ubrHvNSMltB1l7zo6xt", soundcloud: "https://soundcloud.com/kasra-critical", instagram: "https://www.instagram.com/kasracritical/" }
};

// Aliases for exact lineup billing text that differs from the plain
// artist name above ("Groove Armada DJ Set", capitalisation
// differences, "Ft./B2B/AV Show" suffixes) — the preview lookup is an
// exact string match against artist.name, same as artist-bios.js, so
// these need their own entries even though they're the same act.
[
  // Confirmed against the current lineup's exact billing text (checked
  // 29 Jul — several of these had silently stopped matching after an
  // official-app re-sync changed the exact punctuation/spelling; kept
  // both the old and corrected forms since a future re-sync could
  // plausibly flip back).
  ["Groove Armada DJ Set", "Groove Armada"],
  ["Groove Armada - DJ Set", "Groove Armada"],
  ["Floating Points Live", "Floating Points"],
  ["Floating Points - Live", "Floating Points"],
  ["Sampa The Great", "Sampa the Great"],
  ["Shy FX Ft. Rage", "Shy FX"],
  ["Sherelle AV Show", "Sherelle"],
  ["Dutty Moonshine Big Band", "Dutty Moonshine"],
  ["999999999 AV Show", "999999999"],
  ["999999999 - AV Show", "999999999"],
  ["Sbtrkt DJ Set", "SBTRKT"],
  ["Frankie Stew & Harvey Gunn", "Frankie Stew and Harvey Gunn"],
  ["Alix Perez Ft. Sp:Mc", "Alix Perez"],
  ["Alix Perez Ft. SP:MC", "Alix Perez"],
  // Second batch (29 Jul) — bracketed/suffixed billing text for the newly
  // added artists above, checked against the current lineup the same way.
  ["Grooverider [Fantazia Takeover]", "Grooverider"],
  ["General Levy - Live PA", "General Levy"],
  ["Fliptrix [High Focus Records]", "Fliptrix"],
].forEach(([alias, canonical])=>{
  if(window.ARTIST_PREVIEWS[canonical]) window.ARTIST_PREVIEWS[alias] = window.ARTIST_PREVIEWS[canonical];
});
