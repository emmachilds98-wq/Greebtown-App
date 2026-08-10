# Evidence readings for the clean-slate rebuild (10 Aug 2026)

## Sources reviewed

- `IMG_3721.webp` — official full-site overview. Establishes the wooded west,
  compact central town, north-east Copperwood/Thrutopia pair, long Hilltop
  field, Quantum below it, and Lion's Den to the east of Quantum.
- `IMG_3722.webp` and `IMG_3730.webp` — the western/central compounds:
  Botanica above Metropolis, Area 404 below Metropolis, with the town spine
  running toward Oldtown.
- `IMG_3724.webp`, `IMG_3726.webp`, `IMG_3728.webp`, and `IMG_3729.webp` —
  Copperwood sits north-west of Thrutopia; Grand Central is directly below
  Copperwood; Oldtown continues south; Hilltop is a broad, long eastern field.
- `IMG_3726.webp` and `IMG_3729.webp` — Quantum is south-west of the Hilltop
  field and Lion's Den is to its east/south-east, separated from the main town
  by woodland/open ground.
- `IMG_3723.webp`, `IMG_3727.webp`, `IMG_3733.webp`, and `IMG_3734.webp` —
  confirm the surrounding woodland, camping/perimeter context, and that no
  parking/gate icon field belongs in the rebuilt entry view.

## Implementation boundary

The first rebuild pass contains only the large, evidence-supported territory
silhouettes, their connective spine, and ten territory labels. It intentionally
does not render venue pins, amenities, gates, parking, camps, old paths, or
old generated art. A later close-up pass may add a connected district only when
additional official evidence supports its internal shape and routes.

## Active renderer boundary (correction)

The active map construction path builds only `buildEvidenceOnlyMapGeoJSON()`,
`evidenceRebuildLabels()`, and `evidenceRebuildDetailLabels()`. Legacy stage,
district, amenity, gate, campsite, and point-of-interest arrays are not
iterated or made searchable while loading the map; they remain only for
unrelated app content. This is deliberate: hiding legacy markers is not enough
to prevent their old placements returning through a later layer toggle.
The MapLibre coordinate frame is now a neutral internal render plane as well;
it has no physical-site or legacy-GPS meaning.

The active load handler installs only the evidence-scene sources before
returning; old empty MapLibre sources and the external geographic basemap are
not registered at runtime. `scripts/assert-evidence-map-boundary.mjs` locks
this down in preflight.

## Detail-pass status

The close-detail layer is a review draft, not settled map data. It keeps only
names and broad forms that are legible in the current official screenshots:
NEXUS, Hidden Woods, Tangled Roots, Tribe of Frog, The Hide Out, Valley
Camping, and Camp at Hilltop. It does **not** place toilets, water, first aid,
info points, stalls, gates, parking, or any ambiguous camp label until a
readable official source confirms both its identity and its neighbouring
features. Every detailed path and compound is a low-confidence visual shape
that must be rechecked against future close-ups before it becomes a named
location.

## Topology constraints for the next detail pass

- Each visible pathway must join two named, documented areas. Do not add
  standalone strokes, loops, or ornamental “roads”.
- A detailed court must sit wholly inside its documented parent area; it may
  not cover a territory boundary or another court.
- Area 404 detail follows its north-to-south observed column: Spectrum 360,
  Hangar 161, Deviant Lounge, BBXL, Acid Leak. Oldtown remains two columns:
  Fools Leap/Postal Posse/Trough Love/Da Graaff's Reformatory to the west;
  Den of Dis Order, SÃ­bÃ­n Beag, and The Feckless Wrecked to the east.
- Camp routes remain inside their own field. Do not extend campsite lanes into
  a town, woodland, or stage court.
- Utilities require a readable official label plus neighbouring landmarks;
  an icon alone is not sufficient placement evidence.

## Evidence-led design additions

- `findings_screenshots.md` identifies Spectrum 360 as a container-enclosed
  circular arena, Hydro XL as a purple/magenta halo at Area 404's south-west
  edge, a white chevron clearing near the Grand Central/Oldtown junction, and
  the Lion's Den as an amphitheatre. The renderer uses only these observed
  forms, with no generic building scatter.
- The screenshots show distinct campsite circulation and grid-like lanes in
  Valley Camping and the Hilltop field. Those lanes are rendered separately
  from town streets and remain inside their respective camp field.
- A further visual pass gives only the confirmed NEXUS, Grand Central,
  Spectrum 360, and Lion's Den focal points a restrained close-zoom glow. The
  shapes remain in their existing evidence-traced courts; no new venue position
  or icon field was inferred.
- The next detail pass promotes only NEXUS, Hidden Woods, Spectrum 360, and
  Hydro XL into the normal reading zoom. It adds the readable Botanica-loop
  names (Sub Lab, Nachtlicker, Soapranos Laundrette), Ancient Futures and
  Daily Rag at Grand Central/Oldtown, and The Hide Out Hilltop at Copperwood's
  east edge. The Hidden Woods orange outline and Tangled Roots red outline
  follow the observed close-up styling; all other venue labels remain gated to
  close view.
