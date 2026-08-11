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
- Backbone correction: `IMG_3726.webp` and `IMG_3729.webp` show Hilltop as a
  long north-to-south field running from the Thrutopia/Oldtown corridor toward
  Quantum and the Lion's Den. Its parent territory and matching contour now
  retain that longer eastern silhouette. The Site overview action also has its
  own six source-backed anchors (Copperwood, Thrutopia, Grand Central,
  Oldtown, Hilltop, and the Lion's Den), rather than hiding every active label
  at overview zoom. No new venue, utility, camp, or route was added.
- North/east compound pass: `IMG_3724.webp` shows Copperwood as a clipped
  golden compound whose south side hands off toward Grand Central, and a
  separate blue Thrutopia enclosure immediately to its east. The close view
  also shows compact, grouped internal forms in both places. The active scene
  now replaces the earlier generic six-sided outlines with those distinct
  silhouettes, extends the already-documented Copperwood-to-Thrutopia local
  route, and adds only unlabeled grouped massing inside those two boundaries.
  These forms are deliberately illustrative clusters, not a claim of exact
  stall footprints. Anara, Grand Central, Oldtown, Hilltop, routes beyond the
  observed hand-off, utilities, and gates were not changed.
- Central/east corridor correction: `IMG_3729.webp` plus
  `findings_vidAB.md` show the continuous Grand Central â†’ Oldtown â†’ Quantum
  sequence and the Lion's Den branch passing *below* Hilltop. The dark
  diagonal at Hilltop's western edge is a boundary/fence rather than a public
  route. The active spine therefore now ends at Quantum and resumes south of
  the yellow field for Helix/Lion's Den, instead of cutting across Hilltop.
  The Grand Central close path now records the observed Boomtown Hall/Daily
  Rag fork and two junction points. A small original red stage glyph and
  yellow Hilltop camp marker represent the confirmed landmark forms; neither
  is a new venue or utility. Anara remains unchanged because its interior
  relationships are still too imprecise for a geometry pass.
- New-evidence correction: `IMG_3735.webp`, `IMG_3736.webp`, and
  `IMG_3738.webp` are official-app close views newly added at the root of
  this folder. They show green land inside Copperwood and Thrutopia, with the
  yellow/blue treatment restricted to each compound's boundary. The active
  scene therefore replaces the mistaken solid yellow/blue district fills with
  wooded green ground and stronger evidence contours. `IMG_3735.webp` also
  shows Anara as a pale clearing inside the forest shell, with a round grey
  court and a magenta stage form north-west of the separately outlined Temple
  Valley Camping field. The renderer adds only these observed forms and the
  short clearing approach; it does not add unnamed facilities, gates, or a
  speculative route deeper into Anara.
- Oldtown spine refinement: `IMG_3737.webp` shows Grand Central's short teal
  transition and fork into the town, followed by Oldtown's two separate,
  winding red-edged north-to-south venue lanes and one small linking loop.
  The active close view now gives these documented circulation types their own
  solid route treatment and reinforces their containing outlines. It does not
  add or relocate individual stalls, facilities, gates, parking, or labels.
- Outer-zone pass: `IMG_3745.webp` and `IMG_3746.webp` show West and Downtown
  Camping as separate, broad outer grounds; `IMG_3748.webp` shows Sunset as a
  distinct southern yellow field; and `IMG_3749.webp` plus `IMG_3750.webp`
  show the eastern salmon ground beyond the Lion's Den. The active map now
  gives each a separate silhouette, boundary and overview anchor. No new
  internal circulation, stalls, utilities, gates, parking, or car-park shape
  has been added.
- Western territory pass: `IMG_3739.webp` and `IMG_3744.webp` show a
  continuous woodland belt around the west/north side of the town, while
  `IMG_3740.webp`, `IMG_3742.webp`, and `IMG_3743.webp` show Botanica,
  Metropolis, and Area 404 as connected but visibly irregular territories.
  The active parent fills and matching contours now follow those distinct
  silhouettes. No venue, path, utility, gate, parking, or additional detail
  geometry has been added.

## Composition pass evidence (recorded before geometry work)

- `IMG_3751.webp` is the current full-site relationship reference: the map is
  one continuous festival ground, with West/Downtown camping on the west,
  Copperwood/Thrutopia/Anara across the north-east, Grand Central then Oldtown
  at the centre, the long Hilltop field to their east, and Quantum/Lion's Den
  above the separate southern Sunset/East camping edges.
- `IMG_3735.webp` through `IMG_3739.webp` confirm that Anara/Temple and the
  Copperwood/Thrutopia sequence sit within that same north/east ground, not as
  isolated islands. `IMG_3747.webp` and `IMG_3748.webp` confirm the green
  Sunset Hill woodland transition between the central/southern cluster and
  the yellow Sunset field.
- This composition pass may change only the site silhouette, parent territory
  boundaries, their overview anchors, and the direct site-edge/territory
  contours. It must not add venue footprints, stalls, individual trees,
  utilities, parking, gates, or unsupported paths.

### Composition pass result

- Added a single subdued `Festival grounds` silhouette beneath the evidence
  territories, traced from `IMG_3751.webp`. This restores the continuous-site
  reading at overview scale without inventing another zone or adding detail.
- Re-profiled only the Copperwood/Thrutopia/Anara, Grand Central/Oldtown/
  Hilltop, and Quantum/Lion's Den parent silhouettes and their matching
  contours. The north/east sources are `IMG_3735.webp`, `IMG_3736.webp`, and
  `IMG_3738.webp`; the southern sources are `IMG_3747.webp` and
  `IMG_3748.webp`. No individual venue, route, stall, tree, utility, gate, or
  parking feature was added in this pass.

## Completion-layer evidence (recorded before geometry work)

- `IMG_3737.webp` shows a named Grand Central stage frontage and two separate
  connected Oldtown streetfront chains around the already-recorded teal and
  red routes. It supports court/frontage massing, not individual vendor or
  service placement.
- `IMG_3739.webp` shows the Tangled Roots/Copperwood transition as connected
  compound frontage, while `IMG_3735.webp` shows Anara's pale clearing,
  communal circle and magenta stage form. `IMG_3747.webp` shows the enclosed
  Tribe of Frog clearing and its approach toward Quantum. These sources permit
  only the already-named stage/compound forms and their internal edges.
- `IMG_3747.webp` also gives a readable `SUNSET HILL` area label south-west
  of the Tribe of Frog/Quantum transition. It is an area name, not a campsite
  or a new route.
- This pass must not infer a specific food stall, toilet, water point, gate,
  parking area, or unnamed vendor from the icons or densely drawn blocks in
  those sources. Their exact identity and neighbour evidence is incomplete.

### Completion-layer result

- Replaced the remaining anonymous close-view block scatter with 21 named,
  source-backed frontage/compound groups. They follow the documented
  Botanica/Metropolis/Area 404, Copperwood/Thrutopia, Grand Central/Oldtown,
  Tribe of Frog/Quantum, and Lion's Den court or street edges; no individual
  stall identity is asserted.
- Added recognisable Tangled Roots, Grand Central, and Tribe of Frog stage
  forms; reshaped the Lion's Den tier marks into the recorded amphitheatre
  reading; repaired the `Síbín Beag` label encoding; and added the confirmed
  `SUNSET HILL` area label. No locations were moved.
- All other confirmed main-stage names are already represented by the active
  evidence labels. `Infinity` remains intentionally absent from the map: the
  current material establishes it east of the Metropolis run but not a stable
  enough local boundary/anchor to place its footprint safely.
- Removed the retired parking/gate/utility legend from the page and made the
  versioned stylesheet network-first. Existing visitors now receive the
  current map presentation instead of combining new map JavaScript with old
  cached CSS.

## Entry-hierarchy polish (recorded before code)

- A fresh live review of the v464 map at its normal entry camera showed that
  the camera landed exactly on the close-detail label threshold. That made
  every verified small-venue chip appear at once, obscuring the territory
  sequence that `IMG_3751.webp` establishes first.
- `IMG_3751.webp` remains the source for the whole-site order; `IMG_3737.webp`
  remains the source for the Grand Central-to-Oldtown close detail. This is a
  hierarchy correction only: it must not move, resize, add, or remove any
  territory, court, frontage, route, campsite, or landmark.
- The reviewed entry should therefore start one small zoom step below the
  close-detail label threshold. Primary confirmed names remain available at
  the normal explore view; the complete venue-chip tier should appear after a
  deliberate small zoom into a district.

## Central lane refinement (recorded before geometry work)

- `IMG_3737.webp` and `findings_vidCD.md` frames `vidD f_0067` and
  `vidD f_0070` show Oldtown as dark ground containing two narrow, winding
  north-to-south red-edged venue lanes. The Pomegranate Parlour, Den of Dis
  Order, Mining For (g)Old Town, Síbín Beag, and The Feckless Wrecked follow
  the eastern lane; Postal Posse, Trough Love, Da Graaff's Reformatory, La
  Luna Coven, The Common Ground, and Buskers Wharf follow the western lane.
- The same sources show compact warm frontage groups beside those lanes, not
  a single broad peach stage court. The broad Oldtown court approximation must
  therefore be removed and its connected frontage groups re-profiled into
  short, irregular lane-side compounds. Their names remain descriptive groups,
  never claims about individual stalls or businesses.
- Grand Central, the white chevron clearing, the teal Boomtown Hall/Daily Rag
  fork, the two existing Oldtown routes, and every named label retain their
  current evidence-supported relationship. This pass may not add a service,
  gate, parking area, unnamed vendor, or new route.

### Central lane refinement result

- Removed the broad Oldtown court approximation. Seven compact, irregular
  frontage groups now follow the already-rendered western and eastern lanes
  and their southern turn, while the two documented red routes remain visible
  on the parent district's dark ground.
- Grouped frontage detail now starts with the complete close-detail tier rather
  than appearing in the entry view. No labels, routes, stage courts, parent
  boundaries, or other locations changed.
