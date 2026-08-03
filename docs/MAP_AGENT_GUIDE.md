# Greebtown map agent guide

Read this before editing the festival map. Map accuracy is user-trust and safety critical: do not invent a precise placement when the evidence only supports an approximate area.

## Source of truth and migration status

`map-system/data/map-document.json` is the canonical authoring document for the new map system. Its objects are the only map geometry an agent should add or edit for the new system.

The legacy renderer in `js/app.js` is still being migrated in verified batches. Until a legacy object has a corresponding `map-document.json` record and a renderer migration entry, do not make a second competing copy or use a runtime override. The initial document is a seed, not a claim that all legacy geometry has already migrated.

## Coordinates

The authoring document uses `schematic-percent-v1`:

- Origin is the top-left of the map.
- `x` increases east/right; `y` increases south/down.
- Both axes range from 0 to 100.
- `position` is the visual centre of an object.
- `dimensions.width` and `dimensions.height` use the same units.
- `transform.rotation` is clockwise degrees around the object centre.

The live app converts schematic positions to MapLibre latitude/longitude through its existing shared conversion. Do not add a second coordinate conversion in a new file.

## Where to change things

| Need | File |
| --- | --- |
| Object, position, dimensions, layer, metadata | `map-system/data/map-document.json` |
| Object and layer contract | `map-system/schemas/map-document.schema.json` |
| Map editor UI | `map-system/editor/` |
| Data validation | `scripts/validate-map-document.mjs` |
| Long-lived map assets | `map-system/assets/` |
| Existing live renderer during migration | `js/app.js` |

## Safe editing workflow

1. Find supporting evidence in `docs/map-evidence/`; record uncertainty in the object’s `metadata.notes`.
2. Make the smallest data-only change in `map-document.json`.
3. Preserve stable IDs. Use lowercase kebab case: `<type>-<descriptive-name>`.
4. Use an existing layer whenever possible. If adding a layer, give it a stable ID and a numeric `order` with room between neighbouring values.
5. Run `node scripts/build-map-data.mjs`, then `node scripts/validate-map-document.mjs`. Never hand-edit the generated `map-system/data/map-data.js` file.
6. Open `map-system/editor/index.html` through a static server or the deployed site, inspect the object placement, and export only after validation passes.
7. Add a concise, GMT timestamped entry to `map-system/data/change-history.json` for a reviewed change. Describe old value, new value, evidence, and actor.
8. If you change live app assets or renderer code, obey `AGENTS.md`: inspect for load-order/TDZ hazards and bump `APP_CACHE_VERSION` and `CACHE_VERSION` together in the same reviewed commit.

## Object schema

Every map object requires:

```json
{
  "id": "medical-east-camp",
  "type": "medical",
  "name": "Medical tent",
  "position": { "x": 55, "y": 65 },
  "dimensions": { "width": 4, "height": 3 },
  "transform": { "rotation": 0, "scale": 1 },
  "layer": "amenities",
  "asset": null,
  "metadata": { "description": "", "category": "", "accessibility": "", "notes": "" }
}
```

Supported `type` values are: `terrain`, `district`, `building`, `stage`, `vendor`, `toilet`, `medical`, `camping`, `entrance`, `exit`, `path`, `boundary`, `decoration`, and `hidden-location`.

Paths and boundaries currently use the common object envelope as a placeholder. Do not invent a custom point-list property ad hoc: extend the JSON schema, validator, editor, and renderer contract together in one focused change.

## Requests from a human

Translate a request such as “move the medical tent 50 pixels east” into the current map units only after confirming the viewport scale. The editor uses 0–100 map units, not browser pixels. State the conversion and update `position.x`; never modify coordinate data by guessing a pixel-to-map-unit ratio.

For reference-image reconstruction, work in evidence-backed clusters. Identify anchors first, then record each inferred relationship and uncertainty. A screenshot is not automatically surveyed geometry.

## Validation and review

The validator rejects duplicate IDs, missing layers, invalid object types, out-of-bounds coordinates, invalid dimensions/transforms, and bad asset paths. The editor additionally surfaces same-layer bounding-box overlaps as review warnings. An overlap is not always an error—stages can live inside districts—but it always deserves a human decision.

Never replace a source file with a diff fragment. Do not commit directly to `emmachilds98-wq-patch-2`; create a branch and open a reviewable PR.
