# AGENTS.md — onboarding brief for AI coding agents

Read this before touching the code. It's a snapshot of how this build actually
works today, not aspirational architecture. If something here conflicts with
what you find in the repo, trust the repo and update this file.

## What this app is

Greebtown is a PWA "companion app" for Boomtown Fair 2026 (a UK festival,
12–16 Aug 2026): lineup/timeline browsing, a personal schedule with clash
detection, a live map, a group chat/sync feature, bingo, and misc extras.
It's built and used by a small friend group attending the festival together
— not a public product, but treat data accuracy (especially the map) as
safety/user-trust critical: wrong stage positions cost real people real time
at a real event.

## Stack and non-architecture

- **No build step.** Plain HTML/CSS/JS served as static files (GitHub Pages).
  No bundler, no npm install for the app itself, no TypeScript, no framework.
- **`js/app.js` is one script, ~14,000 lines, executed top to bottom.** It is
  not organized into modules — everything is a top-level `const`/`let`/
  `function` in the same scope. Treat it like a single giant function body,
  not a collection of independent files.
- Other JS files loaded via `<script>` tags in `index.html`: `js/pwa-register.js`
  (service worker registration only), `js/artist-bios.js`, `js/artist-previews.js`,
  `js/boomtown-locations-2026.js` (real scraped GPS data, see below).
- `service-worker.js` handles offline caching + push notifications (Firebase
  Cloud Messaging).
- Firebase (Firestore + Cloud Functions) backs the group chat/sync/presence
  feature — see `functions/index.js`, `firestore.rules`, `firebase.json`.
- `scripts/*.mjs` are one-off Node scripts for scraping/importing official
  Boomtown lineup data — not part of the runtime app, run manually/offline.

## Critical rule #1: load-time code + TDZ

Several features call functions **immediately at the top level of `app.js`**
as the script executes — not inside event handlers. Examples: the IIFE at
line ~60 (`renderBuildStatusPill`), `renderHomeSyncStatus()` called directly
at module scope (~line 10235), `autoSyncNow("on open")` (~line 12105), the
`setInterval` right after it, pull-to-refresh wiring.

Because the whole file is one scope evaluated top to bottom, any load-time
call that reaches a `const`/`let` declared **further down the file** than
the call site throws `ReferenceError: Cannot access 'X' before
initialization` — a temporal-dead-zone (TDZ) bug. This is NOT the same as
"undefined" and is easy to miss in review because the code looks fine
read top-down inside its own function.

**Before adding or moving any module-level `const`/`let`, trace whether any
top-level (unindented) call in the file can reach it, directly or through a
function-call chain.** If yes, declare it near the top of the file, above
the load-time call sites, with a short comment explaining why it's up there
(see `FIREBASE_CONFIG` / `_firestoreDb` / `getFirestoreDb`, and
`APP_CACHE_VERSION` at the very top, for the pattern to follow).

`node --check js/app.js` catches syntax errors but **not** TDZ bugs — you
still have to trace the call path manually. This has caused two real
incidents already (`STATUS_STALE_MS`, `_firestoreDb`). Full rule text lives
in `CLAUDE.md`.

## Critical rule #2: publishing / cache versions must move together

The app has a self-update mechanism: `APP_CACHE_VERSION` /
`APP_BUILD_TIME` (top of `js/app.js`) and `CACHE_VERSION` (top of
`service-worker.js`) drive an "update available" pill and force the service
worker to fetch fresh JS. **Every time you ship a change that should reach
users, bump both version strings in the same commit** — `APP_CACHE_VERSION`
in `app.js` and `CACHE_VERSION` in `service-worker.js` — and set
`APP_BUILD_TIME` to the real current UTC time (`date -u`), never a
hand-guessed or incremented value (a guess ahead of real UTC will show as
more than an hour fast to a UK viewer once their local BST offset stacks on
top). These two files having drifted out of sync via direct commits is
exactly what caused a real production incident (see `CLAUDE.md`'s incident
writeup) where the pill silently stopped working and someone "fixed" the
symptom by disabling the update-check code entirely instead of fixing the
drift.

