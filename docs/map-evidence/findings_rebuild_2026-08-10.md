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

## Full Moon Ballroom cluster refinement (recorded before geometry work)

- `findings_vidCD.md` frames `vidD f_0058`, `vidD f_0059`, and `vidD f_0067`
  identify Full Moon Ballroom as a large pale dome/marquee, with Silver Swan
  Talent Agency and Topsy Turvy Twins on the approach toward The Hide Out
  Hilltop, Velvet Rope to its south, and Foggers Mill branching east.
- The sources establish one local, named path chain: The Hide Out Hilltop →
  Silver Swan/Topsy Turvy → Full Moon Ballroom → Velvet Rope, plus the
  Foggers Mill branch. The chain is fully inside the already-reviewed
  Copperwood parent area; it may be rendered as a close-zoom local route and
  marquee form only.
- This pass may not assert individual stalls, amenities, a gate, camping,
  parking, a service, or any unconfirmed Anara/Copperwood feature.

### Full Moon Ballroom cluster refinement result

- Re-profiled the Full Moon Ballroom from a generic polygon into the recorded
  pale marquee form, then added only the named local approach/branch routes.
  The Full Moon, Velvet Rope, Foggers Mill, Silver Swan, Topsy Turvy, and The
  Hide Out labels retain their existing evidence-supported positions.
- The four route segments and every marquee vertex remain inside the reviewed
  Copperwood parent territory. No new label, venue, stall, service, camping,
  parking, gate, or parent boundary was added.

## Anara clearing form refinement (recorded before geometry work)

- `IMG_3735.webp` is a close official-app view of the Anara clearing. It
  visibly contains a broad, irregular pale clearing within dark woodland, a
  round grey gathering court in its lower-middle area, and a two-part magenta
  stage form at the clearing's north-east edge. The `ANARA` title sits in the
  upper/eastern half of this same clearing.
- Temple Valley Camping remains a separate, blue-bounded camping field below
  and south-east of the clearing. Its coloured pitch marks and local field
  lanes are already contained inside that separate field; this pass may not
  connect it to Anara or introduce a new camp route.
- This is a silhouette and label-anchor correction only. It must not add a
  venue, utility, gate, stall, individual tree, or a path deeper into the
  woodland.

### Anara clearing form refinement result

- Re-profiled the existing Anara clearing to its observed asymmetric outline,
  moved its territory title into the source-visible upper/eastern part of the
  clearing, and re-drew the grey communal court and magenta stage as the
  distinct round and stepped forms visible in `IMG_3735.webp`.
- The existing short approach was retained but routed around the communal court
  rather than through it. Temple Valley Camping, its boundary, field lanes and
  pitch marks remain unchanged and separate. No new name, route endpoint,
  venue, utility, gate, stall, tree, camp field, or parent boundary was added.

## Tribe of Frog clearing refinement (recorded before geometry work)

- `IMG_3747.webp` is the authoritative close official-app view for this
  connected south cluster. It shows Tribe of Frog as a pale, irregular clearing
  enclosed by woodland, with a compact purple/dark stage form within it; the
  court itself is not a large purple district fill. The `TRIBE OF FROG` title
  sits at the clearing's north-west edge, while the documented approach leaves
  from its south-east toward Quantum.
- The same source shows Quantum directly east/south-east of that clearing and
  `SUNSET HILL` further south-west. `IMG_3748.webp` separately confirms the
  Quantum-to-Lion's-Den relationship and must not be changed in this pass.
- This correction may revise only the existing Tribe court, compact stage form,
  label anchor, and already-documented approach. It must not introduce nearby
  service icons, gates, stalls, unnamed compounds, or a new route endpoint.
- `IMG_3747.webp` shows Quantum as green terrain inside a sharply visible
  purple boundary treatment, rather than a solid purple land-use block.
  `IMG_3748.webp` likewise shows the Lion's Den as a dark woodland clearing
  with a compact warm stage/apron and glow, not a large orange court fill.
  This connected pass may correct those existing ground treatments only; the
  current Quantum → Helix → Lion's Den path relationship and all other labels
  must remain in place.

### Tribe of Frog / Quantum / Lion's Den refinement result

- Re-profiled Tribe of Frog as a pale, irregular woodland clearing and
  replaced its broad purple compound with the source-visible compact concave
  stage pod. Its label now sits on the clearing's north-west edge and the
  existing approach begins at the clear south-east exit.
- Replaced Quantum's solid violet territory fill with the documented green
  ground, retaining its purple boundary treatment. The Tribe clearing and
  stage are now checked to stay entirely outside Quantum while the existing
  documented approach joins the two areas.
