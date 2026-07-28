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
