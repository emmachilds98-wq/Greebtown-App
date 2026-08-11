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

The active map loads as a north-up, zero-pitch overhead plan. Rotation and
pitch remain available after load; the Site overview action resets to the
reviewed flat diagram.

## Evidence policy

- Use the `IMG_3721`–`IMG_3751` official screenshots and the cited video
  findings for spatial relationships. The newer root-level `IMG_3735`–
  `IMG_3751` uploads are verified official-app captures and take precedence
  where they show a clearer boundary, ground treatment, or landmark form.
- Record the exact file(s) and observed neighbours before adding a named
  landmark, court, campsite lane, or path.
- Keep a feature out when its name, boundary, or relation is unclear.
- Do not use a screenshot of Greebtown itself to validate Greebtown.

### Screenshot precedence

When newer official screenshots visibly name and bound an area, they take
precedence over older footage where that area was absent or not searchable.
In particular, IMG_3724.webp visibly shows THRUTOPIA east of Copperwood with
its own bounded zone; keep it in the active evidence scene.
IMG_3736.webp and IMG_3738.webp further clarify that the blue/yellow are
Thrutopia/Copperwood *boundary* treatments over green ground, not solid
district fills. IMG_3735.webp is the current reference for Anara's pale
clearing, round court, and Temple Valley edge.

## Required verification

Run `node scripts/map-preflight.mjs` for every map change. It includes
`scripts/assert-evidence-map-boundary.mjs`, which fails if a legacy geometry,
MapLibre source, or marker producer becomes active again. Then compare a fresh
entry view and a close view with the cited official material before merge.
