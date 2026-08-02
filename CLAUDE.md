# Rules for this repo

## Load-order / temporal-dead-zone (TDZ) safety in js/app.js

`js/app.js` is one big script, executed top to bottom, and several
features run code immediately at load time (e.g. `renderHomeSyncStatus()`,
`autoSyncNow("on open")`, the pull-to-refresh wiring). That means any
`const`/`let` declared further down the file can be read by load-time
code before its own declaration line has run — which throws
`ReferenceError: Cannot access 'X' before initialization` (a temporal
dead zone / TDZ error), not a "not defined" error, so it's easy to miss
in review.

We've hit this twice already (`STATUS_STALE_MS` and `_firestoreDb`).

**Rule:** before adding or moving a module-level `const`/`let` in
`js/app.js`, check whether anything that runs at load time (anything
invoked at the top level of the file, not just inside an event handler)
can reach it — directly or through a function call chain. If so, declare
it near the top of the file, above the load-time call sites, not next to
the feature section it "belongs" to. A short comment at the declaration
explaining why it lives up there (see `FIREBASE_CONFIG`/`_firestoreDb`/
`getFirestoreDb` at the top of the file) is expected — don't silently
relocate it.

When in doubt, run `node --check js/app.js` after any reordering — it
catches syntax errors but *not* TDZ bugs, so also trace the actual
call path from every top-level (unindented) function call in the file
to confirm it can't reach a not-yet-declared `const`/`let`.

## Publishing / shipping a fix

Before telling the user a fix is ready to test:
1. `node --check js/app.js` must pass.
2. Bump `APP_CACHE_VERSION` and `APP_BUILD_TIME` at the top of
   `js/app.js`, and `CACHE_VERSION` in `service-worker.js`, so the
   in-app "update available" pill fires and users actually get the new
   code instead of a cached copy.
   `APP_BUILD_TIME` is a UTC (`Z`-suffixed) timestamp that the pill
   converts to the viewer's own local time — get the real current UTC
   time (e.g. `date -u`) before setting it, never hand-guess or
   increment from the previous value. A guessed timestamp that's ahead
   of real UTC shows up to a UK viewer as *more than* an hour ahead
   (their local BST offset stacked on top of the guess error) — this
   has already happened once.
3. Grep the diff's changed identifiers for any other load-time call
   site that reaches them, per the TDZ rule above.

## Incident: direct commits to `emmachilds98-wq-patch-2` broke the update pill (2 Aug 2026)

A run of direct pushes to this repo's deployed branch — bypassing PRs —
left the live site in a genuinely broken state for a while:

- `js/app.js`'s `APP_CACHE_VERSION` (`v279`) and `service-worker.js`'s
  `CACHE_VERSION` (`v284`) drifted out of sync across several commits,
  because different fixes bumped one file without the other.
- Someone hit a symptom of that drift (the pill looked stuck/looping)
  and "fixed" it by having `js/pwa-register.js` monkey-patch
  `checkForStaleCopy` to always return `false` — permanently disabling
  the update-detection feature for everyone, instead of fixing the
  actual cause (the version drift above).
- A second hack in the same file force-overwrote the pill's text with a
  hardcoded string on a timer, fighting the real `renderBuildStatusPill`
  logic.
- A third block in the same file silently overwrote specific entries in
  `js/app.js`'s own `locations` array (Grand Central, Oldtown, Hydro XL,
  etc.) with different hardcoded coordinates at runtime — directly
  undoing map position fixes that had already been carefully re-derived
  and merged elsewhere, with no comment explaining why or citing evidence.
- The same GPS-name-matching logic existed in two places at once
  (`js/map-matching.js` as its own file, and duplicated inline in
  `js/pwa-register.js` with a shorter, drifted-out-of-sync alias list) —
  neither was the "real" version, so a fix to one silently didn't apply
  to the other.

**Rules going forward, for any human or agent working on this repo:**

1. **Never commit directly to `emmachilds98-wq-patch-2`** (or whatever
   branch GitHub Pages deploys from). Always work on a feature branch and
   open a PR, even for "quick" fixes — especially for urgent ones, since
   panic-fixes under pressure are exactly how the incident above happened.
2. **One source of truth per concern.** Map positions live in `js/app.js`'s
   own data arrays (`locations`, `otherStages`/`minorStagePositions`,
   `thingsToFind`, `landmarks`, `campLabels`, `gates`) — full stop. Never
   add a second file or a runtime patch that overwrites those values
   after the fact "to fix" something; edit the array itself, with a
   comment explaining the evidence for the change.
