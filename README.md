# Boomtown Companion 2026

A self-contained, installable, offline-first festival companion — lineup, schedule planner, map, discoveries log, and guide. Once installed, it works with **zero signal** for the whole festival.

Everything you save (schedule, discoveries, hidden-venue log, notes) is stored only in each person's own browser (`localStorage`) — nothing is uploaded anywhere.

---

## 0. Before you upload — a data-safety check

This project has one thing you must get right when uploading: **`index.html` must never contain real saved data.**

Near the top of `index.html` there's a line like:
```html
<script>window.__boomtownSavedData={};</script>
```
This must stay exactly `{}`. It exists so that when *you personally* use one of the in-app "Download my personal backup" / "Download shareable group copy" buttons, that downloaded file can carry saved data with it. But if a copy of either downloaded file — or any `index.html` with real values in that line — ever gets uploaded to the shared repo, **every visitor's browser will load that saved data as their own starting defaults.** Always upload the original `index.html` from this project folder, never a downloaded snapshot/backup file, and never one you were testing locally with real data already saved.

Recommended: add a `.gitignore` with at least:
```
*-ours.html
*-group.html
*.bak
.DS_Store
```
so an accidentally-downloaded snapshot sitting in the project folder can't get swept up by `git add .`.

If you've already pushed a version where that line had real data in it, treat it as exposed: replace it going forward (bump `CACHE_VERSION` in `service-worker.js` too, so everyone picks up the fix), and be aware the old values remain visible in the repo's Git history unless you rewrite it.

## 1. Upload the project to GitHub

1. Create a new **public** repository on GitHub (e.g. `boomtown-2026`).
2. Upload every file and folder from this project, keeping the folder structure exactly as-is:
   ```
   /
   ├── index.html
   ├── manifest.json
   ├── service-worker.js
   ├── css/
   │   └── style.css
   ├── js/
   │   ├── app.js
   │   └── pwa-register.js
   ├── icons/
   │   └── (all icon PNGs)
   └── README.md
   ```
   Easiest way: on the repo page, click **Add file → Upload files**, drag the whole folder's contents in, and commit.
   (Or, if you use git locally: `git init`, `git add .`, `git commit -m "Initial commit"`, `git remote add origin <your-repo-url>`, `git push -u origin main`.)

## 2. Enable GitHub Pages

1. In your repository, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Pick the branch (usually `main`) and the folder **`/ (root)`**.
4. Click **Save**. GitHub will give you a URL like:
   ```
   https://yourusername.github.io/boomtown-2026/
   ```
   It can take a minute or two to go live the first time.
5. Share that URL with your friends — that's the only link they need.

## 3. Updating the app later

1. Edit any file (e.g. `js/app.js` or `css/style.css`) and push the change to the same branch/repo.
2. Open `service-worker.js` and bump the version number at the top:
   ```js
   const CACHE_VERSION = "v1";   // change to "v2", "v3", etc.
   ```
   This step matters — it's what tells everyone's installed copy that a new version exists.
3. GitHub Pages redeploys automatically (usually within a minute).
4. The next time anyone opens the installed app **with a signal**, it silently downloads the update in the background and reloads once with the new version — no reinstall needed. If they're fully offline, they keep using the last version they downloaded until they get signal again.

## 4. Installing on iPhone (Safari)

1. Open the GitHub Pages URL in **Safari** (must be Safari, not Chrome, for this to work on iOS).
2. Tap the **Share** icon (square with an arrow pointing up).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add** in the top right.
5. A "Boomtown 26" icon appears on the Home Screen. Launching it opens the app full-screen, like a normal app — no browser bars.

## 5. Installing on Android (Chrome)

1. Open the GitHub Pages URL in **Chrome**.
2. Tap the **⋮** menu (top right).
3. Tap **Install app** (or **Add to Home screen**).
4. Confirm by tapping **Install**.
5. The app appears in the app drawer/Home Screen and launches full-screen.

## 6. Using it offline at the festival

The first time the app is opened (with signal, e.g. before you leave for the site), it downloads and caches everything it needs — the whole app shell, styling, code, and all icons. After that first visit, it will keep working with **no internet connection at all**, including:

