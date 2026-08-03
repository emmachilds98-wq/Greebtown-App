# Official-map visual-style target (3 Aug 2026 session)

The user reviewed the in-progress companion map against the **official
Boomtown app map** (fresh screenshots they supplied this session — full-site
overview plus Grand Central/Oldtown/Hilltop, Botanica and Area 404 district
close-ups) and said ours "looks nothing like" it. These are the actionable
art-direction facts from those screenshots, recorded so a future pass has the
target without re-requesting the images. This is about matching the official
map's **visual language** (a generic festival-map idiom: flat land-use colour
zones, clean icon pins) using our own original geometry — not copying its
proprietary artwork, labels or tiles (see MAP_REBUILD_ROADMAP.md).

## The defining trait: flat land-use colour zoning

The official map reads instantly as a small number of **big flat colour-blocked
land-use zones** over a real Mapbox base:

- **Bright green** — the main arena / open festival ground (the bulk of the site).
- **Salmon / pink** — accommodation & **camping** blocks around the perimeter
  (a large pink block on the east/right side, a pink triangle bottom-left,
  and other camp fields). This pink is a *primary* colour of the map and the
  biggest thing ours was missing — our camping was rendered green and vanished
  into the grass. **Camping = salmon** is the highest-leverage correction.
- **Bright yellow** — specific wayfinding fields (the Hilltop corridor, a
  second field bottom-centre). Flat, saturated, with faint pale confetti dots.
- **Darker green** — woodland, filled with many tiny stippled tree dots at the
  site edges; distinct from the brighter arena green.
- Real **Mapbox base** underneath: grey/white roads with labels (Alresford Rd,
  A272, Petersfield Rd), pale-green surrounding countryside, faint field
  parcels. Ours has no road base — a later gap to consider.

## Buildings, stages, markers, labels

- **Buildings/stages:** small, **crisp** rectangles in warm **orange / tan /
  red / brown**, with subtle drop shadows — little painted structures, tightly
  clustered. Grand Central is a bright orange building. Ours are large,
  translucent, muddy-brown and overlapping — needs crisper, smaller, warmer,
  more opaque massing.
- **Headline-stage glow:** the official map puts a soft **warm orange radial
  glow** behind key stages (clear on Grand Central). We already have this
  (`stage-glow` / `minor-stage-glow`) — but the minor-stage + atmosphere-light
  glows were silently broken (invalid MapLibre `circle-radius` expression, see
  below) and not rendering. Fixed this session.
- **Amenity pins:** small **white circles** with a thin coloured ring and a
  simple icon (fork = food, person = toilet, droplet = water, cross = medical).
  Clean and minimal. Ours render as dark **"?" circles with dashed rings** —
  the single ugliest element; replacing them with clean white icon pins is a
  top follow-up.
- **Labels:** small cream/orange rounded-pill labels with tiny dark text;
  district names in decorative script (OLDTOWN in red, BOTANICA cream-outline).
  Restrained and small — not big bold caps.
- **Ground texture:** the official grass is essentially **flat** with only a
  fine dapple. Ours has a busy low-poly faceted triangulation that muddies the
  colour — should be quieted/flattened.

## Palette reference (approx, sampled by eye)

- Arena grass: bright medium green, ~`rgb(73–90, 184–195, 108–115)`.
- Camping salmon: ~`rgb(228–244, 142–172, 126–156)` (this session's new
  `CAMP_FIELD_STYLES`).
- Yellow field: ~`rgb(250, 211, 37)` (already in use for Hilltop).
- Woodland: darker green ~`rgb(52, 136, 75)`.
- Building warm tones: orange/tan/terracotta ~`rgb(210, 130–150, 70–90)`.

## Prioritised route to close the gap

1. **[done]** Fix the broken glow layers (`precinct-lights`,
   `district-atmosphere-lights-glow/core`, `minor-stage-glow-outer/mid/core`):
   they used `["*", ["get",…], ["interpolate",…["zoom"]…]]`, which MapLibre
   rejects because a `zoom` expression must be the top-level input to
   `interpolate`. Hoisted `zoom` to the top and moved the per-feature multiply
   into the output stops — identical visuals, valid expression. These threw on
   every map load and silently dropped six layers.
2. **[done]** Recolour camping fields green → **salmon** so the site reads as
   green-arena / pink-camp / yellow-field land-use zones.
3. Replace the dark **"?" amenity markers** with clean white circular icon
   pins (food/toilet/water/medical), matching the official pin idiom.
4. **Flatten / quiet the faceted ground texture** so the bright land-use
   colours carry, as the official flat grass does.
5. **Crisper, warmer building massing** — smaller, more opaque, orange/tan,
   less translucent-brown overlap.
6. Consider a light **road/lane base** under the site for the Mapbox-like
   wayfinding feel (bigger effort — no road-network data source yet).

## How this was reviewed

Rendered the live MapLibre map headless (Playwright + Chromium, MapLibre
vendored from the npm registry because the `unpkg` CDN is blocked by the
session network policy) across the six MAP_REBUILD_ROADMAP viewports, with the
optional label/venue layers toggled on, screenshotting the `#map` element.
That harness is what caught the six dropped layers — the data/preflight audits
pass because they don't exercise MapLibre's own style validation.
