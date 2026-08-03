# Renderer migration plan

The existing MapLibre scene in `js/app.js` remains production authority until each collection is migrated. This avoids a broad rewrite and makes each move reviewable.

For each batch:

1. Extract one complete semantic collection (for example, gates or amenities) into `map-document.json` with stable IDs.
2. Add one adapter in the renderer that reads that collection. Do not retain a second hard-coded rendering path after the adapter ships.
3. Compare the old and new rendered positions visually and run the map validator.
4. Record the migration in the change history and remove only the equivalent legacy data.

Gates, amenities and the complete audited stage-position collection are now migrated. Next, move the remaining small point features, then structures, followed by paths/boundaries once the schema supports point sequences. Districts and generated terrain require a separate proposed schema revision because their current renderer geometry is procedural.