- Browsing artists, schedule, map, and guide
- Saving your plan, meeting point, notes, and discoveries (stored on-device)
- Reopening the app across multiple days of the festival

Links that go out to Instagram, the official Boomtown site, app stores, etc. still need signal to open, since those are external pages — everything else in the companion itself works offline.

---

## 7. Cloud sync — one-time Firestore security rules

The Discover screen's Sync card has a "Sync now" button (Firebase Firestore, no login) alongside the original manual copy/paste code, which still works offline as a fallback. The Firebase config in `js/app.js` is a public client key by design — the actual protection is the Firestore **security rules**, which must be set once in the Firebase console (this can't be done from the repo):

1. Firebase console → your project → **Build → Firestore Database → Rules** tab.
2. Replace the default rules with:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /rooms/{roomCode}/members/{memberName} {
         allow read: if true;
         allow write: if request.resource.data.keys().hasOnly([
           'v','from','clues','characterNotes','theories','hiddenVenues',
           'involvedDone','discoveries','customSocials','quotes','sightings',
           'customLandmarks','schedule','bingo','character','updatedAt'
         ]) && request.resource.data.size() < 900000;
       }
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```
3. Click **Publish**.

This limits reads/writes to the exact `rooms/{roomCode}/members/{name}` shape the app uses and blocks everything else in the database — but with no login, anyone who knows (or guesses) a room code can read and write to it. There's no per-user auth in this model, so **pick a room code that isn't guessable** (a short phrase, not "team1" or "boomtown"), the same way you'd treat a shared Wi-Fi password.

This deployment's room code is pre-set in `js/app.js` (`const GROUP_ROOM_CODE`), auto-filled and saved for everyone so nobody has to type or agree one — the Sync card's room code field just shows it. If you fork this for a different group, change that one constant to a new unguessable code.

## 8. Backup history

Alongside the live sync doc, each device's own data is also snapshotted automatically in the background (at most once every 20 minutes, and only when something's actually changed) to `rooms/medway-massive/members/{deviceId}/backups/{takenAt}`, with the newest 12 kept per device and older ones pruned. This is a free, code-only, no-billing-plan-change backup — it rides on the same client writes as normal sync, no Cloud Functions or Cloud Scheduler involved.

If a sync ever wipes or corrupts a device's own data (accidental clear, a bad merge, more than one bad sync in a row), open **Discover → 🗄️ Backup history**, tap **Refresh list**, and restore an earlier snapshot. Restoring only ever replaces that one device's own data and re-pushes it to the cloud — it never reaches into or removes anything already synced from a teammate's device.

Want a specific moment saved right now instead of waiting on the 20-minute throttle — before testing something risky, say? Tap **Back up now** in that same card. It bypasses the throttle and writes the snapshot with `pinned: true`, which the automatic pruning above always skips — a pinned backup is kept indefinitely rather than eventually rotating out with the ordinary ones.

## 9. Keeping the lineup auto-synced from Clashfinder

Boomtown doesn't publish a public API for their official app, so there's nothing to poll directly. `.github/workflows/boomtown-lineup-sync.yml` instead pulls the same Boomtown timetable from [Clashfinder](https://clashfinder.com), which does have a documented API, and regenerates the `artists` array in `js/app.js` (between the `AUTO-GENERATED:LINEUP` markers) whenever it changes — daily year-round, hourly during festival week (12–16 Aug 2026).

**One-time setup, before this can run:**

1. Create a free account at [clashfinder.com](https://clashfinder.com) if you don't have one.
2. Get your API private key — see [clashfinder.com/pages/api](https://clashfinder.com/pages/api/) (you'll need to be logged in; the page explains how the key is generated from your account).
3. In this repo's GitHub settings → **Secrets and variables → Actions**, add:
   - `CLASHFINDER_USERNAME` (secret) — your Clashfinder account username.
   - `CLASHFINDER_PRIVATE_KEY` (secret) — your Clashfinder private key.
   - `CLASHFINDER_SLUG` (variable, optional) — the clashfinder's id, from its URL (`https://clashfinder.com/s/<slug>/`). Defaults to `boomtown26` if unset.
4. That's it — the workflow runs on schedule from then on, or trigger it manually from the Actions tab (**Run workflow**) to test it immediately.

