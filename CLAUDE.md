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
