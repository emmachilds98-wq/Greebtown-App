# Greebtown map authoring system

This directory is the long-lived home for editable map geometry. It is deliberately separate from the runtime renderer so map facts can be reviewed, validated, and changed without hunting through rendering code.

## Layout

The reviewed small-venue layer lives in `data/small-venue-layout.json`.
It describes named stalls, workshops and micro venues visible in official
detail references. Each footprint resolves through a matching runtime place,
so a later reference-layout move carries it with the appropriate cluster.

- `data/map-document.json` — canonical editable map document.
- `data/change-history.json` — append-only authored change record.
- `schemas/map-document.schema.json` — machine-readable contract for the document.
- `editor/` — static developer editor; open `editor/index.html` through the site or a local static server.
- `assets/` — map-specific image, sprite, and texture assets.
- `documentation/` — renderer migration notes and editor-facing conventions.

Edit `data/map-document.json`, then run `node scripts/build-map-data.mjs` and `node scripts/validate-map-document.mjs` before committing map data. `data/map-data.js` is generated for the browser and must never be hand-edited. The editor validates before it exports, but the command is the source of truth for automated checks.

The initial document is an intentionally small, representative seed. The existing application map remains the live renderer while its present hard-coded map arrays are migrated into this document in audited batches. Do not duplicate or silently override live locations during that migration.

When changing `small-venue-layout.json`, run `node scripts/validate-small-venue-layout.mjs` and then `node scripts/build-map-data.mjs`. Use only `stall`, `round`, or `yard` footprints backed by an official-detail or official-overview reference. Keep generic facilities out of this layer: it is for the coherent illustrated street layout, not an amenity marker carpet.
