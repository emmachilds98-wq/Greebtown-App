# Map working agreement

This is the operating agreement for the evidence-led map rebuild. Accuracy and
legibility take priority over coverage: an unsupported blank area is better
than a plausible-looking wrong location.

## Source hierarchy

1. Official Boomtown app screenshots and video frames in `docs/map-evidence/`.
2. Written findings that identify the exact source image/frame.
3. The current evidence-led renderer in `js/app.js`.

Historic coordinates, generated map-system geometry, scraped GPS, and prior
Greebtown screenshots are quarantine material. They may explain an old bug;
they must not place, size, align, or validate new map content.

## Active construction boundary

The map renderer must construct markers, labels, and geometry only from the
evidence-scene functions and the official sources cited beside them. Legacy
arrays may remain for non-map features such as schedule or discovery content,
but they must not be iterated, searched, or merely hidden during map setup.
Removing their producer path is required; a visibility flag is not a safe
substitute because it can be switched back on by later work.

## Evidence threshold

Classify every proposed addition before drawing it:

| Status | Evidence required | Allowed result |
| --- | --- | --- |
| Confirmed | Readable official name and one local relationship or silhouette | Named label, footprint, or route segment |
| Topology-supported | Two official views agree on adjacency/order but name or edge is not fully readable | Unnamed parent shape or restrained connecting corridor |
| Unconfirmed | One blurry view, a legacy value, or an inference with no second support | Leave blank and record the gap |

Never promote an item because it would make the map look fuller.

## Area-by-area workflow

1. Select one connected area; do not mix unrelated regions in one change.
2. Record the source files, observed neighbours, known boundaries, and open
   questions in `docs/map-evidence/` before coding.
3. Draw the parent territory first, then check its order and scale against the
   full-site reference.
4. Add named courts or labels only where the source supports them.
5. Add paths last. Every path needs two named/documented endpoints and must
   remain inside the supported corridor.
6. Review the entry view and a close view. Correct the whole connected cluster
   if one relation is wrong; never nudge just one marker against stale neighbours.

## Geometry and visual rules

- Do not reuse, transform, average, or offset legacy coordinates.
- Do not add decorative scatter, generic building rectangles, circular zones,
  random utility symbols, or standalone route strokes to fill visual space.
- A child court may sit inside its parent territory; it must not cross that
  boundary or overlap a sibling court without specific evidence.
- Districts, camps, woodland, and stage courts must read as distinct ground
  types at entry zoom. Do not rely on a label to distinguish two overlapping
  shapes.
- Campsite lanes stay inside the documented camp field and join a documented
  entrance/corridor. They never cut through towns, woodland, or stages.
- Utilities require a readable official service name plus neighbouring
  landmarks. An icon alone is not enough to position a toilet, water point,
  medical point, gate, vendor, or information point.
- Keep detail zoom-gated. The first view should show territory order and main
  routes, not a wall of labels.

## Required checks before review

Run these for map work:

```text
node scripts/map-preflight.mjs
node --check js/app.js
git diff --check
```

If runtime files changed, also confirm `APP_CACHE_VERSION` in `js/app.js` and
`CACHE_VERSION` in `service-worker.js` match, update both in one commit, and
use the same versioned script URL in `index.html`.

These checks prove file/data integrity only. They do not prove visual accuracy.
Before requesting merge, inspect a fresh entry-view render and one close-view
render against the cited official evidence. Confirm that no legacy labels,
markers, controls, parking fields, or stale MapLibre canvas sources remain.

## Draft and correction policy

Every map-detail PR is a review draft unless the user explicitly accepts it.
Use small, reversible commits and describe evidence and uncertainty in the PR.
When new evidence contradicts a draft, replace the affected connected cluster;
do not preserve its old shapes for compatibility.