3. **`APP_CACHE_VERSION` (`js/app.js`) and `CACHE_VERSION`
   (`service-worker.js`) move together, in the same commit, every time.**
   Never bump one without the other — that mismatch is what caused the
   pill to break in the first place. `node --check` won't catch this;
   grep both files' current version strings and confirm they match
   before shipping.
4. **If something looks like it's "looping" or "stuck," find the root
   cause before patching.** A monkey-patch that disables a feature
   ("stop the loop" by making the check always return `false`) is almost
   never the fix — it just hides the symptom and silently removes the
   feature for everyone from then on. In this incident the real cause
   was rule 3 being violated; the correct fix was re-syncing the two
   version strings, not disabling `checkForStaleCopy`.
5. **`js/pwa-register.js` should only ever contain service-worker
   registration + update-reload wiring** (see the file itself). If you're
   tempted to add a block to it to "force" something (a cache clear, a
   pill override, a data patch), that's a strong signal the fix belongs
   in `js/app.js` proper instead, reviewed like any other change — not
   bolted onto the file that happens to load last.
6. **No duplicate implementations of the same feature across files.**
   If you're improving `realStageMatch` (or anything else), edit it in
   `js/app.js` where it's defined. Don't add a second file that
   redefines it at runtime "so it loads after app.js without an
   index.html change" — that's a sign the real fix (updating the
   function in place) was skipped for a shortcut, and the two copies
   will silently drift apart, which is exactly what happened here.

## Incident: `service-worker.js` corrupted into raw diff text by direct commits (2 Aug 2026, later same day)

Rule 1 above got violated again, within hours, in a new and worse way.
A run of direct commits to `emmachilds98-wq-patch-2` — again bypassing
PRs — did two separate kinds of damage:

- **A merge landed with `js/app.js` reduced to the single word
  `PLACEHOLDER`.** Whatever branch/session produced that merge had
  already truncated its own copy of `js/app.js` to a placeholder stub
  before merging — meaning the file was never actually verified as
  complete/valid before being merged into the deploy branch. This alone
  would break the entire app for every live user.
- **Two direct commits titled "Update service-worker.js" each replaced
  the file's content with a raw unified-diff fragment** — literal
  `+`/`-` hunk lines (e.g. `+  self.skipWaiting();`, `-    )`) pasted in
  as if they *were* the file, instead of applying the change and saving
  the real resulting text. The live file was left at ~23 lines,
  referencing an undefined `APP_FILES` array, missing the Firebase
  messaging setup, and with no `fetch` handler at all — not valid
  enough to reliably register as a service worker. A service worker
  that can't register can never deliver an update to anyone, regardless
  of what `CACHE_VERSION` says — this was likely the real cause of a
  "no recent update / refresh fails" report that same session.

Both a human pasting a `git diff`/PR-review view directly into a file,
and an agent mistaking a diff-style tool result for literal file
content, produce exactly this failure — the rule below is written to
catch either.

**Rules going forward, in addition to 1–6 above:**

7. **Never write a diff/patch fragment as a file's content.** A valid
   source file never contains bare `+`/`-`-prefixed hunk lines, `@@ ...
   @@` markers, or `<<<<<<<`/`=======`/`>>>>>>>` conflict markers. If
   you're about to save something that looks like that, you have a diff
   in hand, not a file — apply it properly (edit the real file in
   place) and save the *resulting* content, never the diff itself.
8. **After editing any file, read back what actually landed on disk
   before committing it** — don't trust that an edit "must have worked."
   For JS specifically, `node --check <file>` (or, for a service worker
   using `self`/`importScripts`, parsing it with `new Function(source)`)
   catches a corrupted file immediately and costs nothing. This incident
   would have been caught instantly by either check; neither was run
   before committing.
9. **A PR merge is not a substitute for verifying the file you're
   merging.** The `PLACEHOLDER` truncation above went through an actual
   PR (not a direct commit) — the process rule alone didn't save it,
   because nobody checked that the file being merged still had real
   content. Before merging any PR that touches `js/app.js` or
   `service-worker.js`, confirm both files are still full-length and
   pass the checks in rule 8 — a green PR review still needs this, not
   just direct commits.
