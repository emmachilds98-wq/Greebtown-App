# Boomtown Companion 2026

A self-contained, installable, offline-first festival companion — lineup, schedule planner, map, discoveries log, and guide. Once installed, it works with **zero signal** for the whole festival.

Everything you save (schedule, discoveries, hidden-venue log, notes) is stored only in each person's own browser (`localStorage`) — nothing is uploaded anywhere.

---

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

### Notes for the technically curious
- This is a pure static site — no build step, no server, no backend. Just HTML/CSS/JS + a service worker.
- The service worker (`service-worker.js`) precaches the app shell on install and serves it cache-first while offline, and network-first (with a cache fallback) for the page itself so updates are picked up quickly when online.
- All existing functionality, styling, and local-storage behavior from the original single-file version has been preserved exactly — the file was only split into separate `css/`, `js/`, and `index.html` files so the browser can cache each piece individually for offline use.
