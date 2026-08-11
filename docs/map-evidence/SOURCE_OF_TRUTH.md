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

`IMG_3745.webp` and `IMG_3746.webp` are the current references for the
separate West and Downtown Camping silhouettes. `IMG_3748.webp` confirms
Sunset as its own southern yellow field, while `IMG_3749.webp` and
`IMG_3750.webp` confirm the separate eastern salmon camping ground. Treat
these as land-use boundaries first; do not infer their inner stalls, gates,
parking, or facilities from the overview.

`IMG_3739.webp` and `IMG_3744.webp` show the western woodland as a connected
outer belt around the town. `IMG_3740.webp`, `IMG_3742.webp`, and
`IMG_3743.webp` are the current references for Botanica, Metropolis, and Area
404's broad, linked district silhouettes. Use them to correct only the parent
boundaries; venue footprints and service icons remain close-detail evidence.

`IMG_3751.webp` is the full-site composition source. It establishes a single
continuous festival-ground silhouette behind the named territories, with the
north/east Anara â†’ Thrutopia â†’ Copperwood sequence, the central Grand
Central â†’ Oldtown hand-off, long Hilltop, and the southern Quantum/Lion's Den
relationship. `IMG_3735.webp` through `IMG_3739.webp` refine the north/east
parent edges; `IMG_3747.webp` and `IMG_3748.webp` refine the southern ones.
This permits only the shared ground and parent-boundary work: it does not
permit new streets, venues, stalls, trees, facilities, gates, or parking.

## Close-detail and delivery boundary

`IMG_3737.webp` permits connected Grand Central and Oldtown frontage groups;
`IMG_3739.webp`, `IMG_3738.webp`, and `IMG_3735.webp` permit the distinct
Tangled Roots/Copperwood/Thrutopia/Anara compound forms; `IMG_3747.webp` and
`IMG_3748.webp` permit the Tribe of Frog/Quantum/Lion's Den close-stage forms.
These are grouped frontages and stage-adjacent massing only, never a claim to
individual stall, food, toilet, water, gate, parking, or utility placement.

For Oldtown specifically, `IMG_3737.webp` and `findings_vidCD.md` require two
slender connected red-route lane groups on dark ground. Do not restore a broad
solid court as a surrogate for that town detail; only compact, irregular,
lane-side frontage groups are admissible.

`findings_vidCD.md` frames `vidD f_0058`, `vidD f_0059`, and `vidD f_0067`
permit the Full Moon Ballroom's pale marquee silhouette and its named local
path chain inside Copperwood. The chain must be limited to The Hide Out,
Silver Swan/Topsy Turvy, Full Moon, Velvet Rope, and the Foggers Mill branch;
it does not establish individual stalls or additional nearby landmarks.

`IMG_3735.webp` permits Anara's asymmetric pale clearing, upper/eastern title
anchor, round grey communal court, and stepped magenta stage form. Its
documented approach stays within the clearing and must not cross the court.
Temple Valley Camping remains a separate lower/south-eastern field: the image
does not establish a public connection into it or any further Anara venue,
facility, gate, stall, or woodland path.

The evidence map's stylesheet is also a runtime asset. Its URL must be
versioned with each release and CSS must remain network-first in the service
worker; otherwise a current map script can retain a stale visual treatment or
retired legend from an earlier cache.

The entry camera must remain below the close-detail label threshold. The
opening view is for the `IMG_3751.webp` territory order and main movement
spine; a small, intentional zoom into a district reveals the complete
source-backed venue-chip tier. This is a visual hierarchy rule, never a reason
to move a label or alter its evidence-supported geometry.

## Required verification

Run `node scripts/map-preflight.mjs` for every map change. It includes
`scripts/assert-evidence-map-boundary.mjs`, which fails if a legacy geometry,
MapLibre source, or marker producer becomes active again. Then compare a fresh
entry view and a close view with the cited official material before merge.