It commits straight to `emmachilds98-wq-patch-2` (this project's live branch) only when the fetched lineup actually differs from what's currently in `js/app.js`, and only after `node --check js/app.js` passes — a failed check fails the workflow run instead of pushing a broken file. Each real change also bumps `APP_CACHE_VERSION`/`CACHE_VERSION` and `APP_BUILD_TIME`, so everyone's app shows the "update available" pill.

Saved personal/group schedules aren't disturbed by a wholesale lineup refresh — `reconcileSavedArtists()` in `js/app.js` already re-matches every saved artist by name against the current `artists` list on load, and anything you've added yourself through the app's own "custom artist" feature lives in a separate store key untouched by this sync.

**Going further — the real official app's data:** Clashfinder is a community-maintained mirror, not Boomtown's own feed, so it can occasionally lag or diverge from the official app. If you want to sync from the official app's actual data instead (or as well), that needs its private API traffic captured from your own phone (e.g. with [HTTP Toolkit](https://httptoolkit.com/) or mitmproxy while using the app), since it isn't publicly documented anywhere — happy to help wire that in as a second source once you've got a capture.

**This adds a new allowed field to `firestore.rules`** (`pinned` on a backup doc) — if the rules were already published for the original Backup history feature, they need **re-publishing again** for this specific change, or "Back up now" will fail with `permission-denied` (harmless — same as before, ordinary sync and automatic backups are unaffected either way).

**One-time setup step:** the rules above (section 7) only cover the `members` documents themselves. This feature adds a `backups` subcollection under each member doc, and `firestore.rules` in this repo has been updated to allow it — but like the rest of `firestore.rules`, that file isn't automatically applied by pushing to GitHub. Re-publish it once in the Firebase console (**Build → Firestore Database → Rules**, paste the current contents of `firestore.rules`, **Publish**) or backups will silently fail with a `permission-denied` error (harmless — sync itself still works either way, you just won't get backup history until the rules are published).

## 10. Local group chat

A chat button (💬, top right of every screen) opens group and 1:1 messaging for up to ~10 people — same no-login, room-code-secured Firestore project as the rest of sync, in two new collections (`chatMessages`, `chatPresence`) alongside the existing `members` one. Unlike the rest of sync (which pulls on open, every 2 minutes, and on pull-to-refresh), chat is live — messages, the online dot, and read receipts update in real time via Firestore listeners while the app is open, and queue locally to send the moment signal returns if you're offline.

- **Online status** is a heartbeat, not a login session — the app pings "I'm here" roughly every 90 seconds while a device has it open, and a friend shows as online for about 2.5 minutes after their last one.
- **Location** shown next to each contact is the same manual "Where's everyone?" status from Discover (see section above) — there's now also an opt-in GPS toggle there, off by default, that auto-updates it every few minutes off your device's own location instead of you picking a spot each time.
- **Read receipts** are per-thread, stored on your own presence doc, not per-message — cheap on quota, and consistent with everything else in this app: there's no real privacy boundary here. A "DM" isn't shown to anyone else in the *app's UI*, but it isn't encrypted or access-controlled beyond the same room code that already guards everything else — anyone who has that code could read the raw Firestore data if they went looking. Fine among a small trusted group; worth knowing.

**One-time setup step, same as sections 7–9 above:** `firestore.rules` in this repo now includes rules for `chatMessages` and `chatPresence`, but that file only takes effect once it's re-published in the Firebase console (**Build → Firestore Database → Rules**, paste the current contents of `firestore.rules`, **Publish**). Until that's done, the chat panel will open fine but sending/receiving will fail with a `permission-denied` error — harmless, and everything else in the app (schedule, map, existing sync) is unaffected either way.

---

### Notes for the technically curious
- This is a pure static site — no build step, no server, no backend. Just HTML/CSS/JS + a service worker.
- The service worker (`service-worker.js`) precaches the app shell on install and serves it cache-first while offline, and network-first (with a cache fallback) for the page itself so updates are picked up quickly when online.
- All existing functionality, styling, and local-storage behavior from the original single-file version has been preserved exactly — the file was only split into separate `css/`, `js/`, and `index.html` files so the browser can cache each piece individually for offline use.