- Replaced the Lion's Den's broad orange court with dark woodland ground and
  retained the compact warm stage apron and glow. No service icon, gate,
  parking shape, stall, new route, or unrelated label was added.

## Lion's Den stage-form refinement (recorded before geometry work)

- `IMG_3748.webp` visibly shows the Lion's Den stage as a long, low warm-faced
  structure inside the dark clearing, with a darker rear/side mass and a broad
  orange glow. It is not a generic radial or hexagonal stage marker.
- The existing forest clearing, purple Quantum boundary, and the three
  amphitheatre tiers describe the correct connected setting. This pass may
  re-profile only the existing Lion's Den apron and landmark into the observed
  compact stage silhouette; it may not add a service icon, access road, vendor,
  gate, campsite, or new named point.

### Lion's Den stage-form refinement result

- Replaced the generic Lion's Den hexagon with a long, low dark stage structure
  and a separate warm front face, then re-set its three existing audience tiers
  below that face. The warm apron and glow remain contained within the original
  dark woodland clearing.
- No route, name, utility, access feature, vendor, campsite, gate, parking
  shape, or adjacent quantum/woodland boundary changed.

## Western core completion batch (recorded before geometry work)

- `IMG_3740.webp` establishes Hidden Woods as a separate pale clearing to the
  north-west of the Letsbe/Botanica edge; Letsbe then enters the Botanica loop.
  The same close view shows NEXUS as a dark crag-like canopy on a green mound
  beside that loop, rather than a large generic stage polygon.
- `IMG_3743.webp` establishes Metropolis immediately south-west of Botanica,
  with Hydro XL on its south-west edge. Hydro XL has a distinct purple halo and
  a small water form below it; its purple backstage loop is not a public path.
- `IMG_3742.webp` establishes Area 404 as the irregular lime-bounded enclosure
  east of Metropolis. Spectrum 360 is a compact centre with separate container
  pieces around it; the documented Area 404 venue chain continues south from
  that form. `findings_vidAB.md` frames `vidA f_0070`, `f_0091`, and `f_0093`
  confirm the connected Letsbe -> Botanica -> Metropolis -> Area 404 horseshoe.
- Scope: revise the five connected parent silhouettes/contours, the one
  documented horseshoe path, Hidden Woods and NEXUS forms, the Spectrum 360
  enclosure, and Hydro XL's already-confirmed landmark form. Keep every named
  label and existing documented venue chain in place. Do not create a stall,
  utility icon, gate, parking, or any route inferred from the official app UI.

### Western core completion batch result

- Re-profiled the linked Botanica, Metropolis, and Area 404 boundaries with
  matching contour lines, then re-drew the documented Letsbe-to-Area 404
  horseshoe as one connected set of locally supported paths.
- Replaced Hidden Woods' generic green court with its separate pale clearing
  treatment and reshaped NEXUS into an irregular green mound with its dark
  crag canopy. The existing labels remain attached to the same reviewed areas.
- Rebuilt Spectrum 360 as a compact central deck, enclosure, and four separate
  container forms within Area 404. Re-profiled Hydro XL into a distinct halo,
  dark core, and separate water form below Metropolis. These are source-visible
  landmark forms, not named stalls or extra places.
- Promoted the confirmed western compound and landmark layers to normal
  explore zoom so this larger construction is visible without a deep zoom. All
  new/refined child forms were checked to remain inside Botanica, Metropolis,
  or Area 404 where a reviewed parent boundary exists.

## Full-site overview legibility pass (recorded before geometry work)

- `IMG_3751.webp` is the authoritative wide-site reference. At overview scale,
  its connected festival ground, separate outer camp fields, central
  Grand Central -> Oldtown -> Quantum/Lion's Den sequence, and north-east
  Copperwood -> Thrutopia -> Anara sequence are visibly distinguishable before
  any venue-level detail is read.
- `IMG_3744.webp` confirms the western/northern woodland belt needs a distinct
  visual reading from the central districts, while `IMG_3745.webp` through
  `IMG_3750.webp` confirm the perimeter camp fields are individually bounded
  land-use forms rather than a single background fill.
- `findings_vidAB.md` records the direct main movement relationships that the
  existing evidence spine already represents. At overview, strengthen only
  those existing spine segments and the reviewed district/camp boundaries;
  do not add an inferred route.
- Scope: update only the presentation of existing territory contours,
  camp outlines, documented main spine, and already-confirmed stage focal
  points so they remain legible below explore zoom. Do not move a label or
  polygon, create a venue/stall/utility/gate/parking feature, or expose close
  venue chips at overview.

