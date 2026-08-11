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
- A landmark-form pass separates the confirmed Spectrum 360 container ring
  into visible perimeter segments, gives NEXUS its observed dark triangular
  canopy with an amber edge, and places an unlabeled blue water form directly
  south of Hydro XL. These are drawn only at close zoom and are intentionally
  not treated as additional venues or service icons.
- Connected-cluster pass: `IMG_3722.webp`, `IMG_3724.webp`, and
  `IMG_3729.webp` show brightly bounded, internally connected compound
  shapes—not isolated territory fills. The renderer now gives Botanica,
  Metropolis, Area 404, Copperwood, Grand Central, Oldtown, and Hilltop their
  observed contour treatment, joins only their documented local routes, and
  adds restrained grouped massing inside the pictured Botanica, Area 404,
  Copperwood/Grand Central, and Oldtown courts. Hilltop receives additional
  internal camping lanes. These are review-draft massing groups, not a claim
  of exact individual building footprints.
- Camping/woodland transition pass: `IMG_3729.webp` and the wider official
  views distinguish Hilltop's grid-like yellow field from the separate pink
  camping field east/south-east of The Lion's Den. The renderer now keeps
  these as two isolated camp grounds, adds ordered pitch marks and field lanes
  only inside their boundaries, and leaves gates, parking and unnamed utility
  icons out.
- Outer-region pass: the full-site evidence and `findings_screenshots.md`
  place Anara Forest east/north-east of Copperwood, with Thrutopia between the
  central cluster and that woodland. Temple Valley Camping is a separate
  coloured camping field on Anara's edge, with only its own internal lanes and
  coloured pitch marks. The new field is not connected to or merged with
  Hilltop, Valley Camping, or the Lion's Den camp field.
- North-transition correction: Hidden Woods is now separated north-west of
  Botanica/Letsbe across open ground, and the Tangled Roots/Woods court is
  immediately north of Copperwood. Letsbe Avenue is its own narrow, labelled
  approach into the Botanica loop. Its three grouped blocks and single route
  are review-draft circulation/massing only, not asserted stall footprints.
- Full evidence pass: the current active scene now covers the documented
  Downtown Camping/Meadow/Campflight west field, Letsbe/Botanica service loop,
  the Grand Central-to-Oldtown route, Oldtown's two named chains, the Full Moon
  Ballroom cluster beside The Hide Out Hilltop, and Camp Skylark/Reception in
  Hilltop. All new camp pitch marks and lanes remain inside their own field.
  Findings vidF strongly corrects Postal Posse into the Botanica/Letsbe loop,
  so it is not included in the Oldtown sequence.
- Evidence precedence correction: newer official screenshot IMG_3724.webp
  visibly names THRUTOPIA and shows its blue bounded zone east of Copperwood,
  before the Anara/Temple Valley edge. It overrides the older footage where a
  typed search did not surface it. Thrutopia is restored as a separate
  territory and the Copperwood -> Thrutopia -> Anara corridor is retained.
- South-east detail pass: findings_vidE2 documents the Area 404 column
  (Hangar 161, Deviant Lounge, BBXL, Acid Leak) with Game Over, End of the
  Line, Guardians Ascension Programme, and Reactor alongside it. The same
  evidence confirms Memory Mart, Better You, E Numbers, and Gabber Kebabber
  in the adjacent Metropolis run. These are text-only close-view entries; no
  unsupported facilities have been added.
- The Quantum-to-Helix-to-Lion's-Den order is explicitly documented in
  findings_vidE2, including Helix's orange circular form and the unpaved
  southbound track. The active map now represents that relationship with one
  route, a restrained Helix form, and a close-view glow. The confirmed
  Hilltop-side names (Rebel Girls Club, Circus, The Retreat, Reel News, The
  Arc, Sharing Circles, Welfare) are likewise close-view labels only.
- Structural pass: IMG_3724.webp makes the Copperwood -> Thrutopia boundary
  and its internal route visible; its containment is now a separate contour
  and close-view loop. The remaining major terrain areas now also have their
  own reviewed contours: Anara Forest, Quantum, the Lion's Den, Hilltop, and
  Downtown Camping. The only new public route is the documented Hidden Woods
  -> Letsbe connection; the map opens flat and north-up.
- Granular-form pass: the Full Moon Ballroom is a confirmed white dome; The
  Retreat is a separate tan clearing; and Circus is a separate round tent.
  These forms are placed only at their already-established review-draft label
  anchors. Topsy Turvy Twins and Foggers Mill are now named beside the Full
  Moon cluster. The previous suggested Hide Out Hilltop -> Full Moon path is
  removed because the footage does not actually show that connection.
- Layout/legibility pass: the entry view now begins at the first detailed
  geometry level instead of just below it. Full detail opens at the same
  reviewed zoom, while Tribe of Frog, Helix, Full Moon Ballroom, and Camp at
  Hilltop remain readable wayfinding anchors one step earlier. This changes
  presentation only; it does not introduce any new map location or route.
- Evidence-map flow pass: no geometry was added or moved. The visible layer
  controls and map key now describe only the active evidence label families
  (territories, stages, venue names, and camping), and a search result restores
  its own label family before centring it. This removes a stale-control path
  without treating the old collections as map evidence.
- Visual-language pass: `IMG_3721.webp` and `IMG_3724.webp` show a deep
  woodland ground, subdued district land-use fills, narrow dark/muted-green
  routes, and only a few high-contrast landmark fields. The active palette now
  follows that hierarchy while retaining the already-reviewed yellow
  Copperwood/Hilltop, blue Thrutopia, pink camping, and purple Quantum fields.
  No territory, label, path, court, or camp geometry changed in this pass.
