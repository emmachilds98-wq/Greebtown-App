// Boomtown Fair 2026 site map data - stage/area and amenity locations.
//
// Source: extracted from the official Boomtown Festival app's own in-app map
// (a Mapbox vector tile layer named "Boomtown_2026_v6_USE"), captured via
// HTTP Toolkit while browsing the app's map screen. This is factual location
// data (names + coordinates) only - it does NOT include Boomtown's actual map
// artwork/3D models/custom Mapbox style, which are their proprietary assets.
//
// Coverage: derived from map tiles covering the core festival area (one
// 16/32542/21924 Mapbox tile + surroundings). May not include locations at
// the far edges of the 1,250-acre site (e.g. outer camping fields) - the
// in-app map wasn't panned to those areas during capture.
//
// Label notes: "label" for stages was cross-referenced against real stage
// names already used in this file's own lineup data where a match existed
// (source: "lineup-match"). Where no match existed, PascalCase slugs from
// the map data were mechanically split into words (source: "camelcase-split").
// A few all-lowercase slugs had no reliable word boundary to split on and
// were left as raw capitalized slugs (source: "raw-slug", unresolved: true) -
// on a follow-up pass, three of those were confirmed against this app's own
// lineup/glossary data (now "lineup-match"/"glossary-match", unresolved:
// false); the rest got a best-effort manual word-split (source:
// "manual-guess") but are still unconfirmed against the real app, so
// unresolved stays true - worth a glance before relying on them for display:
// boomtownhall, skylarkhilltop, sauna, denofdisorder, dagraffs, velvetrope.
window.BOOMTOWN_LOCATIONS_2026 = {
  "stages": [
    {
      "id": "boomtownhall",
      "label": "Boomtown Hall",
      "lat": 51.052974,
      "lon": -1.24028,
      "unresolved": true,
      "source": "manual-guess"
    },
    {
      "id": "skylarkhilltop",
      "label": "Skylark Hilltop",
      "lat": 51.052105,
      "lon": -1.23799,
      "unresolved": true,
      "source": "manual-guess"
    },
    {
      "id": "CraftyRascals",
      "label": "Crafty Rascals",
      "lat": 51.053533,
      "lon": -1.237382,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "TheMagicTeapot",
      "label": "The Magic Teapot",
      "lat": 51.054506,
      "lon": -1.238786,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "foggersmill",
      "label": "Foggers Mill",
      "lat": 51.05467,
      "lon": -1.240966,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "Hapitat",
      "label": "Hapitat",
      "lat": 51.053549,
      "lon": -1.237017,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "TopsyTurvyTrims",
      "label": "Topsy Turvy Trims",
      "lat": 51.054936,
      "lon": -1.241439,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "Circus",
      "label": "Circus Tent",
      "lat": 51.054314,
      "lon": -1.238994,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "XR",
      "label": "XR",
      "lat": 51.053531,
      "lon": -1.237151,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "TheFoolsLeap",
      "label": "The Fools Leap",
      "lat": 51.052326,
      "lon": -1.240573,
      "unresolved": false,
      "source": "camelcase-split"
    },
    {
      "id": "ReelNews",
      "label": "Reel News",
      "lat": 51.053753,
      "lon": -1.238206,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "miningforgoldtown",
      "label": "Mining for (g)Old Town",
      "lat": 51.05197,
      "lon": -1.239716,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "grand",
      "label": "Grand Central",
      "lat": 51.053325,
      "lon": -1.240247,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "CocaineAnonymous",
      "label": "Cocaine Anonymous",
      "lat": 51.053999,
      "lon": -1.238055,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "PostalPosse",
      "label": "Postal Posse",
      "lat": 51.051811,
      "lon": -1.24031,
      "unresolved": false,
      "source": "camelcase-split"
    },
    {
      "id": "climatelive",
      "label": "Climate Live",
      "lat": 51.054466,
      "lon": -1.239435,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "RebelGirlsClub",
      "label": "Rebel Girls Club",
      "lat": 51.054374,
      "lon": -1.239168,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "SharingCircles",
      "label": "Sharing Circles",
      "lat": 51.053657,
      "lon": -1.238361,
      "unresolved": false,
      "source": "camelcase-split"
    },
    {
      "id": "SpinneyHollow",
      "label": "Spinney Hollow",
      "lat": 51.053885,
      "lon": -1.238789,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "EnergyGarden",
      "label": "Energy Garden",
      "lat": 51.054728,
      "lon": -1.23864,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "sauna",
      "label": "Sauna",
      "lat": 51.055311,
      "lon": -1.237873,
      "unresolved": true,
      "source": "manual-guess"
    },
    {
      "id": "CraftyRascals",
      "label": "Crafty Rascals",
      "lat": 51.053534,
      "lon": -1.237269,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "denofdisorder",
      "label": "Den of Disorder",
      "lat": 51.052137,
      "lon": -1.239783,
      "unresolved": true,
      "source": "manual-guess"
    },
    {
      "id": "vToughLove",
      "label": "V Tough Love",
      "lat": 51.051674,
      "lon": -1.240323,
      "unresolved": false,
      "source": "camelcase-split"
    },
    {
      "id": "TheGiantTreeCircle",
      "label": "The Giant Tree Circle",
      "lat": 51.053785,
      "lon": -1.238708,
      "unresolved": false,
      "source": "camelcase-split"
    },
    {
      "id": "Crafts",
      "label": "Crafts",
      "lat": 51.054088,
      "lon": -1.238139,
      "unresolved": false,
      "source": "camelcase-split"
    },
    {
      "id": "badapple",
      "label": "Twisted Time Machine (Bad Apple Bar)",
      "lat": 51.053823,
      "lon": -1.239264,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "TheRetreat",
      "label": "The Retreat",
      "lat": 51.055071,
      "lon": -1.238763,
      "unresolved": false,
      "source": "camelcase-split"
    },
    {
      "id": "Elemental",
      "label": "Elemental",
      "lat": 51.054743,
      "lon": -1.239359,
      "unresolved": false,
      "source": "camelcase-split"
    },
    {
      "id": "pomegranare",
      "label": "The Pomegranate Parlour",
      "lat": 51.052275,
      "lon": -1.239663,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "ChurchofVeg",
      "label": "Churchof Veg",
      "lat": 51.053616,
      "lon": -1.237594,
      "unresolved": false,
      "source": "camelcase-split"
    },
    {
      "id": "TinkerStation",
      "label": "Tinker Station",
      "lat": 51.054685,
      "lon": -1.238942,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "games",
      "label": "Games Lounge",
      "lat": 51.054162,
      "lon": -1.238236,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "dagraffs",
      "label": "Da Graffs",
      "lat": 51.051673,
      "lon": -1.240646,
      "unresolved": true,
      "source": "manual-guess"
    },
    {
      "id": "dailyrag",
      "label": "The Daily Rag",
      "lat": 51.052896,
      "lon": -1.240272,
      "unresolved": false,
      "source": "glossary-match"
    },
    {
      "id": "AncientFutures",
      "label": "Ancient Futures",
      "lat": 51.054277,
      "lon": -1.238332,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "Permaculture",
      "label": "Permaculture",
      "lat": 51.053557,
      "lon": -1.237522,
      "unresolved": false,
      "source": "lineup-match"
    },
    {
      "id": "velvetrope",
      "label": "Velvet Rope",
      "lat": 51.054299,
      "lon": -1.241574,
      "unresolved": true,
      "source": "manual-guess"
    },
    {
      "id": "AgentsofChangeHQ",
      "label": "Agents of Change HQ",
      "lat": 51.053611,
      "lon": -1.236746,
      "unresolved": false,
      "source": "lineup-match"
    }
  ],
  "pois": [
    { "id": "lockers", "category": "Lockers", "lat": 51.054268, "lon": -1.239738 },
    { "id": "foods", "category": "Food", "lat": 51.05468, "lon": -1.239854 },
    { "id": "photobooth", "category": "Photobooth", "lat": 51.052159, "lon": -1.238448 },
    { "id": "hooch", "category": "Hooch Bar", "lat": 51.053699, "lon": -1.238981 },
    { "id": "barssober", "category": "Sober Bar", "lat": 51.053419, "lon": -1.238589 },
    { "id": "toilets", "category": "Toilets", "lat": 51.051859, "lon": -1.238896 },
    { "id": "toilets", "category": "Toilets", "lat": 51.052853, "lon": -1.238226 },
    { "id": "topup", "category": "Top-Up Point", "lat": 51.052741, "lon": -1.239961 },
    { "id": "power1", "category": "Power/Charging", "lat": 51.054658, "lon": -1.239553 },
    { "id": "handi", "category": "Accessible Facilities", "lat": 51.053839, "lon": -1.23743 },
    { "id": "foods", "category": "Food", "lat": 51.052105, "lon": -1.238565 },
    { "id": "foods", "category": "Food", "lat": 51.054574, "lon": -1.238362 },
    { "id": "foods", "category": "Food", "lat": 51.053217, "lon": -1.238786 },
    { "id": "fire", "category": "Fire Pit", "lat": 51.052449, "lon": -1.23805 },
    { "id": "water1", "category": "Water Point", "lat": 51.054063, "lon": -1.237402 },
    { "id": "bars2", "category": "Bar", "lat": 51.052743, "lon": -1.240135 },
    { "id": "topup", "category": "Top-Up Point", "lat": 51.053752, "lon": -1.239191 },
    { "id": "first-aids", "category": "First Aid", "lat": 51.052698, "lon": -1.23905 },
    { "id": "photobooth", "category": "Photobooth", "lat": 51.053678, "lon": -1.239143 },
    { "id": "bank", "category": "Cash Point", "lat": 51.054396, "lon": -1.239623 },
    { "id": "bars", "category": "Bar", "lat": 51.055053, "lon": -1.241062 },
    { "id": "handi", "category": "Accessible Facilities", "lat": 51.052415, "lon": -1.240456 },
    { "id": "bars", "category": "Bar", "lat": 51.052368, "lon": -1.238511 },
    { "id": "toilets", "category": "Toilets", "lat": 51.052447, "lon": -1.240355 },
    { "id": "handi", "category": "Accessible Facilities", "lat": 51.051998, "lon": -1.238678 },
    { "id": "bars", "category": "Bar", "lat": 51.054422, "lon": -1.241595 },
    { "id": "foods", "category": "Food", "lat": 51.053057, "lon": -1.238936 },
    { "id": "bars", "category": "Bar", "lat": 51.054532, "lon": -1.241608 },
    { "id": "water1", "category": "Water Point", "lat": 51.052418, "lon": -1.240239 },
    { "id": "bars2", "category": "Bar", "lat": 51.051838, "lon": -1.240691 },
    { "id": "welfare", "category": "Welfare", "lat": 51.052767, "lon": -1.238987 },
    { "id": "toilets", "category": "Toilets", "lat": 51.053919, "lon": -1.237414 },
    { "id": "water1", "category": "Water Point", "lat": 51.052681, "lon": -1.239895 },
    { "id": "toilets", "category": "Toilets", "lat": 51.054178, "lon": -1.241202 },
    { "id": "reception", "category": "Reception", "lat": 51.052507, "lon": -1.238227 },
    { "id": "thehideouthilltop", "category": "The Hideout Hilltop", "lat": 51.05502, "lon": -1.241159 },
    { "id": "merch", "category": "Merch", "lat": 51.053339, "lon": -1.238717 },
    { "id": "foods", "category": "Food", "lat": 51.054249, "lon": -1.240573 },
    { "id": "foods", "category": "Food", "lat": 51.054746, "lon": -1.24055 },
    { "id": "bars", "category": "Bar", "lat": 51.054461, "lon": -1.238393 },
    { "id": "bars", "category": "Bar", "lat": 51.053723, "lon": -1.239292 },
    { "id": "pamper", "category": "Pamper Area", "lat": 51.051761, "lon": -1.238908 },
    { "id": "handi", "category": "Accessible Facilities", "lat": 51.053512, "lon": -1.239519 },
    { "id": "foods", "category": "Food", "lat": 51.054732, "lon": -1.240241 },
    { "id": "foods", "category": "Food", "lat": 51.05407, "lon": -1.239582 },
    { "id": "entryskylark", "category": "Skylark Entry", "lat": 51.052712, "lon": -1.238482 },
    { "id": "foods", "category": "Food", "lat": 51.054114, "lon": -1.240337 },
    { "id": "showers1", "category": "Showers", "lat": 51.05194, "lon": -1.238827 },
    { "id": "bars", "category": "Bar", "lat": 51.054731, "lon": -1.240366 },
    { "id": "water1", "category": "Water Point", "lat": 51.053908, "lon": -1.239806 },
    { "id": "toilets", "category": "Toilets", "lat": 51.05372, "lon": -1.240009 },
    { "id": "water1", "category": "Water Point", "lat": 51.052774, "lon": -1.238316 },
    { "id": "market1", "category": "Market", "lat": 51.054729, "lon": -1.240123 }
  ]
};