### Full-site overview legibility result

- Lowered the reviewed territory and camp contours to overview zoom and
  increased their visual contrast, so the full-site territory order is clear
  rather than reading as a single dark field.
- Strengthened the existing documented movement spine only. It now reads as
  the primary site structure at overview while all finer routes remain gated
  to explore zoom.
- Added a small original focal-point hierarchy for the already-rendered
  Hidden Woods, Tangled Roots, NEXUS, Grand Central, Anara, Spectrum 360,
  Hydro XL, Tribe of Frog, Helix, and Lion's Den forms. Each is a coloured
  dot and glow at overview—not a copied official icon or an additional place.
- The child/parent check confirms each overview focal point remains inside its
  existing reviewed court, territory, or landmark form. No geometry, label,
  close venue, facility, gate, parking, or inferred route was added.

## Perimeter camping-shape reset (recorded before geometry work)

- `IMG_3745.webp` shows Downtown Camping as an angular western field with a
  broad upper wedge and a narrower southern continuation. It must not remain a
  rounded, isolated blob. `IMG_3746.webp` separately shows West Camping north
  of that field as an irregular green outer-ground form; the two areas may not
  merge.
- `IMG_3751.webp` establishes the compact north Valley Camping form and the
  long Hilltop eastern field as separate land-use areas. `IMG_3748.webp`
  establishes the yellow Sunset field along the southern edge as separate from
  the green `SUNSET HILL` transition above it; Sunset Hill has an area label,
  not a supported campsite footprint.
- `IMG_3749.webp` and `IMG_3750.webp` establish East Camping as a long,
  angular right/perimeter field with a narrow upper connection and a broader
  southern body, separate from the Lion's Den woodland and the southern road
  edge. Temple Valley stays its own right/north-east field.
- `IMG_3747.webp` shows the named Sunset Hill as the broad green transition
  above the separate yellow Sunset field. It may be rendered as a simple green
  landscape silhouette without an internal route, camp detail, or new label.
- The screenshots show many amenity and pitch-like icons, but do not provide
  stable identities or an authoritative internal circulation layout. This pass
  therefore replaces every active generic camp pitch, tent, and local lane
  pattern with empty evidence collections. It changes only outer silhouettes
  and their matching contours; no campsite route, utility, gate, parking,
  vendor, or individual pitch may be inferred.
- The shared festival-ground silhouette may expand only where the revised
  official campsite edges meet the site perimeter. Its matching outer contour
  must move with it; no new land use or access edge is implied by that change.

### Perimeter camping-shape reset result

- Replaced the West, Downtown, Valley, Camp at Hilltop, Sunset, East, and
  Temple Valley field silhouettes and moved every matching contour with its
  parent. The shared ground now contains the revised west/south/east edges
  without clipping a reviewed campsite.
- Replaced the old over-wide yellow Sunset field with a compact southern field
  and drew Sunset Hill as its separate green transition. The Sunset Hill label
  remains in that green form and the two land-use shapes do not overlap.
- Removed all active generic campsite tents, pitch diamonds, local lanes, and
  camp-only detail routes. The map now presents only the evidence-supported
  outer field shapes until a source establishes an internal public layout.
- Containment checks confirm the perimeter fields remain inside the reviewed
  site, Camp at Hilltop remains within Hilltop, and Sunset is separate from
  Sunset Hill. No facilities, gates, parking, vendor, or new route was added.

## Full-site separation reset (recorded before geometry work)

- `IMG_3751.webp` is the controlling whole-site view for this pass. Its
  western and southern areas must read as distinct regions at first view: the
  West and Downtown camping grounds occupy broad outer land areas, while the
  town and the southern woodland do not collapse into one dense central mass.
  The first camera must include the full reviewed ground outline rather than
  cutting off the outer edges of those fields.
- `IMG_3740.webp` shows Hidden Woods as a substantial pale woodland clearing
  north-west of the Letsbe/Botanica edge. It needs its own visibly readable
  court and a green gap before the Botanica loop; it is not a small chip
  embedded in a campsite or town district.
- `IMG_3747.webp` shows Tribe of Frog as a separate pale clearing in the
  Sunset Hill woodland, south of the central town and west/north-west of
  Quantum. Its court and compact purple stage form must stay outside Area
  404 and outside Quantum, with woodland ground visibly separating all three
  places.
