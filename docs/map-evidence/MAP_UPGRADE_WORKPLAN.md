# Evidence-map upgrade workplan

## Destination

Build an original, offline-capable festival companion map that has the same
*kind* of experience as the official Boomtown map: a calm overhead arrival
view, clear districts and land use, useful close-in venue detail, and a quick
way to find a known place. It must not copy official artwork, tiles, or
private map data. It also must not claim to be live navigation; people should
use the official app on site for that.

The map has three deliberate reading levels:

1. **Overview** — territory order, woodland, camps, and the main movement
   spine are clear before any close labels compete for space.
2. **Explore** — a normal pinch/zoom reveals confirmed main stages, courts,
   camps and locally supported paths.
3. **Find** — search takes a visitor to a confirmed name and makes that item
   visible even if its optional label family had been switched off.

## Non-negotiable rules

- Only `IMG_3721`–`IMG_3734` and the cited official-video findings in this
  folder can establish active-map placement. Newer readable screenshots win
  over older ambiguous footage.
- The active renderer is limited to `buildEvidenceOnlyMapGeoJSON()`,
  `evidenceRebuildLabels()`, `evidenceRebuildDetailLabels()`, and
  `installEvidenceSceneLayers()`. Historic coordinate collections and
  map-system data stay quarantined from that path.
- A named place, footprint, lane or route is added only after recording its
  source file/frame and at least one visible neighbour. Unknown utilities,
  gates, parking, stalls, and filler geometry stay absent.
- Never solve an incorrect relationship by applying an offset or retaining a
  neighbouring legacy marker. Rework the affected connected cluster from its
  evidence instead.
- Every map-facing control, legend item and search result must correspond to
  a currently rendered evidence group. A retired category must be removed,
  not merely hidden.

## Fast, reviewable upgrade chunks

Each chunk should be its own small PR and stops at its acceptance check. This
keeps new evidence easy to incorporate without carrying speculative work into
the next pass.

| Chunk | Scope | Completion check |
| --- | --- | --- |
| 0. Guardrail baseline | Keep the evidence boundary executable; list source precedence and the current scene; remove obsolete UI descriptions of retired data. | `map-preflight` passes; every visible layer chip maps to an active group; no parking/gate/legacy legend item remains. |
| 1. Arrival and finding flow | Flat north-up entry, site-overview reset, search feedback, evidence-only layer controls, label hierarchy. | Fresh entry is readable on a phone; search reveals and centres a confirmed result; overview restores the reviewed site extent. |
| 2. Whole-site backbone | Review the territory silhouettes, boundary adjacency, camps, woodland, and only documented long routes. | Compare the overview with `IMG_3721`, `IMG_3724`, `IMG_3726`, and `IMG_3729`; correct any connected area before adding detail. |
| 3. North and west compounds | Letsbe/Botanica/Nexus/Hidden Woods, then Metropolis/Area 404/Hydro. Add only evidenced courts, grouped massing and local paths. | Each addition names its source and neighbours in `findings_rebuild_2026-08-10.md`; no anonymous building scatter. |
| 4. Central and east compounds | Copperwood/Thrutopia/Anara, then Grand Central/Oldtown/Hilltop. Preserve the newer Thrutopia boundary evidence. | Check Copperwood → Thrutopia → Anara and Grand Central → Oldtown → Hilltop as complete connected sequences. |
| 5. South, camps, and close detail | Quantum/Helix/Lion’s Den plus confirmed camp lanes, pitch marks and specific venue forms. | Camp marks remain inside their own fields; Lion’s Den and Hilltop stay separate; no inferred service pins. |
| 6. Polish and release | Tighten original illustration palette, label contrast, collision behavior, touch targets and cache delivery. | Review a fresh phone entry, a central close view, a north/east close view, and an offline reload; cache versions match. |

## Required working loop for every geometry change

1. Choose one connected cluster from the table above.
2. Record source(s), observable neighbours, boundary certainty, and open
   questions in `findings_rebuild_2026-08-10.md` **before** changing code.
3. Change the parent silhouette first, then its documented routes, then any
   close detail. Do not mix unrelated regions in the same PR.
4. Run:

   ```text
   node scripts/map-preflight.mjs
   node scripts/audit-map-zoom-hierarchy.mjs
   node scripts/audit-map-label-collisions.mjs
   node --check js/app.js
   git diff --check
   ```

