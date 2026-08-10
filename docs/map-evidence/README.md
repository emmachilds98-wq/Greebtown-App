# Map evidence (2 Aug 2026 session)

## Coordinate quarantine (10 Aug 2026)

The legacy schematic coordinates and their derived map geometry are known to
be visually skewed. They must not be reused to calibrate, nudge, or validate a
new map layout. This includes the old position lists in `js/app.js`,
`reference-layout.json`, district/camp footprint files, and generated
`map-data.js`.

For the refresh, use this folder's independent official-app evidence only.
Start with `IMG_3670.png` for full-site topology, then use official close-ups
to trace each connected cluster. Record the image/frame that supports a new
silhouette or placement and review a rendered before/after image before
shipping. Do not use screenshots of Greebtown itself as corroboration.

Screenshots of the official Boomtown Fair 2026 app's own map, plus written
findings from reviewing them and ~490 frames extracted from 5 screen
recordings of the same official app. This is the evidence behind the
district/stage/venue positions and footpath connections in `js/app.js` —
kept here so a future pass can re-check or extend the map without
re-requesting the same footage.

**Video source files are not included** — 5 raw `.mov` recordings totalling
~110MB (deduplicated). Committing them would bloat this repo's git history
permanently for a static-hosted PWA that doesn't need them at runtime. If
you need the original footage (e.g. to re-trace exact path curvature, which
wasn't reliably readable at this video resolution — see the comment above
`TRUNK_PATH_EDGES` in `js/app.js`), ask whoever has the recordings to
re-share them.

**4 screenshots were deliberately excluded** from `screenshots/` (originally
`shot_040.jpg`, `shot_041.jpg`, `shot_042.jpg`, `shot_049.jpg`): they turned
out to be screen captures of *this app's own* in-progress map (visible via
its "Greebtown!" label in the iOS app-switcher in one source video), not the
official Boomtown app. Using them as "evidence" would have been circular —
confirming our own already-possibly-wrong guesses instead of checking them
against something independent. If you're adding more screenshots later,
double-check for the same mistake: the official app's own UI has a Mapbox
logo, a search bar with a profile picture, and Bar/Food/Toilet/Medical
buttons along the bottom — this app's UI has Home/Today/Lineup/Plan/Map/
Discover tabs and a "Food & bars"/"Other stages"/"Hidden venues & things to
find" filter chip row instead.

## Files

- `screenshots/` — 58 screenshots of the official app's map (deduplicated,
  genuinely-official-app only).
- `findings_screenshots.md` — written findings from reviewing all screenshots.
- `findings_vidAB.md`, `findings_vidCD.md`, `findings_vidE1.md`,
  `findings_vidE2.md` — written findings from reviewing frames extracted
  from the first session's 5 source videos (grouped into batches for
  review). These reference frame filenames (e.g. `f_0045`) from the
  original videos, which aren't included here — the written facts are
  what's actionable, not the frame numbers themselves.
- `findings_vidF.md` — a follow-up video (someone searching "thrutopia" in
  the official app and panning nearly the whole site). Confirmed Thrutopia
  has no findable pin anywhere on the real map after two sessions' worth of
  footage, so its map pin was removed entirely (it's kept as a narrative/
  schedule district only — see the comment on its old `locations` entry in
  `js/app.js`). Also caught and fixed a wrong placement from the first
  session: Postal Posse (and Hotel Paradiso, Luck Exchange Casino) had been
  placed near Oldtown/Copperwood/Area 404 on weaker evidence, but this
  clearer video shows them on Botanica's Letsbe Avenue loop path instead.

## Known gaps as of this pass

- **Update, 7 Aug 2026:** Thrutopia and Copperwood both have map pins again.
  User-supplied screenshots showed legible "THRUTOPIA" and "COPPERWOOD
  HEIGHTS" labels — the Copperwood one re-showing the same Hide Out
  Hilltop/Full Moon Ballroom close-up area this session's own screenshots
  had found no label in, so that finding is reopened rather than settled.
  Checked the new screenshots weren't the same "our own app" false
  positive documented above (same UI markers: Mapbox logo, search bar with
  profile picture, Bar/Food/Toilet/Medical buttons — confirmed present).
  Both positions are placed by eye near Grand Central, not precisely
  measured; see their comments on the `locations` entries in `js/app.js`.
  If a future pass finds contradicting evidence again — a third
  independent check disagreeing with this one — the original in-app
  search result (findings_vidF.md) is the more thorough test and should
  probably win.
- (Superseded by the update above.) Thrutopia previously had no map pin —
  confirmed absent from the map itself after two sessions' footage
  (including a search for it), so it was tracked as a narrative district
  only until a genuine sighting turned up.
- Several `thingsToFind` entries still carry positions originally derived
  from scraped GPS lat/lon (converted to schematic x/y) rather than footage
  — flagged in their own comments with "Real surveyed GPS puts it..." — and
  haven't been re-checked against footage yet, since no footage evidence for
  them turned up in this pass. Not rendered from GPS anymore (see the note
  above `SITE_SW`/`SITE_NE` in `js/app.js`), but the numbers themselves may
  still not match what the official app actually shows.
- Path curvature (exact shape of each footpath, not just which two points
  it connects) still uses a generic bow curve — source video resolution
  wasn't reliable enough to trace exact path shape pixel-by-pixel.
