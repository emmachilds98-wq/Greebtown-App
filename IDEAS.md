# Ideas for later sessions

Not committed to, not scoped — just parked here so they don't get lost.

## Play preview snippets of artists

Let people hear a clip of an act straight from the Lineup screen (list view, timeline
detail modal, or both) instead of just reading a bio/genre line.

- **Spotify** — has ~20-second preview clips available for most tracks via their API,
  usually the best first source to try for a given artist.
- **SoundCloud** — many DJs/producers on the lineup post full sets/mixes there directly
  (this is already the primary bio-research source used this session — see the sourcing
  notes throughout `js/artist-bios.js`), so it's a natural fallback where Spotify has
  nothing.
- **YouTube** — official videos, live sets, boiler-room-style uploads; good fallback for
  bands/live acts that don't have strong Spotify/SoundCloud presence.
- Other socials (Instagram, Bandcamp, etc.) as a last resort for anyone with genuinely no
  footprint on the above three.

### Things to work out before building this
- Licensing/embedding: each platform's embed player has different terms — check what's
  actually allowed for an offline-first PWA like this one (embeds generally need network
  regardless, so this feature would only work with signal, unlike the rest of the app).
  This means a "no signal? here's why this doesn't work" fallback matters.
  Would need graceful degradation ("no preview available") for the many acts with no
  match on any platform — expect that to be common for hyper-local/hidden-venue acts.
- Matching: names in the lineup often don't map 1:1 to a searchable artist (B2B sets,
  themed party names, one-off collabs) — would need the same kind of manual verification
  rigor already used for the bios, not automated guessing, to avoid embedding the wrong
  artist's music under someone else's name.
- Where in the UI: probably a small ▶ button next to the bio in the timeline detail modal
  (`showTimelineDetailModal()` in `js/app.js`) and/or the Lineup list view
  (`scheduleItemHTML()`/artist card rendering) — needs a design pass, not just bolted on.

## "Must see" — a second tier above starring

A star already means "saved to my plan." Add a second, stronger tier for the acts you
really don't want to miss:

- Starring an act as normal still works exactly as now.
- The first time (or every time?) someone stars an act, show a small prompt/tooltip near
  the star along the lines of "Hold to make this a must-see ★" — teaching the gesture
  without needing a written explainer elsewhere.
- Holding (long-press) the star upgrades that act to "must-see" / "super star" status.
- Colour language:
  - Normal starred (current behaviour) → light blue, a new colour not currently in the
    app's palette (`--accent-teal` is closer to green-teal — would need an actual
    light-blue token, or confirm whether teal itself counts as "light blue" here).
  - Must-see (upgraded) → the existing `--accent-amber` orange, i.e. take over the colour
    that already means "highlighted/important" elsewhere in the app.
- Where this needs to land in the data model: `schedule` entries (Store.get("schedule"))
  would need a new field, e.g. `mustSee: true`, alongside the existing snapshot fields —
  check this doesn't collide with `reconcileSavedArtists()` (js/app.js) which already
  re-syncs specific fields on load, and with the sync payload (`buildSyncPayload()`) if
  must-see status should also be visible to teammates via their read-only tab.
- Needs a long-press implementation (touch: touchstart+timer+touchend/touchmove-cancel,
  same general shape as the pull-to-refresh gesture already in this file) — mouse/desktop
  would need an equivalent (e.g. right-click, or just skip long-press desktop-side and use
  a secondary tap-and-hold-adjacent affordance).
- Would touch: the star buttons in the Lineup list view, the timeline detail modal's
  `.star-toggle-lg`, and the Plan screen's saved-item list — all three currently render a
  single ★/☆ state and would need a third visual state (must-see) layered in.
