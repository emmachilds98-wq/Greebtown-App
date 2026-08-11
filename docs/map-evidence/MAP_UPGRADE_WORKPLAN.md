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

Chunks 0, 1 and 2 are complete: the executable evidence boundary, active
controls/search, entry hierarchy, overview anchors and whole-site backbone
have all been reviewed and shipped. Chunk 3 is also complete for the current
evidence set. Chunk 4 is in progress: Copperwood, Thrutopia and their Grand
Central hand-off have been re-read from `IMG_3724.webp`; Anara, Oldtown and
Hilltop remain separate reviewed sub-clusters rather than being pulled into a
single speculative redraw.

The next pass should complete the remaining central/east close detail only if
new or existing official evidence records a specific relationship. It should
then re-check the full Copperwood â†’ Thrutopia â†’ Anara and Grand Central â†’
Oldtown â†’ Hilltop sequences before moving to the final polish/release chunk.
