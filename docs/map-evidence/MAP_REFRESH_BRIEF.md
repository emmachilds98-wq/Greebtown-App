# Map refresh brief

## Non-negotiable rule

Do not reuse, transform, average, or "correct" the legacy map coordinates.
They are implementation history, not spatial evidence.

The active renderer must return only the evidence-only map model. Do not add a
legacy source, marker group, category filter, zoom-control rail, or fallback
geometry back into that render path. If an old-looking artefact appears, remove
the active producer; do not hide it beneath another visual layer.

## Allowed evidence

Use independent official-app material in this folder only. The primary
whole-site composition reference is `IMG_3670.png`; official close-ups and
video findings may refine a connected area after they agree with that view.
Never use a Greebtown screenshot to validate Greebtown.

Before a new region is drawn, log the supporting official material using
`REBUILD_INTAKE.md`. That record must describe visible relationships and
silhouettes, not a derived coordinate set.

## Required refresh workflow

The active map was reset to a blank baseline on 10 Aug 2026. Its only retained
visual is the neutral road/background canvas. No previous territory, label,
route, marker, MapLibre control, or attribution element is approved for
carry-over.

1. Trace the full-site territory order and large silhouettes from the official
   overview before placing labels or venue detail.
2. Rebuild one connected cluster at a time from that tracing; do not retain an
   old neighbouring marker merely because it is convenient.
3. Introduce a new documented render layout rather than adding a runtime
   offset, coordinate transform, or compatibility override to the old one.
4. Render a before/after comparison at the entry zoom and at one close zoom.
5. Keep the legacy layout quarantined until the replacement is visually
   accepted; passing a validator alone is insufficient.

## Visual acceptance criteria

- The entry view reads as distinct territories, not scattered circular islands.
- Grand Central, Oldtown, Copperwood, Thrutopia, Hilltop and Lion's Den follow
  the official overview's visible order and spacing.
- Hilltop is a broad field silhouette, not a generic vertical patch.
- Detail appears at normal reading zoom without exposing a wall of unrelated
  markers or anonymous building rectangles.
