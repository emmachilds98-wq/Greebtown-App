# Map rebuild evidence intake

Use this file when adding official material for the rebuild. It keeps evidence
separate from implementation guesses, so the next map pass can be traced back
to what was actually visible in the official app.

## What to add

- Put an unedited official-app screenshot in `screenshots/`, retaining its
  original filename where possible.
- For a video, keep the original outside the repository if it is large, but
  add selected stills and a short findings note that identifies the video and
  frame/time range.
- Do not add screenshots of this Greebtown app as map evidence.
- Do not add a replacement coordinate list. The rebuild will trace relative
  placement and silhouettes from the official material.

## Entry template

Append one entry for each useful screenshot, still, or coherent video segment:

```md
### `filename.png` / video name at 00:00

- Official-app check: visible Mapbox/search/category UI, or another reason it
  is independently official.
- View: full-site / north / central town / east side / close-up.
- Places visible: names that can be read in this frame.
- Spatial readings: only visible relations, for example “A is east of B” or
  “the long edge of C faces D”. Do not write derived coordinates.
- Shape readings: silhouette, boundary, road/path direction, and scale clues.
- Confidence: high / medium / low, with the reason.
- Conflicts or uncertainty: what this evidence does not settle.
```

## Minimum evidence before drawing a region

1. One official full-site reference that establishes the surrounding areas.
2. One official close-up or second independent view for the region itself.
3. A written entry above identifying the source and the observed spatial
   relations.

If those are not available, leave the region blank. A blank area is safer than
a convincing-looking guess at festival time.

## Rebuild order

1. Site edge and large territory silhouettes.
2. Major district order, adjacency, and road/path spine.
3. A complete connected district cluster at a time.
4. Only then, close-zoom structures and non-essential detail.

Every implementation change must point back to the relevant entry above and
must not use existing map-system data as a positioning shortcut.
