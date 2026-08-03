# Map reconstruction roadmap

## Goal

Create a high-quality original companion map whose site layout, hierarchy and
navigation feel closely track the official-app screenshots without copying
their proprietary artwork, labels or branded assets.

## Evidence and delivery rules

- Treat the supplied screenshots as the primary visual reference.
- Keep one shared schematic coordinate grid for every layer.
- Preserve the existing explicit uncertainty notes; screenshots support
  relationships and approximate placement, not imaginary survey precision.
- Use original geometry and illustration treatments.
- Each map release must pass data, position, composition, zoom and collision
  audits before publishing.

## Phase 1 — calibrated base composition

1. Lock the full-site silhouette, perimeter roads, major camps, woodland
   masses, arrival areas and Hilltop/Sunset ground use.
2. Maintain regional calibration records for West camps, Downtown, Botanica,
   Grand Central/Oldtown/Hilltop, Quantum/Lion's Den and East camps.
3. Ensure every landmark or amenity belongs to a reviewed region before it is
   rendered.

**Done when:** the site reads correctly at overview without relying on labels.

## Phase 2 — district and route reconstruction

1. Trace original district footprints and their main courts from the regional
   references.
2. Author only evidence-backed trunk routes; add local passages only inside
   reviewed compounds.
3. Use staged rendering: landscape and district character on arrival,
   navigation routes and place labels as the visitor zooms in.

**Done when:** a visitor can recognise the region, its neighbouring regions
and its main walking route before opening any marker.

## Phase 3 — venue massing and facilities

1. Build each dense district as an original collection of coherent street
   edges, courts, stalls, stage fronts and small venue footprints.
2. Add facilities only where supported by a reference or canonical data.
3. Retain woodland, camp and open-ground separation; never use decorative
   circles to stand in for a reviewed place.

**Done when:** close zoom feels inhabited and navigable rather than a scatter
of generic rectangles.

## Phase 4 — interaction and typography

1. Prioritise districts, headline stages, camps, gates and detail labels.
2. Run collision-aware placement after every map move or zoom.
3. Keep the official map's information density as a reference, while using an
   original label, icon and colour system.

**Done when:** labels remain legible without hiding the map underneath them.

## Phase 5 — visual QA and iteration

For each release, review a consistent viewport for:

- full site
- West camping and Downtown arrival
- Botanica / Metropolis / Area 404
- Grand Central / Oldtown / Hilltop
- Quantum / Lion's Den / Sunset
- East Gate / Temple Valley / Anara edge

Record a change-history entry for any evidence-based positional correction.
Do not approve a release with an unexplained overlap, regression or missing
core silhouette.

## Current implementation status

- Phase 1: established, continuing calibration of regional edges.
- Phase 2: established and under active refinement.
- Phase 3: core six districts have authored massing, passages and atmosphere.
- Phase 4: collision-aware DOM label handling added; visual tuning continues.
- Phase 5: automated data and renderer checks run through `map-preflight`.
