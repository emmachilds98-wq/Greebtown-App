# vidF_0802_2038 findings (new video, follow-up session)

App identity confirmed: every frame shows the Mapbox logo bottom-left, a search bar with round profile picture top ("thrutopia" typed into it throughout), and Bar/Food/Toilet/Medical pill buttons along the bottom. This is the real official Boomtown app throughout.

The clip is the user typing "thrutopia" into the search bar and then manually panning/zooming around nearly the entire festival site — no autocomplete dropdown or highlighted search-result pin for "thrutopia" ever appears; the search text just sits in the box the whole time while the map is browsed by hand.

## Thrutopia — found / not found

**NOT FOUND.** Despite "thrutopia" being typed in the search bar for the full clip, no pin, label, or highlighted marker for Thrutopia ever appears on the map — and the pan/zoom covers a very large fraction of the site: Grand Central, the full Oldtown venue chain, Quantum, The Lion's Den, Hilltop camping, Sunset camping, Botanica, Letsbe Avenue, Metropolis, Area 404, Hydro XL, Nexus, the Sub Lab/Loconnection/Nachtlicker chain, Rose and Clown, Spectrum 360, Hangar 161, Deviant Lounge, the Ancient Futures/Retreat chain, The Hide Out (Downtown and Hilltop), Full Moon Ballroom, Hidden Woods, and the camping fields. Thrutopia's name never appears as map text either. Result: its map pin was removed from `js/app.js` (kept as a narrative/schedule district only — see the comment above its old `locations` entry).

## Verify/correct list from prior footage

- Helix (between Quantum and The Lion's Den): not directly testable — text not legible in any frame, but Quantum and Lion's Den are confirmed close together, consistent with something between them.
- Full Moon Ballroom / Foggers Mill (near Copperwood Heights / Hide Out Hilltop): PARTIALLY CONFIRMED — frame clearly shows "FULL MOON BALLROOM" directly next to "THE HIDE OUT HILLTOP". Foggers Mill text not legible.
- The Fools Leap (north end of Oldtown's western chain, near Da Graaf's Reformatory): CONFIRMED direction — shows "THE FOOLS LEAP" at the very top of the western Oldtown chain, immediately south of Grand Central's "Boomtown Hall"/"Daily Rag".
- Síbín Beag (eastern chain): not confirmed or denied — "Mining for (g)Old Town" visible near the top of the eastern chain, but Síbín Beag/Feckless Wrecked text not legible in this clip.
- **Postal Posse / Trough Love (STRONG CORRECTION):** frames clearly and repeatedly show "POSTAL POSSE" sitting on the Letsbe Avenue loop path INSIDE BOTANICA, near "Network Comms Station," "The Daily Rag," and "Hotel Paradiso" — nowhere near Oldtown. "Trough Love" was not legible anywhere in this clip, so it's not confirmed to share Postal Posse's location. Acted on: moved Postal Posse (and Hotel Paradiso, Luck Exchange Casino) into the Botanica/Letsbe Avenue loop; Trough Love stays in Oldtown on its own separate earlier evidence, no longer paired with Postal Posse.

## Newly-visible named venues (not yet acted on — logged for a future pass)

Ancient Futures / Retreat-style chain: Rebel Girls Club, Circus, Games, Crafts, Spinney Hollow, The Giant Tree Circle, Twisted Time Machine at Bad Apple Bar, The Arc Sober Bar, Reel News, Sharing Circle, Kings Ransom, Timber Station, The Magic Teapot.

Botanica / Letsbe Avenue loop: Letsbe Avenue, Luck Exchange (Casino), Hotel Paradiso, Network Comms Station, Postal Posse, The Daily Rag, Botanica Zoo, Karma Ceuticals, Mango, Nexus, The Network, Sub Lab/Loconnection/Nachtlicker, Rose and Clown, Inconvenience Store (not yet added as a tracked venue).

Near Anara Forest/Retreat area: The Observatory — a previously untracked named venue (brown building footprint under tree canopy, food/bar/toilet icons nearby). Precise position not fully pinned down from a single medium-zoom frame.

## Path curvature details

- The path south from Grand Central toward Oldtown curves slightly south-west before straightening.
- The Letsbe Avenue path in Botanica is a genuine closed loop (rounded rectangle/oval) — Postal Posse, The Daily Rag, Hotel Paradiso, Luck Exchange, and Network Comms Station strung along it. Added as real edges in `TRUNK_PATH_EDGES` (Letsbe Avenue -> Luck Exchange Casino -> Hotel Paradiso -> Postal Posse -> Botanica).

## Still unconfirmed

Thrutopia's location (pin removed); Helix's exact position; Da Graaf's Reformatory's position/label; Síbín Beag's position; The Feckless Wrecked's position; whether "The Daily Rag" is one venue or two separately-named ones (appears both near Grand Central and near Botanica); The Observatory's precise district adjacency; Network Comms Station/Inconvenience Store/The Daily Rag not yet added as tracked map pins.

## Contamination check

All frames sampled showed the genuine official Boomtown app UI. No frame showed our own app's Home/Today/Lineup/Plan/Map/Discover tabs. No contamination detected in this video.
