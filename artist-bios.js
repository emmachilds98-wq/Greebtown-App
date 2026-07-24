// ===============================
// ARTIST BIOS
// Real, artist-specific one/two-line descriptions — not the generic
// per-genre blurb in app.js's GENRE_INFO. Keyed by the exact "name"
// string used in the artists array in app.js, so a name change there
// needs the same change made here to keep matching.
//
// This is a first pass covering the clearer headline/well-known acts
// across the weekend (mostly Fri/Sat/Sun main and second stages) —
// with 1,173+ acts on the full lineup, most smaller/B2B/local sets
// intentionally fall back to the auto-generated stage/genre/set-length
// line instead. Add more entries the same way any time — it's just a
// name: "description" pair, safe to extend without touching app.js.
//
// Written in our own words from general knowledge/public bios — no
// lyrics, no quoted press copy.
// ===============================
window.ARTIST_BIOS = {
  // --- Friday ---
  "Madness": "English ska/pop legends since the late '70s, part of the original 2-tone scene — expect terrace singalongs and horn-driven party energy.",
  "Shy FX Ft. Rage": "Jungle/drum & bass pioneer behind one of the genre's defining anthems, still a heavyweight on the sound-system circuit.",
  "Sub Focus": "UK drum & bass producer who's crossed into festival main-stage territory, known for punchy, melodic, arena-sized bass music.",
  "Alborosie & Shengen Clan": "Italian-born reggae artist long based in Jamaica, playing roots reggae in a traditional sound-system style.",
  "Gentleman's Dub Club & Friends": "Leeds live reggae/dub/ska band known for horn-heavy, high-energy sets built for a big outdoor crowd.",
  "Ren": "Welsh singer-songwriter/rapper whose genre-blending, autobiographical songs (mixing rap, rock and folk storytelling) built a huge following from raw, confessional live performances.",
  "Kneecap": "Belfast Irish-language hip-hop trio blending satire, republican politics and party energy — rap in a mix of English and Irish, known for a chaotic, provocative live show.",
  "Wilkinson Ft. MC AD-APT": "UK drum & bass producer known for melodic, radio-friendly D&B anthems alongside heavier dancefloor cuts.",
  "Camo & Krooked B2B Mefjus Ft. Daxta": "Austrian drum & bass duo (Camo & Krooked) known for polished, cinematic production, joined here by heavier-hitting D&B producer Mefjus.",
  "Groove Armada DJ Set": "Long-running UK dance duo behind early-2000s big-tent classics — expect a broad, feel-good house/dance DJ set rather than just their old hits.",
  "DJ EZ": "UK garage institution and one of the genre's most respected selectors, still packing dancefloors decades into his career.",
  "Notion": "UK drum & bass producer known for a heavier, bass-forward sound within the genre.",
  "Eats Everything B2B Tsha": "Bristol house/techno DJ known for genre-agnostic, crowd-reading sets, back to back with rising UK house producer Tsha.",
  "999999999 AV Show": "Italian techno act built around a hypnotic, stripped-back sound paired with an immersive visual/AV production.",
  "Dutty Moonshine Big Band": "UK swing outfit that fuses vintage big-band brass with modern bass and electronic production — swing music built for a festival crowd, not a jazz club.",
  "Frankie Stew & Harvey Gunn": "UK hip-hop/jazz-rap duo known for witty, conversational lyricism over live-feeling production.",
  "Kae Tempest": "Acclaimed UK poet, playwright and musician whose spoken-word/hip-hop performances are intense, literary and emotionally direct.",
  "High Vis": "London band that grew out of the UK hardcore-punk scene, now playing a more melodic post-punk/indie sound without losing the intensity.",
  "L'Entourloop": "French hip-hop/reggae/dub production duo known for smoky, bass-heavy instrumentals and a rotating cast of MCs.",
  "Juls": "Ghanaian-British producer central to the Afrobeats/highlife scene, known for warm, melodic production behind major African and UK artists.",
  "Fred V Ft. Daxta": "UK drum & bass producer known for melodic, uplifting D&B, one half of the Fred V & Grafix partnership.",
  "S.P.Y Ft. MC LowQui": "Respected drum & bass producer known for deep, rolling, dancefloor-focused D&B across a long-running career.",
  "Mala": "Dubstep pioneer and co-founder of Digital Mystikz — one of the genre's foundational, bass-weight-heavy originators.",
  "Champion": "UK bassline/grime-adjacent producer known for club-focused, bass-forward productions.",
  "Sbtrkt DJ Set": "Electronic producer known for atmospheric, soulful electronic production, historically performing behind a mask.",
  "Nubiyan Twist": "Leeds Afrobeat/jazz/soul collective known for a big horn section and a genuinely live, band-driven festival sound.",
  "Donae'o": "UK funky and afroswing pioneer, a key figure in bringing UK funky sound to the mainstream.",
  "Fox Stevenson Live": "Electronic/dubstep producer known for genre-blending, high-energy production and an unusually musical approach to bass music.",
  "Darren Styles": "Happy hardcore and hardstyle veteran, one of UK hardcore's most recognisable names since the 2000s.",
  "A.Skillz": "Breakbeat/funk DJ known for crate-digging, party-focused sets full of old-school samples and big beat energy.",
  "Freestylers": "UK big beat/breakbeat duo behind decades of festival-favourite bass anthems.",
  "Deekline": "UK garage and bassline DJ/producer known for uptempo, party-focused club sets.",
  "Estère": "New Zealand neo-soul/electronic artist known for genre-blending live sets combining looped vocals, soul and beat production.",

  // --- Saturday ---
  "Shaggy": "Jamaican reggae/dancehall legend behind some of the best-known reggae-pop crossover hits of the last 30 years — expect a full singalong show.",
  "Scooter": "German dance/hardcore act known for maximalist, high-BPM party anthems and one of European dance music's most enduring live shows.",
  "Andy C Presents: Nightlife": "Drum & bass legend and Ram Records founder, widely regarded as one of the genre's greatest ever DJs and technical mixers.",
  "Floating Points Live": "Electronic producer (Sam Shepherd) known for blending jazz, electronic and orchestral influences into intricate, live-band-driven sets.",
  "Four Tet": "Influential UK electronic producer (Kieran Hebden) known for genre-defying, melodic, crowd-pleasing DJ sets spanning house, folktronica and beyond.",
  "Folamour": "French house DJ/producer known for a soulful, disco-influenced take on house music and joyful, dance-first sets.",
  "Hak Baker": "London singer-songwriter blending grime, folk, punk and reggae influences into candid songs about growing up on the Isle of Dogs.",
  "Rose Gray": "UK pop/dance artist known for glossy, club-influenced pop production and high-energy performances.",
  "Antony Szmierek": "Manchester spoken-word artist whose deadpan, observational lyrics ride over dance and indie-leaning production.",
  "Sampa The Great": "Zambian-Australian rapper/singer known for powerful, genre-spanning music blending hip-hop, jazz and African influences.",
  "Princess Nokia": "New York rapper known for fiercely independent, genre-blending music spanning hip-hop, punk and R&B.",
  "Ashnikko": "Genre-bending pop/rap artist known for bold, confrontational lyrics and a maximalist, internet-native pop sound.",
  "Peaches": "Electroclash and dance-punk provocateur whose confrontational, sexually frank music helped define 2000s electroclash.",
  "General Levy Live PA": "Jamaican-British reggae/jungle vocalist behind one of jungle's most iconic vocal hooks, a foundational voice in the genre's crossover era.",
  "DJ Hype: Reggae 2 Jungle": "Jungle/drum & bass pioneer and one of the genre's founding DJs, here specifically tracing jungle's reggae roots.",
  "Sir Spyro Ft. Killa P & Lady Chann": "Grime DJ/producer and BBC 1Xtra host known for championing grime and dancehall on UK radio and in clubs.",
  "Ivy Lab": "Dark, halftime bass production trio known for a moody, sound-design-heavy corner of the drum & bass world.",
  "Sherelle AV Show": "UK DJ known for breakneck footwork, jungle and 160bpm+ sets that have made her one of the most talked-about club DJs of the past few years, here with a visual AV production.",
  "Beardyman": "Beatboxer and live looping artist known for building entire tracks live on stage using only his voice and looping tech.",
  "Gurriers": "Dublin post-punk band known for tense, politically-charged, guitar-driven live sets.",

  // --- Sunday ---
  "Vengaboys": "Dutch Eurodance act behind some of the biggest novelty dance-pop hits of the late '90s — a full singalong, feel-good party set.",
  "Eve": "American rapper and one of hip-hop's most influential female MCs since her Ruff Ryders days, known for sharp, confident lyricism.",
  "Scissor Sisters": "New York dance-rock/glam-pop band known for flamboyant, disco-and-rock-influenced pop anthems and a famously fun live show.",
  "Faithless": "Hugely influential UK electronic/dance act behind some of the genre's most enduring anthems, blending spoken word, gospel-tinged vocals and big-room dance production.",
  "Fcukers": "New York electronic duo mixing '90s/'00s house, breakbeat and big-beat influences into an energetic, party-first dance-pop sound.",
  "David Rodigan Presents: Ram Jam Ft D Double E, Hollie Cook & Irah": "Legendary reggae/dancehall broadcaster and selector, one of the genre's most respected voices in the UK for decades, joined by grime pioneer D Double E and reggae vocalists Hollie Cook and Irah."
};