5. Compare a fresh map entry and a close view with the cited official evidence.
   If either the order, spacing, shape, or label hierarchy is wrong, replace
   the connected draft rather than layering a corrective patch over it.
6. For every runtime change, bump the application/service-worker cache version
   and the versioned script URL together before publishing.

## Stop-and-rework triggers

Stop the current chunk and return to its parent territory when any of the
following occurs:

- a screenshot contradicts a previously assumed relative position;
- a label needs to be moved independently of its court/territory to look
  correct;
- a route has no documented endpoints;
- a chip, legend entry, icon, or search result cannot be traced to the active
  evidence renderer;
- detail makes the entry view harder to read rather than improving a close
  view.

## Current progress and next action

### Completion execution sequence

The remaining work is executed in substantial connected batches, not isolated
marker edits. Each batch starts at the parent silhouette, then applies only the
documented route and close forms inside it, then runs the required entry and
close-view checks.

1. **Western core** — Hidden Woods, Letsbe, Botanica, NEXUS, Metropolis, Area
   404/Spectrum 360, and Hydro XL. Sources: `IMG_3740.webp`, `IMG_3742.webp`,
   `IMG_3743.webp`, and `findings_vidAB.md`.
2. **North-east and central** — Tangled Roots, Copperwood, Thrutopia, Anara,
   Grand Central, Oldtown, and Hilltop. Sources: `IMG_3735.webp` through
   `IMG_3739.webp` and `findings_vidCD.md`.
3. **South and perimeter** — Tribe of Frog, Quantum, Helix, Lion's Den,
   Sunset, and the reviewed separate camp-field silhouettes. Sources:
   `IMG_3745.webp` through `IMG_3751.webp` and `findings_vidE2.md`.
4. **Release review** — confirm the whole-site overview, all three connected
   close clusters, label hierarchy, fresh-canvas refresh, cache delivery, and
   the executable evidence boundary before publication.

**Overview prerequisite — complete:** the whole-site view now uses the reviewed
territory and camp boundaries, existing main spine, and confirmed focal-point
hierarchy as its first reading level. This is an explicit completion gate: no
more close-only additions can be treated as map progress while the zoomed-out
map remains visually unchanged.

**Perimeter prerequisite — complete:** every campsite silhouette has been
reworked as an outer land-use boundary from the newer official screenshots.
Generic pitch marks, tents and local lanes are no longer active evidence-map
content.

**Separation reset — complete:** the entry camera now fits the full reviewed
festival outline; the West, Downtown, Valley, Hilltop, Sunset, East and Temple
fields read as outer grounds rather than central parcels. Hidden Woods is a
distinct pale clearing, and Tribe of Frog is contained in Sunset Hill woodland
with a visible gap from Area 404 and Quantum. The repaired overview-halo layer
also completes rendering instead of aborting MapLibre layer installation.

**Proportional scale correction — complete:** the cited outer fields have
been resized as a single overview composition: Downtown has its wide wedge and
lower body, Sunset spans the southern edge, Hilltop reads as a long eastern
field, and East reads as a tall articulated right-side field. The executable
proportions audit now blocks a later edit from splitting a field from its own
outline or reintroducing a documented boundary overlap.

The first of these batches is complete. It is a connected western-core pass
rather than a single-landmark tweak: parent silhouettes, the documented
horseshoe, key landmark forms, and their display zoom were reviewed together.
The next batch re-checks the north-east/central sequence as a whole before
adding anything further.

Chunks 0, 1 and 2 are complete: the executable evidence boundary, active
controls/search, entry hierarchy, overview anchors and whole-site backbone
have all been reviewed and shipped. Chunk 3 is also complete for the current
evidence set. Chunk 4 is in progress: Copperwood/Thrutopia and the Grand
Central â†’ Oldtown â†’ Quantum â†’ Lion's Den sequence have been re-read from
`IMG_3724.webp`, `IMG_3729.webp`, and the cited footage. Anara remains a
separate reviewed sub-cluster rather than being pulled into a speculative
redraw.

**Update — newer official screenshot batch:** `IMG_3735.webp`, `IMG_3736.webp`
and `IMG_3738.webp` now confirm Anara's clearing, Temple Valley boundary, and
the green interiors behind the Copperwood/Thrutopia coloured outlines. Those
observed forms are included in the active map; uncertain Anara venues and
deeper routes remain deliberately absent.

