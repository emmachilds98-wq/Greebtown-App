# Greebtown map authoring system

This directory is the long-lived home for editable map geometry. It is deliberately separate from the runtime renderer so map facts can be reviewed, validated, and changed without hunting through rendering code.

## Layout

- `data/map-document.json` — canonical editable map document.
- `data/change-history.json` — append-only authored change record.
- `schemas/map-document.schema.json` — machine-readable contract for the document.
- `editor/` — static developer editor; open `editor/index.html` through the site or a local static server.
- `assets/` — map-specific image, sprite, and texture assets.
- `documentation/` — renderer migration notes and editor-facing conventions.

Run `node scripts/validate-map-document.mjs` before committing map data. The editor validates before it exports, but the command is the source of truth for automated checks.

The initial document is an intentionally small, representative seed. The existing application map remains the live renderer while its present hard-coded map arrays are migrated into this document in audited batches. Do not duplicate or silently override live locations during that migration.
