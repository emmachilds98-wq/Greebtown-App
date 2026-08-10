# Evidence-map source of truth

The live map is an original illustration inferred solely from the official
screenshots and video findings in this folder. It is not a reproduction of
official artwork and it does not use imported map coordinates.

## Runtime boundary

Only these parts of `js/app.js` may create visible map content:

- `buildEvidenceOnlyMapGeoJSON()`;
- `evidenceRebuildLabels()`;
- `evidenceRebuildDetailLabels()`;
- `installEvidenceSceneLayers()`.

They use a neutral internal MapLibre plane. No legacy stage collection,
generated map-system layer, scraped GPS record, parking/gate collection, or
external geographic basemap is allowed in the active map path.

The active map is a fixed north-up, zero-pitch overhead plan. Do not re-enable
rotation or pitch: the evidence-derived layout is reviewed as a flat diagram.

## Evidence policy

- Use the `IMG_3721`–`IMG_3734` official screenshots and the cited video
  findings for spatial relationships.
- Record the exact file(s) and observed neighbours before adding a named
  landmark, court, campsite lane, or path.
- Keep a feature out when its name, boundary, or relation is unclear.
- Do not use a screenshot of Greebtown itself to validate Greebtown.

### Screenshot precedence

When newer official screenshots visibly name and bound an area, they take
precedence over older footage where that area was absent or not searchable.
In particular, IMG_3724.webp visibly shows THRUTOPIA east of Copperwood with
its own bounded zone; keep it in the active evidence scene.

## Required verification

Run `node scripts/map-preflight.mjs` for every map change. It includes
`scripts/assert-evidence-map-boundary.mjs`, which fails if a legacy geometry,
MapLibre source, or marker producer becomes active again. Then compare a fresh
entry view and a close view with the cited official material before merge.