**Update - Oldtown close view:** `IMG_3737.webp` confirms that the Grand
Central-to-Oldtown hand-off is a short teal path with a local fork, and that
Oldtown itself is two linked red-route venue lanes rather than a diffuse
district of unrelated blocks. This relationship is now rendered at close view
only. The next pass must keep using connected evidence, not fill those lanes
with inferred stalls or service icons.

**Update - outer-zone pass:** `IMG_3745.webp` through `IMG_3751.webp` make
the campsite perimeter clearer than the earlier core close-ups. West,
Downtown, Valley, Sunset, and East Camping are each separate land-use shapes;
their new silhouettes and overview labels should be reviewed before any new
routes, pitches, utilities, gates, or venue detail are added inside them.

**Update - western territory pass:** `IMG_3739.webp` through
`IMG_3744.webp` show the woodland belt and the linked Botanica, Metropolis,
and Area 404 boundaries more clearly than prior overview shots. Their parent
silhouettes are now the next reviewed layer; do not mistake the close-up venue
forms for permission to add more buildings or points of interest.

**Update - full-site composition pass:** `IMG_3751.webp` confirms that the
territories sit on one connected festival ground rather than isolated map
islands. The active scene now has a restrained shared site silhouette below
the named territories, plus revised north/east and central/south parent edges
from `IMG_3735.webp` through `IMG_3739.webp` and `IMG_3747.webp` through
`IMG_3748.webp`. The next pass must validate this overview at entry scale
before any further close-detail additions.

**Update - completion-layer pass:** `IMG_3737.webp`, `IMG_3739.webp`,
`IMG_3738.webp`, `IMG_3735.webp`, `IMG_3747.webp`, and `IMG_3748.webp` now
support connected close-detail frontages and stage forms in the already
reviewed central, north/east, and south clusters. Those grouped forms are now
rendered at close zoom alongside the confirmed labels; individual stalls and
all facilities remain deliberately blank unless their name and neighbours are
readable. The CSS delivery path is versioned and network-first so users do not
mistake a stale visual cache for a missing map update.

**Update - entry-hierarchy polish:** a fresh v464 review showed that entry
landed on the same threshold as the complete venue-chip tier. The next
release starts just below that tier, retaining primary confirmed names while
requiring only a small intentional zoom to reveal the complete close detail.
This is a presentation correction only; no evidence geometry changes.

**Update - central lane refinement:** `IMG_3737.webp` and `vidD f_0067` /
`f_0070` make the Oldtown reading more specific: two slender red-edged venue
lanes on dark ground, with compact warm frontage groups. The broad Oldtown
court has been removed in favour of those connected lane-side groups, without
adding a vendor, utility, route, or new named place. Frontage detail remains
close-zoom only.

**Update - Full Moon cluster refinement:** `vidD f_0058`, `f_0059`, and
`f_0067` establish Full Moon Ballroom's pale marquee and its named local
chain through The Hide Out, Silver Swan/Topsy Turvy, Velvet Rope, and Foggers
Mill. The active close view now renders that bounded local route and marquee
form only; no individual stall, utility, gate, camping, or parent geometry
has been inferred.

**Update - Anara form refinement:** `IMG_3735.webp` is now reflected more
closely at close view: Anara's clearing, title anchor, communal circle and
stepped magenta stage retain their observed relationship, while the separate
Temple Valley field remains untouched. The next pass must re-check the full
Copperwood → Thrutopia → Anara sequence before considering any deeper Anara
detail.

**Update - south-corridor refinement:** `IMG_3747.webp` and `IMG_3748.webp`
now drive the connected Tribe of Frog → Quantum → Lion's Den close view. The
map retains the documented approach and landmark hierarchy while replacing
incorrect solid purple/orange court fills with the observed woodland ground
and boundary treatments. The next pass must preserve this corrected south
sequence before adding any new close detail.

**Update - Lion's Den stage form:** the visible stage in `IMG_3748.webp` is
now a compact long-fronted landmark inside the reviewed clearing, with its
audience tiers below it. This completes the source-visible Lion's Den form;
do not introduce nearby icon-derived facilities or access features.

The next pass should complete the remaining central/east close detail only if
new or existing official evidence records a specific relationship. It should
then re-check the full Copperwood â†’ Thrutopia â†’ Anara and Grand Central â†’
Oldtown â†’ Hilltop sequences before moving to the final polish/release chunk.