- `IMG_3747.webp` and `IMG_3748.webp` establish the continued southward
  order: separate Tribe of Frog clearing, Quantum transition, then the
  Lion's Den woodland court to the east. This supports moving the full
  connected south cluster together, not moving a label independently.
- `IMG_3745.webp`, `IMG_3746.webp`, `IMG_3748.webp`, `IMG_3749.webp`, and
  `IMG_3750.webp` keep the outer camping grounds as large, isolated land-use
  forms at the site edge. They may be enlarged only as coherent outer
  silhouettes; no inner pitch, lane, utility, gate, or stall detail is
  licensed by this reset.

### Scope for this pass

- Rework the western/southern parent boundaries, the linked Tribe of Frog /
  Quantum court-and-route relationship, the Hidden Woods parent clearing,
  the matching labels/focal points, and the reviewed entry camera together.
- Do not add a named venue, service, parking area, gate, internal campsite
  layout, or any new route beyond the already documented connections.

### Runtime presentation repair

- A fresh local entry-view review exposed a MapLibre validation failure in the
  existing overview-halo radius expression. The expression nested `zoom`
  inside a multiply expression, so MapLibre stopped installing evidence layers
  partway through the scene. This is a rendering-syntax repair only: preserve
  the same source-backed halo scale at each reviewed zoom and do not use it to
  move, add, or enlarge any map feature.

### Full-site separation reset result

- Re-sized the West, Downtown, Valley, Hilltop, Sunset, East, and Temple
  field silhouettes as outer site grounds, and expanded the quiet festival
  outline only enough to contain those reviewed edges. The entry camera now
  fits that complete outline instead of replacing it with a centre-only view.
- Re-profiled Hidden Woods as a larger, distinct clearing with a documented
  connection toward Letsbe, leaving it outside West Camping. Re-profiled the
  full Area 404 → Tribe of Frog → Quantum relation: Area 404 stops above the
  Tribe clearing; Tribe is contained in Sunset Hill woodland; and Quantum
  begins beyond a visible woodland gap.
- Repaired the overview-halo radius as a top-level zoom interpolation. A
  fresh local MapLibre render completed with one canvas, all evidence labels,
  and no new console error. The containment review confirms that every camp
  stays inside the revised site, Hidden Woods is separate from West Camping,
  and Tribe is separate from Area 404 and Quantum.

## Whole-site proportional scale correction (recorded before geometry work)

- `IMG_3745.webp` and `IMG_3746.webp` show that the western camping side is
  not made of small, equal islands. West Camping is a broad upper ground, while
  Downtown Camping has a wide northern wedge, a pinched middle by the town
  approach, and a substantial southern body. The two remain separate land-use
  fields.
- `IMG_3748.webp` is decisive for the southern scale: Sunset is a long yellow
  field along the reviewed southern edge, visibly much wider than the nearby
  Tribe of Frog clearing or Sunset Hill transition. It must not be represented
  as a small isolated patch at the lower left.
- `IMG_3749.webp` and `IMG_3750.webp` show East Camping as a tall, articulated
  right-edge field: a narrow northern neck joins a much broader southern body.
  It is set east of the Lion's Den woodland and above the southern Sunset edge,
  rather than collapsing into either one.
- `IMG_3751.webp` keeps Valley Camping as a broad northern field and Camp at
  Hilltop as a long, narrow eastern field. These outer forms must be visibly
  larger than the dense town courts at the opening overview, while Grand
  Central/Oldtown remain the compact focal cluster.

### Scope for this pass

- Resize the cited outer parent silhouettes, their matching contour rings, the
  shared festival-ground edge where needed, and their overview anchors as one
  proportional composition. Keep the established town, Hidden Woods,
  Tribe/Quantum, and Lion's Den relationships intact.
- Do not add or infer campsite pitches, tents, roads, facilities, gates,
  parking, stalls, utilities, or new named places. The source supports field
  massing and edge shape only.

### Whole-site proportional scale correction result

- Re-sized West, Downtown, Valley, Camp at Hilltop, Sunset, and East as one
  overview composition. The now-wide Sunset band, the two-part Downtown field,
  the tall Hilltop field, and the articulated East field make the outer grounds
  visually larger than the compact town courts, as in the cited sources.
- Kept all matching camp outlines on the exact same ring as their active field
  fill. The only inset is Hilltop's reviewed inner field outline.
- Added an executable proportions audit. It fails if a camp fill drifts from
  its outline or if the reviewed West/Hidden Woods, Downtown/Area 404,
  Valley/Anara, Hilltop/Lion's Den, Sunset/Quantum, Sunset/East, or
  East/Lion's Den separations are reintroduced.