Before telling a user a fix is ready to test: run `node --check js/app.js`,
bump both version strings, and grep the diff's changed identifiers for any
other load-time call site that reaches them (rule #1).

## Critical rule #3: never write a diff/patch fragment as a file's content

A real incident (2 Aug 2026): direct commits to the deploy branch replaced
`service-worker.js`'s actual content with a **raw unified-diff fragment** —
literal `+`/`-`-prefixed hunk lines (e.g. `+  self.skipWaiting();`) saved
as if they were the file itself, instead of applying the change and saving
the resulting text. The live file was left referencing an undefined
variable, missing large chunks of real logic, and not valid enough to
reliably register as a service worker at all — which meant no user could
ever receive an update, regardless of `CACHE_VERSION`.

A valid source file never contains bare `+`/`-` hunk lines, `@@ ... @@`
markers, or `<<<<<<<`/`=======`/`>>>>>>>` conflict markers. If what you're
about to save looks like that, you have a diff in hand, not a file — edit
the real file in place and save the resulting content, never the diff
itself. **After editing any file, read back what actually landed on disk
before committing** — for JS, `node --check <file>` (or, for a service
worker using `self`/`importScripts` that can't run under plain Node,
parsing it with `new Function(source)`) catches a corrupted file
immediately and costs nothing. A green PR review is not a substitute for
this either — the same incident's other half was a PR that merged with
`js/app.js` reduced to the single word `PLACEHOLDER`, because nobody
checked the file was still complete before merging it.

## Git workflow — read this or you will corrupt your own PR

- The actual GitHub Pages deploy branch is **`emmachilds98-wq-patch-2`**, not
  `main`. All work ships there via PR, squash-merged.
- **Never commit directly to `emmachilds98-wq-patch-2`.** Direct commits
  bypass review and are what caused the version-drift incident above.
- Squash-merging means your local branch's commit hash diverges from what's
  now on the deploy branch after merge. If you start new work without
  re-syncing, your next PR will show `mergeable_state: "dirty"`.
  Before starting new work (and especially at the start of a fresh agent
  session): `git fetch origin emmachilds98-wq-patch-2`, then
  `git checkout -B <your-branch> origin/emmachilds98-wq-patch-2` (this
  preserves any uncommitted working-tree changes), then confirm
  `git diff --stat` looks sane before committing.
- If a PR for your branch has already been merged and you're asked to keep
  working, treat it as done — restart your branch from the latest deploy
  branch rather than stacking on merged history.

## Data model — where things live in `app.js`

- `artists` (~line 1391): the full lineup, each act has `name`, `stage`,
  `day`, `start`/`end`, `genre` (optional — falls back to `STAGE_GENRE[stage]`
  via `genreOf()`).
- `STAGE_GENRE` (~1067) / `GENRE_INFO` (~1108): stage-level genre defaults and
  genre descriptions. Genre tags were recently cleaned up to avoid
  single-act-only categories — merge sparse/blended tags into existing
  sensible categories rather than inventing new ones for one act.
- `CATEGORY_TIER` / `TIER_LABELS` (~3701): timeline grouping is by tier
  (Main Stages / Stages & Venues / Activities & Support), not by color. Do
  not reintroduce color-coding or per-name highlighting in the timeline —
  this was deliberately removed.
- `buildTimelineHTML()` (~3707): renders the timeline. Positioning of rows
  within the table can be adjusted; the timeline's underlying
  scheduling/clash logic should not be changed casually — it's load-bearing
  for the personal-plan feature.
- Map-related arrays (~5932 onward): `locations` (main stages), `otherStages`
  / `minorStagePositions` / `minorStages`, `thingsToFind`, `secretSpots`,
  `landmarks`, `campLabels`, `amenities`, `gates`, `parkingAreas`,
  `venueDirectory`. All positions are **schematic coordinates**, 0–100 on
  both axes, not lat/lon.

## Map system

This has been the highest-effort, highest-error area of the app. Key things
to know before touching any map code or data:

- **Two coordinate systems**: schematic (0–100%, used for almost all map
  data arrays) and real lat/lon (`SITE_SW`/`SITE_NE` bounding box, ~line
  7785, via `schematicToLatLon()` / `latLonToSchematic()`). MapLibre GL JS
  renders from the lat/lon conversion.
- **`js/boomtown-locations-2026.js`** holds real scraped GPS data pulled from
  the official Boomtown app/site. It is reconciled against our schematic
  stage list via fuzzy name matching: `normalizeVenueKey()` and
  `STAGE_ALIASES` (~7815–7865) feed `realStageMatch()`, which is the single
  source of truth for "does this schematic stage correspond to a real GPS
  point." Do not duplicate this matching logic elsewhere in the codebase —
  there was previously a second, competing implementation in a dead file
  (`js/map-matching.js`, since deleted) that silently disagreed with this
  one. One implementation, one place.
- **`buildMapGeoJSON()`** (~6982, ~750 lines) is where districts, paths, and
  markers actually get turned into renderable map layers.
- **`TRUNK_PATH_EDGES`** (~6913) + `findNamedNode()` + `nearestPointOnTrunk()`
  form a real path/trunk network graph for navigation between named points,
  replacing an earlier naive "nearest district" approach. If you add new
  stages/venues, consider whether the path network needs a new edge to
  reach them.
- **Many map positions were derived from user-supplied screen-recording
  video of the official Boomtown app**, frame-traced by hand (ffmpeg frame
  extraction + pixel-position reasoning), because the official map images
  and planning documents are not fetchable (403s from boomtownfair.co.uk,
  thefestivals.uk, South Downs National Park planning PDFs — don't waste
  time retrying those URLs, they're blocked in this environment). Treat any
  position not evidenced by a video frame as a guess, and prefer directional/
  adjacency evidence (X is north of Y, X is between Y and Z) over precise
  pixel-distance measurement — video perspective/scale is not reliable
  enough for exact magnitudes even from ostensibly top-down footage.
- **Known unconfirmed-by-video positions as of the last audit**: Helix, Full
  Moon Ballroom, Síbín Beag's exact position, and Thrutopia. If you get new
  reference footage, these are the priority gaps to close. Always re-check
  whether newer PRs already addressed some of these before redoing the work.
- If you change one stage's position in isolation, re-check its neighbors —
  a real regression happened this way (fixing Spectrum 360 alone put it
  north of NEXUS/Botanica once those got independently re-derived). When
  correcting a cluster of nearby stages, re-derive the whole cluster together
  from the same evidence, not pairwise.

## Incident history and hard rules

`CLAUDE.md` in the repo root has the authoritative, detailed writeup of a
real production incident (2 Aug 2026: version drift between
`APP_CACHE_VERSION` and `CACHE_VERSION`, "fixed" by disabling the update
pill's check function via a runtime monkey-patch in `pwa-register.js`, plus
a second hack that silently overwrote map position data at runtime) and the
six numbered rules written in response. Read it. In short:
1. No direct commits to the deploy branch — always PR.
2. One source of truth per concern (e.g. map data) — never a runtime
   override/monkey-patch layered on top of the real implementation.
3. `APP_CACHE_VERSION`/`CACHE_VERSION` move together, same commit.
4. Root-cause fixes over monkey-patches when something looks "stuck" or
   "looping" — find out why, don't paper over it.
5. `js/pwa-register.js` stays service-worker-registration-only. If you find
   anything else in it, that's a hack that snuck back in — remove it.
6. No duplicate implementations of the same feature across files.

## Current known gaps / open threads

- Map: Helix, Full Moon Ballroom, exact Síbín Beag position, Thrutopia
  remain unconfirmed by video evidence (see Map system section above).
- Always check for other open PRs touching the map before starting new map
  work — this area has had multiple concurrent contributors/sessions and
  conflicting position edits have happened before.

## Map layout sources and required checks

The map has several generated authoring sources. Keep evidence, geometry and
runtime rendering reviewable rather than reintroducing hard-coded overrides:

- `map-system/data/camp-zones.json` â€” camps plus reviewed ground-use
  polygons (including protected exclusions for non-camping places).
- `map-system/data/evidenced-paths.json` â€” only reference-supported routes.
- `map-system/data/district-footprints.json` â€” reviewed illustrated areas.
- `map-system/data/natural-area-footprints.json` â€” reviewed woodland
  silhouettes. Each must be anchored to one unique named place and carry a
  visual-review note; never model woodland as a camp or a generic circle.
- `map-system/data/site-layout.json` â€” reviewed arrival, parking and
  gate-forecourt footprints around the festival perimeter. Every canonical
  gate must have exactly one forecourt entry; never fall back to a generic
  rectangle when its footprint is unknown. Its reviewed site boundary is also
  the single source for the broad festival-ground silhouette: keep that fill
  calm and continuous, then layer woodland, camps and districts above it
  rather than using scattered background polygons to approximate the site.
  Keep individual trees, tents, cars and confetti as close-zoom texture, not
  overview decoration; the regional silhouettes must remain legible first.
- `map-system/data/stage-precinct-layout.json` â€” reviewed stage forecourts,
  shared venue courts and street spines. Use it for a named central-space
  silhouette; never stretch a district boundary or invent marker positions
  just to make a court appear larger. Check rendered-layout alignment before
  release: district-footprint centroids must remain near their reviewed
  reference anchors, and the Grand Central → Oldtown sequence must keep its
  broad-forecourt / long-street scale and southward order.
- `map-system/data/district-massing-layout.json` â€” reviewed, original
  close-zoom compounds for the main town districts. It owns only anonymous
  structural art (stalls, tents and yards), never a new named venue, amenity,
  path or zone. Keep it anchor-relative and use it instead of scattering
  hard-coded decorative rectangles through the renderer. Add massing as a
  connected street edge or a purposeful court boundary; never as detached
  decorative scatter in open grass.
- `map-system/data/district-passage-layout.json` â€” reviewed, original
  close-zoom walking surfaces within those same compounds. These are short
  interior approaches and lanes, not evidence for a new public trunk route;
  keep them anchor-relative and never let them cross into camps or woodland.
- `map-system/data/district-atmosphere-layout.json` â€” reviewed, original
  foreground detail for core districts. It owns only non-interactive
  planters, canopies, seating, art and light points. Keep it sparse; these
  shapes appear only at deep zoom and must not become a surrogate POI layer.
- Stage hierarchy is authoritative in `map-document.json`: use `main-stage`
  only for headline footprints and `minor-stage` for compact venues. The
  document validator rejects a role/footprint mismatch, so preserve that
  distinction instead of compensating with an oversized plaza or marker.
- `map-system/data/reference-layout.json` â€” cluster anchors. This moves a
  district, its dependent venues and its evidence-based routes together.

When any map authoring source changes, run this sequence before committing:

```text
node scripts/build-map-data.mjs
node scripts/validate-map-document.mjs
node scripts/validate-camp-zones.mjs
node scripts/validate-evidenced-paths.mjs
node scripts/validate-district-footprints.mjs
node scripts/validate-reference-layout.mjs
node scripts/validate-small-venue-layout.mjs
node scripts/validate-natural-area-footprints.mjs
node scripts/validate-site-layout.mjs
node scripts/validate-stage-precinct-layout.mjs
node scripts/validate-district-massing-layout.mjs
node scripts/validate-district-passage-layout.mjs
node scripts/validate-district-atmosphere-layout.mjs
node scripts/audit-district-composition.mjs
node scripts/audit-map-zoom-hierarchy.mjs
node scripts/audit-ground-use-overlaps.mjs
node scripts/audit-map-positions.mjs
node --check js/app.js
```

For ordinary map work, prefer the single command `node scripts/map-preflight.mjs`.
It rebuilds generated data and runs the full evidence, footprint, camping,
position and runtime-syntax checks in the required order. Run `git diff --check`
afterwards. The expanded sequence above remains the reference list when a
specific failure needs investigation.

Before a broad visual pass, run `node scripts/report-map-topology.mjs` to see
the current official-reference regions and the specialised sources that own
their geometry. It is a read-only briefing for Codex/Claude, not a renderer.

`map-system/data/map-data.js` is generated and must be regenerated in the
same commit; never hand-edit it. Run `node scripts/report-reference-layout.mjs`
before changing anchors to review the affected cluster and attached stages.

Change an area through `reference-layout.json`, then review its district
footprint and entering/leaving paths in the same patch. Keep
`official-detail`, `official-overview`, and schematic estimates distinct:
visual plausibility is not surveyed evidence. `referenceLayoutConfig` is
consumed after the map data collections are declared in `app.js`; moving it
into an earlier load-time path can reintroduce a TDZ `ReferenceError`.

`map-system/data/small-venue-layout.json` is the canonical visual-massing
source for verified small shops, stalls, workshops and micro venues. It uses
`sourceName` to resolve a matching `thingsToFind` location after the
reference layout is applied, avoiding a competing set of positional values.
Use it for close-up visual passes rather than adding generic boxes directly
to `buildMapGeoJSON()`. Its validator constrains shape, size and evidence
level so both Codex and Claude can make a repeatable, reviewed change.

`map-system/data/natural-area-footprints.json` is the equivalent canonical
source for woodland and other non-camping natural areas. It stores a
source-relative outline, fringe and tree clusters, and validates both the
source name and relative geometry. Never use a generic radial zone as a
fallback for a reviewed natural area; add a footprint here instead.

`map-system/data/district-massing-layout.json` is the canonical source for
the dense, non-interactive illustrated compounds in Grand Central, Oldtown,
Botanica, Metropolis, Area 404 and Quantum. It is deliberately separate from
small venues: change a named real place in `small-venue-layout.json` or the
map document; change an anonymous close-zoom roof, tent or yard here. The
validator checks bounded anchor-relative geometry, evidence, unique IDs and
runtime source names. Run `node scripts/report-map-topology.mjs` before a
large visual pass to see the total authored massing under review.

`map-system/data/district-passage-layout.json` is the matching canonical
source for the close-zoom circulation between that massing. It deliberately
does not replace `evidenced-paths.json`: modify the latter only for an
officially supported site-wide path. The passage validator bounds every point
to its source district and limits widths, so a visual paving change cannot
silently create an oversized zone or an accidental route through woodland.

`map-system/data/district-atmosphere-layout.json` completes a core district
only after its massing and passages are settled. It is deliberately withheld
until deeper zoom so visual hierarchy remains route-and-space first. Always
run `node scripts/audit-district-composition.mjs` after changing any of the
three district sources: it verifies coverage, caps detail density and
requires a varied foreground instead of a cluster of same-looking shapes.

`scripts/audit-map-zoom-hierarchy.mjs` protects the visual order of the map:
district names stay readable before venue labels, authored paths and massing
arrive before decorative foreground detail, and generic infill is last. Run
it after any map-layer minzoom or label-density change. Do not make a new
layer visible earlier merely because it is available—the audit exists to stop
the common “cluster of shapes” regression at ordinary close zoom. Fine field
texture and outer hedgerows are also intentionally delayed, so the overview
remains silhouette-first rather than becoming a mosaic of background parcels.

Record every new official-map reading in `reference-layout.json`'s
`observations` collection before using it to alter a footprint, path, field
or anchor. It is evidence context, not runtime geometry; keep reviewed
geometry in its specialised data file and let the validator protect named
exclusions such as Anara Forest from ground-use fields.
