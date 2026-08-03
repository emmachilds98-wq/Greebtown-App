// ===============================
// STALE-COPY CHECK — a passive "Updated <date>" label alone isn't
// enough, since a stale cached page would show a stale timestamp too.
// This actively fetches the live service-worker.js with cache
// bypassed, compares its CACHE_VERSION against this page's own baked-in
// version, and if they differ, turns the header pill into a one-tap fix
// that clears every cache and service worker registration before
// reloading — a proper nuclear refresh, not just location.reload().
// Bump APP_CACHE_VERSION and APP_BUILD_TIME here to match
// service-worker.js's CACHE_VERSION every time it's bumped — the pill's
// "Updated" text is rendered from APP_BUILD_TIME below, in the viewer's
// own local time, so it's never a stale/guessed hand-typed string.
// ===============================
const APP_CACHE_VERSION = "v322";
const APP_BUILD_TIME = "2026-08-03T03:05:08Z";

// Loaded by map-system/data/map-data.js before this script. Map data is
// authored in map-system/data/map-document.json and compiled into that
// browser-safe global; do not recreate a second source in this file.
const MAP_SYSTEM_DOCUMENT = window.GREEBTOWN_MAP_DOCUMENT;

// Used by renderGroupInvites (defined much further down) — declared up
// here since updateNextEvent() (called at load time) reaches it via a
// call chain, same TDZ-safety reason as STATUS_STALE_MS/_firestoreDb.
let groupInvitesExpanded = false;
const GROUP_INVITES_CAP = 4;

// The fixed roster of expected names (see "WHO'S USING THIS DEVICE"
// further down for the actual picker UI) — moved all the way up here,
// not just near that section, because personColorFor() (see the PERSON
// IDENTITY COLOUR section further down) needs a stable index into this
// array for every known person's colour, and buildTimelineHTML() —
// reachable from renderSchedule()'s load-time call far below — can
// reach personColorFor() before that section would otherwise run.
const KNOWN_CONTRIBUTORS = ["Emma","Dave","Rob","Jack","Lewis","Dana","Rhea","Katelyn"];
// Collapsed by default — Group invites used to sit permanently full-
// height above Compare's own list, effectively hiding it. Starts
// collapsed to a one-line summary so Compare is visible without an
// extra tap, same TDZ-safety reason as groupInvitesExpanded above.
let groupInvitesCollapsed = true;

// Used by renderHomeContextBanner (defined much further down) — declared
// up here since that function runs at load time (its own top-level call,
// far below), same TDZ-safety reason as everything else in this cluster.
// No real background timer fires this reminder (see the LOCATION
// REMINDER section further down for why) — it's a plain elapsed-time
// check against myStatus.updatedAt, re-evaluated every time this banner
// re-renders (load, every 60s tick, and on visibilitychange).
const LOCATION_REMINDER_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 hours

// Used by the LOCAL CHAT feature (defined much further down, see its own
// section comment there for why everything else in that block is safe to
// keep local) — these three specifically have to live up here instead.
// Home's since-removed friend-activity feed used to call totalUnreadCount()
// -> allMyThreadIds()/unreadCountForThread() at load time, which touch
// CHAT_THREAD_GROUP, chatMessagesCache and chatPresenceCache — this bit
// Greebtown for real (ReferenceError on CHAT_THREAD_GROUP at load) before
// these were hoisted up here. Left here rather than moved back down: safe
// either way, and keeps the same trap from reopening if anything at load
// time starts reading unread-chat state again.
const CHAT_THREAD_GROUP = "group";
let chatMessagesCache = [];
let chatPresenceCache = {}; // deviceId -> {displayName, lastActiveAt, reads}

(function renderBuildStatusPill(){
  const pill = document.getElementById("buildStatusPill");
  if(!pill) return;
  const d = new Date(APP_BUILD_TIME);
  const time = d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  const date = d.toLocaleDateString([], { day:"numeric", month:"short" });
  pill.textContent = `Updated ${date}, ${time}`;
})();
// Clears every cache + service worker registration before reloading — a
// proper nuclear refresh, not just location.reload() (which a stale
// service worker could just re-serve from cache). Shared by the header
// pill's tap-to-fix and by pull-to-refresh below.
function forceAppRefresh(){
  const pill = document.getElementById("buildStatusPill");
  if(pill) pill.textContent = "Refreshing…";
  const cleanup = [];
  if("caches" in window) cleanup.push(caches.keys().then(keys=> Promise.all(keys.map(k=> caches.delete(k)))));
  if("serviceWorker" in navigator) cleanup.push(navigator.serviceWorker.getRegistrations().then(regs=> Promise.all(regs.map(r=> r.unregister()))));
  return Promise.all(cleanup).finally(()=> location.reload());
}
// Returns a promise resolving true if a newer version was found (and the
// header pill turned into a tap-to-refresh button) — pull-to-refresh
// uses that to decide whether to trigger forceAppRefresh() itself
// instead of waiting for a tap.
function checkForStaleCopy(){
  const pill = document.getElementById("buildStatusPill");
  if(!pill) return Promise.resolve(false);
  // Cache-bust with a query string, not just {cache:"no-store"} — that
  // header only bypasses the browser's HTTP cache, not this same-origin
  // request being intercepted by our OWN (old) service worker, which
  // cache-first-serves its own previously-cached copy of this exact file
  // and would otherwise always report "up to date" against itself.
  return fetch("./service-worker.js?_=" + Date.now(), { cache: "no-store" })
    .then(r=> r.text())
    .then(text=>{
      const m = text.match(/CACHE_VERSION\s*=\s*"(v\d+)"/);
      if(!m || m[1] === APP_CACHE_VERSION) return false;
      pill.textContent = "🔄 Update available — tap to refresh";
      pill.style.cursor = "pointer";
      pill.style.background = "rgba(226,131,106,.16)";
      pill.style.color = "var(--accent-red)";
      pill.style.borderColor = "rgba(226,131,106,.4)";
      pill.onclick = forceAppRefresh;
      return true;
    })
    .catch(()=> false); /* offline, or the request itself got served from a cache we can't bypass — leave the static label as-is */
}
checkForStaleCopy();

// ===============================
// CLOUD SYNC (Firebase init) — deliberately placed at the very top of
// this file, ahead of every other feature, because getFirestoreDb() can
// be reached by load-time code (auto-sync-on-open, room-code handling,
// etc.) below. FIREBASE_CONFIG/_firestoreDb/getFirestoreDb must be fully
// initialized before anything else in this file runs, or an early call
// hits _firestoreDb mid-TDZ and throws "Cannot access before
// initialization." See the full CLOUD SYNC feature comment further down
// this file, near where room codes are handled.
// ===============================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAgiBfNu3IpTCpumJQrYkFOh03VNFTWOVQ",
  authDomain: "greebtown.firebaseapp.com",
  projectId: "greebtown",
  storageBucket: "greebtown.firebasestorage.app",
  messagingSenderId: "944940862671",
  appId: "1:944940862671:web:f84ece4e66b052b4f97bba"
};

// Public VAPID key for Web Push (FCM) — generated in Firebase Console →
// Project settings → Cloud Messaging → Web configuration. This is the
// PUBLIC half of the key pair (safe to ship client-side, same as
// apiKey above); the private half never leaves Firebase/the Cloud
// Function. Grouped with FIREBASE_CONFIG up here for the same reason —
// registerPushToken() (further down) can in principle be reached early
// via the notifications toggle.
const FCM_VAPID_KEY = "BGUEw1DydjFpvFLR7XsG27rfs2SVhfPl194eXqjM4Rg84MfppgagOA-FsUbxPyuE6e-t-5H5tbKlrZAcjfviEH8";

let _firestoreDb = null;
function getFirestoreDb(){
  if(_firestoreDb) return _firestoreDb;
  if(typeof firebase === "undefined" || !firebase.initializeApp) return null;
  try{
    if(!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    _firestoreDb = firebase.firestore();
    // Persistent (IndexedDB-backed) offline cache, synchronized across
    // any tabs this app is open in at once — without this, Firestore's
    // cache is memory-only and a reload while offline loses anything
    // that hadn't already round-tripped to the server. Best-effort: a
    // browser without IndexedDB, or a `synchronizeTabs`-incompatible
    // multi-tab situation, just falls back to the same memory-only
    // behaviour this already had, so this never blocks sync working.
    _firestoreDb.enablePersistence({ synchronizeTabs: true }).catch(err=>{
      console.warn("Firestore offline persistence not enabled:", err && err.code);
    });
    return _firestoreDb;
  }catch(err){
    return null;
  }
}

// Snapshot-history backup config — declared here (not down by the rest of
// the backup code) for the same TDZ reason as FIREBASE_CONFIG/_firestoreDb
// above: pushToCloud() is reachable from autoSyncNow("on open") at the
// bottom of this file's load-time call chain, and pushToCloud() reads
// these two consts on every call.
//
// BACKUP_MIN_INTERVAL_MS throttles how often a new snapshot doc gets
// written, independent of how often auto-sync itself runs (every 3 min) —
// keeps this well inside Firestore's free (Spark) daily read/write quota
// for a small group. BACKUP_MAX_SNAPSHOTS caps how many old snapshots are
// kept per device (oldest pruned first), so storage stays bounded while
// still giving enough history to step back past more than one bad sync in
// a row.
const BACKUP_MIN_INTERVAL_MS = 20 * 60 * 1000;
const BACKUP_MAX_SNAPSHOTS = 12;

// ===============================
// PULL TO REFRESH — installed/standalone PWAs don't get the browser's
// own pull-to-refresh gesture (that's browser chrome, not something a
// full-screen "app" has), so this rebuilds it by hand: pulling down from
// the very top of the page checks for a newer app version first —
// auto-applying it via forceAppRefresh() if one's found, same as the
// header pill's tap-to-fix — and if the app's already current, runs the
// same push+pull cloud sync opening the app or "Sync now" does
// (autoSyncNow, defined later in this file — only called from inside an
// event handler here, well after the whole script has finished loading,
// so the forward reference is safe).
// Two visible pieces while dragging: <main> itself translates down with
// the finger (damped, capped) for the "screen pulls down" feel, and a
// small pill (#ptrIndicator, fixed position, defined in index.html/
// style.css) fades/scales in above it. The pill is fixed-position and a
// SIBLING of <main>, not a descendant — deliberately, since a CSS
// transform on an ancestor would make position:fixed descendants track
// that transform instead of the real viewport, breaking the pill's own
// "stay put near the top" positioning the moment <main> starts moving.
// The pill's resting state is fully hidden (opacity 0, tucked under the
// safe area) — an earlier version of this feature had a floating
// indicator that ended up as a stray sliver visible even at rest; this
// one only ever gets a non-zero opacity while a finger is actually
// dragging or a refresh is in flight.
// ===============================
(function setupPullToRefresh(){
  const THRESHOLD = 68;
  const MAX_PULL = 100; // content damps hard and caps here even if the finger keeps going, so it never feels like it's being dragged off-screen
  const hint = document.getElementById("ptrHint");
  const DEFAULT_TEXT = hint ? hint.textContent : "";
  const mainEl = document.querySelector("main");
  const indicator = document.getElementById("ptrIndicator");
  const indicatorText = indicator ? indicator.querySelector(".ptr-indicator-text") : null;
  let startY = null, pulling = false, refreshing = false, lastDist = 0;

  function atTop(){
    return (document.scrollingElement || document.documentElement).scrollTop <= 0;
  }

  function setIndicatorText(text){ if(indicatorText) indicatorText.textContent = text; }

  // progress: 0 (just started) to 1+ (at/past threshold) — drives the
  // pill's fade-in and scale continuously with the finger, not in a
  // single jump at the threshold, so it reads as following the drag
  // rather than popping in.
  function applyPull(dist){
    if(mainEl) mainEl.style.transform = dist ? `translateY(${dist}px)` : "";
    if(!indicator) return;
    const progress = Math.min(dist / THRESHOLD, 1);
    indicator.style.opacity = String(Math.min(dist / 18, 1));
    indicator.style.transform = `translate(-50%, ${-14 + progress * 14}px) scale(${0.6 + progress * 0.4})`;
    indicator.classList.toggle("ptr-ready", dist >= THRESHOLD);
    setIndicatorText(dist >= THRESHOLD ? "Release" : "");
  }

  function resetVisuals(){
    if(mainEl){ mainEl.style.transition = "transform .25s ease"; mainEl.style.transform = ""; }
    if(indicator){
      indicator.classList.remove("ptr-visible", "ptr-ready", "ptr-refreshing");
      indicator.style.opacity = "0";
      indicator.style.transform = "translate(-50%, -14px) scale(.6)";
    }
    setTimeout(()=>{ if(mainEl) mainEl.style.transition = ""; }, 260);
  }

  function reset(){
    pulling = false; startY = null; lastDist = 0;
    if(hint && !refreshing) hint.textContent = DEFAULT_TEXT;
    resetVisuals();
  }

  document.addEventListener("touchstart", (e)=>{
    if(refreshing || e.touches.length !== 1 || !atTop()) return;
    startY = e.touches[0].clientY;
    pulling = true;
    if(mainEl) mainEl.style.transition = "";
    if(indicator) indicator.classList.add("ptr-visible"); // suspends the CSS transition so every touchmove frame tracks the finger exactly
  }, { passive: true });

  document.addEventListener("touchmove", (e)=>{
    if(!pulling || startY === null || refreshing) return;
    const delta = e.touches[0].clientY - startY;
    if(delta <= 0 || !atTop()){ reset(); return; }
    // Still pulling down from the very top — this is our gesture, not a
    // normal scroll, so take over the motion instead of letting the
    // browser's own rubber-band overscroll fight it.
    e.preventDefault();
    // Damped (0.5x) like before, then eased further as it approaches
    // MAX_PULL so it visibly resists rather than tracking the finger
    // 1:1 all the way — the rubber-band feel native pull-to-refresh has.
    const damped = delta * 0.5;
    lastDist = damped < MAX_PULL ? damped : MAX_PULL + (damped - MAX_PULL) * 0.15;
    if(hint) hint.textContent = lastDist >= THRESHOLD ? "↑ Release to refresh & sync" : DEFAULT_TEXT;
    applyPull(lastDist);
  }, { passive: false });

  document.addEventListener("touchend", ()=>{
    if(!pulling){ startY = null; return; }
    const pastThreshold = lastDist >= THRESHOLD;
    pulling = false; startY = null;
    if(!pastThreshold){ reset(); return; }

    refreshing = true;
    if(hint) hint.textContent = "Refreshing…";
    if(mainEl){ mainEl.style.transition = "transform .2s ease"; mainEl.style.transform = "translateY(56px)"; }
    if(indicator){
      indicator.classList.add("ptr-refreshing");
      indicator.classList.remove("ptr-ready");
      indicator.style.opacity = "1";
      indicator.style.transform = "translate(-50%, 0) scale(1)";
      setIndicatorText("Syncing…");
    }

    checkForStaleCopy().then(stale=>{
      if(stale) return forceAppRefresh(); // page is about to reload — nothing left to reset
      return Promise.resolve(typeof autoSyncNow === "function" ? autoSyncNow("pull to refresh") : null).then(()=>{
        if(hint) hint.textContent = "Up to date ✓";
        setIndicatorText("Up to date ✓");
        if(indicator) indicator.classList.remove("ptr-refreshing");
        setTimeout(()=>{ refreshing = false; reset(); }, 1400);
      });
    }).catch(()=>{
      if(hint) hint.textContent = "Couldn't refresh — check signal";
      setIndicatorText("Couldn't refresh");
      if(indicator) indicator.classList.remove("ptr-refreshing");
      setTimeout(()=>{ refreshing = false; reset(); }, 1800);
    });
  }, { passive: true });
})();

// ===============================
// BOTTOM NAV CLEARANCE — measure the real nav height instead of
// guessing a fixed px value, so content is never hidden behind it
// regardless of device/safe-area.
// ===============================
function fixBottomClearance(){
  const nav = document.querySelector("nav.tabbar");
  if(nav) document.body.style.paddingBottom = (nav.offsetHeight + 90) + "px";
}
window.addEventListener("resize", fixBottomClearance);
window.addEventListener("orientationchange", fixBottomClearance);
window.addEventListener("load", fixBottomClearance);
setTimeout(fixBottomClearance, 300);
fixBottomClearance();

// ===============================
// BACK TO TOP — floating button to jump back to the top of whichever
// screen is active. Started Discover-only (by far the longest screen at
// the time), generalized to every screen since Plan/Lineup/Map can all
// get just as long once someone's filled them in — the SHOW_AFTER_PX
// threshold below already means it only ever appears once a screen is
// genuinely scrolled a meaningful amount, so it naturally stays hidden
// on short ones without needing a per-screen allowlist. Position is
// drag-to-move and remembered (plain localStorage, not Store — this is
// a device-local UI preference, not festival data, so it's deliberately
// kept out of the sync/backup system entirely).
// ===============================
(function setupBackToTop(){
  const POS_KEY = "btt_pos_v1";
  const SHOW_AFTER_PX = 420;
  const btn = document.createElement("button");
  btn.id = "backToTopBtn";
  btn.setAttribute("aria-label", "Back to top");
  btn.textContent = "↑";
  btn.style.cssText = "position:fixed; width:46px; height:46px; border-radius:50%; background:var(--accent-teal); color:var(--bg-deep); border:none; font-size:20px; font-weight:700; box-shadow:0 6px 16px rgba(0,0,0,.4); z-index:55; display:none; cursor:grab; touch-action:none;";
  document.body.appendChild(btn);

  function clampPos(x, y){
    const margin = 8;
    const maxX = window.innerWidth - btn.offsetWidth - margin;
    const maxY = window.innerHeight - btn.offsetHeight - margin;
    return { x: Math.min(Math.max(x, margin), Math.max(margin, maxX)), y: Math.min(Math.max(y, margin), Math.max(margin, maxY)) };
  }

  function setPos(x, y, save){
    const p = clampPos(x, y);
    btn.style.left = p.x + "px";
    btn.style.top = p.y + "px";
    btn.style.right = "auto";
    btn.style.bottom = "auto";
    if(save){ try{ localStorage.setItem(POS_KEY, JSON.stringify(p)); }catch(e){} }
  }

  function loadPos(){
    try{
      const raw = localStorage.getItem(POS_KEY);
      if(raw) return JSON.parse(raw);
    }catch(e){}
    return null;
  }

  function updateVisibility(){
    const shouldShow = (document.scrollingElement || document.documentElement).scrollTop > SHOW_AFTER_PX;
    btn.style.display = shouldShow ? "flex" : "none";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";
  }

  // Default bottom-right, just above the tab bar, unless the user's
  // already dragged it somewhere else on this device.
  const saved = loadPos();
  if(saved){
    setPos(saved.x, saved.y, false);
  }else{
    const place = ()=> setPos(window.innerWidth - 62, window.innerHeight - 170, false);
    place();
    window.addEventListener("resize", ()=>{ if(!loadPos()) place(); });
  }

  let dragging = false, moved = false, startX = 0, startY = 0, originX = 0, originY = 0;
  btn.addEventListener("pointerdown", (e)=>{
    dragging = true; moved = false;
    startX = e.clientX; startY = e.clientY;
    const rect = btn.getBoundingClientRect();
    originX = rect.left; originY = rect.top;
    btn.setPointerCapture(e.pointerId);
    btn.style.cursor = "grabbing";
  });
  btn.addEventListener("pointermove", (e)=>{
    if(!dragging) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if(Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
    if(moved) setPos(originX + dx, originY + dy, false);
  });
  function endDrag(e){
    if(!dragging) return;
    dragging = false;
    btn.style.cursor = "grab";
    if(moved){
      const rect = btn.getBoundingClientRect();
      setPos(rect.left, rect.top, true);
    }
  }
  btn.addEventListener("pointerup", endDrag);
  btn.addEventListener("pointercancel", endDrag);

  btn.addEventListener("click", ()=>{
    if(moved) return; // that click was the end of a drag, not a tap
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.addEventListener("scroll", updateVisibility, { passive: true });
  document.querySelectorAll(".tab").forEach(t=> t.addEventListener("click", ()=> setTimeout(updateVisibility, 50)));
  updateVisibility();
})();

// ===============================
// TIMELINE SCROLL PROGRESS — a visible vertical scroll indicator beside
// each .timeline-outer box (Lineup/Plan/Clash timelines), which scrolls
// both ways in a fixed-height (68vh) container. The native scrollbar
// there is easy to miss (thin, low-contrast, fades fast on
// -webkit-overflow-scrolling:touch), which is exactly why "am I near
// the bottom of this stage list yet" was hard to tell on a long one.
//
// The native scrollbar is hidden outright via CSS (.timeline-outer
// scrollbar rules) now that this custom one exists — no point in both.
//
// position:fixed, positioned in JS from the box's own
// getBoundingClientRect() — NOT position:absolute as a child of the
// scrolling box itself, which was the first attempt and visibly broke:
// an absolutely-positioned descendant of an overflow:auto box is still
// part of that box's scrolled content, so it drifted sideways with the
// timeline's own horizontal (time-axis) scrolling instead of staying
// pinned to the right edge. Fixed positioning, recomputed from the
// box's real on-screen rect, is the same technique already used for
// the pull-to-refresh indicator elsewhere in this file.
//
// setupTimelineScrollProgress() builds the track+thumb once per
// container (idempotent). refreshTimelineScrollProgress() recomputes
// everything and must be called after any render that can change the
// container's scrollable content (a new day, a filter, etc.), since
// scrollHeight only updates once new content is actually in the DOM.
// ===============================
const TIMELINE_SCROLL_OUTER_IDS = ["artistTimelineOuter", "planTimelineOuter", "clashTimelineOuter"];

function setupTimelineScrollProgress(outerId){
  const outer = document.getElementById(outerId);
  if(!outer || document.getElementById(outerId + "_scrollTrack")) return;
  const track = document.createElement("div");
  track.className = "timeline-scroll-track";
  track.id = outerId + "_scrollTrack";
  const thumb = document.createElement("div");
  thumb.className = "timeline-scroll-thumb";
  track.appendChild(thumb);
  document.body.appendChild(track);
  outer.addEventListener("scroll", ()=> updateTimelineScrollThumb(outerId), { passive: true });
}

function updateTimelineScrollThumb(outerId){
  const outer = document.getElementById(outerId);
  const track = document.getElementById(outerId + "_scrollTrack");
  const thumb = track && track.firstElementChild;
  if(!outer || !track || !thumb) return;
  const rect = outer.getBoundingClientRect();
  const overflow = outer.scrollHeight - outer.clientHeight;
  // Hidden (wrong sub-view active, off-screen, etc.) or nothing
  // meaningful to scroll — a short/filtered day shouldn't get a
  // progress bar with nowhere to go.
  if(rect.height < 1 || overflow < 24){ track.style.display = "none"; return; }
  const inset = 8;
  // Never draw over the fixed bottom nav bar — position:fixed means this
  // track's own top/height are computed purely from the timeline box's
  // on-screen rect, with no awareness of what else is fixed to the
  // viewport. Wherever the page happens to be scrolled to, the box's
  // bottom edge can land behind the tab bar's fixed area, and since the
  // track sits at a higher z-index (so it's visible over the timeline
  // itself), that let it glow on top of the nav instead of being hidden
  // behind it. Clamp the track's own bottom edge to sit above the real,
  // currently-measured top of the nav bar (its height varies with
  // env(safe-area-inset-bottom) across devices, so this is measured
  // fresh each time rather than hand-guessed).
  const navBar = document.querySelector("nav.tabbar");
  const navTop = navBar ? navBar.getBoundingClientRect().top : window.innerHeight;
  const bottomLimit = Math.min(window.innerHeight, navTop) - 6;
  const top = rect.top + inset;
  const trackHeight = Math.min(rect.top + rect.height - inset, bottomLimit) - top;
  if(trackHeight < 24){ track.style.display = "none"; return; }
  track.style.display = "block";
  // Left of the whole timeline box, outside it entirely — not just past
  // the sticky stage-name column, which used to sit inside the box and
  // read as part of the timeline itself. TRACK_WIDTH must match
  // .timeline-scroll-track's CSS width. Clamped to a minimum of 2px so a
  // box with little/no left margin (narrow viewport) never pushes the
  // bar off-screen.
  const TRACK_WIDTH = 5;
  const gap = 6;
  track.style.left = Math.max(2, rect.left - gap - TRACK_WIDTH) + "px";
  track.style.top = top + "px";
  track.style.height = trackHeight + "px";
  const thumbHeight = Math.max(24, (outer.clientHeight / outer.scrollHeight) * trackHeight);
  // Clamp scrollTop into [0, overflow] before computing the thumb
  // position — on touch devices, elastic overscroll (rubber-banding) at
  // the very top/bottom briefly pushes scrollTop negative or past
  // overflow, and unclamped that swung thumbTop outside the track on
  // every one of those scroll events, reading as a shake right at the
  // top/bottom edges.
  const clampedScrollTop = Math.max(0, Math.min(outer.scrollTop, overflow));
  const thumbTop = (clampedScrollTop / overflow) * (trackHeight - thumbHeight);
  thumb.style.height = thumbHeight + "px";
  thumb.style.top = thumbTop + "px";
}

function refreshTimelineScrollProgress(outerId){
  setupTimelineScrollProgress(outerId);
  // Content just changed — layout needs a tick to settle before
  // scrollHeight/getBoundingClientRect reflect the new grid.
  requestAnimationFrame(()=> updateTimelineScrollThumb(outerId));
}

// The box's on-screen position also changes on ordinary page scroll
// (this is a fixed-height box inside a normally-scrolling page) and on
// resize/orientation change — neither fires the box's own scroll
// event, so both need their own listener to keep the track from
// drifting away from the box it's meant to sit beside.
let _timelineScrollRepositionQueued = false;
function repositionAllTimelineScrollThumbs(){
  if(_timelineScrollRepositionQueued) return;
  _timelineScrollRepositionQueued = true;
  requestAnimationFrame(()=>{
    _timelineScrollRepositionQueued = false;
    TIMELINE_SCROLL_OUTER_IDS.forEach(updateTimelineScrollThumb);
  });
}
window.addEventListener("scroll", repositionAllTimelineScrollThumbs, { passive: true });
window.addEventListener("resize", repositionAllTimelineScrollThumbs);
window.addEventListener("orientationchange", repositionAllTimelineScrollThumbs);

// ===============================
// STORAGE HELPER
// ===============================
// DATA ISOLATION MODEL — read this before touching Store or DEFAULTS:
//  - Every key below lives ONLY in this browser's localStorage, on this
//    one device. There is no server, no account system, and no
//    background sync of any kind (see service-worker.js: it caches
//    static assets only, never app data).
//  - window.__boomtownSavedData (EMBEDDED_DATA below) exists purely so a
//    user-generated backup/snapshot file (buildSnapshotHtml(), further
//    down this file) can carry that one person's data with it when
//    reopened. In the master index.html committed to the shared GitHub
//    repo, it must always be seeded as {} — never real values — because
//    that copy is what every visitor's browser loads. Anything else here
//    would leak one person's saved data to everyone as their default.
//  - The one deliberately shared/merged flow is the Sync feature
//    (buildSyncPayload/mergeSyncPayload, plus its cloud transport —
//    pushToCloud/pullFromCloud — which auto-runs on app open as well as
//    the manual Sync now button) — it only ever touches the shared
//    discovery-log style fields (clues, characterNotes, theories,
//    hiddenVenues, discoveries, customSocials, quotes, sightings,
//    customLandmarks), which merge additively with no duplicates from
//    the same contributor — hiddenVenues/customLandmarks dedupe per
//    name+from+note-text, not name alone, so a second genuinely
//    different note about the same place from the same person (a
//    return visit, say) survives too, instead of being silently
//    treated as a repeat of the first one, PLUS
//    three read-only snapshot fields: each person's saved-artist
//    "schedule", bingo card, and built character ride along in the same
//    payload, but none is ever merged into your own
//    "schedule"/bingoCard/myCharacter — they land under
//    peopleSchedules[deviceId]/peopleBingo[deviceId]/peopleCharacters[deviceId]
//    instead (each keyed by the contributor's stable per-device id, with
//    a displayName field carrying whatever they currently go by — see
//    ensureDeviceId()/personDisplayName() further down), kept separate
//    per contributor, shown only in their own person-tab on the Plan,
//    Bingo, and My Character cards. Sync must never read or write other
//    personal fields: notes, roomCode.
//    Note: "meeting" is deliberately NOT personal — it's the group's one
//    shared meeting point, stored directly on the room document (not a
//    per-member doc) since there's only ever one value for the whole
//    group, not one per person. "myStatus"/"peopleStatus" follow the
//    same per-person-snapshot pattern as schedule/bingo/character above.
const DEFAULTS = { schedule: [], peopleSchedules: {}, peopleBingo: {}, peopleCharacters: {}, peopleLastSeen: {}, peopleStatus: {}, myStatus: null, discoveries: [], meeting: null, meetingBy: "", meetingUpdatedAt: null, groupDecisions: {}, personalClashChoices: {}, personalClashTimes: {}, notes: "", customArtists: [], hiddenVenues: [], clues: {}, characterNotes: {}, involvedDone: [], theories: [], customSocials: [], contributorName: "", roomCode: "", quotes: [], bingoCard: [], bingoMarked: [], bingoLocked: false, myCharacter: null, sightings: [], customLandmarks: [], customPlaces: [], officialTimeCorrections: {}, bingoCustomText: "", bingoLinesSeen: 0, lastSyncedAt: null, seenHomeInfoCard: false, dismissedAddToHome: false, packingChecked: [], deviceId: "", lastPushedRoomId: "", lastOpenedAt: null, seenArtists: [], activities: [], joinedActivities: [], peopleActivities: {}, peopleJoins: {}, locationReminderEnabled: false, locationReminderDismissedAt: null, chatNotificationsEnabled: false, wantTogether: [], peopleWantTogether: {} };
const EMBEDDED_DATA = window.__boomtownSavedData || {};

// Saved artists, bingo card and character are otherwise only backed up
// to the cloud by periodic auto-sync or an explicit "Sync now" tap —
// meaning a device that never taps Sync (or one whose local storage
// gets wiped, e.g. by a device-handoff mistake) can lose real festival
// picks with no copy anywhere else. Debounced so a run of rapid changes
// (starring several artists in a row) triggers one push, not one per
// change; pushToCloud() itself is a hoisted function declaration and a
// safe no-op with no name/room/signal set, so this is safe to call from
// here even though pushToCloud is defined much later in this file.
let _autoBackupTimer = null;
const AUTO_BACKUP_KEYS = new Set(["schedule", "bingoCard", "bingoMarked", "bingoLocked", "myCharacter", "seenArtists", "activities", "joinedActivities", "wantTogether", "officialTimeCorrections"]);
function scheduleAutoBackup(){
  if(_autoBackupTimer) clearTimeout(_autoBackupTimer);
  _autoBackupTimer = setTimeout(()=>{
    _autoBackupTimer = null;
    if(typeof pushToCloud === "function") pushToCloud().catch(()=>{});
  }, 4000);
}

const Store = {
  get(key){
    const raw = localStorage.getItem(key);
    // Always hand back a fresh clone, never the live DEFAULTS/EMBEDDED_DATA
    // object itself — callers routinely do Store.get(key).push(...), which
    // would otherwise mutate the shared default in place.
    if(raw === null){
      const fallback = Object.prototype.hasOwnProperty.call(EMBEDDED_DATA, key) ? EMBEDDED_DATA[key] : DEFAULTS[key];
      return fallback && typeof fallback === "object" ? JSON.parse(JSON.stringify(fallback)) : fallback;
    }
    try { return JSON.parse(raw); } catch(e){
      const fallback = DEFAULTS[key];
      return fallback && typeof fallback === "object" ? JSON.parse(JSON.stringify(fallback)) : fallback;
    }
  },
  set(key, value){
    localStorage.setItem(key, JSON.stringify(value));
    if(AUTO_BACKUP_KEYS.has(key)) scheduleAutoBackup();
  },
  remove(key){ localStorage.removeItem(key); }
};

// ===============================
// TAB NAVIGATION
// ===============================
const screens = document.querySelectorAll(".screen");
const tabs = document.querySelectorAll(".tab");

// "Jump" links (a stage name, a district mention, "Hidden venues" from
// Discover, etc.) switch tabs out from under whatever you were looking
// at, with no way back except re-finding your place by hand. Every jump
// function below routes through jumpToTab() instead of clicking a tab
// button directly, which remembers where you were (tab + scroll
// position) so the floating back-nav button can return you there. Tapping a bottom-nav tab
// directly (not via a jump) clears this — that's a deliberate fresh
// navigation, not a "look something up and return" trip.
let navReturnStack = [];
let suppressNavClear = false;
// Per-tab scroll memory — separate from navReturnStack above, which is
// only for "jump" links returning to an exact origin. This covers the
// plainer case: tapping a bottom-nav tab directly should land back
// where you last scrolled to on that tab, not reset to the top every
// time. In-memory only (not persisted to localStorage) — resets on a
// fresh app load/reinstall, same as how most native apps' tab bars
// behave, and avoids restoring a scroll offset that no longer makes
// sense after the page's own content has changed shape.
let tabScrollPositions = {};
// Double-tapping a bottom-nav tab (two taps on the same tab within this
// window, whether or not it was already the active tab) scrolls to top —
// on top of, not instead of, the floating "back to top" button above and
// the tab-switch scroll-memory restore below.
let lastTabTapTime = {};
const DOUBLE_TAP_TOP_MS = 400;

// Floating, drag-to-move button — same pattern as "Back to top" below
// (own remembered position, own localStorage key), not a fixed header
// icon. Only ever appears when navReturnStack actually has somewhere to
// go back to (a jump link was used to get here) — plain bottom-nav tab
// switches never populate that stack, so this stays hidden for those,
// exactly as requested: it's for "I followed a link, now take me back,"
// not a general-purpose nav control.
const backNavBtn = document.createElement("button");
(function setupBackNavButton(){
  const POS_KEY = "backnav_pos_v1";
  backNavBtn.id = "backNavBtn";
  backNavBtn.setAttribute("aria-label", "Back to where you were");
  backNavBtn.title = "Back to where you were";
  backNavBtn.textContent = "←";
  backNavBtn.style.cssText = "position:fixed; width:46px; height:46px; border-radius:50%; background:var(--bg-panel-2); color:var(--text-primary); border:1px solid var(--line); font-size:20px; font-weight:700; box-shadow:0 6px 16px rgba(0,0,0,.4); z-index:56; display:none; cursor:grab; touch-action:none;";
  document.body.appendChild(backNavBtn);

  function clampPos(x, y){
    const margin = 8;
    const maxX = window.innerWidth - backNavBtn.offsetWidth - margin;
    const maxY = window.innerHeight - backNavBtn.offsetHeight - margin;
    return { x: Math.min(Math.max(x, margin), Math.max(margin, maxX)), y: Math.min(Math.max(y, margin), Math.max(margin, maxY)) };
  }
  function setPos(x, y, save){
    const p = clampPos(x, y);
    backNavBtn.style.left = p.x + "px";
    backNavBtn.style.top = p.y + "px";
    backNavBtn.style.right = "auto";
    backNavBtn.style.bottom = "auto";
    if(save){ try{ localStorage.setItem(POS_KEY, JSON.stringify(p)); }catch(e){} }
  }
  function loadPos(){
    try{
      const raw = localStorage.getItem(POS_KEY);
      if(raw) return JSON.parse(raw);
    }catch(e){}
    return null;
  }
  // Default top-left, below the header, unless already dragged
  // elsewhere — deliberately not near "Back to top"'s bottom-right
  // default so a screen showing both at once doesn't stack them.
  const saved = loadPos();
  if(saved) setPos(saved.x, saved.y, false);
  else{
    const place = ()=> setPos(14, 78, false);
    place();
    window.addEventListener("resize", ()=>{ if(!loadPos()) place(); });
  }

  let dragging = false, moved = false, startX = 0, startY = 0, originX = 0, originY = 0;
  backNavBtn.addEventListener("pointerdown", (e)=>{
    dragging = true; moved = false;
    startX = e.clientX; startY = e.clientY;
    const rect = backNavBtn.getBoundingClientRect();
    originX = rect.left; originY = rect.top;
    backNavBtn.setPointerCapture(e.pointerId);
    backNavBtn.style.cursor = "grabbing";
  });
  backNavBtn.addEventListener("pointermove", (e)=>{
    if(!dragging) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if(Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
    if(moved) setPos(originX + dx, originY + dy, false);
  });
  function endDrag(){
    if(!dragging) return;
    dragging = false;
    backNavBtn.style.cursor = "grab";
    if(moved){
      const rect = backNavBtn.getBoundingClientRect();
      setPos(rect.left, rect.top, true);
    }
  }
  backNavBtn.addEventListener("pointerup", endDrag);
  backNavBtn.addEventListener("pointercancel", endDrag);
  backNavBtn.addEventListener("click", ()=>{
    if(moved) return; // that click was the end of a drag, not a tap
    doBackNav();
  });
})();

function updateNavBackButton(){
  backNavBtn.style.display = navReturnStack.length ? "flex" : "none";
  if(navReturnStack.length){
    backNavBtn.style.alignItems = "center";
    backNavBtn.style.justifyContent = "center";
  }
}

function jumpToTab(tabId){
  const activeTab = document.querySelector(".tab.active");
  if(activeTab && activeTab.dataset.tab !== tabId){
    navReturnStack.push({ tab: activeTab.dataset.tab, scrollY: window.scrollY });
    updateNavBackButton();
  }
  suppressNavClear = true;
  const btn = document.querySelector(`.tab[data-tab="${tabId}"]`);
  if(btn) btn.click();
}

function doBackNav(){
  const entry = navReturnStack.pop();
  if(!entry) return;
  updateNavBackButton();
  const btn = document.querySelector(`.tab[data-tab="${entry.tab}"]`);
  if(btn){
    suppressNavClear = true;
    btn.click();
  }
  // Double rAF: the tab click's own handler already forces a scroll
  // position synchronously (that tab's own remembered position, which
  // isn't necessarily where this jump came from) — wait a frame (plus
  // one more for any screen's own render-on-activate work) before
  // overriding it with the jump's specific remembered position.
  requestAnimationFrame(()=> requestAnimationFrame(()=>{
    window.scrollTo(0, entry.scrollY);
    if(document.scrollingElement) document.scrollingElement.scrollTop = entry.scrollY;
  }));
}

tabs.forEach(tab=>{
  tab.onclick = ()=>{
    const now = Date.now();
    const isDoubleTap = lastTabTapTime[tab.dataset.tab] && (now - lastTabTapTime[tab.dataset.tab] < DOUBLE_TAP_TOP_MS);
    lastTabTapTime[tab.dataset.tab] = now;
    if(!suppressNavClear){ navReturnStack = []; updateNavBackButton(); }
    suppressNavClear = false;
    // Remember where you were on the tab you're leaving, before
    // switching away from it, so tapping back to it later (via the
    // bottom nav, not just the back button) lands where you left off.
    const outgoingTab = document.querySelector(".tab.active");
    if(outgoingTab) tabScrollPositions[outgoingTab.dataset.tab] = window.scrollY;
    // Leaving Map mid "Add a place" flow shouldn't leave its fixed
    // picking bar/modal stuck floating over whatever tab you switch to.
    if(typeof stopPlacePicking === "function") stopPlacePicking();
    if(typeof closeAddPlaceModal === "function") closeAddPlaceModal();
    screens.forEach(s=>s.classList.remove("active"));
    tabs.forEach(t=>t.classList.remove("active"));
    document.getElementById(tab.dataset.tab).classList.add("active");
    tab.classList.add("active");
    if(isDoubleTap){
      tabScrollPositions[tab.dataset.tab] = 0;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const restoreY = tabScrollPositions[tab.dataset.tab] || 0;
      window.scrollTo(0, restoreY);
      if(document.scrollingElement) document.scrollingElement.scrollTop = restoreY;
    }
    // Switching tabs changes which timeline box (if any) is actually
    // on-screen, but doesn't itself fire a scroll event when restoreY
    // matches the outgoing tab's position — repositionAllTimelineScrollThumbs()
    // is otherwise only wired to scroll/resize, so without this call the
    // scroll-progress bar keeps showing wherever it last was computed
    // (a different tab's timeline, or nothing) until the user happens to
    // scroll on the new tab.
    if(typeof repositionAllTimelineScrollThumbs === "function") requestAnimationFrame(repositionAllTimelineScrollThumbs);
    if(tab.dataset.tab === "home" && typeof updateStats === "function") updateStats();
    if(tab.dataset.tab === "plan" && typeof renderNowNext === "function") renderNowNext();
    if(tab.dataset.tab === "discover" && typeof renderConsolidatedNotes === "function") renderConsolidatedNotes();
    if(tab.dataset.tab === "discover" && typeof renderDiscoverForYou === "function") renderDiscoverForYou();
    if(tab.dataset.tab === "discover" && typeof renderRecentActivity === "function") renderRecentActivity("recentActivityList");
    // Leaflet caches its container's pixel size at init time — since
    // Home is the default active tab, the very first loadMap() call (at
    // script load) happens while #mapscreen is still display:none (zero
    // size), so the map needs telling its real size the first time it's
    // actually shown, and again on every later visit in case the
    // viewport changed while this tab was hidden (e.g. orientation).
    if(tab.dataset.tab === "mapscreen" && typeof mapGL !== "undefined" && mapGL) requestAnimationFrame(()=> mapGL.resize());
  };
});

// ===============================
// SETTINGS SPACE — a dedicated space for Sync, merge, backups, device
// handoff, Location & GPS and Notifications, reached from the ⚙️ cog
// button in the header (under Chat) rather than living scattered inside
// Discover. Deliberately NOT one of the bottom tabbar's .tab buttons —
// it's a slide-to space you leave via the existing floating back button
// (same navReturnStack/doBackNav plumbing every other jumpToId/jumpToTab
// call already uses), not a 7th permanent tab.
// ===============================
function openSettingsScreen(focusId){
  const activeTab = document.querySelector(".tab.active");
  if(activeTab){
    navReturnStack.push({ tab: activeTab.dataset.tab, scrollY: window.scrollY });
    updateNavBackButton();
  }
  screens.forEach(s=>s.classList.remove("active"));
  tabs.forEach(t=>t.classList.remove("active"));
  const el = document.getElementById("settingsscreen");
  if(el) el.classList.add("active");
  if(typeof renderSettingsNotifyBtn === "function") renderSettingsNotifyBtn();
  window.scrollTo(0, 0);
  if(document.scrollingElement) document.scrollingElement.scrollTop = 0;
  if(focusId){
    requestAnimationFrame(()=>{
      const target = document.getElementById(focusId);
      if(target) target.scrollIntoView({ behavior:"smooth", block:"center" });
    });
  }
}
(function wireSettingsScreen(){
  const openBtn = document.getElementById("settingsOpenBtn");
  if(openBtn) openBtn.onclick = ()=> openSettingsScreen();
  const backBtn = document.getElementById("settingsBackBtn");
  if(backBtn) backBtn.onclick = doBackNav;
})();

// ===============================
// DISCOVER TOP NAVIGATOR — jump straight to any section instead of a
// long blind scroll, since it's grown to a lot of cards.
// ===============================
document.querySelectorAll("#discoverNav button").forEach(btn=>{
  btn.onclick = ()=>{
    const tab = btn.dataset.jumpTab;
    if(tab && typeof jumpToId === "function"){ jumpToId(btn.dataset.jump, tab); return; }
    const target = document.getElementById(btn.dataset.jump);
    if(target) target.scrollIntoView({ behavior:"smooth", block:"center" });
  };
});

// ===============================
// MAP TOP NAVIGATOR — same jump-to-section pattern as Discover's, so
// it's clear at a glance that logging and reference info both exist on
// this screen instead of only surfacing after a long scroll.
// ===============================
document.querySelectorAll("#mapNav button").forEach(btn=>{
  btn.onclick = ()=>{
    const target = document.getElementById(btn.dataset.jump);
    if(target) target.scrollIntoView({ behavior:"smooth", block:"center" });
  };
});

// ===============================
// QUICK NOTES
// ===============================
const notesBox = document.getElementById("notes");
notesBox.value = Store.get("notes") || "";
notesBox.oninput = ()=> Store.set("notes", notesBox.value);

// ===============================
// COUNTDOWN & STATS
// ===============================
// UTC-anchored (not a bare local-time string) — see FESTIVAL_START's own
// comment further down for why: the festival is on UK time (BST,
// UTC+1) regardless of the viewer's own device timezone. 11:00 UTC =
// 12:00 BST. Declared up here (not down with FESTIVAL_START near
// TODAY/FESTIVAL MODE) since updateCountdown() runs at load time, at
// the bottom of this same block — see the TDZ rule in CLAUDE.md.
const FESTIVAL_GATES_OPEN = new Date("2026-08-12T11:00:00Z"); // 12:00 BST, Wed 12 Aug 2026
function updateCountdown(){
  const el = document.getElementById("countdownText");
  const card = document.getElementById("countdownCard");
  // Home's top spot: the countdown while gates aren't open yet, then the
  // "Next saved event" ticket takes over that exact position once they
  // are — same slot, not stacked, so Home doesn't just grow a section
  // once the festival's actually on. nextEventCard sits right where
  // countdownCard is in the markup (index.html), so toggling one off and
  // the other on swaps what occupies the top of Home with no layout jump.
  // Only ever toggles *visibility* here, never repopulates content —
  // updateNextEvent() (defined much further down, after the embedded
  // `artists` array) already keeps #next-event current on load and on
  // every schedule change, and this function runs at load time far
  // above that declaration, so calling it from here would be exactly
  // the TDZ trap CLAUDE.md warns about (caught by testing with the
  // system clock moved into the festival window — it doesn't reproduce
  // with today's real date, only once "now" is actually past gates-open).
  const nextEventCard = document.getElementById("nextEventCard");
  const diff = FESTIVAL_GATES_OPEN - new Date();
  if(diff <= 0){
    // Stops and disappears at gates-open, rather than a "gates are
    // open" message taking up Home space for the rest of the festival.
    if(card) card.style.display = "none";
    if(nextEventCard) nextEventCard.style.display = "";
    return;
  }
  if(card) card.style.display = "";
  if(nextEventCard) nextEventCard.style.display = "none";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  el.innerHTML = `<span style="font-size:22px; font-weight:700; color:var(--accent-amber);">${days}d ${hours}h ${mins}m</span><br>until gates open (Wed 12 Aug, 12:00 UK time)`;
}
updateCountdown();
setInterval(updateCountdown, 60000);

function updateStats(){
  const row = document.getElementById("statsRow");
  if(!row) return;
  row.innerHTML = `
    <div class="stat"><b>${Store.get("schedule").length}</b>Artists saved</div>
    <div class="stat"><b>${Store.get("discoveries").length}/7</b>Districts visited</div>
    <div class="stat"><b>${Store.get("hiddenVenues").length}</b>Hidden venues logged</div>
  `;
}
updateStats();

// ===============================
// STORY & STAGE SOCIALS
// ===============================
const customSocialsBox = document.getElementById("customSocialsList");
function loadCustomSocials(){
  const list = Store.get("customSocials") || [];
  customSocialsBox.innerHTML = list.map((s,i)=>`
    <div class="item">
      <div class="item-top">
        <div><strong>${s.name}</strong></div>
        <div class="btnrow">
          <a class="linkbtn" style="margin:0;" href="${s.url}" target="_blank" rel="noopener">Open</a>
          <button data-i="${i}" class="removeSocialBtn">Remove</button>
        </div>
      </div>
    </div>
  `).join("");
  customSocialsBox.querySelectorAll(".removeSocialBtn").forEach(btn=>{
    btn.onclick = ()=>{
      const list = Store.get("customSocials") || [];
      list.splice(Number(btn.dataset.i), 1);
      Store.set("customSocials", list);
      loadCustomSocials();
    };
  });
}
document.getElementById("addSocialBtn").onclick = ()=>{
  const name = document.getElementById("newSocialName").value.trim();
  let url = document.getElementById("newSocialUrl").value.trim();
  if(!name || !url) return;
  if(!/^https?:\/\//.test(url)) url = "https://" + url;
  const list = Store.get("customSocials") || [];
  list.push({ name, url });
  Store.set("customSocials", list);
  document.getElementById("newSocialName").value = "";
  document.getElementById("newSocialUrl").value = "";
  loadCustomSocials();
};
loadCustomSocials();

// ===============================
// ARTIST DATABASE
// Friday & Saturday sets below are real but EARLY/UNCONFIRMED — sourced
// from Flock (flock-app.app), a third-party lineup planner, not Boomtown's
// own timetable. Flock itself flags this data as "very likely to change."
// Wed/Thu/Sun aren't covered by that source yet, so those acts stay TBC —
// add them yourself via "Add an artist" once the app confirms.
// End times are auto-estimated as "until the next act on that stage" since
// Boomtown doesn't publish set lengths — treat them as approximate.
//
// No per-artist genre field exists anywhere in the 1621 scraped acts
// below — genreOf() (just after this table) always falls back to a
// per-STAGE genre. This table used to only cover 28 of the 63 real stage
// names actually in use, leaving the rest to fall through to a blanket
// "Unconfirmed" — every value below is now sourced from venueDirectory's
// own already-researched genre/type fields (see VENUE DIRECTORY further
// down) rather than guessed, and every stage has an entry. Kept to a
// short, shared "Category / Category" vocabulary (see GENRE_INFO just
// below) rather than each stage's own longer description, since these
// values also double as the Lineup tab's genre filter chips — one chip
// per unique value here, not per stage.
//
// A pass cross-checking every tag here against both its own
// venueDirectory `genre` text AND a sample of its actual booked acts
// (below the schedule, not just the short blurb) turned up five that
// didn't hold up:
//  - Botanica Zoo was "Bass / D&B" while Anara Forest — practically the
//    same jungle/UK-garage/bass family per both their own venueDirectory
//    descriptions — was "Bass / Drum & Bass": two chips for one genre.
//    Merged onto the fuller name.
//  - E Numbers was "Bass / Rave" despite its own venueDirectory genre
//    reading "Hyperpop, party, eclectic" — confirmed by its actual
//    lineup (Kid Cosmit, D0LLSW4G, Lounicorn — hyperpop/alt-rave scene
//    names, nothing rave-specific).
//  - Grand Central was "Live / Alternative" despite its own
//    venueDirectory genre naming "Bands, hip hop, headline sets" — its
//    lineup confirms real hip hop headliners (Havoc of Mobb Deep, Kae
//    Tempest) alongside bands, not an "alternative" scene specifically.
//  - Spectrum 360 was "Bass / Hardstyle" despite its own venueDirectory
//    genre reading "UK garage through to gabber" — hardstyle isn't
//    mentioned at all; retagged to match what's actually sourced.
//  - Tangled Roots was "Dub / Bass" despite its own venueDirectory genre
//    literally saying "Dub, roots" and a confirmed lineup act called
//    "Roots Ginjah" — retagged to use the word already in its own
//    description, and reads less like a typo of "Dubstep / Bass" now.
//
// A later pass went further: several stages blend genres that are
// genuinely distinct (DnB vs jungle, punk vs metal, dub vs reggae, D&B
// vs ska) into one stage-wide tag, which is the best a per-STAGE-only
// system can do — but individual acts within those stages, took under a
// named record label/night/set title, gave real per-ACT evidence to do
// better. genreOf() already checks `a.genre` before falling back to
// STAGE_GENRE, so ~77 individual schedule entries below now carry their
// own `genre`, sourced only from unambiguous evidence in the data
// itself (a takeover branded after a real, identifiable label/night, or
// a set explicitly named after its genre) or, for The Lion's Den/Grand
// Central's headline-level bookings, the act's own well-established
// public genre (Madness = ska, Andy C = drum & bass, Kneecap = hip hop,
// etc.) — never a guess at an unfamiliar/local DJ's specific style.
// Stage defaults below are left as the best single fallback tag for
// whatever's NOT individually confirmed this way (e.g. Anara Forest's
// default "Drum & Bass" alongside its own confirmed-"Jungle" Flexout
// Audio/20 Years Of Rupture sets) rather than forced to a false single
// label for a stage that's genuinely mixed. No "Ska" chip exists on its
// own for the same reason — searched the full 1621 acts for it and only
// found two real ska-punk names (Inner Terrestrials, Popes Of
// Chillitown, both tagged "Ska / Punk" below) among Hangar 161's mostly-
// unfamiliar punk/DIY roster, not enough evidence to retag the rest.
// ===============================
const STAGE_GENRE = {
  "Acid Leak":"Acid / Techno", "Agents of Change HQ":"Talks / Community",
  "Airetiko":"Circus / Performance", "Anara Forest":"Drum & Bass",
  "Ancient Futures":"Talks / Community", "Blink Mental Health":"Welfare / Support",
  "Botanica Zoo":"Jungle", "Busker's Wharf":"Folk / Acoustic",
  "Cas's Costumes":"Party / Variety", "Circus Tent":"Circus / Performance",
  "Climate Live":"Talks / Community", "Cocaine Anonymous":"Welfare / Support",
  "Community Fire":"Talks / Community", "Craft Tent":"Workshop / Craft",
  "Crafty Rascals":"Workshop / Craft", "Deviant Lounge":"Bass / Alt",
  "E Numbers":"Hyperpop / Party", "End of the Line":"Eclectic / DJ",
  "Energy Garden":"Talks / Community", "Foggers Mill":"Eclectic / DJ",
  "Full Moon Ballroom":"Swing / Variety", "Gabber Kebabber":"Hardcore / Gabber",
  "Games Lounge":"Chill / Downtime", "Garden":"Chill / Downtime",
  "Grand Central":"Bands / Hip Hop", "Hangar 161":"Punk",
  "Hapitat":"Chill / Downtime", "Helix":"Breaks / Big Beat",
  "Hidden Woods":"Bass / Dub / Jungle", "Hotel Paradiso":"Eclectic / DJ",
  "Hydro XL":"House / Dance", "Infinity":"House / UK Garage",
  "Luck Exchange Casino":"Comedy / Game-show", "Mining for (g)Old Town":"Party / Variety",
  "Nachtlicker":"Techno / Electro", "Narcotics Anonymous":"Welfare / Support",
  "Nexus":"Party / Variety", "Observatory":"Talks / Community",
  "Permaculture":"Talks / Community", "PFP Robot":"Techno / Electro",
  "Rebel Girls Club":"Welfare / Support", "Reel News":"Eclectic / DJ",
  "Reparium":"Workshop / Craft", "Rose and Clown":"Cabaret / Variety",
  "Sharing Circles":"Talks / Community", "Sibín Beag":"Irish Folk / Trad",
  "Soapranos Laundrette":"House / Dance", "Spectrum 360":"Garage / Gabber",
  "Spinney Hollow":"Eclectic / DJ", "Sub Lab":"Dubstep / Bass",
  "Tangled Roots":"Dub / Roots", "The Boomtown Bobbies":"Bass / Party",
  "The Fools Leap":"Folk / Balkan / Party", "The Garden Centre":"Eclectic / DJ",
  "The Immortal Children of the Eternal Seed":"World / Eclectic", "The Lion's Den":"D&B / Reggae / Headline",
  "The Magic Teapot":"Chill / Downtime", "The Pomegranate Parlour":"World / Eclectic",
  "Tinker Station":"Workshop / Craft", "Topsy Turvy Trims":"Party / Variety",
  "Tribe of Frog":"Psytrance / Trance", "Twisted Time Machine (Bad Apple Bar)":"Party / Playback Sets",
  "XR":"Talks / Community",
  "Check app":"Unconfirmed"
};
function genreOf(a){ return a.genre || STAGE_GENRE[a.stage] || "Unconfirmed"; }

// One-line, genre-level (not artist-specific) descriptions of what each
// tag generally sounds like — shown under the tag on artist cards and
// in the Genre guide on the Artists screen, so a name you don't
// recognise still tells you roughly what you're walking into.
const GENRE_INFO = {
  "Acid / Techno": "Squelchy 303 acid lines over driving, hypnotic techno.",
  "Bands / Hip Hop": "Live bands and hip hop headliners on the same bill — the flagship main stage's own eclectic mix (see individual acts below for a more specific tag where one's confirmed).",
  "Bass / Alt": "Bass-weight production with an alternative, less-club-standard edge.",
  "Bass / Dub / Jungle": "Sound-system bass culture — dub weight and jungle's chopped breaks.",
  "Bass / Party": "Crowd-pleasing bass music built for singalongs and big drops.",
  "Breaks / Big Beat": "Chunky breakbeats and big, riffy drops — festival breaks.",
  "Cabaret / Variety": "Live hosted variety — burlesque, comedy, circus and song.",
  "Chill / Downtime": "A low-key space to sit down and recharge, not a dancefloor.",
  "Circus / Performance": "Live circus and physical performance — aerial, acrobatics, theatre.",
  "Comedy / Game-show": "Hosted comedy and game-show-style segments rather than DJs.",
  "D&B / Reggae / Headline": "Big-stage drum & bass headliners alongside reggae/sound-system sets (see individual acts below for a more specific tag where one's confirmed).",
  "Drum & Bass": "Fast breakbeats and heavy sub-bass at full drum & bass tempo — the polished, modern end of the family jungle grew into.",
  "Dub / Roots": "Deep, echo-laden dub and roots reggae with sub-bass at its core.",
  "Dubstep / Bass": "Half-time wobble and weight — classic and modern dubstep.",
  "Eclectic / DJ": "Genre-hopping DJ sets that don't sit still in one lane.",
  "Electronic": "Full-spectrum electronic/dance production that doesn't sit neatly in one club genre.",
  "Folk / Acoustic": "Live, mostly-unplugged folk and acoustic sets.",
  "Folk / Balkan / Party": "Brass-heavy Balkan folk turned into a full-on party set.",
  "Garage / Gabber": "A genuinely wide spread — UK garage's bounce at one end, gabber's distorted extreme at the other.",
  "Hardcore / Gabber": "Very fast, distorted kicks — the hardcore/gabber end of the spectrum.",
  "Hip Hop": "Rap and hip hop — UK and international, live MCs through to full crews.",
  "House / Dance": "Classic four-to-the-floor house built for dancing.",
  "House / UK Garage": "Four-to-the-floor house crossed with UK garage's bounce and skip.",
  "Hyperpop / Party": "Hyperpop's sugar-rush, genre-warping energy built for a party crowd.",
  "Indie / Alt Rock": "Guitar-led indie and alternative rock, outside the DJ/electronic lineup.",
  "Irish Folk / Trad": "Traditional Irish folk, played live and built for a sing-along.",
  "Jungle": "Chopped breakbeats and reggae-sampling bass at jungle's classic, rawer tempo — the genre drum & bass grew out of.",
  "Metal": "Heavy, guitar-driven metal — metalcore through to extreme/death metal.",
  "Party / Playback Sets": "Themed nostalgia/playback sets built around a single album or era.",
  "Party / Variety": "Feel-good party sets — a bit of everything, low on pretension.",
  "Pop / Dance": "Chart-pop and Eurodance built for a singalong, not a serious DJ set.",
  "Psytrance / Trance": "Fast, hypnotic, high-energy trance and psytrance.",
  "Punk": "Loud, fast, guitar-led punk.",
  "Reggae": "Classic and modern reggae — song-based, distinct from dub's heavier studio-effects cousin.",
  "Ska / Punk": "Ska's off-beat horns and skank rhythm fused with punk's speed and attitude.",
  "Swing / Variety": "Swing-era music and variety entertainment, live and danceable.",
  "Talks / Community": "Panels, workshops and community-led conversation rather than a DJ set.",
  "Techno / Electro": "Driving, machine-built techno and electro.",
  "Welfare / Support": "On-site welfare support and peer-led meetings, not a performance space.",
  "Workshop / Craft": "Hands-on making and repair workshops rather than a stage.",
  "World / Eclectic": "Global sounds and genre-blending selections.",
  "Unconfirmed": "Genre not confirmed yet — check the app or ask on-site."
};
function genreDescriptorText(genre){ return GENRE_INFO[genre] || ""; }
// For acts with no researched bio (js/artist-bios.js), builds a fuller
// line than the flat genre blurb alone — still only from real signals
// already in the name/lineup data (format, pairing), never invented
// facts about the act itself.
function detectActFormat(name){
  if(/\bb2b\b/i.test(name)) return "b2b";
  if(/\bft\.?\s|feat\.?\s/i.test(name)) return "guest";
  if(/\blive\b/i.test(name)) return "live";
  if(/\btakeover\b/i.test(name)) return "takeover";
  return null;
}
function composedFallbackBio(a){
  const blurb = genreDescriptorText(genreOf(a));
  const format = detectActFormat(a.name);
  const bits = [];
  if(blurb) bits.push(blurb);
  if(format === "b2b") bits.push("A back-to-back pairing sharing the decks for this slot.");
  else if(format === "guest") bits.push("Billed with a guest MC or vocalist alongside the DJ/producer.");
  else if(format === "live") bits.push("Billed as a live set rather than a DJ mix.");
  else if(format === "takeover") bits.push("A crew/collective takeover slot rather than a single named act.");
  return bits.join(" ");
}
// Researched, artist-specific one-liners (real sound/style, not the
// generic per-genre blurb above) — keyed by exact artist name, filled
// in from js/artist-bios.js. Falls back to the genre-level description
// when an act has no specific entry yet.
function artistBioText(name){ return (window.ARTIST_BIOS && window.ARTIST_BIOS[name]) || ""; }
// For "X B2B Y" (and "... Ft. Z" / "... w/ Z") billings with no dedicated
// combo bio, split into individual people and look each one up on their
// own, so a known artist's bio still surfaces even when their B2B partner
// doesn't have one. Falls back to "" (and the composed genre blurb) only
// when nobody in the billing has a bio at all.
function artistBioParts(name){
  const bios = window.ARTIST_BIOS || {};
  if(bios[name]) return [{ label: name, bio: bios[name] }];
  if(!/\bb2b\b/i.test(name)) return [];
  const people = name.split(/\s*\bb2b\b\s*/i)
    .flatMap(part => part.split(/\s+(?:ft\.?|feat\.?|w\/)\s+/i))
    .map(p => p.trim())
    .filter(Boolean);
  return people
    .map(p => ({ label: p, bio: bios[p] || "" }))
    .filter(p => p.bio);
}
// Full "genre-desc" markup block for an artist card: a dedicated bio (or
// per-person B2B bios), else the composed genre/format fallback line.
function artistBioBlockHtml(artist){
  const bio = artistBioText(artist.name);
  if(bio) return `<div class="genre-desc">${escapeHtml(bio)}</div>`;
  const parts = artistBioParts(artist.name);
  if(parts.length){
    return parts.map(p => `<div class="genre-desc"><strong>${escapeHtml(p.label)}:</strong> ${escapeHtml(p.bio)}</div>`).join("");
  }
  const gDesc = composedFallbackBio(artist);
  return gDesc ? `<div class="genre-desc">${escapeHtml(gDesc)}</div>` : "";
}

// ===============================
// MUSIC PREVIEWS — Spotify/SoundCloud/YouTube. Needs a network
// connection regardless of a hand-verified ID being on file, unlike the
// rest of this offline-first app — there's no way around that for an
// embedded player or an outbound search link.
//
// Two tiers per platform, chosen per artist at render time:
//  - Verified (window.ARTIST_PREVIEWS[name], see js/artist-previews.js):
//    a real track/video ID someone's actually confirmed belongs to this
//    artist — renders an inline embedded player on tap.
//  - Unverified (the default for almost every artist right now): a
//    "search on <platform>" link pre-filled with the artist's exact
//    name, opened in a new tab. Can never misattribute — it's a search,
//    not a guessed ID — so every one of the 1000+ artists gets a
//    working button with zero manual verification needed.
// ===============================
// Case-insensitive lookup — some artists bill themselves in ALL CAPS
// (SHERELLE) or otherwise differently-cased than how they show up in
// the lineup data, and an exact-case match would silently miss those.
// Built once from window.ARTIST_PREVIEWS and cached; a fresh copy of
// that object (e.g. after editing artist-previews.js) invalidates it.
let _artistPreviewsLowerSrc = null, _artistPreviewsLower = null;
function artistPreviewsLowerMap(){
  const src = window.ARTIST_PREVIEWS || {};
  if(_artistPreviewsLowerSrc !== src){
    _artistPreviewsLowerSrc = src;
    _artistPreviewsLower = {};
    Object.keys(src).forEach(k=> _artistPreviewsLower[k.toLowerCase()] = src[k]);
  }
  return _artistPreviewsLower;
}
function artistPreviewEntry(name){
  return artistPreviewsLowerMap()[(name || "").toLowerCase()] || null;
}
// Splits a "X B2B Y" (or "... Ft. Z" / "... w/ Z") billing into
// individual names so each half can get its own verified-or-search
// preview row — same split logic as artistBioParts() above. A billing
// with no B2B/ft/feat/w in it returns just itself, unchanged.
function artistPreviewNameParts(name){
  if(!/\bb2b\b/i.test(name)) return [name];
  return name.split(/\s*\bb2b\b\s*/i)
    .flatMap(part => part.split(/\s+(?:ft\.?|feat\.?|w\/)\s+/i))
    .map(p => p.trim())
    .filter(Boolean);
}

function previewSearchUrl(platform, name){
  const q = encodeURIComponent(name);
  if(platform === "spotify") return `https://open.spotify.com/search/${q}`;
  if(platform === "soundcloud") return `https://soundcloud.com/search?q=${q}`;
  if(platform === "youtube") return `https://www.youtube.com/results?search_query=${q}`;
  return "#";
}

const PREVIEW_PLATFORMS = [
  { key:"spotify", label:"Spotify", icon:"🟢" },
  { key:"soundcloud", label:"SoundCloud", icon:"🟠" },
  { key:"youtube", label:"YouTube", icon:"🔴" }
];

// A verified value that embeds inline (a real preview player, not just
// a link). Spotify's artist-page embed plays 30s previews of an
// artist's popular tracks, so spotifyArtist alone is enough — no need
// to pin a specific track. spotifyTrack (if ever added) takes priority
// since it's more specific. SoundCloud's widget accepts a bare profile
// URL too. YouTube has no equivalent "embed a channel" option, so it
// only embeds when a specific verified video ID exists.
function previewEmbeddableValue(entry, platformKey){
  if(!entry) return null;
  if(platformKey === "spotify") return entry.audioPreview || entry.spotifyTrack || entry.spotifyArtist || null;
  if(platformKey === "soundcloud") return entry.soundcloud || null;
  if(platformKey === "youtube") return entry.youtube || null;
  return null;
}
// A verified value that opens directly (a real confirmed profile/
// channel) when there's nothing to embed — still strictly better than
// a generic search, since it's guaranteed to be the right artist.
function previewLinkOutValue(entry, platformKey){
  if(!entry) return null;
  if(platformKey === "youtube") return entry.youtubeChannel || null;
  return null;
}

function previewEmbedHtml(platform, entry){
  let src = null, height = 120;
  if(platform === "spotify" && entry.audioPreview){
    return `<div class="audio-preview-card">
      <div class="audio-preview-label">🟢 30-second Spotify preview</div>
      <audio controls preload="none" src="${entry.audioPreview}"></audio>
    </div>`;
  } else if(platform === "spotify"){
    const id = entry.spotifyTrack || entry.spotifyArtist;
    if(id) src = `https://open.spotify.com/embed/${entry.spotifyTrack ? "track" : "artist"}/${encodeURIComponent(id)}`;
    height = 152;
  } else if(platform === "soundcloud" && entry.soundcloud){
    src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(entry.soundcloud)}&color=%23f2a83c&auto_play=false&visual=false`;
  } else if(platform === "youtube" && entry.youtube){
    src = `https://www.youtube.com/embed/${encodeURIComponent(entry.youtube)}`;
    height = 180;
  }
  if(!src) return "";
  return `<iframe class="preview-iframe" src="${src}" width="100%" height="${height}" frameborder="0" allow="autoplay; encrypted-media" loading="lazy"></iframe>`;
}

// One platform-button row (+ its own embed slot) for a single name.
// showLabel prints a small name heading above the row — used only when
// a B2B billing has been split into more than one row, so it's clear
// whose buttons are whose; a lone artist's name is already shown right
// above this block by the caller, so it stays off there.
function previewRowHtml(name, entry, showLabel){
  entry = entry || {};
  const buttons = PREVIEW_PLATFORMS.map(p=>{
    const verified = !!(previewEmbeddableValue(entry, p.key) || previewLinkOutValue(entry, p.key));
    return `<button class="preview-btn${verified ? " verified" : ""}" data-platform="${p.key}" data-artist="${escapeHtml(name)}">${p.icon} ${p.label}${verified ? " ▶" : ""}</button>`;
  }).join("");
  const instaBtn = entry.instagram ? `<button class="preview-btn verified" data-platform="instagram" data-artist="${escapeHtml(name)}">📸 Instagram</button>` : "";
  const label = showLabel ? `<div class="empty-note" style="margin-top:6px; font-size:11px; font-weight:700;">${escapeHtml(name)}</div>` : "";
  return `${label}<div class="preview-row">${buttons}${instaBtn}</div><div class="preview-embed" style="display:none;"></div>`;
}

// Shared by the Lineup list and the timeline detail modal —
// wirePreviewButtons() below does the actual click wiring after this
// HTML lands in the DOM. A "X B2B Y" billing gets one row per person,
// each independently verified-or-search, rather than one row that can
// only ever represent one half of the billing (or neither).
function artistPreviewBlockHtml(artist){
  const names = artistPreviewNameParts(artist.name);
  if(names.length <= 1) return previewRowHtml(artist.name, artistPreviewEntry(artist.name), false);
  return names.map(n=> previewRowHtml(n, artistPreviewEntry(n), true)).join("");
}

// Delegated wiring, safe to call repeatedly on re-render — looks up the
// live artist name from the button's own data attribute rather than
// closing over anything, so it works identically whether it's inside a
// Lineup card or the timeline modal.
function wirePreviewButtons(container){
  if(!container) return;
  container.querySelectorAll(".preview-row").forEach(row=>{
    const embedBox = row.nextElementSibling;
    row.querySelectorAll(".preview-btn").forEach(btn=>{
      btn.onclick = (e)=>{
        e.stopPropagation();
        const platform = btn.dataset.platform;
        const name = btn.dataset.artist;
        const entry = artistPreviewEntry(name) || {};
        if(platform === "instagram"){
          if(entry.instagram) window.open(entry.instagram, "_blank", "noopener");
          return;
        }
        const embeddableVal = previewEmbeddableValue(entry, platform);
        const linkOutVal = previewLinkOutValue(entry, platform);
        if(embeddableVal && embedBox){
          embedBox.innerHTML = previewEmbedHtml(platform, entry);
          embedBox.style.display = "";
        } else if(linkOutVal){
          window.open(linkOutVal, "_blank", "noopener");
        } else {
          window.open(previewSearchUrl(platform, name), "_blank", "noopener");
        }
      };
    });
  });
}

// Short, auto-composed line built only from data already in the app
// (stage, genre, set length) — not a fabricated bio, just context.
function artistDescriptor(a){
  const g = genreOf(a);
  const bits = [];
  if(a.start && a.end && a.day && a.day !== "TBC"){
    const mins = toMinutes(a.day, a.end) !== null && toMinutes(a.day, a.start) !== null
      ? (()=>{ let d = toMinutes(a.day, a.end) - toMinutes(a.day, a.start); if(d <= 0) d += 1440; return d; })()
      : null;
    if(mins) bits.push(`~${mins >= 60 ? Math.round(mins/60*10)/10 + "hr" : mins + "min"} set`);
  }
  bits.push(`${a.stage}`);
  if(g && g !== "Unconfirmed") bits.push(g);
  return bits.join(" · ");
}

// AUTO-GENERATED:LINEUP:START — regenerated by scripts/sync-boomtown-lineup.mjs
const artists = [
  // ================= WED =================
  // --- Wed: Agents of Change HQ ---
  {name:"Agents of Change HQ",stage:"Agents of Change HQ",day:"Wed",start:"10:00",end:"20:00"},
  {name:"Giant Triplets",stage:"Agents of Change HQ",day:"Wed",start:"11:00",end:"14:00"},
  {name:"Weaving Change",stage:"Agents of Change HQ",day:"Wed",start:"12:00",end:"18:00"},
  {name:"Giant Triplets",stage:"Agents of Change HQ",day:"Wed",start:"16:00",end:"19:00"},
  // --- Wed: Airetiko ---
  {name:"Airetiko Trapeze",stage:"Airetiko",day:"Wed",start:"13:00",end:"15:00"},
  {name:"Airetiko Giant Marionettes",stage:"Airetiko",day:"Wed",start:"15:00",end:"17:00"},
  // --- Wed: Ancient Futures ---
  {name:"Ancient Futures Opening Ceremony",stage:"Ancient Futures",day:"Wed",start:"15:00",end:"16:00"},
  {name:"Opening cermony",stage:"Ancient Futures",day:"Wed",start:"16:00",end:"17:00"},
  {name:"Breathe Reconnect",stage:"Ancient Futures",day:"Wed",start:"17:00",end:"19:00"},
  {name:"Flow dance",stage:"Ancient Futures",day:"Wed",start:"19:00",end:"21:00"},
  {name:"Yoga Sound Baths",stage:"Ancient Futures",day:"Wed",start:"09:00",end:"11:00"},
  // --- Wed: Blink Mental Health ---
  {name:"Blink Mental Health Chill-Out Space",stage:"Blink Mental Health",day:"Wed",start:"10:00",end:"19:30"},
  // --- Wed: Cas's Costumes ---
  {name:"Engineers of Desire",stage:"Cas's Costumes",day:"Wed",start:"10:00",end:"18:00"},
  // --- Wed: Circus Tent ---
  {name:"Contemporary Dance",stage:"Circus Tent",day:"Wed",start:"11:00",end:"12:00"},
  {name:"Wye Circus Skills, Poi, Flower Stick, Hat Juggling",stage:"Circus Tent",day:"Wed",start:"12:00",end:"14:00"},
  {name:"Wye Circus Skills, Juggling, Staff, Dapo Star",stage:"Circus Tent",day:"Wed",start:"14:00",end:"16:00"},
  {name:"HOOPGIRLS",stage:"Circus Tent",day:"Wed",start:"16:00",end:"18:00"},
  {name:"Bubblology",stage:"Circus Tent",day:"Wed",start:"18:00",end:"19:00"},
  {name:"Wye Circus Fire Show",stage:"Circus Tent",day:"Wed",start:"21:00",end:"22:00"},
  {name:"Energising Yoga",stage:"Circus Tent",day:"Wed",start:"09:00",end:"10:00"},
  // --- Wed: Climate Live ---
  {name:"Climate Live Opening",stage:"Climate Live",day:"Wed",start:"12:00",end:"20:00"},
  {name:"Radical Rosettes",stage:"Climate Live",day:"Wed",start:"15:00",end:"16:00"},
  {name:"Doof Stick Making",stage:"Climate Live",day:"Wed",start:"16:15",end:"17:15"},
  {name:"Finding Joy & Climate Connection Through Dance",stage:"Climate Live",day:"Wed",start:"17:30",end:"18:30"},
  // --- Wed: Cocaine Anonymous ---
  {name:"Cocaine Anonymous Meeting",stage:"Cocaine Anonymous",day:"Wed",start:"11:00",end:"12:00"},
  {name:"Cocaine Anonymous Meeting",stage:"Cocaine Anonymous",day:"Wed",start:"18:00",end:"19:00"},
  // --- Wed: Community Fire ---
  {name:"Community Fire (Running 24hrs)",stage:"Community Fire",day:"Wed",start:"12:00",end:"00:00"},
  {name:"Thrutopia Fire Opening Ceremony",stage:"Community Fire",day:"Wed",start:"13:00",end:"13:45"},
  // --- Wed: Craft Tent ---
  {name:"Junk Jewelery",stage:"Craft Tent",day:"Wed",start:"10:00",end:"18:00"},
  {name:"Botanical Fascinators",stage:"Craft Tent",day:"Wed",start:"10:00",end:"18:00"},
  {name:"Hitty Hitty Bang Bang",stage:"Craft Tent",day:"Wed",start:"10:00",end:"18:00"},
  // --- Wed: Crafty Rascals ---
  {name:"Crafty Rascals",stage:"Crafty Rascals",day:"Wed",start:"10:00",end:"18:00"},
  // --- Wed: Energy Garden ---
  {name:"Energy Garden Opening",stage:"Energy Garden",day:"Wed",start:"12:00",end:"22:00"},
  {name:"Solar Panel Building Workshop",stage:"Energy Garden",day:"Wed",start:"13:00",end:"15:00"},
  // --- Wed: Games Lounge ---
  {name:"Games Lounge (Running 24hrs)",stage:"Games Lounge",day:"Wed",start:"12:00",end:"00:00"},
  // --- Wed: Garden ---
  {name:"Wildflower Fortunes",stage:"Garden",day:"Wed",start:"10:00",end:"18:00"},
  // --- Wed: Hapitat ---
  {name:"Hapitat",stage:"Hapitat",day:"Wed",start:"10:00",end:"18:00"},
  // --- Wed: Hidden Woods ---
  {name:"Cal Jader (Movimientos)",stage:"Hidden Woods",day:"Wed",start:"16:00",end:"17:30"},
  {name:"Bryte & Burland",stage:"Hidden Woods",day:"Wed",start:"17:30",end:"18:30"},
  {name:"Marla Kether",stage:"Hidden Woods",day:"Wed",start:"18:30",end:"19:30"},
  {name:"The Nextmen",stage:"Hidden Woods",day:"Wed",start:"19:30",end:"21:00"},
  {name:"OneDa",stage:"Hidden Woods",day:"Wed",start:"21:00",end:"22:00"},
  {name:"Aziza Jaye",stage:"Hidden Woods",day:"Wed",start:"22:00",end:"23:00"},
  // --- Wed: Narcotics Anonymous ---
  {name:"Narcotic Anonymous Meeting",stage:"Narcotics Anonymous",day:"Wed",start:"13:00",end:"14:00"},
  {name:"Narcotic Anonymous Meeting",stage:"Narcotics Anonymous",day:"Wed",start:"08:00",end:"09:00"},
  // --- Wed: Permaculture ---
  {name:"Touch grass: An arrival circle for gorunding and connection",stage:"Permaculture",day:"Wed",start:"12:00",end:"13:00"},
  {name:"Lift eachother up: Acroyoga for connection and play",stage:"Permaculture",day:"Wed",start:"13:30",end:"15:00"},
  {name:"Tiny spoons for uncertain times: A miniature woodcarving workshop",stage:"Permaculture",day:"Wed",start:"15:30",end:"16:30"},
  {name:"Beyond bosses: Practical tools for more human workplaces",stage:"Permaculture",day:"Wed",start:"17:00",end:"18:00"},
  // --- Wed: Rebel Girls Club ---
  {name:"Opening Ceremony with Everglowing & Find Your Flow",stage:"Rebel Girls Club",day:"Wed",start:"16:00",end:"16:40"},
  {name:"Psycosomatic yoga with Yuliet",stage:"Rebel Girls Club",day:"Wed",start:"17:00",end:"18:00"},
  {name:"Somatic dance to Twerk with Sofia & Ivy",stage:"Rebel Girls Club",day:"Wed",start:"18:30",end:"19:30"},
  // --- Wed: Reel News ---
  {name:"Wondergupta",stage:"Reel News",day:"Wed",start:"13:15",end:"14:15"},
  {name:"Warrior Tales & Demloxx",stage:"Reel News",day:"Wed",start:"14:15",end:"14:45"},
  {name:"Brockwell Park Rangers",stage:"Reel News",day:"Wed",start:"14:45",end:"15:15"},
  {name:"O'Connell & Co",stage:"Reel News",day:"Wed",start:"15:15",end:"16:15"},
  {name:"Music in my underpants",stage:"Reel News",day:"Wed",start:"16:15",end:"17:00"},
  {name:"Taygeta & Seb",stage:"Reel News",day:"Wed",start:"17:00",end:"18:00"},
  {name:"Nowt",stage:"Reel News",day:"Wed",start:"18:00",end:"18:45"},
  {name:"GDSMRCY",stage:"Reel News",day:"Wed",start:"18:45",end:"19:30"},
  {name:"Break the Code",stage:"Reel News",day:"Wed",start:"19:30",end:"21:00"},
  // --- Wed: Reparium ---
  {name:"Repairium",stage:"Reparium",day:"Wed",start:"14:00",end:"18:00"},
  // --- Wed: Spinney Hollow ---
  {name:"Spinney Hollow - Banquet of Art table",stage:"Spinney Hollow",day:"Wed",start:"10:00",end:"18:00"},
  {name:"Spinney Hollow - Traditional Green Wood Work Workshop",stage:"Spinney Hollow",day:"Wed",start:"10:00",end:"18:00"},
  // --- Wed: Tangled Roots ---
  {name:"Lionpulse x Sinai",stage:"Tangled Roots",day:"Wed",start:"16:00",end:"17:00"},
  {name:"Roots Ginjah",stage:"Tangled Roots",day:"Wed",start:"17:00",end:"18:00"},
  {name:"DubTastic Music Ft. Youngalist",stage:"Tangled Roots",day:"Wed",start:"18:00",end:"19:00"},
  {name:"Jam Jah Sound",stage:"Tangled Roots",day:"Wed",start:"19:00",end:"20:00"},
  {name:"Vixen Sound",stage:"Tangled Roots",day:"Wed",start:"20:00",end:"21:00"},
  {name:"An Dannsa Dub (Live Dub Set) Ft. Wends",stage:"Tangled Roots",day:"Wed",start:"21:00",end:"22:00"},
  // --- Wed: The Magic Teapot ---
  {name:"The Magic Teapot",stage:"The Magic Teapot",day:"Wed",start:"12:00",end:"00:00"},
  // --- Wed: Tinker Station ---
  {name:"Tinker Station",stage:"Tinker Station",day:"Wed",start:"10:00",end:"18:00"},
  // --- Wed: Twisted Time Machine (Bad Apple Bar) ---
  {name:"ONE DIRECTION / ONE WELCOME PARTY",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Wed",start:"16:00",end:"17:00"},
  {name:"FAR OUT MAN :  PSYCHADELIC 60S",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Wed",start:"17:00",end:"18:00"},
  {name:"LINKIN PARK : HYBRID THEORY (Album Playback)",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Wed",start:"18:00",end:"19:00"},
  {name:"FUNK & SEOUL : K-POP RAVE",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Wed",start:"19:00",end:"20:00"},
  {name:"ALAN CLUSIVE'S EUROTRASH MINI DISCO",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Wed",start:"20:00",end:"21:00"},
  {name:"KNIGHT CLUB : THE MEDIEVAL RAVE",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Wed",start:"21:00",end:"22:00"},
  {name:"CIDER DRINKERS ASSEMBLY",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Wed",start:"22:00",end:"23:00"},
  // --- Wed: XR ---
  {name:"Last Chance Salon",stage:"XR",day:"Wed",start:"13:00",end:"19:00"},
  {name:"Art Blocking and Costume Pimping",stage:"XR",day:"Wed",start:"13:00",end:"18:30"},
  {name:"Tea Ladies",stage:"XR",day:"Wed",start:"14:00",end:"18:00"},
  {name:"Cassandra the Oracle",stage:"XR",day:"Wed",start:"14:00",end:"16:00"},
  {name:"Strictly Burning Ballroom",stage:"XR",day:"Wed",start:"18:00",end:"18:30"},
  // ================= THU =================
  // --- Thu: Acid Leak ---
  {name:"DJ Zeno",stage:"Acid Leak",day:"Thu",start:"14:00",end:"15:00"},
  {name:"Trooper",stage:"Acid Leak",day:"Thu",start:"15:00",end:"16:00"},
  {name:"F-Tek",stage:"Acid Leak",day:"Thu",start:"16:00",end:"17:00"},
  {name:"DJ Kaynasty",stage:"Acid Leak",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Dilks",stage:"Acid Leak",day:"Thu",start:"18:00",end:"19:00"},
  {name:"S.A.S",stage:"Acid Leak",day:"Thu",start:"19:00",end:"20:00"},
  {name:"Chief303",stage:"Acid Leak",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Benji303",stage:"Acid Leak",day:"Thu",start:"21:00",end:"22:00"},
  {name:"Mattykore",stage:"Acid Leak",day:"Thu",start:"22:00",end:"23:00"},
  {name:"Cyber Steve",stage:"Acid Leak",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Agents of Change HQ ---
  {name:"Agents of Change HQ",stage:"Agents of Change HQ",day:"Thu",start:"10:00",end:"20:00"},
  {name:"Weaving Change",stage:"Agents of Change HQ",day:"Thu",start:"10:00",end:"18:00"},
  {name:"Giant Triplets",stage:"Agents of Change HQ",day:"Thu",start:"16:00",end:"19:00"},
  // --- Thu: Airetiko ---
  {name:"Airetiko Trapeze",stage:"Airetiko",day:"Thu",start:"11:00",end:"13:00"},
  {name:"Airetiko Giant Marionettes",stage:"Airetiko",day:"Thu",start:"13:00",end:"15:00"},
  {name:"Airetiko Trapeze",stage:"Airetiko",day:"Thu",start:"15:00",end:"17:00"},
  // --- Thu: Anara Forest ---
  {name:"Jimbitch B2B Stan Da Man [Uncommon Records Takeover]",stage:"Anara Forest",day:"Thu",start:"14:00",end:"15:00"},
  {name:"Astar B2B Kaisha [Uncommon Records Takeover]",stage:"Anara Forest",day:"Thu",start:"15:00",end:"16:00"},
  {name:"G-Class B2B RJD [Uncommon Records Takeover]",stage:"Anara Forest",day:"Thu",start:"16:00",end:"17:00"},
  {name:"Bassi B2B Charli Brix [Flexout Audio Takeover]",stage:"Anara Forest",day:"Thu",start:"17:00",end:"18:30",genre:"Jungle"},
  {name:"Para B2B Umbra Ft. Strategy [Flexout Audio Takeover]",stage:"Anara Forest",day:"Thu",start:"18:30",end:"20:00",genre:"Jungle"},
  {name:"Sydney Bryce - Live PA [Flexout Audio Takeover]",stage:"Anara Forest",day:"Thu",start:"20:00",end:"21:00",genre:"Jungle"},
  {name:"QZB Ft. Ellis Esco [Flexout Audio Takeover]",stage:"Anara Forest",day:"Thu",start:"21:00",end:"22:00",genre:"Jungle"},
  {name:"TeeBee Ft. MC Fokus [Flexout Audio Takeover]",stage:"Anara Forest",day:"Thu",start:"22:00",end:"23:00",genre:"Jungle"},
  {name:"Amoss Ft. MC Fokus [Flexout Audio Takeover]",stage:"Anara Forest",day:"Thu",start:"23:00",end:"00:00",genre:"Jungle"},
  // --- Thu: Ancient Futures ---
  {name:"Scroll Loop Bingo",stage:"Ancient Futures",day:"Thu",start:"11:30",end:"12:30"},
  {name:"Divine union in a divide world",stage:"Ancient Futures",day:"Thu",start:"13:00",end:"15:00"},
  {name:"The Extraordinary Ordinary",stage:"Ancient Futures",day:"Thu",start:"15:30",end:"16:30"},
  {name:"Social psychedelics: Spirit and science",stage:"Ancient Futures",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Medicine dance journey",stage:"Ancient Futures",day:"Thu",start:"18:30",end:"20:30"},
  {name:"Flow Yoga",stage:"Ancient Futures",day:"Thu",start:"09:00",end:"11:00"},
  // --- Thu: Blink Mental Health ---
  {name:"Blink Mental Health Chill-Out Space",stage:"Blink Mental Health",day:"Thu",start:"10:00",end:"19:30"},
  // --- Thu: Botanica Zoo ---
  {name:"DJ Lessons",stage:"Botanica Zoo",day:"Thu",start:"18:00",end:"19:00"},
  {name:"Court Jester B2B Daddy Dopamine",stage:"Botanica Zoo",day:"Thu",start:"19:00",end:"20:00"},
  {name:"Niki Louder VS James Cunt",stage:"Botanica Zoo",day:"Thu",start:"20:00",end:"21:00"},
  {name:"DJ Dizzle B2B Peggy Vienetta [Lively Up takeover]",stage:"Botanica Zoo",day:"Thu",start:"21:00",end:"22:00"},
  {name:"Denis The Menis [Lively Up takeover]",stage:"Botanica Zoo",day:"Thu",start:"22:00",end:"23:00"},
  {name:"Slanty [Lively Up takeover]",stage:"Botanica Zoo",day:"Thu",start:"23:00",end:"23:55"},
  // --- Thu: Busker's Wharf ---
  {name:"The Lobster Cabaret",stage:"Busker's Wharf",day:"Thu",start:"19:30",end:"21:00"},
  // --- Thu: Cas's Costumes ---
  {name:"Engineers of Desire",stage:"Cas's Costumes",day:"Thu",start:"10:00",end:"18:00"},
  // --- Thu: Circus Tent ---
  {name:"Belly Dance",stage:"Circus Tent",day:"Thu",start:"10:00",end:"11:00"},
  {name:"Contemporary Dance",stage:"Circus Tent",day:"Thu",start:"10:00",end:"11:00"},
  {name:"Wye Circus Skills, Juggling, Staff, Dapo Star",stage:"Circus Tent",day:"Thu",start:"12:00",end:"14:00"},
  {name:"HOOPGIRLS",stage:"Circus Tent",day:"Thu",start:"14:00",end:"16:00"},
  {name:"Wye Circus Skills, Poi, Flower Stick, Hat Juggling",stage:"Circus Tent",day:"Thu",start:"16:00",end:"18:00"},
  {name:"Inspired Breath",stage:"Circus Tent",day:"Thu",start:"18:00",end:"19:00"},
  {name:"Wye Circus Fire Show",stage:"Circus Tent",day:"Thu",start:"21:00",end:"22:00"},
  {name:"Energising Yoga",stage:"Circus Tent",day:"Thu",start:"09:00",end:"10:00"},
  // --- Thu: Climate Live ---
  {name:"Bag Charm Making - Weaving Change",stage:"Climate Live",day:"Thu",start:"10:30",end:"11:30"},
  {name:"Beads & Breathe",stage:"Climate Live",day:"Thu",start:"11:45",end:"12:45"},
  {name:"Climate Live Opening",stage:"Climate Live",day:"Thu",start:"12:00",end:"20:00"},
  {name:"Music X Climate Zine-Making",stage:"Climate Live",day:"Thu",start:"13:00",end:"14:00"},
  {name:"Jungyals and Gays: Festival Flag Making and Community Conversations",stage:"Climate Live",day:"Thu",start:"14:15",end:"15:15"},
  {name:"Collective Climate Collage Making - Quirky Academy CIC",stage:"Climate Live",day:"Thu",start:"15:30",end:"16:30"},
  {name:"Jewellery & Trinket Making with Recycled Cans - EVA",stage:"Climate Live",day:"Thu",start:"16:45",end:"17:45"},
  {name:"Cocaine Anonymous Meeting",stage:"Climate Live",day:"Thu",start:"18:00",end:"19:00"},
  // --- Thu: Cocaine Anonymous ---
  {name:"Cocaine Anonymous Meeting",stage:"Cocaine Anonymous",day:"Thu",start:"11:00",end:"12:00"},
  // --- Thu: Community Fire ---
  {name:"Community Fire (Running 24hrs)",stage:"Community Fire",day:"Thu",start:"12:00",end:"00:00"},
  // --- Thu: Craft Tent ---
  {name:"Botanical Fascinators",stage:"Craft Tent",day:"Thu",start:"10:00",end:"18:00"},
  {name:"Hitty Hitty Bang Bang",stage:"Craft Tent",day:"Thu",start:"10:00",end:"18:00"},
  {name:"Junk Jewelery",stage:"Craft Tent",day:"Thu",start:"10:00",end:"18:00"},
  // --- Thu: Crafty Rascals ---
  {name:"Crafty Rascals",stage:"Crafty Rascals",day:"Thu",start:"10:00",end:"18:00"},
  // --- Thu: Deviant Lounge ---
  {name:"Wrong'un Crew",stage:"Deviant Lounge",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Church of Donkology",stage:"Deviant Lounge",day:"Thu",start:"21:00",end:"22:00"},
  {name:"DJ Safe N Sound",stage:"Deviant Lounge",day:"Thu",start:"22:00",end:"23:00"},
  {name:"3DMA",stage:"Deviant Lounge",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: E Numbers ---
  {name:"Kid Cosmit",stage:"E Numbers",day:"Thu",start:"19:00",end:"19:45"},
  {name:"Lounicorn",stage:"E Numbers",day:"Thu",start:"19:45",end:"20:30"},
  {name:"Theia's Orbit",stage:"E Numbers",day:"Thu",start:"20:30",end:"21:15"},
  {name:"Fuck Bees",stage:"E Numbers",day:"Thu",start:"21:15",end:"21:45"},
  {name:"D0LLSW4G",stage:"E Numbers",day:"Thu",start:"21:45",end:"22:30"},
  {name:"Babiest Baby",stage:"E Numbers",day:"Thu",start:"22:30",end:"23:15"},
  {name:"Charles the Princess the DJ",stage:"E Numbers",day:"Thu",start:"23:15",end:"00:00"},
  // --- Thu: End of the Line ---
  {name:"Fiddler on the Doof",stage:"End of the Line",day:"Thu",start:"14:00",end:"14:50"},
  {name:"Top of the Donks featuring Kitty & Tiggy (DONKLINE TAKEOVER)",stage:"End of the Line",day:"Thu",start:"14:50",end:"15:40"},
  {name:"RedSKare b2b Misterrcha (DONKLINE TAKEOVER)",stage:"End of the Line",day:"Thu",start:"15:40",end:"16:30"},
  {name:"Gash b2b Bubble07",stage:"End of the Line",day:"Thu",start:"16:30",end:"17:20"},
  {name:"Gash b2b Bubble07 (DONKLINE TAKEOVER)",stage:"End of the Line",day:"Thu",start:"17:20",end:"18:10"},
  {name:"Tdawgwillywacka b2b Deadbeat UK",stage:"End of the Line",day:"Thu",start:"17:20",end:"18:10"},
  {name:"Finessa and DJ Wii Sports ft. Reptile B",stage:"End of the Line",day:"Thu",start:"18:10",end:"19:00"},
  {name:"Foreigna",stage:"End of the Line",day:"Thu",start:"19:00",end:"20:00"},
  {name:"DJ Shnoo",stage:"End of the Line",day:"Thu",start:"20:00",end:"20:45"},
  {name:"Merkäta",stage:"End of the Line",day:"Thu",start:"20:45",end:"21:30"},
  {name:"Nego",stage:"End of the Line",day:"Thu",start:"21:30",end:"22:15"},
  {name:"Riguana",stage:"End of the Line",day:"Thu",start:"22:15",end:"23:00"},
  {name:"NORTY",stage:"End of the Line",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Energy Garden ---
  {name:"Energy Garden Opening",stage:"Energy Garden",day:"Thu",start:"12:00",end:"22:00"},
  // --- Thu: Foggers Mill ---
  {name:"The Back Wood Redeemers",stage:"Foggers Mill",day:"Thu",start:"13:00",end:"13:40"},
  {name:"Gurt Dog",stage:"Foggers Mill",day:"Thu",start:"14:00",end:"15:00"},
  {name:"Got Worms",stage:"Foggers Mill",day:"Thu",start:"15:30",end:"16:30"},
  {name:"Two Days as a Chimp",stage:"Foggers Mill",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Dog House Boat Boys",stage:"Foggers Mill",day:"Thu",start:"18:30",end:"19:30"},
  {name:"The Back Wood Redeemers",stage:"Foggers Mill",day:"Thu",start:"20:00",end:"21:00"},
  {name:"The Showhawk Duo",stage:"Foggers Mill",day:"Thu",start:"21:30",end:"22:30"},
  {name:"Shanghai Treason",stage:"Foggers Mill",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Full Moon Ballroom ---
  {name:"Mad Apple Circus",stage:"Full Moon Ballroom",day:"Thu",start:"13:15",end:"14:15"},
  {name:"She's Got Brass",stage:"Full Moon Ballroom",day:"Thu",start:"14:45",end:"15:45"},
  {name:"Girl In The Year Above",stage:"Full Moon Ballroom",day:"Thu",start:"16:20",end:"17:00"},
  {name:"GrooveLine",stage:"Full Moon Ballroom",day:"Thu",start:"17:45",end:"18:45"},
  {name:"CLADA",stage:"Full Moon Ballroom",day:"Thu",start:"19:15",end:"20:15"},
  {name:"Agbeko",stage:"Full Moon Ballroom",day:"Thu",start:"20:45",end:"22:00"},
  {name:"Franz Von",stage:"Full Moon Ballroom",day:"Thu",start:"22:30",end:"00:00"},
  // --- Thu: Games Lounge ---
  {name:"Games Lounge (Running 24hrs)",stage:"Games Lounge",day:"Thu",start:"12:00",end:"00:00"},
  // --- Thu: Garden ---
  {name:"Wildflower Fortunes",stage:"Garden",day:"Thu",start:"10:00",end:"18:00"},
  // --- Thu: Hangar 161 ---
  {name:"Music In Our Underpants",stage:"Hangar 161",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Dakka Skanks",stage:"Hangar 161",day:"Thu",start:"18:30",end:"19:30"},
  {name:"Pizzatramp",stage:"Hangar 161",day:"Thu",start:"20:00",end:"21:00"},
  {name:"The Menstrual Cramps",stage:"Hangar 161",day:"Thu",start:"21:30",end:"22:30"},
  {name:"Meryl Streek",stage:"Hangar 161",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Hapitat ---
  {name:"Hapitat",stage:"Hapitat",day:"Thu",start:"10:00",end:"18:00"},
  {name:"Giant Triplets",stage:"Hapitat",day:"Thu",start:"11:00",end:"14:00"},
  // --- Thu: Helix ---
  {name:"ZE:NA",stage:"Helix",day:"Thu",start:"15:00",end:"16:00"},
  {name:"Music from the Mothership",stage:"Helix",day:"Thu",start:"16:00",end:"18:00"},
  {name:"Artemis B2B Esme Banks B2B Fluro",stage:"Helix",day:"Thu",start:"18:00",end:"19:30"},
  {name:"Cheetah B2B Janaway",stage:"Helix",day:"Thu",start:"19:30",end:"21:00"},
  {name:"Toby Ross",stage:"Helix",day:"Thu",start:"21:00",end:"22:30"},
  {name:"Ed Solo",stage:"Helix",day:"Thu",start:"22:30",end:"00:00"},
  // --- Thu: Hidden Woods ---
  {name:"Kaotik Kartel",stage:"Hidden Woods",day:"Thu",start:"13:00",end:"14:30"},
  {name:"Bubski B2B Siraya",stage:"Hidden Woods",day:"Thu",start:"14:30",end:"15:30"},
  {name:"Rea",stage:"Hidden Woods",day:"Thu",start:"15:30",end:"16:30"},
  {name:"Messie",stage:"Hidden Woods",day:"Thu",start:"16:30",end:"17:30"},
  {name:"Baalti",stage:"Hidden Woods",day:"Thu",start:"17:30",end:"18:30"},
  {name:"Hitty",stage:"Hidden Woods",day:"Thu",start:"18:30",end:"19:30"},
  {name:"Jamz Supernova",stage:"Hidden Woods",day:"Thu",start:"19:30",end:"20:30"},
  {name:"Osmosis Jones",stage:"Hidden Woods",day:"Thu",start:"20:30",end:"21:30"},
  {name:"Papa Nugs",stage:"Hidden Woods",day:"Thu",start:"21:30",end:"22:30"},
  {name:"Eats Everything B2B Wonka",stage:"Hidden Woods",day:"Thu",start:"22:30",end:"00:00"},
  // --- Thu: Hotel Paradiso ---
  {name:"DJ Business Lady & Direct Debbie",stage:"Hotel Paradiso",day:"Thu",start:"18:00",end:"19:00"},
  {name:"Asher Ray & Goodfella",stage:"Hotel Paradiso",day:"Thu",start:"19:00",end:"20:00"},
  {name:"WBBL",stage:"Hotel Paradiso",day:"Thu",start:"20:00",end:"21:00"},
  {name:"DJ Hiphoppapotamus & Friends",stage:"Hotel Paradiso",day:"Thu",start:"21:00",end:"22:00"},
  {name:"Kaptin & Dregz",stage:"Hotel Paradiso",day:"Thu",start:"22:00",end:"23:00"},
  {name:"Daddy Skitz & Joe Burn",stage:"Hotel Paradiso",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Infinity ---
  {name:"Desiato DJs",stage:"Infinity",day:"Thu",start:"14:00",end:"16:00"},
  {name:"Hayliegh",stage:"Infinity",day:"Thu",start:"16:00",end:"17:30"},
  {name:"[Paradisco] Brad Bradley B2B Burly Chassis",stage:"Infinity",day:"Thu",start:"17:30",end:"19:30"},
  {name:"[Paradisco] Faith B2B SPICYIVY",stage:"Infinity",day:"Thu",start:"19:30",end:"21:00"},
  {name:"Lips Sealed Club",stage:"Infinity",day:"Thu",start:"21:00",end:"22:30"},
  {name:"Sean Rudz",stage:"Infinity",day:"Thu",start:"22:30",end:"00:00"},
  // --- Thu: Luck Exchange Casino ---
  {name:"Chattering Teeth Races",stage:"Luck Exchange Casino",day:"Thu",start:"19:05",end:"19:10"},
  {name:"Hold Your Horses",stage:"Luck Exchange Casino",day:"Thu",start:"19:10",end:"19:15"},
  {name:"Only Pools And Horses",stage:"Luck Exchange Casino",day:"Thu",start:"19:15",end:"19:20"},
  {name:"Dick Fran Dyke",stage:"Luck Exchange Casino",day:"Thu",start:"19:20",end:"19:25"},
  {name:"Play Your Cards Shite",stage:"Luck Exchange Casino",day:"Thu",start:"19:25",end:"19:40"},
  {name:"Beyblade Tournament",stage:"Luck Exchange Casino",day:"Thu",start:"19:40",end:"19:50"},
  {name:"Is It Piss?",stage:"Luck Exchange Casino",day:"Thu",start:"19:50",end:"20:00"},
  {name:"Dick Fran Dyke",stage:"Luck Exchange Casino",day:"Thu",start:"20:00",end:"20:05"},
  {name:"Wave",stage:"Luck Exchange Casino",day:"Thu",start:"20:05",end:"20:25"},
  {name:"AYVBP",stage:"Luck Exchange Casino",day:"Thu",start:"20:25",end:"20:40"},
  {name:"TOYBOX",stage:"Luck Exchange Casino",day:"Thu",start:"20:40",end:"21:10"},
  // --- Thu: Mining for (g)Old Town ---
  {name:"DJ Shoulda Learnt The Clarinet",stage:"Mining for (g)Old Town",day:"Thu",start:"13:30",end:"14:30"},
  {name:"DJ Sarah Tonin",stage:"Mining for (g)Old Town",day:"Thu",start:"14:30",end:"16:00"},
  {name:"WildSoul",stage:"Mining for (g)Old Town",day:"Thu",start:"16:00",end:"17:30"},
  {name:"MAGGS",stage:"Mining for (g)Old Town",day:"Thu",start:"17:30",end:"19:00"},
  // --- Thu: Nachtlicker ---
  {name:"SHAGGY FX",stage:"Nachtlicker",day:"Thu",start:"17:00",end:"18:00"},
  {name:"SIÂNAGEDDON",stage:"Nachtlicker",day:"Thu",start:"18:00",end:"19:00"},
  {name:"NUKS",stage:"Nachtlicker",day:"Thu",start:"19:00",end:"20:00"},
  {name:"RIZZY & THE GENTS [live]",stage:"Nachtlicker",day:"Thu",start:"20:00",end:"20:45"},
  {name:"THEO SHELDRAKE",stage:"Nachtlicker",day:"Thu",start:"20:45",end:"22:00"},
  {name:"DJ HEADTORCH",stage:"Nachtlicker",day:"Thu",start:"22:00",end:"23:00"},
  {name:"AIRBENDER",stage:"Nachtlicker",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Narcotics Anonymous ---
  {name:"Narcotic Anonymous Meeting",stage:"Narcotics Anonymous",day:"Thu",start:"13:00",end:"14:00"},
  {name:"Narcotic Anonymous Meeting",stage:"Narcotics Anonymous",day:"Thu",start:"08:00",end:"09:00"},
  // --- Thu: Nexus ---
  {name:"Bloco B",stage:"Nexus",day:"Thu",start:"14:00",end:"15:00"},
  {name:"RWKUS: 91 - 94 Jungle Review",stage:"Nexus",day:"Thu",start:"15:30",end:"16:30"},
  {name:"JayaHadADream",stage:"Nexus",day:"Thu",start:"17:00",end:"17:45"},
  {name:"Joe Yorke",stage:"Nexus",day:"Thu",start:"18:30",end:"19:30"},
  {name:"Gurriers",stage:"Nexus",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Komfortrauschen",stage:"Nexus",day:"Thu",start:"21:30",end:"22:30"},
  {name:"Keeno Live Ft. Vibre Strings",stage:"Nexus",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Observatory ---
  {name:"The Observatory Opening",stage:"Observatory",day:"Thu",start:"10:00",end:"11:00"},
  {name:"Your Brain On Yoga",stage:"Observatory",day:"Thu",start:"11:30",end:"12:30"},
  {name:"Move Together, Decide Together: Dancing Towards A New Democracy, Isabella Roberts",stage:"Observatory",day:"Thu",start:"13:00",end:"14:00"},
  {name:"Feeling Seen & Seeing Feeling: Eeg & The Future Of Emotional Design",stage:"Observatory",day:"Thu",start:"14:30",end:"15:30"},
  {name:"Fear & Loathing In Boomtown",stage:"Observatory",day:"Thu",start:"16:00",end:"17:00"},
  {name:"Celebratory Reset Ritual",stage:"Observatory",day:"Thu",start:"17:30",end:"18:30"},
  // --- Thu: Permaculture ---
  {name:"Drawn from the ground: Natural inks, charcoal and figure drawing",stage:"Permaculture",day:"Thu",start:"10:00",end:"11:00"},
  {name:"Lift eachother up: Acroyoga for connection and play",stage:"Permaculture",day:"Thu",start:"11:30",end:"12:30"},
  {name:"The inner compass: Tarot, symbolism and self-trust",stage:"Permaculture",day:"Thu",start:"13:00",end:"14:00"},
  {name:"Mushroom magic: Low-tech growing for curious humans",stage:"Permaculture",day:"Thu",start:"14:30",end:"15:30"},
  {name:"Wild adornment: Willow crowns and headpieces by hand",stage:"Permaculture",day:"Thu",start:"15:30",end:"16:30"},
  {name:"Wearable folklore: Crafting ear cuffs from scrap, wire and found objects",stage:"Permaculture",day:"Thu",start:"17:00",end:"18:00"},
  // --- Thu: PFP Robot ---
  {name:"Tripl3 B",stage:"PFP Robot",day:"Thu",start:"14:00",end:"15:00"},
  {name:"Audio Gutter",stage:"PFP Robot",day:"Thu",start:"15:00",end:"16:00"},
  {name:"AGENT SCULLY",stage:"PFP Robot",day:"Thu",start:"16:00",end:"17:00"},
  {name:"TEOTEK",stage:"PFP Robot",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Special Guest",stage:"PFP Robot",day:"Thu",start:"18:00",end:"19:00"},
  // --- Thu: Rebel Girls Club ---
  {name:"Morning Yoga with Sofia (Find Your Flow)",stage:"Rebel Girls Club",day:"Thu",start:"10:00",end:"11:00"},
  {name:"Movement: Heart - womb connection with Lauren",stage:"Rebel Girls Club",day:"Thu",start:"11:00",end:"12:15"},
  {name:"Nipple Tassel Making with Maisie",stage:"Rebel Girls Club",day:"Thu",start:"13:00",end:"14:00"},
  {name:"Twerk with Ivy Rose (Everglowing)",stage:"Rebel Girls Club",day:"Thu",start:"14:30",end:"15:30"},
  {name:"Daily Sound Bath with Find Your Flow",stage:"Rebel Girls Club",day:"Thu",start:"16:00",end:"16:40"},
  {name:"Herbal Balm Making with Spider",stage:"Rebel Girls Club",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Traditional Burlesque with Everglowing",stage:"Rebel Girls Club",day:"Thu",start:"18:30",end:"19:30"},
  // --- Thu: Reel News ---
  {name:"Drugs, Friends & Music: What does a safe festival need?",stage:"Reel News",day:"Thu",start:"10:30",end:"11:30"},
  {name:"No Pasaran! How to stop the far right",stage:"Reel News",day:"Thu",start:"11:30",end:"12:30"},
  {name:"Luddite Punk",stage:"Reel News",day:"Thu",start:"12:30",end:"13:30"},
  {name:"AGONY & ECSTASY: HOW FOOTBALL HOOLIGANS STARTED RAVING",stage:"Reel News",day:"Thu",start:"13:30",end:"14:00"},
  {name:"ACORN for a Bailiff Free Britain!",stage:"Reel News",day:"Thu",start:"14:00",end:"14:45"},
  {name:"The Global Politics of Food",stage:"Reel News",day:"Thu",start:"14:45",end:"15:45"},
  {name:"Power to the Workers—with AI",stage:"Reel News",day:"Thu",start:"15:45",end:"16:30"},
  {name:"Small Axe: When Underground Music Meets Grassroots Activism",stage:"Reel News",day:"Thu",start:"16:30",end:"17:15"},
  {name:"Thick Richard",stage:"Reel News",day:"Thu",start:"17:15",end:"17:45"},
  {name:"South Lebanon - Frontlines of Resistance",stage:"Reel News",day:"Thu",start:"17:45",end:"18:45"},
  {name:"FILM: Sir No Sir",stage:"Reel News",day:"Thu",start:"18:45",end:"20:10"},
  // --- Thu: Reparium ---
  {name:"Repairium",stage:"Reparium",day:"Thu",start:"10:00",end:"18:00"},
  // --- Thu: Rose and Clown ---
  {name:"Rose & Clown Opening Pilates Warmup Session",stage:"Rose and Clown",day:"Thu",start:"14:00",end:"14:30"},
  {name:"Loopy Takeover Ft. Ambi, Grandma Wubplate, & Shardy Bumpa",stage:"Rose and Clown",day:"Thu",start:"14:30",end:"15:30"},
  {name:"Meg McHugh",stage:"Rose and Clown",day:"Thu",start:"15:30",end:"16:30"},
  {name:"The Third Nipple (Old School Rave Set)",stage:"Rose and Clown",day:"Thu",start:"16:30",end:"17:30"},
  {name:"Anna Prank B2B Ellament",stage:"Rose and Clown",day:"Thu",start:"17:30",end:"18:30"},
  {name:"Gorilla Tactics Rinseout Ft. Rivibes",stage:"Rose and Clown",day:"Thu",start:"18:30",end:"19:15"},
  {name:"Raze Takeover",stage:"Rose and Clown",day:"Thu",start:"19:15",end:"20:00"},
  {name:"Octoposse",stage:"Rose and Clown",day:"Thu",start:"20:00",end:"21:00"},
  {name:"OneDa",stage:"Rose and Clown",day:"Thu",start:"21:00",end:"22:00"},
  {name:"Gorilla Tactics Rinseout Ft. Rivibes",stage:"Rose and Clown",day:"Thu",start:"22:00",end:"22:45"},
  {name:"Mad Apple Circus",stage:"Rose and Clown",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Sharing Circles ---
  {name:"Sharing Circles - Workshop",stage:"Sharing Circles",day:"Thu",start:"11:00",end:"19:00"},
  // --- Thu: Sibín Beag ---
  {name:"Fáilte Isteach (FAWL-che ISH-takh) Welcome In",stage:"Sibín Beag",day:"Thu",start:"14:00",end:"14:45"},
  {name:"Aurora Engine",stage:"Sibín Beag",day:"Thu",start:"15:15",end:"16:00"},
  {name:"FFTP",stage:"Sibín Beag",day:"Thu",start:"16:30",end:"17:15"},
  {name:"All for Jolly",stage:"Sibín Beag",day:"Thu",start:"17:45",end:"18:30"},
  {name:"The Groggy Dogs",stage:"Sibín Beag",day:"Thu",start:"18:30",end:"19:15"},
  {name:"Trad Folkin' Rocks House Band",stage:"Sibín Beag",day:"Thu",start:"20:30",end:"22:30"},
  // --- Thu: Soapranos Laundrette ---
  {name:"LEXII",stage:"Soapranos Laundrette",day:"Thu",start:"13:00",end:"14:00"},
  {name:"DJ Amber Rose",stage:"Soapranos Laundrette",day:"Thu",start:"14:00",end:"15:00"},
  {name:"Bumpah Takeover -  Cheza Lucina",stage:"Soapranos Laundrette",day:"Thu",start:"15:00",end:"16:00"},
  {name:"Bumpah Takeover -  princess xixi",stage:"Soapranos Laundrette",day:"Thu",start:"16:00",end:"17:00"},
  {name:"Bumpah Takeover - thempress",stage:"Soapranos Laundrette",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Betsy Mae",stage:"Soapranos Laundrette",day:"Thu",start:"18:00",end:"19:00"},
  {name:"Morgane",stage:"Soapranos Laundrette",day:"Thu",start:"19:00",end:"20:00"},
  // --- Thu: Spectrum 360 ---
  {name:"Holly Warcup B2B Miss Cabbage",stage:"Spectrum 360",day:"Thu",start:"15:00",end:"16:00"},
  {name:"Karlie Marx [Not Bad For A Girl Takeover]",stage:"Spectrum 360",day:"Thu",start:"16:00",end:"17:00"},
  {name:"Egg On Toast B2B Syntax [Not Bad For A Girl Takeover]",stage:"Spectrum 360",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Cicely B2B Hypershé",stage:"Spectrum 360",day:"Thu",start:"18:00",end:"19:00"},
  {name:"Peppa B2B Shirley Temper",stage:"Spectrum 360",day:"Thu",start:"19:00",end:"20:00"},
  {name:"Mollie Rush",stage:"Spectrum 360",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Promis3",stage:"Spectrum 360",day:"Thu",start:"21:00",end:"22:00"},
  {name:"Stinny Stone",stage:"Spectrum 360",day:"Thu",start:"22:00",end:"23:00"},
  {name:"Somniac One",stage:"Spectrum 360",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Spinney Hollow ---
  {name:"Spinney Hollow - Banquet of Art table",stage:"Spinney Hollow",day:"Thu",start:"10:00",end:"18:00"},
  {name:"Spinney Hollow - Traditional Green Wood Work Workshop",stage:"Spinney Hollow",day:"Thu",start:"10:00",end:"18:00"},
  // --- Thu: Sub Lab ---
  {name:"Bennett Ft Sylla, Limmz & P****",stage:"Sub Lab",day:"Thu",start:"18:00",end:"19:00"},
  {name:"Stasis",stage:"Sub Lab",day:"Thu",start:"19:00",end:"20:00"},
  {name:"Nio B",stage:"Sub Lab",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Akira ft Cola B",stage:"Sub Lab",day:"Thu",start:"21:00",end:"22:00"},
  {name:"Jaz Imsky Ft Special Guest MC",stage:"Sub Lab",day:"Thu",start:"22:00",end:"23:00"},
  {name:"1+1=?? (Special Guest)",stage:"Sub Lab",day:"Thu",start:"23:00",end:"23:59"},
  // --- Thu: Tangled Roots ---
  {name:"Lionpulse x Sinai",stage:"Tangled Roots",day:"Thu",start:"12:00",end:"13:00"},
  {name:"Daddy Nature B2B DJ Dansey (Rompa's Reggae Shack)",stage:"Tangled Roots",day:"Thu",start:"13:00",end:"14:00"},
  {name:"Cuppa T & Johnny Scratch Lee",stage:"Tangled Roots",day:"Thu",start:"14:00",end:"15:00"},
  {name:"Twende Takeover Ft. Alex Twende, Joeti & Sojebe",stage:"Tangled Roots",day:"Thu",start:"15:00",end:"16:00"},
  {name:"Marla Kether",stage:"Tangled Roots",day:"Thu",start:"16:00",end:"17:00"},
  {name:"Ru Robinson",stage:"Tangled Roots",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Hiphoppapotamus B2B Fizzy Gillespie",stage:"Tangled Roots",day:"Thu",start:"18:00",end:"19:00"},
  {name:"Jinx In Dub",stage:"Tangled Roots",day:"Thu",start:"19:00",end:"20:00"},
  {name:"Cheza Lucina",stage:"Tangled Roots",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Ekula & Mista Jago",stage:"Tangled Roots",day:"Thu",start:"21:00",end:"22:00"},
  // --- Thu: The Boomtown Bobbies ---
  {name:"Scotland Yard Takeover",stage:"The Boomtown Bobbies",day:"Thu",start:"14:00",end:"17:00"},
  {name:"Merkata",stage:"The Boomtown Bobbies",day:"Thu",start:"17:00",end:"17:40"},
  {name:"Zamurai",stage:"The Boomtown Bobbies",day:"Thu",start:"18:20",end:"19:00"},
  {name:"Ka b2b Tomu",stage:"The Boomtown Bobbies",day:"Thu",start:"19:00",end:"20:00"},
  {name:"Kaisha",stage:"The Boomtown Bobbies",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Kelvin 373",stage:"The Boomtown Bobbies",day:"Thu",start:"21:00",end:"22:00"},
  {name:"Banshee - Rua Tui, Kathika, Maria, Maddy V",stage:"The Boomtown Bobbies",day:"Thu",start:"22:00",end:"23:00"},
  {name:"Zapya",stage:"The Boomtown Bobbies",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: The Fools Leap ---
  {name:"shunTA!",stage:"The Fools Leap",day:"Thu",start:"12:00",end:"13:30"},
  {name:"The Sneak Eazies",stage:"The Fools Leap",day:"Thu",start:"14:00",end:"15:00"},
  {name:"Shanghai Treason",stage:"The Fools Leap",day:"Thu",start:"15:30",end:"16:30"},
  {name:"Fraser Morgan",stage:"The Fools Leap",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Girl In The Year Above",stage:"The Fools Leap",day:"Thu",start:"18:50",end:"19:30"},
  {name:"Scottish Fish",stage:"The Fools Leap",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Smag På Dig Selv",stage:"The Fools Leap",day:"Thu",start:"21:30",end:"22:30"},
  {name:"CLADA",stage:"The Fools Leap",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: The Garden Centre ---
  {name:"Funkmaster General",stage:"The Garden Centre",day:"Thu",start:"14:00",end:"15:00"},
  {name:"Redpeppa",stage:"The Garden Centre",day:"Thu",start:"15:00",end:"16:00"},
  {name:"Rodderz",stage:"The Garden Centre",day:"Thu",start:"16:00",end:"17:00"},
  {name:"Dovetail",stage:"The Garden Centre",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Phillax",stage:"The Garden Centre",day:"Thu",start:"18:00",end:"19:00"},
  {name:"Dec",stage:"The Garden Centre",day:"Thu",start:"19:00",end:"20:00"},
  {name:"Astyx",stage:"The Garden Centre",day:"Thu",start:"20:00",end:"21:00"},
  {name:"[Diversion Audio Takeover] Jay-Mo B2B Pinks B2B Randoma B2B Tianna Franxx Ft. Multiplex MC",stage:"The Garden Centre",day:"Thu",start:"21:00",end:"23:00"},
  {name:"Nizan",stage:"The Garden Centre",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: The Immortal Children of the Eternal Seed ---
  {name:"Loose forms Takeover ft NiPS/Spilla/Doctor Onion/Clackman Duke & Hi MC",stage:"The Immortal Children of the Eternal Seed",day:"Thu",start:"20:00",end:"00:00"},
  // --- Thu: The Magic Teapot ---
  {name:"The Magic Teapot",stage:"The Magic Teapot",day:"Thu",start:"12:00",end:"00:00"},
  // --- Thu: The Pomegranate Parlour ---
  {name:"Cassia",stage:"The Pomegranate Parlour",day:"Thu",start:"14:00",end:"15:00"},
  {name:"SCARBA",stage:"The Pomegranate Parlour",day:"Thu",start:"15:00",end:"16:00"},
  {name:"Mattana",stage:"The Pomegranate Parlour",day:"Thu",start:"16:00",end:"17:00"},
  {name:"Ban Dalan",stage:"The Pomegranate Parlour",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Somatic",stage:"The Pomegranate Parlour",day:"Thu",start:"18:00",end:"19:00"},
  {name:"DmTree",stage:"The Pomegranate Parlour",day:"Thu",start:"19:00",end:"20:00"},
  {name:"Emma Ash",stage:"The Pomegranate Parlour",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Buddha",stage:"The Pomegranate Parlour",day:"Thu",start:"21:00",end:"22:00"},
  {name:"DJ Shakey",stage:"The Pomegranate Parlour",day:"Thu",start:"22:00",end:"23:00"},
  {name:"Illexxandra",stage:"The Pomegranate Parlour",day:"Thu",start:"23:00",end:"23:55"},
  // --- Thu: Tinker Station ---
  {name:"Tinker Station",stage:"Tinker Station",day:"Thu",start:"10:00",end:"18:00"},
  // --- Thu: Topsy Turvy Trims ---
  {name:"Black Board Soundsystem",stage:"Topsy Turvy Trims",day:"Thu",start:"13:00",end:"16:00"},
  {name:"Goose",stage:"Topsy Turvy Trims",day:"Thu",start:"16:00",end:"17:00"},
  {name:"Hokey Cokey Cabaret",stage:"Topsy Turvy Trims",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Ignoring Izzy",stage:"Topsy Turvy Trims",day:"Thu",start:"19:00",end:"20:00"},
  {name:"Villain",stage:"Topsy Turvy Trims",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Frazr Musica",stage:"Topsy Turvy Trims",day:"Thu",start:"21:00",end:"22:00"},
  {name:"Merchant",stage:"Topsy Turvy Trims",day:"Thu",start:"22:00",end:"23:00"},
  {name:"She's Got Brass",stage:"Topsy Turvy Trims",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Tribe of Frog ---
  {name:"Ott",stage:"Tribe of Frog",day:"Thu",start:"14:00",end:"15:30"},
  {name:"Jakkar",stage:"Tribe of Frog",day:"Thu",start:"15:30",end:"17:00"},
  {name:"Ebru Al",stage:"Tribe of Frog",day:"Thu",start:"17:00",end:"18:30"},
  {name:"Minali",stage:"Tribe of Frog",day:"Thu",start:"18:30",end:"20:00"},
  {name:"Liquid Ross",stage:"Tribe of Frog",day:"Thu",start:"20:00",end:"21:30"},
  {name:"Neutron",stage:"Tribe of Frog",day:"Thu",start:"21:30",end:"23:00"},
  {name:"D-Ther",stage:"Tribe of Frog",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Twisted Time Machine (Bad Apple Bar) ---
  {name:"THE ABBA PARTY",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Thu",start:"14:00",end:"15:00"},
  {name:"TOM SHANX & RHI n B (LIVE)",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Thu",start:"15:00",end:"16:00"},
  {name:"DON'T DISS MY ABILITY : TRIBUTE TO DJ FLOOD",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Thu",start:"16:00",end:"18:00"},
  {name:"GUILTY PLEASURES REWIND SOCIETY",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Thu",start:"18:00",end:"19:00"},
  {name:"VERY DAFT VERY PUNK",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Thu",start:"19:00",end:"20:00"},
  {name:"MAKE EDM GREAT AGAIN",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Thu",start:"20:00",end:"21:00"},
  {name:"BASIC PLEASURE MODEL",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Thu",start:"21:00",end:"22:00"},
  {name:"THE FLEETWOOD MAC CELEBRATION",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Thu",start:"22:00",end:"23:00"},
  {name:"MY CHEMICAL HOEMANCE",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: XR ---
  {name:"Cassandra the Oracle",stage:"XR",day:"Thu",start:"11:00",end:"12:00"},
  {name:"Last Chance Salon",stage:"XR",day:"Thu",start:"11:00",end:"19:00"},
  {name:"Art Blocking",stage:"XR",day:"Thu",start:"11:00",end:"18:30"},
  {name:"Dirty Scrubbers Meditation",stage:"XR",day:"Thu",start:"12:00",end:"13:00"},
  {name:"Dirty Scrubbers Meditation",stage:"XR",day:"Thu",start:"12:00",end:"13:00"},
  {name:"Drumming Workshop",stage:"XR",day:"Thu",start:"13:00",end:"14:00"},
  {name:"Cassandra the Oracle",stage:"XR",day:"Thu",start:"14:00",end:"16:00"},
  {name:"Big Oil Drumming Parade",stage:"XR",day:"Thu",start:"14:00",end:"15:30"},
  {name:"Costume Pimping",stage:"XR",day:"Thu",start:"14:00",end:"18:00"},
  {name:"Tea Ladies",stage:"XR",day:"Thu",start:"16:00",end:"18:00"},
  {name:"Strictly Burning Ballroom",stage:"XR",day:"Thu",start:"18:00",end:"18:30"},
  // ================= FRI =================
  // --- Fri: Acid Leak ---
  {name:"John Tuxman",stage:"Acid Leak",day:"Fri",start:"13:00",end:"14:30"},
  {name:"One Dirty Ape",stage:"Acid Leak",day:"Fri",start:"14:30",end:"16:00"},
  {name:"Dynamic Intervention",stage:"Acid Leak",day:"Fri",start:"16:00",end:"17:30"},
  {name:"A.P.",stage:"Acid Leak",day:"Fri",start:"17:30",end:"19:00"},
  {name:"David Oblivion",stage:"Acid Leak",day:"Fri",start:"19:00",end:"20:30"},
  {name:"D.A.V.E The Drummer",stage:"Acid Leak",day:"Fri",start:"20:30",end:"22:00"},
  {name:"Bad Boy Pete",stage:"Acid Leak",day:"Fri",start:"22:00",end:"23:30"},
  {name:"Eddie Santini",stage:"Acid Leak",day:"Fri",start:"23:30",end:"01:00"},
  {name:"Sterling Moss",stage:"Acid Leak",day:"Fri",start:"01:00",end:"02:30"},
  {name:"DJ Smay",stage:"Acid Leak",day:"Fri",start:"02:30",end:"04:00"},
  // --- Fri: Agents of Change HQ ---
  {name:"Weaving Change",stage:"Agents of Change HQ",day:"Fri",start:"10:00",end:"18:00"},
  {name:"Agents of Change HQ",stage:"Agents of Change HQ",day:"Fri",start:"10:00",end:"20:00"},
  {name:"Giant Triplets",stage:"Agents of Change HQ",day:"Fri",start:"11:00",end:"14:00"},
  {name:"Giant Triplets",stage:"Agents of Change HQ",day:"Fri",start:"16:00",end:"19:00"},
  // --- Fri: Airetiko ---
  {name:"Airetiko Trapeze",stage:"Airetiko",day:"Fri",start:"11:00",end:"13:00"},
  {name:"Airetiko Giant Marionettes",stage:"Airetiko",day:"Fri",start:"13:00",end:"15:00"},
  {name:"Airetiko Trapeze",stage:"Airetiko",day:"Fri",start:"15:00",end:"17:00"},
  // --- Fri: Anara Forest ---
  {name:"Kaya Ft. Limmz",stage:"Anara Forest",day:"Fri",start:"15:00",end:"16:00"},
  {name:"Sin & Brook",stage:"Anara Forest",day:"Fri",start:"16:00",end:"17:00"},
  {name:"Young Franco",stage:"Anara Forest",day:"Fri",start:"17:00",end:"18:00"},
  {name:"PJ Bridger",stage:"Anara Forest",day:"Fri",start:"18:00",end:"19:00"},
  {name:"Mary Droppinz",stage:"Anara Forest",day:"Fri",start:"19:00",end:"20:00"},
  {name:"G33 B2B Plastician",stage:"Anara Forest",day:"Fri",start:"20:00",end:"21:30"},
  {name:"Champion",stage:"Anara Forest",day:"Fri",start:"21:30",end:"22:30"},
  {name:"SBTRKT - DJ Set",stage:"Anara Forest",day:"Fri",start:"22:30",end:"00:00"},
  {name:"Ahadadream",stage:"Anara Forest",day:"Fri",start:"00:00",end:"01:30"},
  {name:"Hamdi B2B Mala",stage:"Anara Forest",day:"Fri",start:"01:30",end:"03:00"},
  // --- Fri: Ancient Futures ---
  {name:"DNBreathe Breathwork - Raise Your Frequency",stage:"Ancient Futures",day:"Fri",start:"11:30",end:"13:00"},
  {name:"Coming Home To Yourself: The Art of Conscious Communication",stage:"Ancient Futures",day:"Fri",start:"13:30",end:"15:00"},
  {name:"Breathwork & Somatic Workshop for Emotional Regulation & Processing",stage:"Ancient Futures",day:"Fri",start:"15:30",end:"17:00"},
  {name:"Rave as ritual: how the festival space can heal us",stage:"Ancient Futures",day:"Fri",start:"17:30",end:"18:00"},
  {name:"Ecstatic Dance",stage:"Ancient Futures",day:"Fri",start:"19:00",end:"21:00"},
  {name:"The Healing Breath",stage:"Ancient Futures",day:"Fri",start:"09:00",end:"11:00"},
  // --- Fri: Blink Mental Health ---
  {name:"Blink Mental Health Chill-Out Space",stage:"Blink Mental Health",day:"Fri",start:"10:00",end:"19:30"},
  // --- Fri: Botanica Zoo ---
  {name:"Cheza Lucina [All Colours takeover]",stage:"Botanica Zoo",day:"Fri",start:"15:00",end:"15:50"},
  {name:"Pia Collada w/ Blythe [All Colours takeover]",stage:"Botanica Zoo",day:"Fri",start:"15:50",end:"16:40"},
  {name:"Misfit 'n' Kamer [All Colours takeover]",stage:"Botanica Zoo",day:"Fri",start:"16:40",end:"17:30"},
  {name:"Zak Smiff B2B Joel Deep w/ Rivibes [All Colours takeover]",stage:"Botanica Zoo",day:"Fri",start:"17:30",end:"18:20"},
  {name:"Yasmine [All Colours takeover]",stage:"Botanica Zoo",day:"Fri",start:"18:20",end:"19:10"},
  {name:"Bennie B2B DJ Hybrid (World exclusive 140 set w/ Killa P) [All Colours takeover]",stage:"Botanica Zoo",day:"Fri",start:"19:10",end:"20:05"},
  {name:"Meltout Crew [All Colours takeover]",stage:"Botanica Zoo",day:"Fri",start:"20:05",end:"21:00"},
  {name:"DFUSE w/ HAM [All Colours takeover]",stage:"Botanica Zoo",day:"Fri",start:"21:00",end:"22:00"},
  {name:"???? w/ Rivibes [All Colours takeover]",stage:"Botanica Zoo",day:"Fri",start:"22:00",end:"23:00"},
  {name:"N-Type B2B Ekula B2B Sheba Q w/ Nav & HAM [All Colours takeover]",stage:"Botanica Zoo",day:"Fri",start:"23:00",end:"01:00"},
  {name:"Ezra B2B Serkus w/ Mista Jago [All Colours takeover]",stage:"Botanica Zoo",day:"Fri",start:"01:00",end:"02:00"},
  {name:"Iller Instinct [All Colours takeover]",stage:"Botanica Zoo",day:"Fri",start:"02:00",end:"03:00"},
  {name:"Humb B2B HIGHLANDER [All Colours takeover]",stage:"Botanica Zoo",day:"Fri",start:"03:00",end:"04:00"},
  // --- Fri: Busker's Wharf ---
  {name:"The Pussy Catbaret",stage:"Busker's Wharf",day:"Fri",start:"19:30",end:"20:30"},
  {name:"The Lobster Cabaret",stage:"Busker's Wharf",day:"Fri",start:"21:00",end:"22:00"},
  // --- Fri: Cas's Costumes ---
  {name:"Engineers of Desire",stage:"Cas's Costumes",day:"Fri",start:"10:00",end:"18:00"},
  // --- Fri: Circus Tent ---
  {name:"Belly Dance",stage:"Circus Tent",day:"Fri",start:"11:00",end:"12:00"},
  {name:"Contemporary Dance",stage:"Circus Tent",day:"Fri",start:"11:00",end:"12:00"},
  {name:"HOOPGIRLS",stage:"Circus Tent",day:"Fri",start:"12:00",end:"14:00"},
  {name:"Wye Circus Skills, Poi, Flower Stick, Hat Juggling",stage:"Circus Tent",day:"Fri",start:"14:00",end:"16:00"},
  {name:"Wye Circus Skills, Juggling, Staff, Dapo Star",stage:"Circus Tent",day:"Fri",start:"16:00",end:"18:00"},
  {name:"Inspired Breath",stage:"Circus Tent",day:"Fri",start:"18:00",end:"19:00"},
  {name:"Wye Circus Fire Show",stage:"Circus Tent",day:"Fri",start:"21:00",end:"22:00"},
  {name:"Energising Yoga",stage:"Circus Tent",day:"Fri",start:"09:00",end:"10:00"},
  // --- Fri: Climate Live ---
  {name:"Climate Live Opening",stage:"Climate Live",day:"Fri",start:"10:00",end:"20:00"},
  {name:"Beads & Breathe",stage:"Climate Live",day:"Fri",start:"10:30",end:"11:30"},
  {name:"Jewellery & Trinket Making with Recycled Cans - EVA",stage:"Climate Live",day:"Fri",start:"11:45",end:"12:45"},
  {name:"Kemastry: Caged & Free, Creative Writing",stage:"Climate Live",day:"Fri",start:"13:00",end:"14:00"},
  {name:"USB Decorating: No Dance Music Without Diversity",stage:"Climate Live",day:"Fri",start:"14:15",end:"15:15"},
  {name:"Jungyals and Gays: Festival Flag Making and Community Conversations",stage:"Climate Live",day:"Fri",start:"15:30",end:"16:30"},
  {name:"Doof Stick Making",stage:"Climate Live",day:"Fri",start:"16:45",end:"17:45"},
  // --- Fri: Cocaine Anonymous ---
  {name:"Cocaine Anonymous Meeting",stage:"Cocaine Anonymous",day:"Fri",start:"11:00",end:"12:00"},
  {name:"Cocaine Anonymous Meeting",stage:"Cocaine Anonymous",day:"Fri",start:"18:00",end:"19:00"},
  // --- Fri: Community Fire ---
  {name:"Community Fire (Running 24hrs)",stage:"Community Fire",day:"Fri",start:"12:00",end:"00:00"},
  // --- Fri: Craft Tent ---
  {name:"Hitty Hitty Bang Bang",stage:"Craft Tent",day:"Fri",start:"10:00",end:"18:00"},
  {name:"Botanical Fascinators",stage:"Craft Tent",day:"Fri",start:"10:00",end:"18:00"},
  {name:"Junk Jewelery",stage:"Craft Tent",day:"Fri",start:"10:00",end:"18:00"},
  // --- Fri: Crafty Rascals ---
  {name:"Crafty Rascals",stage:"Crafty Rascals",day:"Fri",start:"10:00",end:"18:00"},
  // --- Fri: Deviant Lounge ---
  {name:"Can't Stop Won't Stop",stage:"Deviant Lounge",day:"Fri",start:"20:00",end:"21:00"},
  {name:"Maui Pink",stage:"Deviant Lounge",day:"Fri",start:"21:00",end:"21:45"},
  {name:"Princ3ss Charming",stage:"Deviant Lounge",day:"Fri",start:"21:45",end:"22:30"},
  {name:"Grandma Wubplate b2b DJ Noodz",stage:"Deviant Lounge",day:"Fri",start:"22:30",end:"23:30"},
  {name:"BBY GOOSE",stage:"Deviant Lounge",day:"Fri",start:"23:30",end:"00:30"},
  {name:"Cicely Ft. MC STONE",stage:"Deviant Lounge",day:"Fri",start:"00:30",end:"01:30"},
  {name:"Gullyteen b2b Iffyhype b2b Hurtdeer",stage:"Deviant Lounge",day:"Fri",start:"01:30",end:"03:00"},
  {name:"Scottish Gabber Punk",stage:"Deviant Lounge",day:"Fri",start:"03:00",end:"04:00"},
  // --- Fri: E Numbers ---
  {name:"Silent Disco",stage:"E Numbers",day:"Fri",start:"13:00",end:"19:00"},
  {name:"Dr Rat",stage:"E Numbers",day:"Fri",start:"19:00",end:"19:45"},
  {name:"chlow333",stage:"E Numbers",day:"Fri",start:"19:45",end:"20:30"},
  {name:"GOLDENAXE",stage:"E Numbers",day:"Fri",start:"20:30",end:"21:15"},
  {name:"Mollie Rush",stage:"E Numbers",day:"Fri",start:"21:15",end:"22:00"},
  {name:"DJ Gash Presents: Sherbert Sessions",stage:"E Numbers",day:"Fri",start:"22:00",end:"22:45"},
  {name:"Girldick",stage:"E Numbers",day:"Fri",start:"22:45",end:"23:30"},
  {name:"DJ Noeyedear",stage:"E Numbers",day:"Fri",start:"23:30",end:"00:15"},
  {name:"Sam Tearout",stage:"E Numbers",day:"Fri",start:"00:15",end:"01:00"},
  {name:"Lil Data",stage:"E Numbers",day:"Fri",start:"01:00",end:"01:45"},
  {name:"N4TS: Danny Stranger",stage:"E Numbers",day:"Fri",start:"01:45",end:"02:30"},
  {name:"N4TS: Dolfinboy",stage:"E Numbers",day:"Fri",start:"02:30",end:"03:15"},
  {name:"N4TS: Secret Set",stage:"E Numbers",day:"Fri",start:"03:15",end:"04:00"},
  // --- Fri: End of the Line ---
  {name:"Unfoldance",stage:"End of the Line",day:"Fri",start:"20:00",end:"20:45"},
  {name:"Lunae",stage:"End of the Line",day:"Fri",start:"20:45",end:"21:30"},
  {name:"Sticky Ricky",stage:"End of the Line",day:"Fri",start:"21:30",end:"22:15"},
  {name:"Loutan",stage:"End of the Line",day:"Fri",start:"22:15",end:"23:00"},
  {name:"Agent Scully",stage:"End of the Line",day:"Fri",start:"23:00",end:"23:45"},
  {name:"Scandal!st B2B Yoste",stage:"End of the Line",day:"Fri",start:"23:45",end:"00:45"},
  {name:"DansFleur",stage:"End of the Line",day:"Fri",start:"00:45",end:"01:15"},
  {name:"Grandma Wubplate",stage:"End of the Line",day:"Fri",start:"01:15",end:"02:00"},
  {name:"Minor Science",stage:"End of the Line",day:"Fri",start:"02:00",end:"03:00"},
  {name:"DROMEK",stage:"End of the Line",day:"Fri",start:"03:00",end:"04:00"},
  // --- Fri: Energy Garden ---
  {name:"Energy Garden Opening",stage:"Energy Garden",day:"Fri",start:"12:00",end:"22:00"},
  {name:"Solar Panel Building Workshop",stage:"Energy Garden",day:"Fri",start:"13:00",end:"15:00"},
  {name:"Solar Panel Building Workshop",stage:"Energy Garden",day:"Fri",start:"13:00",end:"15:00"},
  // --- Fri: Foggers Mill ---
  {name:"Razzomo",stage:"Foggers Mill",day:"Fri",start:"13:00",end:"14:00"},
  {name:"Hawkeye and Hoe",stage:"Foggers Mill",day:"Fri",start:"14:30",end:"15:30"},
  {name:"Hightown Crows",stage:"Foggers Mill",day:"Fri",start:"16:00",end:"17:00"},
  {name:"Quinn's Quinny",stage:"Foggers Mill",day:"Fri",start:"17:30",end:"18:30"},
  {name:"Bitter Lemons",stage:"Foggers Mill",day:"Fri",start:"19:00",end:"20:00"},
  {name:"Rotten Boroughs",stage:"Foggers Mill",day:"Fri",start:"20:30",end:"21:30"},
  {name:"Pronghorn",stage:"Foggers Mill",day:"Fri",start:"22:00",end:"23:00"},
  {name:"The Bad Actors",stage:"Foggers Mill",day:"Fri",start:"23:30",end:"00:30"},
  {name:"Whiskey Rebellion",stage:"Foggers Mill",day:"Fri",start:"01:00",end:"02:00"},
  // --- Fri: Full Moon Ballroom ---
  {name:"The Showhawk Duo",stage:"Full Moon Ballroom",day:"Fri",start:"13:15",end:"14:15"},
  {name:"Heavy Beat Brass Band",stage:"Full Moon Ballroom",day:"Fri",start:"14:45",end:"15:45"},
  {name:"New Car Smell",stage:"Full Moon Ballroom",day:"Fri",start:"16:15",end:"17:15"},
  {name:"Big Band of Boom",stage:"Full Moon Ballroom",day:"Fri",start:"17:45",end:"18:45"},
  {name:"Vibe Roulette",stage:"Full Moon Ballroom",day:"Fri",start:"19:15",end:"20:45"},
  {name:"DOGSHOW",stage:"Full Moon Ballroom",day:"Fri",start:"21:15",end:"22:15"},
  {name:"Direct Debbie B2B DJ Business Lady",stage:"Full Moon Ballroom",day:"Fri",start:"22:45",end:"00:00"},
  {name:"Extra Medium B2B WBBL (Thick Boy Records) Ft. Kathika",stage:"Full Moon Ballroom",day:"Fri",start:"00:00",end:"01:15"},
  {name:"Mr Fitz & Mr Woodnote Ft. Limmz",stage:"Full Moon Ballroom",day:"Fri",start:"01:15",end:"02:30"},
  {name:"Swing & Bass (10 Year Anniversary): Fizzy Gillespie B2B Mista Trick Ft. She's Got Brass",stage:"Full Moon Ballroom",day:"Fri",start:"02:30",end:"04:00"},
  // --- Fri: Gabber Kebabber ---
  {name:"2 Sick Puppiez",stage:"Gabber Kebabber",day:"Fri",start:"12:00",end:"13:00"},
  {name:"REDDEM",stage:"Gabber Kebabber",day:"Fri",start:"13:00",end:"13:45"},
  {name:"Uptempo Anonymous",stage:"Gabber Kebabber",day:"Fri",start:"13:45",end:"14:30"},
  {name:"John Michelle Jarg",stage:"Gabber Kebabber",day:"Fri",start:"14:30",end:"15:30"},
  {name:"Dee Jay Say La Vee b2b Stripe N Co",stage:"Gabber Kebabber",day:"Fri",start:"15:30",end:"16:15"},
  {name:"Chef Bland",stage:"Gabber Kebabber",day:"Fri",start:"16:15",end:"17:00"},
  {name:"DJ Cilit Bang",stage:"Gabber Kebabber",day:"Fri",start:"17:00",end:"18:00"},
  {name:"Kebabbaret",stage:"Gabber Kebabber",day:"Fri",start:"18:00",end:"19:00"},
  {name:"Foulmouth",stage:"Gabber Kebabber",day:"Fri",start:"19:00",end:"19:45"},
  {name:"Bubble 07",stage:"Gabber Kebabber",day:"Fri",start:"19:45",end:"20:30"},
  {name:"Matt Scratch",stage:"Gabber Kebabber",day:"Fri",start:"20:30",end:"21:15"},
  {name:"Kalisae",stage:"Gabber Kebabber",day:"Fri",start:"21:15",end:"22:00"},
  {name:"Mumhole",stage:"Gabber Kebabber",day:"Fri",start:"22:15",end:"23:00"},
  {name:"Iffyhype",stage:"Gabber Kebabber",day:"Fri",start:"23:00",end:"00:00"},
  {name:"Ditchsplitter",stage:"Gabber Kebabber",day:"Fri",start:"00:00",end:"01:00"},
  {name:"dj osu!",stage:"Gabber Kebabber",day:"Fri",start:"01:00",end:"02:00"},
  {name:"Obsidian 23",stage:"Gabber Kebabber",day:"Fri",start:"02:00",end:"03:00"},
  {name:"Izzy Bolt",stage:"Gabber Kebabber",day:"Fri",start:"03:00",end:"04:00"},
  // --- Fri: Games Lounge ---
  {name:"Games Lounge (Running 24hrs)",stage:"Games Lounge",day:"Fri",start:"12:00",end:"00:00"},
  // --- Fri: Garden ---
  {name:"Wildflower Fortunes",stage:"Garden",day:"Fri",start:"10:00",end:"18:00"},
  // --- Fri: Grand Central ---
  {name:"Dutty Moonshine Big Band",stage:"Grand Central",day:"Fri",start:"12:30",end:"14:00",genre:"Swing / Variety"},
  {name:"Frankie Stew & Harvey Gunn",stage:"Grand Central",day:"Fri",start:"14:30",end:"15:30",genre:"Hip Hop"},
  {name:"Havoc of Mobb Deep w/ Big Noyd + DJ L.E.S",stage:"Grand Central",day:"Fri",start:"16:00",end:"17:00",genre:"Hip Hop"},
  {name:"Big Special",stage:"Grand Central",day:"Fri",start:"17:30",end:"18:30",genre:"Indie / Alt Rock"},
  {name:"Kae Tempest",stage:"Grand Central",day:"Fri",start:"19:00",end:"20:00",genre:"Hip Hop"},
  {name:"High Vis",stage:"Grand Central",day:"Fri",start:"20:30",end:"21:30",genre:"Punk"},
  {name:"L'Entourloop",stage:"Grand Central",day:"Fri",start:"22:00",end:"23:00"},
  // --- Fri: Hangar 161 ---
  {name:"The Screaming Dolls [Earache Records Takeover]",stage:"Hangar 161",day:"Fri",start:"13:00",end:"13:40",genre:"Metal"},
  {name:"Ruena [Earache Records Takeover]",stage:"Hangar 161",day:"Fri",start:"14:00",end:"14:40",genre:"Metal"},
  {name:"Baddy Issues [Earache Records Takeover]",stage:"Hangar 161",day:"Fri",start:"15:00",end:"15:40",genre:"Metal"},
  {name:"Crae Wolf [Earache Records Takeover]",stage:"Hangar 161",day:"Fri",start:"16:00",end:"17:00",genre:"Metal"},
  {name:"Ward XVI [Earache Records Takeover]",stage:"Hangar 161",day:"Fri",start:"17:30",end:"18:30",genre:"Metal"},
  {name:"Vexed [Earache Records Takeover]",stage:"Hangar 161",day:"Fri",start:"19:00",end:"20:00",genre:"Metal"},
  {name:"Cody Frost [Earache Records Takeover]",stage:"Hangar 161",day:"Fri",start:"20:30",end:"21:30",genre:"Metal"},
  {name:"Nightlives [Earache Records Takeover]",stage:"Hangar 161",day:"Fri",start:"22:00",end:"23:00",genre:"Metal"},
  {name:"Hyphen [Earache Records Takeover]",stage:"Hangar 161",day:"Fri",start:"23:30",end:"00:30",genre:"Metal"},
  {name:"PENGSHUi [Earache Records Takeover]",stage:"Hangar 161",day:"Fri",start:"01:00",end:"02:00",genre:"Metal"},
  // --- Fri: Hapitat ---
  {name:"Hapitat",stage:"Hapitat",day:"Fri",start:"10:00",end:"18:00"},
  // --- Fri: Helix ---
  {name:"Dave Trotter B2B Tom Tucker",stage:"Helix",day:"Fri",start:"15:00",end:"16:30"},
  {name:"Freestylers",stage:"Helix",day:"Fri",start:"16:30",end:"18:00"},
  {name:"JFB",stage:"Helix",day:"Fri",start:"18:00",end:"19:30"},
  {name:"Burt Cope",stage:"Helix",day:"Fri",start:"19:30",end:"21:00"},
  {name:"A.Skillz",stage:"Helix",day:"Fri",start:"21:00",end:"22:30"},
  {name:"Plump DJ's",stage:"Helix",day:"Fri",start:"22:30",end:"00:00"},
  {name:"Deekline",stage:"Helix",day:"Fri",start:"00:00",end:"01:30"},
  {name:"Madame Electrifie",stage:"Helix",day:"Fri",start:"01:30",end:"03:00"},
  // --- Fri: Hidden Woods ---
  {name:"Emily Dust",stage:"Hidden Woods",day:"Fri",start:"12:30",end:"14:00"},
  {name:"Juls",stage:"Hidden Woods",day:"Fri",start:"14:00",end:"16:00"},
  {name:"Anaïs Ft. MC Stezzy",stage:"Hidden Woods",day:"Fri",start:"16:00",end:"17:30"},
  {name:"Chimpo B2B Numa Crew Ft. Lady Ice",stage:"Hidden Woods",day:"Fri",start:"17:30",end:"19:00"},
  {name:"Fred V Ft. Daxta",stage:"Hidden Woods",day:"Fri",start:"19:00",end:"20:30"},
  {name:"Kelvin 373 Ft. Carasel",stage:"Hidden Woods",day:"Fri",start:"20:30",end:"22:00"},
  {name:"Clipz Ft. Dread MC",stage:"Hidden Woods",day:"Fri",start:"22:00",end:"23:30"},
  {name:"S.P.Y Ft. MC LowQui",stage:"Hidden Woods",day:"Fri",start:"23:30",end:"01:00"},
  {name:"Kasra B2B Samurai Breaks Ft. Strategy",stage:"Hidden Woods",day:"Fri",start:"01:00",end:"02:30"},
  {name:"Lens Ft. Dread MC",stage:"Hidden Woods",day:"Fri",start:"02:30",end:"04:00"},
  // --- Fri: Hotel Paradiso ---
  {name:"Karyo",stage:"Hotel Paradiso",day:"Fri",start:"20:00",end:"21:00"},
  {name:"Dougie No Pain (Mungo's HiFi)",stage:"Hotel Paradiso",day:"Fri",start:"21:00",end:"22:00"},
  {name:"TBC",stage:"Hotel Paradiso",day:"Fri",start:"22:00",end:"23:00"},
  {name:"Aziza Jaye & DJ Kyla C",stage:"Hotel Paradiso",day:"Fri",start:"23:00",end:"00:00"},
  {name:"JFB",stage:"Hotel Paradiso",day:"Fri",start:"00:00",end:"01:00"},
  {name:"Dazee",stage:"Hotel Paradiso",day:"Fri",start:"01:00",end:"02:00"},
  // --- Fri: Hydro XL ---
  {name:"Boomtown Opening Ceremony",stage:"Hydro XL",day:"Fri",start:"12:00",end:"12:30"},
  {name:"Groove Armada - DJ Set",stage:"Hydro XL",day:"Fri",start:"12:30",end:"14:00"},
  {name:"DJ EZ",stage:"Hydro XL",day:"Fri",start:"14:00",end:"15:30"},
  {name:"Notion",stage:"Hydro XL",day:"Fri",start:"15:30",end:"17:00"},
  {name:"Diffrent",stage:"Hydro XL",day:"Fri",start:"17:00",end:"18:30"},
  {name:"Faster Horses B2B Y U QT",stage:"Hydro XL",day:"Fri",start:"18:30",end:"20:00"},
  {name:"Eats Everything B2B TSHA",stage:"Hydro XL",day:"Fri",start:"20:00",end:"21:30"},
  {name:"Effy B2B Ross From Friends",stage:"Hydro XL",day:"Fri",start:"21:30",end:"23:00"},
  {name:"999999999 - AV Show",stage:"Hydro XL",day:"Fri",start:"23:00",end:"00:30"},
  {name:"Oguz",stage:"Hydro XL",day:"Fri",start:"00:30",end:"02:00"},
  {name:"[IVY] vs [SAFYRE]",stage:"Hydro XL",day:"Fri",start:"02:00",end:"03:00"},
  // --- Fri: Infinity ---
  {name:"Menu Music Presents: Salt B2B Stolen & WHOS JORDAN",stage:"Infinity",day:"Fri",start:"18:00",end:"20:30"},
  {name:"ARLO",stage:"Infinity",day:"Fri",start:"20:30",end:"22:00"},
  {name:"Jeremy Sylvester",stage:"Infinity",day:"Fri",start:"22:00",end:"23:30"},
  {name:"A for Alpha B2B Dani Wylie",stage:"Infinity",day:"Fri",start:"23:30",end:"01:00"},
  {name:"Dr Dubplate",stage:"Infinity",day:"Fri",start:"01:00",end:"02:30"},
  {name:"James Wonka B2B Paree",stage:"Infinity",day:"Fri",start:"02:30",end:"04:00"},
  // --- Fri: Luck Exchange Casino ---
  {name:"Teckno Pixxy",stage:"Luck Exchange Casino",day:"Fri",start:"19:05",end:"19:15"},
  {name:"Jesty Quinn",stage:"Luck Exchange Casino",day:"Fri",start:"19:15",end:"19:25"},
  {name:"Dick Fran Dyke",stage:"Luck Exchange Casino",day:"Fri",start:"19:25",end:"19:30"},
  {name:"Magic The Gabbering",stage:"Luck Exchange Casino",day:"Fri",start:"19:30",end:"19:45"},
  {name:"Dead Lorry, Yellow Lorry",stage:"Luck Exchange Casino",day:"Fri",start:"19:50",end:"19:55"},
  {name:"Teckno Pixxy",stage:"Luck Exchange Casino",day:"Fri",start:"19:55",end:"20:05"},
  {name:"Dick Fran Dyke",stage:"Luck Exchange Casino",day:"Fri",start:"20:15",end:"20:20"},
  {name:"The Sex Cripples",stage:"Luck Exchange Casino",day:"Fri",start:"20:20",end:"20:50"},
  {name:"Iffyhype",stage:"Luck Exchange Casino",day:"Fri",start:"20:50",end:"21:20"},
  // --- Fri: Mining for (g)Old Town ---
  {name:"Flails",stage:"Mining for (g)Old Town",day:"Fri",start:"13:30",end:"15:00"},
  {name:"Father Lynch",stage:"Mining for (g)Old Town",day:"Fri",start:"15:00",end:"16:30"},
  {name:"light gal",stage:"Mining for (g)Old Town",day:"Fri",start:"16:30",end:"18:00"},
  {name:"Emma Ash",stage:"Mining for (g)Old Town",day:"Fri",start:"18:00",end:"19:00"},
  // --- Fri: Nachtlicker ---
  {name:"SAV.",stage:"Nachtlicker",day:"Fri",start:"18:00",end:"19:00"},
  {name:"PINKS feat MC ZIRA FLO",stage:"Nachtlicker",day:"Fri",start:"19:00",end:"20:00"},
  {name:"THEO SHELDRAKE b2b TOM CROOME",stage:"Nachtlicker",day:"Fri",start:"20:00",end:"21:00"},
  {name:"SAVANNAH",stage:"Nachtlicker",day:"Fri",start:"21:00",end:"22:00"},
  {name:"CYBER STEVE",stage:"Nachtlicker",day:"Fri",start:"22:00",end:"23:00"},
  {name:"PJ PEEK",stage:"Nachtlicker",day:"Fri",start:"23:00",end:"00:00"},
  {name:"DYVR [live]",stage:"Nachtlicker",day:"Fri",start:"00:00",end:"00:30"},
  {name:"JACK JUKES",stage:"Nachtlicker",day:"Fri",start:"00:30",end:"01:30"},
  {name:"GOFF",stage:"Nachtlicker",day:"Fri",start:"01:30",end:"02:45"},
  {name:"SLOPPY SPICE",stage:"Nachtlicker",day:"Fri",start:"02:45",end:"04:00"},
  // --- Fri: Narcotics Anonymous ---
  {name:"Narcotic Anonymous Meeting",stage:"Narcotics Anonymous",day:"Fri",start:"13:00",end:"14:00"},
  {name:"Narcotic Anonymous Meeting",stage:"Narcotics Anonymous",day:"Fri",start:"08:00",end:"09:00"},
  // --- Fri: Nexus ---
  {name:"Bongo's Bingo",stage:"Nexus",day:"Fri",start:"13:30",end:"14:30"},
  {name:"Pozzy",stage:"Nexus",day:"Fri",start:"15:00",end:"16:00"},
  {name:"BexBlu & Paul Stephan",stage:"Nexus",day:"Fri",start:"16:30",end:"17:30"},
  {name:"Mr Williamz & Friendly Fire Band",stage:"Nexus",day:"Fri",start:"18:00",end:"19:00"},
  {name:"Nubiyan Twist",stage:"Nexus",day:"Fri",start:"19:30",end:"20:30"},
  {name:"House Gospel Choir",stage:"Nexus",day:"Fri",start:"21:00",end:"22:00"},
  {name:"Donae'o",stage:"Nexus",day:"Fri",start:"22:30",end:"23:30"},
  {name:"The Skinner Brothers",stage:"Nexus",day:"Fri",start:"00:00",end:"01:00"},
  {name:"Fox Stevenson - Live",stage:"Nexus",day:"Fri",start:"01:30",end:"02:30"},
  // --- Fri: Observatory ---
  {name:"Your Brain On Yoga",stage:"Observatory",day:"Fri",start:"10:00",end:"11:00"},
  {name:"Drug Testing & Safety With The Loop'S Potty Professor & Crazy Chemist",stage:"Observatory",day:"Fri",start:"11:30",end:"12:30"},
  {name:"How To Create Reality... In Your Dreams",stage:"Observatory",day:"Fri",start:"13:00",end:"14:00"},
  {name:"Fear & Loathing In Boomtown",stage:"Observatory",day:"Fri",start:"14:30",end:"15:30"},
  {name:"Gather: An Embodied Connection Workshop",stage:"Observatory",day:"Fri",start:"16:00",end:"17:00"},
  {name:"Women And Psychedelics - Science, Stories And Embodiment",stage:"Observatory",day:"Fri",start:"17:30",end:"18:30"},
  // --- Fri: Permaculture ---
  {name:"Green the cracks: Reclaiming neglected spaces for food and wildlife",stage:"Permaculture",day:"Fri",start:"10:00",end:"11:00"},
  {name:"Not a single-use planet: Mushroom ecology, rot and radical redesign",stage:"Permaculture",day:"Fri",start:"11:30",end:"12:30"},
  {name:"Scrap cult: A lunchtime community art jam for tired weirdos",stage:"Permaculture",day:"Fri",start:"13:00",end:"14:00"},
  {name:"What actually helps when the world feels cooked? A panel on living well in strange times",stage:"Permaculture",day:"Fri",start:"14:30",end:"16:30"},
  {name:"Wearable folklore: Crafting ear cuffs from scrap, wire and found objects",stage:"Permaculture",day:"Fri",start:"17:00",end:"18:00"},
  // --- Fri: PFP Robot ---
  {name:"Wasteham",stage:"PFP Robot",day:"Fri",start:"15:00",end:"15:45"},
  {name:"Darth Leng",stage:"PFP Robot",day:"Fri",start:"15:45",end:"16:30"},
  {name:"Indecline",stage:"PFP Robot",day:"Fri",start:"16:30",end:"17:30"},
  {name:"Roland K",stage:"PFP Robot",day:"Fri",start:"17:30",end:"18:30"},
  // --- Fri: Rebel Girls Club ---
  {name:"Morning Yoga with Emma",stage:"Rebel Girls Club",day:"Fri",start:"10:00",end:"11:00"},
  {name:"Meeting Warrior Self with Molly",stage:"Rebel Girls Club",day:"Fri",start:"11:00",end:"12:15"},
  {name:"Cunting - Cunt Bunting Making with Maisie",stage:"Rebel Girls Club",day:"Fri",start:"13:00",end:"14:00"},
  {name:"Lets be Fools: A Creative Wellbeing Workshop with Alena",stage:"Rebel Girls Club",day:"Fri",start:"14:30",end:"15:30"},
  {name:"Daily Sound Bath with Find Your Flow",stage:"Rebel Girls Club",day:"Fri",start:"16:00",end:"16:40"},
  {name:"Burlesque Life Drawing with Alissa",stage:"Rebel Girls Club",day:"Fri",start:"17:00",end:"18:00"},
  {name:"Neo Burlesque Partner workshop with Everglowing",stage:"Rebel Girls Club",day:"Fri",start:"18:30",end:"19:30"},
  // --- Fri: Reel News ---
  {name:"The Violence of Extraction Economies",stage:"Reel News",day:"Fri",start:"11:00",end:"12:00"},
  {name:"Reports from Rojava  - Frontlines of Resistance",stage:"Reel News",day:"Fri",start:"12:00",end:"12:45"},
  {name:"Operation Recomply: Democracy on Trial",stage:"Reel News",day:"Fri",start:"12:45",end:"14:45"},
  {name:"The school to prison pipeline",stage:"Reel News",day:"Fri",start:"14:45",end:"15:30"},
  {name:"Confronting institutional misogyny and oppression",stage:"Reel News",day:"Fri",start:"15:30",end:"16:30"},
  {name:"Spycops",stage:"Reel News",day:"Fri",start:"16:30",end:"17:15"},
  {name:"Demand the Impossible: using theatre in struggles for justice",stage:"Reel News",day:"Fri",start:"17:15",end:"18:15"},
  {name:"Club Commons: Moving Bodies to Grow Movements in Queer Nightlife",stage:"Reel News",day:"Fri",start:"18:15",end:"19:00"},
  // --- Fri: Rose and Clown ---
  {name:"Strictly Chumps Dancing",stage:"Rose and Clown",day:"Fri",start:"13:00",end:"14:00"},
  {name:"Boomtown's Got Talent",stage:"Rose and Clown",day:"Fri",start:"14:00",end:"15:00"},
  {name:"An Dannsa Dub (Live Dub Set) Ft. Wends",stage:"Rose and Clown",day:"Fri",start:"15:00",end:"16:30"},
  {name:"Maddy V [Sika Studios]",stage:"Rose and Clown",day:"Fri",start:"16:30",end:"16:45"},
  {name:"Datkid & Mylo Stone [Sika Studios]",stage:"Rose and Clown",day:"Fri",start:"16:45",end:"17:00"},
  {name:"Creatures of Habit [Sika Studios]",stage:"Rose and Clown",day:"Fri",start:"17:00",end:"17:15"},
  {name:"Illinformed Illin for Meds Showcase Ft. Babylon Dead, Creatures Of Habit, Datkid, Eric The Red, Fliptrix, Gaza Glock​, Jack Jetson, Mylo Stone, Sean Peng, Smellington Piff, Verb T [Sika Studios]",stage:"Rose and Clown",day:"Fri",start:"17:15",end:"17:55"},
  {name:"Babylon Dead [Sika Studios]",stage:"Rose and Clown",day:"Fri",start:"17:55",end:"18:10"},
  {name:"Sika Studios 140 Showcase Ft. Rez, Jman, Local, Slowie & Special Guests [Sika Studios]",stage:"Rose and Clown",day:"Fri",start:"18:10",end:"18:30"},
  {name:"Binksy",stage:"Rose and Clown",day:"Fri",start:"18:30",end:"19:15"},
  {name:"RWKUS",stage:"Rose and Clown",day:"Fri",start:"19:30",end:"20:30"},
  {name:"Molly Sellors (Oboe EDM Queen)",stage:"Rose and Clown",day:"Fri",start:"20:30",end:"21:00"},
  {name:"She's Got Brass",stage:"Rose and Clown",day:"Fri",start:"21:00",end:"22:00"},
  {name:"Jam Salad",stage:"Rose and Clown",day:"Fri",start:"22:00",end:"22:30"},
  {name:"Big Wett",stage:"Rose and Clown",day:"Fri",start:"22:30",end:"23:30"},
  {name:"Hang The DJs B2B Lobsta B",stage:"Rose and Clown",day:"Fri",start:"23:30",end:"01:00"},
  {name:"Jungyals and Gays (Peppa B2B Shirley Temper)",stage:"Rose and Clown",day:"Fri",start:"01:00",end:"02:00"},
  {name:"OKO",stage:"Rose and Clown",day:"Fri",start:"02:00",end:"03:00"},
  {name:"The Neuroheadz Ft. Keenan",stage:"Rose and Clown",day:"Fri",start:"03:00",end:"04:00"},
  // --- Fri: Sharing Circles ---
  {name:"Sharing Circles - Workshop",stage:"Sharing Circles",day:"Fri",start:"11:00",end:"19:00"},
  // --- Fri: Sibín Beag ---
  {name:"Green Diesel",stage:"Sibín Beag",day:"Fri",start:"14:00",end:"14:45"},
  {name:"John Kelly",stage:"Sibín Beag",day:"Fri",start:"15:15",end:"16:00"},
  {name:"Roof Cats",stage:"Sibín Beag",day:"Fri",start:"16:30",end:"17:15"},
  {name:"No Murder No Moustache",stage:"Sibín Beag",day:"Fri",start:"17:45",end:"18:30"},
  {name:"The Kahunas",stage:"Sibín Beag",day:"Fri",start:"19:00",end:"19:45"},
  {name:"Craic Man Fancy Dan",stage:"Sibín Beag",day:"Fri",start:"20:15",end:"21:00"},
  {name:"Trad Folkin' Rocks House Band",stage:"Sibín Beag",day:"Fri",start:"21:30",end:"23:30"},
  {name:"Trad Folkin' Rave DJ's (Annie Craic & Dalba)",stage:"Sibín Beag",day:"Fri",start:"00:00",end:"00:45"},
  // --- Fri: Soapranos Laundrette ---
  {name:"Borderline Massive",stage:"Soapranos Laundrette",day:"Fri",start:"13:00",end:"14:00"},
  {name:"Soapranos & Team Pink present: A Soddy Sock Off",stage:"Soapranos Laundrette",day:"Fri",start:"14:00",end:"15:00"},
  {name:"MSG",stage:"Soapranos Laundrette",day:"Fri",start:"15:00",end:"16:00"},
  {name:"Empressplay",stage:"Soapranos Laundrette",day:"Fri",start:"16:00",end:"17:00"},
  {name:"G33",stage:"Soapranos Laundrette",day:"Fri",start:"17:00",end:"18:00"},
  {name:"Mina B2B BLCK Stream",stage:"Soapranos Laundrette",day:"Fri",start:"18:00",end:"19:00"},
  {name:"Bubski B2B REA",stage:"Soapranos Laundrette",day:"Fri",start:"19:00",end:"20:00"},
  {name:"Buntai: Mahnoor",stage:"Soapranos Laundrette",day:"Fri",start:"20:00",end:"21:00"},
  {name:"Buntai: Akira B2B Milzy",stage:"Soapranos Laundrette",day:"Fri",start:"21:00",end:"22:00"},
  {name:"Buntai: Nio B B2B Skye",stage:"Soapranos Laundrette",day:"Fri",start:"22:00",end:"23:00"},
  {name:"Buntai: Jaz Imsky B2B Felixculprah ft Cola B",stage:"Soapranos Laundrette",day:"Fri",start:"23:00",end:"00:00"},
  // --- Fri: Spectrum 360 ---
  {name:"Draggernauts",stage:"Spectrum 360",day:"Fri",start:"16:00",end:"18:00"},
  {name:"Samurai Breaks B2B Swaglord Savannah",stage:"Spectrum 360",day:"Fri",start:"18:00",end:"19:00"},
  {name:"Mandidextrous Ft. Special Guest",stage:"Spectrum 360",day:"Fri",start:"19:00",end:"20:00"},
  {name:"Laze B2B Saku Sahara",stage:"Spectrum 360",day:"Fri",start:"20:00",end:"22:00"},
  {name:"Darren Styles",stage:"Spectrum 360",day:"Fri",start:"22:00",end:"23:00"},
  {name:"Raybay",stage:"Spectrum 360",day:"Fri",start:"23:00",end:"00:00"},
  {name:"Venjent",stage:"Spectrum 360",day:"Fri",start:"00:00",end:"01:00"},
  {name:"Bish Ft. Carasel",stage:"Spectrum 360",day:"Fri",start:"01:00",end:"02:00"},
  {name:"Starjunk 95",stage:"Spectrum 360",day:"Fri",start:"02:00",end:"03:00"},
  {name:"Deadheads: Mandidextrous & Matt Scratch",stage:"Spectrum 360",day:"Fri",start:"03:00",end:"04:00"},
  // --- Fri: Spinney Hollow ---
  {name:"Spinney Hollow - Banquet of Art table",stage:"Spinney Hollow",day:"Fri",start:"10:00",end:"18:00"},
  {name:"Spinney Hollow - Traditional Green Wood Work Workshop",stage:"Spinney Hollow",day:"Fri",start:"10:00",end:"18:00"},
  // --- Fri: Sub Lab ---
  {name:"Matteo",stage:"Sub Lab",day:"Fri",start:"18:00",end:"19:00"},
  {name:"Tacktile",stage:"Sub Lab",day:"Fri",start:"19:00",end:"20:00"},
  {name:"Panix",stage:"Sub Lab",day:"Fri",start:"20:00",end:"21:00"},
  {name:"Chad Dubz B2B Lotu Ft Slowie",stage:"Sub Lab",day:"Fri",start:"21:00",end:"22:30"},
  {name:"Breakfake",stage:"Sub Lab",day:"Fri",start:"22:30",end:"23:30"},
  {name:"Rea Ft Sylla",stage:"Sub Lab",day:"Fri",start:"23:30",end:"00:30"},
  {name:"Hijinx",stage:"Sub Lab",day:"Fri",start:"00:30",end:"01:30"},
  {name:"GLM",stage:"Sub Lab",day:"Fri",start:"01:30",end:"02:30"},
  {name:"Special Guest",stage:"Sub Lab",day:"Fri",start:"02:30",end:"03:59"},
  // --- Fri: Tangled Roots ---
  {name:"Lionpulse x Sinai",stage:"Tangled Roots",day:"Fri",start:"12:00",end:"13:00"},
  {name:"Akira B2B Jaz Imsky (Buntai) Ft. Cunning MC [20 Years of DEEP MEDi]",stage:"Tangled Roots",day:"Fri",start:"13:00",end:"14:30",genre:"Dubstep / Bass"},
  {name:"Skalah [20 Years of DEEP MEDi]",stage:"Tangled Roots",day:"Fri",start:"14:30",end:"16:00",genre:"Dubstep / Bass"},
  {name:"Darkai B2B Felixculpah [20 Years of DEEP MEDi]",stage:"Tangled Roots",day:"Fri",start:"16:00",end:"17:00",genre:"Dubstep / Bass"},
  {name:"Commodo B2B Pinch [20 Years of DEEP MEDi]",stage:"Tangled Roots",day:"Fri",start:"17:00",end:"18:00",genre:"Dubstep / Bass"},
  {name:"Silkie [20 Years of DEEP MEDi]",stage:"Tangled Roots",day:"Fri",start:"18:00",end:"19:30",genre:"Dubstep / Bass"},
  {name:"Mala [20 Years of DEEP MEDi]",stage:"Tangled Roots",day:"Fri",start:"19:30",end:"21:00",genre:"Dubstep / Bass"},
  // --- Fri: The Boomtown Bobbies ---
  {name:"Music from the Mothership",stage:"The Boomtown Bobbies",day:"Fri",start:"15:00",end:"16:30"},
  {name:"Uncle Boomy",stage:"The Boomtown Bobbies",day:"Fri",start:"16:30",end:"17:15"},
  {name:"Elle b2b Frax",stage:"The Boomtown Bobbies",day:"Fri",start:"17:15",end:"18:00"},
  {name:"Frisbee Aerobics",stage:"The Boomtown Bobbies",day:"Fri",start:"18:00",end:"19:00"},
  {name:"Aries",stage:"The Boomtown Bobbies",day:"Fri",start:"19:00",end:"20:00"},
  {name:"Amelia Leigh",stage:"The Boomtown Bobbies",day:"Fri",start:"20:00",end:"20:40"},
  {name:"Simmo",stage:"The Boomtown Bobbies",day:"Fri",start:"20:40",end:"21:20"},
  {name:"Villain",stage:"The Boomtown Bobbies",day:"Fri",start:"21:20",end:"22:00"},
  {name:"Bugsy",stage:"The Boomtown Bobbies",day:"Fri",start:"22:00",end:"22:40"},
  {name:"Illgroove",stage:"The Boomtown Bobbies",day:"Fri",start:"22:40",end:"00:00"},
  {name:"Euphonique",stage:"The Boomtown Bobbies",day:"Fri",start:"00:00",end:"01:00"},
  {name:"Zimma b2b Dox",stage:"The Boomtown Bobbies",day:"Fri",start:"01:00",end:"02:00"},
  {name:"Demolition Squad",stage:"The Boomtown Bobbies",day:"Fri",start:"02:00",end:"03:00"},
  {name:"Militant Music w MC Stezzy",stage:"The Boomtown Bobbies",day:"Fri",start:"03:00",end:"04:00"},
  // --- Fri: The Fools Leap ---
  {name:"Nuala",stage:"The Fools Leap",day:"Fri",start:"12:00",end:"13:00"},
  {name:"The Balkan Wanderers",stage:"The Fools Leap",day:"Fri",start:"13:30",end:"14:30"},
  {name:"Moonshine Malarkey",stage:"The Fools Leap",day:"Fri",start:"15:00",end:"16:00"},
  {name:"Blue Bottle Club",stage:"The Fools Leap",day:"Fri",start:"16:30",end:"17:30"},
  {name:"New Age Collective",stage:"The Fools Leap",day:"Fri",start:"18:00",end:"19:00"},
  {name:"The Groggy Dogs",stage:"The Fools Leap",day:"Fri",start:"19:30",end:"20:30"},
  {name:"Rum Buffalo",stage:"The Fools Leap",day:"Fri",start:"21:00",end:"22:00"},
  {name:"Mista Trick's Balkan Bass",stage:"The Fools Leap",day:"Fri",start:"22:30",end:"23:30"},
  {name:"ZooBlasters",stage:"The Fools Leap",day:"Fri",start:"00:00",end:"01:00"},
  {name:"Baltic Balkan",stage:"The Fools Leap",day:"Fri",start:"01:30",end:"02:45"},
  {name:"C@ In The H@'s Balkan Beats & Gypsy Bangers",stage:"The Fools Leap",day:"Fri",start:"02:45",end:"04:00"},
  // --- Fri: The Garden Centre ---
  {name:"Heman",stage:"The Garden Centre",day:"Fri",start:"13:00",end:"14:00"},
  {name:"Sidetrakka",stage:"The Garden Centre",day:"Fri",start:"14:00",end:"15:15"},
  {name:"Cassia",stage:"The Garden Centre",day:"Fri",start:"15:15",end:"16:30"},
  {name:"The Blister Pack",stage:"The Garden Centre",day:"Fri",start:"16:30",end:"18:00"},
  {name:"Michael Joyce",stage:"The Garden Centre",day:"Fri",start:"18:00",end:"19:00"},
  {name:"The Regional Manager's Garden Show",stage:"The Garden Centre",day:"Fri",start:"21:00",end:"22:00"},
  {name:"Strawberry Jams",stage:"The Garden Centre",day:"Fri",start:"22:00",end:"22:30"},
  {name:"WildSoul",stage:"The Garden Centre",day:"Fri",start:"22:30",end:"23:30"},
  {name:"Charlie Power",stage:"The Garden Centre",day:"Fri",start:"23:30",end:"00:30"},
  {name:"Prolifix",stage:"The Garden Centre",day:"Fri",start:"00:30",end:"01:30"},
  {name:"basshead",stage:"The Garden Centre",day:"Fri",start:"01:30",end:"02:45"},
  {name:"The Prophet",stage:"The Garden Centre",day:"Fri",start:"02:45",end:"04:00"},
  // --- Fri: The Immortal Children of the Eternal Seed ---
  {name:"Ikamba",stage:"The Immortal Children of the Eternal Seed",day:"Fri",start:"22:00",end:"23:00"},
  {name:"Vic Tandy",stage:"The Immortal Children of the Eternal Seed",day:"Fri",start:"23:00",end:"00:00"},
  {name:"MontiColombi",stage:"The Immortal Children of the Eternal Seed",day:"Fri",start:"00:00",end:"01:00"},
  {name:"Minki",stage:"The Immortal Children of the Eternal Seed",day:"Fri",start:"01:00",end:"02:00"},
  {name:"Chinese Daughter",stage:"The Immortal Children of the Eternal Seed",day:"Fri",start:"02:00",end:"03:00"},
  {name:"Mowgli b2b Slewy",stage:"The Immortal Children of the Eternal Seed",day:"Fri",start:"03:00",end:"04:00"},
  // --- Fri: The Lion's Den ---
  {name:"Boomtown Opening Ceremony",stage:"The Lion's Den",day:"Fri",start:"12:00",end:"12:30"},
  {name:"Madness",stage:"The Lion's Den",day:"Fri",start:"12:30",end:"13:50",genre:"Ska / Punk"},
  {name:"Shy FX Ft. Rage",stage:"The Lion's Den",day:"Fri",start:"14:05",end:"15:30",genre:"Jungle"},
  {name:"Sub Focus",stage:"The Lion's Den",day:"Fri",start:"15:30",end:"16:30",genre:"Drum & Bass"},
  {name:"Alborosie & Shengen Clan",stage:"The Lion's Den",day:"Fri",start:"17:00",end:"18:00",genre:"Reggae"},
  {name:"Gentleman's Dub Club & Friends",stage:"The Lion's Den",day:"Fri",start:"18:30",end:"20:00",genre:"Dub / Roots"},
  {name:"Ren",stage:"The Lion's Den",day:"Fri",start:"20:30",end:"21:30",genre:"Hip Hop"},
  {name:"Kneecap",stage:"The Lion's Den",day:"Fri",start:"22:15",end:"23:30",genre:"Hip Hop"},
  {name:"Wilkinson Ft. MC AD-APT",stage:"The Lion's Den",day:"Fri",start:"23:15",end:"00:30",genre:"Drum & Bass"},
  {name:"Camo & Krooked B2B Mefjus Ft. Daxta",stage:"The Lion's Den",day:"Fri",start:"00:30",end:"02:00",genre:"Drum & Bass"},
  // --- Fri: The Magic Teapot ---
  {name:"The Magic Teapot",stage:"The Magic Teapot",day:"Fri",start:"12:00",end:"00:00"},
  // --- Fri: The Pomegranate Parlour ---
  {name:"Estère",stage:"The Pomegranate Parlour",day:"Fri",start:"13:00",end:"14:00"},
  {name:"Tanti",stage:"The Pomegranate Parlour",day:"Fri",start:"14:00",end:"15:00"},
  {name:"Hiphoppapotamus B2B Burland",stage:"The Pomegranate Parlour",day:"Fri",start:"15:00",end:"17:00"},
  {name:"Sweet Chilli",stage:"The Pomegranate Parlour",day:"Fri",start:"17:00",end:"18:00"},
  {name:"Flibble",stage:"The Pomegranate Parlour",day:"Fri",start:"18:00",end:"19:00"},
  {name:"Ikamba",stage:"The Pomegranate Parlour",day:"Fri",start:"19:00",end:"20:00"},
  {name:"Mattana",stage:"The Pomegranate Parlour",day:"Fri",start:"20:00",end:"21:00"},
  {name:"DJ Shakey",stage:"The Pomegranate Parlour",day:"Fri",start:"21:00",end:"22:00"},
  {name:"Somatic",stage:"The Pomegranate Parlour",day:"Fri",start:"22:00",end:"23:00"},
  {name:"LuDec",stage:"The Pomegranate Parlour",day:"Fri",start:"23:00",end:"00:00"},
  {name:"Gypsyndicate",stage:"The Pomegranate Parlour",day:"Fri",start:"00:00",end:"01:00"},
  {name:"Illexxandra",stage:"The Pomegranate Parlour",day:"Fri",start:"01:00",end:"02:00"},
  {name:"Charlie Power",stage:"The Pomegranate Parlour",day:"Fri",start:"02:00",end:"03:00"},
  {name:"Pablo Dutta",stage:"The Pomegranate Parlour",day:"Fri",start:"03:00",end:"03:55"},
  // --- Fri: Tinker Station ---
  {name:"Tinker Station",stage:"Tinker Station",day:"Fri",start:"10:00",end:"18:00"},
  // --- Fri: Topsy Turvy Trims ---
  {name:"Black Board Soundsystem",stage:"Topsy Turvy Trims",day:"Fri",start:"13:00",end:"15:00"},
  {name:"TBA",stage:"Topsy Turvy Trims",day:"Fri",start:"15:00",end:"17:00"},
  {name:"Hokey Cokey Cabaret",stage:"Topsy Turvy Trims",day:"Fri",start:"17:00",end:"18:00"},
  {name:"Ignoring Izzy",stage:"Topsy Turvy Trims",day:"Fri",start:"19:00",end:"21:00"},
  {name:"Ed Spinna",stage:"Topsy Turvy Trims",day:"Fri",start:"21:00",end:"22:00"},
  {name:"Merchant",stage:"Topsy Turvy Trims",day:"Fri",start:"22:00",end:"00:00"},
  {name:"Goose",stage:"Topsy Turvy Trims",day:"Fri",start:"00:00",end:"01:00"},
  {name:"TBA",stage:"Topsy Turvy Trims",day:"Fri",start:"01:00",end:"01:30"},
  {name:"BitchSlap",stage:"Topsy Turvy Trims",day:"Fri",start:"01:30",end:"02:30"},
  // --- Fri: Tribe of Frog ---
  {name:"Velor",stage:"Tribe of Frog",day:"Fri",start:"12:00",end:"13:30"},
  {name:"Cheska Onyx",stage:"Tribe of Frog",day:"Fri",start:"13:30",end:"15:00"},
  {name:"Medusa",stage:"Tribe of Frog",day:"Fri",start:"15:00",end:"16:30"},
  {name:"Psylo Verse",stage:"Tribe of Frog",day:"Fri",start:"16:30",end:"18:00"},
  {name:"Daijiro",stage:"Tribe of Frog",day:"Fri",start:"18:00",end:"19:30"},
  {name:"Hatta",stage:"Tribe of Frog",day:"Fri",start:"19:30",end:"21:00"},
  {name:"Onero",stage:"Tribe of Frog",day:"Fri",start:"21:00",end:"22:30"},
  {name:"Thelios",stage:"Tribe of Frog",day:"Fri",start:"22:30",end:"23:30"},
  {name:"Aardvarkk",stage:"Tribe of Frog",day:"Fri",start:"23:00",end:"00:30"},
  {name:"Altruism",stage:"Tribe of Frog",day:"Fri",start:"00:30",end:"01:30"},
  {name:"Athzira",stage:"Tribe of Frog",day:"Fri",start:"01:30",end:"02:30"},
  {name:"Stryker",stage:"Tribe of Frog",day:"Fri",start:"02:30",end:"04:00"},
  // --- Fri: Twisted Time Machine (Bad Apple Bar) ---
  {name:"UNKLE - PSYENCE FICTION (Album Playback)",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Fri",start:"12:00",end:"13:00"},
  {name:"THE FUGEES - THE SCORE (Album Playback)",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Fri",start:"13:00",end:"14:00"},
  {name:"DAY TRIPPING : ALBUM PLAYBACKS with PAPA DISCO",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Fri",start:"14:00",end:"15:00"},
  {name:"ZZZONKED : ENTER SHIKARI POWER HOUR",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Fri",start:"15:00",end:"16:00"},
  {name:"SABRINA CARPENTRY",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Fri",start:"16:00",end:"17:00"},
  {name:"THAT DISNEY PARTY!",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Fri",start:"17:00",end:"18:00"},
  {name:"SLAYYYTER : Worst Girl In America Album Playback",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Fri",start:"18:00",end:"19:00"},
  {name:"CYBERTEASE : Boomtown Baddies",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Fri",start:"19:00",end:"20:00"},
  {name:"BOOMTOWN PRIDE : BRITNEY SPEARS APPRECIATION SOCIETY PART V",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Fri",start:"20:00",end:"21:00"},
  {name:"BOOMTOWN PRIDE : OPENING CEREMONY WITH DJ GAYLORD",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Fri",start:"21:00",end:"22:00"},
  {name:"BOOMTOWN PRIDE : QUEER HOUSE PARTY",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Fri",start:"22:00",end:"23:00"},
  {name:"BOOMTOWN PRIDE : BENDY WENDY",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Fri",start:"23:00",end:"00:00"},
  {name:"BOOMTOWN PRIDE : DONK IF YOU'RE HORNY",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Fri",start:"00:00",end:"00:45"},
  {name:"BOOMTOWN PRIDE : UOKHUNS HEN DO",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Fri",start:"00:45",end:"01:45"},
  {name:"BOOMTOWN PRIDE : FIGS presents EUROPHOBIA",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Fri",start:"01:45",end:"02:30"},
  {name:"BOOMTOWN PRIDE :  FULL THROTTLE HARD HOUSE with TEDDY LAMBORGHINI",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Fri",start:"02:30",end:"03:15"},
  {name:"BOOMTOWN PRIDE :  LG:Bx:T : Hard Pride :",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Fri",start:"03:15",end:"04:00"},
  // --- Fri: XR ---
  {name:"Last Chance Salon",stage:"XR",day:"Fri",start:"11:00",end:"19:00"},
  {name:"Cassandra the Oracle",stage:"XR",day:"Fri",start:"11:00",end:"12:00"},
  {name:"Art Blocking",stage:"XR",day:"Fri",start:"11:00",end:"18:30"},
  {name:"Drumming Workshop",stage:"XR",day:"Fri",start:"13:00",end:"14:00"},
  {name:"Drumming Workshop",stage:"XR",day:"Fri",start:"13:00",end:"14:00"},
  {name:"Cassandra the Oracle",stage:"XR",day:"Fri",start:"14:00",end:"16:00"},
  {name:"Tea Ladies",stage:"XR",day:"Fri",start:"14:00",end:"18:00"},
  {name:"Costume Pimping",stage:"XR",day:"Fri",start:"14:00",end:"18:00"},
  {name:"Strictly Burning Ballroom",stage:"XR",day:"Fri",start:"18:00",end:"18:30"},
  // ================= SAT =================
  // --- Sat: Acid Leak ---
  {name:"Neutron (TIP Records)",stage:"Acid Leak",day:"Sat",start:"13:00",end:"14:30"},
  {name:"Mark EG",stage:"Acid Leak",day:"Sat",start:"14:30",end:"16:00"},
  {name:"Tassid",stage:"Acid Leak",day:"Sat",start:"16:00",end:"17:30"},
  {name:"Aaron Liberator",stage:"Acid Leak",day:"Sat",start:"17:30",end:"19:00"},
  {name:"Birinight",stage:"Acid Leak",day:"Sat",start:"19:00",end:"20:30"},
  {name:"Chris Liberator",stage:"Acid Leak",day:"Sat",start:"20:30",end:"22:00"},
  {name:"Acid Mutant",stage:"Acid Leak",day:"Sat",start:"22:00",end:"23:30"},
  {name:"James Kinetec",stage:"Acid Leak",day:"Sat",start:"23:30",end:"01:00"},
  {name:"Brooksie",stage:"Acid Leak",day:"Sat",start:"01:00",end:"02:30"},
  {name:"Matt Acidic",stage:"Acid Leak",day:"Sat",start:"02:30",end:"04:00"},
  // --- Sat: Agents of Change HQ ---
  {name:"Agents of Change HQ",stage:"Agents of Change HQ",day:"Sat",start:"10:00",end:"20:00"},
  {name:"Weaving Change",stage:"Agents of Change HQ",day:"Sat",start:"10:00",end:"18:00"},
  {name:"Giant Triplets",stage:"Agents of Change HQ",day:"Sat",start:"11:00",end:"14:00"},
  {name:"Giant Triplets",stage:"Agents of Change HQ",day:"Sat",start:"16:00",end:"19:00"},
  // --- Sat: Airetiko ---
  {name:"Airetiko Trapeze",stage:"Airetiko",day:"Sat",start:"11:00",end:"13:00"},
  {name:"Airetiko Giant Marionettes",stage:"Airetiko",day:"Sat",start:"13:00",end:"15:00"},
  {name:"Airetiko Trapeze",stage:"Airetiko",day:"Sat",start:"15:00",end:"17:00"},
  // --- Sat: Anara Forest ---
  {name:"ELOQ B2B ESC",stage:"Anara Forest",day:"Sat",start:"14:00",end:"15:00"},
  {name:"HiTech",stage:"Anara Forest",day:"Sat",start:"15:00",end:"16:00"},
  {name:"Pete Cannon - Live",stage:"Anara Forest",day:"Sat",start:"16:00",end:"17:00",genre:"Jungle"},
  {name:"Ivy Lab",stage:"Anara Forest",day:"Sat",start:"17:00",end:"18:30"},
  {name:"Buunshin",stage:"Anara Forest",day:"Sat",start:"18:30",end:"19:45"},
  {name:"J:Kenzo B2B Skeptical (140 Set) Ft. SP:MC [20 Years Of Rupture]",stage:"Anara Forest",day:"Sat",start:"19:45",end:"21:15",genre:"Jungle"},
  {name:"Breakage B2B Flight [20 Years Of Rupture]",stage:"Anara Forest",day:"Sat",start:"21:15",end:"22:45",genre:"Jungle"},
  {name:"Mantra B2B Tim Reaper [20 Years Of Rupture]",stage:"Anara Forest",day:"Sat",start:"22:45",end:"00:15",genre:"Jungle"},
  {name:"Double O B2B SHERELLE [20 Years Of Rupture]",stage:"Anara Forest",day:"Sat",start:"00:15",end:"01:45",genre:"Jungle"},
  {name:"DJ Die B2B Krust [20 Years Of Rupture]",stage:"Anara Forest",day:"Sat",start:"01:45",end:"03:00",genre:"Jungle"},
  // --- Sat: Ancient Futures ---
  {name:"Deep Chill Yoga",stage:"Ancient Futures",day:"Sat",start:"11:30",end:"13:30"},
  {name:"The Future of Cannabis",stage:"Ancient Futures",day:"Sat",start:"14:00",end:"15:00"},
  {name:"Multidimensional Workshop",stage:"Ancient Futures",day:"Sat",start:"15:30",end:"16:30"},
  {name:"Science for wellness",stage:"Ancient Futures",day:"Sat",start:"17:00",end:"18:00"},
  {name:"Rhythmic Release",stage:"Ancient Futures",day:"Sat",start:"18:30",end:"20:30"},
  {name:"4BEAT Yoga",stage:"Ancient Futures",day:"Sat",start:"09:00",end:"11:00"},
  // --- Sat: Blink Mental Health ---
  {name:"Blink Mental Health Chill-Out Space",stage:"Blink Mental Health",day:"Sat",start:"10:00",end:"19:30"},
  // --- Sat: Botanica Zoo ---
  {name:"SIS:DEM TAKEN OVER: Anything but Becky B2B es.kay B2B Megwan B2B Siraya B2B MSG",stage:"Botanica Zoo",day:"Sat",start:"15:00",end:"17:00"},
  {name:"Lady Lena w/ Nav [Only Rave Handles takeover]",stage:"Botanica Zoo",day:"Sat",start:"17:00",end:"18:00"},
  {name:"Scorpio B2B Fendi K [Only Rave Handles takeover]",stage:"Botanica Zoo",day:"Sat",start:"18:00",end:"19:00"},
  {name:"Origin8a & Propa B2B A.N.T [Only Rave Handles takeover]",stage:"Botanica Zoo",day:"Sat",start:"19:00",end:"20:00"},
  {name:"Dwarde B2B Tim Reaper B2B Abby Daze w/ MC Punched Face & The Daisy Roots Movement Dancers [Only Rave Handles takeover]",stage:"Botanica Zoo",day:"Sat",start:"20:00",end:"22:00"},
  {name:"Mike Freear (Slamboree DJ set) [Cranked Soundsystem takeover]",stage:"Botanica Zoo",day:"Sat",start:"22:00",end:"23:00"},
  {name:"CICELY [Cranked Soundsystem takeover]",stage:"Botanica Zoo",day:"Sat",start:"23:00",end:"00:00"},
  {name:"Alk-M-E B2B Malware (100% own-productions set) [Cranked Soundsystem takeover]",stage:"Botanica Zoo",day:"Sat",start:"00:00",end:"01:00"},
  {name:"Crank (vinyl set) w/ MC Stretch [Cranked Soundsystem takeover]",stage:"Botanica Zoo",day:"Sat",start:"01:00",end:"02:00"},
  {name:"E-Coli [Cranked Soundsystem takeover]",stage:"Botanica Zoo",day:"Sat",start:"02:00",end:"03:00"},
  {name:"Asher Ashan",stage:"Botanica Zoo",day:"Sat",start:"03:00",end:"03:55"},
  // --- Sat: Busker's Wharf ---
  {name:"The Pussy Catbaret",stage:"Busker's Wharf",day:"Sat",start:"19:30",end:"20:30"},
  {name:"The Lobster Cabaret",stage:"Busker's Wharf",day:"Sat",start:"21:00",end:"22:00"},
  // --- Sat: Cas's Costumes ---
  {name:"Engineers of Desire",stage:"Cas's Costumes",day:"Sat",start:"10:00",end:"18:00"},
  // --- Sat: Circus Tent ---
  {name:"Belly Dance",stage:"Circus Tent",day:"Sat",start:"10:00",end:"11:00"},
  {name:"Wye Circus Skills, Juggling, Dapo Star",stage:"Circus Tent",day:"Sat",start:"12:00",end:"14:00"},
  {name:"Wye Circus Skills, Hoop",stage:"Circus Tent",day:"Sat",start:"14:00",end:"16:00"},
  {name:"Wye Circus Skills, Poi, Staff, Flower Stick",stage:"Circus Tent",day:"Sat",start:"16:00",end:"18:00"},
  {name:"Inspired Breath",stage:"Circus Tent",day:"Sat",start:"18:00",end:"19:00"},
  {name:"Wye Circus Fire Show",stage:"Circus Tent",day:"Sat",start:"21:00",end:"22:00"},
  // --- Sat: Climate Live ---
  {name:"Climate Live Opening",stage:"Climate Live",day:"Sat",start:"10:00",end:"20:00"},
  {name:"Patch It For The Planet: Upcycled Patch Making - The Mend",stage:"Climate Live",day:"Sat",start:"10:30",end:"11:30"},
  {name:"Beads & Breathe",stage:"Climate Live",day:"Sat",start:"11:45",end:"12:45"},
  {name:"Kemastry: Caged & Free, Creative Writing",stage:"Climate Live",day:"Sat",start:"13:00",end:"14:00"},
  {name:"Mediterranean Herb Repotting - Grounds for Growth",stage:"Climate Live",day:"Sat",start:"14:15",end:"15:15"},
  {name:"Collective Climate Collage Making - Quirky Academy CIC",stage:"Climate Live",day:"Sat",start:"15:30",end:"16:30"},
  {name:"Jungyals and Gays: Festival Flag Making and Community Conversations",stage:"Climate Live",day:"Sat",start:"16:45",end:"17:45"},
  // --- Sat: Cocaine Anonymous ---
  {name:"Cocaine Anonymous Meeting",stage:"Cocaine Anonymous",day:"Sat",start:"11:00",end:"12:00"},
  {name:"Cocaine Anonymous Meeting",stage:"Cocaine Anonymous",day:"Sat",start:"18:00",end:"19:00"},
  // --- Sat: Community Fire ---
  {name:"Community Fire (Running 24hrs)",stage:"Community Fire",day:"Sat",start:"12:00",end:"00:00"},
  // --- Sat: Craft Tent ---
  {name:"Botanical Fascinators",stage:"Craft Tent",day:"Sat",start:"10:00",end:"18:00"},
  {name:"Hitty Hitty Bang Bang",stage:"Craft Tent",day:"Sat",start:"10:00",end:"18:00"},
  {name:"Junk Jewelery",stage:"Craft Tent",day:"Sat",start:"10:00",end:"18:00"},
  // --- Sat: Crafty Rascals ---
  {name:"Crafty Rascals",stage:"Crafty Rascals",day:"Sat",start:"10:00",end:"18:00"},
  // --- Sat: Deviant Lounge ---
  {name:"Charles the Princess b2b Pretty Patel",stage:"Deviant Lounge",day:"Sat",start:"20:00",end:"21:00"},
  {name:"Plughole Takeover (PSYCHO-SIS b2b FKATITS)",stage:"Deviant Lounge",day:"Sat",start:"21:00",end:"22:00"},
  {name:"Miss Bee Spinner b2b Promiscuous Piggy",stage:"Deviant Lounge",day:"Sat",start:"22:00",end:"23:00"},
  {name:"DJ Elsa From Frozen",stage:"Deviant Lounge",day:"Sat",start:"23:00",end:"23:30"},
  {name:"Bunn13",stage:"Deviant Lounge",day:"Sat",start:"23:30",end:"00:10"},
  {name:"Kake",stage:"Deviant Lounge",day:"Sat",start:"00:10",end:"00:50"},
  {name:"Skrub",stage:"Deviant Lounge",day:"Sat",start:"00:50",end:"01:30"},
  {name:"Goosey",stage:"Deviant Lounge",day:"Sat",start:"01:30",end:"02:15"},
  {name:"Mums Against Donk Takeover (Pissxie)",stage:"Deviant Lounge",day:"Sat",start:"02:15",end:"03:00"},
  {name:"Mums Against Donk Takeover (Alterum)",stage:"Deviant Lounge",day:"Sat",start:"03:00",end:"04:00"},
  // --- Sat: E Numbers ---
  {name:"Silent Disco",stage:"E Numbers",day:"Sat",start:"13:00",end:"19:00"},
  {name:"Dance Mums",stage:"E Numbers",day:"Sat",start:"19:00",end:"19:45"},
  {name:"Dykes on Decks",stage:"E Numbers",day:"Sat",start:"19:45",end:"21:15"},
  {name:"C.EXE",stage:"E Numbers",day:"Sat",start:"21:15",end:"22:00"},
  {name:"Mannequins: Tommy Tempo",stage:"E Numbers",day:"Sat",start:"22:00",end:"22:45"},
  {name:"Mannequins: Yoyo",stage:"E Numbers",day:"Sat",start:"22:45",end:"23:30"},
  {name:"ÆON: Muzhit",stage:"E Numbers",day:"Sat",start:"23:30",end:"00:15"},
  {name:"ÆON: VAQERO",stage:"E Numbers",day:"Sat",start:"00:15",end:"01:00"},
  {name:"ÆON: Sissy Cinnamon",stage:"E Numbers",day:"Sat",start:"01:00",end:"01:45"},
  {name:"ÆON: Spinks",stage:"E Numbers",day:"Sat",start:"01:45",end:"02:30"},
  {name:"ÆON: nohexcode",stage:"E Numbers",day:"Sat",start:"02:30",end:"03:15"},
  {name:"ÆON: CITYTRONIX",stage:"E Numbers",day:"Sat",start:"03:15",end:"04:00"},
  // --- Sat: End of the Line ---
  {name:"DJ OSU!",stage:"End of the Line",day:"Sat",start:"20:00",end:"20:45"},
  {name:"Clara",stage:"End of the Line",day:"Sat",start:"20:40",end:"21:20"},
  {name:"Waxtek",stage:"End of the Line",day:"Sat",start:"21:20",end:"22:00"},
  {name:"Mollie Rush",stage:"End of the Line",day:"Sat",start:"22:00",end:"22:45"},
  {name:"Gabba Banoush",stage:"End of the Line",day:"Sat",start:"22:45",end:"23:25"},
  {name:"Charlie Power",stage:"End of the Line",day:"Sat",start:"23:25",end:"00:05"},
  {name:"Seppa",stage:"End of the Line",day:"Sat",start:"00:05",end:"01:05"},
  {name:"Gullyteen",stage:"End of the Line",day:"Sat",start:"01:05",end:"01:50"},
  {name:"N1PP1LLS",stage:"End of the Line",day:"Sat",start:"01:50",end:"02:30"},
  {name:"Kalisae",stage:"End of the Line",day:"Sat",start:"02:30",end:"03:15"},
  {name:"Iffyhype",stage:"End of the Line",day:"Sat",start:"03:15",end:"04:00"},
  // --- Sat: Energy Garden ---
  {name:"Energy Garden Opening",stage:"Energy Garden",day:"Sat",start:"12:00",end:"22:00"},
  {name:"Solar Panel Building Workshop",stage:"Energy Garden",day:"Sat",start:"13:00",end:"15:00"},
  // --- Sat: Foggers Mill ---
  {name:"Dr Beatroot",stage:"Foggers Mill",day:"Sat",start:"13:00",end:"14:00"},
  {name:"Toast",stage:"Foggers Mill",day:"Sat",start:"14:30",end:"15:30"},
  {name:"Monkey Bizzle",stage:"Foggers Mill",day:"Sat",start:"16:00",end:"17:00"},
  {name:"Samantics",stage:"Foggers Mill",day:"Sat",start:"17:30",end:"18:30"},
  {name:"Bratakus",stage:"Foggers Mill",day:"Sat",start:"19:00",end:"20:00"},
  {name:"Good Health Good Wealth",stage:"Foggers Mill",day:"Sat",start:"20:30",end:"21:30"},
  {name:"Scustin",stage:"Foggers Mill",day:"Sat",start:"22:00",end:"23:00"},
  {name:"Toby Spin",stage:"Foggers Mill",day:"Sat",start:"23:30",end:"00:30"},
  {name:"The Destroyers",stage:"Foggers Mill",day:"Sat",start:"01:00",end:"02:00"},
  // --- Sat: Full Moon Ballroom ---
  {name:"Funky Drummer Collective",stage:"Full Moon Ballroom",day:"Sat",start:"13:00",end:"14:00"},
  {name:"Daraa Tribes",stage:"Full Moon Ballroom",day:"Sat",start:"14:30",end:"15:30"},
  {name:"Malavita!",stage:"Full Moon Ballroom",day:"Sat",start:"16:00",end:"17:00"},
  {name:"Kotoa",stage:"Full Moon Ballroom",day:"Sat",start:"17:30",end:"18:30"},
  {name:"Pachango",stage:"Full Moon Ballroom",day:"Sat",start:"19:00",end:"20:00"},
  {name:"Gnawa Blues All Stars",stage:"Full Moon Ballroom",day:"Sat",start:"20:30",end:"21:30"},
  {name:"Okailey",stage:"Full Moon Ballroom",day:"Sat",start:"22:00",end:"23:00"},
  {name:"PCHA",stage:"Full Moon Ballroom",day:"Sat",start:"23:30",end:"00:30"},
  {name:"Raz & Afla",stage:"Full Moon Ballroom",day:"Sat",start:"01:00",end:"02:00"},
  {name:"Hippo Sound System & S.I.M.O",stage:"Full Moon Ballroom",day:"Sat",start:"02:30",end:"04:00"},
  // --- Sat: Gabber Kebabber ---
  {name:"Jungyals and Gays Takeover",stage:"Gabber Kebabber",day:"Sat",start:"13:00",end:"15:00"},
  {name:"Shirley Temper b2b Syntax",stage:"Gabber Kebabber",day:"Sat",start:"15:00",end:"15:45"},
  {name:"Scottish Gabber Punk",stage:"Gabber Kebabber",day:"Sat",start:"15:45",end:"16:15"},
  {name:"Petrol Hoers",stage:"Gabber Kebabber",day:"Sat",start:"16:15",end:"16:45"},
  {name:"Phetcore",stage:"Gabber Kebabber",day:"Sat",start:"16:45",end:"17:30"},
  {name:"Audio Gutter",stage:"Gabber Kebabber",day:"Sat",start:"17:30",end:"18:30"},
  {name:"Dirty Chronic",stage:"Gabber Kebabber",day:"Sat",start:"18:30",end:"19:30"},
  {name:"Smifcour",stage:"Gabber Kebabber",day:"Sat",start:"19:30",end:"20:30"},
  {name:"Mikey Motion",stage:"Gabber Kebabber",day:"Sat",start:"20:30",end:"21:30"},
  {name:"Bobby Starchild",stage:"Gabber Kebabber",day:"Sat",start:"21:30",end:"22:30"},
  {name:"Manrat",stage:"Gabber Kebabber",day:"Sat",start:"22:30",end:"23:30"},
  {name:"MCAT",stage:"Gabber Kebabber",day:"Sat",start:"23:30",end:"00:10"},
  {name:"NICE’N’SPICY",stage:"Gabber Kebabber",day:"Sat",start:"00:10",end:"00:50"},
  {name:"HERBIE",stage:"Gabber Kebabber",day:"Sat",start:"00:50",end:"01:30"},
  {name:"GINNY",stage:"Gabber Kebabber",day:"Sat",start:"01:30",end:"02:15"},
  {name:"INDECLINE",stage:"Gabber Kebabber",day:"Sat",start:"02:15",end:"03:15"},
  {name:"Mollie Rush",stage:"Gabber Kebabber",day:"Sat",start:"03:15",end:"04:00"},
  // --- Sat: Games Lounge ---
  {name:"Games Lounge (Running 24hrs)",stage:"Games Lounge",day:"Sat",start:"12:00",end:"00:00"},
  // --- Sat: Garden ---
  {name:"Wildflower Fortunes",stage:"Garden",day:"Sat",start:"10:00",end:"18:00"},
  // --- Sat: Grand Central ---
  {name:"Hak Baker",stage:"Grand Central",day:"Sat",start:"13:00",end:"14:00",genre:"Indie / Alt Rock"},
  {name:"Rose Gray",stage:"Grand Central",day:"Sat",start:"14:30",end:"15:30",genre:"Pop / Dance"},
  {name:"Antony Szmierek",stage:"Grand Central",day:"Sat",start:"16:00",end:"17:00"},
  {name:"Songer",stage:"Grand Central",day:"Sat",start:"17:30",end:"18:30"},
  {name:"Sampa The Great",stage:"Grand Central",day:"Sat",start:"19:00",end:"20:00"},
  {name:"Princess Nokia",stage:"Grand Central",day:"Sat",start:"20:30",end:"21:30"},
  {name:"Ashnikko",stage:"Grand Central",day:"Sat",start:"22:00",end:"23:00"},
  {name:"Peaches",stage:"Grand Central",day:"Sat",start:"23:30",end:"00:30"},
  // --- Sat: Hangar 161 ---
  {name:"Hot Squash",stage:"Hangar 161",day:"Sat",start:"13:00",end:"13:40"},
  {name:"Pussy Liquor",stage:"Hangar 161",day:"Sat",start:"14:00",end:"14:40"},
  {name:"Problem Patterns",stage:"Hangar 161",day:"Sat",start:"15:00",end:"15:40"},
  {name:"Vegan Meat Raffle",stage:"Hangar 161",day:"Sat",start:"16:00",end:"16:40"},
  {name:"Bruise Control",stage:"Hangar 161",day:"Sat",start:"17:00",end:"17:40"},
  {name:"The Restarts",stage:"Hangar 161",day:"Sat",start:"18:00",end:"18:40"},
  {name:"Inner Terrestrials",stage:"Hangar 161",day:"Sat",start:"19:00",end:"20:00",genre:"Ska / Punk"},
  {name:"Popes Of Chillitown",stage:"Hangar 161",day:"Sat",start:"20:30",end:"21:30",genre:"Ska / Punk"},
  {name:"Svetlanas",stage:"Hangar 161",day:"Sat",start:"22:00",end:"23:00"},
  {name:"China Shop Bull",stage:"Hangar 161",day:"Sat",start:"23:30",end:"00:30"},
  {name:"Silverwingkiller",stage:"Hangar 161",day:"Sat",start:"01:00",end:"02:00"},
  // --- Sat: Hapitat ---
  {name:"Hapitat",stage:"Hapitat",day:"Sat",start:"10:00",end:"18:00"},
  // --- Sat: Helix ---
  {name:"Josephine Gyasi",stage:"Helix",day:"Sat",start:"16:30",end:"17:30"},
  {name:"Joe Sonar B2B Rose Holland",stage:"Helix",day:"Sat",start:"17:30",end:"19:00"},
  {name:"Steady",stage:"Helix",day:"Sat",start:"19:00",end:"20:00"},
  {name:"LemTom",stage:"Helix",day:"Sat",start:"20:00",end:"21:00"},
  {name:"Brown Excellence",stage:"Helix",day:"Sat",start:"21:00",end:"22:30"},
  {name:"JIALING",stage:"Helix",day:"Sat",start:"22:30",end:"00:00"},
  {name:"Jay Carder",stage:"Helix",day:"Sat",start:"00:00",end:"01:30"},
  {name:"DJ Cosworth B2B Oldboy",stage:"Helix",day:"Sat",start:"01:30",end:"03:00"},
  // --- Sat: Hidden Woods ---
  {name:"Rebel Clash",stage:"Hidden Woods",day:"Sat",start:"12:00",end:"13:30"},
  {name:"DJ Hype: Reggae 2 Jungle",stage:"Hidden Woods",day:"Sat",start:"13:30",end:"15:00",genre:"Jungle"},
  {name:"General Levy - Live PA",stage:"Hidden Woods",day:"Sat",start:"15:00",end:"15:30",genre:"Jungle"},
  {name:"Sir Spyro Ft. Killa P & Lady Chann",stage:"Hidden Woods",day:"Sat",start:"15:30",end:"17:00"},
  {name:"Saint Ludo",stage:"Hidden Woods",day:"Sat",start:"17:00",end:"18:00"},
  {name:"Arthi",stage:"Hidden Woods",day:"Sat",start:"18:00",end:"19:00"},
  {name:"Bakey B2B Mia Koden",stage:"Hidden Woods",day:"Sat",start:"19:00",end:"20:30"},
  {name:"Ryota B2B Yung Singh",stage:"Hidden Woods",day:"Sat",start:"20:30",end:"22:00"},
  {name:"Neffa-T Ft. D Double E",stage:"Hidden Woods",day:"Sat",start:"22:00",end:"23:30"},
  {name:"Cesco B2B Halogenix Ft. Strategy",stage:"Hidden Woods",day:"Sat",start:"23:30",end:"01:00"},
  {name:"Zero",stage:"Hidden Woods",day:"Sat",start:"01:00",end:"02:30"},
  {name:"Voltage - Jungle Classics Ft. Shabba D",stage:"Hidden Woods",day:"Sat",start:"02:30",end:"04:00",genre:"Jungle"},
  // --- Sat: Hotel Paradiso ---
  {name:"Vibe Roulette",stage:"Hotel Paradiso",day:"Sat",start:"19:30",end:"21:30"},
  {name:"DJ Andres Cervero",stage:"Hotel Paradiso",day:"Sat",start:"21:30",end:"22:00"},
  {name:"Malavita!",stage:"Hotel Paradiso",day:"Sat",start:"22:00",end:"23:00"},
  {name:"DJ Andres Cervero",stage:"Hotel Paradiso",day:"Sat",start:"23:00",end:"00:00"},
  {name:"Tripl3 B & The Trouble Makers",stage:"Hotel Paradiso",day:"Sat",start:"00:00",end:"01:00"},
  {name:"Banshee takeover: Rua Tui ft Kathika, Maddy V + Savvy B",stage:"Hotel Paradiso",day:"Sat",start:"01:00",end:"02:00"},
  // --- Sat: Hydro XL ---
  {name:"Melé B2B Olive F",stage:"Hydro XL",day:"Sat",start:"17:00",end:"18:30"},
  {name:"Folamour",stage:"Hydro XL",day:"Sat",start:"18:30",end:"20:00"},
  {name:"Rossi. B2B Silva Bumpa",stage:"Hydro XL",day:"Sat",start:"20:00",end:"21:15"},
  {name:"Floating Points - Live",stage:"Hydro XL",day:"Sat",start:"21:25",end:"22:25"},
  {name:"Four Tet",stage:"Hydro XL",day:"Sat",start:"22:35",end:"00:05"},
  {name:"Brutalismus 3000",stage:"Hydro XL",day:"Sat",start:"00:15",end:"01:30"},
  {name:"Azyr",stage:"Hydro XL",day:"Sat",start:"01:40",end:"03:00"},
  // --- Sat: Infinity ---
  {name:"[Queer House Party Takeover] Bledi",stage:"Infinity",day:"Sat",start:"18:00",end:"19:00"},
  {name:"[Queer House Party Takeover] Bambi",stage:"Infinity",day:"Sat",start:"19:00",end:"20:00"},
  {name:"[Queer House Party Takeover] Dykes on Decks",stage:"Infinity",day:"Sat",start:"20:00",end:"21:30"},
  {name:"[Queer House Party Takeover] UOKHUN",stage:"Infinity",day:"Sat",start:"21:30",end:"23:00"},
  {name:"[Queer House Party Takeover] Rose Gray - DJ Set",stage:"Infinity",day:"Sat",start:"23:00",end:"00:00"},
  {name:"[Queer House Party Takeover] I. JORDAN",stage:"Infinity",day:"Sat",start:"00:00",end:"02:00"},
  {name:"[Queer House Party Takeover] Harry Gay B2B Meg Ward",stage:"Infinity",day:"Sat",start:"02:00",end:"04:00"},
  {name:"Queer House Party",stage:"Infinity",day:"Sat",start:"03:00",end:"04:00"},
  // --- Sat: Luck Exchange Casino ---
  {name:"Deal Of Fortune",stage:"Luck Exchange Casino",day:"Sat",start:"19:05",end:"19:20"},
  {name:"Dick Fran Dyke",stage:"Luck Exchange Casino",day:"Sat",start:"19:20",end:"19:25"},
  {name:"Air Horny",stage:"Luck Exchange Casino",day:"Sat",start:"19:25",end:"19:35"},
  {name:"DJ Buckaroo",stage:"Luck Exchange Casino",day:"Sat",start:"19:35",end:"19:50"},
  {name:"Carrot And Dick",stage:"Luck Exchange Casino",day:"Sat",start:"19:55",end:"20:00"},
  {name:"Dick Fran Dyke",stage:"Luck Exchange Casino",day:"Sat",start:"20:00",end:"20:05"},
  {name:"Rate My Horse Drawing",stage:"Luck Exchange Casino",day:"Sat",start:"20:05",end:"20:15"},
  {name:"The Paul Taylor Experience",stage:"Luck Exchange Casino",day:"Sat",start:"20:15",end:"20:45"},
  {name:"DJ Noeyedear",stage:"Luck Exchange Casino",day:"Sat",start:"20:45",end:"21:15"},
  {name:"Petrol Hoers",stage:"Luck Exchange Casino",day:"Sat",start:"21:15",end:"21:45"},
  // --- Sat: Mining for (g)Old Town ---
  {name:"MAGGS",stage:"Mining for (g)Old Town",day:"Sat",start:"13:30",end:"15:00"},
  {name:"Father Lynch",stage:"Mining for (g)Old Town",day:"Sat",start:"15:00",end:"16:30"},
  {name:"Emma Ash",stage:"Mining for (g)Old Town",day:"Sat",start:"16:30",end:"17:30"},
  {name:"WildSoul",stage:"Mining for (g)Old Town",day:"Sat",start:"17:30",end:"19:00"},
  // --- Sat: Nachtlicker ---
  {name:"JACKDOESJUNGLE",stage:"Nachtlicker",day:"Sat",start:"18:00",end:"19:00"},
  {name:"PEPPA",stage:"Nachtlicker",day:"Sat",start:"19:00",end:"20:00"},
  {name:"PJ PEEK",stage:"Nachtlicker",day:"Sat",start:"20:00",end:"21:15"},
  {name:"RIZZY & THE GENTS [live]",stage:"Nachtlicker",day:"Sat",start:"21:15",end:"22:00"},
  {name:"MILITANT MUSIC",stage:"Nachtlicker",day:"Sat",start:"22:00",end:"23:00"},
  {name:"GOFF feat BABY SOL",stage:"Nachtlicker",day:"Sat",start:"23:00",end:"00:15"},
  {name:"Shirley Temper",stage:"Nachtlicker",day:"Sat",start:"00:15",end:"01:30"},
  {name:"THE BASS INJECTOR",stage:"Nachtlicker",day:"Sat",start:"01:30",end:"02:30"},
  {name:"KELLS",stage:"Nachtlicker",day:"Sat",start:"02:30",end:"04:00"},
  // --- Sat: Narcotics Anonymous ---
  {name:"Narcotic Anonymous Meeting",stage:"Narcotics Anonymous",day:"Sat",start:"13:00",end:"14:00"},
  {name:"Narcotic Anonymous Meeting",stage:"Narcotics Anonymous",day:"Sat",start:"08:00",end:"09:00"},
  // --- Sat: Nexus ---
  {name:"Bongo's Bingo",stage:"Nexus",day:"Sat",start:"14:00",end:"15:00"},
  {name:"Miss Kaninna",stage:"Nexus",day:"Sat",start:"15:30",end:"16:30"},
  {name:"Verbz & Mr Slipz [High Focus Records]",stage:"Nexus",day:"Sat",start:"16:40",end:"17:00"},
  {name:"Farma G [High Focus Records]",stage:"Nexus",day:"Sat",start:"17:00",end:"17:20"},
  {name:"Onoe Caponoe [High Focus Records]",stage:"Nexus",day:"Sat",start:"17:20",end:"17:40"},
  {name:"Truemendous [High Focus Records]",stage:"Nexus",day:"Sat",start:"17:40",end:"18:00"},
  {name:"Ramson Badbonez [High Focus Records]",stage:"Nexus",day:"Sat",start:"18:00",end:"18:20"},
  {name:"Verb T [High Focus Records]",stage:"Nexus",day:"Sat",start:"18:20",end:"18:40"},
  {name:"Fliptrix [High Focus Records]",stage:"Nexus",day:"Sat",start:"18:40",end:"19:00"},
  {name:"Dabbla [High Focus Records]",stage:"Nexus",day:"Sat",start:"19:00",end:"19:20"},
  {name:"High Focus Records Showcase",stage:"Nexus",day:"Sat",start:"19:20",end:"19:40"},
  {name:"LYNKS",stage:"Nexus",day:"Sat",start:"20:00",end:"21:00"},
  {name:"HENGE",stage:"Nexus",day:"Sat",start:"23:00",end:"00:00"},
  {name:"Beardyman",stage:"Nexus",day:"Sat",start:"00:30",end:"01:30"},
  {name:"Daft Funk - Live",stage:"Nexus",day:"Sat",start:"02:00",end:"03:00"},
  // --- Sat: Observatory ---
  {name:"The Taste Test: Exploring Food Preferences",stage:"Observatory",day:"Sat",start:"10:00",end:"11:00"},
  {name:"The Taste Test: Exploring Food Preferences",stage:"Observatory",day:"Sat",start:"11:30",end:"12:30"},
  {name:"Conspiracy Kitchen: Come Cook With Us",stage:"Observatory",day:"Sat",start:"13:00",end:"14:00"},
  {name:"Music Is Medicine",stage:"Observatory",day:"Sat",start:"14:30",end:"15:30"},
  {name:"Move Together, Decide Together: Dancing Towards A New Democracy",stage:"Observatory",day:"Sat",start:"16:00",end:"17:00"},
  {name:"Celebratory Reset Ritual",stage:"Observatory",day:"Sat",start:"17:30",end:"18:30"},
  // --- Sat: Permaculture ---
  {name:"Flags for the feral: Wild plant printing on recycled cloth",stage:"Permaculture",day:"Sat",start:"10:00",end:"11:00"},
  {name:"Lift eachother up: Acroyoga for connection and play",stage:"Permaculture",day:"Sat",start:"11:30",end:"12:30"},
  {name:"Scrap cult: A lunchtime community art jam for tired weirdos",stage:"Permaculture",day:"Sat",start:"13:00",end:"14:00"},
  {name:"Hack the hardware: DIY electronics for land, plants and low cost automation",stage:"Permaculture",day:"Sat",start:"14:30",end:"15:30"},
  {name:"Tiny spoons for uncertain times: A miniature woodcarving workshop",stage:"Permaculture",day:"Sat",start:"15:30",end:"16:30"},
  {name:"Wild adornment: Willow crowns and headpieces by hand",stage:"Permaculture",day:"Sat",start:"17:00",end:"18:00"},
  // --- Sat: PFP Robot ---
  {name:"THE BLISTER PACK",stage:"PFP Robot",day:"Sat",start:"15:00",end:"16:00"},
  {name:"JAZ IMSKY B2B COCO DUBZ",stage:"PFP Robot",day:"Sat",start:"16:00",end:"17:00"},
  {name:"ELOQUIN B2B PJ BRIDGER",stage:"PFP Robot",day:"Sat",start:"17:00",end:"18:00"},
  // --- Sat: Rebel Girls Club ---
  {name:"Morning Yoga with Sofia (Find Your Flow)",stage:"Rebel Girls Club",day:"Sat",start:"10:00",end:"11:00"},
  {name:"“The Art of Refusing Neutrality: Why Creatives Must Take Sides.” with the Sumud Collective.",stage:"Rebel Girls Club",day:"Sat",start:"11:00",end:"12:15"},
  {name:"THE DIVINE FEMININE Paint Your Power - Take Up Space with CreatedbyBillie",stage:"Rebel Girls Club",day:"Sat",start:"13:00",end:"14:00"},
  {name:"Reclaim Your Voice with Amelie",stage:"Rebel Girls Club",day:"Sat",start:"14:30",end:"15:30"},
  {name:"Daily Sound Bath with Find Your Flow",stage:"Rebel Girls Club",day:"Sat",start:"16:00",end:"16:40"},
  {name:"Vulva Painting with Phoebe Grace",stage:"Rebel Girls Club",day:"Sat",start:"17:00",end:"18:00"},
  {name:"Sensual Embodiment led by Scarlett",stage:"Rebel Girls Club",day:"Sat",start:"18:30",end:"19:30"},
  // --- Sat: Reel News ---
  {name:"The Art of Protest",stage:"Reel News",day:"Sat",start:"10:30",end:"11:30"},
  {name:"Past struggles for land, hidden geographies and imagining a different future",stage:"Reel News",day:"Sat",start:"11:30",end:"12:15"},
  {name:"Speakeasy & Open Mic with Beadyman",stage:"Reel News",day:"Sat",start:"12:15",end:"13:15"},
  {name:"\"Fire Walk With Me\" Red Flag workers' theatre",stage:"Reel News",day:"Sat",start:"13:15",end:"13:45"},
  {name:"Banner Theatre LIVE: \"A Just Transition - Jobs, People, Planet\" Part 1",stage:"Reel News",day:"Sat",start:"13:45",end:"14:45"},
  {name:"Banner Theatre LIVE: \"A Just Transition - Jobs, People, Planet\" Part 2",stage:"Reel News",day:"Sat",start:"14:45",end:"15:45"},
  {name:"Birmingham Bin workers strike",stage:"Reel News",day:"Sat",start:"15:45",end:"16:45"},
  {name:"UNITE Hospitality Glasgow - better pay, enjoyment & working conditions",stage:"Reel News",day:"Sat",start:"16:45",end:"17:30"},
  {name:"Saturama: Tales of an Albion Rainforest",stage:"Reel News",day:"Sat",start:"17:30",end:"18:30"},
  // --- Sat: Reparium ---
  {name:"Repairium",stage:"Reparium",day:"Sat",start:"10:00",end:"18:00"},
  {name:"Repairium",stage:"Reparium",day:"Sat",start:"10:00",end:"18:00"},
  // --- Sat: Rose and Clown ---
  {name:"Reggaeoke",stage:"Rose and Clown",day:"Sat",start:"13:00",end:"14:00"},
  {name:"Boomtown's Got Talent",stage:"Rose and Clown",day:"Sat",start:"14:00",end:"15:00"},
  {name:"The Showhawk Duo",stage:"Rose and Clown",day:"Sat",start:"15:00",end:"16:00"},
  {name:"No Blacks No Irish (DJ Set)",stage:"Rose and Clown",day:"Sat",start:"16:00",end:"17:30"},
  {name:"Shabba Banks",stage:"Rose and Clown",day:"Sat",start:"17:30",end:"18:30"},
  {name:"Numa Crew",stage:"Rose and Clown",day:"Sat",start:"18:30",end:"19:30"},
  {name:"Flash Bang Brass",stage:"Rose and Clown",day:"Sat",start:"19:45",end:"20:45"},
  {name:"Amengyaldem",stage:"Rose and Clown",day:"Sat",start:"20:45",end:"21:45"},
  {name:"JAMU",stage:"Rose and Clown",day:"Sat",start:"22:00",end:"23:00"},
  {name:"Singularity Takeover: Silva Snipa B2B The Bass Injector",stage:"Rose and Clown",day:"Sat",start:"23:00",end:"00:00"},
  {name:"Cheetah B2B Jenny Sparks",stage:"Rose and Clown",day:"Sat",start:"00:00",end:"01:00"},
  {name:"Anaïs B2B Anton B2B Latte (140 Set) [Bish's House Party]",stage:"Rose and Clown",day:"Sat",start:"01:00",end:"02:00"},
  {name:"Bish [Bish's House Party]",stage:"Rose and Clown",day:"Sat",start:"02:00",end:"03:00"},
  {name:"Diagnostix (140 & UKG Set) [Bish's House Party]",stage:"Rose and Clown",day:"Sat",start:"03:00",end:"03:30"},
  {name:"Gray's Free Party Karaoke [Bish's House Party]",stage:"Rose and Clown",day:"Sat",start:"03:30",end:"04:00"},
  // --- Sat: Sharing Circles ---
  {name:"Sharing Circles - Workshop",stage:"Sharing Circles",day:"Sat",start:"11:00",end:"19:00"},
  // --- Sat: Sibín Beag ---
  {name:"Autonemy",stage:"Sibín Beag",day:"Sat",start:"14:00",end:"14:45"},
  {name:"The Deltones",stage:"Sibín Beag",day:"Sat",start:"15:15",end:"16:00"},
  {name:"The Deadshots",stage:"Sibín Beag",day:"Sat",start:"16:30",end:"17:15"},
  {name:"Tootinska Moon",stage:"Sibín Beag",day:"Sat",start:"17:45",end:"18:30"},
  {name:"Ria Rua",stage:"Sibín Beag",day:"Sat",start:"19:00",end:"19:45"},
  {name:"Fancy Dan",stage:"Sibín Beag",day:"Sat",start:"20:15",end:"21:00"},
  {name:"Trad Folkin' Rocks House Band",stage:"Sibín Beag",day:"Sat",start:"21:30",end:"23:30"},
  {name:"Trad Folkin' Rave (Annie Craic & Dalba)",stage:"Sibín Beag",day:"Sat",start:"00:00",end:"02:00"},
  // --- Sat: Soapranos Laundrette ---
  {name:"Selextorhood",stage:"Soapranos Laundrette",day:"Sat",start:"13:00",end:"14:00"},
  {name:"Rose Holland",stage:"Soapranos Laundrette",day:"Sat",start:"14:00",end:"15:00"},
  {name:"Laundry Night Live with Soapranos & SNTV",stage:"Soapranos Laundrette",day:"Sat",start:"15:00",end:"16:00"},
  {name:"Kundarini",stage:"Soapranos Laundrette",day:"Sat",start:"16:00",end:"17:00"},
  {name:"Aura",stage:"Soapranos Laundrette",day:"Sat",start:"17:00",end:"18:00"},
  {name:"ESC",stage:"Soapranos Laundrette",day:"Sat",start:"18:00",end:"19:00"},
  {name:"Alina",stage:"Soapranos Laundrette",day:"Sat",start:"19:00",end:"20:00"},
  {name:"SIMMS",stage:"Soapranos Laundrette",day:"Sat",start:"20:00",end:"21:00"},
  {name:"DOMINATOR PRESENTS: Caliban",stage:"Soapranos Laundrette",day:"Sat",start:"21:00",end:"22:00"},
  {name:"Dominator Presents: Special Guest",stage:"Soapranos Laundrette",day:"Sat",start:"22:00",end:"23:00"},
  {name:"DOMINATOR PRESENTS: Meduse Noir",stage:"Soapranos Laundrette",day:"Sat",start:"23:00",end:"00:00"},
  // --- Sat: Spectrum 360 ---
  {name:"Draggernauts",stage:"Spectrum 360",day:"Sat",start:"16:00",end:"18:00"},
  {name:"Hang The DJs",stage:"Spectrum 360",day:"Sat",start:"18:00",end:"19:00"},
  {name:"Koarse",stage:"Spectrum 360",day:"Sat",start:"19:00",end:"20:00"},
  {name:"DJ Sarah Bonito",stage:"Spectrum 360",day:"Sat",start:"20:00",end:"21:00"},
  {name:"DJ G2G",stage:"Spectrum 360",day:"Sat",start:"21:00",end:"22:00"},
  {name:"Panteros666",stage:"Spectrum 360",day:"Sat",start:"22:00",end:"23:00"},
  {name:"Trampsta",stage:"Spectrum 360",day:"Sat",start:"23:00",end:"00:00"},
  {name:"Gonzi",stage:"Spectrum 360",day:"Sat",start:"00:00",end:"01:00"},
  {name:"Meg McHugh",stage:"Spectrum 360",day:"Sat",start:"01:00",end:"02:00"},
  {name:"Sterling Moss",stage:"Spectrum 360",day:"Sat",start:"02:00",end:"03:00"},
  {name:"Fish56Octagon",stage:"Spectrum 360",day:"Sat",start:"03:00",end:"04:00"},
  // --- Sat: Spinney Hollow ---
  {name:"Spinney Hollow - Banquet of Art table",stage:"Spinney Hollow",day:"Sat",start:"10:00",end:"18:00"},
  {name:"Spinney Hollow - Traditional Green Wood Work Workshop",stage:"Spinney Hollow",day:"Sat",start:"10:00",end:"18:00"},
  // --- Sat: Sub Lab ---
  {name:"Anything But Becky",stage:"Sub Lab",day:"Sat",start:"18:00",end:"19:00"},
  {name:"Bubski",stage:"Sub Lab",day:"Sat",start:"19:00",end:"20:00"},
  {name:"AAEE",stage:"Sub Lab",day:"Sat",start:"20:00",end:"21:00"},
  {name:"Samba",stage:"Sub Lab",day:"Sat",start:"21:00",end:"22:00"},
  {name:"Ruggz b2b Sonia Sol",stage:"Sub Lab",day:"Sat",start:"22:00",end:"23:30"},
  {name:"Sis:Dem",stage:"Sub Lab",day:"Sat",start:"23:30",end:"01:00"},
  {name:"Mystic State",stage:"Sub Lab",day:"Sat",start:"01:00",end:"02:00"},
  {name:"Numa Crew",stage:"Sub Lab",day:"Sat",start:"02:00",end:"03:00"},
  {name:"Rotate",stage:"Sub Lab",day:"Sat",start:"03:00",end:"03:59"},
  // --- Sat: Tangled Roots ---
  {name:"Channel One Sound System",stage:"Tangled Roots",day:"Sat",start:"12:00",end:"14:00"},
  {name:"Aba Shanti-I",stage:"Tangled Roots",day:"Sat",start:"14:00",end:"16:00"},
  {name:"10000 Lions",stage:"Tangled Roots",day:"Sat",start:"16:00",end:"18:00"},
  {name:"Firmly Rooted x Lionpulse x Sinai",stage:"Tangled Roots",day:"Sat",start:"18:00",end:"19:00"},
  {name:"Sasha Steppa",stage:"Tangled Roots",day:"Sat",start:"19:00",end:"20:00"},
  {name:"Omega Nebula",stage:"Tangled Roots",day:"Sat",start:"20:00",end:"21:00"},
  // --- Sat: The Boomtown Bobbies ---
  {name:"Kick Bandit",stage:"The Boomtown Bobbies",day:"Sat",start:"15:00",end:"16:00"},
  {name:"Maddx",stage:"The Boomtown Bobbies",day:"Sat",start:"16:00",end:"17:00"},
  {name:"Millz b2b Kleu b2b Kivi",stage:"The Boomtown Bobbies",day:"Sat",start:"17:00",end:"18:00"},
  {name:"DJ Hybrid b2b Origin8a & Propa",stage:"The Boomtown Bobbies",day:"Sat",start:"18:00",end:"18:50"},
  {name:"Ed Solo",stage:"The Boomtown Bobbies",day:"Sat",start:"18:50",end:"19:30"},
  {name:"Benny Page",stage:"The Boomtown Bobbies",day:"Sat",start:"19:30",end:"20:15"},
  {name:"Deekline",stage:"The Boomtown Bobbies",day:"Sat",start:"20:15",end:"21:00"},
  {name:"Buntai",stage:"The Boomtown Bobbies",day:"Sat",start:"21:00",end:"22:20"},
  {name:"Sterling Moss",stage:"The Boomtown Bobbies",day:"Sat",start:"22:20",end:"23:20"},
  {name:"My-R",stage:"The Boomtown Bobbies",day:"Sat",start:"23:20",end:"00:10"},
  {name:"Fizzy Gillespie",stage:"The Boomtown Bobbies",day:"Sat",start:"00:10",end:"01:00"},
  {name:"Zone 1",stage:"The Boomtown Bobbies",day:"Sat",start:"01:00",end:"02:00"},
  {name:"Betsy Mae",stage:"The Boomtown Bobbies",day:"Sat",start:"02:00",end:"03:00"},
  {name:"Checkmate",stage:"The Boomtown Bobbies",day:"Sat",start:"03:00",end:"04:00"},
  // --- Sat: The Fools Leap ---
  {name:"FFTP",stage:"The Fools Leap",day:"Sat",start:"12:00",end:"13:00"},
  {name:"Tropanka",stage:"The Fools Leap",day:"Sat",start:"13:30",end:"14:30"},
  {name:"Fidget & The Twitchers",stage:"The Fools Leap",day:"Sat",start:"15:00",end:"16:00"},
  {name:"Alphalfa",stage:"The Fools Leap",day:"Sat",start:"16:30",end:"17:30"},
  {name:"45s",stage:"The Fools Leap",day:"Sat",start:"18:00",end:"19:00"},
  {name:"Cam Cole",stage:"The Fools Leap",day:"Sat",start:"19:30",end:"20:30"},
  {name:"3 Daft Monkeys",stage:"The Fools Leap",day:"Sat",start:"21:00",end:"22:00"},
  {name:"Daraa Tribes",stage:"The Fools Leap",day:"Sat",start:"22:30",end:"23:30"},
  {name:"CHEWY SHE",stage:"The Fools Leap",day:"Sat",start:"00:00",end:"01:00"},
  {name:"DOGSHOW",stage:"The Fools Leap",day:"Sat",start:"01:30",end:"02:30"},
  {name:"Fizzy Gillespie's Big Balkan Bash",stage:"The Fools Leap",day:"Sat",start:"03:00",end:"04:00"},
  // --- Sat: The Garden Centre ---
  {name:"DJ Mozzarella Stix",stage:"The Garden Centre",day:"Sat",start:"13:00",end:"14:00"},
  {name:"YellowSix",stage:"The Garden Centre",day:"Sat",start:"14:00",end:"15:00"},
  {name:"DKY",stage:"The Garden Centre",day:"Sat",start:"15:00",end:"16:00"},
  {name:"Ravermonkey",stage:"The Garden Centre",day:"Sat",start:"16:00",end:"17:30"},
  {name:"Gnome Gala Ft. Smooches",stage:"The Garden Centre",day:"Sat",start:"17:30",end:"19:00"},
  {name:"The Regional Manager's Garden Show",stage:"The Garden Centre",day:"Sat",start:"21:00",end:"22:00"},
  {name:"Strawberry Jams",stage:"The Garden Centre",day:"Sat",start:"22:00",end:"22:30"},
  {name:"Fireworks Factory",stage:"The Garden Centre",day:"Sat",start:"22:30",end:"23:30"},
  {name:"Konetix",stage:"The Garden Centre",day:"Sat",start:"23:30",end:"00:30"},
  {name:"Hide the Soul",stage:"The Garden Centre",day:"Sat",start:"00:30",end:"01:30"},
  {name:"Medusa",stage:"The Garden Centre",day:"Sat",start:"01:30",end:"02:45"},
  {name:"Cheska Onyx",stage:"The Garden Centre",day:"Sat",start:"02:45",end:"04:00"},
  // --- Sat: The Immortal Children of the Eternal Seed ---
  {name:"Kritical Mass",stage:"The Immortal Children of the Eternal Seed",day:"Sat",start:"22:00",end:"23:00"},
  {name:"Safe N Sound",stage:"The Immortal Children of the Eternal Seed",day:"Sat",start:"23:00",end:"00:00"},
  {name:"Baithead",stage:"The Immortal Children of the Eternal Seed",day:"Sat",start:"00:00",end:"01:00"},
  {name:"Glume b2b Phossa b2b Samba",stage:"The Immortal Children of the Eternal Seed",day:"Sat",start:"01:00",end:"03:00"},
  {name:"Ellament",stage:"The Immortal Children of the Eternal Seed",day:"Sat",start:"03:00",end:"04:00"},
  // --- Sat: The Lion's Den ---
  {name:"Crossy B2B Gray B2B Harriet Jaxxon Ft. Spyda [Royal Rumble]",stage:"The Lion's Den",day:"Sat",start:"13:00",end:"14:00",genre:"Drum & Bass"},
  {name:"Benny L B2B Break B2B Skeptical Ft. MC GQ & MC Det [Royal Rumble]",stage:"The Lion's Den",day:"Sat",start:"14:00",end:"15:00",genre:"Drum & Bass"},
  {name:"Kings of the Rollers Present: Royal Rumble",stage:"The Lion's Den",day:"Sat",start:"15:00",end:"16:00",genre:"Drum & Bass"},
  {name:"Brockie B2B Micky Finn B2B Ray Keith Ft. Jolie P & Shabba D [Royal Rumble]",stage:"The Lion's Den",day:"Sat",start:"16:00",end:"17:00",genre:"Drum & Bass"},
  {name:"Mungo's Hi Fi Allstars Ft. Aziza Jaye, Charlie P, Eva Lazarus, Flowdan, Gardna, Killa P, Magugu & Solo Banton",stage:"The Lion's Den",day:"Sat",start:"17:00",end:"19:00",genre:"Dub / Roots"},
  {name:"Shaggy",stage:"The Lion's Den",day:"Sat",start:"19:30",end:"20:30",genre:"Reggae"},
  {name:"Scooter",stage:"The Lion's Den",day:"Sat",start:"21:00",end:"22:10",genre:"Hardcore / Gabber"},
  {name:"Alix Perez Ft. SP:MC",stage:"The Lion's Den",day:"Sat",start:"22:30",end:"00:00",genre:"Drum & Bass"},
  {name:"Andy C Presents: Nightlife",stage:"The Lion's Den",day:"Sat",start:"00:00",end:"02:00",genre:"Drum & Bass"},
  {name:"A.M.C Ft Phantom",stage:"The Lion's Den",day:"Sat",start:"02:00",end:"03:00"},
  // --- Sat: The Magic Teapot ---
  {name:"The Magic Teapot",stage:"The Magic Teapot",day:"Sat",start:"12:00",end:"00:00"},
  // --- Sat: The Pomegranate Parlour ---
  {name:"Poppi",stage:"The Pomegranate Parlour",day:"Sat",start:"14:00",end:"15:00"},
  {name:"Fizzy Gillespie",stage:"The Pomegranate Parlour",day:"Sat",start:"15:00",end:"16:00"},
  {name:"Tanti",stage:"The Pomegranate Parlour",day:"Sat",start:"16:00",end:"17:00"},
  {name:"Estère",stage:"The Pomegranate Parlour",day:"Sat",start:"17:00",end:"18:00"},
  {name:"Ikamba",stage:"The Pomegranate Parlour",day:"Sat",start:"18:00",end:"19:00"},
  {name:"Sweet Chilli",stage:"The Pomegranate Parlour",day:"Sat",start:"19:00",end:"20:00"},
  {name:"Habibtati",stage:"The Pomegranate Parlour",day:"Sat",start:"20:00",end:"21:00"},
  {name:"Emma Ash",stage:"The Pomegranate Parlour",day:"Sat",start:"21:00",end:"22:00"},
  {name:"Me Miles & I",stage:"The Pomegranate Parlour",day:"Sat",start:"22:00",end:"23:00"},
  {name:"Scarba",stage:"The Pomegranate Parlour",day:"Sat",start:"23:00",end:"00:00"},
  {name:"Cassia",stage:"The Pomegranate Parlour",day:"Sat",start:"00:00",end:"01:00"},
  {name:"LIZAZA",stage:"The Pomegranate Parlour",day:"Sat",start:"01:00",end:"02:00"},
  {name:"Omadhaun",stage:"The Pomegranate Parlour",day:"Sat",start:"02:00",end:"03:00"},
  {name:"Nego",stage:"The Pomegranate Parlour",day:"Sat",start:"03:00",end:"03:55"},
  // --- Sat: Tinker Station ---
  {name:"Tinker Station",stage:"Tinker Station",day:"Sat",start:"10:00",end:"18:00"},
  // --- Sat: Topsy Turvy Trims ---
  {name:"Kandy D. Licious",stage:"Topsy Turvy Trims",day:"Sat",start:"13:00",end:"13:30"},
  {name:"Merchant",stage:"Topsy Turvy Trims",day:"Sat",start:"13:30",end:"15:00"},
  {name:"Frazr Musica",stage:"Topsy Turvy Trims",day:"Sat",start:"15:00",end:"16:00"},
  {name:"TBA",stage:"Topsy Turvy Trims",day:"Sat",start:"16:00",end:"17:00"},
  {name:"Hokey Cokey Cabaret",stage:"Topsy Turvy Trims",day:"Sat",start:"17:00",end:"18:00"},
  {name:"Goose",stage:"Topsy Turvy Trims",day:"Sat",start:"19:00",end:"20:00"},
  {name:"Woody Cook",stage:"Topsy Turvy Trims",day:"Sat",start:"20:00",end:"21:00"},
  {name:"DJ Borat",stage:"Topsy Turvy Trims",day:"Sat",start:"21:00",end:"22:00"},
  {name:"Tickety Boo",stage:"Topsy Turvy Trims",day:"Sat",start:"22:00",end:"00:00"},
  {name:"Black Board Soundsystem",stage:"Topsy Turvy Trims",day:"Sat",start:"00:00",end:"02:00"},
  // --- Sat: Tribe of Frog ---
  {name:"Dr.G",stage:"Tribe of Frog",day:"Sat",start:"12:00",end:"14:00"},
  {name:"Xenoben",stage:"Tribe of Frog",day:"Sat",start:"14:00",end:"15:30"},
  {name:"TypeOne",stage:"Tribe of Frog",day:"Sat",start:"15:30",end:"17:00"},
  {name:"Psibindi",stage:"Tribe of Frog",day:"Sat",start:"17:00",end:"18:00"},
  {name:"Tresh",stage:"Tribe of Frog",day:"Sat",start:"18:00",end:"19:00"},
  {name:"Atacama",stage:"Tribe of Frog",day:"Sat",start:"19:00",end:"20:00"},
  {name:"Florescence",stage:"Tribe of Frog",day:"Sat",start:"20:00",end:"21:00"},
  {name:"Pieman",stage:"Tribe of Frog",day:"Sat",start:"21:00",end:"22:00"},
  {name:"Transient Disorder",stage:"Tribe of Frog",day:"Sat",start:"22:00",end:"23:00"},
  {name:"K.I.M",stage:"Tribe of Frog",day:"Sat",start:"23:00",end:"00:00"},
  {name:"Imaginarium",stage:"Tribe of Frog",day:"Sat",start:"00:00",end:"01:00"},
  {name:"Dickster",stage:"Tribe of Frog",day:"Sat",start:"01:00",end:"02:30"},
  {name:"Avalon",stage:"Tribe of Frog",day:"Sat",start:"02:30",end:"04:00"},
  // --- Sat: Twisted Time Machine (Bad Apple Bar) ---
  {name:"AIM - COLD WATER MUSIC (Album Playback)",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sat",start:"12:00",end:"13:00"},
  {name:"OCEAN COLOUR SCENE - MOSLEY SHOALS (Album Playback)",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sat",start:"13:00",end:"14:00"},
  {name:"DAY TRIPPING : ALBUM PLAYBACKS with PAPA DISCO",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sat",start:"14:00",end:"15:00"},
  {name:"THE MUSICALS PARTY",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sat",start:"15:00",end:"16:00"},
  {name:"THE COUNCIL OF BENS",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sat",start:"16:00",end:"18:00"},
  {name:"2DJS2MANY",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sat",start:"18:00",end:"19:00"},
  {name:"DJ WORK EXPERIENCE : MY FIRST SOCA SET",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sat",start:"19:00",end:"20:00"},
  {name:"4 UR MINDz Jadey C n Friends",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sat",start:"20:00",end:"21:00"},
  {name:"DISCO EXOTIC presents: Sue from HR's Office Disco",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sat",start:"21:00",end:"23:00"},
  {name:"ONLY OASIS",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sat",start:"23:00",end:"00:00"},
  {name:"DUBTENDO presents: JUST DANCE LIVE",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sat",start:"00:00",end:"00:30"},
  {name:"Twisted Time Machine x DUBTENDO presents: RAVE & GAME",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sat",start:"00:30",end:"02:00"},
  {name:"BIG DADDY WOOF WOOF presents: THE DOG POUND PARTY",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sat",start:"02:00",end:"03:00"},
  {name:"PINK FLOYD - THE DARK SIDE OF THE MOON (Album Playback)",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sat",start:"03:00",end:"04:00"},
  // --- Sat: XR ---
  {name:"Art Blocking",stage:"XR",day:"Sat",start:"11:00",end:"18:30"},
  {name:"Last Chance Salon",stage:"XR",day:"Sat",start:"11:00",end:"19:00"},
  {name:"Cassandra the Oracle",stage:"XR",day:"Sat",start:"11:00",end:"12:00"},
  {name:"Dirty Scrubbers Meditation",stage:"XR",day:"Sat",start:"12:00",end:"13:00"},
  {name:"Drumming Workshop",stage:"XR",day:"Sat",start:"13:00",end:"14:00"},
  {name:"Costume Pimping",stage:"XR",day:"Sat",start:"14:00",end:"18:00"},
  {name:"Tea Ladies",stage:"XR",day:"Sat",start:"14:00",end:"18:00"},
  {name:"Big Oil Drumming Parade",stage:"XR",day:"Sat",start:"14:00",end:"15:30"},
  {name:"Cassandra the Oracle",stage:"XR",day:"Sat",start:"14:00",end:"16:00"},
  {name:"Strictly Burning Ballroom",stage:"XR",day:"Sat",start:"18:00",end:"18:30"},
  // ================= SUN =================
  // --- Sun: Acid Leak ---
  {name:"Deelicious",stage:"Acid Leak",day:"Sun",start:"14:00",end:"15:00"},
  {name:"Serious Soundz",stage:"Acid Leak",day:"Sun",start:"15:00",end:"16:00"},
  {name:"Colonel Winters",stage:"Acid Leak",day:"Sun",start:"16:00",end:"17:00"},
  {name:"Sarah Monument",stage:"Acid Leak",day:"Sun",start:"17:00",end:"18:00"},
  {name:"Jah Scoop",stage:"Acid Leak",day:"Sun",start:"18:00",end:"20:00"},
  {name:"Dale West",stage:"Acid Leak",day:"Sun",start:"20:00",end:"21:00"},
  {name:"Filthy Kitten B2B Karl Davies",stage:"Acid Leak",day:"Sun",start:"21:00",end:"22:00"},
  {name:"Lisa Pin-Up",stage:"Acid Leak",day:"Sun",start:"22:00",end:"23:00"},
  {name:"Craig Mac",stage:"Acid Leak",day:"Sun",start:"23:00",end:"00:00"},
  // --- Sun: Agents of Change HQ ---
  {name:"Agents of Change HQ",stage:"Agents of Change HQ",day:"Sun",start:"10:00",end:"20:00"},
  {name:"Weaving Change",stage:"Agents of Change HQ",day:"Sun",start:"10:00",end:"18:00"},
  {name:"Giant Triplets",stage:"Agents of Change HQ",day:"Sun",start:"11:00",end:"14:00"},
  {name:"Giant Triplets",stage:"Agents of Change HQ",day:"Sun",start:"16:00",end:"19:00"},
  // --- Sun: Airetiko ---
  {name:"Airetiko Giant Marionettes",stage:"Airetiko",day:"Sun",start:"11:00",end:"13:00"},
  {name:"Airetiko Trapeze",stage:"Airetiko",day:"Sun",start:"13:00",end:"15:00"},
  {name:"Airetiko Giant Marionettes",stage:"Airetiko",day:"Sun",start:"15:00",end:"17:00"},
  // --- Sun: Anara Forest ---
  {name:"Silva Snipa B2B VXRGO",stage:"Anara Forest",day:"Sun",start:"14:00",end:"15:30"},
  {name:"Sabrina Ft. Dread MC",stage:"Anara Forest",day:"Sun",start:"15:30",end:"16:30"},
  {name:"Skantia Ft. Strategy",stage:"Anara Forest",day:"Sun",start:"16:30",end:"18:00",genre:"Jungle"},
  {name:"Kyrist B2B Waeys Ft. Strategy [Overview Takeover]",stage:"Anara Forest",day:"Sun",start:"18:00",end:"19:00"},
  {name:"Molecular B2B Wingz Ft. Jakes [Overview Takeover]",stage:"Anara Forest",day:"Sun",start:"19:00",end:"20:00"},
  {name:"Visages Ft. SP:MC",stage:"Anara Forest",day:"Sun",start:"20:00",end:"21:30"},
  {name:"Mandidextrous Ft. Maddy V",stage:"Anara Forest",day:"Sun",start:"21:30",end:"23:00"},
  {name:"Simula Ft. Jakes",stage:"Anara Forest",day:"Sun",start:"23:00",end:"00:00"},
  // --- Sun: Ancient Futures ---
  {name:"Breath & Bass",stage:"Ancient Futures",day:"Sun",start:"11:30",end:"13:30"},
  {name:"Laughter Meditation",stage:"Ancient Futures",day:"Sun",start:"14:00",end:"15:00"},
  {name:"Nervous System Reset",stage:"Ancient Futures",day:"Sun",start:"15:30",end:"17:30"},
  {name:"Ancient Futures Closing Ceremony",stage:"Ancient Futures",day:"Sun",start:"18:00",end:"19:00"},
  // --- Sun: Blink Mental Health ---
  {name:"Blink Mental Health Chill-Out Space",stage:"Blink Mental Health",day:"Sun",start:"10:00",end:"19:30"},
  // --- Sun: Botanica Zoo ---
  {name:"Now That's Not What I Call Music w/ Ratbag",stage:"Botanica Zoo",day:"Sun",start:"15:00",end:"16:00"},
  {name:"Clifford Junior B2B Ironic Thug w/ Blythe",stage:"Botanica Zoo",day:"Sun",start:"16:00",end:"17:00"},
  {name:"Dizzkid",stage:"Botanica Zoo",day:"Sun",start:"17:00",end:"18:00"},
  {name:"Secret Sexy Lady takeover",stage:"Botanica Zoo",day:"Sun",start:"18:00",end:"19:00"},
  {name:"LS Dare",stage:"Botanica Zoo",day:"Sun",start:"19:00",end:"20:00"},
  {name:"insectcrusha w/ Taz-B [Motive Hunter takeover]",stage:"Botanica Zoo",day:"Sun",start:"20:00",end:"21:00"},
  {name:"OS:MAN w/ MC Steezy [Motive Hunter takeover]",stage:"Botanica Zoo",day:"Sun",start:"21:00",end:"22:00"},
  {name:"SIMMS B2B OS:MAN (first ever live B2B) [Motive Hunter takeover]",stage:"Botanica Zoo",day:"Sun",start:"22:00",end:"23:00"},
  {name:"Tashphrodisiac B2B Asset B2B Karmae T w/ MC Deadman",stage:"Botanica Zoo",day:"Sun",start:"23:00",end:"23:55"},
  // --- Sun: Busker's Wharf ---
  {name:"The Pussy Catbaret",stage:"Busker's Wharf",day:"Sun",start:"19:30",end:"21:00"},
  // --- Sun: Cas's Costumes ---
  {name:"Engineers of Desire",stage:"Cas's Costumes",day:"Sun",start:"10:00",end:"18:00"},
  // --- Sun: Circus Tent ---
  {name:"Energising Yoga",stage:"Circus Tent",day:"Sun",start:"10:00",end:"11:00"},
  {name:"Wye Circus Skills, Hoop",stage:"Circus Tent",day:"Sun",start:"11:00",end:"13:00"},
  {name:"Wye Circus Skills, Poi, Staff",stage:"Circus Tent",day:"Sun",start:"13:00",end:"15:00"},
  {name:"Wye Circus Skills, Juggling",stage:"Circus Tent",day:"Sun",start:"15:00",end:"17:00"},
  {name:"Bubblology",stage:"Circus Tent",day:"Sun",start:"17:00",end:"18:00"},
  // --- Sun: Climate Live ---
  {name:"Climate Live Opening",stage:"Climate Live",day:"Sun",start:"10:00",end:"20:00"},
  {name:"Radical Rosettes",stage:"Climate Live",day:"Sun",start:"10:30",end:"11:30"},
  {name:"Music X Climate Zine-Making",stage:"Climate Live",day:"Sun",start:"11:45",end:"12:45"},
  {name:"Bag Charm Making - Weaving Change",stage:"Climate Live",day:"Sun",start:"13:00",end:"14:00"},
  {name:"Patch It For The Planet: Upcycled Patch Making - The Mend",stage:"Climate Live",day:"Sun",start:"14:15",end:"15:15"},
  {name:"Mediterranean Herb Repotting - Grounds for Growth",stage:"Climate Live",day:"Sun",start:"15:30",end:"16:30"},
  {name:"Kemastry: Caged & Free, Creative Writing",stage:"Climate Live",day:"Sun",start:"16:45",end:"17:45"},
  // --- Sun: Cocaine Anonymous ---
  {name:"Cocaine Anonymous Meeting",stage:"Cocaine Anonymous",day:"Sun",start:"11:00",end:"12:00"},
  {name:"Cocaine Anonymous Meeting",stage:"Cocaine Anonymous",day:"Sun",start:"18:00",end:"19:00"},
  // --- Sun: Community Fire ---
  {name:"Community Fire (Running 24hrs)",stage:"Community Fire",day:"Sun",start:"12:00",end:"00:00"},
  // --- Sun: Craft Tent ---
  {name:"Botanical Fascinators",stage:"Craft Tent",day:"Sun",start:"10:00",end:"18:00"},
  {name:"Hitty Hitty Bang Bang",stage:"Craft Tent",day:"Sun",start:"10:00",end:"18:00"},
  {name:"Junk Jewelery",stage:"Craft Tent",day:"Sun",start:"10:00",end:"18:00"},
  // --- Sun: Crafty Rascals ---
  {name:"Crafty Rascals",stage:"Crafty Rascals",day:"Sun",start:"10:00",end:"18:00"},
  // --- Sun: Deviant Lounge ---
  {name:"Half Broken Kru",stage:"Deviant Lounge",day:"Sun",start:"20:00",end:"21:00"},
  {name:"Juicy Goose b2b Froggy",stage:"Deviant Lounge",day:"Sun",start:"21:00",end:"22:00"},
  {name:"Captain Chaos b2b Queerdo",stage:"Deviant Lounge",day:"Sun",start:"22:00",end:"23:00"},
  {name:"DJ Bax",stage:"Deviant Lounge",day:"Sun",start:"23:00",end:"00:00"},
  // --- Sun: E Numbers ---
  {name:"Xmas Party & Charles The Princess' Sweet 16",stage:"E Numbers",day:"Sun",start:"14:00",end:"18:00"},
  {name:"Bungzo",stage:"E Numbers",day:"Sun",start:"18:00",end:"18:45"},
  {name:"Hannza",stage:"E Numbers",day:"Sun",start:"18:45",end:"19:30"},
  {name:"Climaxxx: gwlucas",stage:"E Numbers",day:"Sun",start:"19:30",end:"20:15"},
  {name:"Climaxxx: BMOL",stage:"E Numbers",day:"Sun",start:"20:15",end:"21:00"},
  {name:"Climaxxx: Princess Elf Bar",stage:"E Numbers",day:"Sun",start:"21:00",end:"21:45"},
  // --- Sun: End of the Line ---
  {name:"SUFI",stage:"End of the Line",day:"Sun",start:"20:00",end:"21:00"},
  {name:"LOOPY",stage:"End of the Line",day:"Sun",start:"21:00",end:"22:00"},
  {name:"Omadhaun",stage:"End of the Line",day:"Sun",start:"22:00",end:"23:00"},
  {name:"Jenny Sparks",stage:"End of the Line",day:"Sun",start:"23:00",end:"00:00"},
  // --- Sun: Energy Garden ---
  {name:"Energy Garden Opening",stage:"Energy Garden",day:"Sun",start:"12:00",end:"20:00"},
  {name:"Solar Panel Building Workshop",stage:"Energy Garden",day:"Sun",start:"13:00",end:"15:00"},
  // --- Sun: Foggers Mill ---
  {name:"Easydread",stage:"Foggers Mill",day:"Sun",start:"13:00",end:"14:00"},
  {name:"Vegetable Collective",stage:"Foggers Mill",day:"Sun",start:"14:30",end:"15:30"},
  {name:"Year of The Dog",stage:"Foggers Mill",day:"Sun",start:"16:00",end:"17:00"},
  {name:"Hot Squash",stage:"Foggers Mill",day:"Sun",start:"17:30",end:"18:30"},
  {name:"Tree House Fire",stage:"Foggers Mill",day:"Sun",start:"19:00",end:"20:00"},
  {name:"The Guns of Navarone",stage:"Foggers Mill",day:"Sun",start:"20:30",end:"21:30"},
  // --- Sun: Full Moon Ballroom ---
  {name:"Tripl3 B & The Troubl3 Makers",stage:"Full Moon Ballroom",day:"Sun",start:"13:30",end:"14:30"},
  {name:"LFay",stage:"Full Moon Ballroom",day:"Sun",start:"15:00",end:"16:00"},
  {name:"House of Pantha",stage:"Full Moon Ballroom",day:"Sun",start:"16:30",end:"17:15"},
  {name:"Cable Street Collective",stage:"Full Moon Ballroom",day:"Sun",start:"18:00",end:"19:00"},
  {name:"The Gulls",stage:"Full Moon Ballroom",day:"Sun",start:"19:30",end:"20:30"},
  {name:"Wanton String Band",stage:"Full Moon Ballroom",day:"Sun",start:"21:00",end:"22:00"},
  // --- Sun: Gabber Kebabber ---
  {name:"Rhi Mysterio",stage:"Gabber Kebabber",day:"Sun",start:"14:00",end:"14:45"},
  {name:"Super Han",stage:"Gabber Kebabber",day:"Sun",start:"14:45",end:"15:30"},
  {name:"Adi",stage:"Gabber Kebabber",day:"Sun",start:"15:30",end:"16:30"},
  {name:"Riguana",stage:"Gabber Kebabber",day:"Sun",start:"16:30",end:"17:15"},
  {name:"ZEN",stage:"Gabber Kebabber",day:"Sun",start:"17:15",end:"18:00"},
  {name:"Boltcropper Takeover",stage:"Gabber Kebabber",day:"Sun",start:"18:00",end:"22:00"},
  // --- Sun: Games Lounge ---
  {name:"Games Lounge (Running 24hrs)",stage:"Games Lounge",day:"Sun",start:"12:00",end:"00:00"},
  // --- Sun: Garden ---
  {name:"Wildflower Fortunes",stage:"Garden",day:"Sun",start:"10:00",end:"18:00"},
  // --- Sun: Grand Central ---
  {name:"Dub Pistols",stage:"Grand Central",day:"Sun",start:"14:00",end:"15:00"},
  {name:"Beans on Toast",stage:"Grand Central",day:"Sun",start:"15:30",end:"16:30"},
  {name:"Elvana",stage:"Grand Central",day:"Sun",start:"17:00",end:"18:00"},
  {name:"Dr Meaker - Live",stage:"Grand Central",day:"Sun",start:"18:30",end:"19:30"},
  {name:"Less Than Jake",stage:"Grand Central",day:"Sun",start:"20:00",end:"21:00"},
  {name:"Skindred",stage:"Grand Central",day:"Sun",start:"21:30",end:"22:30"},
  // --- Sun: Hangar 161 ---
  {name:"Soundsystem 79",stage:"Hangar 161",day:"Sun",start:"13:00",end:"13:40"},
  {name:"Xray Vez",stage:"Hangar 161",day:"Sun",start:"14:00",end:"14:40"},
  {name:"Ria Rua",stage:"Hangar 161",day:"Sun",start:"15:00",end:"15:40"},
  {name:"Knives",stage:"Hangar 161",day:"Sun",start:"16:00",end:"16:40"},
  {name:"The Dirt",stage:"Hangar 161",day:"Sun",start:"17:00",end:"17:40"},
  {name:"Grail Guard",stage:"Hangar 161",day:"Sun",start:"18:00",end:"18:40"},
  {name:"Last Tree Squad",stage:"Hangar 161",day:"Sun",start:"19:00",end:"19:40"},
  {name:"Wonk Unit",stage:"Hangar 161",day:"Sun",start:"20:00",end:"21:00"},
  {name:"Split Dogs",stage:"Hangar 161",day:"Sun",start:"21:30",end:"22:30"},
  {name:"Panic Shack",stage:"Hangar 161",day:"Sun",start:"23:00",end:"00:00"},
  // --- Sun: Hapitat ---
  {name:"Hapitat",stage:"Hapitat",day:"Sun",start:"10:00",end:"18:00"},
  // --- Sun: Helix ---
  {name:"Full Fat Records",stage:"Helix",day:"Sun",start:"15:00",end:"16:00"},
  {name:"Submatic",stage:"Helix",day:"Sun",start:"16:00",end:"17:00"},
  {name:"Sin & Brook - Does It Double",stage:"Helix",day:"Sun",start:"17:00",end:"18:00"},
  {name:"This is Inja",stage:"Helix",day:"Sun",start:"18:00",end:"19:00"},
  {name:"K-65 (90's D&B Set)",stage:"Helix",day:"Sun",start:"19:00",end:"20:30"},
  {name:"Selecta J-Man",stage:"Helix",day:"Sun",start:"20:30",end:"22:00"},
  {name:"Strategy - DJ Set",stage:"Helix",day:"Sun",start:"22:00",end:"23:00"},
  // --- Sun: Hidden Woods ---
  {name:"Grooverider [Fantazia Takeover]",stage:"Hidden Woods",day:"Sun",start:"13:00",end:"14:00",genre:"Jungle"},
  {name:"Shades Of Rhythm [Fantazia Takeover]",stage:"Hidden Woods",day:"Sun",start:"14:00",end:"15:00",genre:"Jungle"},
  {name:"K-Klass B2B Morgan Seatree [Fantazia Takeover]",stage:"Hidden Woods",day:"Sun",start:"15:00",end:"16:00",genre:"Jungle"},
  {name:"Sonique [Fantazia Takeover]",stage:"Hidden Woods",day:"Sun",start:"16:00",end:"17:00",genre:"Jungle"},
  {name:"Kings of the Rave: 2 Bad Mice B2B Ellis Dee B2B Mark XTC Ft. MC GQ [Fantazia Takeover]",stage:"Hidden Woods",day:"Sun",start:"17:00",end:"18:00",genre:"Jungle"},
  {name:"Pete Cannon B2B Time To Rush [Fantazia Takeover]",stage:"Hidden Woods",day:"Sun",start:"18:00",end:"19:00",genre:"Jungle"},
  {name:"Ratty & Serum Ft. Mad P [Fantazia Takeover]",stage:"Hidden Woods",day:"Sun",start:"19:00",end:"20:00",genre:"Jungle"},
  {name:"Cheff The Boy B2B Hypershé B2B Origin8a & Propa [Fantazia Takeover]",stage:"Hidden Woods",day:"Sun",start:"20:00",end:"21:00",genre:"Jungle"},
  {name:"Altern 8 B2B Slipmatt Ft. Dread MC [Fantazia Takeover]",stage:"Hidden Woods",day:"Sun",start:"21:00",end:"22:00",genre:"Jungle"},
  {name:"Anz B2B Special Request [Fantazia Takeover]",stage:"Hidden Woods",day:"Sun",start:"22:00",end:"23:00",genre:"Jungle"},
  {name:"Ratpack [Fantazia Takeover]",stage:"Hidden Woods",day:"Sun",start:"23:00",end:"00:00",genre:"Jungle"},
  // --- Sun: Hydro XL ---
  {name:"nimino - Live",stage:"Hydro XL",day:"Sun",start:"15:00",end:"16:20"},
  {name:"KILIMANJARO B2B Oppidan",stage:"Hydro XL",day:"Sun",start:"16:30",end:"18:00"},
  {name:"VTSS",stage:"Hydro XL",day:"Sun",start:"18:00",end:"19:30"},
  {name:"Marlon Hoffstadt",stage:"Hydro XL",day:"Sun",start:"19:30",end:"21:00"},
  {name:"SHERELLE - AV Show",stage:"Hydro XL",day:"Sun",start:"21:00",end:"22:30"},
  {name:"Skrillex",stage:"Hydro XL",day:"Sun",start:"22:30",end:"23:50"},
  {name:"Boomtown Closing Ceremony",stage:"Hydro XL",day:"Sun",start:"23:50",end:"00:00"},
  // --- Sun: Infinity ---
  {name:"Olive F",stage:"Infinity",day:"Sun",start:"17:00",end:"18:30"},
  {name:"Storm Mollison",stage:"Infinity",day:"Sun",start:"18:30",end:"20:00"},
  {name:"PBR Streetgang",stage:"Infinity",day:"Sun",start:"20:00",end:"21:30"},
  {name:"Gina Breeze",stage:"Infinity",day:"Sun",start:"21:30",end:"23:00"},
  // --- Sun: Mining for (g)Old Town ---
  {name:"DJ Sarah Tonin",stage:"Mining for (g)Old Town",day:"Sun",start:"13:30",end:"15:00"},
  {name:"DJ Shoulda Learnt The Clarinet",stage:"Mining for (g)Old Town",day:"Sun",start:"15:00",end:"16:00"},
  {name:"light gal",stage:"Mining for (g)Old Town",day:"Sun",start:"16:00",end:"17:30"},
  {name:"Flails",stage:"Mining for (g)Old Town",day:"Sun",start:"17:30",end:"19:00"},
  // --- Sun: Nachtlicker ---
  {name:"ALLEN TG",stage:"Nachtlicker",day:"Sun",start:"17:00",end:"18:15"},
  {name:"CULTUR/RIOT feat CIARA MAY",stage:"Nachtlicker",day:"Sun",start:"18:15",end:"19:15"},
  {name:"MAX OG",stage:"Nachtlicker",day:"Sun",start:"19:15",end:"20:15"},
  {name:"EIGHT SPRING ROLLS",stage:"Nachtlicker",day:"Sun",start:"20:15",end:"21:15"},
  {name:"LAKEY",stage:"Nachtlicker",day:"Sun",start:"21:15",end:"22:30"},
  {name:"SLOPPY SPICE",stage:"Nachtlicker",day:"Sun",start:"22:30",end:"23:30"},
  // --- Sun: Narcotics Anonymous ---
  {name:"Narcotic Anonymous Meeting",stage:"Narcotics Anonymous",day:"Sun",start:"13:00",end:"14:00"},
  // --- Sun: Nexus ---
  {name:"Bongo's Bingo",stage:"Nexus",day:"Sun",start:"14:30",end:"15:30"},
  {name:"The League of Rebelz",stage:"Nexus",day:"Sun",start:"16:00",end:"17:00"},
  {name:"Hollie Cook",stage:"Nexus",day:"Sun",start:"17:30",end:"18:30"},
  {name:"Talib Kweli",stage:"Nexus",day:"Sun",start:"19:15",end:"20:15"},
  {name:"Kibo",stage:"Nexus",day:"Sun",start:"20:40",end:"21:40"},
  {name:"KiLLOWEN",stage:"Nexus",day:"Sun",start:"22:00",end:"23:00"},
  // --- Sun: Observatory ---
  {name:"Professor Dinger's Miracle Hangover Cure Experiment",stage:"Observatory",day:"Sun",start:"10:00",end:"11:00"},
  {name:"Your Brain On Yoga",stage:"Observatory",day:"Sun",start:"11:30",end:"12:30"},
  {name:"Music Is Medicine",stage:"Observatory",day:"Sun",start:"13:00",end:"14:00"},
  {name:"Exploring The Neurodivergent Festival Goer Experience",stage:"Observatory",day:"Sun",start:"14:30",end:"15:30"},
  {name:"Fear & Loathing In Boomtown… A Study Of Attitudes & Experiences",stage:"Observatory",day:"Sun",start:"16:00",end:"17:00"},
  {name:"The Observatory Closing",stage:"Observatory",day:"Sun",start:"17:30",end:"18:30"},
  // --- Sun: Permaculture ---
  {name:"Drawn in: Zentangle, slow lines and shared attention",stage:"Permaculture",day:"Sun",start:"10:00",end:"11:00"},
  {name:"Drawn from the ground: Natural inks, charcoal and figure drawing",stage:"Permaculture",day:"Sun",start:"11:30",end:"12:30"},
  {name:"Scrap cult: A lunchtime community art jam for tired weirdos",stage:"Permaculture",day:"Sun",start:"13:00",end:"14:00"},
  {name:"Soft rebellion: Seed balls for pollinators and wild edges",stage:"Permaculture",day:"Sun",start:"14:30",end:"15:30"},
  {name:"Tiny spoons for uncertain times: A miniature woodcarving workshop",stage:"Permaculture",day:"Sun",start:"15:30",end:"16:30"},
  {name:"Flags for the feral: Wild plant printing on recycled cloth",stage:"Permaculture",day:"Sun",start:"17:00",end:"18:00"},
  // --- Sun: Rebel Girls Club ---
  {name:"Morning Yoga with Emma",stage:"Rebel Girls Club",day:"Sun",start:"10:00",end:"11:00"},
  {name:"Self-love Sensuality with Beth (Find Your Flow)",stage:"Rebel Girls Club",day:"Sun",start:"11:00",end:"12:15"},
  {name:"Body painting with Ivy",stage:"Rebel Girls Club",day:"Sun",start:"13:00",end:"14:00"},
  {name:"Rebel Girls Rehab",stage:"Rebel Girls Club",day:"Sun",start:"14:30",end:"16:00"},
  {name:"Closing Ceremony with Everglowing & Find Your Flow",stage:"Rebel Girls Club",day:"Sun",start:"16:00",end:"17:00"},
  // --- Sun: Reel News ---
  {name:"Film: The people's revolution in Myanmar",stage:"Reel News",day:"Sun",start:"10:30",end:"11:30"},
  {name:"The Myth of Migration",stage:"Reel News",day:"Sun",start:"11:30",end:"12:15"},
  {name:"Palantir and the fight against military tech in the NHS",stage:"Reel News",day:"Sun",start:"12:15",end:"13:00"},
  {name:"Reports from the Assata Shakur Brigade: Solidarity With Cuba",stage:"Reel News",day:"Sun",start:"13:00",end:"13:45"},
  {name:"Film: Grenada Revolution",stage:"Reel News",day:"Sun",start:"13:45",end:"14:30"},
  {name:"Repoliticising DIY Culture - book launch",stage:"Reel News",day:"Sun",start:"14:30",end:"15:15"},
  {name:"Jack Block",stage:"Reel News",day:"Sun",start:"15:15",end:"15:45"},
  {name:"Doctur Normul",stage:"Reel News",day:"Sun",start:"15:45",end:"16:15"},
  {name:"Nathan Tuft: working with youth",stage:"Reel News",day:"Sun",start:"16:15",end:"17:15"},
  {name:"Liv Wynter",stage:"Reel News",day:"Sun",start:"17:15",end:"18:15"},
  // --- Sun: Reparium ---
  {name:"Repairium",stage:"Reparium",day:"Sun",start:"10:00",end:"18:00"},
  // --- Sun: Rose and Clown ---
  {name:"Boomtown's Got Talent",stage:"Rose and Clown",day:"Sun",start:"13:00",end:"15:00"},
  {name:"Sonia Sol",stage:"Rose and Clown",day:"Sun",start:"15:00",end:"16:00"},
  {name:"Nigel Garage",stage:"Rose and Clown",day:"Sun",start:"16:00",end:"17:00"},
  {name:"Robbieoke Williams",stage:"Rose and Clown",day:"Sun",start:"17:00",end:"18:00"},
  {name:"The 900 (Tony Hawk Tribute)",stage:"Rose and Clown",day:"Sun",start:"18:00",end:"19:00"},
  {name:"Annie Craic",stage:"Rose and Clown",day:"Sun",start:"19:00",end:"20:00"},
  {name:"Phatworld (Off Me Nut)",stage:"Rose and Clown",day:"Sun",start:"20:00",end:"21:00"},
  {name:"DJ Lord of The Rings",stage:"Rose and Clown",day:"Sun",start:"21:00",end:"22:00"},
  {name:"Haych & Movin Whata’s: Linedance Experience",stage:"Rose and Clown",day:"Sun",start:"22:00",end:"23:00"},
  {name:"Crack Street Boys",stage:"Rose and Clown",day:"Sun",start:"23:00",end:"00:00"},
  // --- Sun: Sharing Circles ---
  {name:"Sharing Circles - Workshop",stage:"Sharing Circles",day:"Sun",start:"11:00",end:"19:00"},
  // --- Sun: Sibín Beag ---
  {name:"Didn't Make Mass (The Irish Pub Quiz)",stage:"Sibín Beag",day:"Sun",start:"14:00",end:"16:00"},
  {name:"Painted Sails [The Railway Inn Takeover]",stage:"Sibín Beag",day:"Sun",start:"16:00",end:"16:45"},
  {name:"Polly Gone Wrong [The Railway Inn Takeover]",stage:"Sibín Beag",day:"Sun",start:"17:15",end:"18:00"},
  {name:"Ruth Theodore [The Railway Inn Takeover]",stage:"Sibín Beag",day:"Sun",start:"18:30",end:"19:15"},
  {name:"Graham Sweeney",stage:"Sibín Beag",day:"Sun",start:"19:45",end:"20:30"},
  {name:"Last Orders Karaoke",stage:"Sibín Beag",day:"Sun",start:"20:30",end:"22:00"},
  {name:"Slán Abhaile (Slawn a-WAL-eh) - Safe Home",stage:"Sibín Beag",day:"Sun",start:"22:00",end:"22:30"},
  // --- Sun: Soapranos Laundrette ---
  {name:"Empressure",stage:"Soapranos Laundrette",day:"Sun",start:"13:00",end:"14:00"},
  {name:"Soapranos: Hotwash!",stage:"Soapranos Laundrette",day:"Sun",start:"14:00",end:"15:00"},
  {name:"Jungyals and Gays (Kushtee b2b Manuka, Lingz b2b Bowen ft Tooti b)",stage:"Soapranos Laundrette",day:"Sun",start:"15:00",end:"17:00"},
  {name:"Selectacee",stage:"Soapranos Laundrette",day:"Sun",start:"17:00",end:"18:00"},
  {name:"Euphonique & MC Enamie",stage:"Soapranos Laundrette",day:"Sun",start:"18:00",end:"19:00"},
  {name:"T-LEX + special guests",stage:"Soapranos Laundrette",day:"Sun",start:"19:00",end:"20:00"},
  // --- Sun: Spectrum 360 ---
  {name:"Peggy Viennetta Ft. MC Stone",stage:"Spectrum 360",day:"Sun",start:"15:00",end:"16:00"},
  {name:"Lobsta B",stage:"Spectrum 360",day:"Sun",start:"16:00",end:"17:00"},
  {name:"DJ Can’t Say No",stage:"Spectrum 360",day:"Sun",start:"17:00",end:"18:00"},
  {name:"Keptek",stage:"Spectrum 360",day:"Sun",start:"18:00",end:"19:00"},
  {name:"Gullyteen",stage:"Spectrum 360",day:"Sun",start:"19:00",end:"20:00"},
  {name:"Darth Leng B2B Slinks [AMEN4TEKNO Takeover]",stage:"Spectrum 360",day:"Sun",start:"20:00",end:"21:00"},
  {name:"Roland K B2B Savage States B2B T-Menace [AMEN4TEKNO Takeover]",stage:"Spectrum 360",day:"Sun",start:"21:00",end:"22:00"},
  {name:"Spongebob Squarewave",stage:"Spectrum 360",day:"Sun",start:"22:00",end:"23:00"},
  {name:"Perceval",stage:"Spectrum 360",day:"Sun",start:"23:00",end:"00:00"},
  // --- Sun: Spinney Hollow ---
  {name:"Spinney Hollow - Banquet of Art table",stage:"Spinney Hollow",day:"Sun",start:"10:00",end:"18:00"},
  {name:"Spinney Hollow - Traditional Green Wood Work Workshop",stage:"Spinney Hollow",day:"Sun",start:"10:00",end:"18:00"},
  // --- Sun: Sub Lab ---
  {name:"SUBLAB ALLSTARS",stage:"Sub Lab",day:"Sun",start:"16:00",end:"17:00"},
  {name:"SUBLAB ALLSTARS",stage:"Sub Lab",day:"Sun",start:"17:00",end:"18:00"},
  {name:"El-Ze",stage:"Sub Lab",day:"Sun",start:"18:00",end:"19:00"},
  {name:"Tashphrodisiac",stage:"Sub Lab",day:"Sun",start:"19:00",end:"20:00"},
  {name:"Dwelha",stage:"Sub Lab",day:"Sun",start:"20:00",end:"21:00"},
  {name:"Felix Culpah",stage:"Sub Lab",day:"Sun",start:"21:00",end:"22:00"},
  {name:"Supplya",stage:"Sub Lab",day:"Sun",start:"22:00",end:"23:00"},
  {name:"SUBLAB ALLSTARS",stage:"Sub Lab",day:"Sun",start:"23:00",end:"23:59"},
  // --- Sun: Tangled Roots ---
  {name:"Lionpulse x Sinai",stage:"Tangled Roots",day:"Sun",start:"12:00",end:"13:00"},
  {name:"Aziza Jaye",stage:"Tangled Roots",day:"Sun",start:"13:00",end:"14:00"},
  {name:"Cheshire Cat",stage:"Tangled Roots",day:"Sun",start:"14:00",end:"15:00"},
  {name:"Ras Demo aka Demolition Man",stage:"Tangled Roots",day:"Sun",start:"15:00",end:"16:00"},
  {name:"Top Cat",stage:"Tangled Roots",day:"Sun",start:"16:00",end:"17:00"},
  {name:"Jolie P",stage:"Tangled Roots",day:"Sun",start:"17:00",end:"18:00"},
  {name:"SIMMS",stage:"Tangled Roots",day:"Sun",start:"18:00",end:"19:00"},
  {name:"Aries (Jungle Set) Ft. Carasel",stage:"Tangled Roots",day:"Sun",start:"19:00",end:"20:15",genre:"Jungle"},
  {name:"IRAH",stage:"Tangled Roots",day:"Sun",start:"20:15",end:"21:00"},
  // --- Sun: The Fools Leap ---
  {name:"Somerset Velvet",stage:"The Fools Leap",day:"Sun",start:"12:00",end:"13:00"},
  {name:"Whiskey Moonface",stage:"The Fools Leap",day:"Sun",start:"13:30",end:"14:30"},
  {name:"Black Kat Boppers",stage:"The Fools Leap",day:"Sun",start:"15:00",end:"16:00"},
  {name:"Panda and The Moniums",stage:"The Fools Leap",day:"Sun",start:"16:30",end:"17:30"},
  {name:"Wanton String Band",stage:"The Fools Leap",day:"Sun",start:"18:00",end:"19:00"},
  {name:"Horses On The Beach",stage:"The Fools Leap",day:"Sun",start:"19:30",end:"20:30"},
  {name:"Seas of Mirth",stage:"The Fools Leap",day:"Sun",start:"21:00",end:"22:00"},
  {name:"Bear Twist's Honky Donk Rock'n'Rollers",stage:"The Fools Leap",day:"Sun",start:"22:00",end:"22:45"},
  {name:"Fiddler on The Doof",stage:"The Fools Leap",day:"Sun",start:"22:45",end:"23:45"},
  // --- Sun: The Garden Centre ---
  {name:"TBC",stage:"The Garden Centre",day:"Sun",start:"13:00",end:"14:00"},
  {name:"Bateman",stage:"The Garden Centre",day:"Sun",start:"14:00",end:"15:30"},
  {name:"TSP Ft. Factual MC",stage:"The Garden Centre",day:"Sun",start:"15:30",end:"16:30"},
  {name:"Joseph Dooley",stage:"The Garden Centre",day:"Sun",start:"16:30",end:"17:30"},
  {name:"BARCODE-THE-DJ",stage:"The Garden Centre",day:"Sun",start:"17:30",end:"19:00"},
  // --- Sun: The Immortal Children of the Eternal Seed ---
  {name:"Aerial Takeover",stage:"The Immortal Children of the Eternal Seed",day:"Sun",start:"20:00",end:"23:00"},
  // --- Sun: The Lion's Den ---
  {name:"David Rodigan Presents: Ram Jam Ft D Double E, Hollie Cook & Irah",stage:"The Lion's Den",day:"Sun",start:"14:30",end:"15:45",genre:"Reggae"},
  {name:"Vengaboys",stage:"The Lion's Den",day:"Sun",start:"16:00",end:"16:50",genre:"Pop / Dance"},
  {name:"EVE",stage:"The Lion's Den",day:"Sun",start:"17:10",end:"18:10",genre:"Hip Hop"},
  {name:"FCUKERS",stage:"The Lion's Den",day:"Sun",start:"18:40",end:"19:40"},
  {name:"Scissor Sisters",stage:"The Lion's Den",day:"Sun",start:"20:10",end:"21:40",genre:"Pop / Dance"},
  {name:"Faithless",stage:"The Lion's Den",day:"Sun",start:"22:15",end:"23:45",genre:"House / Dance"},
  {name:"Boomtown Closing Ceremony",stage:"The Lion's Den",day:"Sun",start:"23:50",end:"00:00"},
  // --- Sun: The Magic Teapot ---
  {name:"The Magic Teapot",stage:"The Magic Teapot",day:"Sun",start:"12:00",end:"00:00"},
  // --- Sun: The Pomegranate Parlour ---
  {name:"Digital Roses",stage:"The Pomegranate Parlour",day:"Sun",start:"14:00",end:"15:00"},
  {name:"Flibble",stage:"The Pomegranate Parlour",day:"Sun",start:"15:00",end:"16:00"},
  {name:"Habibtati",stage:"The Pomegranate Parlour",day:"Sun",start:"16:00",end:"17:00"},
  {name:"DmTree",stage:"The Pomegranate Parlour",day:"Sun",start:"17:00",end:"18:00"},
  {name:"Decebelle",stage:"The Pomegranate Parlour",day:"Sun",start:"18:00",end:"19:00"},
  {name:"Illexxandra & DJ Shakey Mighty Morphin Power Combo",stage:"The Pomegranate Parlour",day:"Sun",start:"19:00",end:"20:00"},
  {name:"Gypsyndicate",stage:"The Pomegranate Parlour",day:"Sun",start:"20:00",end:"21:00"},
  {name:"Me Miles & I",stage:"The Pomegranate Parlour",day:"Sun",start:"21:00",end:"22:30"},
  {name:"LuDec",stage:"The Pomegranate Parlour",day:"Sun",start:"22:30",end:"23:55"},
  // --- Sun: Tinker Station ---
  {name:"Tinker Station",stage:"Tinker Station",day:"Sun",start:"10:00",end:"18:00"},
  // --- Sun: Topsy Turvy Trims ---
  {name:"Black Board Soundsystem",stage:"Topsy Turvy Trims",day:"Sun",start:"13:00",end:"15:00"},
  {name:"Ed Spinna",stage:"Topsy Turvy Trims",day:"Sun",start:"15:00",end:"16:00"},
  {name:"TBA",stage:"Topsy Turvy Trims",day:"Sun",start:"16:00",end:"17:00"},
  {name:"Hokey Cokey Cabaret",stage:"Topsy Turvy Trims",day:"Sun",start:"17:00",end:"18:00"},
  {name:"Ignoring Izzy",stage:"Topsy Turvy Trims",day:"Sun",start:"18:00",end:"19:00"},
  {name:"Tickety Boo",stage:"Topsy Turvy Trims",day:"Sun",start:"19:00",end:"21:00"},
  // --- Sun: Tribe of Frog ---
  {name:"Rob Ótico",stage:"Tribe of Frog",day:"Sun",start:"12:00",end:"13:30"},
  {name:"Piou-Piou",stage:"Tribe of Frog",day:"Sun",start:"13:30",end:"15:00"},
  {name:"Skeptic",stage:"Tribe of Frog",day:"Sun",start:"15:00",end:"16:30"},
  {name:"Krosis",stage:"Tribe of Frog",day:"Sun",start:"16:30",end:"18:00"},
  {name:"Roen",stage:"Tribe of Frog",day:"Sun",start:"18:00",end:"19:00"},
  {name:"Divination",stage:"Tribe of Frog",day:"Sun",start:"19:00",end:"20:00"},
  {name:"Psychosonic",stage:"Tribe of Frog",day:"Sun",start:"20:00",end:"21:00"},
  {name:"Trubble",stage:"Tribe of Frog",day:"Sun",start:"21:00",end:"22:00"},
  {name:"Celli",stage:"Tribe of Frog",day:"Sun",start:"22:00",end:"23:00"},
  // --- Sun: Twisted Time Machine (Bad Apple Bar) ---
  {name:"DAY TRIPPING : ALBUM PLAYBACKS with PAPA DISCO",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sun",start:"12:00",end:"13:00"},
  {name:"MÚM - FINALLY WE ARE NO ONE (Album Playback)",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sun",start:"13:00",end:"14:00"},
  {name:"SUSOMO YAKOTA - ACID MT FUJI (Album Playback)",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sun",start:"14:00",end:"15:00"},
  {name:"MOTOWN AMORE",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sun",start:"15:00",end:"16:00"},
  {name:"THE BEATLES HOUR",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sun",start:"16:00",end:"17:00"},
  {name:"EMERGING BEATS : DARE TO DISCO",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sun",start:"17:00",end:"18:00"},
  {name:"THE JOSH BAKER TRIBUTE PARTY",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sun",start:"18:00",end:"19:00"},
  {name:"CHURCH OF DONKOLOGY",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sun",start:"19:00",end:"20:00"},
  {name:"HANG THE DJS : SUNDAY SERVICE",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sun",start:"20:00",end:"22:00"},
  {name:"PAPA DISCO's GOODNIGHT SET",stage:"Twisted Time Machine (Bad Apple Bar)",day:"Sun",start:"22:00",end:"00:00"},
  // --- Sun: XR ---
  {name:"Last Chance Salon",stage:"XR",day:"Sun",start:"11:00",end:"16:00"},
  {name:"Art Blocking and Costume Pimping",stage:"XR",day:"Sun",start:"11:00",end:"16:00"},
  {name:"Cassandra the Oracle",stage:"XR",day:"Sun",start:"11:00",end:"12:00"},
  {name:"Dirty Scrubbers Meditation",stage:"XR",day:"Sun",start:"12:00",end:"13:00"},
  {name:"Cassandra the Oracle",stage:"XR",day:"Sun",start:"14:00",end:"16:00"},
  {name:"Tea Ladies",stage:"XR",day:"Sun",start:"14:00",end:"16:00"}
];
// AUTO-GENERATED:LINEUP:END

const DAY_ORDER = ["Wed","Thu","Fri","Sat","Sun"];

function toMinutes(day, time){
  const dayIdx = DAY_ORDER.indexOf(day);
  if(dayIdx === -1 || !time) return null;
  const [h,m] = time.split(":").map(Number);
  // Sets starting 00:00–04:59 are a continuation of that evening's programme,
  // not the start of a fresh calendar day — roll them into the next day's
  // minute count so ordering/clash checks stay chronological.
  const rollover = h < 5 ? 1 : 0;
  return (dayIdx + rollover) * 1440 + h * 60 + m;
}

// Fill in end times only where the source data didn't already give one —
// most entries now carry real, confirmed end times. Anything left over
// (custom/TBC adds) falls back to "until the next act on that stage",
// flagged as estimated.
(function computeEndTimes(){
  const groups = {};
  artists.forEach((a,i)=>{
    if(!a.start) return;
    const key = a.stage+"|"+a.day;
    (groups[key] = groups[key] || []).push(i);
  });
  Object.values(groups).forEach(idxs=>{
    idxs.sort((i,j)=> toMinutes(artists[i].day, artists[i].start) - toMinutes(artists[j].day, artists[j].start));
    idxs.forEach((idx,k)=>{
      if(artists[idx].end) return;
      artists[idx].estimatedEnd = true;
      if(k+1 < idxs.length){
        artists[idx].end = artists[idxs[k+1]].start;
      } else {
        const [h,m] = artists[idx].start.split(":").map(Number);
        artists[idx].end = String((h+1)%24).padStart(2,"0")+":"+String(m).padStart(2,"0");
      }
    });
  });
})();

// `artists` is a big static const array baked into this file at deploy
// time — nothing at runtime can actually rewrite it, so an "official"
// time correction submitted from the app (see applyOfficialTimeCorrection
// near openTimeEditor) can't literally edit the real lineup data. What
// it CAN do is layer a synced correction on top of it here, applied to
// every matching artist on every call — same "overlay on static/synced
// base data" pattern as customLandmarks/customPlaces elsewhere in this
// file. Keyed "day|name" only, not day+name+start+stage — an act with
// two different sets on the same day would have both corrected
// identically, which is a real but rare edge case given how few acts
// double up same-day, not worth a more complex key for.
function allArtists(){
  const base = artists.concat(Store.get("customArtists"));
  const corrections = Store.get("officialTimeCorrections") || {};
  if(!Object.keys(corrections).length) return base;
  return base.map(a=>{
    const c = corrections[`${a.day || "TBC"}|${a.name}`];
    return c ? { ...a, start: c.start, end: c.end } : a;
  });
}

// ===============================
// OTHER SETS — some acts play more than once across the weekend (a B2B
// slot one day, a solo set another, a "takeover" repeat). Wherever a
// single slot's card/detail is shown, this surfaces the others by name
// so you don't have to notice a repeat by scrolling the whole lineup.
// ===============================
function otherSetsFor(artist){
  return allArtists()
    .filter(a=> a.name === artist.name && !(a.day === artist.day && a.start === artist.start && a.stage === artist.stage))
    .sort((a,b)=> (toMinutes(a.day, a.start) ?? 999999) - (toMinutes(b.day, b.start) ?? 999999));
}

function otherSetsHTML(artist){
  const others = otherSetsFor(artist);
  if(!others.length) return "";
  const rows = others.map((o,i)=> `<a class="other-set-link" href="javascript:void(0)" data-idx="${i}"><span class="other-set-day">${escapeHtml(o.day)}</span><span class="other-set-time">${escapeHtml(o.start||"TBC")}</span><span class="other-set-stage">${escapeHtml(o.stage)}</span></a>`).join("");
  return `<div class="other-sets-note"><span class="other-sets-label">Also playing</span>${rows}</div>`;
}

// Wires the links otherSetsHTML() renders — call after inserting that
// HTML into a container. Tapping one opens that other slot's own detail
// card, same as tapping its timeline block would.
function wireOtherSetLinks(container, artist, opts){
  const others = otherSetsFor(artist);
  container.querySelectorAll(".other-set-link").forEach(a=>{
    const other = others[Number(a.dataset.idx)];
    if(!other) return;
    a.onclick = (e)=>{
      e.stopPropagation();
      showTimelineDetailModal(other, opts || {});
    };
  });
}

// A starred artist is saved as a snapshot ({...artist}) at the moment it's
// starred, so if the festival later moves that artist to a new stage/day/
// time, the saved snapshot goes stale and the plan shows the old slot
// instead of following the artist to the new one. Re-sync every saved
// snapshot (both this device's own plan and any synced group plans)
// against the current lineup data on every load, so a starred artist keeps
// tracking their current slot rather than freezing at whatever it was when
// starred. An artist dropped entirely from the lineup is left as-is.
function reconcileSavedArtists(){
  const byName = new Map(allArtists().map(a=>[a.name, a]));
  const fields = ["stage","day","start","end","genre"];
  function reconciled(list){
    let changed = false;
    const next = list.map(saved=>{
      const latest = byName.get(saved.name);
      if(!latest) return saved;
      const updated = { ...saved };
      fields.forEach(f=>{
        if(latest[f] !== undefined && latest[f] !== saved[f]){ updated[f] = latest[f]; changed = true; }
      });
      return updated;
    });
    return { list: next, changed };
  }

  const mine = reconciled(Store.get("schedule"));
  if(mine.changed) Store.set("schedule", mine.list);

  const people = Store.get("peopleSchedules") || {};
  let peopleChanged = false;
  Object.keys(people).forEach(person=>{
    // Tolerates a device's pre-existing local data in the old flat-array
    // shape (from before per-person snapshots carried a displayName
    // field) as well as the current { displayName, list } shape — the
    // next real sync naturally replaces any legacy entry with the new
    // shape anyway, so this is just about not crashing on old data.
    const entry = people[person];
    const list = Array.isArray(entry) ? entry : (entry && entry.list) || [];
    const r = reconciled(list);
    if(r.changed){
      people[person] = Array.isArray(entry) ? r.list : { ...entry, list: r.list };
      peopleChanged = true;
    }
  });
  if(peopleChanged) Store.set("peopleSchedules", people);
}
reconcileSavedArtists();

function timeLabel(a){
  if(a.day && a.day !== "TBC" && a.start){
    return `${a.day} · ${a.start}${a.end ? "–"+a.end+(a.estimatedEnd ? " (est.)" : "") : ""}`;
  }
  return "Set time TBC";
}

// ===============================
// ARTIST SEARCH
// ===============================
const artistSearch = document.getElementById("artistSearch");
const artistResults = document.getElementById("artistResults");
const clearArtistSearchBtn = document.getElementById("clearArtistSearchBtn");

// Genre chips are a multi-select filter (AND-combined with the free-text
// search below), not exclusive with each other or with typed text.
let selectedGenres = new Set();

function toggleGenreChip(g){
  if(selectedGenres.has(g)) selectedGenres.delete(g); else selectedGenres.add(g);
}

function clearGenreChips(){
  selectedGenres.clear();
}

function updateGenreChipHighlights(){
  document.querySelectorAll("#genreChips .chip").forEach(c=> c.classList.toggle("active", selectedGenres.has(c.dataset.g)));
}

// Day chips — same multi-select, AND-combined pattern as genre chips
// above, so Lineup search can filter by day without switching to the
// Timeline view (which only shows one day at a time).
let selectedDays = new Set();

function toggleDayChip(d){
  if(selectedDays.has(d)) selectedDays.delete(d); else selectedDays.add(d);
}

function clearDayChips(){
  selectedDays.clear();
}

function updateDayChipHighlights(){
  document.querySelectorAll("#dayChips .chip").forEach(c=> c.classList.toggle("active", selectedDays.has(c.dataset.d)));
}

function loadDayChips(){
  const box = document.getElementById("dayChips");
  if(!box) return;
  box.innerHTML = DAY_ORDER.map(d=>`<span class="chip" data-d="${d}">${d}</span>`).join("");
  updateDayChipHighlights();
  box.querySelectorAll(".chip[data-d]").forEach(s=>{
    s.onclick = ()=>{
      toggleDayChip(s.dataset.d);
      updateDayChipHighlights();
      updateClearArtistSearchBtn();
      renderArtistSearchResults();
    };
  });
}

function hasActiveArtistFilters(){
  return artistSearch.value.trim().length > 0 || selectedGenres.size > 0 || selectedDays.size > 0;
}

function updateClearArtistSearchBtn(){
  if(!clearArtistSearchBtn) return;
  clearArtistSearchBtn.style.display = hasActiveArtistFilters() ? "" : "none";
}

// ===============================
// WANT TO SEE TOGETHER — retired from the UI (no button creates these
// any more, see showArtists() above and wantTogetherEntries() further
// down, which now always returns empty). Left in place, not deleted:
// removing it fully would mean touching buildSyncPayload/
// mergeSyncPayload/firestore.rules too, and rejecting a field a
// not-yet-updated device might still send isn't a risk worth taking
// just to hide a feature. Was: a lightweight, explicit "I specifically
// want the group to coordinate around this one" flag on a Lineup
// artist card, separate from just starring it to your own Plan.
// ===============================
function wantTogetherKey(day, name){
  return `${day || "TBC"}|${name}`;
}
function myWantTogetherSet(){
  return new Set(Store.get("wantTogether") || []);
}
function isWantTogether(day, name){
  return myWantTogetherSet().has(wantTogetherKey(day, name));
}
function toggleWantTogether(day, name){
  const key = wantTogetherKey(day, name);
  const list = Store.get("wantTogether") || [];
  const idx = list.indexOf(key);
  if(idx === -1) list.push(key); else list.splice(idx, 1);
  Store.set("wantTogether", list);
}
// Every name (including your own, if flagged) that's flagged "want
// together" for this exact day+artist — combines this device's own
// list with every synced teammate's peopleWantTogether snapshot.
function wantTogetherInterestedNames(day, name){
  const key = wantTogetherKey(day, name);
  const names = new Set();
  const myName = currentContributorName() || "You";
  if(myWantTogetherSet().has(key)) names.add(myName);
  const peopleWantTogether = Store.get("peopleWantTogether") || {};
  Object.entries(peopleWantTogether).forEach(([id, entry])=>{
    if(personSnapshotList(entry).includes(key)) names.add(personDisplayName(entry, id));
  });
  return [...names];
}

function showArtists(list){
  artistResults.innerHTML = "";
  if(list.length === 0){
    artistResults.innerHTML = `<p class="empty-note">No artists match that search.</p>`;
    return;
  }
  // Built once per render, not per artist — same combined-interest map
  // Today's dashboard already computes, reused here rather than a
  // separate per-card lookup.
  const interestMap = (typeof buildCombinedArtistInterestMap === "function") ? buildCombinedArtistInterestMap() : {};
  const totalPeople = (typeof comparePeopleList === "function") ? comparePeopleList().length : 1;
  list.forEach(artist=>{
    const saved = Store.get("schedule").some(x=>x.name === artist.name);
    const mustSee = isMustSee(artist.name);
    const seen = isSeen(artist.name);
    const div = document.createElement("div");
    div.className = "item" + (mustSee ? " mustsee" : "");
    const genre = genreOf(artist);
    const bioBlock = artistBioBlockHtml(artist);
    const previewBlock = artistPreviewBlockHtml(artist);
    const interestEntry = totalPeople > 1 ? interestMap[`${artist.day || "TBC"}|${artist.name}`] : null;
    const consensusBadge = (interestEntry && Object.keys(interestEntry.interest).length)
      ? `<div class="consensus-badge">🔥 ${Object.keys(interestEntry.interest).length}/${totalPeople} interested<br><span class="consensus-owners">${Object.entries(interestEntry.interest).map(([o,m])=> `${escapeHtml(o)}${m?" ★":" 👍"}`).join(" · ")}</span></div>`
      : "";
    div.innerHTML = `
      <div class="item-top">
        <div>
          <strong>${artist.name}</strong><br>
          <span class="stage-link" data-stage="${escapeHtml(artist.stage)}">${artist.stage}</span><br>
          ${timeLabel(artist)}<br>
          <small>${genre}</small>
          <div class="artist-descriptor">${escapeHtml(artistDescriptor(artist))}</div>
          ${bioBlock}
          ${previewBlock}
          ${consensusBadge}
          ${otherSetsHTML(artist)}
        </div>
        <div class="star-seen-col">
          <button class="star-btn${mustSee ? " mustsee" : ""}" aria-label="Toggle saved, hold for must-see">${saved ? "★" : "☆"}</button>
          <button class="seen-btn${seen ? " seen" : ""}" aria-label="${seen ? "You saw this live — tap to undo" : "Tick once you've actually seen this live at the festival"}" title="${seen ? "You saw this live — tap to undo" : "Confirm: I saw this live at the festival"}">✓</button>
          ${inviteHeartBtnHTML(artist)}
          ${artist.start ? `<button class="ghost timeline-jump-btn" aria-label="View on the timeline" title="View on the timeline" style="padding:5px 8px; font-size:13px;">🗓</button>` : ""}
        </div>
      </div>
    `;
    wireStarButton(div.querySelector(".star-btn"), artist);
    wireSeenButton(div.querySelector(".seen-btn"), artist);
    wireInviteHeartBtn(div.querySelector(".invite-heart-btn"), artist);
    div.querySelector(".stage-link").onclick = (e)=>{ e.stopPropagation(); jumpToStageDirectory(artist.stage); };
    wirePreviewButtons(div);
    wireOtherSetLinks(div, artist);
    // Main List/search results are the primary search experience — this
    // is how a search result actually gets you to the Timeline view now,
    // rather than needing the small dedicated timeline-only search.
    const timelineJumpBtn = div.querySelector(".timeline-jump-btn");
    if(timelineJumpBtn) timelineJumpBtn.onclick = (e)=>{ e.stopPropagation(); jumpToArtistInTimeline(artist); };
    artistResults.appendChild(div);
  });
}

function currentFilteredArtists(){
  const term = artistSearch.value.trim().toLowerCase();
  return allArtists().filter(artist=>{
    const matchesTerm = !term ||
      artist.name.toLowerCase().includes(term) ||
      artist.stage.toLowerCase().includes(term) ||
      genreOf(artist).toLowerCase().includes(term);
    const matchesGenres = selectedGenres.size === 0 || selectedGenres.has(genreOf(artist));
    const matchesDays = selectedDays.size === 0 || selectedDays.has(artist.day);
    return matchesTerm && matchesGenres && matchesDays;
  });
}

// With 1000+ acts across the full 5-day dataset, dumping everything to
// the DOM on load is slow on older phones — search-first instead.
function promptArtistSearch(){
  artistResults.innerHTML = `<p class="empty-note">Start typing a name, stage or genre — or tap one or more day/genre chips above — to search ${allArtists().length} acts across all 5 days.</p>`;
}
function renderArtistSearchResults(){
  if(!hasActiveArtistFilters()){ promptArtistSearch(); return; }
  showArtists(currentFilteredArtists());
}
let artistSearchDebounceTimer = null;
artistSearch.oninput = ()=>{
  updateClearArtistSearchBtn();
  clearTimeout(artistSearchDebounceTimer);
  artistSearchDebounceTimer = setTimeout(renderArtistSearchResults, 180);
};
if(clearArtistSearchBtn){
  clearArtistSearchBtn.onclick = ()=>{
    artistSearch.value = "";
    clearGenreChips();
    updateGenreChipHighlights();
    clearDayChips();
    updateDayChipHighlights();
    updateClearArtistSearchBtn();
    promptArtistSearch();
  };
}
updateClearArtistSearchBtn();
promptArtistSearch();

// ===============================
// SHARED TIMELINE BUILDER — used by both the Artists screen ("all acts,
// by stage and time, for one day") and the Plan screen ("saved acts,
// by stage and time, for whichever person's tab is selected"). Renders
// a horizontally-scrollable set of stage columns against a shared,
// vertically-scrollable time axis.
// ===============================
// Stages down the left, time along the top — matches the official
// Boomtown app's own timetable layout (and every printed festival
// timetable), and scales better than the old stages-as-columns layout:
// time is bounded to a single day so the horizontal scroll stays capped,
// while the stage list — unbounded, 12 main stages plus 50+ hidden
// venues — scrolls naturally downward instead of forcing an ever-wider
// row of columns.
// venueDirectory is declared further down the file, so category lookups
// below are built lazily on first use rather than at module-evaluation time.

// Four broad buckets, collapsed into the three tiers below (CATEGORY_TIER)
// for grouping the timeline's stage list (see buildTimelineHTML). Maps
// every venueDirectory `type` string onto "main"/"venue"/"workshop"/
// "activity"; a stage name with no venueDirectory entry (e.g. a group
// member's own "<name>'s activities" personal row) gets null and falls
// into its own trailing tier.
const VENUE_TYPE_CATEGORY = {
  "Main stage": "main",
  "Hidden venue": "venue",
  "Shop / hidden venue": "venue",
  "Workshop / shop": "workshop",
  "Talks / installation": "workshop",
  "Installation": "workshop",
  "Installation / talks": "workshop",
  "Research hub": "workshop",
  "Leisure / ride": "activity",
  "Chill space": "activity",
  "Welfare / support": "activity",
  "Food & drink": "activity",
  "Shop / cafe": "activity"
};
let _venueCategoryByName = null;
function venueCategoryFor(stageName){
  if(!_venueCategoryByName){
    _venueCategoryByName = new Map(venueDirectory.map(v=> [v.name, VENUE_TYPE_CATEGORY[v.type] || null]));
  }
  return _venueCategoryByName.get(stageName) || null;
}

// Three-tier grouping for the timeline's stage list — main stages, then
// smaller stages/venues, then workshops/activities/support — rendered as
// section-divider rows (see buildTimelineHTML) rather than per-name text
// colour, so the distinction reads as an actual grouping in the list
// instead of a colour key you have to learn. Anything with no
// venueDirectory entry (e.g. a group member's own "<name>'s activities"
// row) sorts into its own trailing tier, after everything else.
const CATEGORY_TIER = { main: 0, venue: 1, workshop: 2, activity: 2 };
const TIER_LABELS = { 0: "Main Stages", 1: "Stages & Venues", 2: "Activities & Support", 3: "Other" };
function tierForCategory(category){
  return (category != null && CATEGORY_TIER[category] != null) ? CATEGORY_TIER[category] : 3;
}

function buildTimelineHTML(items, opts){
  opts = opts || {};
  const pxPerMin = opts.pxPerMin || 2.6;
  const rowHeight = opts.rowHeight || 48;
  if(!items.length){
    return { html: `<p class="empty-note" style="padding:16px;">Nothing to show here yet.</p>`, stages: [] };
  }
  const parsed = items.map(a=>{
    const [sh,sm] = (a.start||"0:0").split(":").map(Number);
    const [eh,em] = (a.end||a.start||"0:0").split(":").map(Number);
    // Early-morning times (00:00–05:59) are always the tail of that
    // day's own overnight programme, not a fresh start (see toMinutes()
    // and DAY_ORDER above) — shift them past the rest of the day's raw
    // minute-of-day range so they plot at the END of the timeline,
    // continuing on from the evening, instead of jumbled in at the start
    // as if they were the day's earliest slot.
    let start = (sh||0)*60 + (sm||0);
    if((sh||0) < 6) start += 1440;
    let end = (eh||0)*60 + (em||0);
    if((eh||0) < 6) end += 1440;
    if(end <= start) end += 1440;
    return { ...a, _start:start, _end:end };
  });
  const minMin = Math.floor(Math.min(...parsed.map(p=>p._start))/60)*60;
  const maxMin = Math.ceil(Math.max(...parsed.map(p=>p._end))/60)*60;
  // Main stages first (Grand Central, Hydro XL, etc.), then every smaller
  // stage/hidden venue, then workshops/activities/support — alphabetically
  // within each tier (see CATEGORY_TIER above).
  const stages = [...new Set(parsed.map(p=>p.stage))].sort((a,b)=>{
    const ta = tierForCategory(venueCategoryFor(a));
    const tb = tierForCategory(venueCategoryFor(b));
    return ta !== tb ? ta - tb : a.localeCompare(b);
  });
  const totalWidth = Math.max((maxMin-minMin)*pxPerMin, 40);
  const savedNames = opts.savedNames || null;
  const mustSeeNames = opts.mustSeeNames || null;

  // "Now" line — only when opts.day is the day actually showing on the
  // device's own clock right now (never guessed, never shown against
  // the wrong day), and only when that falls within the plotted time
  // range. Computed fresh on every render, straight off new Date(), so
  // this is accurate for real once the festival's actually on — not a
  // hand-set time that needs remembering to update.
  let nowLineLeft = null;
  if(opts.day && typeof currentFestivalDayLabel === "function" && currentFestivalDayLabel() === opts.day){
    const now = new Date();
    let nowMinOfDay = now.getHours()*60 + now.getMinutes();
    if(now.getHours() < 6) nowMinOfDay += 1440; // same overnight-tail shift as _start/_end above
    if(nowMinOfDay >= minMin && nowMinOfDay <= maxMin) nowLineLeft = (nowMinOfDay - minMin) * pxPerMin;
  }
  const nowLineHTML = nowLineLeft !== null ? `<div class="timeline-now-line" style="left:${nowLineLeft}px;"></div>` : "";

  let hourLabels = "", hourLines = "";
  for(let m=minMin; m<=maxMin; m+=60){
    const left = (m-minMin)*pxPerMin;
    const hh = Math.floor((((m%1440)+1440)%1440)/60).toString().padStart(2,"0");
    hourLabels += `<div class="timeline-hour-label" style="left:${left}px;">${hh}:00</div>`;
    hourLines += `<div class="timeline-vline" style="left:${left}px;"></div>`;
  }

  // Section-divider rows between tiers (see CATEGORY_TIER/TIER_LABELS
  // above) — only shown when the stage list actually spans more than one
  // tier, so a Plan/Clash timeline that's all main-stage saves doesn't
  // get a redundant single "Main Stages" header.
  const tiersPresent = new Set(stages.map(s=>tierForCategory(venueCategoryFor(s))));
  let lastTier = null;
  const rows = stages.map(stage=>{
    // Sorted by start time, then packed into lanes (extra vertical bands
    // within the row) via a greedy interval-scheduling pass — two items
    // on the same stage were previously only nudged apart by WIDTH
    // (clamped against the next item's start), which assumed same-stage
    // items never truly overlap in time. They can: two of one person's
    // own overlapping activities share a lane ("<name>'s activities" —
    // see activityToTimelineItem), or a genuine same-stage double-booking
    // in the source data. Without a real lane, two such items land at
    // the exact same left position and render fully on top of each
    // other rather than just close together. Most rows have zero
    // overlaps and end up with a single lane — same look as before.
    const stageItems = parsed.filter(p=>p.stage===stage).sort((a,b)=> a._start - b._start);
    const laneEndTimes = [];
    const lanes = [];
    stageItems.forEach(p=>{
      let laneIdx = laneEndTimes.findIndex(end=> end <= p._start);
      if(laneIdx === -1){ laneIdx = laneEndTimes.length; lanes.push([]); }
      laneEndTimes[laneIdx] = p._end;
      lanes[laneIdx].push(p);
      p._lane = laneIdx;
    });
    const stageRowHeight = rowHeight * lanes.length;
    const blocks = stageItems.map(p=>{
      const lane = lanes[p._lane];
      const i = lane.indexOf(p);
      const left = (p._start-minMin)*pxPerMin;
      const desiredWidth = Math.max((p._end-p._start)*pxPerMin, 60);
      const next = lane[i+1];
      // 2px breathing room before the next block's left edge (within the
      // SAME lane only now); floors at 20px rather than letting two
      // back-to-back/overlapping-in-data acts collapse to zero or
      // negative width.
      const gapLimit = next ? Math.max((next._start-minMin)*pxPerMin - left - 2, 20) : Infinity;
      const width = Math.min(desiredWidth, gapLimit);
      const top = p._lane * rowHeight + 3;
      const blockHeight = rowHeight - 6;
      const isSaved = savedNames ? savedNames.has(p.name) : false;
      const isMustSeeBlock = mustSeeNames ? mustSeeNames.has(p.name) : false;
      const cls = "timeline-block" + (isSaved ? " saved" : "") + (isMustSeeBlock ? " mustsee" : "") + (opts.readonly ? " readonly" : "");
      // Combined multi-person timelines (see renderPlanTimeline) tag each
      // merged block with who picked it — one small coloured circle per
      // person (colour + initial, not just a bare letter) so two people
      // whose names start with the same letter (e.g. Dana and Dave) still
      // read as clearly different at a glance, kept compact since blocks
      // can be as narrow as 60px.
      const ownerBadge = (opts.showOwnerBadges && p._owners && p._owners.length)
        ? `<span class="tb-owners" title="${escapeHtml(p._owners.join(", "))}">${p._owners.map(o=>`<span class="tb-owner-dot" style="background:${personColorFor(o)}">${escapeHtml((o[0]||"?").toUpperCase())}</span>`).join("")}</span>`
        : "";
      return `<div class="${cls}" style="left:${left}px; width:${width}px; top:${top}px; height:${blockHeight}px;" data-name="${escapeHtml(p.name)}" data-day="${escapeHtml(p.day||"")}">${ownerBadge}<b>${escapeHtml(p.name)}</b><span class="tb-time">${escapeHtml(p.start||"")}${p.end?"–"+escapeHtml(p.end):""}${isSaved?" ★":""}</span></div>`;
    }).join("");
    // venueCategoryFor()'s only job here is deciding which tier this row
    // falls into, for the section divider below — doesn't touch the
    // stage sort above or any block/lane logic.
    const tier = tierForCategory(venueCategoryFor(stage));
    let divider = "";
    if(tiersPresent.size > 1 && tier !== lastTier){
      divider = `<div class="timeline-section-divider"><span class="timeline-section-divider-label">${escapeHtml(TIER_LABELS[tier] || "")}</span></div>`;
      lastTier = tier;
    }
    return divider + `<div class="timeline-row"><div class="timeline-row-head stage-link" data-stage="${escapeHtml(stage)}">${escapeHtml(stage)}</div><div class="timeline-row-body" style="width:${totalWidth}px; height:${stageRowHeight}px;">${hourLines}${blocks}${nowLineHTML}</div></div>`;
  }).join("");

  // Same line repeated into every row-body above (each positioned in
  // that row's own coordinate space, same as the blocks) reads as one
  // continuous vertical line down the whole grid; this one extra copy
  // in the hours row is just to carry the "NOW" tag at the top.
  const nowLabelHTML = nowLineLeft !== null ? `<div class="timeline-now-line" style="left:${nowLineLeft}px;"><span class="timeline-now-label">NOW</span></div>` : "";

  const html = `<div class="timeline-grid">
    <div class="timeline-hours-row"><div class="timeline-row-head">&nbsp;</div><div class="timeline-hours-body" style="width:${totalWidth}px;">${hourLabels}${nowLabelHTML}</div></div>
    ${rows}
  </div>`;
  return { html, stages };
}

// Shared detail card for a tapped timeline block — same bio/genre info as
// the Artists list view, plus a star button, rendered into a container
// below the grid instead of toggling saved state on tap alone.
// A tapped timeline block used to render its detail card into a div
// below the (horizontally-scrollable) timeline grid — easy to miss
// entirely, since it landed off the visible area with no indication
// anything had happened. Shows as a proper overlay instead, centred
// over the timeline, closed explicitly via the × or by tapping outside.
function closeTimelineDetailModal(){
  const existing = document.getElementById("timelineDetailModal");
  if(existing) existing.remove();
}

function showTimelineDetailModal(artist, opts){
  opts = opts || {};
  closeTimelineDetailModal();
  const saved = Store.get("schedule").some(x=>x.name === artist.name);
  const mustSee = isMustSee(artist.name);
  const seen = isSeen(artist.name);
  const genre = genreOf(artist);
  const bioBlock = artistBioBlockHtml(artist);
  const previewBlock = artistPreviewBlockHtml(artist);
  const backdrop = document.createElement("div");
  backdrop.id = "timelineDetailModal";
  backdrop.style.cssText = "position:fixed; inset:0; z-index:60; background:rgba(5,10,8,.72); display:flex; align-items:center; justify-content:center; padding:20px;";
  backdrop.innerHTML = `
    <div class="card timeline-modal-card" style="position:relative; width:100%; max-width:420px; max-height:80vh; overflow-y:auto; margin:0;">
      <button aria-label="Close" id="timelineDetailCloseBtn" style="position:absolute; top:10px; right:10px; background:none; border:1px solid var(--line); color:var(--text-primary); border-radius:10px; width:32px; height:32px; font-size:16px; line-height:1; cursor:pointer;">✕</button>
      <div class="timeline-modal-body">
        <div>
          <strong>${escapeHtml(artist.name)}</strong><br>
          <span class="stage-link" data-stage="${escapeHtml(artist.stage)}">${escapeHtml(artist.stage)}</span><br>
          ${timeLabel(artist)}<br>
          <small>${escapeHtml(genre)}</small>
          <div class="artist-descriptor">${escapeHtml(artistDescriptor(artist))}</div>
          ${bioBlock}
          ${previewBlock}
          ${otherSetsHTML(artist)}
        </div>
        <div class="star-seen-col">
          ${opts.readonly ? "" : `<button class="star-toggle-lg${mustSee ? " mustsee" : ""}" aria-label="Toggle saved, hold for must-see" id="timelineDetailStarBtn">${saved ? "★" : "☆"}</button>`}
          <button class="seen-toggle-lg${seen ? " seen" : ""}" aria-label="${seen ? "You saw this live — tap to undo" : "Tick once you've actually seen this live at the festival"}" title="${seen ? "You saw this live — tap to undo" : "Confirm: I saw this live at the festival"}" id="timelineDetailSeenBtn">✓</button>
          ${opts.readonly ? "" : inviteHeartBtnHTML(artist).replace('class="ghost invite-heart-btn', 'id="timelineDetailInviteBtn" class="ghost invite-heart-btn')}
        </div>
      </div>
    </div>
  `;
  backdrop.onclick = (e)=>{ if(e.target === backdrop) closeTimelineDetailModal(); };
  document.body.appendChild(backdrop);
  backdrop.querySelector("#timelineDetailCloseBtn").onclick = closeTimelineDetailModal;
  wirePreviewButtons(backdrop);
  wireOtherSetLinks(backdrop, artist, opts);
  const stageLink = backdrop.querySelector(".stage-link");
  if(stageLink) stageLink.onclick = (e)=>{ e.stopPropagation(); closeTimelineDetailModal(); jumpToStageDirectory(artist.stage); };
  const starBtn = backdrop.querySelector("#timelineDetailStarBtn");
  // Stay open after a save/unsave/must-see toggle — the × (or tapping
  // outside) is the only way this closes, so touching the star doesn't
  // feel like it randomly dismissed the card out from under you.
  if(starBtn) wireStarButton(starBtn, artist, ()=>{
    if(opts.onSaveToggle) opts.onSaveToggle();
    showTimelineDetailModal(artist, opts);
  });
  const seenBtn = backdrop.querySelector("#timelineDetailSeenBtn");
  if(seenBtn) seenBtn.onclick = (e)=>{
    e.stopPropagation();
    setSeen(artist, !isSeen(artist.name));
    showTimelineDetailModal(artist, opts);
  };
  const inviteBtn = backdrop.querySelector("#timelineDetailInviteBtn");
  if(inviteBtn) inviteBtn.onclick = (e)=>{
    e.stopPropagation();
    toggleGroupInvite(artist).then(()=> showTimelineDetailModal(artist, opts));
  };
}

let artistsTimelineDay = "Wed";
let artistsView = "timeline";

function renderArtistTimelineDayTabs(){
  const box = document.getElementById("artistTimelineDayTabs");
  if(!box) return;
  box.className = "tabstrip";
  box.innerHTML = DAY_ORDER.map(d=>`<button class="${d===artistsTimelineDay?"active":""}" data-day="${d}">${d}</button>`).join("");
  box.querySelectorAll("button").forEach(btn=>{
    btn.onclick = ()=>{
      artistsTimelineDay = btn.dataset.day;
      renderArtistTimelineDayTabs();
      renderArtistsTimeline();
    };
  });
}

function renderArtistsTimeline(){
  const grid = document.getElementById("artistTimelineGrid");
  if(!grid) return;
  const dayItems = allArtists().filter(a=> a.day === artistsTimelineDay && a.start);
  const savedNames = new Set(Store.get("schedule").map(s=>s.name));
  const mustSeeNames = new Set(Store.get("schedule").filter(s=>s.mustSee).map(s=>s.name));
  const { html } = buildTimelineHTML(dayItems, { day: artistsTimelineDay, savedNames, mustSeeNames });
  grid.innerHTML = html;
  grid.querySelectorAll(".timeline-block").forEach(b=>{
    b.onclick = ()=>{
      const name = b.dataset.name, day = b.dataset.day;
      const artist = allArtists().find(a=>a.name===name && a.day===day);
      if(artist) showTimelineDetailModal(artist, { onSaveToggle: renderArtistsTimeline });
    };
  });
  wireStageLinks(grid);
  refreshTimelineScrollProgress("artistTimelineOuter");
}

const artistsViewListBtn = document.getElementById("artistsViewListBtn");
const artistsViewTimelineBtn = document.getElementById("artistsViewTimelineBtn");
if(artistsViewListBtn && artistsViewTimelineBtn){
  artistsViewListBtn.onclick = ()=>{
    artistsView = "list";
    artistsViewListBtn.classList.add("active");
    artistsViewTimelineBtn.classList.remove("active");
    document.getElementById("artistsListView").style.display = "";
    document.getElementById("artistsTimelineView").style.display = "none";
  };
  artistsViewTimelineBtn.onclick = ()=>{
    artistsView = "timeline";
    artistsViewTimelineBtn.classList.add("active");
    artistsViewListBtn.classList.remove("active");
    document.getElementById("artistsListView").style.display = "none";
    document.getElementById("artistsTimelineView").style.display = "";
    renderArtistTimelineDayTabs();
    renderArtistsTimeline();
  };
}

// LINEUP SEARCH → TIMELINE — the small 🔍 above the Timeline view's day
// tabs. Reuses the exact same search state/logic as the List/search view
// (artistSearch.value + currentFilteredArtists()/hasActiveArtistFilters())
// rather than a second, parallel filter implementation — typing here
// drives that same shared input, so switching to List/search later shows
// the same query.
function jumpToArtistInTimeline(artist){
  if(artist.day && DAY_ORDER.includes(artist.day)) artistsTimelineDay = artist.day;
  if(artistsView !== "timeline" && artistsViewTimelineBtn) artistsViewTimelineBtn.click();
  else { renderArtistTimelineDayTabs(); renderArtistsTimeline(); }
  // Double rAF: the view-switch/render above already ran synchronously,
  // but scrollIntoView needs the block's final layout in place — same
  // pattern as doBackNav's own double rAF further up this file.
  requestAnimationFrame(()=> requestAnimationFrame(()=>{
    const block = document.querySelector(`#artistTimelineGrid .timeline-block[data-name="${CSS.escape(artist.name)}"][data-day="${CSS.escape(artist.day||"")}"]`);
    if(!block) return;
    block.scrollIntoView({ behavior:"smooth", block:"center", inline:"center" });
    block.classList.add("search-highlight");
    setTimeout(()=> block.classList.remove("search-highlight"), 2300);
  }));
}

function closeArtistTimelineSearch(){
  const existing = document.getElementById("artistTimelineSearchModal");
  if(existing) existing.remove();
}
function openArtistTimelineSearch(){
  closeArtistTimelineSearch();
  const backdrop = document.createElement("div");
  backdrop.id = "artistTimelineSearchModal";
  backdrop.style.cssText = "position:fixed; inset:0; z-index:60; background:rgba(5,10,8,.72); display:flex; align-items:flex-start; justify-content:center; padding:20px;";
  backdrop.innerHTML = `
    <div class="card" style="position:relative; width:100%; max-width:420px; max-height:80vh; overflow-y:auto; margin:0;">
      <button aria-label="Close" id="artistTimelineSearchCloseBtn" style="position:absolute; top:10px; right:10px; background:none; border:1px solid var(--line); color:var(--text-primary); border-radius:10px; width:32px; height:32px; font-size:16px; line-height:1; cursor:pointer;">✕</button>
      <h3>Find on the timeline</h3>
      <div class="field"><input type="text" id="artistTimelineSearchInput" placeholder="Name, stage or genre" value="${escapeHtml(artistSearch.value)}"></div>
      <div id="artistTimelineSearchResults" style="margin-top:10px;"></div>
    </div>
  `;
  backdrop.onclick = (e)=>{ if(e.target === backdrop) closeArtistTimelineSearch(); };
  document.body.appendChild(backdrop);
  backdrop.querySelector("#artistTimelineSearchCloseBtn").onclick = closeArtistTimelineSearch;
  const input = backdrop.querySelector("#artistTimelineSearchInput");
  const resultsBox = backdrop.querySelector("#artistTimelineSearchResults");
  let currentMatches = [];
  const renderResults = ()=>{
    artistSearch.value = input.value;
    updateClearArtistSearchBtn();
    currentMatches = hasActiveArtistFilters() ? currentFilteredArtists().slice(0, 40) : [];
    resultsBox.innerHTML = currentMatches.length
      ? currentMatches.map((a, i)=> `<div class="chat-thread-row" data-i="${i}" style="cursor:pointer;"><div style="flex:1; min-width:0;"><div><strong>${escapeHtml(a.name)}</strong></div><div class="chat-thread-sub">${escapeHtml(a.stage)} · ${escapeHtml(a.day || "TBC")}${a.start ? " · " + escapeHtml(a.start) : ""}</div></div></div>`).join("")
      : `<p class="empty-note">${input.value.trim() ? "No matches." : "Start typing a name, stage or genre."}</p>`;
    resultsBox.querySelectorAll("[data-i]").forEach(row=>{
      row.onclick = ()=>{
        const artist = currentMatches[Number(row.dataset.i)];
        closeArtistTimelineSearch();
        if(artist) jumpToArtistInTimeline(artist);
      };
    });
  };
  input.oninput = renderResults;
  renderResults();
  input.focus();
}
const artistTimelineSearchBtn = document.getElementById("artistTimelineSearchBtn");
if(artistTimelineSearchBtn) artistTimelineSearchBtn.onclick = openArtistTimelineSearch;

// Collapsed to a handful of rows by default — the full genre list runs
// to dozens of chips, which used to push the actual artist list well
// below the fold on every visit. "See more" reveals the rest; any
// already-selected genre outside the collapsed set still counts (it's
// just not shown as a chip) until you expand and can see/toggle it.
const GENRE_CHIPS_COLLAPSED_COUNT = 10;
let genreChipsExpanded = false;

function loadGenreChips(){
  const genres = [...new Set(allArtists().map(genreOf))].filter(g=>g && g !== "Unconfirmed").sort();
  const box = document.getElementById("genreChips");
  const showAll = genreChipsExpanded || genres.length <= GENRE_CHIPS_COLLAPSED_COUNT;
  const visible = showAll ? genres : genres.slice(0, GENRE_CHIPS_COLLAPSED_COUNT);
  const hiddenCount = genres.length - visible.length;
  box.innerHTML = visible.map(g=>`<span class="chip" data-g="${g}">${g}</span>`).join("")
    + (hiddenCount > 0 ? `<span class="chip" id="genreChipsToggle" style="border-style:dashed;">See more (+${hiddenCount}) ▾</span>` : "")
    + (showAll && genres.length > GENRE_CHIPS_COLLAPSED_COUNT ? `<span class="chip" id="genreChipsToggle" style="border-style:dashed;">See less ▴</span>` : "");
  updateGenreChipHighlights();
  box.querySelectorAll(".chip[data-g]").forEach(s=>{
    s.onclick = ()=>{
      toggleGenreChip(s.dataset.g);
      updateGenreChipHighlights();
      updateClearArtistSearchBtn();
      renderArtistSearchResults();
    };
  });
  const toggleBtn = document.getElementById("genreChipsToggle");
  if(toggleBtn) toggleBtn.onclick = ()=>{ genreChipsExpanded = !genreChipsExpanded; loadGenreChips(); };
}
loadGenreChips();
loadDayChips();

// ===============================
// ADD YOUR OWN ARTIST
// ===============================
document.getElementById("addArtistBtn").onclick = ()=>{
  const name = document.getElementById("newArtistName").value.trim();
  const stage = document.getElementById("newArtistStage").value.trim() || "Check app";
  const genre = document.getElementById("newArtistGenre").value.trim() || "Unknown";
  if(!name) return;

  const custom = Store.get("customArtists");
  custom.push({ name, stage, genre, day:"TBC", start:null, end:null });
  Store.set("customArtists", custom);

  document.getElementById("newArtistName").value = "";
  document.getElementById("newArtistStage").value = "";
  document.getElementById("newArtistGenre").value = "";

  showArtists(currentFilteredArtists());
  loadGenreChips();
};

// Same composer, same experience, whichever tab it's opened from — see
// openActivityComposer() in the PERSONAL & GROUP ACTIVITIES section
// further down (a hoisted function declaration, so referencing it here
// ahead of its own declaration is safe; it's never actually called until
// one of these buttons is tapped, long after the whole script has run).
const lineupAddActivityBtn = document.getElementById("lineupAddActivityBtn");
if(lineupAddActivityBtn) lineupAddActivityBtn.onclick = ()=> openActivityComposer();
const planAddActivityBtn = document.getElementById("planAddActivityBtn");
if(planAddActivityBtn) planAddActivityBtn.onclick = ()=> openActivityComposer();

// ===============================
// PERSONAL SCHEDULE
// ===============================
const scheduleList = document.getElementById("scheduleList");
let planView = "list";
let planMustSeeFilter = false;
let clashSubView = "list";
let clashTimelineDay = "Wed";

// Plan list day chips — same multi-select, AND-combined chip basis as the
// Lineup search's day chips (selectedDays/loadDayChips above), applied to
// the flat List view, the Clashes > List sub-view, and Compare. Deliberately
// NOT added to the Plan Timeline or Clash Timeline views — those already
// have their own single-day tab selector (planTimelineDay/clashTimelineDay),
// a one-day-at-a-time UI that a multi-select chip set would just conflict
// with. renderSchedule() runs at load time (bottom of this file), so this
// Set has to be declared up here, above that call, per the TDZ rule.
let selectedPlanDays = new Set();

function togglePlanDayChip(d){
  if(selectedPlanDays.has(d)) selectedPlanDays.delete(d); else selectedPlanDays.add(d);
}

function updatePlanDayChipHighlights(){
  document.querySelectorAll("#planDayChips .chip").forEach(c=> c.classList.toggle("active", selectedPlanDays.has(c.dataset.d)));
}

function loadPlanDayChips(){
  const box = document.getElementById("planDayChips");
  if(!box) return;
  box.innerHTML = DAY_ORDER.map(d=>`<span class="chip" data-d="${d}">${d}</span>`).join("");
  updatePlanDayChipHighlights();
  box.querySelectorAll(".chip[data-d]").forEach(s=>{
    s.onclick = ()=>{
      togglePlanDayChip(s.dataset.d);
      updatePlanDayChipHighlights();
      if(planView === "compare") renderPlanCompare();
      else renderSchedule();
    };
  });
}

function saveArtist(artist){
  let schedule = Store.get("schedule");
  const exists = schedule.find(x=>x.name === artist.name);
  if(exists){
    schedule = schedule.filter(x=>x.name !== artist.name);
  } else {
    schedule.push({ ...artist });
  }
  Store.set("schedule", schedule);
  refreshAfterStarChange();
}

// ===============================
// MUST-SEE — a second tier above a plain star. A plain star (saved to
// plan) shows light blue; holding it down upgrades that act to
// must-see, which takes over the amber that used to just mean "any
// saved star" everywhere a star appears (list, timeline modal, timeline
// blocks). Holding an act that isn't saved yet saves it as a must-see
// directly, in one motion, rather than requiring a tap-then-hold.
// ===============================
function isMustSee(name){
  const entry = Store.get("schedule").find(x=>x.name === name);
  return !!(entry && entry.mustSee);
}

function setMustSee(artist, value){
  let schedule = Store.get("schedule");
  const idx = schedule.findIndex(x=>x.name === artist.name);
  if(idx === -1){
    schedule.push({ ...artist, mustSee: value });
  } else {
    schedule[idx] = { ...schedule[idx], mustSee: value };
  }
  Store.set("schedule", schedule);
  refreshAfterStarChange();
}

function refreshAfterStarChange(){
  renderSchedule();
  showArtists(currentFilteredArtists());
  updateNextEvent();
  if(typeof renderArtistsTimeline === "function" && artistsView === "timeline") renderArtistsTimeline();
  if(typeof renderPlanTimeline === "function" && planView === "timeline") renderPlanTimeline();
  if(typeof renderClashTimeline === "function" && planView === "clash" && clashSubView === "timeline") renderClashTimeline();
}

// ===============================
// SEEN LIVE — a separate tick confirming you actually caught this act
// in person at the festival, distinct from starring/must-see (which is
// about planning ahead of time, not what actually happened). Purely
// personal — never part of the group sync payload, same as
// personalClashChoices — so it never shows on a teammate's read-only tab.
// ===============================
function isSeen(name){
  return (Store.get("seenArtists") || []).some(x=>x.name === name);
}

function setSeen(artist, value){
  let seen = Store.get("seenArtists") || [];
  if(value){
    if(!seen.some(x=>x.name === artist.name)){
      seen = [...seen, { name: artist.name, stage: artist.stage, day: artist.day, start: artist.start, end: artist.end, seenAt: Date.now() }];
    }
  } else {
    seen = seen.filter(x=>x.name !== artist.name);
  }
  Store.set("seenArtists", seen);
  refreshAfterSeenChange();
}

function refreshAfterSeenChange(){
  showArtists(currentFilteredArtists());
  renderSchedule();
  if(typeof renderArtistsTimeline === "function" && artistsView === "timeline") renderArtistsTimeline();
  if(typeof renderPlanTimeline === "function" && planView === "timeline") renderPlanTimeline();
  if(typeof renderClashTimeline === "function" && planView === "clash" && clashSubView === "timeline") renderClashTimeline();
  if(typeof renderSeenList === "function" && planView === "seen") renderSeenList();
}

function wireSeenButton(btn, artist){
  if(!btn) return;
  btn.onclick = (e)=>{
    e.stopPropagation();
    setSeen(artist, !isSeen(artist.name));
  };
}

function showStarHint(btn){
  document.querySelectorAll(".star-hint-bubble").forEach(b=> b.remove());
  const bubble = document.createElement("div");
  bubble.className = "star-hint-bubble";
  bubble.textContent = "Hold ★ to make it a must-see";
  document.body.appendChild(bubble);
  const rect = btn.getBoundingClientRect();
  const bubbleWidth = 190;
  bubble.style.left = Math.min(window.innerWidth - bubbleWidth - 8, Math.max(8, rect.left + rect.width/2 - bubbleWidth/2)) + "px";
  bubble.style.top = Math.max(8, rect.top - 34) + "px";
  requestAnimationFrame(()=> bubble.classList.add("show"));
  setTimeout(()=>{
    bubble.classList.remove("show");
    setTimeout(()=> bubble.remove(), 250);
  }, 2200);
}

// Shared long-press wiring for every star button (Lineup list, timeline
// detail modal). A short tap toggles saved on/off as before; holding it
// past STAR_HOLD_MS toggles must-see instead, and suppresses the
// tap-toggle that would otherwise also fire when the finger lifts.
const STAR_HOLD_MS = 550;
function wireStarButton(btn, artist, onChange){
  let holdTimer = null, held = false, startX = 0, startY = 0;

  function clearHold(){
    if(holdTimer){ clearTimeout(holdTimer); holdTimer = null; }
  }

  btn.addEventListener("pointerdown", (e)=>{
    // Stops a sustained touch-hold from being read as "select this text"
    // or popping the copy/select callout — CSS user-select/touch-callout
    // covers most browsers, this catches the rest.
    if(e.pointerType === "touch") e.preventDefault();
    held = false;
    startX = e.clientX; startY = e.clientY;
    clearHold();
    holdTimer = setTimeout(()=>{
      held = true;
      setMustSee(artist, !isMustSee(artist.name));
      if(navigator.vibrate) navigator.vibrate(15);
      if(onChange) onChange();
    }, STAR_HOLD_MS);
  });
  btn.addEventListener("pointermove", (e)=>{
    if(!holdTimer) return;
    if(Math.abs(e.clientX - startX) > 8 || Math.abs(e.clientY - startY) > 8) clearHold();
  });
  btn.addEventListener("pointerup", clearHold);
  btn.addEventListener("pointercancel", clearHold);
  btn.addEventListener("pointerleave", clearHold);

  btn.addEventListener("click", (e)=>{
    if(held){ held = false; e.preventDefault(); e.stopPropagation(); return; }
    const wasSaved = Store.get("schedule").some(x=>x.name === artist.name);
    saveArtist(artist);
    if(!wasSaved) showStarHint(btn);
    if(onChange) onChange();
  });
}

function findClashes(schedule){
  const timed = schedule
    .map((a,i)=>({ ...a, i, startMin: toMinutes(a.day, a.start), endMin: toMinutes(a.day, a.end) }))
    .filter(a=> a.startMin !== null && a.endMin !== null);

  timed.forEach(a=>{ if(a.endMin <= a.startMin) a.endMin += 1440; });

  const clashMap = {};
  for(let i=0;i<timed.length;i++){
    for(let j=i+1;j<timed.length;j++){
      const A = timed[i], B = timed[j];
      if(A.startMin < B.endMin && B.startMin < A.endMin){
        (clashMap[A.i] = clashMap[A.i] || []).push({ name:B.name, stage:B.stage });
        (clashMap[B.i] = clashMap[B.i] || []).push({ name:A.name, stage:A.stage });
      }
    }
  }
  return clashMap;
}

// A personal clash's own resolution (which one to actually go to, or
// catch half of each) is purely local — it's this one person's call
// about their own schedule, not something the group weighs in on.
// Keyed on day+artist-pair, same stable-identity approach as a group
// invite key, so it survives reorders.
function personalClashChoiceKey(day, nameA, nameB){
  return `${day}|${[nameA, nameB].sort().join("__")}`;
}
function getPersonalClashChoice(day, nameA, nameB){
  const choices = Store.get("personalClashChoices") || {};
  return choices[personalClashChoiceKey(day, nameA, nameB)] || null;
}
function setPersonalClashChoice(day, nameA, nameB, choice){
  const key = personalClashChoiceKey(day, nameA, nameB);
  const choices = Store.get("personalClashChoices") || {};
  if(choice) choices[key] = choice; else delete choices[key];
  Store.set("personalClashChoices", choices);
}

// Your own actual intended timings for a "custom"-resolved clash pair —
// replaces the old forced half-and-half split (always exactly 50/50,
// with no way to say "actually I want 20 minutes of one and the rest of
// the other"). Purely local, same day+sorted-names key as the choice
// itself above, never synced (see PERSONAL_ONLY_KEYS), never shown on
// anyone else's device or read-only tab — only ever reflected in your
// own Plan (List, Timeline, Clashes).
function getPersonalClashTimes(day, nameA, nameB){
  const times = Store.get("personalClashTimes") || {};
  return times[personalClashChoiceKey(day, nameA, nameB)] || null;
}
function setPersonalClashTimes(day, nameA, nameB, timesByName){
  const key = personalClashChoiceKey(day, nameA, nameB);
  const times = Store.get("personalClashTimes") || {};
  if(timesByName) times[key] = timesByName; else delete times[key];
  Store.set("personalClashTimes", times);
}

// Given one saved artist and the ONE other act it clashes with, returns
// the time that should actually be SHOWN for it in your Plan — your own
// custom-time override if this pair is "custom"-resolved and a time was
// actually saved for this act, otherwise its real, unmodified time.
// Used everywhere a saved pick's time is displayed (List, Timeline,
// Clash views) — never on the Lineup tab's own browsing, which always
// shows the real official time, since that's shared festival data, not
// a personal adjustment.
function effectiveArtistTime(artist, otherName){
  if(!otherName) return { start: artist.start, end: artist.end, overridden: false };
  const choice = getPersonalClashChoice(artist.day, artist.name, otherName);
  if(choice !== "custom") return { start: artist.start, end: artist.end, overridden: false };
  const times = getPersonalClashTimes(artist.day, artist.name, otherName);
  const mine = times && times[artist.name];
  if(!mine || !mine.start) return { start: artist.start, end: artist.end, overridden: false };
  return { start: mine.start, end: mine.end || mine.start, overridden: true };
}

function closeCustomClashTimeModal(){
  const existing = document.getElementById("customClashTimeModal");
  if(existing) existing.remove();
}

// Asked whenever "pick my own times" is chosen for a clashing pair —
// two independent start/end pickers, one per act, prefilled with each
// act's own real time as a sensible starting point (most people just
// trim one end and leave the other), not forced into a 50/50 split or
// any particular order. onSave(timesByName|null) — null if cancelled.
function showCustomClashTimeModal(day, a, b, onSave){
  closeCustomClashTimeModal();
  const backdrop = document.createElement("div");
  backdrop.id = "customClashTimeModal";
  backdrop.style.cssText = "position:fixed; inset:0; z-index:65; background:rgba(5,10,8,.72); display:flex; align-items:center; justify-content:center; padding:20px;";
  const fieldsFor = (artist, prefix)=> `
    <strong>${escapeHtml(artist.name)}</strong><br>
    <span style="font-size:12px; color:var(--text-muted);">${escapeHtml(artist.stage)} · real time ${escapeHtml(timeLabel(artist))}</span>
    <div class="time-row" style="margin-top:6px;">
      <div class="field"><label>Start</label><input type="time" id="${prefix}Start" value="${escapeHtml(artist.start||"")}"></div>
      <div class="field"><label>End</label><input type="time" id="${prefix}End" value="${escapeHtml(artist.end||"")}"></div>
    </div>`;
  backdrop.innerHTML = `
    <div class="card" style="position:relative; width:100%; max-width:400px; max-height:85vh; overflow-y:auto; overflow-x:hidden; margin:0;">
      <h3 style="margin-bottom:6px;">Your actual plan for this clash</h3>
      <p class="empty-note" style="margin-bottom:10px;">Set exactly when you'll catch each one — just for your own Plan, doesn't change what anyone else sees, and you can change it any time.</p>
      <div style="margin-bottom:14px;">${fieldsFor(a, "clashTimeA")}</div>
      <div style="margin-bottom:14px;">${fieldsFor(b, "clashTimeB")}</div>
      <button class="action" id="customClashTimeSaveBtn">Save my times</button>
      <button class="ghost" id="customClashTimeCancelBtn" style="margin-top:8px;">Cancel</button>
    </div>
  `;
  backdrop.onclick = (e)=>{ if(e.target === backdrop) closeCustomClashTimeModal(); };
  document.body.appendChild(backdrop);
  backdrop.querySelector("#customClashTimeCancelBtn").onclick = ()=>{ onSave(null); closeCustomClashTimeModal(); };
  backdrop.querySelector("#customClashTimeSaveBtn").onclick = ()=>{
    const aStart = backdrop.querySelector("#clashTimeAStart").value || a.start;
    const aEnd = backdrop.querySelector("#clashTimeAEnd").value || a.end;
    const bStart = backdrop.querySelector("#clashTimeBStart").value || b.start;
    const bEnd = backdrop.querySelector("#clashTimeBEnd").value || b.end;
    onSave({ [a.name]: { start: aStart, end: aEnd }, [b.name]: { start: bStart, end: bEnd } });
    closeCustomClashTimeModal();
  };
}

function scheduleItemHTML(artist, idx, clashes, readonly, mustSeeNamesSet, owners){
  const clashClass = clashes && clashes.length ? " clash" : "";
  const mustSee = !!artist.mustSee;
  const seen = isSeen(artist.name);
  const genre = genreOf(artist);
  const bioBlock = artistBioBlockHtml(artist);
  const mustSeeSet = mustSeeNamesSet || new Set();
  const clashLines = (clashes || []).map(c=>{
    const otherMustSee = mustSeeSet.has(c.name);
    return `<div>⚠ Clashes with <strong>${escapeHtml(c.name)}</strong>${otherMustSee ? ` <span class="mustsee-tag">★ must-see</span>` : ""} at <span class="stage-link" data-stage="${escapeHtml(c.stage)}">${escapeHtml(c.stage)}</span></div>`;
  }).join("");
  // Only offered for a simple one-other-clash case — a 3+-way personal
  // clash still shows the warning text above, just without action
  // buttons, rather than trying to squeeze an n-way picker in here.
  let choiceHTML = "";
  let effectiveTime = { start: artist.start, end: artist.end, overridden: false };
  if(clashes && clashes.length === 1){
    effectiveTime = effectiveArtistTime(artist, clashes[0].name);
  }
  if(!readonly && clashes && clashes.length === 1){
    const other = clashes[0];
    const choice = getPersonalClashChoice(artist.day, artist.name, other.name);
    const shortMine = escapeHtml(truncateName(artist.name, 14));
    const shortOther = escapeHtml(truncateName(other.name, 14));
    // "I'll go" + 🙋 (solo) rather than reusing the group card's "Together"
    // + 👥 wording — the two cards sit right next to each other when a
    // clash is both personal and group, and near-identical labels are
    // exactly what made it unclear which one only affects your own plan.
    choiceHTML = `
      <div class="decision-actions personal-clash-actions">
        <button data-clash-choice="a" title="Only updates your own plan — tap again to clear" class="${choice==="a" ? "active" : ""}">🙋 I'll go<br><strong>${shortMine}</strong></button>
        <button data-clash-choice="b" title="Only updates your own plan — tap again to clear" class="${choice==="b" ? "active" : ""}">🙋 I'll go<br><strong>${shortOther}</strong></button>
        <button data-clash-choice="custom" title="Only updates your own plan — tap again to clear" class="${choice==="custom" ? "active" : ""}">⏱ Pick my<br><span>own times</span></button>
      </div>
      <p class="empty-note personal-clash-scope-note">Just for your own plan — teammates won't see this pick.</p>
      ${effectiveTime.overridden ? `<p class="empty-note" style="margin-top:2px;">Your plan: <strong>${escapeHtml(timeLabel({ ...artist, ...effectiveTime }))}</strong> (real time ${escapeHtml(timeLabel(artist))})</p>` : ""}`;
  }
  return `
    <div class="item${clashClass}${mustSee ? " mustsee" : ""}" data-idx="${idx}">
      <div class="item-top">
        <div>
          <strong>${artist.name}</strong>${mustSee ? ` <span class="mustsee-tag">★ must-see</span>` : ""}${seen ? ` <span class="mustsee-tag" style="background:rgba(75,227,172,.16); color:var(--accent-teal);">✓ seen live</span>` : ""}<br>
          <span class="stage-link" data-stage="${escapeHtml(artist.stage)}">${artist.stage}</span><br>
          <span class="time-label">${timeLabel(effectiveTime.overridden ? { ...artist, ...effectiveTime } : artist)}${effectiveTime.overridden ? ` <span class="mustsee-tag" style="background:rgba(47,155,255,.16); color:var(--accent-lightblue);">your plan</span>` : ""}</span>${owners && owners.length > 1 ? ` <span class="tb-owners-inline">· ${escapeHtml(owners.join(", "))}</span>` : ""}
          <div class="artist-descriptor">${escapeHtml(artistDescriptor(artist))}</div>
          ${bioBlock}
          ${otherSetsHTML(artist)}
        </div>
        <div class="btnrow plan-btnrow">
          ${readonly ? "" : `<button class="star-btn${mustSee ? " mustsee" : ""} mustsee-toggle-btn" aria-label="Toggle must-see" title="Must-see">${mustSee ? "★" : "☆"}</button>`}
          <button class="seen-btn${seen ? " seen" : ""}" aria-label="${seen ? "You saw this live — tap to undo" : "Tick once you've actually seen this live at the festival"}" title="${seen ? "You saw this live — tap to undo" : "Confirm: I saw this live at the festival"}">✓</button>
          ${readonly ? "" : inviteHeartBtnHTML(artist)}
          ${readonly ? "" : `<button class="set-time-btn" aria-label="Set a custom time for this artist" title="Set a custom time">🕐</button>`}
        </div>
      </div>
      ${clashLines ? `<div class="clash-note">${clashLines}${choiceHTML}</div>` : ""}
      <div class="edit-slot"></div>
    </div>
  `;
}

function openTimeEditor(container, artist, onSave){
  container.innerHTML = `
    <div class="field">
      <label>Day</label>
      <select class="edit-day">
        <option value="TBC">TBC</option>
        ${DAY_ORDER.map(d=>`<option value="${d}" ${artist.day===d?"selected":""}>${d}</option>`).join("")}
      </select>
    </div>
    <div class="time-row">
      <div class="field"><label>Start</label><input type="time" class="edit-start" value="${artist.start||""}"></div>
      <div class="field"><label>End</label><input type="time" class="edit-end" value="${artist.end||""}"></div>
    </div>
    <label class="official-time-check">
      <input type="checkbox" class="edit-official">
      <span>This is an official change (Boomtown announced a new/shorter time) — share the correction with everyone, not just your own plan</span>
    </label>
    <button class="action save-time-btn">Save time</button>
  `;
  container.querySelector(".save-time-btn").onclick = ()=>{
    const day = container.querySelector(".edit-day").value;
    const start = container.querySelector(".edit-start").value || null;
    const end = container.querySelector(".edit-end").value || null;
    const official = container.querySelector(".edit-official").checked;
    onSave(day, start, end, official);
    container.innerHTML = "";
  };
}

// An official correction is a shared overlay applied on top of the
// static `artists` lineup data by allArtists() (see there for why it
// can't literally rewrite that const array) — synced the same additive,
// key+updatedAt-wins way as customPlaces, so a genuine correction
// reaches everyone, but a stale copy of one can never clobber a fresher
// one. Keyed "day|name" — see allArtists()'s own comment for the
// same-name-twice-in-one-day edge case this doesn't handle.
function applyOfficialTimeCorrection(day, name, start, end){
  if(!day || day === "TBC" || !name) return;
  const corrections = Store.get("officialTimeCorrections") || {};
  corrections[`${day}|${name}`] = { start, end, by: currentContributorName() || "Someone", updatedAt: Date.now() };
  Store.set("officialTimeCorrections", corrections);
}

// ===============================
// PLAN — WHOSE SCHEDULE AM I LOOKING AT
// ===============================
// One shared multi-select — List, Clashes, Timeline and Compare all read
// from this same selection instead of each keeping its own person-picker.
// "mine" is always this device's own Store.get("schedule") — the only
// one that's ever editable, saved to, or counted in stats/next-event.
// Anything else is a name key into peopleSchedules, a read-only snapshot
// that arrived via a teammate's Sync code. Selecting more than one merges
// their picks into a single read-only combined view (same pick from two
// people collapses into one entry tagged with both) rather than showing
// one person's list at a time.
let planSelectedOwners = new Set(["mine"]);

// The set of owner keys actually in play right now — prunes any stale
// selection (a teammate who's since stopped showing up in peopleSchedules)
// and always falls back to ["mine"] rather than leaving the view empty.
function activeOwnersList(){
  const peopleByKey = new Map(comparePeopleList().map(p=>[p.key,p]));
  const owners = [...planSelectedOwners].filter(k=> peopleByKey.has(k));
  return owners.length ? owners : ["mine"];
}

// Shared by every per-person snapshot map (peopleSchedules/peopleBingo/
// peopleCharacters/peopleLastSeen) — all keyed by stable personId now,
// each entry carrying its own displayName. Also tolerates a device's
// pre-existing local data in the old flat shape (array for schedule,
// raw timestamp for lastSeen) so nothing crashes on data written before
// this change; the next real sync naturally replaces it with the
// current shape.
function personSnapshotList(entry){
  return Array.isArray(entry) ? entry : (entry && entry.list) || [];
}
function personDisplayName(entry, fallbackId){
  return (entry && entry.displayName) || fallbackId;
}
function personLastSeenTs(entry){
  return (entry && typeof entry === "object") ? entry.ts : entry;
}

// Merges every selected owner's picks into one array. A single owner of
// "mine" returns the live Store.get("schedule") reference (unwrapped) so
// existing index-based edit/remove/set-time code keeps working exactly as
// before; any other selection (a single teammate, or several people at
// once) is always read-only, and 2+ owners get deduped by identical pick
// (same name+day+stage+start) into one entry tagged with everyone who
// chose it via `_owners`.
function activeScheduleData(){
  const owners = activeOwnersList();
  if(owners.length === 1 && owners[0] === "mine") return Store.get("schedule");

  const peopleByKey = new Map(comparePeopleList().map(p=>[p.key,p]));
  const merged = new Map();
  owners.forEach(ownerKey=>{
    const person = peopleByKey.get(ownerKey);
    if(!person) return;
    person.list.forEach(a=>{
      const key = `${a.name}|${a.day}|${a.stage}|${a.start}`;
      if(!merged.has(key)) merged.set(key, { ...a, _owners: [] });
      merged.get(key)._owners.push(person.label);
    });
  });
  return [...merged.values()];
}

// Re-renders whichever Plan sub-view is currently showing — called
// whenever the shared owner selector changes, since List/Clashes/
// Timeline/Compare each read from the same selection now.
function rerenderActivePlanView(){
  if(planView === "timeline"){
    renderPlanTimeline();
  } else if(planView === "compare"){
    renderCompareFilterChips();
    renderPlanCompare();
    if(typeof renderBigPictureSummary === "function") renderBigPictureSummary("compareBigPicture");
    if(typeof renderGroupInvites === "function") renderGroupInvites();
  } else if(planView === "clash"){
    updateClashSubViewVisibility();
  } else {
    renderSchedule();
  }
}

function renderPlanOwnerSelector(){
  const box = document.getElementById("planPersonTabs");
  const note = document.getElementById("planPersonNote");
  if(!box) return;
  const people = comparePeopleList(); // [{key:"mine",label,list}, ...synced teammates]

  // Drop any selected teammate who's since disappeared from
  // peopleSchedules (nothing saved, or never actually synced) rather than
  // leaving a selection pointed at someone who's about to stop existing.
  [...planSelectedOwners].forEach(k=>{ if(!people.some(p=>p.key===k)) planSelectedOwners.delete(k); });
  if(planSelectedOwners.size === 0) planSelectedOwners.add("mine");

  // Your own chip is always shown, even with zero friends synced in yet —
  // labelled with your own picked name (matching what a friend would see
  // for you on their device) once you've set one, "Mine" until then.
  const myName = (Store.get("contributorName") || "").trim();
  const myLabel = myName ? `⭐ ${myName}` : "⭐ Mine";

  box.style.display = "";
  box.className = "stagelist";
  box.innerHTML = people.map(p=>{
    const label = p.key === "mine" ? myLabel : escapeHtml(p.label);
    return `<span class="chip${planSelectedOwners.has(p.key) ? " active" : ""}" data-owner="${escapeHtml(p.key)}">${label}</span>`;
  }).join("");
  box.querySelectorAll(".chip").forEach(c=>{
    c.onclick = ()=>{
      const key = c.dataset.owner;
      if(planSelectedOwners.has(key)){
        // Always leave at least one person selected — an empty view
        // isn't a useful state to land in from a tap.
        if(planSelectedOwners.size > 1) planSelectedOwners.delete(key);
      } else {
        planSelectedOwners.add(key);
      }
      renderPlanOwnerSelector();
      rerenderActivePlanView();
    };
  });

  if(!note) return;
  const owners = activeOwnersList();
  if(people.length < 2){
    note.style.display = "";
    note.textContent = "Nobody's synced in yet — a teammate's picks will show up as another chip here once they have. Pick your name in Settings if you haven't already, and it syncs automatically whenever you've both got signal; no signal, there's a manual backup code there too.";
  } else if(owners.length === 1 && owners[0] !== "mine"){
    // "Merge into mine" exists for exactly the situation this session
    // has hit more than once: a device losing track of its own
    // deviceId (reinstall, cleared storage, ...) ends up as a second,
    // empty chip under the same name as a teammate's real synced data —
    // this is the (safe, additive, undoable-by-just-not-syncing-yet)
    // way to reclaim it as "you" without a destructive device-handoff
    // wipe-and-replace.
    const personId = owners[0];
    const peopleSchedules = Store.get("peopleSchedules") || {};
    const activeEntry = peopleSchedules[personId];
    const activeLabel = personDisplayName(activeEntry, personId);
    const lastSeenEntry = (Store.get("peopleLastSeen") || {})[personId];
    const lastSeenTs = personLastSeenTs(lastSeenEntry);
    const seenText = lastSeenTs ? ` (last synced ${formatLastSeen(lastSeenTs)})` : "";
    note.style.display = "";
    note.innerHTML = `Viewing ${escapeHtml(activeLabel)}'s saved artists from their last sync${seenText} — read-only, and it hasn't changed or added anything to your own list. <a class="inline-link" href="javascript:void(0)" id="mergePersonIntoMineLink">Is this actually you? Merge their picks into mine →</a>`;
    const mergeLink = document.getElementById("mergePersonIntoMineLink");
    if(mergeLink) mergeLink.onclick = ()=>{
      const ok = confirm(`Merge ${activeLabel}'s saved artists, bingo squares and character into your own?\n\nThis only adds — it never removes or overwrites anything already on this device. ${activeLabel}'s separate chip disappears afterwards since it's now part of yours.`);
      if(!ok) return;
      const added = mergePersonIntoMine(personId);
      note.textContent = added ? `Merged in — ${added} thing${added===1?"":"s"} added to your own picks.` : "Nothing new to merge in.";
      renderPlanOwnerSelector();
      rerenderActivePlanView();
    };
  } else {
    note.style.display = "none";
  }
}

// See renderPlanOwnerSelector's "Merge into mine" link above for why this
// exists. Reuses mergeOwnCloudCopy's additive-only logic (new saved
// artists unioned by name, bingo-marked squares unioned, character only
// fills in if you don't have one) — same safety guarantees as merging
// in a borrowed phone's newer picks, just from a local person-tab
// instead of a Firestore fetch. Also used automatically by
// setContributorName() below when picking a name that already has
// synced-but-unclaimed data sitting in peopleSchedules/peopleBingo/
// peopleCharacters, so this class of duplicate never has to be found
// and fixed by hand again.
function mergePersonIntoMine(personId){
  const peopleSchedules = Store.get("peopleSchedules") || {};
  const peopleBingo = Store.get("peopleBingo") || {};
  const peopleCharacters = Store.get("peopleCharacters") || {};
  const peopleActivities = Store.get("peopleActivities") || {};
  const peopleJoins = Store.get("peopleJoins") || {};
  const peopleWantTogether = Store.get("peopleWantTogether") || {};
  const payload = {
    schedule: personSnapshotList(peopleSchedules[personId]),
    bingo: peopleBingo[personId] || null,
    character: peopleCharacters[personId] || null,
    activities: personSnapshotList(peopleActivities[personId]),
    joinedActivities: personSnapshotList(peopleJoins[personId]),
    wantTogether: personSnapshotList(peopleWantTogether[personId])
  };
  const changed = mergeOwnCloudCopy(payload);

  // Retire the now-absorbed duplicate so it stops showing as a separate
  // "read-only teammate" version of yourself.
  ["peopleSchedules","peopleBingo","peopleCharacters","peopleLastSeen","peopleStatus","peopleActivities","peopleJoins","peopleWantTogether"].forEach(key=>{
    const map = Store.get(key) || {};
    if(map[personId]){ delete map[personId]; Store.set(key, map); }
  });

  if(planSelectedOwners.has(personId)){ planSelectedOwners.delete(personId); planSelectedOwners.add("mine"); }
  refreshAfterMerge();
  if(typeof renderPlanOwnerSelector === "function") renderPlanOwnerSelector();
  if(typeof pushToCloud === "function") pushToCloud().catch(()=>{});
  // Without this, the duplicate keeps coming back: the merge above only
  // clears this device's own LOCAL copy of the duplicate's data, but the
  // duplicate's own doc is still sitting in Firestore under its own old
  // deviceId — the very next pull (autoSyncNow runs every 3 minutes) would
  // fetch it again and repopulate peopleSchedules/etc. right back. Deleting
  // the stale doc (and any backup snapshots under it) is what actually
  // makes the merge stick.
  if(typeof deleteStaleRoomMember === "function") deleteStaleRoomMember(personId).catch(err=>{
    console.warn("Deleting merged-in duplicate's cloud doc failed (non-fatal — it may just come back on next sync):", err);
  });
  return changed;
}

// See mergePersonIntoMine's comment above for why this exists. Best-effort:
// a failure here (offline, etc.) leaves the stale doc in place to be
// cleaned up on some future successful attempt — it never undoes the local
// merge that's already happened.
async function deleteStaleRoomMember(personId){
  const db = getFirestoreDb();
  const room = currentRoomCode();
  if(!db || !room || !personId) return;
  const memberRef = db.collection("rooms").doc(room).collection("members").doc(personId);
  const backups = await memberRef.collection("backups").get();
  await Promise.all(backups.docs.map(d=> d.ref.delete()));
  await memberRef.delete();
}

// "Merge all my duplicate tabs" — finds every person-tab across
// peopleSchedules/peopleBingo/peopleCharacters whose displayName matches
// this device's own current name, and runs mergePersonIntoMine on each
// one. Same safety guarantees as doing it tab-by-tab (additive only,
// each duplicate's stale cloud doc deleted so it can't come back) — this
// is purely a "don't make someone click through them one at a time"
// convenience, not a new merge mechanism.
function mergeAllMyDuplicates(){
  const myName = currentContributorName();
  if(!myName) return { count: 0, changed: 0 };
  const target = myName.trim().toLowerCase();
  const maps = [Store.get("peopleSchedules")||{}, Store.get("peopleBingo")||{}, Store.get("peopleCharacters")||{}];
  const ids = new Set();
  maps.forEach(map=> Object.keys(map).forEach(id=>{
    if(((map[id] && map[id].displayName) || "").trim().toLowerCase() === target) ids.add(id);
  }));
  let changed = 0;
  ids.forEach(id=>{ changed += mergePersonIntoMine(id) || 0; });
  return { count: ids.size, changed };
}
const mergeAllDuplicatesBtn = document.getElementById("mergeAllDuplicatesBtn");
if(mergeAllDuplicatesBtn) mergeAllDuplicatesBtn.onclick = ()=>{
  const note = document.getElementById("mergeAllDuplicatesNote");
  const myName = currentContributorName();
  if(!myName){ if(note) note.textContent = "Pick your name above first."; return; }
  const { count, changed } = mergeAllMyDuplicates();
  if(note) note.textContent = count
    ? `Merged ${count} duplicate tab${count===1?"":"s"} into this device (${changed} thing${changed===1?"":"s"} added). They won't come back.`
    : "No duplicate tabs found under your name.";
};

function renderSchedule(){
  const fullSchedule = activeScheduleData();
  const owners = activeOwnersList();
  const combined = owners.length > 1;
  const readonly = combined || owners[0] !== "mine";

  if(fullSchedule.length === 0){
    const peopleByKey = new Map(comparePeopleList().map(p=>[p.key,p]));
    const ownerLabel = owners.map(k=> (peopleByKey.get(k) || {}).label || k).join(", ");
    scheduleList.innerHTML = `<div class="card"><p class="empty-note">${readonly ? `${escapeHtml(ownerLabel)} hasn't saved any artists yet.` : "No saved artists yet. Add some from the Lineup tab."}</p></div>`;
    return;
  }

  const mustSeeNamesSet = new Set(fullSchedule.filter(a=>a.mustSee).map(a=>a.name));
  // Keep each entry's ORIGINAL index into the full (unfiltered) schedule
  // even when the must-sees-only filter is on — remove/set-time/star
  // wiring below reads .dataset.idx straight into Store.get("schedule"),
  // so a filtered-array position would point at the wrong artist. Only
  // meaningful when !readonly (i.e. owners is exactly ["mine"]), where
  // fullSchedule *is* Store.get("schedule") itself.
  const shown = fullSchedule.map((a,i)=>({a,i})).filter(({a})=>
    (!planMustSeeFilter || a.mustSee) && (selectedPlanDays.size === 0 || selectedPlanDays.has(a.day))
  );

  if(shown.length === 0){
    const dayNote = selectedPlanDays.size ? ` for ${DAY_ORDER.filter(d=>selectedPlanDays.has(d)).join(", ")}` : "";
    const msg = planMustSeeFilter ? `No must-sees${dayNote} — hold a star to upgrade one.` : `Nothing saved${dayNote} yet.`;
    scheduleList.innerHTML = `<div class="card"><p class="empty-note">${msg}</p></div>`;
    return;
  }

  if(planView === "list"){
    scheduleList.innerHTML = shown.map(({a,i})=> scheduleItemHTML(a,i,null,readonly,mustSeeNamesSet,a._owners)).join("");
  } else {
    const clashMap = findClashes(fullSchedule);
    const byDay = {};
    shown.forEach(({a,i})=>{
      const key = a.day && a.day !== "TBC" ? a.day : "No time set";
      (byDay[key] = byDay[key] || []).push({a, i});
    });
    const order = [...DAY_ORDER, "No time set"];
    let html = "";
    order.forEach(day=>{
      if(!byDay[day]) return;
      // toMinutes(), not a raw string compare — a same-day "00:00" set
      // (the tail of that day's overnight programme) must sort AFTER
      // "23:30", not before it as "0..." vs "2..." would alphabetically.
      const items = byDay[day].sort((x,y)=> (toMinutes(x.a.day, x.a.start) ?? 999999) - (toMinutes(y.a.day, y.a.start) ?? 999999));
      html += `<div class="daygroup">${day}</div>`;
      items.forEach(({a,i})=> html += scheduleItemHTML(a,i,clashMap[i],readonly,mustSeeNamesSet,a._owners));
    });
    scheduleList.innerHTML = html;
  }

  // "Seen live" is wired regardless of readonly — it's your own personal
  // attendance log, not an edit to whichever schedule you're currently
  // looking at, so it stays clickable even on a combined/teammate view.
  scheduleList.querySelectorAll(".item").forEach(itemEl=>{
    const idx = Number(itemEl.dataset.idx);
    const artist = fullSchedule[idx];
    if(!artist) return;
    const seenBtn = itemEl.querySelector(".seen-btn");
    if(seenBtn) seenBtn.onclick = ()=> setSeen(artist, !isSeen(artist.name));
    wireOtherSetLinks(itemEl, artist);
  });

  if(!readonly){
    scheduleList.querySelectorAll(".item").forEach(itemEl=>{
      const idx = Number(itemEl.dataset.idx);
      const artist = Store.get("schedule")[idx];

      const mustSeeBtn = itemEl.querySelector(".mustsee-toggle-btn");
      if(mustSeeBtn) mustSeeBtn.onclick = ()=> setMustSee(artist, !isMustSee(artist.name));

      wireInviteHeartBtn(itemEl.querySelector(".invite-heart-btn"), artist);

      itemEl.querySelector(".set-time-btn").onclick = ()=>{
        // Re-tapping the clock icon while the editor's already open for
        // this artist closes it again, instead of just re-rendering the
        // same form on top of itself.
        const slot = itemEl.querySelector(".edit-slot");
        if(slot.innerHTML.trim()){ slot.innerHTML = ""; return; }
        openTimeEditor(slot, artist, (day,start,end,official)=>{
          let sched = Store.get("schedule");
          sched[idx] = { ...sched[idx], day, start, end };
          Store.set("schedule", sched);
          // "Official" means Boomtown itself changed the time, not just
          // a personal clash workaround — see applyOfficialTimeCorrection.
          if(official) applyOfficialTimeCorrection(day, artist.name, start, end);
          renderSchedule();
          updateNextEvent();
        });
      };

      itemEl.querySelectorAll(".personal-clash-actions button").forEach(btn=>{
        btn.onclick = ()=>{
          const clashLine = itemEl.querySelector(".clash-note");
          const otherName = clashLine ? clashLine.querySelector("strong").textContent : null;
          if(!otherName) return;
          const clicked = btn.getAttribute("data-clash-choice");
          const already = getPersonalClashChoice(artist.day, artist.name, otherName);
          if(clicked === "custom" && already !== "custom"){
            // Both sides of a personal clash are things you saved
            // yourself, so the other one's full time/stage is right
            // there in your own schedule — no separate lookup needed.
            const other = Store.get("schedule").find(x=> x.name === otherName && x.day === artist.day) || { name: otherName, stage: "", day: artist.day, start: "", end: "" };
            showCustomClashTimeModal(artist.day, artist, other, (timesByName)=>{
              if(!timesByName) return; // cancelled — leave the previous choice as-is
              setPersonalClashTimes(artist.day, artist.name, otherName, timesByName);
              setPersonalClashChoice(artist.day, artist.name, otherName, "custom");
              renderSchedule();
            });
            return;
          }
          // Tapping the already-active choice clears it — a way to undo
          // without a separate "clear" control.
          const next = already === clicked ? null : clicked;
          setPersonalClashChoice(artist.day, artist.name, otherName, next);
          if(next !== "custom") setPersonalClashTimes(artist.day, artist.name, otherName, null);
          renderSchedule();
        };
      });
    });
  }

  scheduleList.querySelectorAll(".stage-link").forEach(el=>{
    el.onclick = (e)=>{ e.stopPropagation(); jumpToStageDirectory(el.dataset.stage); };
  });

  if(typeof renderNowNext === "function") renderNowNext();
}

// Clash view has its own List/Timeline sub-toggle nested inside it —
// this just flips which of scheduleList vs clashTimelineView shows and
// renders the right one, without touching the outer setPlanView state.
function updateClashSubViewVisibility(){
  const listEls = [scheduleList, document.getElementById("nowNextBanner"), document.getElementById("planDayChips")];
  const clashTimelineEl = document.getElementById("clashTimelineView");
  document.querySelectorAll("#clashSubViewToggle button").forEach(b=>{
    b.classList.toggle("active", b.dataset.sub === clashSubView);
  });
  if(clashSubView === "timeline"){
    listEls.forEach(el=> el && (el.style.display = "none"));
    if(clashTimelineEl) clashTimelineEl.style.display = "";
    renderClashTimelineDayTabs();
    renderClashTimeline();
  } else {
    listEls.forEach(el=> el && (el.style.display = ""));
    if(clashTimelineEl) clashTimelineEl.style.display = "none";
    renderSchedule();
  }
}

function setPlanView(view){
  planView = view;
  if(typeof renderPlanOwnerSelector === "function") renderPlanOwnerSelector();
  ["viewListBtn","viewClashBtn","viewTimelineBtn","viewCompareBtn","viewSeenBtn"].forEach(id=>{
    const btn = document.getElementById(id);
    if(btn) btn.classList.remove("active");
  });
  const activeBtnId = view==="list" ? "viewListBtn" : view==="clash" ? "viewClashBtn" : view==="timeline" ? "viewTimelineBtn" : view==="seen" ? "viewSeenBtn" : "viewCompareBtn";
  const activeBtn = document.getElementById(activeBtnId);
  if(activeBtn) activeBtn.classList.add("active");

  const listEls = [scheduleList, document.getElementById("nowNextBanner")];
  const timelineEl = document.getElementById("planTimelineView");
  const compareEl = document.getElementById("planCompareView");
  const seenEl = document.getElementById("planSeenView");
  const clashTimelineEl = document.getElementById("clashTimelineView");
  const clashExtras = document.getElementById("clashExtras");
  const mustSeeFilterToggle = document.getElementById("mustSeeFilterToggle");
  const starSeenLegend = document.getElementById("planStarSeenLegend");
  const planDayChipsBox = document.getElementById("planDayChips");
  if(clashExtras) clashExtras.style.display = view==="clash" ? "" : "none";
  if(mustSeeFilterToggle) mustSeeFilterToggle.style.display = (view==="compare"||view==="seen") ? "none" : "";
  if(starSeenLegend) starSeenLegend.style.display = (view==="compare"||view==="seen") ? "none" : "";
  if(timelineEl) timelineEl.style.display = view==="timeline" ? "" : "none";
  if(compareEl) compareEl.style.display = view==="compare" ? "" : "none";
  if(seenEl) seenEl.style.display = view==="seen" ? "" : "none";
  if(clashTimelineEl && view!=="clash") clashTimelineEl.style.display = "none";
  listEls.forEach(el=> el && (el.style.display = (view==="list"||(view==="clash"&&clashSubView==="list")) ? "" : "none"));
  // Day chips apply to List, Clashes > List and Compare — everywhere
  // except Seen and the two single-day-tab timeline views (own view here,
  // clash's nested timeline sub-view handled by updateClashSubViewVisibility).
  if(planDayChipsBox) planDayChipsBox.style.display = (view==="seen"||view==="timeline"||(view==="clash"&&clashSubView==="timeline")) ? "none" : "";

  if(view === "timeline"){
    if(typeof renderBigPictureSummary === "function") renderBigPictureSummary("timelineBigPicture");
    // Only jump off the currently selected day if it's genuinely empty —
    // never overrides a day someone's deliberately looking at.
    const current = activeScheduleData();
    if(!current.some(a=> a.day === planTimelineDay && a.start)) planTimelineDay = pickDefaultTimelineDay(current);
    renderPlanTimelineDayTabs();
    renderPlanTimeline();
  } else if(view === "compare"){
    if(typeof renderBigPictureSummary === "function") renderBigPictureSummary("compareBigPicture");
    // Moved here (out of always-visible at the top of every Plan view) so
    // the default List view isn't cluttered by a section that's only
    // actually relevant once you're comparing everyone's picks.
    if(typeof renderGroupInvites === "function") renderGroupInvites();
    renderCompareFilterChips();
    renderPlanCompare();
  } else if(view === "seen"){
    renderSeenList();
  } else if(view === "clash"){
    updateClashSubViewVisibility();
  } else {
    renderSchedule();
  }
}

document.getElementById("viewListBtn").onclick = ()=> setPlanView("list");
document.getElementById("viewClashBtn").onclick = ()=> setPlanView("clash");
document.getElementById("viewTimelineBtn").onclick = ()=> setPlanView("timeline");
const viewSeenBtn = document.getElementById("viewSeenBtn");
if(viewSeenBtn) viewSeenBtn.onclick = ()=> setPlanView("seen");
const viewCompareBtn = document.getElementById("viewCompareBtn");
if(viewCompareBtn) viewCompareBtn.onclick = ()=> setPlanView("compare");

document.querySelectorAll("#mustSeeFilterToggle button").forEach(btn=>{
  btn.onclick = ()=>{
    planMustSeeFilter = btn.dataset.filter === "mustsee";
    document.querySelectorAll("#mustSeeFilterToggle button").forEach(b=> b.classList.toggle("active", b===btn));
    if(planView === "timeline") renderPlanTimeline();
    else if(planView === "clash" && clashSubView === "timeline") renderClashTimeline();
    else renderSchedule();
  };
});

document.querySelectorAll("#clashSubViewToggle button").forEach(btn=>{
  btn.onclick = ()=>{
    clashSubView = btn.dataset.sub;
    updateClashSubViewVisibility();
  };
});

// ===============================
// COMPARE — everyone's picks (mine + every synced teammate's last Sync
// code snapshot) merged side by side, so a group can spot overlaps and
// plan to meet up, without any tab-switching. Purely a read view over
// existing data — it doesn't change what "mine" or the person tabs do
// anywhere else.
// ===============================
function comparePeopleList(){
  // Own label uses your actual picked name (matching buildCombinedArtistInterestMap's
  // convention) so Compare/Timeline badges show "Emma"/"E" instead of a
  // generic "You"/"Y" once you've set one in Discover.
  const people = [{ key:"mine", label: currentContributorName() || "You", list: Store.get("schedule") }];
  const peopleSchedules = Store.get("peopleSchedules") || {};
  Object.keys(peopleSchedules).forEach(id=>{
    const list = personSnapshotList(peopleSchedules[id]);
    if(list.length) people.push({ key:id, label:personDisplayName(peopleSchedules[id], id), list });
  });
  return people;
}

// ===============================
// PERSON IDENTITY COLOUR — one stable colour per person, used everywhere
// a person needs identifying: chat, friend locations, and timeline/plan
// owner badges (this replaces the three separate, inconsistent things
// that used to exist here: an index-into-comparePeopleList() colour for
// timeline badges, a hash-of-deviceId emoji for friend status, and a
// hash-of-name emoji for chat — all now just personColorFor()).
//
// Keyed by NAME, not deviceId — same "identity is a name, not a device"
// model the rest of the app already uses (friendStatusEntries/
// chatContactNames dedupe by name too), so a person's colour survives a
// reinstall, a second device, or a browser switch, unlike the old
// index-into-comparePeopleList() approach: that order came from
// Object.keys() over locally-synced data, which genuinely could — and
// did — put the same person at a different index (and therefore a
// different colour) on two different phones.
//
// Known roster members (KNOWN_CONTRIBUTORS) get a fixed slot by
// position — guaranteed no two people on the known roster ever share a
// colour. Anyone else (a custom "Other…" name) falls back to a stable
// hash into the same palette, which is sized past the known roster
// specifically so that fallback has room to be distinct too for a group
// that can grow to ~10.
const PERSON_COLOR_PALETTE = ["#4be3ac","#2f9bff","#f2a83c","#e2836a","#c792ea","#f06292","#ffd54f","#5ac8c8","#ff8a65","#90caf9"];
function personColorFor(name){
  const norm = (name || "").trim().toLowerCase();
  const knownIdx = KNOWN_CONTRIBUTORS.findIndex(n=> n.toLowerCase() === norm);
  if(knownIdx !== -1) return PERSON_COLOR_PALETTE[knownIdx % PERSON_COLOR_PALETTE.length];
  let hash = 0;
  for(let i=0;i<norm.length;i++) hash = (hash * 31 + norm.charCodeAt(i)) >>> 0;
  return PERSON_COLOR_PALETTE[hash % PERSON_COLOR_PALETTE.length];
}
// Small filled circle in a person's colour — the shared visual unit for
// "this belongs to/came from that person" wherever a compact identity
// marker is needed (friend status lines, chat contact rows) as opposed
// to the lettered tb-owner-dot badges used on timeline blocks.
function personDotHtml(name, sizePx){
  const size = sizePx || 10;
  return `<span style="display:inline-block; width:${size}px; height:${size}px; border-radius:50%; background:${personColorFor(name)}; flex-shrink:0; vertical-align:middle;"></span>`;
}

const COMPARE_FILTER_MODES = [
  { key: "all", label: "Everyone's picks" },
  { key: "everyone", label: "Everyone wants to see" },
  { key: "mustsee", label: "Most Must Sees" },
  { key: "likes", label: "Most Just Likes" },
  { key: "onlyme", label: "Only me" },
  { key: "shared", label: "Shared with someone" }
];
let compareFilterMode = "all";

function renderCompareFilterChips(){
  const box = document.getElementById("compareFilterChips");
  if(!box) return;
  const people = comparePeopleList();
  if(people.length < 2){ box.innerHTML = ""; return; }
  box.innerHTML = COMPARE_FILTER_MODES.map(m=> `<span class="chip ${compareFilterMode===m.key?"active":""}" data-mode="${m.key}">${m.label}</span>`).join("");
  box.querySelectorAll(".chip").forEach(c=>{
    c.onclick = ()=>{
      compareFilterMode = c.dataset.mode;
      renderCompareFilterChips();
      renderPlanCompare();
    };
  });
}

function renderPlanCompare(){
  const box = document.getElementById("planCompareList");
  if(!box) return;
  const allPeople = comparePeopleList();

  if(allPeople.length < 2){
    box.innerHTML = `<div class="card"><p class="empty-note">Sync with a friend first to compare plans — pick your name in Settings and it syncs automatically whenever you've both got signal (no signal, there's a manual backup code there too). Once they've synced, their picks show up here alongside yours.</p></div>`;
    return;
  }

  // Compare respects the same shared owner selector as List/Clashes/
  // Timeline — pick who's showing up top, and Compare narrows to just them.
  const owners = new Set(activeOwnersList());
  const people = allPeople.filter(p=> owners.has(p.key));

  if(people.length < 2){
    box.innerHTML = `<div class="card"><p class="empty-note">Select more people up top to compare picks — add a teammate's chip alongside yours.</p></div>`;
    return;
  }

  const totalPeople = people.length;
  const rows = new Map();
  people.forEach(p=>{
    p.list.forEach(a=>{
      if(!rows.has(a.name)) rows.set(a.name, { artist:a, interest:{} });
      const row = rows.get(a.name);
      if(!(p.key in row.interest) || a.mustSee) row.interest[p.key] = !!a.mustSee;
    });
  });

  let entries = [...rows.values()];
  const rankedMode = compareFilterMode === "mustsee" || compareFilterMode === "likes";
  if(compareFilterMode === "shared") entries = entries.filter(e=> Object.keys(e.interest).length >= 2);
  else if(compareFilterMode === "everyone") entries = entries.filter(e=> Object.keys(e.interest).length === totalPeople);
  else if(compareFilterMode === "onlyme") entries = entries.filter(e=> Object.keys(e.interest).length === 1 && "mine" in e.interest);
  else if(compareFilterMode === "mustsee") entries = entries.filter(e=> Object.values(e.interest).some(v=> v));
  else if(compareFilterMode === "likes") entries = entries.filter(e=> Object.values(e.interest).some(v=> !v));
  if(selectedPlanDays.size) entries = entries.filter(e=> selectedPlanDays.has(e.artist.day));

  if(entries.length === 0){
    const dayNote = selectedPlanDays.size ? ` for ${DAY_ORDER.filter(d=>selectedPlanDays.has(d)).join(", ")}` : "";
    const emptyText = ({
      shared: "Nothing picked by two or more of you",
      everyone: "Nothing everyone's picked",
      onlyme: "Nothing that's only on your own list",
      mustsee: "No must-sees to compare",
      likes: "No just-likes to compare"
    }[compareFilterMode] || "Nobody's saved anything") + `${dayNote} yet.`;
    box.innerHTML = `<div class="card"><p class="empty-note">${emptyText}</p></div>`;
    return;
  }

  if(rankedMode){
    entries.sort((x,y)=>{
      const wantMustSee = compareFilterMode === "mustsee";
      const countX = Object.values(x.interest).filter(v=> wantMustSee ? v : !v).length;
      const countY = Object.values(y.interest).filter(v=> wantMustSee ? v : !v).length;
      if(countY !== countX) return countY - countX;
      return (toMinutes(x.artist.day, x.artist.start) ?? 999999) - (toMinutes(y.artist.day, y.artist.start) ?? 999999);
    });
  } else {
    entries.sort((x,y)=>{
      const dx = DAY_ORDER.indexOf(x.artist.day), dy = DAY_ORDER.indexOf(y.artist.day);
      const rd = (dx===-1?99:dx) - (dy===-1?99:dy);
      if(rd) return rd;
      return (toMinutes(x.artist.day, x.artist.start) ?? 999999) - (toMinutes(y.artist.day, y.artist.start) ?? 999999);
    });
  }

  const rowHTML = (e)=>{
    const count = Object.keys(e.interest).length;
    const peopleChips = people.map(p=>{
      const has = p.key in e.interest;
      const mustSee = e.interest[p.key];
      const dot = `<span class="tb-owner-dot" style="background:${personColorFor(p.label)}">${escapeHtml((p.label[0]||"?").toUpperCase())}</span>`;
      return `<span class="compare-person${has ? " in" : ""}">${dot} ${escapeHtml(p.label)}${has ? (mustSee ? " ★" : " 👍") : ""}</span>`;
    }).join("");
    return `
      <div class="item">
        <div class="item-top">
          <div>
            <strong>${escapeHtml(e.artist.name)}</strong><br>
            <span class="stage-link" data-stage="${escapeHtml(e.artist.stage)}">${escapeHtml(e.artist.stage)}</span><br>
            <span class="time-label">${timeLabel(e.artist)}</span>
          </div>
        </div>
        <p class="empty-note" style="margin:4px 0;">🔥 ${count}/${totalPeople} interested</p>
        <div class="compare-people">${peopleChips}</div>
      </div>`;
  };

  let html = "";
  if(rankedMode){
    html = entries.map(rowHTML).join("");
  } else {
    const byDay = {};
    entries.forEach(e=>{
      const key = e.artist.day && e.artist.day !== "TBC" ? e.artist.day : "No time set";
      (byDay[key] = byDay[key] || []).push(e);
    });
    const order = [...DAY_ORDER, "No time set"];
    order.forEach(day=>{
      if(!byDay[day]) return;
      html += `<div class="daygroup">${day}</div>`;
      byDay[day].forEach(e=> html += rowHTML(e));
    });
  }
  box.innerHTML = html;
  wireStageLinks(box);
}

// ===============================
// SEEN LIVE VIEW — your own log of acts confirmed via the ✓ tick
// wherever a star button appears (Lineup, Timeline detail, Plan list).
// Purely personal (see isSeen/setSeen above) — always reflects this
// device's own seenArtists, regardless of the shared owner selector.
// ===============================
function renderSeenList(){
  const box = document.getElementById("planSeenList");
  const countEl = document.getElementById("planSeenCount");
  if(!box) return;
  const seen = (Store.get("seenArtists") || []).slice().sort((a,b)=> (b.seenAt||0) - (a.seenAt||0));

  if(countEl) countEl.textContent = seen.length
    ? `You've confirmed seeing ${seen.length} act${seen.length===1?"":"s"} live so far.`
    : "";

  if(seen.length === 0){
    box.innerHTML = `<div class="card"><p class="empty-note">Nothing ticked off yet — once you're actually watching an act at the festival, tap the ✓ next to its star (in Lineup, a Timeline block's detail, or here in Plan) to log that you caught it live.</p></div>`;
    return;
  }

  box.innerHTML = seen.map(a=> `
    <div class="item">
      <div class="item-top">
        <div>
          <strong>${escapeHtml(a.name)}</strong> <span class="mustsee-tag" style="background:rgba(75,227,172,.16); color:var(--accent-teal);">✓ seen live</span><br>
          <span class="stage-link" data-stage="${escapeHtml(a.stage)}">${escapeHtml(a.stage)}</span><br>
          <span class="time-label">${timeLabel(a)}</span>
        </div>
        <button class="ghost seen-remove-btn" data-name="${escapeHtml(a.name)}">Undo</button>
      </div>
    </div>
  `).join("");

  box.querySelectorAll(".seen-remove-btn").forEach(btn=>{
    btn.onclick = ()=>{
      Store.set("seenArtists", (Store.get("seenArtists") || []).filter(x=> x.name !== btn.dataset.name));
      renderSeenList();
    };
  });
  wireStageLinks(box);
}

// "Big Picture" — a one-line roll-up shared by Compare and Timeline, so
// either view opens with the headline numbers before scrolling through
// individual artists. Built entirely from data those views (and Today)
// already compute — no separate counting logic.
function renderBigPictureSummary(containerId){
  const box = document.getElementById(containerId);
  if(!box) return;
  const people = comparePeopleList();
  if(people.length < 2){ box.innerHTML = ""; return; }
  const byArtist = buildCombinedArtistInterestMap();
  const all = Object.values(byArtist);
  const sharedMustSees = all.filter(a=> Object.values(a.interest).filter(Boolean).length >= 2).length;
  const clashCount = groupClashPairs().length;
  const invitesOut = outstandingGroupInvitesCount();
  const nowMin = nowMinutesSinceFestivalStart();
  const nextShared = all
    .filter(a=> a.startMin !== null && a.startMin > nowMin && Object.keys(a.interest).length >= 2)
    .sort((a,b)=> a.startMin - b.startMin)[0];
  const parts = [
    `${sharedMustSees} shared Must See${sharedMustSees===1?"":"s"}`,
    `${clashCount} clash${clashCount===1?"":"es"}`,
    `${invitesOut} group invite${invitesOut===1?"":"s"}`,
  ];
  if(nextShared) parts.push(`Next shared artist ${timeLabel(nextShared)}`);
  box.innerHTML = `<p class="empty-note big-picture-line">${parts.join(" · ")}</p>`;
}

// ===============================
// SAVED-ARTIST TIMELINE (Plan) — same scrollable stage/time grid as the
// Artists screen's Timeline view, scoped to whichever owner(s) are
// selected in the shared top selector (renderPlanOwnerSelector). Selecting
// more than one merges everyone's picks into a single grid — a shared
// pick shows as one block tagged with everyone who chose it, rather than
// one block per person.
// ===============================
let planTimelineDay = "Wed";

// Timeline is filtered to one day at a time (a.day === planTimelineDay),
// same as Clash Timeline below — correct and intentional, since it's a
// time-of-day grid. But defaulting to a fixed "Wed" meant anyone whose
// saved artists happened to fall on a different day landed on what
// looked like a completely empty, broken timeline (their List view
// showed everything fine, since that's day-unfiltered) until they
// noticed the day tabs and tapped through. Picks the first day that
// actually has something with a set time instead.
function pickDefaultTimelineDay(list){
  for(const d of DAY_ORDER){
    if(list.some(a=> a && a.day === d && a.start)) return d;
  }
  return "Wed";
}

function renderPlanTimelineDayTabs(){
  const box = document.getElementById("planTimelineDayTabs");
  if(!box) return;
  box.className = "tabstrip";
  box.innerHTML = DAY_ORDER.map(d=>`<button class="${d===planTimelineDay?"active":""}" data-day="${d}">${d}</button>`).join("");
  box.querySelectorAll("button").forEach(btn=>{
    btn.onclick = ()=>{
      planTimelineDay = btn.dataset.day;
      renderPlanTimelineDayTabs();
      renderPlanTimeline();
    };
  });
}

function renderPlanTimeline(){
  const grid = document.getElementById("planTimelineGrid");
  if(!grid) return;
  const owners = activeOwnersList();
  const combined = owners.length > 1;
  const readonly = combined || owners[0] !== "mine";

  // activeScheduleData() already merges every selected owner's picks
  // (deduped by name+day+stage+start, tagged with _owners) — just filter
  // down to this one day.
  const full = activeScheduleData();
  const dayItems = full.filter(a=> a.day === planTimelineDay && a.start && (!planMustSeeFilter || a.mustSee));

  const savedNames = new Set(dayItems.map(a=>a.name));
  const mustSeeNames = new Set(dayItems.filter(a=>a.mustSee).map(a=>a.name));
  // Your own exact-time overrides for "custom"-resolved clashes (see
  // effectiveArtistTime/getPersonalClashChoice) — solo view only. A
  // combined multi-person view keeps everyone's real times so picks
  // stay comparable across people; only your own single-person Timeline
  // plots your actual intended times.
  const clashMapForDay = (!combined && owners[0] === "mine") ? findClashes(dayItems) : null;
  const timelineItems = clashMapForDay ? dayItems.map((a, i)=>{
    const clashesForA = clashMapForDay[i];
    if(!clashesForA || clashesForA.length !== 1) return a;
    const eff = effectiveArtistTime(a, clashesForA[0].name);
    return eff.overridden ? { ...a, start: eff.start, end: eff.end } : a;
  }) : dayItems;
  // Personal & group activities get their own per-person lane, tacked on
  // after the real lineup rows — computed from savedNames/mustSeeNames
  // BEFORE this concat so an activity never picks up a stray ★ from a
  // same-named saved act.
  const activityItems = (typeof activitiesForDay === "function") ? activitiesForDay(planTimelineDay) : [];
  const renderItems = timelineItems.concat(activityItems);
  const { html } = buildTimelineHTML(renderItems, { day: planTimelineDay, readonly, savedNames, mustSeeNames, showOwnerBadges: combined });
  grid.innerHTML = renderItems.length ? html : `<p class="empty-note" style="padding:16px;">${planMustSeeFilter ? `No must-sees with a set time saved for ${planTimelineDay} yet.` : `Nothing with a set time saved for ${planTimelineDay} yet.`}</p>`;

  const hint = document.getElementById("planTimelineHint");
  if(hint){
    const peopleByKey = new Map(comparePeopleList().map(p=>[p.key,p]));
    hint.textContent = combined
      ? `Combined view of ${owners.map(k=>peopleByKey.get(k)?.label || k).join(" + ")} — tap a block for details. Shared picks are marked with everyone's initials.`
      : (readonly ? "Scroll sideways for time, down for stage. Tap a block to see details." : "Scroll sideways for time, down for stage. Tap a block to see details or unsave it.");
  }

  grid.querySelectorAll(".timeline-block").forEach(b=>{
    b.onclick = ()=>{
      const name = b.dataset.name, day = b.dataset.day;
      const artist = dayItems.find(a=>a.name===name && a.day===day);
      if(artist) showTimelineDetailModal(artist, { readonly, onSaveToggle: renderPlanTimeline });
    };
  });
  wireStageLinks(grid);
  // Activity lanes use a synthetic "<name>'s activities" stage that isn't
  // a real venue — jumping to the map/venue directory for one (what
  // wireStageLinks just wired every row head to do) would be a dead end,
  // so point those specific row heads at the actual Join/Delete list
  // below instead.
  const activityStages = new Set(activityItems.map(a=>a.stage));
  grid.querySelectorAll(".timeline-row-head.stage-link").forEach(head=>{
    if(!activityStages.has(head.dataset.stage)) return;
    head.onclick = (e)=>{
      e.stopPropagation();
      const list = document.getElementById("planActivitiesList");
      if(list) list.scrollIntoView({ behavior:"smooth", block:"center" });
    };
  });
  // Joined-copy items (isJoinedCopy) only exist to plot a second block on
  // the timeline grid itself — the list below stays deduped, one row per
  // real activity, with its own Join/Leave toggle already covering that.
  if(typeof renderPlanActivitiesList === "function") renderPlanActivitiesList(activityItems.filter(a=>!a.isJoinedCopy), planTimelineDay);
  refreshTimelineScrollProgress("planTimelineOuter");
}

// ===============================
// CLASH TIMELINE — same grid, filtered to only picks that actually
// overlap with something else, so a clash reads as blocks lining up
// across stage rows instead of needing to spot it in a list of warnings.
// ===============================
function renderClashTimelineDayTabs(){
  const box = document.getElementById("clashTimelineDayTabs");
  if(!box) return;
  box.className = "tabstrip";
  box.innerHTML = DAY_ORDER.map(d=>`<button class="${d===clashTimelineDay?"active":""}" data-day="${d}">${d}</button>`).join("");
  box.querySelectorAll("button").forEach(btn=>{
    btn.onclick = ()=>{
      clashTimelineDay = btn.dataset.day;
      renderClashTimelineDayTabs();
      renderClashTimeline();
    };
  });
}

function renderClashTimeline(){
  const grid = document.getElementById("clashTimelineGrid");
  if(!grid) return;
  const owners = activeOwnersList();
  const readonly = owners.length > 1 || owners[0] !== "mine";
  const fullSchedule = activeScheduleData();
  const clashMap = findClashes(fullSchedule);
  const clashingIdx = new Set(Object.keys(clashMap).map(Number));
  const dayEntries = fullSchedule
    .map((a,i)=>({a,i}))
    .filter(({a,i})=> clashingIdx.has(i) && a.day === clashTimelineDay && a.start && (!planMustSeeFilter || a.mustSee));
  const dayItems = dayEntries.map(({a})=>a);
  const savedNames = new Set(dayItems.map(a=>a.name));
  const mustSeeNames = new Set(dayItems.filter(a=>a.mustSee).map(a=>a.name));
  // Same solo-view-only exact-time overrides as the Plan Timeline (see
  // renderPlanTimeline) — a combined/readonly view keeps everyone's real
  // times, since that's the whole point of comparing across people.
  const timelineItems = !readonly ? dayEntries.map(({a,i})=>{
    const clashesForA = clashMap[i];
    if(!clashesForA || clashesForA.length !== 1) return a;
    const eff = effectiveArtistTime(a, clashesForA[0].name);
    return eff.overridden ? { ...a, start: eff.start, end: eff.end } : a;
  }) : dayItems;
  const { html } = buildTimelineHTML(timelineItems, { day: clashTimelineDay, readonly, savedNames, mustSeeNames });
  grid.innerHTML = timelineItems.length ? html : `<p class="empty-note" style="padding:16px;">No clashes on ${clashTimelineDay}${planMustSeeFilter ? " among your must-sees" : ""}.</p>`;

  grid.querySelectorAll(".timeline-block").forEach(b=>{
    b.classList.add("clashing");
    b.onclick = ()=>{
      const name = b.dataset.name, day = b.dataset.day;
      const artist = fullSchedule.find(a=>a.name===name && a.day===day);
      if(artist) showTimelineDetailModal(artist, { readonly, onSaveToggle: ()=>{ renderClashTimeline(); } });
    };
  });
  wireStageLinks(grid);
  refreshTimelineScrollProgress("clashTimelineOuter");
}

// ===============================
// PERSONAL & GROUP ACTIVITIES — "add your own thing to the timetable"
// (a meetup, a friend's own set, anything not part of the official
// lineup), layered on the exact same read-only-snapshot sync pattern as
// schedule/bingo/character/status above (see the DATA ISOLATION MODEL
// note near Store/DEFAULTS): Store.get("activities") is this device's
// own personal+group activities; peopleActivities[personId] is a
// read-only snapshot of a teammate's synced activities — BOTH
// visibilities, replaced whole on every resync (see buildSyncPayload/
// mergeSyncPayload). "visibility" no longer controls who can SEE an
// activity — every activity always syncs and is always viewable on
// everyone's Plan/Timeline — it only controls who can JOIN one: only
// "group" activities offer a Join button (see renderPlanActivitiesList
// below); "personal" ones are still visible everywhere, just view-only
// for anyone who isn't the owner. "Joined" group activities work the
// same way via joinedActivities/peopleJoins, so any device can compute
// a full attendee list for any activity just from data it already pulls.
//
// Each person's activities get fed into the Plan Timeline (see
// renderPlanTimeline) tagged with a synthetic `stage` of "<name>'s
// activities" — buildTimelineHTML groups blocks into one row per
// distinct `stage` value with zero changes needed to that shared
// function, which is what gives every person their own lane.
// ===============================
function ensureActivityId(){
  return "act_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function createActivity({ name, visibility, day, start, end }){
  const list = Store.get("activities") || [];
  const activity = {
    id: ensureActivityId(),
    name: (name || "").trim(),
    visibility: visibility === "group" ? "group" : "personal",
    day: day || "TBC",
    start: start || null,
    end: end || null,
    createdAt: Date.now()
  };
  list.push(activity);
  Store.set("activities", list);
  return activity;
}

function deleteActivity(id){
  const list = (Store.get("activities") || []).filter(a=> a.id !== id);
  Store.set("activities", list);
}

// "Owner::activity" — a globally-unique id across every device's own
// activity id sequence, since ensureActivityId() is only unique per
// device on its own.
function activityGlobalId(ownerId, activityId){
  return `${ownerId}::${activityId}`;
}
function myActivityJoinedIds(){
  return new Set(Store.get("joinedActivities") || []);
}
function toggleJoinActivity(ownerId, activityId){
  const key = activityGlobalId(ownerId, activityId);
  const joined = Store.get("joinedActivities") || [];
  const idx = joined.indexOf(key);
  if(idx === -1) joined.push(key); else joined.splice(idx, 1);
  Store.set("joinedActivities", joined);
}

// The owner is always implicitly "in" their own activity — everyone
// else has to have actually tapped "I'm in" (found via this device's own
// joinedActivities if it isn't the owner, or a teammate's synced
// peopleJoins snapshot otherwise).
function activityAttendeeNames(ownerId, ownerName, activityId){
  const key = activityGlobalId(ownerId, activityId);
  const names = new Set([ownerName]);
  const myId = (typeof ensureDeviceId === "function") ? ensureDeviceId() : "";
  if(myId !== ownerId && myActivityJoinedIds().has(key)) names.add(currentContributorName() || "You");
  const peopleJoins = Store.get("peopleJoins") || {};
  Object.entries(peopleJoins).forEach(([id, entry])=>{
    if(id === ownerId) return;
    if(personSnapshotList(entry).includes(key)) names.add(personDisplayName(entry, id));
  });
  return [...names];
}

// Turns one activity into a buildTimelineHTML-compatible item — see the
// section banner above for why the synthetic `stage` value is what
// creates a per-person lane for free. Always plots under the CREATOR's
// own lane, whether it's your own activity or a friend's group one —
// see activityToJoinedTimelineItem below for the second, separate copy
// a joiner gets under their own lane.
function activityToTimelineItem(a, ownerId, ownerName){
  return {
    id: a.id, ownerId, ownerName, visibility: a.visibility,
    name: a.name, day: a.day, start: a.start, end: a.end,
    stage: `${ownerName}’s activities`,
    genre: a.visibility === "personal" ? "Personal activity" : "Group activity"
  };
}

// A friend's group activity you've tapped "I'm in" on is a real personal
// time commitment, not just an interest count — it needs to show up
// under YOUR OWN lane too, same day/time, so your own timetable line
// actually reflects where you intend to be, not just what you created.
// Kept as a clearly-marked separate copy (name suffix + distinct genre
// label) rather than merged into the original item, so the timeline
// still reads "created by" vs "joined by" at a glance, and so it's easy
// to exclude from the Join/Delete list (renderPlanActivitiesList) below,
// which only ever wants one row per real activity.
function activityToJoinedTimelineItem(a, ownerId, ownerName, joinerName){
  return {
    id: a.id, ownerId, ownerName, visibility: a.visibility,
    name: `${a.name} (joining ${ownerName})`,
    day: a.day, start: a.start, end: a.end,
    stage: `${joinerName}’s activities`,
    genre: "Joined activity",
    isJoinedCopy: true
  };
}

// Merges this device's own activities (personal + group) with every
// synced teammate's GROUP-only activities for one day — same shape as
// activeScheduleData() above, just for activities instead of picks. Also
// adds a joined-copy item (see activityToJoinedTimelineItem) under your
// own lane for every friend's activity you've joined.
function activitiesForDay(day){
  const myId = (typeof ensureDeviceId === "function") ? ensureDeviceId() : "";
  const myName = currentContributorName() || "You";
  const items = (Store.get("activities") || [])
    .filter(a=> a.day === day && a.start)
    .map(a=> activityToTimelineItem(a, myId, myName));

  const peopleActivities = Store.get("peopleActivities") || {};
  const myJoined = myActivityJoinedIds();
  Object.entries(peopleActivities).forEach(([id, entry])=>{
    if(id === myId) return; // this device's own group activities are already in Store.get("activities") above
    personSnapshotList(entry).filter(a=> a.day === day && a.start).forEach(a=>{
      const ownerName = personDisplayName(entry, id);
      items.push(activityToTimelineItem(a, id, ownerName));
      if(myJoined.has(activityGlobalId(id, a.id))) items.push(activityToJoinedTimelineItem(a, id, ownerName, myName));
    });
  });
  return items;
}

// A compact, actually-tappable list underneath the dense timeline grid —
// the timeline blocks are informational (see renderPlanTimeline's
// stage-link override), this is where Join/Leave/Delete actually live.
function renderPlanActivitiesList(activityItems, day){
  const box = document.getElementById("planActivitiesList");
  if(!box) return;
  if(!activityItems.length){ box.innerHTML = ""; return; }
  const myId = (typeof ensureDeviceId === "function") ? ensureDeviceId() : "";
  box.innerHTML = `
    <div class="card" style="margin-top:10px;">
      <h3>Activities — ${escapeHtml(day)}</h3>
      ${activityItems.map(a=>{
        const mine = a.ownerId === myId;
        const attendees = a.visibility === "group" ? activityAttendeeNames(a.ownerId, a.ownerName, a.id) : null;
        const joined = !mine && myActivityJoinedIds().has(activityGlobalId(a.ownerId, a.id));
        const timeText = a.start ? `${a.start}${a.end ? "–" + a.end : ""}` : "No time set";
        const joinBtn = (!mine && a.visibility === "group")
          ? `<button type="button" class="ghost activity-join-btn" data-owner="${escapeHtml(a.ownerId)}" data-id="${escapeHtml(a.id)}" style="padding:4px 10px; font-size:12px; white-space:nowrap;">${joined ? "Leave" : "I'm in"}</button>`
          : "";
        const deleteBtn = mine
          ? `<button type="button" class="ghost activity-delete-btn" data-id="${escapeHtml(a.id)}" style="padding:4px 10px; font-size:12px; white-space:nowrap;">Delete</button>`
          : "";
        return `
          <div class="chat-thread-row" style="cursor:default;">
            ${personDotHtml(a.ownerName)}
            <div style="flex:1; min-width:0;">
              <div><strong>${escapeHtml(a.name)}</strong> <span class="tag" style="margin-left:4px;">${a.visibility === "personal" ? "Personal" : "Group"}</span></div>
              <div class="chat-thread-sub">${escapeHtml(a.ownerName)}${mine ? " (you)" : ""} · ${escapeHtml(timeText)}${attendees ? ` · ${attendees.length} in` : ""}</div>
            </div>
            ${joinBtn}${deleteBtn}
          </div>
        `;
      }).join("")}
    </div>
  `;
  box.querySelectorAll(".activity-join-btn").forEach(btn=>{
    btn.onclick = ()=>{
      toggleJoinActivity(btn.dataset.owner, btn.dataset.id);
      if(typeof renderPlanTimeline === "function") renderPlanTimeline();
    };
  });
  box.querySelectorAll(".activity-delete-btn").forEach(btn=>{
    btn.onclick = ()=>{
      deleteActivity(btn.dataset.id);
      if(typeof renderPlanTimeline === "function") renderPlanTimeline();
    };
  });
}

let _activityComposerVisibility = "personal";
function closeActivityComposer(){
  const existing = document.getElementById("activityComposerModal");
  if(existing) existing.remove();
}
// Same trigger, same experience whether opened from Plan's "+" or
// Lineup's "Add an activity" card — see the two call sites below.
function openActivityComposer(){
  closeActivityComposer();
  _activityComposerVisibility = "personal";
  const backdrop = document.createElement("div");
  backdrop.id = "activityComposerModal";
  backdrop.style.cssText = "position:fixed; inset:0; z-index:60; background:rgba(5,10,8,.72); display:flex; align-items:center; justify-content:center; padding:20px;";
  backdrop.innerHTML = `
    <div class="card" style="position:relative; width:100%; max-width:420px; max-height:85vh; overflow-y:auto; overflow-x:hidden; margin:0;">
      <button aria-label="Close" id="activityComposerCloseBtn" style="position:absolute; top:10px; right:10px; background:none; border:1px solid var(--line); color:var(--text-primary); border-radius:10px; width:32px; height:32px; font-size:16px; line-height:1; cursor:pointer;">✕</button>
      <h3>Add an activity</h3>
      <p class="empty-note" style="margin-bottom:10px;">Anything from "meet at the campsite" to a friend's own set — not part of the official lineup. Everyone synced sees it on your timeline either way — Group also lets them join in, Personal is just visible to look at.</p>
      <div class="field"><label>Name</label><input type="text" id="activityNameInput" placeholder="e.g. Sunrise coffee at camp"></div>
      <div class="field">
        <label>Joinable?</label>
        <div class="stagelist" id="activityVisibilityToggle">
          <button type="button" class="active" data-vis="personal">Personal — view only</button>
          <button type="button" data-vis="group">Group — can join in</button>
        </div>
      </div>
      <div class="field">
        <label>Day</label>
        <select id="activityDayInput">
          <option value="TBC">TBC</option>
          ${DAY_ORDER.map(d=>`<option value="${d}">${d}</option>`).join("")}
        </select>
      </div>
      <div class="time-row">
        <div class="field"><label>Start</label><input type="time" id="activityStartInput"></div>
        <div class="field"><label>End</label><input type="time" id="activityEndInput"></div>
      </div>
      <button class="action" id="activitySaveBtn">Save activity</button>
    </div>
  `;
  backdrop.onclick = (e)=>{ if(e.target === backdrop) closeActivityComposer(); };
  document.body.appendChild(backdrop);
  backdrop.querySelector("#activityComposerCloseBtn").onclick = closeActivityComposer;
  backdrop.querySelectorAll("#activityVisibilityToggle button").forEach(btn=>{
    btn.onclick = ()=>{
      _activityComposerVisibility = btn.dataset.vis;
      backdrop.querySelectorAll("#activityVisibilityToggle button").forEach(b=> b.classList.toggle("active", b === btn));
    };
  });
  backdrop.querySelector("#activitySaveBtn").onclick = ()=>{
    const nameInput = backdrop.querySelector("#activityNameInput");
    const name = nameInput.value.trim();
    if(!name){ nameInput.focus(); return; }
    const day = backdrop.querySelector("#activityDayInput").value;
    const start = backdrop.querySelector("#activityStartInput").value || null;
    const end = backdrop.querySelector("#activityEndInput").value || null;
    createActivity({ name, visibility: _activityComposerVisibility, day, start, end });
    closeActivityComposer();
    // Jump straight to Plan's Timeline view, on the activity's own day if
    // it has one, so the new per-person lane is immediately visible —
    // the whole point of asking for a day/time up front.
    if(day !== "TBC" && typeof planTimelineDay !== "undefined") planTimelineDay = day;
    if(typeof jumpToTab === "function") jumpToTab("plan");
    if(typeof setPlanView === "function") setPlanView("timeline");
  };
}

// ===============================
// DASHBOARD NEXT EVENT
// ===============================
function updateNextEvent(){
  const target = document.getElementById("next-event");
  if(target){
    const schedule = Store.get("schedule");
    const timed = schedule
      .map(a=>({...a, m: toMinutes(a.day, a.start)}))
      .filter(a=> a.m !== null)
      .sort((a,b)=> a.m - b.m);

    const next = timed[0] || schedule[0];

    if(next){
      target.innerHTML = `
        <div class="big">${next.name}</div>
        <div class="sub">${next.stage} · ${timeLabel(next)}</div>
      `;
    } else {
      target.innerHTML = "Nothing saved yet";
    }
  }
  if(typeof renderHomeContextBanner === "function") renderHomeContextBanner();
  if(typeof renderGroupInvites === "function") renderGroupInvites();
}

function renderNowNext(){
  const banner = document.getElementById("nowNextBanner");
  if(!banner) return;
  const festStart = new Date("2026-08-12T00:00:00");
  const now = new Date();
  const diffDays = Math.floor((now - festStart) / 86400000);
  if(diffDays < 0 || diffDays > 5){ banner.innerHTML = ""; return; }

  const nowMin = diffDays * 1440 + now.getHours() * 60 + now.getMinutes();
  const timed = Store.get("schedule")
    .map(a=>({ ...a, m: toMinutes(a.day, a.start), em: toMinutes(a.day, a.end) }))
    .filter(a=> a.m !== null);
  const current = timed.find(a=> a.em !== null && a.m <= nowMin && nowMin < (a.em > a.m ? a.em : a.em + 1440));
  const next = timed.filter(a=> a.m > nowMin).sort((a,b)=> a.m - b.m)[0];

  if(!current && !next){ banner.innerHTML = ""; return; }
  banner.innerHTML = `
    <div class="card">
      ${current ? `<span class="tag">Happening now</span><p><strong>${current.name}</strong> · ${current.stage}</p>` : `<p class="empty-note">Nothing from your plan on right now.</p>`}
      ${next ? `<p style="margin-top:6px;">Next up: <strong>${next.name}</strong> · ${next.stage} · ${timeLabel(next)}</p>` : ""}
    </div>
  `;
}
renderNowNext();

// ===============================
// HOME CONTEXT BANNER — a compact, always-visible summary so opening
// the app answers "what's the situation right now" in one glance,
// instead of scrolling past countdown/setup/links cards to find it.
// Built entirely from data the app already has (saved schedule, clash
// map, per-person last-seen from sync, meeting point) — no new state.
// ===============================
function jumpToClashes(){
  jumpToTab("plan");
  const btn = document.getElementById("viewClashBtn");
  if(btn) btn.click();
}

function renderHomeContextBanner(){
  const banner = document.getElementById("homeContextBanner");
  if(!banner) return;
  const now = new Date();
  const dayLabel = now.toLocaleDateString([], { weekday: "short" });
  const clockLabel = now.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  const name = currentContributorName();

  // Now/next set info lives in the dedicated "Next saved event" ticket
  // above this banner instead — kept out of here so the two don't say
  // the same thing twice in different words. Clash warnings used to show
  // here too, but Home's top area is meant to answer "what have my
  // friends been doing?" not double as a general app-update feed — clash
  // alerts still live on the Today tab and in Plan → Compare.

  // Only shows for someone who's actually set a location (peopleStatus)
  // — not just "synced recently," which used to fire for anyone who'd
  // ever opened the app with signal, regardless of whether they'd told
  // the group anything. Reuses the same friend-status data as the
  // "Where's everyone?" card, no separate tracking.
  const peopleStatus = Store.get("peopleStatus") || {};
  const myDeviceId = (typeof ensureDeviceId === "function") ? ensureDeviceId() : null;
  const friendIds = Object.keys(peopleStatus).filter(id=> id !== myDeviceId && peopleStatus[id] && peopleStatus[id].place);
  const mostRecentId = friendIds.sort((a,b)=> (peopleStatus[b].updatedAt||0) - (peopleStatus[a].updatedAt||0))[0];
  const friendLine = mostRecentId
    ? `👥 ${escapeHtml(personDisplayName(peopleStatus[mostRecentId], mostRecentId))} — ${escapeHtml(peopleStatus[mostRecentId].place)} · ${formatLastSeen(peopleStatus[mostRecentId].updatedAt)}`
    : "";

  const meeting = (Store.get("meeting") || "").trim();
  const meetingLine = meeting ? `📍 Meet at ${escapeHtml(meeting)}` : "";

  const bottomLine = [friendLine, meetingLine].filter(Boolean).join(" · ");

  // LOCATION REMINDER — no real background timer fires this (a static
  // GitHub Pages app with no server can't wake a closed tab — see the
  // LOCAL CHAT notifications section for the same constraint applied to
  // chat). Just an elapsed-time check against myStatus.updatedAt,
  // re-evaluated every time this banner renders, so it's only ever
  // honest about "as of the last time you had this open." Dismissing
  // snoozes for one more full interval rather than forever, same as the
  // interval itself — see LOCATION_REMINDER_INTERVAL_MS above.
  const myStatus = Store.get("myStatus");
  const reminderOn = !!Store.get("locationReminderEnabled");
  const lastLocationUpdate = (myStatus && myStatus.updatedAt) || 0;
  const reminderDismissedAt = Store.get("locationReminderDismissedAt") || 0;
  const showLocationReminder = reminderOn
    && (Date.now() - lastLocationUpdate) > LOCATION_REMINDER_INTERVAL_MS
    && (Date.now() - reminderDismissedAt) > LOCATION_REMINDER_INTERVAL_MS;

  banner.innerHTML = `
    <div class="card home-context-banner">
      <div class="hcb-top">${escapeHtml(dayLabel)} · ${escapeHtml(clockLabel)}${name ? " · " + escapeHtml(name) : ""}</div>
      ${showLocationReminder ? `<div class="hcb-line">📍 Update your location? It's been a while — <a class="inline-link" id="hcbLocationUpdateLink">update</a> · <a class="inline-link" id="hcbLocationDismissLink">not now</a></div>` : ""}
      ${bottomLine ? `<div class="hcb-line hcb-muted">${bottomLine}</div>` : ""}
    </div>
  `;
  if(showLocationReminder){
    const updateLink = banner.querySelector("#hcbLocationUpdateLink");
    if(updateLink) updateLink.onclick = ()=> jumpToId("jumpFriendStatus", "settingsscreen");
    const dismissLink = banner.querySelector("#hcbLocationDismissLink");
    if(dismissLink) dismissLink.onclick = ()=>{ Store.set("locationReminderDismissedAt", Date.now()); renderHomeContextBanner(); };
  }
}
renderHomeContextBanner();
setInterval(renderHomeContextBanner, 60000);

document.getElementById("copyPlanBtn").onclick = async ()=>{
  const schedule = Store.get("schedule");
  const btn = document.getElementById("copyPlanBtn");
  if(schedule.length === 0){ btn.textContent = "Nothing saved yet"; setTimeout(()=> btn.textContent = "Copy plan as text", 1500); return; }
  const text = "My Boomtown 2026 plan:\n" + schedule.map(a=> `${a.name} — ${a.stage} — ${timeLabel(a)}`).join("\n");
  try{
    await navigator.clipboard.writeText(text);
    btn.textContent = "Copied!";
  }catch(e){
    window.prompt("Copy this manually:", text);
    return;
  }
  setTimeout(()=> btn.textContent = "Copy plan as text", 1500);
};

// Plain-text plan summary grouped by day, sorted by start time within each
// day — readable enough to paste straight into a group chat.
function buildPlanShareText(){
  const schedule = Store.get("schedule");
  if(schedule.length === 0) return null;
  const byDay = {};
  schedule.forEach(a=>{
    const day = a.day && a.day !== "TBC" ? a.day : "No time set";
    (byDay[day] = byDay[day] || []).push(a);
  });
  const order = [...DAY_ORDER, "No time set"];
  const lines = ["My Boomtown 2026 plan:"];
  order.filter(d=> byDay[d]).forEach(day=>{
    const items = byDay[day].slice().sort((a,b)=> (toMinutes(a.day,a.start)||0) - (toMinutes(b.day,b.start)||0));
    lines.push(`\n${day}:`);
    items.forEach(a=> lines.push(`  ${a.name} — ${a.stage} — ${timeLabel(a)}`));
  });
  return lines.join("\n");
}

const sharePlanBtn = document.getElementById("sharePlanBtn");
const sharePlanStatusNote = document.getElementById("sharePlanStatusNote");
if(sharePlanBtn){
  sharePlanBtn.onclick = async ()=>{
    const text = buildPlanShareText();
    if(!text){
      if(sharePlanStatusNote) sharePlanStatusNote.textContent = "Nothing saved yet.";
      return;
    }
    if(navigator.share){
      try{
        await navigator.share({ title:"My Boomtown 2026 plan", text });
        if(sharePlanStatusNote) sharePlanStatusNote.textContent = "";
        return;
      }catch(e){
        // user cancelled the share sheet, or it's unsupported for this
        // content — fall through to clipboard below rather than erroring.
      }
    }
    try{
      await navigator.clipboard.writeText(text);
      if(sharePlanStatusNote){
        sharePlanStatusNote.textContent = "Copied to clipboard!";
        setTimeout(()=> sharePlanStatusNote.textContent = "", 1500);
      }
    }catch(e){
      window.prompt("Copy this manually:", text);
    }
  };
}

function browseAllArtists(){
  jumpToTab("artists");
  if(artistsView !== "list" && artistsViewListBtn) artistsViewListBtn.click();
  artistSearch.value = "";
  clearGenreChips();
  updateGenreChipHighlights();
  clearDayChips();
  updateDayChipHighlights();
  updateClearArtistSearchBtn();
  showArtists(allArtists());
  artistSearch.placeholder = `Browsing all ${allArtists().length} artists — use a day/genre chip or search to narrow it down`;
  window.scrollTo(0, 0);
}
document.getElementById("browseAllArtistsBtn").onclick = browseAllArtists;
const artistsBrowseAllBtn = document.getElementById("artistsBrowseAllBtn");
if(artistsBrowseAllBtn) artistsBrowseAllBtn.onclick = browseAllArtists;

loadPlanDayChips();
renderPlanOwnerSelector();
renderSchedule();
updateNextEvent();

// ===============================
// SCHEMATIC MAP — real districts & key stages, approximate layout
// ===============================
const locations = [
  // Downtown cluster (Area 404/Botanica/Letsbe Avenue/Metropolis/NEXUS/
  // Hydro XL/Spectrum 360/Rose and Clown) re-derived together this pass,
  // not one pair at a time — an earlier single-pair fix (Spectrum 360 vs
  // Area 404 alone) had left Spectrum 360 sitting NORTH of NEXUS/Botanica,
  // when a wider single frame this session (showing NEXUS, Botanica,
  // Letsbe Avenue, Metropolis, Area 404 and Spectrum 360 all together)
  // shows Spectrum 360 clearly south of both, near Area 404 as originally
  // intended. Also opens up the vertical spacing between Letsbe Avenue
  // and Botanica specifically — the two labels were rendering as
  // overlapping/illegible text on the live map (this map's markers are
  // plain DOM elements with no built-in collision avoidance, so crowded
  // coordinates show up directly as garbled overlapping labels).
  // Pulled in from (50,37) to (36,37) — reported (repeatedly) as "the area
  // between metropolis and area 404 seems extremely large." Reference
  // footage (findings_vidAB/vidCD/vidE1/vidE2) is unanimous that Botanica,
  // Metropolis and Area 404 "sit in the same wooded bowl/enclosure" as one
  // continuous loop, not three separate clearings 30+ schematic units
  // apart. Applied a uniform x-scale (factor 0.6, pivoted on Metropolis's
  // own position) to every point in the Metropolis/Area-404 corridor
  // (Area 404 itself, Spectrum 360, Hangar 161, Deviant Lounge, BBXL,
  // Acid Leak below) rather than nudging individual points — scaling
  // preserves each point's relative position to its neighbours exactly,
  // so it closes the gap without introducing new overlaps in the corridor.
  { name:"Area 404", kind:"district", x:"36%", y:"37%", info:"Downtown. Once the district for outsiders and squatters, 404 now runs Boomtown after winning last year's election, policed by Chief Guardian Mr Biga's own Guardians — whose boot camp, 'official fines' and work-permit machinery are worth questioning if you find them." },
  { name:"Botanica", kind:"district", x:"28%", y:"18%", info:"Downtown. A plant-covered temple district. Its leader, the Great Mother, is plotting an ascension ritual after her election defeat, centred on the transformed Temple of Zero — home to The Network and its sentient mycelium AI, IONA." },
  // Thrutopia's map pin removed entirely (not just repositioned) — still
  // unconfirmed by any real footage after two separate sessions' worth of
  // reference video, including one clip of someone typing "thrutopia"
  // into the official app's own search bar and manually panning almost
  // the entire site: no pin, label, or highlighted result for it ever
  // appeared anywhere. The one "sighting" found earlier was a screen
  // recording of THIS APP'S OWN in-progress map (caught mid-pan by its
  // "Greebtown!" app-switcher label), not the official app — using that
  // would have been circularly confirming our own guess. Thrutopia is
  // still a real district narratively (schedule, GUIDE_DISTRICT_NAMES,
  // Discover cards below all keep it — it clearly exists, e.g. the
  // opening ceremony is held there) but showing a guessed pin on a map
  // people navigate by risks sending someone to the wrong place, which
  // is worse than showing nothing. Re-add a pin only once a genuine
  // official-app sighting turns up.
  // Copperwood's map pin removed entirely — same treatment as Thrutopia
  // above. Earlier sessions' video-review notes (docs/map-evidence)
  // repeatedly claimed a "COPPERWOOD HEIGHTS" label in this area across
  // several independent frames, but two fresh screenshots of exactly
  // this area (Grand Central close-up, and The Hide Out Hilltop/Full
  // Moon Ballroom close-up — both covering precisely where Copperwood
  // was placed) show every other venue label in the cluster (Tangled
  // Roots, The Hide Out Hilltop, Silver Swan Talent Agency, Full Moon
  // Ballroom, Foggers Mill, Boomtown Hall, Daily Rag, Ancient Futures,
  // Elemental, Rebel Girls Club, Circus, etc.) clearly legible, with no
  // "Copperwood"/"Copperwood Heights" text anywhere. Direct, current,
  // targeted evidence beats the older secondhand video notes here.
  // Copperwood still clearly exists NARRATIVELY (GUIDE_DISTRICT_NAMES,
  // Discover card, Edna Von Vanderhaus/VVH/Von Vanderland character
  // entries all keep it — same as Thrutopia) but showing a district pin
  // with no confirmed on-map label risks sending someone to a place
  // that isn't actually marked. The venues that were "near Copperwood"
  // (The Hide Out Hilltop, Topsy Turvy Trims) keep their own confirmed
  // positions and are now described relative to Grand Central instead,
  // and the trunk-path edges that used Copperwood as a junction now
  // connect directly to Grand Central, which both screenshots confirm
  // as the real hub for this whole cluster.
  // Pulled from (88,52) to (68,40) — three independent reference frames
  // this session (all showing Copperwood/Grand Central/Oldtown together,
  // at three different zoom levels across two videos) consistently place
  // Oldtown only a modest distance southeast of Grand Central, not far
  // out toward the map's own east edge. This was very likely the actual
  // cause of "Grand Central looks stuck in the middle" — Oldtown (and
  // everything anchored to it below) was dragging the whole Hilltop
  // cluster's apparent centre far to the east of where it visually reads
  // on the real map, exactly the kind of over-wide spacing already fixed
  // once for the Downtown cluster. Every "near Oldtown" hidden venue
  // below shifted by the same delta (-20,-12) to stay clustered with it.
  { name:"Oldtown", kind:"district", x:"68%", y:"40%", info:"Hilltop. The festival's founding district, rebuilt uphill after Area 404's expansion. Rufus the Red and the Den of Dis Order are now declaring the separatist 'People's Republic of Oldtownia'." },
  { name:"Letsbe Avenue", kind:"district", x:"40%", y:"9%", info:"Downtown. The everyday high-street district, currently swept up in Patrick Kahn's new consumer product BLIP (Boomtown Lifestyle Important Product) — exclusive to status-holders called VIPPs." },
  { name:"Metropolis", kind:"district", x:"15%", y:"36%", info:"Downtown. A hyper-digital district run by Aurora Venturestone's Bettercorp™ media machine, where laid-off 'inGeniuses' now run risky, unofficial tours into a glitching Betterverse™." },
  { name:"Grand Central", kind:"stage", x:"66%", y:"30%", info:"Hilltop, alongside Thrutopia, Anara Forest and Oldtown. Boomtown's original main stage, relocated for Chapter Five's redesign — bands, hip hop and headline sets across the weekend." },
  // Moved from a guessed (93,38), up near Temple Valley Camping, to
  // (90,58) — the second reference video's own wide Copperwood/Grand
  // Central/Oldtown/Hilltop shot shows THE LION'S DEN's own glow right
  // next to QUANTUM, at the south end of the Hilltop zone, not up by the
  // camping field of a similar name. "Temple Valley" in the story text
  // below is Boomtown's own in-universe area name — evidently distinct
  // from "Temple Valley Camping" the camp field, despite the shared name.
  // Nudged again this session to (83,55) alongside the wider Oldtown
  // re-derivation above — same direction, modestly closer in.
  { name:"The Lion's Den", kind:"stage", x:"83%", y:"55%", info:"Its own third area — the Temple Valley amphitheatre — separate from both Downtown and Hilltop, as foretold by the Lion's Gate Portal at the last closing ceremony. Drum & bass, reggae and headline sets." },
  // Pulled from (28,34) — between Metropolis and Area 404 — to (9,39).
  // This session's reference video shows Hydro XL's own glowing stage
  // marker and label sitting clearly south-WEST of METROPOLIS's own
  // label, not east of it/toward Area 404 as the old position implied.
  // Nudged from (9,46) to (11,46) as part of the Metropolis/Area-404
  // corridor compression below (same 0.6 x-scale pivoted on Metropolis).
  { name:"Hydro XL", kind:"stage", x:"11%", y:"46%", info:"Downtown, alongside Area 404 and Botanica. New hydrogen-powered flagship stage for Chapter Five — one of the UK's first hydrogen-powered festival stages, built around house, techno and dance music." },
  // Pulled from (72,44) — south of Grand Central — to (75,22), then to
  // (85,22) this session. The y=22 already checked out well against two
  // frames; re-measuring x carefully against three Grand-Central-anchored
  // frames puts Anara consistently further east than 75 — the woodland
  // reads as further along toward Temple Valley Camping (also moved
  // east below) than a straight line up from Grand Central would suggest.
  { name:"Anara Forest", kind:"stage", x:"85%", y:"22%", info:"Hilltop edge. Formerly Psyforest, reborn as Anara Forest in 2025 — a 360° sound-and-visual stage where the story has runaways from Area 404 taking refuge. Bass-driven: jungle, reggae, bassline, UK garage, DnB and grime, with a beach-vibe sand floor." },
  // Nudged from y=8 to y=2 — this session's frame showing Hidden Woods,
  // Letsbe Avenue and Botanica all together shows Hidden Woods sitting a
  // clear gap further north of Letsbe Avenue, not almost level with it
  // (which is what happened once Letsbe Avenue's own y moved up to 9
  // during this pass's Downtown-cluster re-derivation).
  { name:"Hidden Woods", kind:"stage", x:"18%", y:"2%", info:"One of two woodland stages tucked among the trees, with its own beach bar and treetop walks. Leans eclectic bass and reggae/dub, often billing bigger DnB names alongside newer acts — explore carefully after dark." },
  // Pulled from (32,22) — east of Botanica's own (28,20) — to (23,24).
  // This session's reference video shows NEXUS's own glowing stage marker
  // sitting clearly WEST (and a bit south) of the BOTANICA label, not
  // east of it. "The Garden Centre" below (also "near Botanica") shifted
  // by the same delta to stay with it.
  { name:"NEXUS", kind:"stage", x:"23%", y:"22%", info:"Right in Botanica — its main stage, 'where nature connects', celebrating live music and the freshest names on the scene. The hip-hop, grime and garage side has previously pulled in names like Bashy, MJ Cole and Lady Leshurr." },
  // Corrected this session from a guessed (20,38) "alongside Metropolis" —
  // that guess was never actually visible on the map before now (GPS
  // silently overrode it, see the note above realStageMatch's removal),
  // so it had never been checked against real footage. Genuine official-
  // app frames this session (a video pan showing "QUANTUM" then, moving
  // south, a salmon/orange "HELIX" stage circle, then open field/services,
  // then THE LION'S DEN) place Helix clearly between Quantum and The
  // Lion's Den, not anywhere near Metropolis.
  { name:"Helix", kind:"stage", x:"78%", y:"52%", info:"Between Quantum and The Lion's Den, on the Hilltop side of the site. Breaks, big beat and bass-heavy line-up." },
  { name:"Meeting Point", kind:"meeting", x:"48%", y:"58%", info:"Your chosen meetup spot — set this with your group before you split up." }
];

// The other 11 official stages, plotted small — real names, illustrative
// positions (no verified coordinates for these, unlike the 15 pinned
// above). status matches the venueDirectory verification pass (see
// venueDirectory's Main stage entries): "confirmed" found real
// 2026-specific evidence, "rumoured" found only past-chapter evidence
// or nothing — rendered with a dashed/dimmed marker on the map.
const otherStages = [
  { name:"Spectrum 360", status:"confirmed", info:"A circular arena entirely enclosed in shipping containers, running 360° visuals with a broad electronic bill spanning UK garage through to gabber." },
  { name:"Tangled Roots", status:"confirmed", info:"A laid-back dub and roots stage with its own cocktail bar — confirmed for 2026 with a full Wed-Fri dub/roots programme (Lionpulse x Sinai, Roots Ginjah, DubTastic Music, Jam Jah Sound, An Dannsa Dub, Rompa's Reggae Shack) plus a Friday dubstep takeover." },
  { name:"Full Moon Ballroom", status:"confirmed", info:"A ballroom-themed stage — confirmed for 2026 running Wed-Sun (Mad Apple Circus, She's Got Brass, Girl in the Year Above, Grooveline, CLADA, Agbeko, Franz Von, PCHA); expect a mixed, dressed-up crowd and a more theatrical vibe than the bass-heavy stages." },
  { name:"Rose and Clown", status:"confirmed", info:"One of the site's smaller character-led stages — treat the name as the clue and expect an eclectic, party-focused bill." },
  { name:"The Fools Leap", status:"confirmed", info:"A smaller stage leaning into Boomtown's playful, circus-adjacent side — confirmed for 2026 running Wed-Sun (shunTA!, The Sneak Eazies, Shanghai Treason, Fraser Morgan, Scottish Fish, Nuala, Daraa Tribes)." },
  { name:"Foggers Mill", status:"confirmed", info:"An industrial/mill-themed stage — confirmed for 2026 running Wed-Sun (The Back Wood Redeemers, Gurt Dog, Got Worms, Two Days as a Chimp, Dog House Boat Boys, Toby Spin); follow the crowd and the smoke machines." },
  { name:"Hangar 161", status:"confirmed", info:"Punk's home at Boomtown — a proudly loud, socialist, anti-racist stage with a mosh-pit crowd." },
  { name:"Tribe of Frog", status:"confirmed", info:"Hosted by the long-running UK psytrance party brand of the same name — expect psytrance, full-on and progressive sets deep into the night, confirmed with a full 2026 lineup running Thu-Sun." },
  { name:"Síbín Beag", status:"confirmed", info:"Irish for 'little shebeen' — a folk and traditional-music stage blending trad sessions with folk-tinged party sets, confirmed with a full 2026 lineup." },
  { name:"Acid Leak", status:"confirmed", info:"Area 404's acid techno and hard techno stage — expect a darker, sweatier crowd and relentless 4/4." },
  { name:"Infinity", status:"confirmed", info:"A house, UK garage and queer-club stage — confirmed for 2026 with a ~25-artist bill on Boomtown's own lineup page (Desiato DJs, Rose Gray, I. JORDAN, Queer House Party, Dykes on Decks) plus a Paradisco-branded Queer House Party takeover." }
];

// Spectrum 360, Rose and Clown, Hangar 161 and Full Moon Ballroom
// repositioned near Area 404/Botanica/Letsbe Avenue per the video-
// confirmed "Downtown" cluster (see the district fix above); Acid Leak
// moved to sit by Area 404 per its own info text ("Area 404's acid
// techno... stage"); Tangled Roots moved to sit just west of Copperwood,
// where its own label appears on camera twice in the reference video.
// Infinity moved next to
// Metropolis — its own label appears right beside "METROPOLIS" on
// camera. Síbín Beag moved to sit by Oldtown — its own label appears
// there repeatedly on camera, alongside Mining for (g)Old Town and Den
// of Dis Order (both explicitly Oldtown-themed). Tribe of Frog moved
// from a guessed (72,66) — far southeast, in otherwise-empty ground —
// to (80,55): its own label appears on camera right next to OLDTOWN and
// QUANTUM, in the same wide shot as Grand Central and the yellow
// "HILLTOP" ground zone, not out on its own. Síbín Beag nudged from
// (86,58) to (85,46) — right on top of The Lion's Den's own (90,58)
// once that moved (see its own comment), the two labels visually
// collided; moved toward The Feckless Wrecked (92,48)/Trough Love
// (84,48) instead, still Oldtown-adjacent but with real separation.
// Tangled Roots (index 1) nudged to (51,14) — TWO independent reference-
// video frames this session (the original pass and a second video, same
// "COPPERWOOD HEIGHTS"/TANGLED ROOTS label pairing) both show Tangled
// Roots sitting northWEST of Copperwood with the north offset clearly
// bigger than the west one — not an even diagonal.
// Spectrum 360 (index 0) and Rose and Clown (index 3) corrected AGAIN
// this pass — the previous fix (north of Area 404) put them at (52,20)/
// (52,12), which put Spectrum 360 north of even NEXUS/Botanica once
// those got re-derived together (see the Downtown-cluster comment on
// the `locations` array above); a wider single frame this session
// showing NEXUS, Botanica, Metropolis, Area 404 and Spectrum 360 all
// together confirms Spectrum 360 sits south of NEXUS/Botanica, close to
// Area 404 — only slightly north of Area 404's own label, not miles
// north of the whole district. Rose and Clown stays north of Spectrum
// 360 (per the original video comparison) but now south of Botanica too.
// Tribe of Frog (index 7) pulled from (80,55) to (64,44) and Síbín Beag
// (index 8) from (85,46) to (65,34) — both re-derived alongside Oldtown's
// own big correction this session (see the `locations` array comment):
// three Grand-Central-anchored frames put Tribe of Frog much closer in
// (west+north of where it sat), consistent with it visibly sitting just
// west of Oldtown/Quantum in every frame rather than far out to their
// east. Síbín Beag shifted by the same delta as Oldtown to keep its own
// "near Trough Love/Feckless Wrecked" placement (see thingsToFind below).
// Hangar 161 (index 6) and Acid Leak (index 9) — both actually spotted
// on camera this session (a frame showing SPECTRUM 360/HANGER 161/
// DEVIANT LOUNGE/ACID LEAK/BBXL together), rather than the pre-session
// guesses they'd carried until now. Hangar 161's old guess (44,42)
// happened to already read close to right; Acid Leak's (54,26) — north
// of Area 404 — was backwards: the frame shows it clearly south of
// Area 404/Spectrum 360, not north.
// Full Moon Ballroom (index 2), The Fools Leap (index 4) and Foggers Mill
// (index 5) corrected this session from guessed placeholder positions
// that had NEVER actually rendered on the map before now — GPS silently
// overrode all three every time (see the note above realStageMatch's
// removal), so nobody could ever have checked them against real footage.
// Two independent genuine official-app frames this session show Full
// Moon Ballroom (a white dome/marquee) sitting south-west of "The Hide
// Out Hilltop", with Foggers Mill east of it across a gap, and Velvet
// Rope/Silver Swan Talent Agency/Topsy Turvy Twins in the same small
// cluster — moved both to sit either side of that cluster, near
// Copperwood Heights. The Fools Leap confirmed as the north end of
// Oldtown's western venue chain (Fools Leap -> Da Graaf's Reformatory ->
// La Luna Coven -> Buskers Wharf) — moved to sit just north of Da
// Graaf's Reformatory, in line with that chain, replacing a guess that
// had it far southeast in open ground near nothing.
// Síbín Beag (index 8) refined from (65,34) to (67,39) — THREE
// independent genuine official-app frames this session (screenshots and
// two separate videos) all agree on the same ordering down Oldtown's
// eastern venue chain: The Pomegranate Parlour -> Den of Dis Order ->
// Mining for (g)Old Town -> Síbín Beag -> The Feckless Wrecked. The old
// (65,34) sat almost on top of Den of Dis Order (63,34); moved south to
// sit between Mining for (g)Old Town (64,36) and The Feckless Wrecked
// (72,36), matching that confirmed order.
// Infinity (index 10) moved from (24,42) to (32,42) — a genuine frame
// shows it as a large orange circular stage east of the Metropolis
// chain (Memory Mart/Better You/BBXL Info/Distractoverse/E Numbers/
// Gabber Kebabber — see E Numbers/Gabber Kebabber's own comment above),
// not west of/inside that chain.
// Rose and Clown (index 3) moved from (52,26) to (35,20) on a
// validation pass this session — its own trunk-path edge to Botanica
// was 25 schematic units long, an implausible distance for what
// reference footage (vidCD) actually shows: Rose and Clown on
// Botanica's own east arc, in the same loop as Sub Lab/Nachtlicker, not
// out near Copperwood/Grand Central. Moved to sit in that loop.
// Spectrum 360 (index 0), Hangar 161 (index 6), Acid Leak (index 9) and
// Infinity (index 10) all nudged inward with the same 0.6 x-scale
// (pivoted on Metropolis at x=15) used for Area 404 and the Metropolis
// chain above — closing the "extremely large" reported gap between
// Metropolis and Area 404 without changing any venue's position
// relative to its own district cluster.
const minorStagePositions = [[37,32],[51,14],[62,26],[35,20],[58,29],[68,25],[30,43],[64,44],[67,39],[34,44],[25,42]];
const minorStages = otherStages.map((s, i)=>({
  name: s.name,
  info: s.info,
  status: s.status,
  x: minorStagePositions[i][0] + "%",
  y: minorStagePositions[i][1] + "%"
}));

// Named "things to find" — real hidden-venue and pop-up names pulled from
// past chapters' schedules and 2026 listings, positioned near the district
// their theme fits best. Boomtown deliberately never publishes exact
// locations for these, so treat every pin here as "go looking round here",
// not a surveyed spot — the same caveat as the plain "?" markers below.
const thingsToFind = [
  // Moved from a guessed "near Area 404" (46,26) — a genuine official-
  // app frame this session shows "BOOMTOWN BOBBIES" on Botanica's Letsbe
  // Avenue loop path, near Soapranos and Rose and Clown, not Area 404.
  { name:"The Boomtown Bobbies", near:"Botanica", x:"36%", y:"14%", info:"A mock police station hidden venue — seen on the official app's own map on Botanica's Letsbe Avenue loop path, near Soapranos and Rose and Clown, not Area 404 as an earlier guess assumed." },
  // Moved from a guessed "near Area 404" (54,34) — a clearer reference
  // video this session shows LUCK EXCHANGE labelled at the top of
  // Botanica's Letsbe Avenue loop path, right below Letsbe Avenue
  // itself, not in Area 404's own cluster.
  { name:"Luck Exchange Casino", near:"Botanica", x:"37%", y:"12%", info:"A casino-themed hidden venue on Botanica's Letsbe Avenue loop path — cards, chips and a party underneath the gambling dressing." },
  { name:"Botanica Zoo", near:"Botanica", x:"24%", y:"16%", info:"A character-led 'zoo' micro-venue inside Botanica — the theme is the clue, so follow the animal keepers and see where they lead." },
  { name:"The Garden Centre", near:"Botanica", x:"23%", y:"24%", info:"A garden-centre-fronted hidden venue fitting Botanica's plant-temple theme — good spot to ask locals about the Great Mother's ritual plans." },
  // Moved from a guessed "near Copperwood" (54,19) — a clearer reference
  // video this session shows HOTEL PARADISO labelled on Botanica's
  // Letsbe Avenue loop path, right by Postal Posse/Network Comms
  // Station, not near Copperwood at all.
  { name:"Hotel Paradiso", near:"Botanica", x:"30%", y:"15%", info:"A faded-glamour hotel-themed micro venue on Botanica's Letsbe Avenue loop path. Check in at the 'front desk'." },
  // Moved from a guessed "near Copperwood" (62,27) — a genuine official-
  // app frame this session shows "REELNEWS" at the east edge of the
  // Ancient Futures/Grand Central hub cluster, directly beside Sharing
  // Circles, near Spinney Hollow/The Giant Tree Circle/Twisted Time
  // Machine, not near Copperwood at all.
  { name:"Reel News", near:"Ancient Futures", x:"64%", y:"43%", info:"A newsreel/cinema-themed hidden spot, seen on the official app's own map at the east edge of the Ancient Futures/Grand Central cluster, beside Sharing Circles — not near Copperwood as an earlier guess assumed." },
  // Shifted by the same (-20,-12) delta as Oldtown's own re-derivation
  // this session, to stay clustered with it.
  { name:"Mining for (g)Old Town", near:"Oldtown", x:"64%", y:"36%", info:"An Oldtown hidden venue playing on the district's rebuild uphill and its separatist storyline — look for a mining/prospecting theme." },
  { name:"Cas's Costumes", near:"Oldtown", x:"72%", y:"44%", info:"A costume-shop-fronted micro venue fitting Oldtown's circus and rogues theme — worth a look if you want to dress into the story." },
  { name:"Soapranos Laundrette", near:"Letsbe Avenue", x:"36%", y:"10%", info:"A laundrette-fronted hidden venue — in 2025 it hosted dance-music DJ sets behind the washing machines. Look for the set dressing, not a normal stage entrance." },
  // Both corrected this session — a genuine official-app frame shows a
  // chain (Memory Mart, Better You(tm), BBXL Info, Distractoverse(tm), E
  // Numbers, Gabber Kebabber) running roughly north-south EAST of
  // Metropolis, with Infinity further east again — not west near Letsbe
  // Avenue as previously guessed (the venueDirectory copy of E Numbers
  // already said "near Metropolis", inconsistent with this entry's own
  // old "near Letsbe Avenue" — this was that drift, now resolved one way).
  // Four more names from that same confirmed chain, spotted on camera
  // this session but never added as their own pins until now — the gap
  // between Metropolis and Area 404 was reported as looking "extremely
  // large" with nothing in it; these were seen but not yet tracked,
  // exactly the detail needed to fill that space in.
  // This whole chain (through Sub Lab below) nudged inward with the same
  // 0.6 x-scale, pivoted on Metropolis's own (15,36), used for Area 404
  // and its cluster above — keeps every venue's position relative to
  // Metropolis and to each other exactly proportional, just compressed.
  { name:"Memory Mart", near:"Metropolis", x:"17%", y:"32%", info:"Seen labelled on the official app's own map east of Metropolis, north end of the E Numbers/Gabber Kebabber chain — no lineup or theme details sourced yet." },
  { name:"Better You", near:"Metropolis", x:"17%", y:"34%", info:"Seen labelled on the official app's own map east of Metropolis, in the same chain as Memory Mart — no lineup or theme details sourced yet." },
  { name:"BBXL Info", near:"Metropolis", x:"18%", y:"35%", info:"An info kiosk seen labelled on the official app's own map east of Metropolis — no further details sourced yet." },
  { name:"Distractoverse", near:"Metropolis", x:"19%", y:"36%", info:"Seen labelled on the official app's own map as a speckled ground zone east of Metropolis, tying into Metropolis's Bettercorp/Betterverse storyline — no lineup or theme details sourced yet." },
  { name:"E Numbers", near:"Metropolis", x:"19%", y:"38%", info:"A sweet-shop/E-numbers-themed party spot east of Metropolis, in a chain with Gabber Kebabber and Infinity." },
  { name:"Gabber Kebabber", near:"Metropolis", x:"22%", y:"40%", info:"Kebab-shop chaos paired with gabber and hardcore, east of Metropolis in the same chain as E Numbers." },
  { name:"Sub Lab", near:"Metropolis", x:"13%", y:"30%", info:"A laboratory-themed bass venue fitting Metropolis's tech aesthetic — expect a heavier, sub-driven sound than the district's main stage." },
  // Corrected this session from "near Metropolis" (19,38) — a frame
  // showing SPECTRUM 360/HANGAR 161/ACID LEAK/DEVIANT LOUNGE/BBXL all
  // together places Deviant Lounge clearly in the Area 404 cluster, not
  // over by Metropolis at all. The old "near Metropolis" guess predates
  // any video evidence for this one.
  { name:"Deviant Lounge", near:"Area 404", x:"32%", y:"48%", info:"A late-night lounge venue with an eclectic, after-hours bill — good for when the bigger stages start winding down." },
  // Newly spotted this session in the same frame as Spectrum 360/Hangar
  // 161/Acid Leak/Deviant Lounge — no other source found for what BBXL
  // stands for or what it programmes, so kept to what's visible.
  { name:"BBXL", near:"Area 404", x:"36%", y:"46%", info:"Seen labelled on the official app's own map in the Area 404 cluster, alongside Hangar 161/Acid Leak/Deviant Lounge — no lineup or theme details sourced yet." },
  // Moved from (86%,20%)/"Site-wide" — a user-supplied screenshot of the
  // official app's own map shows this labelled right inside the Oldtown
  // cluster, next to Mining for (g)Old Town and Den of Dis Order (both
  // just above), not out on its own. Placed within the cluster's own
  // already-re-derived footprint (see the Oldtown district pin's own
  // comment above) rather than recomputed from scratch — real surveyed
  // GPS independently agrees this venue sits close to that cluster too,
  // though its raw lat/lon-derived schematic position disagrees with the
  // video-calibrated one by a wide margin, the same GPS-vs-hand-drawn
  // mismatch already documented elsewhere in this file, so only the
  // relative placement is used here, not the raw GPS number.
  { name:"The Pomegranate Parlour", near:"Oldtown", x:"66%", y:"33%", info:"A parlour-style oddity with eclectic party DJs — a good stop wherever a district venue is doing something theatrical rather than a straight dancefloor. Seen on the official app's own map inside Oldtown, next to Mining for (g)Old Town." },
  // "near" corrected from "Site-wide" — a genuine reference frame this
  // session placed it in the same wooded cluster as Spinney Hollow/The
  // Magic Teapot/Ancient Futures, not an unplaced site-wide venue.
  { name:"Twisted Time Machine (Bad Apple Bar)", near:"Ancient Futures", x:"56%", y:"30%", info:"A themed bar/party room in the Ancient Futures/Grand Central cluster; 2025 listings ranged from emo and nu-metal to jungle disco and a 90s rave cave — expect a different fancy-dress theme by time slot." },
  // The following 10 were spotted as real named labels on the official
  // app's own map in the reference screen recording, but weren't in any
  // list here before this pass — no lineup/schedule data was sourced
  // for them, so info text stays to what's visible (name + district)
  // rather than inventing a theme or backstory this file can't confirm.
  // Positions are estimated from where each label sat in the recording
  // relative to its district, same "approximate, not surveyed" honesty
  // as everything else in this list.
  // Pulled from (78,50) to (73,50) this session — directly measured
  // (not just shifted by Oldtown's delta) against three Grand-Central-
  // anchored frames, since Quantum reads as its own separate area south
  // of Oldtown rather than a venue tucked inside Oldtown's own cluster.
  { name:"Quantum", near:"Oldtown", x:"73%", y:"50%", info:"Seen labelled on the official app's own map, near Oldtown/Temple Valley — no lineup or theme details sourced yet." },
  // Pulled from (20,30) — northeast of Metropolis — to (22,42), then to
  // (28,46) this session: findings_vidCD/vidE1/vidE2 all describe it as
  // sitting IN THE GAP BETWEEN Metropolis and Area 404 (south of both),
  // not tucked in next to Metropolis's own E Numbers/Gabber Kebabber
  // chain — moved to the midpoint of the now-compressed corridor.
  { name:"The Hide Out Downtown", near:"Metropolis", x:"28%", y:"46%", info:"Seen labelled on the official app's own map near Metropolis — also referenced in Boomtown's 2026 essential guide alongside the Chair-o-Plane ride." },
  { name:"Endor", near:"Metropolis", x:"14%", y:"38%", info:"Seen labelled (with its own coloured glow) on the official app's own map near Metropolis — no lineup or theme details sourced yet." },
  { name:"Mango", near:"Botanica", x:"24%", y:"20%", info:"Seen labelled on the official app's own map inside Botanica — no lineup or theme details sourced yet." },
  { name:"Karma Ceuticals", near:"Botanica", x:"30%", y:"24%", info:"Seen labelled on the official app's own map inside Botanica, near Botanica Zoo — no lineup or theme details sourced yet." },
  // These five (Trough Love through The Feckless Wrecked) all shifted by
  // the same (-20,-12) delta as Oldtown's own re-derivation this session
  // — they're small venues inside Oldtown's own building cluster, so they
  // move with it rather than getting independently re-measured.
  // Nudged from (67,37) to (63,36) this session — three independent
  // genuine official-app frames all show Trough Love in a small loop with
  // Postal Posse, sitting BETWEEN Oldtown's two venue chains (Fools Leap/
  // Da Graaf's/La Luna Coven/Buskers Wharf to the west, Pomegranate
  // Parlour/Den of Dis Order/Mining for (g)Old Town/Síbín Beag/The
  // Feckless Wrecked to the east), not out toward the east chain alone.
  // The "loop with Postal Posse" reasoning from this session's earlier
  // pass was withdrawn — a clearer reference video shows Postal Posse is
  // actually in Botanica, not Oldtown (see its own entry above). Trough
  // Love itself is still Oldtown-placed on its own separate evidence
  // (multiple frames show it labelled inside Oldtown's venue cluster),
  // just no longer paired with Postal Posse specifically.
  { name:"Trough Love", near:"Oldtown", x:"63%", y:"36%", info:"Seen labelled on the official app's own map as a fenced open-air enclosure (not a roofed building) inside Oldtown — no lineup or theme details sourced yet." },
  { name:"Da Graaf's Reformatory", near:"Oldtown", x:"60%", y:"32%", info:"Seen labelled on the official app's own map inside Oldtown — no lineup or theme details sourced yet." },
  { name:"La Luna Coven", near:"Oldtown", x:"62%", y:"38%", info:"Seen labelled on the official app's own map inside Oldtown — no lineup or theme details sourced yet." },
  { name:"The Common Ground", near:"Oldtown", x:"66%", y:"34%", info:"Seen labelled on the official app's own map inside Oldtown — no lineup or theme details sourced yet." },
  { name:"The Feckless Wrecked", near:"Oldtown", x:"72%", y:"36%", info:"Seen labelled on the official app's own map inside Oldtown, near Síbín Beag — no lineup or theme details sourced yet." },
  // Both newly spotted on a user-supplied screenshot of the official app's
  // own map, inside the Oldtown cluster. Den of Dis Order was already
  // tracked here as a story faction (see the characters data below) but
  // never had its own map pin — placed by the Mining for (g)Old Town/
  // Pomegranate Parlour end of the cluster, where the screenshot shows
  // it. Buskers Wharf placed at the cluster's southern edge, near La Luna
  // Coven, matching the same screenshot.
  { name:"Den of Dis Order", near:"Oldtown", x:"63%", y:"34%", info:"Rufus the Red's inner circle of circus hustlers, fortune tellers and rogues, running Oldtown's day-to-day chaos — seen labelled on the official app's own map inside Oldtown, next to Mining for (g)Old Town." },
  { name:"Buskers Wharf", near:"Oldtown", x:"60%", y:"42%", info:"Seen labelled on the official app's own map at the southern edge of Oldtown — no lineup or theme details sourced yet." },
  // Both spotted in the same reference-video pan as Sub Lab, strung
  // along the same footpath just south of it — Loconnection has no
  // lineup data sourced yet; Nachtlicker already had a genre/lineup
  // entry in venueDirectory below but was missing its own map pin.
  { name:"Loconnection", near:"Metropolis", x:"12%", y:"33%", info:"Seen labelled on the official app's own map on the same path as Sub Lab, just south of it — no lineup or theme details sourced yet." },
  { name:"Nachtlicker", near:"Metropolis", x:"13%", y:"37%", info:"Curated nocturnal-rave/punk-theatre night — confirmed back for 2026 (Shaggy FX, SIÂNAGEDDON, THEO SHELDRAKE, Militant Music, GOFF ft BABY SOL). Seen on the official app's own map just south of Sub Lab and Loconnection." },
  // Spotted clustered together in the second reference video, described
  // at the time as "right by THE RETREAT and ANCIENT FUTURES (Thrutopia)"
  // — corrected from an earlier "Downtown Village" guess to (47,22)/
  // (48,20)/(45,24) on that basis. That description turned out to be its
  // own mistake: Ancient Futures' OWN position got corrected in a later
  // pass (see thingsToFind's Ancient Futures entry below) once real
  // surveyed GPS in js/boomtown-locations-2026.js placed it near Grand
  // Central, not Thrutopia — and these three have real GPS matches of
  // their own ("RebelGirlsClub", "TinkerStation", the "Circus"/"Circus
  // Tent" id/label mismatch below) that cluster at (51,39)/(53,35)/
  // (52,40), right next to that corrected Ancient Futures position, NOT
  // near The Retreat's own hand-placed (60,12). Moved to match; The
  // Retreat's own landmark entry corrected the same way below.
  { name:"Rebel Girls Club", near:"Ancient Futures", x:"51%", y:"39%", info:"Women-led wellbeing/empowerment venue — confirmed for 2026. Real surveyed GPS puts it right by Ancient Futures/Grand Central, not the Thrutopia hilltop this session's earlier guess assumed." },
  { name:"Tinker Station", near:"Ancient Futures", x:"53%", y:"35%", info:"Seen labelled on the official app's own map right by Ancient Futures — no lineup or theme details sourced yet. Real surveyed GPS confirms this is near Grand Central, not Thrutopia." },
  { name:"Circus", near:"Ancient Futures", x:"52%", y:"40%", info:"Seen labelled on the official app's own map right by Ancient Futures — no lineup or theme details sourced yet. Real surveyed GPS (filed as \"Circus Tent\") puts it near Grand Central, not Thrutopia — possibly the same real venue as venueDirectory's own separate \"Circus Tent\" entry, kept distinct here since that's unconfirmed." },
  // Corrected this session: two independent reference-video frames (both
  // the original pass and this session's second video, same "COPPERWOOD
  // HEIGHTS" wide shot) show THE HIDE OUT HILLTOP's own label sitting
  // clearly EAST of Copperwood Heights' label, roughly the same latitude
  // (barely north) — not south of it as the previous guess assumed.
  // Distinct from the already-plotted "The Hide Out Downtown" up by
  // Metropolis. "near" updated from Copperwood to Grand Central —
  // Copperwood's own map pin was removed (see its comment above), and
  // Grand Central is the confirmed real hub for this cluster.
  { name:"The Hide Out Hilltop", near:"Grand Central", x:"66%", y:"21%", info:"Seen labelled on the official app's own map north of Grand Central — no lineup or theme details sourced yet." },
  // Odd gap this pass turned up: Ancient Futures already has a full
  // Wed-Sun workshop schedule, a venueDirectory entry and its own cluster
  // of amenity markers (Top-Up Point/Photobooth/Food x2/Welfare/First Aid,
  // all noted "Ancient Futures" below) — but no pin of its own here, so it
  // never actually showed up on the map. Clearly labelled, large text, in
  // this session's own reference video, cascading into "GAMES"/"CRAFTS"
  // labels alongside it — that pan segment sat right after Copperwood/
  // Grand Central/Hilltop, not the earlier Letsbe Avenue/Botanica/
  // Thrutopia segment, so x/y below is placed near Grand Central rather
  // than the (56,16) Thrutopia hilltop the Rebel Girls Club/Tinker
  // Station/Circus entries above originally assumed (since corrected to
  // match, per their own comment).
  //
  // js/boomtown-locations-2026.js does have real surveyed GPS for this
  // one ("AncientFutures") that happens to land close to this same video-
  // based estimate — but thingsToFind's render loop deliberately does NOT
  // use that real-match override (schematicToLatLon() only, see the
  // render code below), because checking it against the other 7
  // thingsToFind entries with a real-match found some landing 17-60
  // schematic units from their video-placed position (e.g. "The
  // Pomegranate Parlour" 60 units off) — the video is more trustworthy
  // than that auto-scraped GPS for this whole category, so x/y here is
  // the actual position used, not a fallback.
  { name:"Ancient Futures", near:"Grand Central", x:"59%", y:"40%", info:"Future-facing talks and workshops — confirmed for 2026 with a full dated Wed-Fri programme (breathwork, sound baths, ecstatic dance, opening/closing ceremonies). Seen on the official app's own map near Grand Central/Hilltop, not the Thrutopia hilltop." },
  // Craft Tent and Games Lounge — same gap as Ancient Futures above (full
  // schedule/venueDirectory entries, never actually pinned). Both seen as
  // short "CRAFTS"/"GAMES" labels cascading southeast from Ancient
  // Futures in this session's own reference video, so placed just
  // southeast of it here too. Games Lounge's venueDirectory entry below
  // previously guessed "near Pepperpot Market" with no coordinate of its
  // own — corrected to match, since it never had a video-sourced position
  // before this.
  { name:"Craft Tent", near:"Grand Central", x:"61%", y:"43%", info:"Craft-making workshops and stalls — confirmed for 2026 with a full daily programme Wed-Fri, 10:00-18:00. Seen on the official app's own map just southeast of Ancient Futures." },
  { name:"Games Lounge", near:"Grand Central", x:"60%", y:"42%", info:"Games and downtime area away from the stages. Seen on the official app's own map just southeast of Ancient Futures, between it and Craft Tent — corrected from an earlier unsourced 'near Pepperpot Market' guess." },
  // XR and Circus Tent — both confirmed in venueDirectory (full dated
  // programme for XR; genre/type only for Circus Tent) but never pinned
  // anywhere on the map, same gap Ancient Futures/Craft Tent/Games Lounge
  // had. Both have real surveyed GPS in js/boomtown-locations-2026.js
  // ("XR" and "Circus" — the latter labelled "Circus Tent" there, an
  // id/label mismatch against this file's own separate "Circus" entry
  // above; likely the same real venue, kept as two pins near each other
  // rather than guessing which name is more correct). XR's real point is
  // its own distinct spot near Anara Forest, not the Ancient Futures
  // cluster the other three moved to.
  { name:"XR", near:"Anara Forest", x:"70%", y:"50%", info:"Extinction Rebellion-linked space — confirmed for 2026, running Wed-Fri (Cassandra the Oracle, Big Oil Drumming Parade, Last Chance Salon, Art Blocking). Real surveyed GPS puts it near Anara Forest/Hilltop, not Thrutopia." },
  { name:"Circus Tent", near:"Ancient Futures", x:"53%", y:"41%", info:"Performance-led circus venue — confirmed for 2026. Real surveyed GPS puts it right by Ancient Futures/Grand Central, not Oldtown — possibly the same real venue as this list's own \"Circus\" entry, kept as a separate nearby pin since that's unconfirmed." },
  // A full sweep of every venueDirectory entry against js/boomtown-
  // locations-2026.js's real GPS turned up 9 more "lineup-match" (highest
  // confidence — appeared in a real schedule listing) matches for
  // confirmed venues that had never been pinned anywhere, same gap as
  // Ancient Futures/XR/Circus Tent above. Five land in the same Ancient
  // Futures/Grand Central cluster those three already moved to:
  { name:"Energy Garden", near:"Ancient Futures", x:"56%", y:"35%", info:"Sustainable-energy themed space — confirmed for 2026 with a full dated workshop programme Wed-Fri. Real surveyed GPS puts it by Ancient Futures/Grand Central, not Thrutopia." },
  { name:"Climate Live", near:"Ancient Futures", x:"48%", y:"38%", info:"Climate talks and programming — confirmed for 2026 with a full dated workshop programme Wed-Fri. Real surveyed GPS puts it by Ancient Futures/Grand Central, not Thrutopia." },
  { name:"The Magic Teapot", near:"Ancient Futures", x:"54%", y:"37%", info:"Tea-themed chill spot and cafe. Real surveyed GPS puts it by Ancient Futures/Grand Central, not Thrutopia." },
  { name:"Cocaine Anonymous", near:"Ancient Futures", x:"61%", y:"44%", info:"On-site 12-step support meeting — explicitly named as a 2026 welfare partner on Boomtown's own Chapter Five safety page. Real surveyed GPS puts it right by Craft Tent/Ancient Futures, not Pepperpot Market/Thrutopia." },
  { name:"Spinney Hollow", near:"Ancient Futures", x:"54%", y:"45%", info:"Small grove venue tucked into wooded ground. Real surveyed GPS puts it by Ancient Futures/Grand Central, not the guessed Anara Forest/Hidden Woods woodland edge." },
  // Three more cluster together further southeast, right by XR — a
  // second, distinct "Thrutopia-branded content actually sits near
  // Anara Forest/Hilltop" pocket rather than the Ancient Futures one.
  { name:"Hapitat", near:"Anara Forest", x:"71%", y:"49%", info:"Wellbeing/habitat-themed space — confirmed for 2026 with a full daily programme Wed-Fri, 10:00-18:00, alongside The Retreat. Real surveyed GPS puts it by Anara Forest/Hilltop, right next to XR — not up on the Thrutopia hilltop with The Retreat as its own info text assumed." },
  { name:"Crafty Rascals", near:"Anara Forest", x:"69%", y:"50%", info:"Family/kids craft activities — confirmed for 2026 with a full daily programme Wed-Fri, 10:00-18:00. Real surveyed GPS puts it by Anara Forest/Hilltop, right next to XR/Hapitat, not Thrutopia." },
  { name:"Permaculture", near:"Anara Forest", x:"66%", y:"49%", info:"Growing and permaculture talks — confirmed for 2026 with a full dated workshop programme Wed-Fri. Real surveyed GPS puts it by Anara Forest/Hilltop, not the Thrutopia hilltop." },
  // Topsy Turvy Trims' real match is a genuine outlier — nowhere near
  // Oldtown (the thematic guess its own info text was built on: "fits
  // Oldtown's topsy-turvy rebuild"), instead landing by Botanica/
  // Metropolis on the map's west side. Still a "lineup-match" (same
  // confidence tier as everything else moved this pass), so trusted over
  // the thematic guess rather than discarded — Boomtown's own venue
  // theming doesn't always match its physical district.
  // Moved from a guessed "near Botanica" (29,32) — a genuine official-
  // app frame this session shows it in the wooded Hilltop camping area
  // northeast of Grand Central, west/southwest of The Hide Out Hilltop,
  // beside a "Wet Factory" label — not near Botanica/Metropolis at all.
  { name:"Topsy Turvy Trims", near:"Grand Central", x:"63%", y:"24%", info:"Barbershop/salon-themed spot, seen on the official app's own map in the wooded Hilltop camping area northeast of Grand Central, near The Hide Out Hilltop — not Botanica/Metropolis as an earlier guess assumed." },
  // Postal Posse — real match is the one lower-confidence "camelcase-
  // split" source in this batch (same tier as The Retreat's own match
  // above) and sits well isolated from every other plotted point (21+
  // schematic units from Pepperpot Market, its nearest neighbour) rather
  // than corroborating an existing cluster the way the others do —
  // flagged accordingly rather than presented with the same confidence.
  // Corrected this session from (40,71)/"near Pepperpot Market" — that
  // position came from raw scraped GPS ("Real surveyed GPS puts it..."),
  // exactly the kind of position this session's fix removed from map
  // rendering. Genuine official-app footage instead shows Postal Posse
  // in a small loop path with Trough Love, sitting between Oldtown's two
  // venue chains — moved there instead.
  // Corrected AGAIN this session — the previous fix (this session's
  // earlier pass) put it near Oldtown "in a loop with Trough Love",
  // based on a less certain read of a small chip label in that cluster.
  // A new, much clearer reference video (someone typing "thrutopia" into
  // the official app's search bar and panning the whole site) shows
  // "POSTAL POSSE" unambiguously labelled on the Letsbe Avenue loop path
  // INSIDE BOTANICA, right next to Hotel Paradiso/Network Comms Station/
  // The Daily Rag/Luck Exchange — not Oldtown at all. Its own info text's
  // "tied to Botanica's postal-worker subplot" always pointed this way;
  // moved to match. Hotel Paradiso and Luck Exchange Casino (previously
  // guessed "near Copperwood"/"near Area 404") moved into this same
  // Botanica/Letsbe Avenue loop cluster for the same reason.
  { name:"Postal Posse", near:"Botanica", x:"33%", y:"16%", info:"Character-led micro world tied to Botanica's postal-worker subplot — confirmed operating across all 2026 festival dates, programming DJs from noon to 2am daily around its giant post box and letter-writing stations. Seen on the official app's own map on Botanica's Letsbe Avenue loop path, next to Hotel Paradiso and Network Comms Station." }
];

// A handful of plain, unnamed markers — a reminder that the 50+ hidden
// venues massively outnumber the named ones above, so there's always
// more to stumble on beyond this list.
const secretSpots = [
  { x:"36%", y:"58%" }, { x:"64%", y:"32%" }, { x:"48%", y:"76%" }
];

// Real, confirmed non-stage landmarks worth marking — food hub, wellness
// space, welfare/practical infrastructure and the 2026 academic research
// partnership — positioned close to where the festival's own info places
// them. Toggle these on/off with the "Landmarks" chip above the map.
const landmarks = [
  { name:"Pepperpot Market", x:"46%", y:"50%", info:"A reliable food-and-drink hub roughly central to the site, also home to one of the two 24-hour medical centres and the Safer Spaces welfare team.", hours:"Medical centre & welfare: 24 hours." },
  // Pulled from (60,12) to (55,30) — real surveyed GPS in
  // js/boomtown-locations-2026.js ("TheRetreat") lands right by the same
  // Ancient Futures/Rebel Girls Club/Tinker Station cluster those three
  // got corrected to nearby, not up on the Thrutopia hilltop this
  // session's earlier guess (and the video description that originally
  // placed Rebel Girls Club "right by The Retreat") assumed. Kept the
  // "Thrutopia woodlands" wording in its own info text below — that's
  // Boomtown's own branding for the space, not a claim about exactly
  // where the district polygon sits on this schematic map.
  { name:"The Retreat", x:"55%", y:"30%", info:"Boomtown's paid spa space in the Thrutopia woodlands — spa/hot-tub sessions, sauna and cold splash, sound baths and massages. Book ahead; it's separate from your festival ticket." },
  { name:"The Observatory", x:"52%", y:"14%", info:"New for 2026 — a genuine academic research hub embedded in the festival, led by psychologist Dr Martha Newson with researchers from 10+ UK universities studying identity, belonging and collective behaviour at live events. Take part in a study or the before/after survey if you're curious." },
  { name:"Lion's Gate Portal", x:"81%", y:"53%", info:"The story's central portal art piece near the Lion's Den — last chapter's closing ceremony used it to foretell the Lion's Den's return to Temple Valley this year." },
  { name:"Medical Centre — Hilltop", x:"72%", y:"50%", info:"One of two confirmed 24-hour medical centres for Chapter Five (the other is at Pepperpot Market).", hours:"24 hours." },
  { name:"Public Transport Hub", x:"6%", y:"42%", info:"Near West Gate — coach, shuttle and accessible-transport drop-off/pick-up point." },
  { name:"Lockers — Hidden Woods", x:"14%", y:"12%", info:"One of the confirmed 2026 locker locations, alongside Thrutopia, the Lion's Den/Orchid area and Downtown Village." },
  { name:"Lockers — Thrutopia", x:"58%", y:"10%", info:"Locker point in the Thrutopia woodlands." },
  // The Hidden Woods locker's own info text above names FOUR confirmed
  // 2026 locker locations, but only two (Hidden Woods, Thrutopia) ever
  // got plotted — this is the "Lion's Den/Orchid area" one. Placed at
  // The Lion's Den itself rather than Camp Orchid Downtown (the other
  // half of that ambiguous source label) since it's the more specific,
  // already-confirmed anchor point of the two.
  { name:"Lockers — The Lion's Den", x:"82%", y:"54%", info:"One of the confirmed 2026 locker locations (the source only says \"the Lion's Den/Orchid area\" — placed here as the more specific of the two)." },
  { name:"Amnesty Points — West Gate", x:"5%", y:"50%", info:"Dispose of anything prohibited before you're searched, no questions asked — every gate has one." },
  { name:"Charge Candy — Pepperpot Market", x:"50%", y:"52%", info:"One of six confirmed phone-charging points dotted across the site." },
  // Seen labelled on the official app's own map as a large dark-green
  // block of woodland/hillside immediately southwest of Metropolis,
  // spanning a wide chunk of that side of the site — a real protected-
  // land designation rather than a festival feature, so it's marked
  // here as a single reference label rather than guessed as a POI.
  { name:"Site of Special Scientific Interest", x:"7%", y:"40%", info:"Protected woodland/hillside bordering Metropolis on the site's western edge — seen labelled on the official app's own map. Not a festival area; treat it as off-limits terrain, not a place to explore." },
  // A large yellow-ground zone labelled "HILLTOP" on the official app's
  // own map, between Copperwood and Oldtown/Temple Valley Camping — a
  // real mapped terrain area, not just the "Hilltop." prefix already
  // used in several district info texts (Thrutopia/Copperwood/Oldtown).
  // Shown with a warning-triangle icon in the reference video, next to
  // a dotted/hatched ground texture suggesting a car park or overflow
  // field rather than a walkable venue area — marked as a reference
  // label for the same reason SSSI is, not guessed as a POI.
  { name:"Hilltop", x:"74%", y:"30%", info:"A large marked ground area between Copperwood and Oldtown/Temple Valley Camping, seen labelled on the official app's own map — likely an overflow/car park field given its hatched ground texture on camera, not a confirmed venue area." },
  // Seen labelled at the south end of the Hilltop zone, right by Quantum
  // and The Lion's Den, in the same shot used to reposition both.
  // Nudged from (75,62) to (68,58) alongside Quantum/The Lion's Den's own
  // re-derivation this session, to stay "right by" both as its own info
  // text says.
  { name:"Sunset Hill", x:"68%", y:"58%", info:"Seen labelled on the official app's own map at the south end of the Hilltop zone, right by Quantum and The Lion's Den — no further details sourced yet." }
];

// Named camping fields & gates, positioned from a real (previous-year)
// site map you shared — general site geography like this tends to carry
// over year to year even when the in-city venues get redesigned.
const campLabels = [
  { x:"14%", y:"7%", text:"West Camping" },
  { x:"5%", y:"35%", text:"Downtown Camping" },
  { x:"7%", y:"58%", text:"Meadow Camping (Accessible)" },
  // Seen labelled separately from "Meadow Accessible Camp" in a whole-
  // map reference screenshot — two distinct adjacent fields, not one.
  { x:"10%", y:"58%", text:"Meadow Living" },
  { x:"48%", y:"4%", text:"Valley Camping" },
  { x:"70%", y:"6%", text:"Tangerine Fields" },
  { x:"86%", y:"14%", text:"Campervan Field" },
  // Pulled from (85,32) to (85,18), then to (95,18) this session — the
  // y already checked out well against three frames; re-measuring x
  // against the same Grand-Central-anchored frames puts it further east,
  // closer to East Gate (96,32), consistent with sitting right at the
  // site's eastern edge alongside Campervan Field.
  { x:"95%", y:"18%", text:"Temple Valley Camping" },
  { x:"91%", y:"48%", text:"East Camping" },
  { x:"95%", y:"64%", text:"Quiet Camping" },
  { x:"9%", y:"39%", text:"Camp Orchid Downtown (premium, public transport)" },
  { x:"75%", y:"22%", text:"Camp Skylark Hilltop (premium)" },
  // Pulled up from (74,87) — that put a 25+ schematic-unit gap between
  // Sunset Hill (75,62, the nearest already-plotted feature to the
  // north) and this field, reading as a stranded outpost even after the
  // gate spoke path was added to connect it. Compressed the whole south
  // end (Camp Skylark Sunset/South Gate/White Carpark 4) into roughly
  // half that gap instead, keeping the same north-south order.
  { x:"74%", y:"72%", text:"Camp Skylark Sunset (premium)" },
  // Newly spotted in this session's own reference video, clearly legible
  // right beside Camp Orchid Downtown's own label, just south of the
  // Downtown district triangle near West Gate — placed adjacent to
  // Downtown Camping/Camp Orchid Downtown since that's where it appeared
  // on camera. Unclear whether it's a genuinely distinct field or the
  // real name behind the existing "Downtown Camping" guess — kept as its
  // own entry rather than overwriting that one, since both labels were
  // visible on screen at once.
  { x:"4%", y:"37%", text:"Camplight" }
];

// Amenity markers (toilets, food, bars, water, welfare, etc.) — replaced
// a straight dump of js/boomtown-locations-2026.js's 53 real-GPS POI
// points (see that file's own header: extracted from the official app's
// live map data) after repeated reports that the icons "don't seem to be
// in the right positions". Those positions were never actually wrong —
// they're real surveyed coordinates — but this map's districts/camps/
// paths are ALL hand-placed schematic guesses from the reference video,
// on a completely different calibration, so real GPS markers kept
// landing in the gaps between the illustrated zones instead of on them.
// Hand-placing these on the same schematic system everything else uses
// fixes the mismatch for good, at the cost of only covering the clusters
// actually visible in specific reference-video frames rather than all 53
// real points — each entry below notes which frame/area it's from.
// Kept js/boomtown-locations-2026.js itself untouched as reference data
// (no longer used to place anything — see the note above SITE_SW/SITE_NE —
// just stopped rendering its POI list directly).
// Amenity markers now come only from the canonical authoring document. Their
// category and note retain the existing marker icon, ring colour and card text.
const amenities = (()=> MAP_SYSTEM_DOCUMENT.objects
  .filter(object=> object.metadata.mapRole === "amenity")
  .map(object=> ({
    category: object.metadata.category,
    x: `${object.position.x}%`,
    y: `${object.position.y}%`,
    note: object.metadata.description
  })))();

// The first live renderer migration: gates now come only from the canonical
// authoring document. Keep this adapter deliberately small; it preserves the
// legacy marker shape while removing the duplicate hard-coded gate collection.
const gates = (()=>{
  if(!MAP_SYSTEM_DOCUMENT || !Array.isArray(MAP_SYSTEM_DOCUMENT.objects)){
    throw new Error("Greebtown map authoring data failed to load");
  }
  return MAP_SYSTEM_DOCUMENT.objects
    .filter(object=> object.type === "entrance" || object.type === "exit")
    .map(object=> ({
      name: object.name,
      x: `${object.position.x}%`,
      y: `${object.position.y}%`,
      info: object.metadata.description,
      hours: object.metadata.hours || ""
    }));
})();

// The White Carparks — the reference video shows a large grid-lined grey
// car park field on the site's east/south-east edge, next to (not part
// of) the camping fields, matching the "White Carparks"/"White Carpark 4"
// East Gate and South Gate already name in their own info text above.
// Positioned near those two gates rather than guessed elsewhere on site.
const parkingAreas = [
  { x:"97%", y:"38%", r:10, text:"White Carparks (East Gate)" },
  // Pulled up from y:86 to y:71 alongside South Gate/Camp Skylark Sunset.
  { x:"80%", y:"71%", r:8, text:"White Carpark 4 (South Gate)" }
];

// ===============================
// FULL VENUE DIRECTORY — every named stage, hidden venue, shop, workshop
// and support space we could source, marked confirmed vs rumoured.
// "Confirmed" = appeared in Boomtown's own 2026 lineup/schedule tool or
// official site copy. "Rumoured" = seen in a past chapter or fan account
// but with no 2026 evidence found — treat as a lead, not a promise.
// ===============================
const venueDirectory = [
  { name:"Grand Central", type:"Main stage", status:"confirmed", music:true, genre:"Bands, hip hop, headline sets", near:"Hilltop", info:"Boomtown's original flagship stage, relocated to Hilltop for Chapter Five's redesign." },
  { name:"The Lion's Den", type:"Main stage", status:"confirmed", music:true, genre:"Drum & bass, reggae, headliners", near:"Temple Valley (its own area)", info:"Back in the Temple Valley amphitheatre — its own third area, separate from Downtown and Hilltop — as foretold by the Lion's Gate Portal." },
  { name:"Hydro XL", type:"Main stage", status:"confirmed", music:true, genre:"House, techno, dance", near:"Downtown", info:"New hydrogen-powered flagship stage — one of the UK's first — in Downtown." },
  { name:"Anara Forest", type:"Main stage", status:"confirmed", music:true, genre:"Jungle, reggae, bassline, UK garage, DnB, grime", near:"Hilltop edge", info:"Formerly Psyforest; 360° sound-and-visual stage on the Hilltop edge with a sand floor." },
  { name:"Hidden Woods", type:"Main stage", status:"confirmed", music:true, genre:"Eclectic bass, reggae, dub", near:"Woodland edge", info:"Woodland stage with its own beach bar and treetop walks." },
  { name:"NEXUS", type:"Main stage", status:"confirmed", music:true, genre:"Live music, hip hop, grime, garage", near:"Botanica", info:"Botanica's main stage — 'where nature connects'; past bills included Bashy, MJ Cole, Lady Leshurr." },
  { name:"Helix", type:"Main stage", status:"confirmed", music:true, genre:"Breaks, big beat, bass", near:"Metropolis", info:"One of Metropolis-side's bass-heavy stages." },
  { name:"Spectrum 360", type:"Main stage", status:"confirmed", music:true, genre:"UK garage through to gabber, 360° visuals", near:"Area 404", info:"A circular arena entirely enclosed in shipping containers — Boomtown's main queer stage. Its 2026 DJ competition (for trans/non-binary/GNC DJs playing 13 Aug) confirms it for Chapter Five." },
  { name:"Tangled Roots", type:"Main stage", status:"confirmed", music:true, genre:"Dub, roots", near:"Unclear", info:"Laid-back stage with its own cocktail bar — confirmed for 2026 with a full Wed-Fri dub/roots programme (Lionpulse x Sinai, Roots Ginjah, DubTastic Music, Jam Jah Sound, Rompa's Reggae Shack) and a Friday dubstep takeover." },
  { name:"Full Moon Ballroom", type:"Main stage", status:"confirmed", music:true, genre:"Ballroom, eclectic", near:"Unclear", info:"A dressed-up, theatrical crowd rather than a straight dancefloor — confirmed for 2026 running Wed-Sun (Mad Apple Circus, She's Got Brass, Girl in the Year Above, Grooveline, CLADA, Agbeko)." },
  { name:"Rose and Clown", type:"Main stage", status:"confirmed", music:true, genre:"Eclectic, party", near:"Unclear", info:"Smaller character-led stage run by Gorilla Tactics — a 2026 lineup-drop post and Boomtown 2026 set-time listings confirm its Chapter Five return." },
  { name:"The Fools Leap", type:"Main stage", status:"confirmed", music:true, genre:"Playful, circus-adjacent", near:"Oldtown", info:"Good for stumbling on something odd and fun — confirmed for 2026 running Wed-Sun (shunTA!, The Sneak Eazies, Shanghai Treason, Fraser Morgan, Scottish Fish, Nuala, Daraa Tribes)." },
  { name:"Foggers Mill", type:"Main stage", status:"confirmed", music:true, genre:"Industrial-themed, genre varies", near:"Unclear", info:"Follow the crowd and the smoke machines — confirmed for 2026 running Wed-Sun (The Back Wood Redeemers, Gurt Dog, Got Worms, Two Days as a Chimp, Dog House Boat Boys, Toby Spin)." },
  { name:"Hangar 161", type:"Main stage", status:"confirmed", music:true, genre:"Punk", near:"Unclear", info:"Last Gang's proudly loud, socialist, anti-racist stage with a mosh-pit crowd — its own account posted 'BOOMTOWN 2026! Hangar 161, see you there' confirming its Chapter Five return." },
  { name:"Tribe of Frog", type:"Main stage", status:"confirmed", music:true, genre:"Psytrance, full-on, progressive", near:"Unclear", info:"Hosted by the long-running UK psytrance party brand of the same name — confirmed with a full 2026 lineup running Thursday through Sunday." },
  { name:"Síbín Beag", type:"Main stage", status:"confirmed", music:true, genre:"Folk, traditional", near:"Unclear", info:"Irish for 'little shebeen' — trad sessions and folk-tinged party sets, confirmed with a full 2026 Boomtown lineup; also runs as its own venue at Shambala." },
  { name:"Acid Leak", type:"Main stage", status:"confirmed", music:true, genre:"Acid techno, hard techno", near:"Area 404", info:"Area 404's darker, sweatier 4/4 stage." },
  { name:"Infinity", type:"Main stage", status:"confirmed", music:true, genre:"House, UK garage, queer club", near:"Unclear", info:"Confirmed for 2026 with a ~25-artist bill on Boomtown's own lineup page (Desiato DJs, Rose Gray, I. JORDAN, Queer House Party, Dykes on Decks) plus a Paradisco-branded Queer House Party takeover." },
  { name:"The Observatory", type:"Research hub", status:"confirmed", music:false, genre:"—", near:"Thrutopia (likely)", info:"Genuine 2026 academic study led by Dr Martha Newson, 10+ UK universities — real research, not story canon." },
  { name:"The Boomtown Bobbies", type:"Hidden venue", status:"confirmed", music:true, genre:"DJs, live takeovers", near:"Botanica", info:"Long-running mock police station — confirmed for 2026 with a full Thu-Sun DJ programme. Seen on the official app's own map on Botanica's Letsbe Avenue loop path." },
  { name:"Soapranos Laundrette", type:"Hidden venue", status:"confirmed", music:true, genre:"Dance/house DJs", near:"Letsbe Avenue", info:"Laundrette-fronted micro venue on Letsbe Avenue's high street — confirmed for 2026 with a full Thu–Sun DJ programme including Laundry Night Live and Soapranos: Hotwash!" },
  { name:"Hotel Paradiso", type:"Hidden venue", status:"confirmed", music:true, genre:"Eclectic, lounge", near:"Botanica", info:"Faded-glamour hotel-themed micro venue on Botanica's Letsbe Avenue loop path — confirmed returning for 2026 ('Hotel on Wheels') with a full Thu–Sat lounge/DJ programme; check in at the 'front desk'." },
  { name:"Luck Exchange Casino", type:"Hidden venue", status:"confirmed", music:false, genre:"Game-show / comedy", near:"Botanica", info:"Casino-themed venue on Botanica's Letsbe Avenue loop path — confirmed for 2026, but it's a game-show format rather than DJ sets: short comedy/game segments (Chattering Teeth Races, Play Your Cards Shite, Beyblade Tournament, Is It Piss?, TOYBOX)." },
  { name:"The Garden Centre", type:"Shop / hidden venue", status:"confirmed", music:true, genre:"Chill, eclectic", near:"Botanica", info:"Garden-centre-fronted spot fitting Botanica's plant-temple theme — confirmed for 2026 (Funkmaster General, Redpeppa, Rodderz, Dovetail, plus a Diversion Audio takeover)." },
  { name:"Botanica Zoo", type:"Hidden venue", status:"confirmed", music:true, genre:"Jungle, hardcore, breaks, UK garage, bass", near:"Botanica", info:"Feral, animal-led 'anarcho-squat zoo' venue — 2026 event listings (Killa P, DJ Hybrid, 14 Aug) and its own 'just over 2 weeks til Boomtown' July 2026 post confirm it's back for Chapter Five." },
  { name:"The Immortal Children of the Eternal Seed", type:"Hidden venue", status:"confirmed", music:true, genre:"Ritual, ambient/eclectic", near:"Botanica", info:"Botanica-flavoured cult/ritual-themed micro venue — confirmed for 2026, running Thu-Sat (Loose Forms takeover, Kritical Mass, Safe N Sound)." },
  { name:"Topsy Turvy Trims", type:"Shop / hidden venue", status:"confirmed", music:true, genre:"Barbershop novelty, party", near:"Grand Central", info:"Barbershop/salon-themed spot — seen on the official app's own map in the wooded Hilltop camping area northeast of Grand Central, near The Hide Out Hilltop." },
  { name:"PFP Robot", type:"Hidden venue", status:"confirmed", music:true, genre:"Electro, makina, trance, acid, techno", near:"Area 404", info:"PFP's robotic soundsystem — confirmed back for 2026 (Tripl3 B, Audio Gutter, Agent Scully, TEOTEK)." },
  { name:"Sub Lab", type:"Hidden venue", status:"confirmed", music:true, genre:"Bass, dubstep", near:"Metropolis", info:"Laboratory-themed bass venue — confirmed for 2026 (Bennett ft. Sylla/Limmz, Stasis, Nio B, Ruggz b2b Sonia Sol)." },
  { name:"Nachtlicker", type:"Hidden venue", status:"confirmed", music:true, genre:"Punk theatre, hard house, techno, speed garage, DnB", near:"Metropolis", info:"Curated nocturnal-rave/punk-theatre night — confirmed back for 2026 (Shaggy FX, SIÂNAGEDDON, THEO SHELDRAKE, Militant Music, GOFF ft BABY SOL). Corrected from an earlier 'near Area 404' guess — the official app's own map shows it on the same footpath as Sub Lab and Loconnection, just south of Metropolis." },
  { name:"Deviant Lounge", type:"Hidden venue", status:"confirmed", music:true, genre:"Eclectic, after-hours", near:"Area 404", info:"Confirmed for 2026, running Thu-Sat (Wrong'un Crew, Church of Donkology, DJ Safe N Sound, Bunn13) — previously listed as unverified, now on the 2026 schedule. Real position is in the Area 404 cluster, not Metropolis as an earlier guess assumed." },
  { name:"Gabber Kebabber", type:"Shop / hidden venue", status:"confirmed", music:true, genre:"Gabber, hardcore", near:"Metropolis", info:"Dystopian kebab-shop gabber stage running since 2023 — confirmed for 2026 with a full Thu-Sun DJ programme, east of Metropolis alongside E Numbers." },
  { name:"E Numbers", type:"Shop / hidden venue", status:"confirmed", music:true, genre:"Hyperpop, party, eclectic", near:"Metropolis", info:"Hyperpop 'sweetshop' venue — confirmed for 2026, running Thu-Sat (Kid Cosmit, Lounicorn, D0LLSW4G, Mannequins b2b sets)." },
  { name:"The Pomegranate Parlour", type:"Hidden venue", status:"confirmed", music:true, genre:"Eclectic party DJs", near:"Oldtown", info:"Actor-led parlour-style venue — confirmed for 2026 (Cassia, SCARBA, Mattana, DJ Shakey, Estère). Seen on the official app's own map inside Oldtown, not site-wide as previously guessed." },
  { name:"Busker's Wharf", type:"Hidden venue", status:"confirmed", music:true, genre:"Live/acoustic, folk", near:"Site-wide", info:"Wharf/street-performance themed spot — a real, recurring hidden venue, though no year-dated source was found to pin down a specific chapter." },
  { name:"Twisted Time Machine (Bad Apple Bar)", type:"Hidden venue", status:"confirmed", music:true, genre:"Rotates by slot: emo, nu-metal, jungle disco, 90s rave", near:"Ancient Futures", info:"Long-running takeover of Boomtown's historic Bad Apple Bar, in the Ancient Futures/Grand Central cluster — confirmed for 2026 with themed nights Wed-Sat (One Welcome Party, The Abba Party, My Chemical Hoemance, The Fleetwood Mac Celebration, UNKLE Psyence Fiction album playback)." },
  { name:"Circus Tent", type:"Hidden venue", status:"confirmed", music:true, genre:"Circus, live performance", near:"Ancient Futures", info:"Performance-led rather than a straight dancefloor. Real surveyed GPS (filed as \"Circus Tent\" in js/boomtown-locations-2026.js) puts it right by Ancient Futures/Grand Central, not Oldtown — likely the same real venue as thingsToFind's own \"Circus\" entry, kept as a separate pin since that's unconfirmed." },
  { name:"Airetiko", type:"Hidden venue", status:"confirmed", music:false, genre:"Aerial circus — trapeze, rope, silks, hoop", near:"Site-wide", info:"Real aerial-arts collective (trapeze, rope, silks, hoop) — confirmed for 2026 with dated Trapeze and Giant Marionettes slots running Wed-Fri." },
  { name:"Rebel Girls Club", type:"Hidden venue", status:"confirmed", music:false, genre:"Wellbeing, empowerment-themed workshops", near:"Ancient Futures", info:"Women-led venue — confirmed for 2026 with a wellbeing programme Wed-Fri (Opening Ceremony, burlesque/twerk workshops, morning yoga, herbal balm making). Real surveyed GPS puts it right by Ancient Futures/Grand Central, not the Thrutopia hilltop an earlier guess assumed." },
  { name:"Mining for (g)Old Town", type:"Hidden venue", status:"confirmed", music:true, genre:"Eclectic, party", near:"Oldtown", info:"Mining/prospecting theme playing on Oldtown's rebuild-uphill storyline." },
  { name:"XR", type:"Installation / talks", status:"confirmed", music:false, genre:"Climate activism, talks", near:"Anara Forest", info:"Extinction Rebellion-linked space — confirmed for 2026, running Wed-Fri (Cassandra the Oracle, Big Oil Drumming Parade, Last Chance Salon, Art Blocking). Real surveyed GPS puts it near Anara Forest/Hilltop, not Thrutopia." },
  { name:"End of the Line", type:"Hidden venue", status:"confirmed", music:true, genre:"Atmospheric, genre unclear", near:"Unclear", info:"Train-station-themed venue — confirmed for 2026, running Thu-Sat (Donkline Takeover, DJ Shnoo, Négo, Riguana)." },
  { name:"Cas's Costumes", type:"Shop / hidden venue", status:"confirmed", music:true, genre:"Dress-up, party", near:"Oldtown", info:"Costume-shop-fronted micro venue fitting Oldtown's circus theme." },
  { name:"Garden", type:"Chill space", status:"confirmed", music:false, genre:"—", near:"Botanica (likely)", info:"Planting/chill space, likely Botanica or Thrutopia-adjacent." },
  { name:"Craft Tent", type:"Workshop / shop", status:"confirmed", music:false, genre:"—", near:"Thrutopia", info:"Craft-making workshops and stalls — confirmed for 2026 with a full daily programme Wed-Fri, 10:00-18:00." },
  { name:"Hapitat", type:"Installation", status:"confirmed", music:false, genre:"—", near:"Anara Forest", info:"Wellbeing/habitat-themed space — confirmed for 2026 with a full daily programme Wed-Fri, 10:00-18:00. Real surveyed GPS puts it by Anara Forest/Hilltop, not up with The Retreat on the Thrutopia hilltop as its own info text once assumed." },
  { name:"The Retreat", type:"Chill space", status:"confirmed", music:false, genre:"—", near:"Thrutopia (woodland)", info:"New wellness sanctuary for Chapter Five, with its own page on Boomtown's site — professional massage, holistic treatments, communal saunas, hot tubs, sound baths, breathwork and artisan workshops; book slots in advance as they fill fast." },
  { name:"Crafty Rascals", type:"Workshop / shop", status:"confirmed", music:false, genre:"—", near:"Anara Forest", info:"Family/kids craft activities — confirmed for 2026 with a full daily programme Wed-Fri, 10:00-18:00. Real surveyed GPS puts it by Anara Forest/Hilltop, not Thrutopia." },
  { name:"Spinney Hollow", type:"Hidden venue", status:"confirmed", music:true, genre:"Eclectic, woodland", near:"Ancient Futures", info:"Small grove venue tucked into wooded ground. Real surveyed GPS puts it by Ancient Futures/Grand Central, not the guessed Anara Forest/Hidden Woods woodland edge." },
  { name:"Tinker Station", type:"Workshop / shop", status:"confirmed", music:false, genre:"—", near:"Ancient Futures", info:"Repair/maker space, pairs with the Reparium ethos — confirmed for 2026 with a full daily programme Wed-Fri, 10:00-18:00. Real surveyed GPS puts it near Ancient Futures/Grand Central, not Thrutopia." },
  { name:"Blink Mental Health", type:"Welfare / support", status:"confirmed", music:false, genre:"—", near:"Pepperpot Market / Thrutopia", info:"On-site mental health support — named alongside The Samaritans and Cocaine Anonymous as a 2026 welfare partner on Boomtown's own Chapter Five safety page." },
  { name:"Energy Garden", type:"Installation", status:"confirmed", music:false, genre:"—", near:"Ancient Futures", info:"Sustainable-energy themed space — confirmed for 2026 with a full dated workshop programme Wed-Fri. Real surveyed GPS puts it by Ancient Futures/Grand Central, not Thrutopia." },
  { name:"Climate Live", type:"Talks / installation", status:"confirmed", music:false, genre:"—", near:"Ancient Futures", info:"Climate talks and programming — confirmed for 2026 with a full dated workshop programme Wed-Fri. Real surveyed GPS puts it by Ancient Futures/Grand Central, not Thrutopia." },
  { name:"Reparium", type:"Workshop / shop", status:"confirmed", music:false, genre:"—", near:"Thrutopia (hilltop)", info:"Free volunteer repair hub — Boomtown's own 2026 coverage confirms it 'will return this year' in Pepperpot Market/on the Thrutopia hilltop to fix camping gear and kit." },
  { name:"Games Lounge", type:"Chill space", status:"confirmed", music:false, genre:"—", near:"Grand Central", info:"Games and downtime area away from the stages — seen on the official app's own map near Grand Central/Hilltop, corrected from an earlier unsourced 'near Pepperpot Market' guess." },
  { name:"Permaculture", type:"Talks / installation", status:"confirmed", music:false, genre:"—", near:"Anara Forest", info:"Growing and permaculture talks — confirmed for 2026 with a full dated workshop programme Wed-Fri. Real surveyed GPS puts it by Anara Forest/Hilltop, not Thrutopia." },
  { name:"The Magic Teapot", type:"Shop / cafe", status:"confirmed", music:false, genre:"—", near:"Ancient Futures", info:"Tea-themed chill spot and cafe. Real surveyed GPS puts it by Ancient Futures/Grand Central, not Thrutopia." },
  { name:"Cocaine Anonymous", type:"Welfare / support", status:"confirmed", music:false, genre:"—", near:"Ancient Futures", info:"On-site 12-step support meeting — explicitly named as a 2026 welfare partner on Boomtown's own Chapter Five safety page. Real surveyed GPS puts it right by Craft Tent/Ancient Futures, not Pepperpot Market/Thrutopia." },
  { name:"Narcotics Anonymous", type:"Welfare / support", status:"confirmed", music:false, genre:"—", near:"Pepperpot Market", info:"On-site 12-step support meeting — confirmed for 2026 with a recurring daily meeting slot (08:00-09:00 and others), despite not being named on Boomtown's own welfare-partner list alongside Blink Mental Health/Cocaine Anonymous." },
  { name:"Ancient Futures", type:"Talks / installation", status:"confirmed", music:false, genre:"—", near:"Grand Central", info:"Future-facing talks — confirmed for 2026 with a full dated workshop programme Wed-Fri. Seen on the official app's own map near Grand Central/Hilltop, not Thrutopia." },
  { name:"Reel News", type:"Hidden venue", status:"confirmed", music:true, genre:"Eclectic, spoken-word", near:"Ancient Futures", info:"Newsreel/cinema-themed spot — seen on the official app's own map at the east edge of the Ancient Futures/Grand Central cluster, beside Sharing Circles." },
  { name:"The Chair-o-Plane", type:"Leisure / ride", status:"confirmed", music:false, genre:"—", near:"Area 404 / Downtown", info:"A classic swing-carousel fairground ride, named in Boomtown's own 2026 essential guide near the Hide Out Downtown venue." },
  { name:"The Boomtown Bank", type:"Leisure / ride", status:"rumoured", music:false, genre:"Games, novelty", near:"Unclear", info:"A recurring past-chapter attraction offering fun-and-nonsense games rather than real banking; not explicitly reconfirmed for 2026 yet." },
  { name:"Retro Amusements Arcade", type:"Leisure / ride", status:"rumoured", music:false, genre:"—", near:"Unclear", info:"Past chapters have run a retro amusements arcade among the site's entertainment; not explicitly reconfirmed for 2026 yet." },
  { name:"Vintage Fairground (waltzers & rides)", type:"Leisure / ride", status:"rumoured", music:false, genre:"—", near:"Oldtown / Area 404 (typical)", info:"Past chapters have included a vintage fairground with waltzers and similar rides alongside the chair-o-plane; general presence expected but exact 2026 line-up of rides unconfirmed." },
  { name:"Little Pharma", type:"Hidden venue", status:"rumoured", music:true, genre:"Eclectic party DJs", near:"Unclear", info:"Seen in past chapters; no 2026 listing found — chase it but don't bank on it." },
  { name:"Postal Posse", type:"Hidden venue", status:"confirmed", music:true, genre:"Eclectic", near:"Botanica", info:"Character-led micro world tied to Botanica's postal-worker subplot — confirmed operating across all 2026 festival dates, programming DJs from noon to 2am daily around its giant post box and letter-writing stations. Seen on the official app's own map on Botanica's Letsbe Avenue loop path." },
  { name:"Copper Feel Cabaret", type:"Hidden venue", status:"rumoured", music:true, genre:"Cabaret, live", near:"Copperwood (past chapters)", info:"Copperwood-adjacent name from past searches; not confirmed for 2026." },
  { name:"Cosmic Junkyard", type:"Hidden venue", status:"rumoured", music:true, genre:"Eclectic bass", near:"Unclear", info:"Turned up in past-chapter searches with no dedicated account; treat as unconfirmed." },
  { name:"Clik Clik", type:"Hidden venue", status:"rumoured", music:false, genre:"Photo-booth / party novelty", near:"Unclear", info:"Seen in past social mentions; no 2026 confirmation found." },
  { name:"Engine House", type:"Hidden venue", status:"rumoured", music:true, genre:"Industrial, eclectic", near:"Unclear", info:"Past-chapter name with no dedicated 2026 account found." },
  { name:"Job Centre", type:"Hidden venue", status:"confirmed", music:false, genre:"—", near:"Metropolis", info:"Reopens for 2026 as 'Jobcentre 2.0', after previously folding into the Betterverse™ storyline — this year's version adds aptitude tests, biometric data collection and new jobs to appraise your skillset." },
  { name:"Shamrock", type:"Hidden venue", status:"rumoured", music:true, genre:"Irish/folk, party", near:"Unclear", info:"Fuller name found as 'The Shamrock Inn' in Boomtown's own 2024 photo gallery, confirming it existed in a past chapter — no 2026-dated evidence found yet." },
  { name:"Indian Street Food", type:"Food & drink", status:"confirmed", music:false, genre:"—", near:"Site-wide", info:"One of the cuisines Boomtown has confirmed for 2026, plus a £6 meal deal at selected traders — you'll pass stalls like this rather than need to seek them out." },
  { name:"Caribbean Comfort Food", type:"Food & drink", status:"confirmed", music:false, genre:"—", near:"Site-wide", info:"Confirmed 2026 food category — an everyday-encounter stall, not a hidden find." },
  { name:"Burger-van Classics", type:"Food & drink", status:"confirmed", music:false, genre:"—", near:"Site-wide", info:"Confirmed 2026 food category, dotted around the bigger stages and camping fields." },
  { name:"Paelleria", type:"Food & drink", status:"rumoured", music:false, genre:"—", near:"Pepperpot Market (2025)", info:"A 2025 trader-list name (paella). Treat as an example of the kind of stall to expect, not a return guarantee for 2026." },
  { name:"Burger Shack", type:"Food & drink", status:"rumoured", music:false, genre:"—", near:"Site-wide (2025)", info:"A 2025 trader-list name; no 2026 confirmation." },
  { name:"Greek Gyros", type:"Food & drink", status:"rumoured", music:false, genre:"—", near:"Site-wide (2025)", info:"A 2025 trader-list name; no 2026 confirmation." },
  // Same 10 real map labels added to thingsToFind above — mirrored here
  // so they also show in the full venue directory, not just as map
  // pins. "confirmed" because the name itself is confirmed real (seen
  // on the official app's own map), even though no lineup/genre data
  // was sourced for any of them.
  { name:"Quantum", type:"Hidden venue", status:"confirmed", music:false, genre:"—", near:"Oldtown", info:"Seen labelled on the official app's own map, near Oldtown/Temple Valley — no lineup or theme details sourced yet." },
  { name:"The Hide Out Downtown", type:"Hidden venue", status:"confirmed", music:false, genre:"—", near:"Metropolis", info:"Seen labelled on the official app's own map near Metropolis — also referenced in Boomtown's 2026 essential guide alongside the Chair-o-Plane ride." },
  { name:"Endor", type:"Hidden venue", status:"confirmed", music:false, genre:"—", near:"Metropolis", info:"Seen labelled (with its own coloured glow) on the official app's own map near Metropolis — no lineup or theme details sourced yet." },
  { name:"Mango", type:"Hidden venue", status:"confirmed", music:false, genre:"—", near:"Botanica", info:"Seen labelled on the official app's own map inside Botanica — no lineup or theme details sourced yet." },
  { name:"Karma Ceuticals", type:"Shop / hidden venue", status:"confirmed", music:false, genre:"—", near:"Botanica", info:"Seen labelled on the official app's own map inside Botanica, near Botanica Zoo — no lineup or theme details sourced yet." },
  { name:"Trough Love", type:"Hidden venue", status:"confirmed", music:false, genre:"—", near:"Oldtown", info:"Seen labelled on the official app's own map as a fenced open-air enclosure (not a roofed building) inside Oldtown — no lineup or theme details sourced yet." },
  { name:"Da Graaf's Reformatory", type:"Hidden venue", status:"confirmed", music:false, genre:"—", near:"Oldtown", info:"Seen labelled on the official app's own map inside Oldtown — no lineup or theme details sourced yet." },
  { name:"La Luna Coven", type:"Hidden venue", status:"confirmed", music:false, genre:"—", near:"Oldtown", info:"Seen labelled on the official app's own map inside Oldtown — no lineup or theme details sourced yet." },
  { name:"The Common Ground", type:"Chill space", status:"confirmed", music:false, genre:"—", near:"Oldtown", info:"Seen labelled on the official app's own map inside Oldtown — no lineup or theme details sourced yet." },
  { name:"The Feckless Wrecked", type:"Hidden venue", status:"confirmed", music:false, genre:"—", near:"Oldtown", info:"Seen labelled on the official app's own map inside Oldtown, near Síbín Beag — no lineup or theme details sourced yet." },
  // Both newly spotted on a user-supplied screenshot of the official
  // app's own map, mirrored here from thingsToFind above (see its own
  // comment there for sourcing).
  { name:"Den of Dis Order", type:"Hidden venue", status:"confirmed", music:false, genre:"—", near:"Oldtown", info:"Rufus the Red's inner circle of circus hustlers, fortune tellers and rogues, running Oldtown's day-to-day chaos — seen labelled on the official app's own map inside Oldtown, next to Mining for (g)Old Town." },
  { name:"Buskers Wharf", type:"Hidden venue", status:"confirmed", music:false, genre:"—", near:"Oldtown", info:"Seen labelled on the official app's own map at the southern edge of Oldtown — no lineup or theme details sourced yet." }
];

const map = document.getElementById("map");
const mapInfo = document.getElementById("mapInfo");

// ===============================
// ILLUSTRATED BASEMAP — an original illustration (organic district
// clearings, tree clusters, a ring of tent dots for camping, a worn
// dirt-trail route connecting districts), not a copy of Boomtown's own
// custom Mapbox style — different palette, different shapes, entirely
// our own generated artwork, evoking "illustrated festival map" as a
// genre rather than tracing their specific design.
//
// Built as GeoJSON directly in real lat/lon (via schematicToLatLon, the
// same calibration every marker already uses) and added to the map as
// MapLibre GL sources/layers (see loadMap()'s mapGL.on("load", ...)
// below). MapLibre triangulates each fill/line/circle layer into a GPU
// vertex buffer ONCE when the source is set, then the WebGL renderer
// draws that mesh directly on every frame — unlike an SVG (or the
// previous Leaflet DOM/SVG-overlay version), nothing here gets
// re-parsed or re-drawn per frame. Generating points straight in real
// lat/lon also sidesteps the earlier SVG-overlay approach's bounding-box
// approximation entirely — every shape is placed exactly where its own
// schematic coordinate maps to, not stretched to fit inside a rectangle.
// ===============================
function seededRand(seed){
  let s = seed;
  return ()=>{ s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

// A ring of jittered points around a center — reads as an organic
// "clearing" outline once filled, far less mechanical than a plain
// circle. Closed (first point repeated at the end) for GeoJSON Polygon use.
function blobRing(cx, cy, baseR, seed, points){
  points = points || 14;
  const rand = seededRand(seed);
  const pts = [];
  for(let i=0;i<points;i++){
    const angle = (i / points) * Math.PI * 2;
    const r = baseR * (0.72 + rand() * 0.5);
    pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.78]);
  }
  pts.push(pts[0]);
  return pts;
}

// A field-like boundary — a handful of mostly-straight edges around an
// elongated, rotated rectangle, with just enough per-vertex jitter to
// avoid looking like a drawn ruler-rectangle. Reference screenshots of
// the official app show camping fields and stage/plaza clearings as
// real bounded AREAS with distinct edges (closer to a farm-field
// boundary or a paved plaza outline), not the smooth circular blobs
// blobRing draws — using blobRing for those specifically was reported
// as "everything is circles with names in them, not clear areas with
// edges." rx/ry set the field's half-width/half-height BEFORE rotation;
// aspect (rx vs ry) and rotation are both seeded so repeat calls with
// the same seed are stable across reloads, same as blobRing.
function fieldRing(cx, cy, rx, ry, seed, sides){
  sides = sides || 6;
  const rand = seededRand(seed);
  const rotation = rand() * Math.PI;
  const cos = Math.cos(rotation), sin = Math.sin(rotation);
  const pts = [];
  for(let i=0;i<sides;i++){
    const angle = (i / sides) * Math.PI * 2;
    // Superellipse-ish corner jitter (0.8-1.08x) — enough irregularity to
    // read as hand-drawn, not enough to lose the field's basic straight-
    // edged silhouette the way blobRing's wider 0.72-1.22 range does.
    const jitter = 0.8 + rand() * 0.28;
    const lx = Math.cos(angle) * rx * jitter, ly = Math.sin(angle) * ry * jitter;
    pts.push([cx + lx * cos - ly * sin, cy + (lx * sin + ly * cos) * 0.85]);
  }
  pts.push(pts[0]);
  return pts;
}

function nearestDistrict(x, y, districts){
  let best = null, bestD = Infinity;
  districts.forEach(d=>{
    const dx = parseFloat(d.x) - x, dy = parseFloat(d.y) - y;
    const dist = dx * dx + dy * dy;
    if(dist < bestD){ bestD = dist; best = d; }
  });
  return best;
}

// A small rotated-rectangle footprint around a point — the reference
// video's district interiors are dense with tan/orange building-block
// shapes under every stage/venue icon, not just a bare dot on grass;
// this gives every district venue the same "there's a real structure
// here" footprint instead of markers floating on empty clearing colour.
// Rotated by a seeded angle (not axis-aligned) so a cluster of these
// reads as a scatter of individual buildings, not a grid.
// A tiny rotated-square "tent" glyph — the reference video's own camp
// confetti reads as small diamond/square tent shapes scattered on the
// grass, not the plain round dots this was originally built with. Size
// is in the same schematic 0-100 units as everything else (buildings
// run 1.5-2.8 wide, so ~0.3-0.6 here reads as tent-scale, not building-
// scale) — deliberately not reusing the old pixel-radius "size" value
// confettiClusterPoints produced, which was tuned for a circle layer's
// zoom-interpolated radius, not a schematic-space polygon.
function tentDiamond(cx, cy, size, seed){
  const rand = seededRand(seed);
  const angle = Math.PI / 4 + (rand() - 0.5) * 0.6;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const half = size / 2;
  const corners = [[-half,-half],[half,-half],[half,half],[-half,half]];
  const pts = corners.map(([x,y])=> [cx + (x * cos - y * sin), cy + (x * sin + y * cos) * 0.85]);
  pts.push(pts[0]);
  return pts;
}

function buildingFootprint(cx, cy, seed){
  const rand = seededRand(seed);
  const w = 1.5 + rand() * 1.3, h = 1.0 + rand() * 0.9;
  const angle = rand() * Math.PI;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const corners = [[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]];
  const pts = corners.map(([x,y])=> [cx + x * cos - y * sin, cy + (x * sin + y * cos) * 0.85]);
  pts.push(pts[0]);
  return pts;
}

// Structured per-building layer — explicit width/height/rotation/
// category per venue, evidence-cited from reference screenshots,
// instead of a purely procedural seeded-random shape. w/h in schematic
// units, rotation in degrees (clockwise, 0 = long axis east-west).
// category is a shape hint consulted by buildingLayerFootprint() below:
// "rect" (rotated rectangle, the default), "kite" (NEXUS's dark
// diamond-shaped mound), "dome" (Full Moon Ballroom's white marquee/
// tent), "ring" (Spectrum 360's circular container arena). There is no
// real image/sprite asset pipeline (this map is 100% vector shapes, no
// sprite sheet, to stay a zero-network offline PWA) — category is both
// the shape hint AND the closest thing to an "asset" identifier here.
// Anything NOT listed falls through to the old procedural
// buildingFootprint() — additive, only added where a screenshot gives
// real shape/orientation evidence, not invented for its own sake.
const BUILDING_LAYER = {
  "NEXUS": { w: 3.4, h: 3.0, rotation: 20, category: "kite" },
  "Full Moon Ballroom": { w: 3.4, h: 3.4, rotation: 0, category: "dome" },
  "Spectrum 360": { w: 3.0, h: 3.0, rotation: 0, category: "ring" },
  // Grand Central's own reference screenshot (findings this session)
  // shows its building rotated diagonally NW-SE relative to the
  // surrounding path network, not axis-aligned like a generic infill
  // building — the old procedural footprint had no fixed orientation
  // at all (a new random angle every reload).
  "Grand Central": { w: 3.2, h: 1.6, rotation: 35, category: "rect" }
};
function buildingLayerFootprint(cx, cy, seed, layer){
  const angle = (layer.rotation || 0) * Math.PI / 180;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  if(layer.category === "kite"){
    const size = layer.w / 2;
    const corners = [[0, -size], [size * 0.87, size * 0.5], [-size * 0.87, size * 0.5]];
    const pts = corners.map(([x,y])=> [cx + x * cos - y * sin, cy + (x * sin + y * cos) * 0.85]);
    pts.push(pts[0]);
    return pts;
  }
  if(layer.category === "dome" || layer.category === "ring"){
    return blobRing(cx, cy, layer.w / 2, seed, 14);
  }
  const corners = [[-layer.w/2,-layer.h/2],[layer.w/2,-layer.h/2],[layer.w/2,layer.h/2],[-layer.w/2,layer.h/2]];
  const pts = corners.map(([x,y])=> [cx + x * cos - y * sin, cy + (x * sin + y * cos) * 0.85]);
  pts.push(pts[0]);
  return pts;
}
function venueFootprint(name, cx, cy, seed){
  const layer = BUILDING_LAYER[name];
  if(layer) return buildingLayerFootprint(cx, cy, seed, layer);
  return buildingFootprint(cx, cy, seed);
}

// A gently bowed 3-point path between two schematic points instead of a
// dead-straight line — a whole hub's worth of spokes drawn perfectly
// straight reads as an artificial "spider web" converging on one dot;
// nudging each path's midpoint sideways by a small, deterministic
// (seeded on the endpoints, so stable across reloads) amount makes the
// same network read as hand-drawn paths instead.
function curvedLine(p0, p1, seed){
  const rand = seededRand(seed);
  const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const offset = (rand() - 0.5) * Math.min(len * 0.4, 6);
  return [p0, [mx + nx * offset, my + ny * offset], p1];
}

// Buffers a polyline (array of [x,y] schematic points) into a closed
// ribbon polygon of the given total width — a real filled ground AREA a
// path actually covers, not a stroked line at a fixed screen-pixel
// width. At each point, offsets perpendicular to the path's local
// direction (averaged from both neighbouring segments at interior
// points, so the ribbon doesn't kink at the bend) by half the width
// either side, then joins the two offset rows into one polygon ring.
function ribbonFromPath(points, width){
  const hw = width / 2;
  const n = points.length;
  const left = [], right = [];
  for(let i=0;i<n;i++){
    const p = points[i];
    let dx, dy;
    if(i === 0){ dx = points[1][0] - p[0]; dy = points[1][1] - p[1]; }
    else if(i === n - 1){ dx = p[0] - points[i - 1][0]; dy = p[1] - points[i - 1][1]; }
    else { dx = points[i + 1][0] - points[i - 1][0]; dy = points[i + 1][1] - points[i - 1][1]; }
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len, ny = dx / len;
    left.push([p[0] + nx * hw, p[1] + ny * hw]);
    right.push([p[0] - nx * hw, p[1] - ny * hw]);
  }
  const ring = left.concat(right.reverse());
  ring.push(ring[0]);
  return ring;
}

// Converts a ring/list of [x,y] points in the existing 0-100 schematic
// space into [lon,lat] pairs (GeoJSON coordinate order) via the same
// schematicToLatLon() every other approximate position in this file uses.
function schematicRingToLngLat(ring){
  return ring.map(([x,y])=>{ const c = schematicToLatLon(x, y); return [c.lon, c.lat]; });
}

// A jittered scatter of points around a center, each carrying a ready-
// to-use fill color and size — feeds a GeoJSON "circle" layer standing
// in for a tree cluster (small varied-green dots read as foliage at map
// scale without needing individual tree glyphs or a font/sprite server).
function treeClusterPoints(cx, cy, count, spread, seed){
  const rand = seededRand(seed);
  const pts = [];
  for(let i=0;i<count;i++){
    const a = rand() * Math.PI * 2;
    const r = rand() * spread;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r * 0.7;
    // Wider hue/lightness/saturation spread than before (was a flat
    // 100-120°/48%/38%) — a real woodland canopy shows real colour and
    // shade variation tree-to-tree, not one repeated green dot; the
    // widened range gives a mix of sunlit yellow-green, mid-green and
    // deep shaded-green foliage in the same cluster.
    const hue = 82 + Math.floor(rand() * 55);
    const sat = 38 + Math.floor(rand() * 22);
    const light = 26 + Math.floor(rand() * 20);
    pts.push({ x, y, size: 2.4 + rand() * 2.4, color: `hsla(${hue},${sat}%,${light}%,0.78)` });
  }
  return pts;
}

// Same jittered-scatter idea as treeClusterPoints, but in the mixed
// bright colours the reference video's ordinary camping fields actually
// show (a "confetti" of small orange/blue/pink/teal tent shapes dotted
// across the grass) — every named camping field on this map had just a
// text label floating on bare green before this, unlike the premium
// camps which at least got their own area fill.
const CONFETTI_COLORS = ["rgba(242,140,60,0.75)", "rgba(75,150,227,0.75)", "rgba(227,110,160,0.75)", "rgba(75,200,180,0.75)"];
function confettiClusterPoints(cx, cy, count, spread, seed){
  const rand = seededRand(seed);
  const pts = [];
  for(let i=0;i<count;i++){
    const a = rand() * Math.PI * 2;
    const r = rand() * spread;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r * 0.7;
    // Schematic-unit size (tent-scale, well under a building footprint's
    // 1.5-2.8 range) — not the old pixel-radius value, now that confetti
    // renders as tiny diamond polygons instead of a circle layer.
    pts.push({ x, y, size: 0.35 + rand() * 0.25, color: CONFETTI_COLORS[Math.floor(rand() * CONFETTI_COLORS.length)] });
  }
  return pts;
}

// Builds every basemap shape as GeoJSON FeatureCollections, ready to
// hand straight to mapGL.addSource(). Districts/trail/spokes/trees/tents
// mirror the previous SVG illustration's shapes and layout 1:1, just
// expressed as real-world geometry instead of drawing instructions.
// One colour per district (7, matching the real district count — the
// old 5-colour palette cycled, so two districts always ended up sharing
// a colour) picked to stay clear of every other ground colour already
// on the map: no greens (open grass/forest), no yellow-gold (camping
// fields), no grey (parking), no tan/brown (paths, buildings) — so a
// district's own fill/outline colour is never confusable with the
// zone type around it.
const DISTRICT_PALETTE = ["242,140,60", "70,170,235", "175,120,235", "235,100,150", "225,80,80", "60,200,190", "210,90,200"];

// ===============================
// TRUNK PATH NETWORK — the real footpath topology this session's four
// reference videos actually show, replacing two much cruder stand-ins:
// the old "trail" (every district joined in whatever order they happen
// to sit in the `locations` array — not real adjacency at all) and the
// old "nearest district" spoke targeting (every stage/venue/gate/camp
// drew a straight line to the closest district's centre point,
// regardless of whether that's actually the route you'd walk). Edges
// below are [nameA, nameB] pairs — resolved by name against locations/
// minorStages/thingsToFind/campLabels/gates via findNamedNode() — for
// which areas the videos repeatedly show connected by a footpath, in
// the order you'd actually walk between them. This asserts CONNECTIVITY
// as evidence-based; the exact curve shape of each segment still uses
// the same curvedLine() bow as the old spokes did (real path curvature
// isn't reliably readable at this video resolution — see the position-
// fix comments elsewhere in this file for why precise pixel tracing
// doesn't hold up here).
const TRUNK_PATH_EDGES = [
  ["West Gate", "Downtown Camping"],
  ["Downtown Camping", "Metropolis"],
  ["Metropolis", "Botanica"],
  // Metropolis <-> Area 404 previously jumped straight across the whole
  // gap between them as one direct line, ignoring the real venues that
  // actually sit in that space — reported as "the area between
  // Metropolis and Area 404 seems extremely large" with nothing to
  // break it up. Genuine footage shows a chain (Memory Mart/Better You/
  // BBXL Info/Distractoverse/E Numbers/Gabber Kebabber, then Infinity)
  // running east from Metropolis toward Area 404 — routing the path
  // through the two of those already tracked as named venues (E Numbers,
  // Gabber Kebabber) plus Infinity, instead of a single straight jump,
  // so the gap reads as a real chain of stops, not empty space with one
  // line drawn across it.
  ["Metropolis", "E Numbers"],
  ["E Numbers", "Gabber Kebabber"],
  ["Gabber Kebabber", "Infinity"],
  ["Infinity", "Area 404"],
  ["Botanica", "Area 404"],
  ["Metropolis", "Hydro XL"],
  ["Botanica", "Letsbe Avenue"],
  // Letsbe Avenue's own loop path, added this session — a clear
  // reference video (someone searching "thrutopia" and panning the
  // whole site) shows this as a genuine closed loop, not just isolated
  // points: Letsbe Avenue -> Luck Exchange Casino -> Hotel Paradiso ->
  // Postal Posse -> back to Botanica.
  ["Letsbe Avenue", "Luck Exchange Casino"],
  ["Luck Exchange Casino", "Hotel Paradiso"],
  ["Hotel Paradiso", "Postal Posse"],
  ["Postal Posse", "Botanica"],
  ["Letsbe Avenue", "The Boomtown Bobbies"],
  // Copperwood removed as a junction node (its own map pin was removed —
  // see the locations array comment); these two edges now connect
  // straight to Grand Central, the confirmed real hub for this cluster.
  ["Letsbe Avenue", "Grand Central"],
  ["Grand Central", "Temple Valley Camping"],
  ["Grand Central", "Anara Forest"],
  ["Grand Central", "Oldtown"],
  ["Oldtown", "Quantum"],
  ["Oldtown", "Tribe of Frog"],
  // Helix inserted onto the Quantum -> Lion's Den walk this session —
  // genuine official-app footage places it directly between the two,
  // not the "alongside Metropolis" guess it carried before (see Helix's
  // own comment in the `locations` array above).
  ["Quantum", "Helix"],
  ["Helix", "The Lion's Den"],
  ["Quantum", "Sunset Hill"],
  ["Sunset Hill", "Camp Skylark Sunset (premium)"],
  ["Camp Skylark Sunset (premium)", "South Gate"],
  ["East Gate", "Temple Valley Camping"],
  // Oldtown's twin venue chains, added this session — three independent
  // genuine official-app frames all show these as two parallel winding
  // paths, running roughly north-south between Oldtown itself and
  // Quantum/the Hilltop yellow zone to the south. (Postal Posse was
  // dropped from this cluster — a clearer video showed it's actually in
  // Botanica, not Oldtown; see its own comment in `thingsToFind` above.)
  ["Oldtown", "Trough Love"],
  ["Oldtown", "The Fools Leap"],
  ["The Fools Leap", "Da Graaf's Reformatory"],
  ["Da Graaf's Reformatory", "La Luna Coven"],
  ["La Luna Coven", "Buskers Wharf"],
  ["Oldtown", "The Pomegranate Parlour"],
  ["The Pomegranate Parlour", "Den of Dis Order"],
  ["Den of Dis Order", "Mining for (g)Old Town"],
  ["Mining for (g)Old Town", "Síbín Beag"],
  ["Síbín Beag", "The Feckless Wrecked"],
  // Full Moon Ballroom / Foggers Mill cluster — "The Hide Out Hilltop"
  // itself is the real node off Grand Central (Copperwood's own former
  // junction role, removed along with its map pin — see the locations
  // array comment), with Full Moon Ballroom and Foggers Mill either side
  // of it, matching the confirmed on-camera order.
  ["Grand Central", "The Hide Out Hilltop"],
  ["The Hide Out Hilltop", "Full Moon Ballroom"],
  ["Full Moon Ballroom", "Foggers Mill"],
  ["Grand Central", "Tangled Roots"],
  ["The Hide Out Hilltop", "Topsy Turvy Trims"],

  // Botanica's wider venue cluster, added this pass — previously only
  // reachable via generic auto-generated capillary spokes; these are
  // real confirmed adjacencies from reference footage (Botanica Zoo/
  // Karma Ceuticals/Mango on one path, Nexus its own stage marker, Sub
  // Lab/Loconnection/Nachtlicker strung along a separate path south of
  // Metropolis, Rose and Clown on Botanica's own east side).
  ["Botanica", "NEXUS"],
  ["Botanica", "Botanica Zoo"],
  ["Botanica Zoo", "Karma Ceuticals"],
  ["Karma Ceuticals", "Mango"],
  ["Botanica", "Rose and Clown"],
  ["Metropolis", "Sub Lab"],
  ["Sub Lab", "Loconnection"],
  ["Loconnection", "Nachtlicker"],
  ["Metropolis", "The Hide Out Downtown"],

  // Area 404's own venue cluster — a single reference frame this session
  // showed Spectrum 360/Hangar 161/Deviant Lounge/Acid Leak/BBXL all
  // together, in this order.
  ["Area 404", "Spectrum 360"],
  ["Spectrum 360", "Hangar 161"],
  ["Hangar 161", "Deviant Lounge"],
  ["Deviant Lounge", "BBXL"],
  ["BBXL", "Acid Leak"],

  // Ancient Futures/Grand Central's own cluster of workshops/hidden
  // venues — all confirmed sitting near Grand Central on camera (several
  // had previously been guessed near Thrutopia/Pepperpot Market before
  // this session's video evidence moved them here; see their own
  // comments above), now actually reachable by a real path rather than
  // floating on generic spokes.
  ["Grand Central", "Ancient Futures"],
  ["Ancient Futures", "Craft Tent"],
  ["Craft Tent", "Games Lounge"],
  ["Ancient Futures", "Circus Tent"],
  ["Ancient Futures", "Circus"],
  ["Ancient Futures", "Rebel Girls Club"],
  ["Rebel Girls Club", "Tinker Station"],
  ["Ancient Futures", "The Retreat"],
  ["Ancient Futures", "Twisted Time Machine (Bad Apple Bar)"],
  ["Ancient Futures", "Reel News"],
  ["Ancient Futures", "Energy Garden"],
  ["Energy Garden", "Climate Live"],
  ["Climate Live", "The Magic Teapot"],
  ["The Magic Teapot", "Cocaine Anonymous"],
  ["Cocaine Anonymous", "Spinney Hollow"]
  // "Anara Forest" -> "Hapitat" removed on a validation pass — Hapitat's
  // own (71,49) is still a scraped-GPS position (never footage-
  // confirmed; see its own comment), while Anara Forest is at (85,22).
  // The 30-schematic-unit gap between them was never an actual path
  // seen on camera, just an inference from Hapitat's "near Anara
  // Forest" info text — exactly the kind of invented connectivity this
  // session's spoke-removal pass was meant to stop drawing. No edge
  // until a genuine sighting confirms Hapitat's real position.
];

// Looks a name up across every array a trunk-path endpoint could name —
// stages/districts (locations), minor stages, unconfirmed-but-labelled
// spots (thingsToFind), named camp fields (campLabels, keyed on `text`
// not `name`), and gates — so TRUNK_PATH_EDGES can reference any of them
// interchangeably by their display name.
function findNamedNode(name){
  const loc = locations.find(l=> l.name === name);
  if(loc) return { x: parseFloat(loc.x), y: parseFloat(loc.y) };
  const minor = minorStages.find(s=> s.name === name);
  if(minor) return { x: parseFloat(minor.x), y: parseFloat(minor.y) };
  const find = thingsToFind.find(t=> t.name === name);
  if(find) return { x: parseFloat(find.x), y: parseFloat(find.y) };
  const landmark = landmarks.find(l=> l.name === name);
  if(landmark) return { x: parseFloat(landmark.x), y: parseFloat(landmark.y) };
  const camp = campLabels.find(c=> c.text === name);
  if(camp) return { x: parseFloat(camp.x), y: parseFloat(camp.y) };
  const gate = gates.find(g=> g.name === name);
  if(gate) return { x: parseFloat(gate.x), y: parseFloat(gate.y) };
  return null;
}

// Visual path hierarchy — every trunk segment used to render at the
// same fixed width/colour regardless of what it actually connects,
// reported as paths not feeling like real main/secondary/exploratory
// routes. Tiered by what a segment's two endpoints actually ARE, not
// hand-picked per edge: an edge between two "main" nodes (a district or
// a named stage or a gate — the big, signed, wayfinding-critical
// points) is a main route; an edge touching a hidden/unlisted venue
// (thingsToFind) is the subtle, exploratory kind; everything else
// (minor stages, landmarks, camp labels) is secondary.
function nodeTierOf(name){
  const loc = locations.find(l=> l.name === name);
  if(loc && (loc.kind === "district" || loc.kind === "stage")) return "main";
  if(gates.find(g=> g.name === name)) return "main";
  if(thingsToFind.find(t=> t.name === name)) return "minor";
  return "secondary";
}
const PATH_TIER_RANK = { main: 3, secondary: 2, minor: 1 };
function edgeTier(a, b){
  const rank = Math.min(PATH_TIER_RANK[nodeTierOf(a)] || 2, PATH_TIER_RANK[nodeTierOf(b)] || 2);
  return rank === 3 ? "main" : rank === 2 ? "secondary" : "minor";
}
const TRUNK_PATH_SEGMENTS = TRUNK_PATH_EDGES.map(([a, b], i)=>{
  const pa = findNamedNode(a), pb = findNamedNode(b);
  if(!pa || !pb) return null;
  return { a: pa, b: pb, seed: i * 31 + 7, tier: edgeTier(a, b) };
}).filter(Boolean);

// Closest point on any real trunk-path segment to (x,y), plus which
// segment it's on — used only to bias DECORATIVE infill building
// placement toward sitting along a real path edge (see
// pickBuildingSpotNearPath below), same way real festival stalls/tents
// front onto a footpath rather than scattering randomly across open
// ground. This is NOT used to draw a path (that would be inventing
// connectivity the spokes-removal pass above deliberately stopped
// doing) — only to place decoration that's already going to render
// somewhere near a district/stage regardless.
function nearestTrunkPoint(x, y){
  let best = null, bestDist = Infinity;
  TRUNK_PATH_SEGMENTS.forEach(seg=>{
    const { a, b } = seg;
    const dx = b.x - a.x, dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy || 1;
    let t = ((x - a.x) * dx + (y - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const px = a.x + dx * t, py = a.y + dy * t;
    const dist = (px - x) ** 2 + (py - y) ** 2;
    if(dist < bestDist){ bestDist = dist; best = { x: px, y: py, dx, dy, dist: Math.sqrt(dist) }; }
  });
  return best;
}

// A genuinely separate wooded patch between The Hide Out Hilltop (66,21)
// and Grand Central (66,30) — a Grand Central/Oldtown reference
// screenshot shows it explicitly labelled "SITE OF SPECIAL SCIENTIFIC
// INTEREST" in pale italic map text over dark tree-covered ground,
// distinct from every named forest/woods stage (it has no stage/venue
// of its own — it's a real ecological designation, not a Forest-named
// district). Previously unrepresented: that whole area rendered as
// plain open ground, when the reference clearly shows dark wooded
// terrain. Module-level (not inside buildMapGeoJSON) so both that
// function (forest fill/tree texture) and loadMap()'s plain-text label
// marker can both reach it.
const SSSI_SPOTS = [{ name: "Site of Special Scientific Interest", x: "63", y: "25" }];

function buildMapGeoJSON(){
  const districts = locations.filter(p=>p.kind === "district");

  // Real farmland field-boundary texture — Matterley Estate is a working
  // dairy farm, and the reference video's own open ground shows real
  // field-boundary lines throughout, not flat empty green. A scatter of
  // large, barely-there alternating-tint blobs across the open ground
  // (drawn first/bottom, so forests/districts/camps layer over it where
  // they overlap) breaks up what would otherwise be a big flat colour.
  // Widened from a fixed 12-spot list to a jittered grid spanning past
  // the schematic 0-100 box into the padded margin MAX_BOUNDS actually
  // shows (schematicToLatLon extrapolates fine past 0-100) — the old
  // list left the outer regions (especially near the pan-bounds edge,
  // fully visible at the new zoomed-out-a-bit views) reading as flatter,
  // emptier colour than the middle of the map, exactly backwards from a
  // real aerial view where the working farmland stretches further than
  // the festival footprint itself.
  const FIELD_SPOTS = [];
  { const fieldRand = seededRand(2200);
    for(let gx=-10; gx<=110; gx+=18){
      for(let gy=-10; gy<=110; gy+=18){
        FIELD_SPOTS.push([gx + (fieldRand() - 0.5) * 10, gy + (fieldRand() - 0.5) * 10]);
      }
    }
  }
  // Hue-varied (not just light/dark tint) so open ground reads as real
  // grass with natural colour drift — cooler blue-greens through warmer
  // yellow-greens — instead of one flat hue with a brightness checker.
  const fieldFeatures = FIELD_SPOTS.map(([cx,cy],i)=>{
    const rand = seededRand(3000 + i * 13);
    const hue = 95 + rand() * 35;
    const light = 30 + rand() * 16;
    const alpha = 0.05 + rand() * 0.08;
    return {
      type: "Feature",
      properties: { fill: `hsla(${hue.toFixed(0)},40%,${light.toFixed(0)}%,${alpha.toFixed(2)})` },
      geometry: { type: "Polygon", coordinates: [ schematicRingToLngLat(blobRing(cx, cy, 13, 1000 + i * 71, 12)) ] }
    };
  });
  // A second, finer-grained pass of smaller mottling blobs on top of the
  // broad one above — real grass has texture at more than one scale;
  // one size of blob alone still reads as a smooth gradient at typical
  // zoom, not the mixed short/long grass patchiness of a real field.
  const FIELD_SPOTS_FINE = [];
  { const fineRand = seededRand(3400);
    for(let gx=-6; gx<=106; gx+=9){
      for(let gy=-6; gy<=106; gy+=9){
        FIELD_SPOTS_FINE.push([gx + (fineRand() - 0.5) * 6, gy + (fineRand() - 0.5) * 6]);
      }
    }
  }
  const fieldFeaturesFine = FIELD_SPOTS_FINE.map(([cx,cy],i)=>{
    const rand = seededRand(4200 + i * 17);
    const hue = 90 + rand() * 40;
    const light = 28 + rand() * 18;
    const alpha = 0.04 + rand() * 0.06;
    return {
      type: "Feature",
      properties: { fill: `hsla(${hue.toFixed(0)},38%,${light.toFixed(0)}%,${alpha.toFixed(2)})` },
      geometry: { type: "Polygon", coordinates: [ schematicRingToLngLat(blobRing(cx, cy, 5, 4200 + i * 53, 8)) ] }
    };
  });

  // Straight hedgerow lines scattered across the outer open ground —
  // real farmland (Matterley Estate) shows field-division hedges well
  // beyond the festival's own fenced footprint; the FIELD_SPOTS mottling
  // above breaks up flat colour but has no actual line texture the way
  // camp fields already got a few passes back.
  const hedgeFeatures = [];
  { const hedgeRand = seededRand(2300);
    for(let i=0;i<22;i++){
      const cx = -8 + hedgeRand() * 116, cy = -8 + hedgeRand() * 116;
      const a = hedgeRand() * Math.PI;
      const len = 10 + hedgeRand() * 14;
      const dx = Math.cos(a) * len / 2, dy = Math.sin(a) * len / 2;
      hedgeFeatures.push({ type:"Feature", properties:{}, geometry:{ type:"LineString", coordinates: schematicRingToLngLat([[cx - dx, cy - dy], [cx + dx, cy + dy]]) } });
    }
  }

  // District clearings are sized to the town/venue cluster they actually
  // contain, not a fixed guess — a flat 16%-radius blob (the old
  // approach) reached well past every district's real stages/hidden
  // venues and into the neighbouring camping fields, which is exactly
  // the "boundary drawn over the campsite instead of the real
  // interactive town" problem the reference video's own district
  // outlines don't have. districtSpreadR walks every stage/minor-stage/
  // hidden-venue this district actually owns (same nearestDistrict()
  // assignment the path network below uses, so the clearing and its
  // paths agree on what belongs to it) and sizes the clearing to just
  // past the furthest one — small district, small clearing.
  const districtMemberPoints = locations.filter(p=>p.kind === "stage").concat(minorStages).concat(thingsToFind);

  // Master registry of every ground-zone centre (districts, camping
  // fields, parking) this pass considers purely to keep neighbouring
  // zones from geometrically overlapping — shrinking district radius
  // alone (the previous pass) wasn't enough on its own: a camping
  // field's own blob (radius ~8-10) can reach past a district centre
  // that's only a few schematic units away regardless of how small the
  // district's own radius is (Oldtown sits just ~5 units from East
  // Camping, for example). clearanceRadius caps whichever radius is
  // being asked for so it can reach at most 40% of the way to the
  // NEAREST other zone's centre — two neighbouring zones each capped at
  // 40% still leaves a real gap between their edges, even accounting for
  // blobRing's own up-to-22%-oversize irregularity.
  // Pepperpot Market is the real hub the extracted-from-the-official-app
  // POI data (js/boomtown-locations-2026.js — 53 real-GPS toilets/food/
  // bars/welfare/etc. markers) actually clusters around once converted
  // into schematic space: their centroid lands within ~2 schematic units
  // of this landmark's own hand-placed (46%,50%) position. Those markers
  // render at their real GPS spot regardless of any ground shape, so
  // without one they sat on bare grass between the district blobs —
  // looking like they were "in the wrong place" even though the
  // positions themselves are the most accurate data this map has (real
  // GPS, not schematic guesswork). Giving the hub its own clearing (same
  // sizing/overlap-safe machinery as a district) grounds them the same
  // way districts ground stages.
  const marketHubRef = landmarks.find(l=> l.name === "Pepperpot Market");
  const zoneCenters = districts.map(d=>({ x: parseFloat(d.x), y: parseFloat(d.y), ref: d }))
    .concat(campLabels.map(c=>({ x: parseFloat(c.x), y: parseFloat(c.y), ref: c })))
    .concat(parkingAreas.map(p=>({ x: parseFloat(p.x), y: parseFloat(p.y), ref: p })))
    .concat(marketHubRef ? [{ x: parseFloat(marketHubRef.x), y: parseFloat(marketHubRef.y), ref: marketHubRef }] : []);
  // Every zone shape drawn from a "radius" below is actually blobRing()'s
  // irregular polygon, which reaches up to 1.22x its nominal radius at
  // its widest bulge (see blobRing: r = baseR * (0.72 + rand()*0.5)).
  // The ratios/floors here used to treat "radius" as if it were a true
  // circle, so two neighbours each sized to "half the distance between
  // them" could still visibly overlap once their bulges lined up toward
  // each other (worst case: 0.42 * 1.22 * 2 = 1.02x the real distance,
  // i.e. actual overlap, not just a close call) — this is the "campsite/
  // stage/forest zoning overlaps and mishapenness" that was reported.
  // Dividing by BLOB_MAX_OVERSIZE below makes the guarantee hold even at
  // that worst-case bulge alignment, not just for the idealized average.
  const BLOB_MAX_OVERSIZE = 1.22;
  // Every neighbour's own "desired" size, when known ahead of time (see
  // districtDesiredRaw below, filled in before this is ever called) —
  // used so a district with a genuinely large member spread (Oldtown's
  // own venue chains reach 11+ schematic units out) isn't capped down to
  // a flat, equal-seeming fraction of the gap to its nearest neighbour
  // regardless of whether that neighbour actually needs the same share.
  // Districts default to this only once districtDesiredRaw has their
  // real value; camps/parking/the market hub (no equivalent pre-pass)
  // fall back to a flat estimate (6) since their own actual "desired"
  // isn't computed until their own clearance call runs later.
  const districtDesiredRaw = new Map();
  function neighbourDesired(ref){
    return districtDesiredRaw.has(ref) ? districtDesiredRaw.get(ref) : 6;
  }
  function clearanceRadius(cx, cy, selfRef, desired){
    // Reported as "Oldtown dimensions are a bit squashed" — the old
    // version capped every district to a flat ~38% of the gap to its
    // NEAREST neighbour regardless of how much space that neighbour
    // itself actually needed, so a district with a genuinely large
    // member spread (Oldtown's own venue chains reach 11+ units out) got
    // squashed down to ~6 units even when its nearest neighbour was 20
    // units away and didn't need anywhere near that much room itself.
    // Now: for each neighbour, only shrink if the two would ACTUALLY
    // overlap (own desired + neighbour's own desired, at worst-case
    // bulge, exceeds the real distance between them) — and even then,
    // split the gap proportionally to each side's own real need, not an
    // even/flat ratio, so a small neighbour doesn't force a big district
    // down to its own small scale.
    let safe = desired;
    zoneCenters.forEach(z=>{
      if(z.ref === selfRef) return;
      const dist = Math.hypot(z.x - cx, z.y - cy);
      const otherDesired = neighbourDesired(z.ref);
      const combined = (desired + otherDesired) * BLOB_MAX_OVERSIZE;
      if(combined > dist){
        const share = dist / BLOB_MAX_OVERSIZE * (desired / (desired + otherDesired));
        safe = Math.min(safe, share);
      }
    });
    return Math.max(2, safe);
  }

  // Camping fields off the official app read as by far the biggest
  // ground use on site — real Boomtown camping dwarfs the "town"
  // districts, not the other way round — but clearanceRadius above was
  // sizing them the same conservative way as a district, capped at 9-11.
  // Camp fields get a higher desired cap and a more generous ratio than
  // districts (0.44 vs 0.38) since neighbouring camp fields genuinely do
  // sit closer/blend at their edges more than two themed districts would
  // (Camp Orchid Downtown sitting inside/beside the wider Downtown
  // Camping, say) — but they DO still get checked against OTHER camp
  // fields now, not just districts/parking/the market hub. The previous
  // version skipped camp-vs-camp entirely on the theory that "blending is
  // normal", but with no check at all two same-sized camp fields several
  // schematic units apart could draw fully on top of each other — reported
  // as camp zoning "overlaps and mishapenness". A real (if slightly
  // looser) limit still allows visible blending at the edges without
  // letting one camp field's shape swallow its neighbour's whole.
  function campClearanceRadius(cx, cy, selfRef, desired){
    let minDist = Infinity;
    zoneCenters.forEach(z=>{
      if(z.ref === selfRef) return;
      minDist = Math.min(minDist, Math.hypot(z.x - cx, z.y - cy));
    });
    const safeMax = Math.max(1.5, (minDist / 2 - 0.4) / BLOB_MAX_OVERSIZE);
    return Math.min(Math.max(3, Math.min(desired, minDist * 0.44 / BLOB_MAX_OVERSIZE)), safeMax);
  }

  function districtDesired(d){
    const cx = parseFloat(d.x), cy = parseFloat(d.y);
    let maxDist = 0;
    districtMemberPoints.forEach(p=>{
      const nd = nearestDistrict(parseFloat(p.x), parseFloat(p.y), districts);
      if(nd !== d) return;
      const dx = parseFloat(p.x) - cx, dy = parseFloat(p.y) - cy;
      maxDist = Math.max(maxDist, Math.sqrt(dx * dx + dy * dy));
    });
    return Math.min(16, Math.max(6, maxDist + 3));
  }
  // Pre-pass: every district's own real "desired" size, computed BEFORE
  // any clearance shrinking — clearanceRadius (above) needs every
  // neighbour's real desired size up front to split space fairly between
  // two districts, not a flat ratio of the gap between them.
  districts.forEach(d=> districtDesiredRaw.set(d, districtDesired(d)));
  function districtSpreadR(d){
    const cx = parseFloat(d.x), cy = parseFloat(d.y);
    return clearanceRadius(cx, cy, d, districtDesiredRaw.get(d));
  }
  const districtRadii = new Map();
  const districtFeatures = districts.map((d,i)=>{
    const rgb = DISTRICT_PALETTE[i % DISTRICT_PALETTE.length];
    const cx = parseFloat(d.x), cy = parseFloat(d.y);
    const r = districtSpreadR(d);
    districtRadii.set(d, r);
    return {
      type: "Feature",
      // Fill/casing alpha nudged back up a little (0.16->0.22, 0.22->0.28)
      // against this pass's brighter background green — reference
      // screenshots show each district reading as a clearly brighter,
      // distinctly-tinted patch against the surrounding open ground, not
      // a subtle wash; line stays at its existing 0.55 so the boundary
      // doesn't get louder than the markers plotted inside it.
      properties: { name: d.name, fill: `rgba(${rgb},0.22)`, line: `rgba(${rgb},0.55)`, casing: `rgba(${rgb},0.28)` },
      geometry: { type: "Polygon", coordinates: [ schematicRingToLngLat(blobRing(cx, cy, r, i * 31 + 7, 18)) ] }
    };
  });

  // Sized the same way a district is (spread of its real members, capped
  // by clearanceRadius so it can't eat into a neighbouring district) —
  // "members" here are the real POI markers themselves, converted from
  // GPS into schematic space so they're comparable to everything else
  // this function measures in.
  const marketHubFeatures = [];
  if(marketHubRef){
    const cx = parseFloat(marketHubRef.x), cy = parseFloat(marketHubRef.y);
    const poiDists = (window.BOOMTOWN_LOCATIONS_2026 && window.BOOMTOWN_LOCATIONS_2026.pois || [])
      .map(p=>{ const s = latLonToSchematic(p.lat, p.lon); return Math.hypot(s.x - cx, s.y - cy); })
      .sort((a,b)=> a - b);
    // 75th percentile, not the single furthest POI — districts don't try
    // to reach their one most-outlying member either (districtSpreadR
    // caps at 13 regardless), and the real POI data has a much wider
    // raw scatter than any hand-guessed district, so chasing literally
    // every outlier would force an oversized shape that swallows
    // neighbouring districts just to cover a handful of stragglers.
    const p75 = poiDists.length ? poiDists[Math.floor(poiDists.length * 0.75)] : 10;
    const desired = Math.min(16, Math.max(7, p75 + 2));
    // Not clearanceRadius's usual 0.42-of-nearest-neighbour ratio: that
    // ratio exists so two same-kind zones (district vs district, camp vs
    // camp) never visually touch. The market hub is the one real-GPS-
    // verified shape on this whole map — everything else here is
    // schematic guesswork — so letting it reach further toward a
    // guessed district (up to 65% of the gap, still leaving a real
    // margin) is trusting the more accurate data over the guess, not
    // sloppiness.
    let minDist = Infinity;
    zoneCenters.forEach(z=>{
      if(z.ref === marketHubRef) return;
      minDist = Math.min(minDist, Math.hypot(z.x - cx, z.y - cy));
    });
    const r = Math.min(Math.max(6, desired), minDist * 0.65);
    marketHubFeatures.push({
      type: "Feature",
      properties: { name: marketHubRef.name, fill: "rgba(210,150,70,0.30)", line: "rgba(210,150,70,0.9)", casing: "rgba(210,150,70,0.32)" },
      geometry: { type: "Polygon", coordinates: [ schematicRingToLngLat(blobRing(cx, cy, r, 5150, 16)) ] }
    });
  }

  // Main "trail" backbone — the real trunk-path segments traced from
  // the reference videos (see TRUNK_PATH_EDGES above), not the old
  // district-array-order loop this used to draw.
  //
  // Rendered as a real filled AREA (a buffered ribbon polygon), not a
  // stroked line — a `line` layer's width is a fixed screen-pixel
  // stroke that doesn't represent the path's actual real-world width or
  // scale with zoom the way a genuine ground feature does. Reported
  // directly: "footpaths should not be lines, it should be clearly
  // defined by colour difference in the image and using pathways that
  // cover the real width and coverage of the real floor." 0.6 schematic
  // units (~5m at this site's real ~890x735m span) approximates a real
  // festival trunk path's width.
  // Width now varies by tier (main/secondary/minor, see edgeTier above)
  // instead of one fixed 0.6 for every segment — main routes read as the
  // wide, obvious way between big landmarks; minor ones stay narrow and
  // subtle, an "exploratory" hint rather than a signed route.
  const TRAIL_WIDTH = { main: 0.95, secondary: 0.6, minor: 0.32 }; // schematic units
  const TRAIL_FILL = {
    main: "rgba(214,182,122,0.97)",
    secondary: "rgba(224,200,160,0.92)",
    minor: "rgba(200,185,150,0.55)"
  };
  const trailFeatures = TRUNK_PATH_SEGMENTS.map(seg=>{
    const centreline = curvedLine([seg.a.x, seg.a.y], [seg.b.x, seg.b.y], seg.seed);
    return {
      type: "Feature", properties: { tier: seg.tier, fill: TRAIL_FILL[seg.tier] },
      geometry: { type: "Polygon", coordinates: [ schematicRingToLngLat(ribbonFromPath(centreline, TRAIL_WIDTH[seg.tier])) ] }
    };
  });

  // Low scrub/bush dots lining main & secondary paths — a real
  // countryside footpath usually has some low hedge/scrub growth along
  // its edges, not a bare strip of colour running through flat grass.
  // Skipped for "minor" tier paths so those keep reading as bare,
  // exploratory ground rather than a maintained route.
  const pathScrubPoints = [];
  TRUNK_PATH_SEGMENTS.filter(seg=> seg.tier !== "minor").forEach((seg,i)=>{
    const centreline = curvedLine([seg.a.x, seg.a.y], [seg.b.x, seg.b.y], seg.seed);
    const rand = seededRand(6000 + i * 19);
    const halfWidth = TRAIL_WIDTH[seg.tier] / 2 + 0.15;
    for(let j=1;j<centreline.length-1;j++){
      if(rand() > 0.55) continue;
      const [x,y] = centreline[j];
      const side = rand() < 0.5 ? -1 : 1;
      const dx = centreline[j+1][0] - centreline[j-1][0], dy = centreline[j+1][1] - centreline[j-1][1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const off = halfWidth + rand() * 0.3;
      pathScrubPoints.push({
        x: x + nx * off * side, y: y + ny * off * side,
        size: 1.1 + rand() * 1.1,
        color: `hsla(${(95 + rand() * 20).toFixed(0)},35%,${(26 + rand() * 12).toFixed(0)}%,0.5)`
      });
    }
  });

  // Hill-shading contour rings — every district's own info text is
  // explicitly tagged "Downtown." or "Hilltop." (Thrutopia/Oldtown are
  // Hilltop, Area 404/Botanica/Letsbe Avenue/Metropolis are Downtown),
  // a real elevation distinction the map itself never showed — flat
  // ground colour everywhere regardless of which half of the site a
  // district sits on. Three loose concentric rings around each Hilltop
  // district (wider than the site-wide decorative contours, tan/brown
  // rather than white so they read as ground shading, not path) hint at
  // raised terrain without needing real elevation data.
  const hillContourFeatures = [];
  districts.filter(d=> /^Hilltop/.test(d.info)).forEach((d,di)=>{
    const cx = parseFloat(d.x), cy = parseFloat(d.y);
    const baseR = (districtRadii.get(d) || 6) * 1.6;
    [1, 1.6, 2.2].forEach((mult,ri)=>{
      const ring = blobRing(cx, cy, baseR * mult, di * 61 + ri * 13 + 4000, 14);
      hillContourFeatures.push({ type:"Feature", properties:{}, geometry:{ type:"LineString", coordinates: schematicRingToLngLat(ring) } });
    });
  });
  // Filled elevation bands underneath the contour lines above — the
  // lines alone were the map's only elevation cue and read as a couple
  // of faint decorative rings on flat colour, not raised ground. Three
  // concentric filled rings per Hilltop district, largest/coolest at
  // the bottom (added first, so later/smaller ones paint over it) up to
  // smallest/warmest right at the district's own centre — an actual
  // layered-terrain look built from fills, since there's no real DEM/
  // hillshade data to draw from.
  const hillBandFeatures = [];
  districts.filter(d=> /^Hilltop/.test(d.info)).forEach((d,di)=>{
    const cx = parseFloat(d.x), cy = parseFloat(d.y);
    const baseR = (districtRadii.get(d) || 6) * 1.9;
    [[2.6, "rgba(115,98,52,0.09)"], [1.9, "rgba(140,115,58,0.12)"], [1.3, "rgba(168,138,68,0.15)"]].forEach(([mult, tint], ri)=>{
      const ring = blobRing(cx, cy, baseR * mult, di * 61 + ri * 17 + 5000, 16);
      hillBandFeatures.push({ type:"Feature", properties:{ fill: tint }, geometry:{ type:"Polygon", coordinates: [ schematicRingToLngLat(ring) ] } });
    });
  });

  // OPEN CONCOURSES — a visibly wider, paler paved patch at the handful
  // of spots reference footage actually shows opening up into a real
  // town square/concourse, rather than staying a narrow path: Oldtown
  // (the confirmed path-network hub, per the official app's own
  // schematic overview — Grand Central/Anara Forest/Quantum all radiate
  // from it), Grand Central (its stage front reads as a wide open
  // concourse in every reference frame, not a thin approach path —
  // also now the real hub for the whole Hide Out Hilltop/Full Moon
  // Ballroom/Tangled Roots cluster, since Copperwood's own map pin was
  // removed, see the locations array comment), Botanica (the Letsbe
  // Avenue loop is a real closed "high street" with stalls strung along
  // it, not a single-file track), Area 404 (reads as a walled/clustered
  // plaza in reference frames, distinctly more open than the thin paths
  // reaching it), and Metropolis/Quantum (both confirmed path forks/
  // junctions where several routes meet). This exists so those specific
  // spots read as "a place to actually stand," visually distinct from
  // the constant-width trail lines connecting them — every other
  // district still uses only its own broad, fainter clearing tint
  // (districts-fill above), not this.
  const OPEN_CONCOURSE_NAMES = ["Oldtown", "Grand Central", "Botanica", "Area 404", "Metropolis", "Quantum"];
  const openConcourseFeatures = OPEN_CONCOURSE_NAMES.map((name, i)=>{
    const d = districts.find(dd=> dd.name === name);
    const node = findNamedNode(name);
    if(!node) return null;
    const cx = node.x, cy = node.y;
    // District hubs size their concourse off the district's own already-
    // computed spread radius (a paved core sitting inside its bigger
    // green clearing); Quantum (a path fork, not a district) gets a flat
    // smaller footprint since it's a junction, not a town centre.
    const r = d ? Math.max(2.6, Math.min(5, (districtRadii.get(d) || 6) * 0.5)) : 3;
    // fieldRing, not blobRing — a real plaza/concourse is a paved AREA
    // with actual edges (like a town square), not a soft circular glow;
    // 7 sides keeps it clearly a bounded shape without reading as a
    // stiff geometric rectangle either.
    return {
      type: "Feature", properties: {},
      geometry: { type: "Polygon", coordinates: [ schematicRingToLngLat(fieldRing(cx, cy, r, r * 0.85, i * 43 + 19, 7)) ] }
    };
  }).filter(Boolean);

  // Stage plazas — a soft tan clearing under every stage. The reference
  // video shows paths widening into a real open plaza around a stage
  // (see the Tribe of Frog frame) rather than staying a thin line all
  // the way up to the building — every other path in this basemap is a
  // constant-width line, so stages (the one place a path visibly widens)
  // had nothing to show that. Originally only main stages got this —
  // minor stages (otherStages/minorStages, Tribe of Frog itself among
  // them, standing alone outside any district clearing) were left with
  // just a single generic building and nothing else, so that whole
  // stretch of the map read noticeably flatter/emptier than the parts
  // covered by a district. Minor stages get the same treatment now, at
  // a slightly smaller radius since they're a smaller real footprint.
  const stagePlazaFeatures = locations.filter(p=>p.kind === "stage").map((s,i)=>({
    type: "Feature", properties: {},
    geometry: { type: "Polygon", coordinates: [ schematicRingToLngLat(blobRing(parseFloat(s.x), parseFloat(s.y), 2.8, i * 41 + 9, 10)) ] }
  })).concat(minorStages.map((s,i)=>({
    type: "Feature", properties: {},
    geometry: { type: "Polygon", coordinates: [ schematicRingToLngLat(blobRing(parseFloat(s.x), parseFloat(s.y), 2.1, i * 53 + 4000, 9)) ] }
  })));

  // Bunting/flag accents scattered around each stage plaza — the Tribe
  // of Frog frame shows small bright pink flag/flower dots dotted
  // through the clearing around a stage, decoration this map had none
  // of; every other point-scatter texture (trees, tent confetti, cars)
  // already exists, stages had nothing of their own. Minor stages get a
  // lighter scatter (5 points vs 8) — present, but visibly less dressed
  // than a main stage, matching how they read in the video.
  const BUNTING_COLORS = ["rgba(235,95,150,0.8)", "rgba(255,205,60,0.8)", "rgba(120,220,190,0.8)"];
  let buntingPts = [];
  locations.filter(p=>p.kind === "stage").forEach((s,i)=>{
    const rand = seededRand(2600 + i * 13);
    for(let k=0;k<8;k++){
      const a = rand() * Math.PI * 2, r = 1.4 + rand() * 2.2;
      const x = parseFloat(s.x) + Math.cos(a) * r, y = parseFloat(s.y) + Math.sin(a) * r * 0.85;
      buntingPts.push({ x, y, color: BUNTING_COLORS[Math.floor(rand() * BUNTING_COLORS.length)] });
    }
  });
  minorStages.forEach((s,i)=>{
    const rand = seededRand(4600 + i * 13);
    for(let k=0;k<5;k++){
      const a = rand() * Math.PI * 2, r = 1.2 + rand() * 1.7;
      const x = parseFloat(s.x) + Math.cos(a) * r, y = parseFloat(s.y) + Math.sin(a) * r * 0.85;
      buntingPts.push({ x, y, color: BUNTING_COLORS[Math.floor(rand() * BUNTING_COLORS.length)] });
    }
  });
  const buntingFeatures = buntingPts.map(t=>{
    const c = schematicToLatLon(t.x, t.y);
    return { type:"Feature", properties:{ color: t.color }, geometry:{ type:"Point", coordinates:[c.lon, c.lat] } };
  });

  // Spokes/capillaries/camp-spokes/parking-spokes/gate-spokes REMOVED
  // this pass — all five were auto-generated "nearest point" straight-
  // ish lines with NO footage evidence behind them (every stage/hidden-
  // venue/camp/parking-area/gate not already in TRUNK_PATH_EDGES just
  // got a line drawn to whatever was geometrically closest). Reported
  // directly: "don't use any path lines that are not true footpaths
  // shown in the real boomtown map." TRUNK_PATH_EDGES above is the only
  // path data this map draws now — every edge in it is backed by a
  // specific reference frame (see its own inline comments); a stage or
  // venue with no confirmed path just shows its marker with no line, which
  // is more honest than inventing one. Spacing/separation between zones
  // now comes from the field/plaza shapes (fieldRing) and district/camp
  // borders from recent passes, not from filling every gap with a path.

  // Building footprints — a small tan/orange rotated-rectangle under
  // every CONFIRMED stage marker (main or minor) so district interiors
  // read as an actual built-up town, matching the reference video's
  // dense scatter of building-block shapes around every venue icon,
  // instead of just a bare coloured clearing with pins floating on it.
  // One in four is a hollow outline-only "fenced enclosure" instead of a
  // solid fill (see "Trough Love" in Oldtown in the reference video — a
  // beer-garden-style fenced yard, not a roofed building).
  //
  // Deliberately NOT `districtMemberPoints` (which also includes
  // thingsToFind, i.e. hidden venues) — the official app never draws a
  // building for a hidden venue; it's not marked on the map at all
  // beyond a vague "?" (this map's own equivalent is the dashed "secret"
  // marker thingsToFind already renders as, see the "?" markers further
  // down). Drawing a real building box under every hidden venue on top
  // of each district's own generic infill scatter was stacking two
  // unrelated things in the same small area — reported as "various
  // squares overlapping in smaller venue areas... where hidden venues
  // might be", when a real district should read as a handful of
  // buildings, not a dozen boxes crammed together. Hidden venues still
  // affect district sizing (districtSpreadR above still counts them, so
  // the district's clearing still reaches far enough to cover them) and
  // still get a collision-avoidance slot so a generic infill building
  // doesn't render directly on top of one's "?" marker (see
  // placedBuildingCenters below, still seeded from thingsToFind too) —
  // they just don't get their own drawn building shape.
  const namedBuildingPoints = locations.filter(p=>p.kind === "stage").concat(minorStages);
  const solidBuildingFeatures = [];
  const fencedEnclosureFeatures = [];
  const SPECIAL_SHAPE_VENUES = new Set(["Full Moon Ballroom", "Spectrum 360", "NEXUS"]);
  namedBuildingPoints.forEach((p,i)=>{
    const ring = schematicRingToLngLat(venueFootprint(p.name, parseFloat(p.x), parseFloat(p.y), i * 29 + 5));
    const feature = { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } };
    // Special-shape venues are solid, confirmed structures, never the
    // hollow "fenced enclosure" treatment below — that's for the
    // otherwise-random 1-in-4 open-yard look, not these.
    if(!SPECIAL_SHAPE_VENUES.has(p.name) && i % 4 === 3) fencedEnclosureFeatures.push(feature);
    else solidBuildingFeatures.push(feature);
  });

  // Decorative infill buildings — a wide reference-video frame showing
  // several districts at once (Botanica/Metropolis together) has
  // noticeably MORE small building blocks scattered through each
  // district than this map has named venues to place them at — generic
  // stalls/toilets/backstage structures with no name of their own. A
  // handful of small unlabeled rectangles scattered through each
  // district's own clearing (same buildingFootprint shape, offset from
  // its centre so they don't stack on the plaza) fills that density gap
  // without needing real data for each one.
  //
  // Every building placed below (both here and the named-venue ones
  // above) used to have zero mutual collision-avoidance — each one
  // placed independently by its own seeded random angle/distance, so two
  // nearby buildings (especially in the busier 11-per-district infill
  // scatter) could easily land on top of each other, reported as venues
  // with "overlapping store boxes". Named-venue buildings above are
  // never moved (their position IS the evidenced data, and real venues
  // legitimately do sit close together in dense clusters like Oldtown),
  // but every decorative infill building below now checks its centre
  // against every already-placed building (named or infill) and retries
  // a few times, keeping the least-bad spot if it can't clear the gap —
  // bounded, so this can never loop forever.
  const placedBuildingCenters = districtMemberPoints.map(p=> [parseFloat(p.x), parseFloat(p.y)]);
  const MIN_BUILDING_SEP = 1.5;
  // Decorative infill buildings now bias toward sitting along a real
  // trunk-path edge when one actually passes near this cluster, instead
  // of a pure random angle/distance from the centre — real festival
  // stalls/tents front onto a footpath, they don't scatter freely across
  // open ground. Falls back to the old radial-random placement when no
  // trunk segment comes close enough to this cluster to plausibly be
  // "the path it fronts onto" (most minor stages/small clusters still
  // won't have one nearby, which is fine — not every building needs to
  // be path-adjacent, just biased toward it where a real path exists).
  function pickClearBuildingSpot(cx, cy, minDist, maxDist, rand){
    const trunk = nearestTrunkPoint(cx, cy);
    const usePath = trunk && trunk.dist <= maxDist * 1.3;
    let best = null, bestNearest = -Infinity;
    for(let attempt=0; attempt<6; attempt++){
      let x, y;
      if(usePath){
        const dlen = Math.sqrt(trunk.dx * trunk.dx + trunk.dy * trunk.dy) || 1;
        const ux = trunk.dx / dlen, uy = trunk.dy / dlen;
        const nx = -uy, ny = ux;
        const along = (rand() - 0.5) * maxDist * 1.6;
        const side = (rand() < 0.5 ? -1 : 1) * (minDist + rand() * (maxDist - minDist)) * 0.6;
        x = trunk.x + ux * along + nx * side;
        y = trunk.y + uy * along + ny * side * 0.85;
      } else {
        const a = rand() * Math.PI * 2;
        const dist = minDist + rand() * (maxDist - minDist);
        x = cx + Math.cos(a) * dist; y = cy + Math.sin(a) * dist * 0.85;
      }
      let nearest = Infinity;
      placedBuildingCenters.forEach(p=>{ nearest = Math.min(nearest, Math.hypot(p[0] - x, p[1] - y)); });
      if(nearest >= MIN_BUILDING_SEP){ placedBuildingCenters.push([x, y]); return [x, y]; }
      if(nearest > bestNearest){ bestNearest = nearest; best = [x, y]; }
    }
    placedBuildingCenters.push(best);
    return best;
  }
  const infillBuildingFeatures = [];
  districts.forEach((d,di)=>{
    const cx = parseFloat(d.x), cy = parseFloat(d.y);
    const r = districtRadii.get(d);
    const rand = seededRand(di * 137 + 19);
    // Scales with the district's own radius now (was a flat 11 for
    // every district regardless of size) — since clearanceRadius above
    // was rebalanced to stop squashing districts with a genuinely large
    // member spread (Oldtown especially) down to the same small size as
    // a tighter one, a flat building count would leave a bigger district
    // reading noticeably SPARSER than before purely because the same 11
    // buildings now spread over more ground. 11 stays the reference
    // count at radius 7 (roughly this map's median district size before
    // the rebalance), scaled by area (radius²) so density stays
    // consistent district to district, clamped so a very small or very
    // large district doesn't go absurdly sparse/dense.
    const count = Math.round(Math.min(20, Math.max(6, 11 * (r / 7) ** 2)));
    for(let k=0;k<count;k++){
      const [x, y] = pickClearBuildingSpot(cx, cy, r * 0.35, r * 0.85, rand);
      infillBuildingFeatures.push({
        type: "Feature", properties: {},
        geometry: { type: "Polygon", coordinates: [ schematicRingToLngLat(buildingFootprint(x, y, di * 137 + 19 + k * 7)) ] }
      });
    }
  });
  // Same infill treatment for minor stages (fewer buildings than a
  // whole district gets, since it's one stage's worth of ground, not a
  // district's) — closes the same density gap around standalone minor
  // stages that stagePlazaFeatures/buntingFeatures above address, so a
  // minor stage sitting outside any district clearing (Tribe of Frog,
  // in the reference video's own southern stretch, among others) reads
  // as a real built-up spot rather than one bare building on plain grass.
  minorStages.forEach((s,mi)=>{
    const cx = parseFloat(s.x), cy = parseFloat(s.y);
    const rand = seededRand(mi * 149 + 6000);
    // 5, not 4 — with hidden-venue boxes removed (see namedBuildingPoints
    // above), a minor stage's own little cluster reads as roughly the
    // "5-6 real buildings" a small venue area should show, not padded
    // out by boxes that used to represent hidden venues nearby.
    const count = 5;
    for(let k=0;k<count;k++){
      const [x, y] = pickClearBuildingSpot(cx, cy, 2.6, 4.2, rand);
      infillBuildingFeatures.push({
        type: "Feature", properties: {},
        geometry: { type: "Polygon", coordinates: [ schematicRingToLngLat(buildingFootprint(x, y, mi * 149 + 6000 + k * 7)) ] }
      });
    }
  });

  // Main-stage glow — the reference video shows every major stage as a
  // soft coloured halo bleeding into the ground around it (orange around
  // The Lion's Den, purple around ENDOR, etc), a strong at-a-glance
  // "this is a live music area" cue our stages didn't have at all. One
  // point per stage, three stacked circle layers (see loadMap) fake a
  // blur by shrinking radius/raising opacity toward the centre — real
  // radial-gradient blur isn't expressible in a MapLibre circle paint.
  // Opacities nudged back up a little (0.05/0.09/0.18 -> 0.08/0.14/0.26)
  // — with the map's other layers (overlaps, path shapes, borders) much
  // cleaner now than when this was first tuned down for "overpowering
  // everything else", the glow was reading as too subtle for the vivid,
  // clearly-visible halos reference screenshots actually show around
  // every stage marker.
  const STAGE_GLOW_COLORS = ["255,140,60", "190,110,255", "90,200,255", "255,90,150", "255,210,80", "120,255,170"];
  const glowStages = locations.filter(p=>p.kind === "stage");
  const stageGlowFeatures = glowStages.map((s,i)=>{
    const c = schematicToLatLon(parseFloat(s.x), parseFloat(s.y));
    const rgb = STAGE_GLOW_COLORS[i % STAGE_GLOW_COLORS.length];
    return {
      type:"Feature",
      properties:{ colorOuter: `rgba(${rgb},0.08)`, colorMid: `rgba(${rgb},0.14)`, colorCore: `rgba(${rgb},0.26)` },
      geometry:{ type:"Point", coordinates:[c.lon, c.lat] }
    };
  });

  // Minor stages previously had NO glow at all — reference footage shows
  // one just as clearly around smaller stages (Tribe of Frog's own
  // purple/orange glow marker, Helix's salmon circle, etc), just smaller
  // than a main stage's. Same three-layer technique, own colour cycle
  // (offset from the main-stage one so a minor stage next to a main one
  // doesn't accidentally share its exact hue) and roughly half the size.
  const MINOR_GLOW_COLORS = ["230,140,150", "150,190,230", "230,190,110", "170,150,230"];
  const minorStageGlowFeatures = minorStages.map((s,i)=>{
    const c = schematicToLatLon(parseFloat(s.x), parseFloat(s.y));
    const rgb = MINOR_GLOW_COLORS[i % MINOR_GLOW_COLORS.length];
    return {
      type:"Feature",
      properties:{ colorOuter: `rgba(${rgb},0.06)`, colorMid: `rgba(${rgb},0.11)`, colorCore: `rgba(${rgb},0.2)` },
      geometry:{ type:"Point", coordinates:[c.lon, c.lat] }
    };
  });

  // Parking AREAS — grey fields (the reference video shows these as flat
  // grey/salmon grid-lined ground, clearly separate from both the
  // green/yellow camping fields and the busy district clearings), with a
  // few straight internal "row" lines so it reads as a car park rather
  // than just another grey blob.
  const parkingFeatures = parkingAreas.map((p,i)=>{
    const cx = parseFloat(p.x), cy = parseFloat(p.y);
    const r = clearanceRadius(cx, cy, p, p.r);
    // fieldRing, not blobRing — a real car park is a rectangle with rows
    // in it (see the row lines just below), not a circular blob; a
    // slight rectangle (4 sides, low jitter) reads far closer to that.
    return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ schematicRingToLngLat(fieldRing(cx, cy, r * 1.15, r * 0.75, 1200 + i * 37, 4)) ] } };
  });
  let parkingRowFeatures = [];
  let parkingCarFeatures = [];
  parkingAreas.forEach((p,i)=>{
    const cx = parseFloat(p.x), cy = parseFloat(p.y);
    const r = clearanceRadius(cx, cy, p, p.r);
    const rand = seededRand(1300 + i * 53);
    for(let row=-2;row<=2;row++){
      const y = cy + row * (r / 3);
      parkingRowFeatures.push({ type:"Feature", properties:{}, geometry:{ type:"LineString", coordinates: schematicRingToLngLat([[cx - r * 0.8, y], [cx + r * 0.8, y]]) } });
      // Small evenly-spaced "car" dots along each row line — the
      // reference video's own car parks read as a dense grid of tiny
      // rectangles, not a flat grey fill with a few guide lines; a
      // scatter of small pale dots along the rows gives the same
      // "parked in rows" impression without drawing 100+ individual
      // vehicle shapes.
      const carsPerRow = 7;
      for(let k=0;k<carsPerRow;k++){
        if(rand() < 0.15) continue; // a few gaps so the row doesn't look perfectly full
        const x = cx - r * 0.72 + (r * 1.44) * (k / (carsPerRow - 1));
        const c = schematicToLatLon(x, y + (rand() - 0.5) * (r / 12));
        parkingCarFeatures.push({ type:"Feature", properties:{}, geometry:{ type:"Point", coordinates:[c.lon, c.lat] } });
      }
    }
  });

  // Premium camp AREAS — the reference videos show Camp Orchid Downtown
  // and the two Camp Skylark sites as solid colour-filled fields (pink
  // for Orchid, warm yellow for Skylark), distinct from the plain green
  // used for ordinary camping — matched here for the same reason the
  // forest/district areas got fills instead of a floating text label.
  // Camp Orchid Downtown specifically reads as a rounded diamond rather
  // than a circle (seen clearly, twice, across both videos), so it gets
  // fewer ring points for a more angular shape than the Skylark camps.
  const campAreaDefs = campLabels.filter(c=> /premium/i.test(c.text));
  const campAreaRadii = new Map();
  const campFeatures = campAreaDefs.map((c,i)=>{
    const isDowntown = /downtown/i.test(c.text);
    const cx = parseFloat(c.x), cy = parseFloat(c.y);
    const r = campClearanceRadius(cx, cy, c, 18);
    campAreaRadii.set(c, r);
    // fieldRing, not blobRing — same "real bounded area, not a circle"
    // reasoning as the ordinary camp fields above. Orchid Downtown keeps
    // its own evidenced rounded-diamond look (4 sides); Skylark gets a
    // gentler 8-sided field shape, still faceted rather than smooth-round.
    return {
      type: "Feature",
      properties: { fill: isDowntown ? "rgba(235,120,120,0.55)" : "rgba(235,196,90,0.6)" },
      geometry: { type: "Polygon", coordinates: [ schematicRingToLngLat(fieldRing(cx, cy, r, r * (isDowntown ? 0.8 : 0.9), 700 + i * 61, isDowntown ? 4 : 8)) ] }
    };
  });

  // A small triangular tree-ring/hedge path inside Camp Orchid Downtown —
  // a distinctive real feature visible clearly (and repeatedly) in both
  // reference videos, not present anywhere else on the map. Sized to
  // half the camp's own (possibly clearance-shrunk) radius so it always
  // stays inside the camp area fill instead of poking out past its edge.
  const downtownCamp = campAreaDefs.find(c=> /downtown/i.test(c.text));
  const triangleFeature = downtownCamp ? {
    type: "Feature", properties: {},
    geometry: { type: "LineString", coordinates: schematicRingToLngLat((()=>{
      const triR = Math.min(4, campAreaRadii.get(downtownCamp) * 0.5);
      const ring = blobRing(parseFloat(downtownCamp.x), parseFloat(downtownCamp.y), triR, 850, 3);
      ring.push(ring[0]);
      return ring;
    })()) }
  } : null;

  // Camp Skylark's two sites (Hilltop/Sunset) got no distinguishing
  // feature of their own — only Downtown Orchid's triangle. A rounder
  // hedge-ring (more points than the triangle, so it reads as a
  // different shape at a glance) gives each Skylark site the same
  // "there's something specific here" cue without inventing a new
  // real-world detail neither reference video actually showed for them.
  const skylarkCamps = campAreaDefs.filter(c=> /skylark/i.test(c.text));
  const skylarkRingFeatures = skylarkCamps.map((c,i)=>{
    const ringR = Math.min(3.2, campAreaRadii.get(c) * 0.45);
    const ring = blobRing(parseFloat(c.x), parseFloat(c.y), ringR, 950 + i * 17, 10);
    ring.push(ring[0]);
    return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: schematicRingToLngLat(ring) } };
  });

  // A real winding stream visible near Botanica/Hydro XL across the
  // reference video, running roughly past both — built from a few
  // waypoints each gently curved into the next for a winding look,
  // rather than one single bow (a stream over this distance visibly
  // bends more than once).
  const streamWaypoints = [[22,8],[27,18],[24,28],[30,40],[26,50]];
  let streamRing = [streamWaypoints[0]];
  for(let i=0;i<streamWaypoints.length-1;i++){
    const seg = curvedLine(streamWaypoints[i], streamWaypoints[i+1], 900 + i * 13);
    streamRing = streamRing.concat(seg.slice(1));
  }
  const streamFeature = { type:"Feature", properties:{}, geometry:{ type:"LineString", coordinates: schematicRingToLngLat(streamRing) } };

  // A small pond just south of Hydro XL — findings_screenshots.md notes
  // "what looks like a small pond immediately south of it," never
  // rendered before now (the stream above was the map's only water).
  // Fringe ring first (wider, paler, blends the water's edge into the
  // surrounding grass rather than a hard graphic circle), then the open
  // water on top, then a thin pale "shimmer" outline for definition.
  const pondCenter = [11, 50];
  const pondFringeRing = blobRing(pondCenter[0], pondCenter[1], 3.1, 8150, 12);
  const pondRing = blobRing(pondCenter[0], pondCenter[1], 2.1, 8100, 12);
  const pondFeatures = [
    { type:"Feature", properties:{ fill:"rgba(80,140,150,0.22)" }, geometry:{ type:"Polygon", coordinates:[ schematicRingToLngLat(pondFringeRing) ] } },
    { type:"Feature", properties:{ fill:"rgba(50,115,160,0.8)" }, geometry:{ type:"Polygon", coordinates:[ schematicRingToLngLat(pondRing) ] } }
  ];
  const pondOutlineFeature = { type:"Feature", properties:{}, geometry:{ type:"LineString", coordinates: schematicRingToLngLat(pondRing) } };

  // Ordinary camping fields — a soft sandy-yellow ground fill (the
  // reference video's own plain camping fields read as a warm
  // yellow-green, clearly lighter/warmer than both the dark stippled
  // woods and the bright open district grass), crossed by a couple of
  // straight real-farmland field-division lines the same way the video's
  // fields show, THEN the confetti tent dots scattered on top — before
  // this pass ordinary camping fields had no ground fill of their own at
  // all, just tent dots floating on whatever background/field-texture
  // happened to be underneath, which made them hard to tell apart from
  // plain open ground at a glance.
  const ordinaryCamps = campLabels.filter(c=> !/premium/i.test(c.text));
  const campFieldRadii = new Map();
  const campFieldFeatures = ordinaryCamps.map((c,i)=>{
    const cx = parseFloat(c.x), cy = parseFloat(c.y);
    const r = campClearanceRadius(cx, cy, c, 18);
    campFieldRadii.set(c, r);
    // fieldRing, not blobRing — real camping fields are farm-field-shaped
    // (mostly straight edges, an actual boundary), not a circular blob.
    // Elongation (rx vs ry) is itself seeded per-field so neighbouring
    // fields don't all read as the same stretched rectangle.
    const seed = 600 + i * 43;
    const aspect = 0.75 + seededRand(seed + 1)() * 0.5;
    return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ schematicRingToLngLat(fieldRing(cx, cy, r * aspect, r / aspect, seed, 6)) ] } };
  });
  let campFieldLineFeatures = [];
  ordinaryCamps.forEach((c,i)=>{
    const cx = parseFloat(c.x), cy = parseFloat(c.y);
    const r = campFieldRadii.get(c) * 0.85;
    const rand = seededRand(650 + i * 19);
    for(let l=0;l<2;l++){
      const a = rand() * Math.PI;
      const dx = Math.cos(a) * r, dy = Math.sin(a) * r * 0.8;
      campFieldLineFeatures.push({ type:"Feature", properties:{}, geometry:{ type:"LineString", coordinates: schematicRingToLngLat([[cx - dx, cy - dy], [cx + dx, cy + dy]]) } });
    }
  });
  let confettiPts = [];
  // Campervan Field gets small rectangular "vehicle" footprints instead
  // of round tent-confetti dots — it's parked campervans, not tents, and
  // every other camp field using the same round-dot texture regardless
  // of what's actually pitched there was one texture standing in for
  // two different real things.
  const campervanFeatures = [];
  ordinaryCamps.forEach((c,i)=>{
    if(/campervan/i.test(c.text)){
      const cx = parseFloat(c.x), cy = parseFloat(c.y), r = campFieldRadii.get(c) * 0.8;
      const rand = seededRand(1900 + i * 31);
      for(let k=0;k<16;k++){
        const a = rand() * Math.PI * 2, dist = rand() * r;
        const x = cx + Math.cos(a) * dist, y = cy + Math.sin(a) * dist * 0.85;
        campervanFeatures.push({ type:"Feature", properties:{}, geometry:{ type:"Polygon", coordinates:[ schematicRingToLngLat(buildingFootprint(x, y, 1900 + i * 31 + k * 7)) ] } });
      }
    } else {
      confettiPts = confettiPts.concat(confettiClusterPoints(parseFloat(c.x), parseFloat(c.y), 20, campFieldRadii.get(c) * 0.85, 800 + i * 47));
    }
  });
  const confettiFeatures = confettiPts.map((t,i)=>({
    type: "Feature", properties: { color: t.color },
    geometry: { type: "Polygon", coordinates: [ schematicRingToLngLat(tentDiamond(t.x, t.y, t.size, 3100 + i * 11)) ] }
  }));

  // Forest AREAS — a solid mottled-green clearing shape under each named
  // forest/woods spot, not just a scatter of tree dots floating on bare
  // background, so a wooded zone actually reads as one continuous area
  // (the individual tree dots below add texture on top of this, the way
  // a real illustrated map layers a base tone under icon detail).
  // Tribe of Frog added explicitly — its name doesn't match /Forest|Woods/
  // so it was getting no forest treatment at all, despite every reference
  // video this session describing it as sitting in its own wooded
  // clearing between Oldtown and Area 404 (reached via forked paths
  // through trees), and being called out directly as visibly wrong —
  // "just floating in open ground" — without one.
  // Radius used to be a flat 15 regardless of how close a neighbouring
  // district/camp/parking zone actually sat — with no clearance check at
  // all (forests weren't in zoneCenters), a big flat blob could swallow
  // right over a neighbour's centre, part of the "stage and forest space
  // overlaps" reported alongside the camp-field one. Now capped the same
  // safe way (accounting for blobRing's own up-to-1.22x bulge) against
  // every district/camp/parking/market-hub zone, same as camp fields.
  const forestSpots = locations.filter(p=> /Forest|Woods/.test(p.name))
    .concat(minorStages.filter(p=> p.name === "Tribe of Frog"))
    .concat(SSSI_SPOTS);
  function forestClearanceRadius(cx, cy){
    let minDist = Infinity;
    zoneCenters.forEach(z=>{ minDist = Math.min(minDist, Math.hypot(z.x - cx, z.y - cy)); });
    const safeMax = Math.max(4, (minDist / 2 - 0.4) / BLOB_MAX_OVERSIZE);
    return Math.min(Math.max(6, Math.min(15, minDist * 0.46 / BLOB_MAX_OVERSIZE)), safeMax);
  }
  const forestFeatures = forestSpots.map((f,i)=>({
    type: "Feature", properties: {},
    geometry: { type: "Polygon", coordinates: [ schematicRingToLngLat(blobRing(parseFloat(f.x), parseFloat(f.y), forestClearanceRadius(parseFloat(f.x), parseFloat(f.y)), 400 + i * 53, 16)) ] }
  }));
  // A wider, paler fringe ring under the forest's own dark fill —
  // without one, woods met open grass as one hard-edged colour change;
  // a real tree line thins out gradually. Drawn first (below the main
  // forests-fill layer) so it only shows as a soft halo around the
  // forest's true edge, not a second solid colour.
  const forestFringeFeatures = forestSpots.map((f,i)=>({
    type: "Feature", properties: {},
    geometry: { type: "Polygon", coordinates: [ schematicRingToLngLat(blobRing(parseFloat(f.x), parseFloat(f.y), forestClearanceRadius(parseFloat(f.x), parseFloat(f.y)) * 1.4, 450 + i * 53, 16)) ] }
  }));

  // Density bumped 22 -> 30 per named forest spot — the reference
  // video's woods read as densely stippled throughout, not sparse dots
  // with visible gaps of bare green between them.
  let treePts = [];
  // Tree spread now matches each forest's own clearance-capped radius
  // (was a flat 13, independent of the fill shape above) so the tree
  // texture never spills past a forest that got shrunk to avoid a close
  // neighbour, or leaves a bare gap inside one that didn't.
  forestSpots.forEach((f,i)=>{
    const fx = parseFloat(f.x), fy = parseFloat(f.y);
    treePts = treePts.concat(treeClusterPoints(fx, fy, 30, forestClearanceRadius(fx, fy) * 0.87, 17 + i * 41));
  });
  // Widened from 6 fixed corner clusters to a fuller ring running the
  // whole perimeter — real UK farm estates like Matterley typically
  // have tree-lined boundary hedgerows/copses all the way round, not
  // just at a handful of corners, and the old sparse set left long
  // stretches of the outer edge looking like bare empty field.
  { const edgeRand = seededRand(2400);
    const perimeterPoints = [
      [50,-8],[80,-6],[20,-6],[-8,30],[-8,70],[108,30],[108,70],
      [30,108],[70,108],[95,15],[95,85],[5,15],[5,85]
    ];
    perimeterPoints.forEach(([cx,cy],i)=>{
      treePts = treePts.concat(treeClusterPoints(cx + (edgeRand()-0.5)*6, cy + (edgeRand()-0.5)*6, 6 + Math.floor(edgeRand()*4), 6, 2500 + i * 31));
    });
  }
  const treeFeatures = treePts.map(t=>{
    const c = schematicToLatLon(t.x, t.y);
    return { type:"Feature", properties:{ size: t.size, color: t.color }, geometry:{ type:"Point", coordinates:[c.lon, c.lat] } };
  });
  const pathScrubFeatures = pathScrubPoints.map(t=>{
    const c = schematicToLatLon(t.x, t.y);
    return { type:"Feature", properties:{ size: t.size, color: t.color }, geometry:{ type:"Point", coordinates:[c.lon, c.lat] } };
  });

  const tentFeatures = [];
  for(let i=0;i<26;i++){
    const a = (i / 26) * Math.PI * 2;
    const wobble = seededRand(i * 13)();
    const rad = 46 + wobble * 3;
    const x = 50 + Math.cos(a) * rad;
    const y = 50 + Math.sin(a) * rad * 0.98;
    const c = schematicToLatLon(x, y);
    tentFeatures.push({ type:"Feature", properties:{ color: (i % 2 === 0) ? "rgba(45,168,242,0.6)" : "rgba(242,168,60,0.6)" }, geometry:{ type:"Point", coordinates:[c.lon, c.lat] } });
  }

  // Faint terrain-contour lines — purely decorative ground texture (not
  // information-bearing, so it adds visual richness without adding
  // anything to parse).
  const contourFeatures = [
    { type:"Feature", properties:{}, geometry:{ type:"LineString", coordinates: schematicRingToLngLat([[-5,38],[20,26],[50,20],[80,28],[105,42]]) } },
    { type:"Feature", properties:{}, geometry:{ type:"LineString", coordinates: schematicRingToLngLat([[-5,68],[20,58],[50,54],[80,62],[105,72]]) } }
  ];

  // The site boundary — built directly from SITE_SW/SITE_NE (the same
  // real-world box loadMap() uses for pan bounds, covering the extracted
  // map data's own real coordinates), NOT from the schematic space/affine
  // fit like everything else on this basemap. A hand-traced boundary in
  // schematic space, run through that fit, landed nowhere near almost
  // every real captured stage/POI coordinate — the boundary itself was
  // wrong, not the markers, so this is anchored to real lat/lon instead
  // and only lightly jittered (not hand-shaped) to guarantee it actually
  // contains everything real that's plotted on the map.
  const bPad = 0.08;
  const bLatPad = (SITE_NE.lat - SITE_SW.lat) * bPad;
  const bLonPad = (SITE_NE.lon - SITE_SW.lon) * bPad;
  const bS = SITE_SW.lat - bLatPad, bN = SITE_NE.lat + bLatPad;
  const bW = SITE_SW.lon - bLonPad, bE = SITE_NE.lon + bLonPad;
  const boundaryRand = seededRand(555);
  const jitterLat = (bN - bS) * 0.04, jitterLon = (bE - bW) * 0.04;
  const perSide = 4;
  const rawBoundary = [];
  for(let i=0;i<=perSide;i++) rawBoundary.push([bW + (bE - bW) * i / perSide, bS]);
  for(let i=1;i<=perSide;i++) rawBoundary.push([bE, bS + (bN - bS) * i / perSide]);
  for(let i=1;i<=perSide;i++) rawBoundary.push([bE - (bE - bW) * i / perSide, bN]);
  for(let i=1;i<perSide;i++) rawBoundary.push([bW, bN - (bN - bS) * i / perSide]);
  const boundaryRing = rawBoundary.map(([lon,lat])=> [lon + (boundaryRand() - 0.5) * jitterLon, lat + (boundaryRand() - 0.5) * jitterLat]);
  boundaryRing.push(boundaryRing[0]);
  const boundaryFeature = { type:"Feature", properties:{}, geometry:{ type:"LineString", coordinates: boundaryRing } };

  // Real named roads bordering the site — Alresford Rd (diagonal, NW
  // corner), Petersfield Rd (west edge continuing along the south) and
  // the A272 (same road, signed differently further along) — visible in
  // every whole-map reference screenshot but never rendered before.
  // Purely environmental context outside the site boundary, anchored in
  // real lat/lon like the boundary above rather than schematic space.
  // Hand-approximated bends (no real road-network data source) — treat
  // as "a road runs roughly here", not a surveyed centreline.
  const roadPad = 0.22;
  const rLatPad = (SITE_NE.lat - SITE_SW.lat) * roadPad;
  const rLonPad = (SITE_NE.lon - SITE_SW.lon) * roadPad;
  const alresfordRdFeature = {
    type: "Feature", properties: { name: "Alresford Rd" },
    geometry: { type: "LineString", coordinates: [
      [bW - rLonPad, bN + rLatPad * 0.6],
      [bW + (bE - bW) * 0.3, bN + rLatPad * 0.15],
      [bW + (bE - bW) * 0.55, bN - rLatPad * 0.1]
    ] }
  };
  const petersfieldRdFeature = {
    type: "Feature", properties: { name: "Petersfield Rd" },
    geometry: { type: "LineString", coordinates: [
      [bW - rLonPad * 0.3, bS + (bN - bS) * 0.5],
      [bW - rLonPad * 0.1, bS - rLatPad * 0.2],
      [bW + (bE - bW) * 0.25, bS - rLatPad * 0.5]
    ] }
  };
  const a272Feature = {
    type: "Feature", properties: { name: "A272" },
    geometry: { type: "LineString", coordinates: [
      [bW + (bE - bW) * 0.2, bS - rLatPad * 0.45],
      [bW + (bE - bW) * 0.6, bS - rLatPad * 0.6]
    ] }
  };
  const roadFeatures = [alresfordRdFeature, petersfieldRdFeature, a272Feature];

  // Perimeter fence posts — small evenly-spaced dots walking the
  // boundary ring, so the site edge reads as an actual (illustrated)
  // fence line instead of just a dashed sketch with nothing on it.
  const fencePostFeatures = [];
  for(let i=0;i<boundaryRing.length-1;i++){
    const [lon0,lat0] = boundaryRing[i], [lon1,lat1] = boundaryRing[i+1];
    const segLen = Math.hypot(lon1-lon0, lat1-lat0);
    const postsOnSeg = Math.max(1, Math.round(segLen / (jitterLon * 6)));
    for(let j=0;j<postsOnSeg;j++){
      const t = j / postsOnSeg;
      fencePostFeatures.push({ type:"Feature", properties:{}, geometry:{ type:"Point", coordinates:[lon0 + (lon1-lon0)*t, lat0 + (lat1-lat0)*t] } });
    }
  }

  return {
    fields: { type:"FeatureCollection", features: fieldFeatures },
    fieldsFine: { type:"FeatureCollection", features: fieldFeaturesFine },
    hedges: { type:"FeatureCollection", features: hedgeFeatures },
    stream: { type:"FeatureCollection", features: [streamFeature] },
    pond: { type:"FeatureCollection", features: pondFeatures },
    pondOutline: { type:"FeatureCollection", features: [pondOutlineFeature] },
    districts: { type:"FeatureCollection", features: districtFeatures },
    marketHub: { type:"FeatureCollection", features: marketHubFeatures },
    openConcourses: { type:"FeatureCollection", features: openConcourseFeatures },
    parkingAreas: { type:"FeatureCollection", features: parkingFeatures },
    parkingRows: { type:"FeatureCollection", features: parkingRowFeatures },
    parkingCars: { type:"FeatureCollection", features: parkingCarFeatures },
    campAreas: { type:"FeatureCollection", features: campFeatures },
    campFields: { type:"FeatureCollection", features: campFieldFeatures },
    campFieldLines: { type:"FeatureCollection", features: campFieldLineFeatures },
    campTriangle: { type:"FeatureCollection", features: triangleFeature ? [triangleFeature] : [] },
    skylarkRings: { type:"FeatureCollection", features: skylarkRingFeatures },
    forests: { type:"FeatureCollection", features: forestFeatures },
    forestFringe: { type:"FeatureCollection", features: forestFringeFeatures },
    trail: { type:"FeatureCollection", features: trailFeatures },
    stagePlazas: { type:"FeatureCollection", features: stagePlazaFeatures },
    bunting: { type:"FeatureCollection", features: buntingFeatures },
    buildings: { type:"FeatureCollection", features: solidBuildingFeatures },
    fencedEnclosures: { type:"FeatureCollection", features: fencedEnclosureFeatures },
    infillBuildings: { type:"FeatureCollection", features: infillBuildingFeatures },
    stageGlow: { type:"FeatureCollection", features: stageGlowFeatures },
    minorStageGlow: { type:"FeatureCollection", features: minorStageGlowFeatures },
    trees: { type:"FeatureCollection", features: treeFeatures },
    pathScrub: { type:"FeatureCollection", features: pathScrubFeatures },
    tents: { type:"FeatureCollection", features: tentFeatures },
    confetti: { type:"FeatureCollection", features: confettiFeatures },
    campervans: { type:"FeatureCollection", features: campervanFeatures },
    contours: { type:"FeatureCollection", features: contourFeatures },
    hillContours: { type:"FeatureCollection", features: hillContourFeatures },
    hillBands: { type:"FeatureCollection", features: hillBandFeatures },
    boundary: { type:"FeatureCollection", features: [boundaryFeature] },
    roads: { type:"FeatureCollection", features: roadFeatures },
    fencePosts: { type:"FeatureCollection", features: fencePostFeatures }
  };
}

// Layer visibility persists across loadMap() re-renders (tab switches, syncs,
// adding a hidden venue, etc. all refresh the map's markers). Off by
// default for the busier layers so the map isn't crowded on first arrival —
// "Other stages" and "Amenities" stay on since those are core wayfinding info.
let mapLayerVisible = { minor: true, secret: false, camp: false, landmark: false, poi: true, friend: true, sssi: true, road: true };

// ===============================
// REAL COORDINATE CALIBRATION — bridges this file's existing illustrative
// x/y (0-100 schematic space, see the ADD A PLACE comment further down)
// against real WGS84 lat/lon now available from window.BOOMTOWN_LOCATIONS_2026
// (extracted from the official Boomtown app's own map data — see
// js/boomtown-locations-2026.js — factual location data only, no
// proprietary map artwork/tileset). Two tiers:
//  1. EXACT — a schematic entry's name matches a BOOMTOWN_LOCATIONS_2026
//     stage's label exactly (case-insensitive): use that stage's real
//     lat/lon directly.
//  2. APPROXIMATE — everything else is projected with a straight linear
//     scale onto SITE_SW/SITE_NE (x:0-100 -> SITE_SW.lon-SITE_NE.lon,
//     y:0-100 -> SITE_NE.lat-SITE_SW.lat, matching this file's existing
//     y-down-is-south convention). This replaces an earlier fitted
//     affine transform (least-squares over 7 exact-name matches) that
//     turned out to have a real, confirmed bug: its own coefficients
//     implied the whole 0-100 schematic box was only ~180m across in
//     real terms, while SITE_SW/SITE_NE (the box this file already
//     trusts for pan bounds and the boundary polygon) spans a real
//     ~890m x 730m — a ~5x scale mismatch between two calibrations that
//     should agree. That's why real POI markers (accurate GPS, spread
//     across the true ~890x730m site) kept reading as "outside" the
//     approximate markers, which were all compressed into a patch a
//     fraction of the real site's size. This straight linear mapping is
//     less "precise" than a rotated/skewed fit would be IF that fit had
//     the right scale, but it's verifiably consistent with the one real
//     bounding box already used everywhere else in this file, which the
//     old fit demonstrably was not.
// ===============================
// Real-world bounds of the site, from the extracted map data's own
// coverage (js/boomtown-locations-2026.js) — shared by loadMap() (as the
// map's pan/zoom bounds), buildMapGeoJSON() (as the basemap's decorative
// site-boundary shape), AND schematicToLatLon() below, so every
// approximate position in this file is anchored to the same one real
// box instead of disagreeing calibrations.
const SITE_SW = { lat: 51.0495, lon: -1.2445 };
const SITE_NE = { lat: 51.0575, lon: -1.2340 };
function schematicToLatLon(xPercent, yPercent){
  const latSpan = SITE_NE.lat - SITE_SW.lat, lonSpan = SITE_NE.lon - SITE_SW.lon;
  return {
    lat: SITE_NE.lat - (yPercent / 100) * latSpan,
    lon: SITE_SW.lon + (xPercent / 100) * lonSpan
  };
}
// Exact inverse of schematicToLatLon — since that's a straight linear
// box-scaling (no rotation), this just runs the same two lines backwards.
// Used to place the real (GPS, not schematic-guessed) POI data from
// js/boomtown-locations-2026.js into the same 0-100 schematic space
// everything else in buildMapGeoJSON measures distance/overlap in, e.g.
// sizing the Pepperpot Market hub clearing to its real POI cluster.
function latLonToSchematic(lat, lon){
  const latSpan = SITE_NE.lat - SITE_SW.lat, lonSpan = SITE_NE.lon - SITE_SW.lon;
  return {
    x: (lon - SITE_SW.lon) / lonSpan * 100,
    y: (SITE_NE.lat - lat) / latSpan * 100
  };
}
// realStageMatch()/realCoordFor() (GPS name-matching used to place stage
// markers from js/boomtown-locations-2026.js's scraped lat/lon) removed
// entirely — repeated real incidents (see CLAUDE.md and the comment above
// SITE_SW/SITE_NE) showed that auto-scraped GPS regularly disagreed with
// the reference screen-recording/screenshot evidence of the official
// app's own map, and every silent GPS override re-broke a position that
// had just been hand-corrected against that footage. The footage is the
// only thing users actually navigate by, so it's now the single source
// of truth for every marker on this map — nothing here reads from
// js/boomtown-locations-2026.js to place a marker anymore (see the
// schematicToLatLon()-only calls below and in buildMapGeoJSON()).

// ===============================
// MAP — a real MapLibre GL (WebGL) map (real GPS positions where we have
// them, honestly-approximate ones elsewhere — see the calibration section
// above), replacing both the old hand-drawn SVG schematic and the
// Leaflet+satellite-tile version that followed it. Boomtown's own map
// artwork/tileset is proprietary and deliberately not used here — only
// the factual location data extracted alongside it
// (js/boomtown-locations-2026.js) feeds this.
//
// The basemap illustration (districts/trail/spokes/trees/tents — see
// buildMapGeoJSON above) is GeoJSON added as MapLibre sources/layers,
// which MapLibre triangulates into a GPU mesh once and renders directly
// every frame — this is the piece that actually benefits from "GPU mesh
// instead of redrawing paths." The individual interactive markers
// (stages, gates, POIs, etc. — a few dozen, each needing its own click
// handler/label) stay as plain positioned DOM elements via
// maplibregl.Marker, the same divIcon-style approach Leaflet used —
// there's no real benefit to tessellating ~80 individually-clickable
// HTML elements into a mesh, so only the decorative basemap art moved.
//
// The map itself is created ONCE (see the `if(!mapGL)` branch below) and
// never torn down — loadMap() is called often (every background sync,
// every place add/remove, every tab visit; see refreshAfterMerge()), and
// rebuilding the whole map on each of those would reset the user's
// pan/zoom mid-exploration. Only the marker layers are cleared and
// redrawn each call; the GeoJSON basemap art is added once inside
// mapGL.on("load", ...) and never rebuilt. MapLibre can be constructed
// while its container is hidden (Home is the default active tab, so the
// very first load-time call happens off-screen) — it just won't size
// itself correctly until mapGL.resize() runs once the container is
// actually visible, which the tab-click handler triggers on every visit
// to Map.
// ===============================
let mapGL = null;
let mapMarkerGroups = {};
let mapMarkersByName = {};

// Every marker on this map is one combined DOM element (a positioning
// dot plus its label) rather than two separate layers per place —
// simpler to keep in sync, and the existing .marker/.map-label CSS
// (position:absolute; left:0; top:0 plus each variant's own centering
// margin/transform) already assumes exactly this "both positioned from
// the same 0,0 anchor" structure, carried over unchanged from the old
// schematic map.
function mapMarkerHtml(dotClass, labelClass, name, icon){
  return `
    <div class="marker ${dotClass}">${icon || ""}</div>
    ${name ? `<div class="map-label ${labelClass || ""}">${escapeHtml(name)}</div>` : ""}
  `;
}
// groupName is a plain string key into mapMarkerGroups/mapLayerVisible
// (e.g. "main", "minor", "poi") — MapLibre has no Leaflet-style
// LayerGroup object, so group membership/visibility is tracked here
// instead, by hiding/showing each marker's own DOM element.
function addMapMarker(groupName, lat, lon, html, opts){
  opts = opts || {};
  const el = document.createElement("div");
  el.innerHTML = html;
  if(opts.title) el.title = opts.title;
  if(opts.onClick) el.addEventListener("click", (e)=>{ e.stopPropagation(); opts.onClick(); });
  // anchor:"top-left" (not MapLibre's default "center") so the element's
  // own top-left lands exactly on the coordinate, matching the
  // .marker/.map-label CSS's own centering math — the same contract
  // Leaflet's iconAnchor:[0,0] gave us before.
  const marker = new maplibregl.Marker({ element: el, anchor: "top-left" }).setLngLat([lon, lat]).addTo(mapGL);
  if(mapLayerVisible[groupName] === false) el.style.display = "none";
  if(!mapMarkerGroups[groupName]) mapMarkerGroups[groupName] = [];
  mapMarkerGroups[groupName].push(marker);
  if(opts.name) mapMarkersByName[opts.name] = { marker, onClick: opts.onClick || null };
  return marker;
}
function showMapInfoCard(html){
  if(mapInfo) mapInfo.innerHTML = html;
}

// Real amenity POIs (toilets, food, bars, water, welfare, lockers, etc.)
// from the official app's own map data — nothing like this existed on
// the old schematic map at all; this is the main new layer of detail
// this real-map upgrade adds.
const POI_ICONS = {
  "Toilets":"🚻","Food":"🍔","Bar":"🍺","Water Point":"💧","Welfare":"🩹",
  "Lockers":"🔒","First Aid":"🩹","Power/Charging":"🔌","Top-Up Point":"💳",
  "Cash Point":"💳","Accessible Facilities":"♿","Showers":"🚿","Market":"🛍",
  "Merch":"👕","Reception":"ℹ️","Photobooth":"📸","Pamper Area":"💆",
  "Fire Pit":"🔥","Hooch Bar":"🍺","Sober Bar":"🥤","Skylark Entry":"🚪",
  "The Hideout Hilltop":"🏕"
};
// Category-coloured ring per amenity icon, matching the official app's
// own colour-coded pill buttons (Bar/Food/Toilet/Medical, each a
// distinct hue) and marker rings — every POI on this map previously
// used the same neutral dark-grey ring regardless of category, which
// read as far flatter/less legible-at-a-glance than the official app's
// own colour-keyed icon set.
const POI_RING_COLORS = {
  "Toilets":"45,140,242", "Accessible Facilities":"45,140,242", "Showers":"45,140,242",
  "Food":"242,168,60", "Market":"242,168,60", "Merch":"242,168,60",
  "Bar":"227,80,140", "Hooch Bar":"227,80,140", "Sober Bar":"75,200,180",
  "Water Point":"75,190,242",
  "Welfare":"227,70,70", "First Aid":"227,70,70",
  "Lockers":"170,170,175", "Power/Charging":"170,170,175", "Top-Up Point":"170,170,175", "Cash Point":"170,170,175",
  "Reception":"200,200,205", "Photobooth":"196,150,255", "Pamper Area":"196,150,255",
  "Fire Pit":"242,120,60", "Skylark Entry":"242,168,60", "The Hideout Hilltop":"196,140,90"
};

// venueDirectory already carries genre/status/music for every stage and
// most hidden venues (built for the Map tab's own filterable directory
// table) but none of it reached the map's own tap-to-open info cards,
// which only ever showed a name + one info paragraph. Looked up by exact
// name match — same matching venueDirectory's own table already relies on.
function venueMetaHtml(name){
  const v = venueDirectory.find(v=> v.name === name);
  if(!v) return "";
  const bits = [];
  if(v.genre && v.genre !== "—") bits.push(escapeHtml(v.genre));
  if(v.status && v.status !== "confirmed") bits.push(`<strong>${escapeHtml(v.status)}</strong>`);
  return bits.length ? `<p class="empty-note">${bits.join(" · ")}</p>` : "";
}

function loadMap(){
  if(!mapGL){
    // Centered on the real site (schematic (0,0) run through the same
    // calibration fit used everywhere else, not a hand-picked guess),
    // zoom chosen to fit the ~1.2km span the extracted map data
    // actually covers (see js/boomtown-locations-2026.js's coverage
    // caveat), padded and bounded so panning can't wander off into
    // blank space with nothing plotted on it. SITE_SW/SITE_NE are
    // shared module-level consts (see above) — buildMapGeoJSON's
    // decorative boundary shape is built from the same two points.
    const pad = 0.25;
    const latPad = (SITE_NE.lat - SITE_SW.lat) * pad;
    const lonPad = (SITE_NE.lon - SITE_SW.lon) * pad;
    const MAX_BOUNDS = [
      [SITE_SW.lon - lonPad, SITE_SW.lat - latPad],
      [SITE_NE.lon + lonPad, SITE_NE.lat + latPad]
    ];
    mapGL = new maplibregl.Map({
      container: map,
      // A fully local style — solid background colour, no tile/sprite/
      // glyph URLs — so the map needs zero network requests once
      // MapLibre itself has loaded, same "works with zero signal" goal
      // as the rest of this PWA's service worker.
      // Brighter, more saturated open-grass tone than before (was
      // #3f7a4e) — reference screenshots of the official app's own map
      // show a noticeably more vivid, almost lawn-like green for open
      // ground, with woods/forest fill reading as a clearly darker patch
      // on top of it (see forests-fill below) rather than the two being
      // close in tone.
      style: { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": "#4fa35c" } }] },
      center: [-1.2394, 51.0534],
      // Zoom bumped from 14.4 back up to 15.4 — the fully-zoomed-out
      // 14.4 view (previous pass) showed a lot of surrounding blank
      // countryside/MAX_BOUNDS padding around a small festival footprint
      // in the middle; 15.4 has the actual site grounds fill most of the
      // screen on open, closer to how the official app's own map reads,
      // while still starting one step looser than a specific corner
      // (minZoom 14 still lets you zoom all the way out from here).
      // Bearing/pitch start at 0/0 (north-up, flat), matching the
      // official app's own opening view — but rotation itself stays
      // enabled (two-finger twist, right-click-drag), same as the
      // official app, rather than locked. showCompass:true on the
      // NavigationControl below gives a tap-to-reset-north button once
      // rotated, so "can still move/rotate freely" doesn't mean "no way
      // back to north".
      // The 17.6/minZoom:16 retune (previous pass) got the direction of
      // the schematicToLatLon scale fix backwards: that fix made the
      // real SITE_SW/SITE_NE box the actual coordinate space (previously
      // points were compressed toward the centre by the old broken fit,
      // so the "site" rendered as an artificially small cluster that
      // needed a big zoom-in to fill the screen). With points now
      // correctly spread across the real ~890m x 735m site footprint,
      // showing the whole site needs a real-world-distance calculation,
      // not a repeat of the old compressed-view zoom level — worked out
      // from Web Mercator's meters-per-pixel formula (156543*cos(lat)/2^z)
      // against the site's actual span, ~zoom 15.6 shows the full site
      // with a little padding on a typical phone screen. minZoom dropped
      // back down so pinch/tap "-" can actually zoom out from there
      // instead of being capped right at the opening view.
      zoom: 15.6, minZoom: 13.5, maxZoom: 19,
      maxBounds: MAX_BOUNDS,
      attributionControl: false
    });
    mapGL.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-left");

    // Label thinning by zoom — see the #map.map-labels-thin CSS rule.
    // Every marker's text label is a plain positioned DOM element with
    // no MapLibre-level collision detection, so the default (zoomed-out)
    // view packs 20+ names into one small cluster and they stack on top
    // of each other unreadably. Below LABEL_ZOOM_THRESHOLD only district
    // and main-stage names show (the two things worth seeing at a glance
    // without zooming in — the default opening zoom of 15.6 sits below
    // this threshold, so main stage names used to be invisible until you
    // zoomed in past 16.4); zooming in past it brings every other, more
    // minor label back once there's actually room for them. Runs on
    // every "zoom" tick (cheap — it's one class toggle, not a re-render)
    // plus once on load so the very first frame is already correct.
    const LABEL_ZOOM_THRESHOLD = 16.4;
    const updateLabelDensity = ()=> map.classList.toggle("map-labels-thin", mapGL.getZoom() < LABEL_ZOOM_THRESHOLD);
    mapGL.on("zoom", updateLabelDensity);
    mapGL.on("load", updateLabelDensity);
    updateLabelDensity();
    // The illustrated basemap (buildMapGeoJSON, defined above) — added
    // once the style has finished loading (required before addSource/
    // addLayer are valid calls) and never rebuilt afterwards, same as
    // the rest of this one-time init block. Fill/line/circle layers are
    // triangulated into a GPU mesh by MapLibre right here, then just
    // drawn every frame from then on.
    const geo = buildMapGeoJSON();
    mapGL.on("load", ()=>{

      // Bottom-to-top: faint ground texture first, then area fills, then
      // paths, then icon-like points on top — the same layering a real
      // illustrated map uses so everything reads at a glance instead of
      // competing on one flat plane.
      mapGL.addSource("mapFields", { type: "geojson", data: geo.fields });
      mapGL.addLayer({ id: "fields-fill", type: "fill", source: "mapFields", paint: { "fill-color": ["get", "fill"] } });
      mapGL.addSource("mapFieldsFine", { type: "geojson", data: geo.fieldsFine });
      mapGL.addLayer({ id: "fields-fine-fill", type: "fill", source: "mapFieldsFine", paint: { "fill-color": ["get", "fill"] } });

      mapGL.addSource("mapHedges", { type: "geojson", data: geo.hedges });
      mapGL.addLayer({ id: "hedges-line", type: "line", source: "mapHedges", paint: { "line-color": "rgba(0,0,0,0.06)", "line-width": 1 } });

      mapGL.addSource("mapContours", { type: "geojson", data: geo.contours });
      mapGL.addLayer({ id: "contours-line", type: "line", source: "mapContours", paint: { "line-color": "rgba(255,255,255,0.1)", "line-width": 1.2 } });

      // Hill-shading rings around Hilltop-tagged districts (Thrutopia,
      // Oldtown) — tan/brown so they read as raised-ground shading, not
      // another path. Drawn early/underneath so district fills and
      // buildings sit on top where they overlap.
      mapGL.addSource("mapHillBands", { type: "geojson", data: geo.hillBands });
      mapGL.addLayer({ id: "hill-bands-fill", type: "fill", source: "mapHillBands", paint: { "fill-color": ["get", "fill"] } });
      mapGL.addSource("mapHillContours", { type: "geojson", data: geo.hillContours });
      mapGL.addLayer({ id: "hill-contours-line", type: "line", source: "mapHillContours", paint: { "line-color": "rgba(90,70,40,0.12)", "line-width": 1.5 } });

      mapGL.addSource("mapBoundary", { type: "geojson", data: geo.boundary });
      mapGL.addLayer({ id: "boundary-line", type: "line", source: "mapBoundary", paint: { "line-color": "rgba(143,168,156,0.35)", "line-width": 1, "line-dasharray": [3, 3] } });

      // Real named roads outside the site (see roadFeatures comment in
      // buildMapGeoJSON) — casing first for a proper road look, then a
      // paler centre line, same two-layer treatment as the trunk paths
      // inside the site.
      mapGL.addSource("mapRoads", { type: "geojson", data: geo.roads });
      mapGL.addLayer({ id: "roads-casing", type: "line", source: "mapRoads", paint: { "line-color": "rgba(90,80,70,0.55)", "line-width": 5 } });
      mapGL.addLayer({ id: "roads-line", type: "line", source: "mapRoads", paint: { "line-color": "rgba(235,210,160,0.75)", "line-width": 2.4 } });

      // Perimeter fence posts — small dots walking the boundary so the
      // site edge reads as an actual illustrated fence line, not just an
      // empty dashed sketch.
      mapGL.addSource("mapFencePosts", { type: "geojson", data: geo.fencePosts });
      mapGL.addLayer({ id: "fence-posts-circle", type: "circle", source: "mapFencePosts", paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 0.6, 19, 2.2],
        "circle-color": "rgba(143,168,156,0.5)"
      } });

      // A real winding stream near Botanica/Hydro XL, visible across the
      // reference video — drawn with a casing like the paths so it reads
      // as water rather than another path.
      mapGL.addSource("mapStream", { type: "geojson", data: geo.stream });
      mapGL.addLayer({ id: "stream-casing", type: "line", source: "mapStream", paint: { "line-color": "rgba(20,40,50,0.4)", "line-width": 4 } });
      mapGL.addLayer({ id: "stream-line", type: "line", source: "mapStream", paint: { "line-color": "rgba(90,150,190,0.65)", "line-width": 2 } });
      mapGL.addSource("mapPond", { type: "geojson", data: geo.pond });
      mapGL.addLayer({ id: "pond-fill", type: "fill", source: "mapPond", paint: { "fill-color": ["get", "fill"] } });
      mapGL.addSource("mapPondOutline", { type: "geojson", data: geo.pondOutline });
      mapGL.addLayer({ id: "pond-outline-line", type: "line", source: "mapPondOutline", paint: { "line-color": "rgba(190,225,235,0.5)", "line-width": 1 } });

      mapGL.addSource("mapForests", { type: "geojson", data: geo.forests });
      mapGL.addSource("mapForestFringe", { type: "geojson", data: geo.forestFringe });
      mapGL.addLayer({ id: "forest-fringe-fill", type: "fill", source: "mapForestFringe", paint: { "fill-color": "rgba(55,95,55,0.22)" } });
      mapGL.addLayer({ id: "forests-fill", type: "fill", source: "mapForests", paint: { "fill-color": "rgba(15,45,28,0.68)" } });
      mapGL.addLayer({ id: "forests-line", type: "line", source: "mapForests", paint: { "line-color": "rgba(10,30,18,0.6)", "line-width": 1.4 } });

      // Parking — flat grey fields with a few straight "row" lines, kept
      // visually distinct from both camping (green/yellow, textured) and
      // district clearings (coloured, busy with venues/paths) so all
      // three read as different kinds of ground at a glance.
      mapGL.addSource("mapParkingAreas", { type: "geojson", data: geo.parkingAreas });
      mapGL.addLayer({ id: "parking-fill", type: "fill", source: "mapParkingAreas", paint: { "fill-color": "rgba(160,160,155,0.7)" } });
      // A soft outer casing under the solid boundary line, same
      // dual-line technique the district boundaries use — reads as a
      // surveyed/marked-out boundary rather than a single flat outline.
      mapGL.addLayer({ id: "parking-casing", type: "line", source: "mapParkingAreas", paint: { "line-color": "rgba(60,60,58,0.3)", "line-width": 5 } });
      mapGL.addLayer({ id: "parking-outline", type: "line", source: "mapParkingAreas", paint: { "line-color": "rgba(60,60,58,0.85)", "line-width": 2 } });
      mapGL.addSource("mapParkingRows", { type: "geojson", data: geo.parkingRows });
      mapGL.addLayer({ id: "parking-rows-line", type: "line", source: "mapParkingRows", paint: { "line-color": "rgba(255,255,255,0.4)", "line-width": 1.2 } });
      mapGL.addSource("mapParkingCars", { type: "geojson", data: geo.parkingCars });
      mapGL.addLayer({ id: "parking-cars-circle", type: "circle", source: "mapParkingCars", paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 1, 19, 3.2],
        "circle-color": "rgba(235,235,230,0.85)",
        "circle-stroke-width": 0.6, "circle-stroke-color": "rgba(60,60,58,0.6)"
      } });

      // Districts get a soft outer "casing" (like the paths' own
      // casing/line pairing below) under a solid outline, boundary still
      // legible at a glance without registering the exact hue first — but
      // trimmed narrower here (was 4px/2.4px at much higher opacity) since
      // the earlier bold treatment started competing with the actual
      // stage/amenity/hidden-venue markers plotted inside every district,
      // which matter more than the zone boundary itself. See the fill/
      // line/casing alpha values on districtFeatures above for the other
      // half of this same "district is context, not the main event" pass.
      mapGL.addSource("mapDistricts", { type: "geojson", data: geo.districts });
      mapGL.addLayer({ id: "districts-casing", type: "line", source: "mapDistricts", paint: { "line-color": ["get", "casing"], "line-width": 3 } });
      mapGL.addLayer({ id: "districts-fill", type: "fill", source: "mapDistricts", paint: { "fill-color": ["get", "fill"] } });
      // Width bumped 1.8 -> 2.2 — reference screenshots show each
      // district's own boundary as a clear, continuous outline, not a
      // faint line competing with the fill; borders should read at a
      // glance, matching the ask for "clear square/outlines" for zones.
      mapGL.addLayer({ id: "districts-line", type: "line", source: "mapDistricts", paint: { "line-color": ["get", "line"], "line-width": 2.2 } });

      // Tapping anywhere inside a district's own drawn shape opens the
      // same info card its small name-label marker does — previously the
      // fill/casing/line layers had no click handler at all, so only the
      // tiny text-label marker at the district's centre was tappable,
      // reported as districts not feeling like real "interactive areas."
      mapGL.on("click", "districts-fill", (e)=>{
        if(!e.features || !e.features.length) return;
        const name = e.features[0].properties.name;
        const place = locations.find(p=> p.kind === "district" && p.name === name);
        if(!place) return;
        showMapInfoCard(`
          <div class="card">
            <span class="tag">district — approximate area</span>
            <h3>${escapeHtml(place.name)}</h3>
            <p>${place.info}</p>
          </div>
        `);
      });
      mapGL.on("mouseenter", "districts-fill", ()=>{ mapGL.getCanvas().style.cursor = "pointer"; });
      mapGL.on("mouseleave", "districts-fill", ()=>{ mapGL.getCanvas().style.cursor = ""; });

      // Pepperpot Market's clearing — same casing/fill/line trio as a
      // district, drawn right after them, so the real (GPS, not
      // schematic-guessed) toilets/food/bars/welfare/etc. markers that
      // cluster here (see buildMapGeoJSON's marketHub comment) land on
      // themed ground instead of bare grass.
      mapGL.addSource("mapMarketHub", { type: "geojson", data: geo.marketHub });
      mapGL.addLayer({ id: "market-hub-casing", type: "line", source: "mapMarketHub", paint: { "line-color": ["get", "casing"], "line-width": 4 } });
      mapGL.addLayer({ id: "market-hub-fill", type: "fill", source: "mapMarketHub", paint: { "fill-color": ["get", "fill"] } });
      mapGL.addLayer({ id: "market-hub-line", type: "line", source: "mapMarketHub", paint: { "line-color": ["get", "line"], "line-width": 2.4 } });

      // Camp areas drawn AFTER districts/forests so they sit on top —
      // Camp Orchid Downtown in particular overlaps Metropolis's own
      // district clearing, and a fill drawn underneath it just vanished.
      mapGL.addSource("mapCampAreas", { type: "geojson", data: geo.campAreas });
      mapGL.addLayer({ id: "camp-areas-fill", type: "fill", source: "mapCampAreas", paint: { "fill-color": ["get", "fill"] } });
      mapGL.addLayer({ id: "camp-areas-line", type: "line", source: "mapCampAreas", paint: { "line-color": "rgba(255,255,255,0.55)", "line-width": 1.6, "line-dasharray": [1, 1.5] } });

      // Ordinary (non-premium) camping fields — a soft sandy-yellow fill
      // plus a couple of straight field-division lines, so plain camping
      // reads as its own kind of ground rather than tent dots floating
      // on bare district/forest colour. Outline strengthened to a solid
      // warm brown so the field boundary itself is legible, not just
      // implied by the confetti dots scattered inside it.
      mapGL.addSource("mapCampFields", { type: "geojson", data: geo.campFields });
      mapGL.addLayer({ id: "camp-fields-fill", type: "fill", source: "mapCampFields", paint: { "fill-color": "rgba(224,200,90,0.55)" } });
      mapGL.addLayer({ id: "camp-fields-casing", type: "line", source: "mapCampFields", paint: { "line-color": "rgba(120,100,40,0.28)", "line-width": 4.5 } });
      // Width bumped 1.8 -> 2.4, same "clear border" reasoning as
      // districts-line above — camp fields are the biggest ground use on
      // site and should read as clearly-bounded areas at a glance.
      mapGL.addLayer({ id: "camp-fields-outline", type: "line", source: "mapCampFields", paint: { "line-color": "rgba(120,100,40,0.75)", "line-width": 2.4 } });
      mapGL.addSource("mapCampFieldLines", { type: "geojson", data: geo.campFieldLines });
      mapGL.addLayer({ id: "camp-field-lines-line", type: "line", source: "mapCampFieldLines", paint: { "line-color": "rgba(120,100,40,0.5)", "line-width": 1.2 } });

      // The triangular tree-ring/hedge feature inside Camp Orchid
      // Downtown — seen clearly, twice, across both reference videos.
      mapGL.addSource("mapCampTriangle", { type: "geojson", data: geo.campTriangle });
      // Colour changed from dark green to near-black — the reference
      // video's own triangle reads as a plain dark outline regardless of
      // the pink camp fill under it, not tinted to match the ground.
      mapGL.addLayer({ id: "camp-triangle-line", type: "line", source: "mapCampTriangle", paint: { "line-color": "rgba(35,32,28,0.75)", "line-width": 2 } });

      // A rounder hedge-ring inside each Camp Skylark site, giving them
      // their own distinguishing feature (Downtown Orchid's triangle
      // above was the only camp with one until now).
      mapGL.addSource("mapSkylarkRings", { type: "geojson", data: geo.skylarkRings });
      mapGL.addLayer({ id: "skylark-ring-line", type: "line", source: "mapSkylarkRings", paint: { "line-color": "rgba(160,120,40,0.6)", "line-width": 2 } });

      // Path network — three tiers so the map reads as a connected route
      // system rather than isolated markers on plain grass: a solid main
      // trail linking every district (drawn with a dark "casing" line
      // underneath a lighter tan fill line, the same two-layer technique
      // real road cartography uses so it stands out from the grass),
      // medium spokes carrying that trail out to every stage, and thin
      // dotted capillaries reaching every hidden venue, landmark and gate.
      mapGL.addSource("mapTrail", { type: "geojson", data: geo.trail });
      // Same widths as before (no extra bulk) but both layers pushed
      // toward more contrast — darker casing, lighter/warmer line — so
      // the path reads clearly against every ground colour it crosses
      // (district green, camp yellow, parking grey, forest) instead of
      // just the grass it was originally tuned for.
      // Open concourses — a visibly wider, paler paved patch at the
      // handful of spots (Oldtown, Grand Central, Botanica, Area 404,
      // Copperwood, Metropolis, Quantum) reference footage actually shows
      // opening up into a real town square/junction, vs. the constant-
      // width trail line everywhere else — drawn before the trail so
      // paths visibly widen INTO it rather than just crossing over a flat
      // patch. Lighter and larger than a single stage's own plaza (below)
      // so the size difference itself reads as "this is the big open
      // space, that's a stage forecourt."
      // Open concourses, stage plazas and the trail ribbon (below) now
      // all share ONE consistent "hardstanding" fill tone/opacity
      // (rgba(224,200,160,0.95)) instead of three different translucent
      // shades — they used to visibly seam where a path ran into a
      // plaza or concourse, when they're meant to read as one continuous
      // non-grass surface: "the areas we can be in and travel through",
      // not three separately-tinted zone types that happen to touch.
      mapGL.addSource("mapOpenConcourses", { type: "geojson", data: geo.openConcourses });
      mapGL.addLayer({ id: "open-concourses-fill", type: "fill", source: "mapOpenConcourses", paint: { "fill-color": "rgba(224,200,160,0.95)" } });
      mapGL.addLayer({ id: "open-concourses-outline", type: "line", source: "mapOpenConcourses", paint: { "line-color": "rgba(120,95,60,0.55)", "line-width": 1 } });

      // Stage plazas — drawn before the path lines so the paths visibly
      // run INTO the clearing rather than sitting on top of a flat edge.
      mapGL.addSource("mapStagePlazas", { type: "geojson", data: geo.stagePlazas });
      mapGL.addLayer({ id: "stage-plazas-fill", type: "fill", source: "mapStagePlazas", paint: { "fill-color": "rgba(224,200,160,0.95)" } });
      mapGL.addLayer({ id: "stage-plazas-outline", type: "line", source: "mapStagePlazas", paint: { "line-color": "rgba(120,95,60,0.55)", "line-width": 1 } });

      mapGL.addSource("mapBunting", { type: "geojson", data: geo.bunting });
      mapGL.addLayer({ id: "bunting-circle", type: "circle", source: "mapBunting", paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 1, 19, 3],
        "circle-color": ["get", "color"]
      } });

      // TRUNK_PATH_EDGES (mapTrail) is now the ONLY path layer this map
      // draws — the spokes/capillaries/camp-spokes/parking-spokes/gate-
      // spokes layers that used to fan out from here (auto-generated
      // "nearest point" lines with no footage evidence behind them) were
      // removed; see the comment above TRUNK_PATH_EDGES's own removal
      // block in buildMapGeoJSON for why.
      //
      // Rendered as a filled ribbon AREA (geo.trail is now Polygon
      // geometry, see ribbonFromPath/TRAIL_WIDTH above), not a stroked
      // line — a real ground colour difference at the path's actual
      // width/footprint, not a fixed-pixel line that doesn't represent
      // real width or scale with zoom.
      // Per-tier fill (["get","fill"], set in JS from TRAIL_FILL above)
      // and a matching per-tier outline width/opacity — main routes get
      // a clear, continuous casing; minor ones fade to almost none, so
      // they read as "worth wandering down" rather than a signed route.
      mapGL.addLayer({ id: "trail-fill", type: "fill", source: "mapTrail", paint: { "fill-color": ["get", "fill"] } });
      mapGL.addLayer({ id: "trail-outline", type: "line", source: "mapTrail", paint: {
        "line-color": ["match", ["get", "tier"], "main", "rgba(100,75,45,0.6)", "minor", "rgba(140,120,90,0.25)", "rgba(120,95,60,0.55)"],
        "line-width": ["match", ["get", "tier"], "main", 1.6, "minor", 0.6, 1]
      } });
      mapGL.addSource("mapPathScrub", { type: "geojson", data: geo.pathScrub });
      mapGL.addLayer({ id: "path-scrub-circle", type: "circle", source: "mapPathScrub", paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 0.5, 19, 2.2],
        "circle-color": ["get", "color"]
      } });

      // Main-stage glow — three stacked circle layers per stage, widest/
      // faintest first so the smaller/brighter ones layer on top and it
      // reads as one soft blurred halo rather than three hard rings.
      // Toned down (both radius and opacity) from the first version —
      // it was overpowering everything else on the map (buildings,
      // paths, district colour) instead of being one cue among several;
      // stages should still stand out, just not dominate.
      mapGL.addSource("mapStageGlow", { type: "geojson", data: geo.stageGlow });
      mapGL.addLayer({ id: "stage-glow-outer", type: "circle", source: "mapStageGlow", paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 9, 19, 38],
        "circle-color": ["get", "colorOuter"]
      } });
      mapGL.addLayer({ id: "stage-glow-mid", type: "circle", source: "mapStageGlow", paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 5.5, 19, 22],
        "circle-color": ["get", "colorMid"]
      } });
      mapGL.addLayer({ id: "stage-glow-core", type: "circle", source: "mapStageGlow", paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 3, 19, 11],
        "circle-color": ["get", "colorCore"]
      } });

      // Minor-stage glow — same technique, roughly half the main-stage
      // radius so the size difference itself keeps the visual hierarchy
      // (main stage = bigger, brighter glow) even though both now have one.
      mapGL.addSource("mapMinorStageGlow", { type: "geojson", data: geo.minorStageGlow });
      mapGL.addLayer({ id: "minor-stage-glow-outer", type: "circle", source: "mapMinorStageGlow", paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 5, 19, 20],
        "circle-color": ["get", "colorOuter"]
      } });
      mapGL.addLayer({ id: "minor-stage-glow-mid", type: "circle", source: "mapMinorStageGlow", paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 3, 19, 12],
        "circle-color": ["get", "colorMid"]
      } });
      mapGL.addLayer({ id: "minor-stage-glow-core", type: "circle", source: "mapMinorStageGlow", paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 1.5, 19, 6],
        "circle-color": ["get", "colorCore"]
      } });

      // Decorative infill buildings first (fainter/paler — no name, so
      // they read as background density, not a specific place), then
      // real named-venue building footprints on top, both drawn after
      // the path network so they sit on top of it (a path running
      // "under" a building reads wrong) but before the marker icons.
      mapGL.addSource("mapInfillBuildings", { type: "geojson", data: geo.infillBuildings });
      // A soft dark shadow of each footprint, offset a couple of screen
      // pixels (fill-translate — a fixed screen-space nudge, same trick
      // as a CSS box-shadow) and drawn first/underneath — the one cue
      // that was missing to make flat building fills read as raised
      // structures sitting ON the ground rather than a coloured patch
      // painted flush with it.
      mapGL.addLayer({ id: "infill-buildings-shadow", type: "fill", source: "mapInfillBuildings", paint: { "fill-color": "rgba(10,15,10,0.18)", "fill-translate": [1, 1.4] } });
      mapGL.addLayer({ id: "infill-buildings-fill", type: "fill", source: "mapInfillBuildings", paint: { "fill-color": "rgba(196,140,90,0.32)" } });
      mapGL.addLayer({ id: "infill-buildings-outline", type: "line", source: "mapInfillBuildings", paint: { "line-color": "rgba(120,80,50,0.35)", "line-width": 0.8 } });

      mapGL.addSource("mapBuildings", { type: "geojson", data: geo.buildings });
      mapGL.addLayer({ id: "buildings-shadow", type: "fill", source: "mapBuildings", paint: { "fill-color": "rgba(8,12,8,0.28)", "fill-translate": [1.5, 2.2] } });
      mapGL.addLayer({ id: "buildings-fill", type: "fill", source: "mapBuildings", paint: { "fill-color": "rgba(196,140,90,0.65)" } });
      mapGL.addLayer({ id: "buildings-outline", type: "line", source: "mapBuildings", paint: { "line-color": "rgba(120,80,50,0.7)", "line-width": 1 } });

      // Hollow fenced enclosures — outline only, no fill, so the ground
      // colour shows through (a beer-garden/yard, not a roofed building).
      mapGL.addSource("mapFencedEnclosures", { type: "geojson", data: geo.fencedEnclosures });
      mapGL.addLayer({ id: "fenced-enclosures-line", type: "line", source: "mapFencedEnclosures", paint: { "line-color": "rgba(120,80,50,0.8)", "line-width": 1.3, "line-dasharray": [2, 1] } });

      // Diamond polygons now (was a circle layer) — the reference
      // video's own camp confetti reads as small tent-shaped diamonds,
      // not round dots.
      mapGL.addSource("mapConfetti", { type: "geojson", data: geo.confetti });
      mapGL.addLayer({ id: "confetti-fill", type: "fill", source: "mapConfetti", paint: { "fill-color": ["get", "color"] } });

      mapGL.addSource("mapCampervans", { type: "geojson", data: geo.campervans });
      mapGL.addLayer({ id: "campervans-fill", type: "fill", source: "mapCampervans", paint: { "fill-color": "rgba(210,210,215,0.85)" } });
      mapGL.addLayer({ id: "campervans-outline", type: "line", source: "mapCampervans", paint: { "line-color": "rgba(90,90,95,0.7)", "line-width": 0.6 } });

      mapGL.addSource("mapTrees", { type: "geojson", data: geo.trees });
      mapGL.addLayer({ id: "trees-circle", type: "circle", source: "mapTrees", paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, ["*", ["get", "size"], 0.6], 19, ["*", ["get", "size"], 2.6]],
        "circle-color": ["get", "color"],
        "circle-stroke-width": 0.6, "circle-stroke-color": "rgba(20,40,28,0.5)"
      } });

      mapGL.addSource("mapTents", { type: "geojson", data: geo.tents });
      mapGL.addLayer({ id: "tents-circle", type: "circle", source: "mapTents", paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 1.8, 19, 5.5],
        "circle-color": ["get", "color"],
        "circle-stroke-width": 1, "circle-stroke-color": "rgba(238,246,241,0.4)"
      } });
    });
    document.querySelectorAll("#mapLayerToggles .chip").forEach(chip=>{
      const layer = chip.dataset.layer;
      chip.classList.toggle("active", !!mapLayerVisible[layer]);
      chip.onclick = ()=>{
        mapLayerVisible[layer] = !mapLayerVisible[layer];
        chip.classList.toggle("active", mapLayerVisible[layer]);
        (mapMarkerGroups[layer] || []).forEach(m=>{
          const el = m.getElement();
          if(el) el.style.display = mapLayerVisible[layer] ? "" : "none";
        });
      };
    });
  }

  Object.values(mapMarkerGroups).forEach(arr=> arr.forEach(m=> m.remove()));
  mapMarkerGroups = {};
  mapMarkersByName = {};

  // Districts — broad narrative areas, not single points, so these get
  // a label only here (the actual "area" is the illustrated basemap's
  // own translucent clearing shape under it — see buildMapGeoJSON —
  // rather than a second overlapping circle drawn on top of it); always
  // approximate (Boomtown's districts don't correspond to any one
  // surveyed spot even in the official app).
  // Each district's label now takes its own colour from DISTRICT_PALETTE
  // (the same 7-colour cycle its ground-fill zone already uses in
  // buildMapGeoJSON, same index order since both read from this same
  // filtered list) — reference screenshots show every district name
  // rendered in its own distinct, bold treatment (BOTANICA in one hue,
  // AREA 404 in another, etc.), not one flat colour for all of them.
  // Two districts have a repeatedly-confirmed text TREATMENT beyond just
  // colour: Area 404's own label reads as a bold red/green "glitch"
  // double-exposure in every reference frame it appears in, and Botanica/
  // Metropolis both show a shimmering multi-hue gradient rather than a
  // flat colour. Everything else keeps the plain --district-rgb colour
  // treatment above — inventing a special look for a district with no
  // specific evidence for one would be a guess, not an accuracy fix.
  const DISTRICT_TEXT_STYLE = { "Area 404": "glitch", "Botanica": "shimmer", "Metropolis": "shimmer", "Oldtown": "gothic" };
  const districtList = locations.filter(p=> p.kind === "district");
  districtList.forEach(place=>{
    const coord = schematicToLatLon(parseFloat(place.x), parseFloat(place.y));
    const rgb = DISTRICT_PALETTE[districtList.indexOf(place) % DISTRICT_PALETTE.length];
    const styleClass = DISTRICT_TEXT_STYLE[place.name] ? ` ${DISTRICT_TEXT_STYLE[place.name]}` : "";
    addMapMarker("main", coord.lat, coord.lon,
      `<div class="map-label district${styleClass}" style="--district-rgb:${rgb}">${escapeHtml(place.name)}</div>`,
      { name: place.name, title: place.name, onClick: ()=> showMapInfoCard(`
        <div class="card">
          <span class="tag">district — approximate area</span>
          <h3>${escapeHtml(place.name)}</h3>
          <p>${place.info}</p>
        </div>
      `) }
    );
  });

  // Main stages
  // Deliberately schematicToLatLon() directly, NOT realCoordFor() — see
  // the note above realCoordFor()'s definition. Auto-scraped real GPS in
  // js/boomtown-locations-2026.js repeatedly disagreed with what our own
  // screen-recording/screenshot evidence of the official app's map shows
  // (sometimes by dozens of schematic units), and every time it silently
  // overrode a hand-placed, video-confirmed position it re-broke work
  // that had just been carefully corrected. The screen recordings/
  // screenshots of the official app ARE the map users navigate by, so
  // they're the only source of truth for where a marker actually sits —
  // GPS is not used to place anything anymore, anywhere in this file.
  locations.filter(place=> place.kind === "stage").forEach(place=>{
    const coord = schematicToLatLon(parseFloat(place.x), parseFloat(place.y));
    addMapMarker("main", coord.lat, coord.lon,
      mapMarkerHtml("stage", "stage", place.name),
      { name: place.name, title: place.name, onClick: ()=>{
        showMapInfoCard(`
          <div class="card">
            <span class="tag">${place.kind}</span>
            <h3>${place.name}</h3>
            ${venueMetaHtml(place.name)}
            <p>${place.info}</p>
            <button class="action" id="saveMeetingBtn">Save as meeting point</button>
          </div>
        `);
        document.getElementById("saveMeetingBtn").onclick = ()=> saveMeeting(place.name);
      } }
    );
  });

  // Minor stages — same schematicToLatLon()-only reasoning as the main
  // stages above; no GPS override here either.
  minorStages.forEach(place=>{
    const isRumoured = place.status === "rumoured";
    const coord = schematicToLatLon(parseFloat(place.x), parseFloat(place.y));
    addMapMarker("minor", coord.lat, coord.lon,
      mapMarkerHtml("stage minor" + (isRumoured ? " rumoured" : ""), "minor" + (isRumoured ? " rumoured" : ""), place.name),
      { name: place.name, title: place.name + (isRumoured ? " (rumoured — no 2026 confirmation)" : ""), onClick: ()=> showMapInfoCard(`
        <div class="card">
          <span class="tag">stage${isRumoured ? " — rumoured" : ""}</span>
          <h3>${place.name}</h3>
          ${venueMetaHtml(place.name)}
          <p>${place.info}</p>
        </div>
      `) }
    );
  });

  // Deliberately schematicToLatLon() directly here, NOT realCoordFor() —
  // unlike locations/minorStages (real confirmed stages, where GPS is
  // trustworthy and this map's own on-screen legend promises "plotted at
  // real GPS positions"), thingsToFind is explicitly the "never surveyed,
  // approximate" category (see its own card copy below: "Boomtown never
  // publishes exact hidden-venue locations"). Checked what realCoordFor()
  // would have done for the 8 thingsToFind entries with an exact-name
  // match in js/boomtown-locations-2026.js: several land 17-60 schematic
  // units from their hand-placed (video-sourced) position — e.g. "Mining
  // for (g)Old Town" near Oldtown by video lands near the map's south-
  // center by GPS, "The Pomegranate Parlour" is 60 units off. That's the
  // "real GPS markers keep landing in the gaps between the illustrated
  // zones" mismatch the amenities array above already worked around,
  // just not yet fixed here. The video is the source of truth for this
  // hand-illustrated map; the auto-scraped GPS in that file is not
  // reliable enough for this category to override it.
  thingsToFind.forEach(spot=>{
    const coord = schematicToLatLon(parseFloat(spot.x), parseFloat(spot.y));
    addMapMarker("secret", coord.lat, coord.lon,
      mapMarkerHtml("secret", "secret", spot.name, "?"),
      { name: spot.name, title: spot.name, onClick: ()=> showMapInfoCard(`
        <div class="card">
          <span class="tag">hidden venue — unlisted</span>
          <h3>${spot.name}</h3>
          ${venueMetaHtml(spot.name)}
          <p>${spot.info}</p>
          <p class="empty-note" style="margin-top:6px;">Nearest theme: ${spot.near}. Boomtown never publishes exact hidden-venue locations, so this pin is a "go exploring here" nudge, not a surveyed spot — log what you actually find in Map's hidden-venue log.</p>
        </div>
      `) }
    );
  });

  // secretSpots (3 generic unnamed "?" markers) intentionally not
  // rendered — unlike everything else on this map, they don't correspond
  // to any specific confirmed venue, just a vague "somewhere here" guess.
  // Everything else shown here (stages, hidden venues, landmarks) is
  // backed by real confirmed 2026 lineup/schedule evidence — see
  // venueDirectory — so these anonymous placeholders were the one
  // exception. Left in the data (not deleted outright) in case a real
  // position for one of them turns up later.

  // Same schematicToLatLon()-not-realCoordFor() reasoning as thingsToFind
  // above — e.g. "The Retreat" landed 19 schematic units from its
  // hand-placed Thrutopia-woodlands position when checked against its
  // real-match GPS. Landmarks (and user-added custom ones, which have no
  // real match anyway) are approximate by the same design as hidden
  // venues, not surveyed stage positions.
  allLandmarks().forEach(place=>{
    const coord = schematicToLatLon(parseFloat(place.x), parseFloat(place.y));
    addMapMarker("landmark", coord.lat, coord.lon,
      mapMarkerHtml("landmark", "landmark", place.name),
      { name: place.name, title: place.name, onClick: ()=> showMapInfoCard(`
        <div class="card">
          <span class="tag">${place.custom ? "landmark — your addition" : "landmark"}</span>
          <h3>${place.name}</h3>
          <p>${place.info}</p>
          ${place.hours ? `<p style="margin-top:6px; color:var(--accent-teal); font-size:12px;">🕐 ${place.hours}</p>` : ""}
          ${place.custom ? `<p class="empty-note" style="margin-top:6px;">Remove or edit this from the landmark list in the card below the map.</p>` : ""}
        </div>
      `) }
    );
  });

  campLabels.forEach(c=>{
    const coord = schematicToLatLon(parseFloat(c.x), parseFloat(c.y));
    addMapMarker("camp", coord.lat, coord.lon, `<div class="map-label camp">⛺ ${escapeHtml(c.text)}</div>`, {});
  });

  // Plain, non-interactive text over the SSSI woodland patch (see the
  // module-level SSSI_SPOTS above buildMapGeoJSON) — the reference screenshot shows this
  // as pale italic map text with no icon or coloured pill, unlike every
  // named camp/venue label, so it gets its own bare style rather than
  // reusing mapMarkerHtml/showMapInfoCard.
  SSSI_SPOTS.forEach(s=>{
    const coord = schematicToLatLon(parseFloat(s.x), parseFloat(s.y));
    addMapMarker("sssi", coord.lat, coord.lon, `<div class="map-label sssi">${escapeHtml(s.name)}</div>`, {});
  });

  // Road name labels — geo.roads' coordinates are already real [lon,lat]
  // pairs (see roadFeatures in buildMapGeoJSON, anchored the same way as
  // the site boundary), not schematic x/y, so these skip
  // schematicToLatLon and use the LineString's own midpoint directly.
  geo.roads.features.forEach(f=>{
    const coords = f.geometry.coordinates;
    const mid = coords[Math.floor(coords.length / 2)];
    addMapMarker("road", mid[1], mid[0], `<div class="map-label road">${escapeHtml(f.properties.name)}</div>`, {});
  });

  gates.forEach(place=>{
    const coord = schematicToLatLon(parseFloat(place.x), parseFloat(place.y));
    addMapMarker("gate", coord.lat, coord.lon,
      mapMarkerHtml("gate", "gate", place.name),
      { name: place.name, title: place.name, onClick: ()=> showMapInfoCard(`
        <div class="card">
          <span class="tag">gate — approximate position</span>
          <h3>${place.name}</h3>
          <p>${place.info}</p>
          ${place.hours ? `<p style="margin-top:6px; color:var(--accent-teal); font-size:12px;">🕐 ${place.hours}</p>` : ""}
        </div>
      `) }
    );
  });

  // See the `amenities` const's own comment (above, near `gates`) for
  // why this renders hand-placed, video-referenced positions instead of
  // a straight dump of js/boomtown-locations-2026.js's real-GPS POI list
  // — the real coordinates weren't wrong, they just sat on a different
  // calibration than every hand-drawn district/camp/path on this map.
  amenities.forEach(poi=>{
    const coord = schematicToLatLon(parseFloat(poi.x), parseFloat(poi.y));
    const ringRgb = POI_RING_COLORS[poi.category] || "255,255,255";
    addMapMarker("poi", coord.lat, coord.lon,
      `<div class="marker poi" style="--poi-rgb:${ringRgb}">${POI_ICONS[poi.category] || "📍"}</div>`,
      { title: poi.category, onClick: ()=> showMapInfoCard(`
        <div class="card">
          <span class="tag">amenity</span>
          <h3>${POI_ICONS[poi.category] || "📍"} ${escapeHtml(poi.category)}</h3>
          <p class="empty-note">Seen on the official app's own map near ${escapeHtml(poi.note)} — approximate, not surveyed.</p>
        </div>
      `) }
    );
  });

  // Places added via the ＋ button — new ones carry real lat/lon straight
  // from the map's own click event (see ADD A PLACE further down); ones
  // saved before this map switched over still carry the old normalized
  // 0-100 x/y, converted through the same approximate calibration as
  // everything else schematic-only.
  (Store.get("customPlaces") || []).forEach(place=>{
    const coord = (place.lat != null && place.lon != null)
      ? { lat: place.lat, lon: place.lon }
      : schematicToLatLon(place.x, place.y);
    addMapMarker("place", coord.lat, coord.lon,
      mapMarkerHtml("place" + (place.official ? " official" : ""), "place", place.name),
      { name: place.name, title: place.name, onClick: ()=> { if(typeof showPlaceInfo === "function") showPlaceInfo(place); } }
    );
  });

  // Friend location markers — plots each other device's last-known GPS
  // fix (peopleStatus[id].gps, now carried through mergeSyncPayload
  // instead of being dropped) as its own marker group. A text-only
  // "place" guess with no real coordinate has nowhere accurate to plot,
  // and a stale fix (>30 min, STATUS_STALE_MS) is skipped rather than
  // shown in a possibly-wrong spot.
  const peopleStatusForMap = Store.get("peopleStatus") || {};
  Object.entries(peopleStatusForMap).forEach(([id, entry])=>{
    if(!entry || !entry.gps || entry.gps.lat == null || entry.gps.lon == null) return;
    if(entry.updatedAt && (Date.now() - entry.updatedAt) > STATUS_STALE_MS) return;
    const name = personDisplayName(entry, id);
    addMapMarker("friend", entry.gps.lat, entry.gps.lon,
      `<div class="marker friend">🧑</div><div class="map-label friend">${escapeHtml(name)}</div>`,
      { name: "Friend: " + name, title: name, onClick: ()=> showMapInfoCard(`
        <div class="card">
          <span class="tag">friend location</span>
          <h3>🧑 ${escapeHtml(name)}</h3>
          <p class="empty-note">${escapeHtml(entry.place || "")} · Location set ${escapeHtml(formatLastSeen(entry.updatedAt))}</p>
          ${mapsLinkHtml(entry.gps.lat, entry.gps.lon)}
        </div>
      `) }
    );
  });

  // Search box's autocomplete list — every name that actually got a pin
  // above (mapMarkersByName is rebuilt from scratch each loadMap() call,
  // same as mapMarkerGroups) so it never suggests a stale or non-existent
  // name.
  const searchNames = document.getElementById("mapSearchNames");
  if(searchNames) searchNames.innerHTML = Object.keys(mapMarkersByName).sort((a,b)=> a.localeCompare(b)).map(n=> `<option value="${escapeHtml(n)}"></option>`).join("");
}

function saveMeeting(name){
  pushSharedMeeting(name);
  mapInfo.innerHTML = `<div class="card"><p class="empty-note">Meeting point saved for the group: <strong style="color:var(--accent-amber)">${escapeHtml(name)}</strong></p></div>`;
}

// The meeting point is shared, group-wide state (see pushSharedMeeting
// near pullFromCloud) — this just renders whatever's currently cached
// locally, which every sync keeps fresh.
function renderCurrentMeeting(){
  const box = document.getElementById("currentMeetingDisplay");
  if(!box) return;
  const m = Store.get("meeting");
  if(!m){
    box.textContent = "No meeting point set yet.";
    return;
  }
  const by = Store.get("meetingBy");
  const ts = Store.get("meetingUpdatedAt");
  const meta = [by ? `set by ${by}` : "", ts ? formatLastSeen(ts) : ""].filter(Boolean).join(" · ");
  box.innerHTML = `📍 Meeting at: <strong style="color:var(--accent-amber)">${escapeHtml(m)}</strong>${meta ? `<br><span style="font-size:12px;">${escapeHtml(meta)}</span>` : ""}`;
}

const meetingPointInput = document.getElementById("meetingPointInput");
document.getElementById("setMeetingBtn").onclick = ()=>{
  const val = meetingPointInput.value.trim();
  if(!val) return;
  saveMeeting(val);
  meetingPointInput.value = "";
};
const clearMeetingBtn = document.getElementById("clearMeetingBtn");
if(clearMeetingBtn) clearMeetingBtn.onclick = ()=>{
  if(!confirm("Clear the group's meeting point for everyone?")) return;
  pushSharedMeeting("");
};
renderCurrentMeeting();

// ===============================
// CUSTOM LANDMARKS — add/remove your own map pins, positioned near a
// chosen district. Merges with the built-in `landmarks` array wherever
// the map renders landmarks.
// ===============================
function districtCoord(name){
  const d = locations.find(l=> l.name === name);
  return d ? { x: parseFloat(d.x), y: parseFloat(d.y) } : { x: 50, y: 50 };
}

function allLandmarks(){
  const custom = (Store.get("customLandmarks") || []).map((c,i)=>{
    const base = districtCoord(c.district);
    const angle = (i * 47) % 360 * Math.PI / 180; // spread duplicates apart
    return {
      name: c.name,
      x: Math.max(2, Math.min(98, base.x + Math.cos(angle) * 4)) + "%",
      y: Math.max(2, Math.min(98, base.y + Math.sin(angle) * 4)) + "%",
      info: c.info ? `${c.info} (near ${c.district})` : `Added near ${c.district}.`,
      custom: true
    };
  });
  return landmarks.concat(custom);
}

function loadCustomLandmarksList(){
  const box = document.getElementById("customLandmarksList");
  if(!box) return;
  const list = Store.get("customLandmarks") || [];
  box.innerHTML = list.map((c,i)=>`
    <div class="item">
      <div class="item-top">
        <div><strong>${escapeHtml(c.name)}</strong><br><small>${escapeHtml(c.district)}${c.info ? " — " + escapeHtml(c.info) : ""}</small></div>
        <button data-i="${i}" class="removeLandmarkBtn">Remove</button>
      </div>
    </div>
  `).join("");
  box.querySelectorAll(".removeLandmarkBtn").forEach(btn=>{
    btn.onclick = ()=>{
      const list2 = Store.get("customLandmarks") || [];
      list2.splice(Number(btn.dataset.i), 1);
      Store.set("customLandmarks", list2);
      loadCustomLandmarksList();
      loadMap();
    };
  });
}

// Old "Log a landmark" add-form is retired in favour of the unified
// "Add a place" flow below (the ＋ button) — this list view stays,
// since previously-logged/synced landmarks are real group data that
// must keep showing and stay removable, just no longer addable here.
loadCustomLandmarksList();

// ===============================
// ADD A PLACE — the single, unified way to drop a pin on the map,
// replacing the old district-picker "Log a landmark" form above. Now
// that the map itself is a real Leaflet map (see the MAP section
// above), a tap gives an actual WGS84 lat/lon straight from Leaflet's
// own click event — no schematic-space conversion needed for anything
// dropped from here on. Places saved before this map switched over
// still carry the old normalized 0-100 x/y (see loadMap()'s customPlaces
// render: schematicToLatLon() converts them at display time only), so
// nothing existing breaks or needs migrating. customPlaces is one flat,
// shared Store key (see buildSyncPayload/mergeSyncPayload above) — not
// a second location system alongside customLandmarks; that older array
// is kept read-only (list above) rather than migrated, so no group data
// is lost.
// ===============================
function ensurePlaceId(){
  return "place_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

let _placeDraft = null; // {id?, name, category, note, lat, lon} while the add/edit flow is open
let _placePicking = false;
let _placePickMarker = null;
let _placePickClickHandler = null;

function closeAddPlaceModal(){
  const el = document.getElementById("addPlaceModal");
  if(el) el.remove();
}

function renderPlacePickPin(){
  if(_placePickMarker){ _placePickMarker.remove(); _placePickMarker = null; }
  if(!_placeDraft || _placeDraft.lat == null || !mapGL) return;
  const el = document.createElement("div");
  el.innerHTML = `<div class="place-pick-pin">📍</div>`;
  _placePickMarker = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([_placeDraft.lon, _placeDraft.lat]).addTo(mapGL);
}

function showPlacePickBar(){
  let bar = document.getElementById("placePickBar");
  if(!bar){
    bar = document.createElement("div");
    bar.id = "placePickBar";
    bar.className = "place-pick-bar";
    document.body.appendChild(bar);
  }
  const hasSpot = _placeDraft && _placeDraft.lat != null;
  bar.innerHTML = `
    <span style="flex:1; font-size:12.5px;">📍 Tap the map to drop the pin${hasSpot ? " — tap again to move it" : ""}</span>
    <button class="ghost" id="placePickCancelBtn" style="flex-shrink:0;">Cancel</button>
    <button class="action" id="placePickConfirmBtn" style="flex-shrink:0;" ${hasSpot ? "" : "disabled"}>Confirm</button>
  `;
  bar.style.display = "flex";
  document.getElementById("placePickCancelBtn").onclick = ()=>{ stopPlacePicking(); openAddPlaceModal(_placeDraft); };
  document.getElementById("placePickConfirmBtn").onclick = ()=>{ stopPlacePicking(); openAddPlaceModal(_placeDraft); };
}

function stopPlacePicking(){
  _placePicking = false;
  const bar = document.getElementById("placePickBar");
  if(bar) bar.style.display = "none";
  if(_placePickMarker){ _placePickMarker.remove(); _placePickMarker = null; }
  if(mapGL && _placePickClickHandler){ mapGL.off("click", _placePickClickHandler); _placePickClickHandler = null; }
}

function startPlacePicking(){
  if(!_placeDraft || !mapGL) return;
  closeAddPlaceModal();
  _placePicking = true;
  showPlacePickBar();
  renderPlacePickPin();
  // The card that opened this (e.g. the "Found something?" hidden-venue
  // jump card) can sit well below the map itself, and the modal being a
  // fixed overlay means the map's actual scroll position never had to
  // matter until now — bring it into view so there's something to tap.
  if(map && typeof map.scrollIntoView === "function") map.scrollIntoView({ behavior:"smooth", block:"center" });
  requestAnimationFrame(()=> mapGL.resize());
  _placePickClickHandler = (e)=>{
    _placeDraft.lat = e.lngLat.lat; _placeDraft.lon = e.lngLat.lng;
    renderPlacePickPin();
    showPlacePickBar();
  };
  mapGL.on("click", _placePickClickHandler);
}

function openAddPlaceModal(draft){
  closeAddPlaceModal();
  stopPlacePicking();
  const editingId = draft && draft.id;
  _placeDraft = draft ? { ...draft } : { name:"", category:"Landmark", note:"", lat:null, lon:null };
  // Editing a place saved before this map switched to real lat/lon (old
  // records only ever had x/y) — convert once so editing behaves exactly
  // like any other already-pinned place, rather than looking like its
  // pin was never set.
  if(_placeDraft.lat == null && _placeDraft.x != null){
    const converted = schematicToLatLon(_placeDraft.x, _placeDraft.y);
    _placeDraft.lat = converted.lat; _placeDraft.lon = converted.lon;
  }
  const hasSpot = _placeDraft.lat != null;
  const backdrop = document.createElement("div");
  backdrop.id = "addPlaceModal";
  backdrop.style.cssText = "position:fixed; inset:0; z-index:60; background:rgba(5,10,8,.72); display:flex; align-items:center; justify-content:center; padding:20px;";
  backdrop.innerHTML = `
    <div class="card" style="position:relative; width:100%; max-width:400px; max-height:85vh; overflow-y:auto; margin:0;">
      <button aria-label="Close" id="addPlaceCloseBtn" style="position:absolute; top:10px; right:10px; background:none; border:1px solid var(--line); color:var(--text-primary); border-radius:10px; width:32px; height:32px; font-size:16px; line-height:1; cursor:pointer;">✕</button>
      <h3>${editingId ? "Edit place" : "Add a place"}</h3>
      <p class="empty-note" style="margin-bottom:10px;">${editingId ? "Update the details, or move its pin." : "Mark anything worth remembering — a meeting spot, a landmark, a food stall — right where it actually is."}</p>
      <div class="field"><label>Name</label><input type="text" id="placeNameInput" placeholder="What is it?" value="${escapeHtml(_placeDraft.name || "")}"></div>
      <div class="field"><label>Category</label>
        <select id="placeCategoryInput">
          <option value="Landmark">Landmark</option>
          <option value="Venue">Venue</option>
          <option value="Hidden venue">Hidden venue</option>
          <option value="Meeting point">Meeting point</option>
          <option value="Food & drink">Food &amp; drink</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div class="field"><label>Note (optional)</label><textarea id="placeNoteInput" placeholder="Anything worth remembering">${escapeHtml(_placeDraft.note || "")}</textarea></div>
      <button class="action" id="placeMarkOnMapBtn" style="margin-top:2px;">📍 ${hasSpot ? "Move pin on map" : "Mark on map"}</button>
      <p class="empty-note" id="placePickStatus" style="margin-top:6px;">${hasSpot ? "Spot set — save below, or move it again." : "Tap the button above, then tap the map to drop a pin."}</p>
      <button class="action" id="placeSaveBtn" style="margin-top:10px;" ${hasSpot ? "" : "disabled"}>${editingId ? "Save changes" : "Add place"}</button>
    </div>
  `;
  backdrop.onclick = (e)=>{ if(e.target === backdrop){ _placeDraft = null; closeAddPlaceModal(); } };
  document.body.appendChild(backdrop);
  document.getElementById("addPlaceCloseBtn").onclick = ()=>{ _placeDraft = null; closeAddPlaceModal(); };
  document.getElementById("placeCategoryInput").value = _placeDraft.category || "Landmark";
  document.getElementById("placeMarkOnMapBtn").onclick = ()=>{
    _placeDraft.name = document.getElementById("placeNameInput").value.trim();
    _placeDraft.category = document.getElementById("placeCategoryInput").value;
    _placeDraft.note = document.getElementById("placeNoteInput").value.trim();
    startPlacePicking();
  };
  document.getElementById("placeSaveBtn").onclick = ()=>{
    const name = document.getElementById("placeNameInput").value.trim();
    if(!name || _placeDraft.lat == null) return;
    const list = Store.get("customPlaces") || [];
    const now = Date.now();
    if(editingId){
      const existing = list.find(p=> p.id === editingId);
      if(existing){
        existing.name = name;
        existing.category = document.getElementById("placeCategoryInput").value;
        existing.note = document.getElementById("placeNoteInput").value.trim();
        existing.lat = _placeDraft.lat; existing.lon = _placeDraft.lon;
        delete existing.x; delete existing.y; // fully migrated to real lat/lon now that it's been re-saved
        existing.updatedAt = now;
      }
    } else {
      list.push({
        id: ensurePlaceId(),
        name,
        category: document.getElementById("placeCategoryInput").value,
        note: document.getElementById("placeNoteInput").value.trim(),
        lat: _placeDraft.lat, lon: _placeDraft.lon,
        from: currentContributorName() || "",
        deviceId: (typeof ensureDeviceId === "function") ? ensureDeviceId() : "",
        room: (typeof currentRoomCode === "function") ? currentRoomCode() : "",
        official: false,
        createdAt: now, updatedAt: now
      });
    }
    Store.set("customPlaces", list);
    _placeDraft = null;
    closeAddPlaceModal();
    loadMap();
  };
}

// Tapping a place marker shows its details — edit/delete only offered
// when it's this device's own creation (deviceId match), so one
// friend's device can never edit or remove another's pin; it can only
// ever touch its own array locally either way.
function showPlaceInfo(place){
  const isMine = place.deviceId && (typeof ensureDeviceId === "function") && place.deviceId === ensureDeviceId();
  mapInfo.innerHTML = `
    <div class="card">
      <span class="tag">${escapeHtml(place.category || "Place")}</span>
      <h3>${escapeHtml(place.name)}</h3>
      ${place.note ? `<p>${escapeHtml(place.note)}</p>` : ""}
      <p class="empty-note" style="margin-top:6px;">Added by ${escapeHtml(place.from || "Someone")}${place.updatedAt ? " · " + formatLastSeen(place.updatedAt) : ""}</p>
      ${isMine ? `
        <div style="display:flex; gap:8px; margin-top:10px;">
          <button class="ghost" id="editPlaceBtn">✏️ Edit</button>
          <button class="ghost danger" id="deletePlaceBtn">🗑 Delete</button>
        </div>
      ` : ""}
    </div>
  `;
  if(isMine){
    document.getElementById("editPlaceBtn").onclick = ()=> openAddPlaceModal(place);
    document.getElementById("deletePlaceBtn").onclick = ()=>{
      if(!confirm(`Remove "${place.name}" from the map? This only removes it from your own device — if a friend already synced it in, it stays on theirs unless they remove it too.`)) return;
      Store.set("customPlaces", (Store.get("customPlaces") || []).filter(p=> p.id !== place.id));
      mapInfo.innerHTML = "";
      loadMap();
    };
  }
}

const mapAddPlaceBtn = document.getElementById("mapAddPlaceBtn");
if(mapAddPlaceBtn) mapAddPlaceBtn.onclick = ()=> openAddPlaceModal();

loadMap();

// ===============================
// MAP QUICK ACTIONS — action-oriented shortcuts into the map/directory
// data that already exists (locations, minorStages, the shared meeting
// point, friend statuses, the existing site-info/food/around-site
// cards) rather than a second copy of any of it. Where there's genuinely
// no pinned data for something (water, toilets — Boomtown never
// publishes exact spots), this says so honestly instead of inventing a
// location.
// ===============================
function mapQuickAction(kind){
  const jumpTo = (id)=>{
    const el = document.getElementById(id);
    if(el) requestAnimationFrame(()=> el.scrollIntoView({ behavior:"smooth", block:"center" }));
  };
  const showMapInfo = (html)=>{
    if(mapInfo) mapInfo.innerHTML = html;
    jumpTo("map");
  };

  if(kind === "next"){
    const timed = (typeof timedFromSchedule === "function") ? timedFromSchedule(Store.get("schedule")) : [];
    const nowMin = (typeof nowMinutesSinceFestivalStart === "function") ? nowMinutesSinceFestivalStart() : 0;
    const next = timed.filter(a=> a.startMin > nowMin).sort((a,b)=> a.startMin - b.startMin)[0] || timed.sort((a,b)=> a.startMin - b.startMin)[0];
    if(!next){
      showMapInfo(`<div class="card"><p class="empty-note">Nothing saved yet — add artists from the Lineup tab, then this'll jump straight to their stage.</p></div>`);
      return;
    }
    const stageMatch = [...locations, ...minorStages].find(l=> l.name === next.stage);
    const entry = stageMatch ? mapMarkersByName[stageMatch.name] : null;
    if(entry && mapGL){
      mapGL.jumpTo({ center: entry.marker.getLngLat(), zoom: Math.max(mapGL.getZoom(), 17) });
      if(entry.onClick) entry.onClick();
      const el = entry.marker.getElement();
      const dot = el && el.querySelector(".marker");
      if(dot){
        dot.classList.add("jump-highlight");
        setTimeout(()=> dot.classList.remove("jump-highlight"), 2400);
      }
      jumpTo("map");
      return;
    }
    showMapInfo(`<div class="card"><h3>${escapeHtml(next.name)}</h3><p>${escapeHtml(next.stage)} · ${timeLabel(next)}</p></div>`);
    return;
  }

  if(kind === "meeting"){ jumpTo("jumpMeetingPoint"); return; }

  if(kind === "friends"){
    const entries = (typeof friendStatusEntries === "function") ? friendStatusEntries() : [];
    const list = entries.length && typeof statusLineHTML === "function" ? entries.map(statusLineHTML).join("") : `<p class="empty-note">No one's set a status yet — see Settings' "Location & GPS" card.</p>`;
    showMapInfo(`<div class="card"><h3>📍 Friends</h3>${list}</div>`);
    return;
  }

  if(kind === "camp"){
    const chip = document.querySelector('#mapLayerToggles [data-layer="camp"]');
    if(chip && !chip.classList.contains("active")) chip.click();
    jumpTo("map");
    return;
  }

  if(kind === "medical"){ jumpTo("jumpSiteInfo"); return; }
  if(kind === "food"){
    // No single "the food stall" pin exists — every district has its own
    // spread — so this goes straight to the named/rumoured Food & drink
    // rows in the Directory rather than pointing at one marker on a map
    // that can't show them all yet.
    if(typeof jumpToDirectoryType === "function") jumpToDirectoryType("Food & drink");
    else jumpTo("jumpFoodBars");
    return;
  }
  if(kind === "water" || kind === "toilets"){
    // No exact pinned locations exist for these — Boomtown never
    // publishes them in advance — so this says so honestly rather than
    // scrolling to an invented pin.
    const label = kind === "water" ? "Water refill points" : "Toilets";
    const icon = kind === "water" ? "💧" : "🚻";
    showMapInfo(`<div class="card"><h3>${icon} ${label}</h3><p class="empty-note">No exact 2026 locations are published in advance — Boomtown dots ${label.toLowerCase()} around every district and campsite, with exact spots shown on the official app once you're on-site.</p></div>`);
    return;
  }
}
document.querySelectorAll("#mapQuickActions button").forEach(btn=>{
  btn.onclick = ()=> mapQuickAction(btn.dataset.quick);
});

// Map name search — jumps the map itself to a stage/venue/district by
// name, the one thing the existing chip filters and the separate
// Discover global search couldn't do (that search only scrolls a table
// row into view, never touches the MapLibre canvas). Exact match wins;
// otherwise first case-insensitive substring match, so "spectrum" finds
// "Spectrum 360" without needing the exact name.
function mapSearchGo(){
  const input = document.getElementById("mapSearchInput");
  if(!input) return;
  const term = input.value.trim();
  if(!term) return;
  const names = Object.keys(mapMarkersByName);
  const lower = term.toLowerCase();
  const match = names.find(n=> n.toLowerCase() === lower) || names.find(n=> n.toLowerCase().includes(lower));
  if(!match){
    if(mapInfo) mapInfo.innerHTML = `<div class="card"><p class="empty-note">No stage, venue or district matches "${escapeHtml(term)}" — check the spelling or try a shorter word.</p></div>`;
    return;
  }
  const entry = mapMarkersByName[match];
  if(entry && mapGL){
    mapGL.jumpTo({ center: entry.marker.getLngLat(), zoom: Math.max(mapGL.getZoom(), 17) });
    if(entry.onClick) entry.onClick();
    const el = entry.marker.getElement();
    const dot = el && el.querySelector(".marker");
    if(dot){
      dot.classList.add("jump-highlight");
      setTimeout(()=> dot.classList.remove("jump-highlight"), 2400);
    }
    document.getElementById("map").scrollIntoView({ behavior:"smooth", block:"center" });
  }
}
{
  const searchInput = document.getElementById("mapSearchInput");
  const searchGoBtn = document.getElementById("mapSearchGoBtn");
  if(searchGoBtn) searchGoBtn.onclick = mapSearchGo;
  if(searchInput) searchInput.addEventListener("keydown", (e)=>{ if(e.key === "Enter") mapSearchGo(); });
}

// ===============================
// VENUE DIRECTORY — filterable card list, merges the researched
// directory with anything your group logs as "Your finds" below.
// ===============================
let venueStatusFilter = "all";
let venueTypeFilter = "all";
let venueSearchTerm = "";

const statusLabels = { confirmed:"Confirmed", rumoured:"Rumoured", logged:"Your find" };

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c=>({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}

// Generic "who added this" chip filter, same chip UI as the genre
// filter — dropped above any synced list (theories, journal, sightings,
// hidden-venue finds) so you can view one person's entries at a glance
// instead of a merged wall of everyone's. Purely a display filter, never
// touches what's actually stored or synced.
function renderPersonChipBar(boxId, entries, getActive, setActive, rerender){
  const box = document.getElementById(boxId);
  if(!box) return;
  const names = [...new Set(entries.map(e=>(e.from || "").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  if(names.length < 2){ box.innerHTML = ""; box.style.display = "none"; return; }
  box.style.display = "";
  const active = getActive();
  box.innerHTML = ["All", ...names].map(n=>
    `<span class="chip ${(!active && n==="All") || active===n ? "active" : ""}" data-name="${escapeHtml(n)}">${escapeHtml(n)}</span>`
  ).join("");
  box.querySelectorAll(".chip").forEach(c=>{
    c.onclick = ()=>{ setActive(c.dataset.name === "All" ? null : c.dataset.name); rerender(); };
  });
}

// Derives a rough "typical hours" window for a stage from the actual
// scheduled set times already in the lineup data — not invented, and
// only shown where a real match is found. Anything with no schedule
// entries (most hidden venues, shops, welfare spaces) just gets nothing,
// rather than a made-up or "unknown" placeholder.
function normaliseStageName(s){
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function stageHoursFromSchedule(name){
  const target = normaliseStageName(name);
  if(!target) return null;
  const matches = artists.filter(a=>{
    const stage = normaliseStageName(a.stage);
    return stage === target || stage.includes(target) || target.includes(stage);
  });
  if(!matches.length) return null;
  const toMin = t=>{ const [h,m] = t.split(":").map(Number); return h*60+m; };
  let minStart = Infinity, maxEnd = -Infinity;
  matches.forEach(a=>{
    let s = toMin(a.start), e = toMin(a.end);
    if(e <= s) e += 1440;
    if(s < minStart) minStart = s;
    if(e > maxEnd) maxEnd = e;
  });
  const fmt = m=>{ m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m/60)).padStart(2,"0") + ":" + String(m%60).padStart(2,"0"); };
  return `${fmt(minStart)}–${fmt(maxEnd)}${maxEnd >= 1440 ? " (running past midnight)" : ""}`;
}

function loggedVenuesAsDirectory(){
  return (Store.get("hiddenVenues") || []).map((entry,i)=>({
    name: entry.name || "Untitled find",
    type: entry.type || "Hidden venue",
    status: "logged",
    genre: entry.genre || "—",
    near: entry.near || "",
    music: typeof entry.music === "boolean" ? entry.music : "unclear",
    info: (entry.info ? entry.info : "") + (entry.when ? ` (logged ${entry.when}${entry.from ? " via " + entry.from : ""})` : ""),
    from: entry.from,
    _hiddenVenueIndex: i
  }));
}

function fullVenueDirectory(){
  return venueDirectory.concat(loggedVenuesAsDirectory());
}

// Every name that actually gets a pin drawn in loadMap() — a directory
// row only gets a "Show on map" link when its name is in this set, so
// entries with no plotted location (most food stalls, welfare points and
// shops, since Boomtown never publishes exact spots for these) don't
// offer a link that goes nowhere.
function mapMarkerNames(){
  return new Set([
    ...locations.filter(p=>p.kind !== "meeting").map(p=>p.name),
    ...minorStages.map(p=>p.name),
    ...thingsToFind.map(p=>p.name),
    ...allLandmarks().map(p=>p.name),
    ...gates.map(p=>p.name)
  ]);
}

let venuePersonFilter = null;
function renderVenueTable(){
  const body = document.getElementById("venueTableBody");
  const countNote = document.getElementById("venueTableCount");
  if(!body) return;
  const all = fullVenueDirectory();
  renderPersonChipBar("venuePersonChips", all.filter(v=>v.status === "logged"), ()=>venuePersonFilter, v=>{ venuePersonFilter = v; }, renderVenueTable);
  const term = venueSearchTerm.trim().toLowerCase();
  const rows = all.filter(v=>
    (venueStatusFilter === "all" || v.status === venueStatusFilter) &&
    (venueTypeFilter === "all" || v.type === venueTypeFilter) &&
    (!venuePersonFilter || (v.from || "").trim() === venuePersonFilter) &&
    (!term ||
      v.name.toLowerCase().includes(term) ||
      (v.genre || "").toLowerCase().includes(term) ||
      (v.near || "").toLowerCase().includes(term) ||
      (v.info || "").toLowerCase().includes(term))
  );
  const musicLabel = m => m === true ? "🎵 Music" : m === false ? "🔇 No music" : "🎵 Music unclear";
  const markerNames = mapMarkerNames();
  body.innerHTML = rows.map(v=>{
    const hours = v.status === "logged" ? null : stageHoursFromSchedule(v.name);
    const onMap = markerNames.has(v.name);
    return `
    <div class="venue-row" data-venue-name="${escapeHtml(v.name)}">
      <div class="venue-row-head">
        <strong>${escapeHtml(v.name)}</strong>
        <span style="display:flex; gap:5px; flex-wrap:wrap; justify-content:flex-end;">
          <span class="status-pill2 ${v.status}">${statusLabels[v.status] || v.status}</span>
          <span class="status-pill2" style="background:rgba(238,246,241,.08); color:var(--text-muted); border:1px solid var(--line);">${musicLabel(v.music)}</span>
        </span>
      </div>
      <div class="venue-row-meta">${escapeHtml(v.type)}${v.genre && v.genre !== "—" ? " · " + escapeHtml(v.genre) : ""}${v.near ? " · 📍 " + escapeHtml(v.near) : ""}</div>
      <p class="venue-row-info">${escapeHtml(v.info)}</p>
      ${hours ? `<p class="venue-row-info" style="color:var(--accent-teal); margin-top:4px;">🕐 Acts running roughly ${hours} (from saved set times — see Plan for exact slots)</p>` : ""}
      <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">
        ${onMap ? `<button class="ghost showOnMapBtn" data-name="${escapeHtml(v.name)}">📍 Show on map</button>` : ""}
        ${v.status === "logged" ? `<button data-i="${v._hiddenVenueIndex}" class="ghost removeHiddenVenueBtn">Remove this find</button>` : ""}
      </div>
    </div>
  `;
  }).join("") || `<p class="empty-note">No entries match these filters yet.</p>`;
  if(countNote) countNote.textContent = `Showing ${rows.length} of ${all.length} entries.`;
  // Only the meta line ("near Botanica") and info blurb, never the venue's
  // own name heading — a venue like "Botanica Zoo" would otherwise get its
  // own name partially turned into a link.
  body.querySelectorAll(".venue-row-meta, .venue-row-info").forEach(el=> linkifyKeyTerms(el));
  body.querySelectorAll(".showOnMapBtn").forEach(btn=>{
    btn.onclick = ()=> jumpToDistrictOnMap(btn.dataset.name);
  });
  body.querySelectorAll(".removeHiddenVenueBtn").forEach(btn=>{
    btn.onclick = ()=>{
      const list = Store.get("hiddenVenues") || [];
      list.splice(Number(btn.dataset.i), 1);
      Store.set("hiddenVenues", list);
      renderVenueTable();
      if(typeof renderConsolidatedNotes === "function") renderConsolidatedNotes();
    };
  });
}

const venueSearchInput = document.getElementById("venueSearch");
const clearVenueSearchBtn = document.getElementById("clearVenueSearchBtn");
function updateClearVenueSearchBtn(){
  if(clearVenueSearchBtn) clearVenueSearchBtn.style.display = venueSearchTerm.trim().length ? "" : "none";
}
if(venueSearchInput){
  venueSearchInput.oninput = ()=>{
    venueSearchTerm = venueSearchInput.value;
    updateClearVenueSearchBtn();
    renderVenueTable();
  };
}
if(clearVenueSearchBtn){
  clearVenueSearchBtn.onclick = ()=>{
    venueSearchTerm = "";
    venueSearchInput.value = "";
    updateClearVenueSearchBtn();
    renderVenueTable();
  };
}

function setupVenueTableFilters(){
  const statusBtns = document.querySelectorAll("#venueStatusFilters button");
  const typeBtns = document.querySelectorAll("#venueTypeFilters button");
  statusBtns.forEach(btn=>{
    btn.onclick = ()=>{
      statusBtns.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      venueStatusFilter = btn.dataset.status;
      renderVenueTable();
    };
  });
  typeBtns.forEach(btn=>{
    btn.onclick = ()=>{
      typeBtns.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      venueTypeFilter = btn.dataset.type;
      renderVenueTable();
    };
  });
}
setupVenueTableFilters();
renderVenueTable();

// Generic cross-screen jump: switch tab (if given) then scroll an id
// into view. Every screen is always in the DOM (hidden via CSS, not
// removed), so no delay is needed between the two.
function jumpToId(id, tab){
  // The Settings space isn't a bottom-tabbar tab (see openSettingsScreen
  // above) — jumpToTab(tab) would fail to find a matching .tab button for
  // it, so route there separately instead.
  if(tab === "settingsscreen"){ if(typeof openSettingsScreen === "function") openSettingsScreen(); }
  else if(tab) jumpToTab(tab);
  // Settings folds up by default (see setupSettingsToggle()) — jumping
  // to it from a link elsewhere should open it, not scroll to what'd
  // look like an empty card.
  if(id === "jumpSettings"){
    const body = document.getElementById("settingsBody");
    const toggleBtn = document.getElementById("settingsToggleBtn");
    if(body && body.style.display === "none" && toggleBtn) toggleBtn.click();
  }
  requestAnimationFrame(()=>{
    const el = document.getElementById(id);
    if(el) el.scrollIntoView({ behavior:"smooth", block:"center" });
  });
}

(function setupSettingsToggle(){
  const btn = document.getElementById("settingsToggleBtn");
  const body = document.getElementById("settingsBody");
  if(!btn || !body) return;
  btn.onclick = ()=>{
    const nowOpen = body.style.display === "none";
    body.style.display = nowOpen ? "" : "none";
    btn.textContent = nowOpen ? "Hide settings ▴" : "Show settings ▾";
  };
})();

(function setupAddToHomeToggle(){
  const btn = document.getElementById("addToHomeToggleBtn");
  const body = document.getElementById("addToHomeBody");
  if(!btn || !body) return;
  btn.onclick = ()=>{
    const nowOpen = body.style.display === "none";
    body.style.display = nowOpen ? "" : "none";
    btn.textContent = nowOpen ? "Hide ▴" : "Show me how ▾";
  };
})();

// Jump straight to a district's own marker/card on the map, from a
// mention of its name anywhere else in the app (guide text, etc.).
function jumpToDistrictOnMap(name){
  jumpToTab("mapscreen");
  requestAnimationFrame(()=>{
    if(mapGL) mapGL.resize();
    const entry = mapMarkersByName[name];
    if(entry && mapGL){
      mapGL.jumpTo({ center: entry.marker.getLngLat(), zoom: Math.max(mapGL.getZoom(), 16) });
      if(entry.onClick) entry.onClick();
      // Flash it — a single dot among 40+ markers is easy to miss on
      // arrival, so this briefly pops it oversized/white to draw the eye.
      const el = entry.marker.getElement();
      const dot = el && el.querySelector(".marker");
      if(dot){
        dot.classList.add("jump-highlight");
        setTimeout(()=> dot.classList.remove("jump-highlight"), 2400);
      }
    }
    const info = document.getElementById("mapInfo");
    if(info) info.scrollIntoView({ behavior:"smooth", block:"center" });
  });
}

function jumpToGlossaryTerm(term){
  jumpToTab("discover");
  requestAnimationFrame(()=>{
    const box = document.getElementById("jumpGlossary");
    if(box) box.scrollIntoView({ behavior:"smooth", block:"center" });
    if(glossarySearch){ glossarySearch.value = term; glossarySearch.dispatchEvent(new Event("input")); }
  });
}

function jumpToCharacter(name){
  jumpToTab("discover");
  requestAnimationFrame(()=>{
    const box = document.getElementById("jumpCharacters");
    if(box) box.scrollIntoView({ behavior:"smooth", block:"center" });
    if(characterSearch){ characterSearch.value = name; characterSearch.dispatchEvent(new Event("input")); }
  });
}

// ===============================
// INLINE TERM LINKING — turns mentions of district names, character
// names and glossary terms inside guide text into clickable links to
// that term's fuller entry elsewhere in the app (map marker, Characters
// search, Glossary search), so a name you don't recognise mid-paragraph
// is one tap from its actual explanation instead of a dead end. Built
// lazily since it depends on `characters`/`glossary` being defined.
// ===============================
const GUIDE_DISTRICT_NAMES = ["Area 404","Botanica","Thrutopia","Copperwood","Oldtown","Letsbe Avenue","Metropolis"];
let _inlineTermIndex = null;
function inlineTermIndex(){
  if(_inlineTermIndex) return _inlineTermIndex;
  const index = {};
  const cleanTerm = t=> /^[A-Za-z0-9'’.\- ]+$/.test(t); // skip anything with ™, /, () etc — too fiddly to match/escape safely
  characters.forEach(c=>{ const k=c.name.toLowerCase(); if(cleanTerm(c.name) && !index[k]) index[k] = { label:c.name, type:"character" }; });
  glossary.forEach(g=>{ const k=g.term.toLowerCase(); if(cleanTerm(g.term) && !index[k]) index[k] = { label:g.term, type:"glossary" }; });
  GUIDE_DISTRICT_NAMES.forEach(d=>{ index[d.toLowerCase()] = { label:d, type:"district" }; }); // districts always win any clash
  _inlineTermIndex = index;
  return index;
}

function linkifyKeyTerms(container){
  // Called from renderVenueTable(), which fires once very early at
  // top-level script init — before `characters`/`glossary` (defined
  // much further down this file) exist yet. Guard against that TDZ
  // crash rather than letting it abort the whole script; later calls
  // (guide render, filter changes, etc.) succeed normally once
  // everything is defined.
  let index;
  try{ index = inlineTermIndex(); }catch(e){ return; }
  const terms = Object.values(index).map(t=>t.label).concat(["districts","district"]);
  const escaped = terms.slice().sort((a,b)=> b.length - a.length).map(t=> t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp("\\b(" + escaped.join("|") + ")\\b", "g");
  const linkedAlready = new Set();
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node){
      if(!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if(node.parentElement && node.parentElement.closest("a")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  let n; while((n = walker.nextNode())) nodes.push(n);
  nodes.forEach(node=>{
    const text = node.nodeValue;
    pattern.lastIndex = 0;
    if(!pattern.test(text)) return;
    pattern.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let lastIndex = 0, match;
    while((match = pattern.exec(text))){
      const word = match[0];
      const key = word.toLowerCase();
      const isGeneric = key === "district" || key === "districts";
      const entry = isGeneric ? null : index[key];
      const shouldLink = isGeneric || (entry && !linkedAlready.has(key));
      frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      if(shouldLink){
        const a = document.createElement("a");
        a.className = "inline-link";
        a.href = "javascript:void(0)";
        a.textContent = word;
        if(isGeneric) a.onclick = ()=> jumpToTab("mapscreen");
        else if(entry.type === "district") a.onclick = ()=> jumpToDistrictOnMap(entry.label);
        else if(entry.type === "character") a.onclick = ()=> jumpToCharacter(entry.label);
        else a.onclick = ()=> jumpToGlossaryTerm(entry.label);
        if(!isGeneric) linkedAlready.add(key);
        frag.appendChild(a);
      } else {
        frag.appendChild(document.createTextNode(word));
      }
      lastIndex = match.index + word.length;
    }
    frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    node.parentNode.replaceChild(frag, node);
  });
}

// Jump here from an artist's stage name (Artists list, Plan, Timeline)
// to see that venue's directory entry — resets other filters, uses the
// same search box so only the matching row(s) show, and scrolls to it.
// Jump to the full Directory, pre-filtered to one type (e.g. "Food & drink").
// Used wherever a quick-lookup can't point at an exact map pin — the map's
// district/stage markers are illustrative, not surveyed, so anything that
// doesn't have one fixed named spot (food stalls, welfare points, market
// stalls) is better served by scrolling straight to the searchable list of
// named/rumoured entries than by guessing at a marker to highlight.
function jumpToDirectoryType(type){
  jumpToTab("mapscreen");
  venueStatusFilter = "all";
  venueSearchTerm = "";
  if(venueSearchInput) venueSearchInput.value = "";
  updateClearVenueSearchBtn();
  document.querySelectorAll("#venueStatusFilters button").forEach(b=> b.classList.toggle("active", b.dataset.status === "all"));
  venueTypeFilter = type;
  document.querySelectorAll("#venueTypeFilters button").forEach(b=> b.classList.toggle("active", b.dataset.type === type));
  renderVenueTable();
  requestAnimationFrame(()=>{
    const dir = document.getElementById("jumpDirectory");
    if(dir) dir.scrollIntoView({ behavior:"smooth", block:"center" });
  });
}

function jumpToStageDirectory(stageName){
  jumpToTab("mapscreen");
  venueStatusFilter = "all";
  venueTypeFilter = "all";
  document.querySelectorAll("#venueStatusFilters button").forEach(b=> b.classList.toggle("active", b.dataset.status === "all"));
  document.querySelectorAll("#venueTypeFilters button").forEach(b=> b.classList.toggle("active", b.dataset.type === "all"));
  venueSearchTerm = stageName;
  if(venueSearchInput) venueSearchInput.value = stageName;
  updateClearVenueSearchBtn();
  renderVenueTable();
  requestAnimationFrame(()=>{
    const row = document.querySelector(`.venue-row[data-venue-name="${CSS.escape(stageName)}"]`) || document.querySelector(".venue-row");
    if(row) row.scrollIntoView({ behavior:"smooth", block:"center" });
  });
}

// ===============================
// DISCOVER GLOBAL SEARCH — one search box reaching across Lineup artists,
// the full venue directory and Discover's own sections/characters/
// glossary/districts, instead of three separate searches you have to
// already know which screen to open first. Only wired via oninput (never
// called at load time), so it's safe to reference things declared much
// further down this file (characters/glossary/GUIDE_DISTRICT_NAMES) —
// by the time anyone can type into it, the whole script has already run.
// Artist/venue hits get a capped preview (DISCOVER_SEARCH_MAX_PER_GROUP)
// with a "See all N" link into that screen's own full search for the
// rest, rather than dumping hundreds of rows into Discover itself.
// ===============================
const DISCOVER_SEARCH_MAX_PER_GROUP = 6;
function jumpToArtistSearch(term){
  jumpToTab("artists");
  if(artistsView !== "list" && artistsViewListBtn) artistsViewListBtn.click();
  artistSearch.value = term;
  updateClearArtistSearchBtn();
  renderArtistSearchResults();
  window.scrollTo(0, 0);
}
function discoverSearchSections(){
  return [...document.querySelectorAll("#discoverNav button[data-jump]")].map(btn=> ({
    label: btn.textContent.trim(), jumpId: btn.dataset.jump, jumpTab: btn.dataset.jumpTab || null
  }));
}
function renderDiscoverGlobalSearch(){
  const input = document.getElementById("discoverGlobalSearch");
  const box = document.getElementById("discoverSearchResults");
  const clearBtn = document.getElementById("clearDiscoverSearchBtn");
  const nav = document.getElementById("discoverNav");
  const forYou = document.getElementById("discoverForYou");
  if(!input || !box) return;
  const raw = input.value.trim();
  const term = raw.toLowerCase();
  if(clearBtn) clearBtn.style.display = term ? "" : "none";
  if(!term){
    box.innerHTML = "";
    if(nav) nav.style.display = "";
    if(forYou) forYou.style.display = "";
    return;
  }
  if(nav) nav.style.display = "none";
  if(forYou) forYou.style.display = "none";

  const artistMatches = allArtists().filter(a=>
    a.name.toLowerCase().includes(term) || a.stage.toLowerCase().includes(term) || genreOf(a).toLowerCase().includes(term)
  );
  const venueMatches = fullVenueDirectory().filter(v=>
    v.name.toLowerCase().includes(term) || (v.genre||"").toLowerCase().includes(term) ||
    (v.near||"").toLowerCase().includes(term) || (v.info||"").toLowerCase().includes(term)
  );
  const sectionMatches = discoverSearchSections().filter(s=> s.label.toLowerCase().includes(term));
  const districtMatches = (typeof GUIDE_DISTRICT_NAMES !== "undefined" ? GUIDE_DISTRICT_NAMES : []).filter(d=> d.toLowerCase().includes(term));
  const characterMatches = (typeof characters !== "undefined" ? characters : []).filter(c=> c.name.toLowerCase().includes(term));
  const glossaryMatches = (typeof glossary !== "undefined" ? glossary : []).filter(g=> g.term.toLowerCase().includes(term) || (g.def||"").toLowerCase().includes(term));

  const artistRowsHtml = artistMatches.slice(0, DISCOVER_SEARCH_MAX_PER_GROUP).map(a=> `
    <div class="item" style="cursor:pointer;" data-artist-jump="${escapeHtml(a.name)}">
      <strong>${escapeHtml(a.name)}</strong> — ${escapeHtml(a.stage)}<br>
      <small>${escapeHtml(timeLabel(a))} · ${escapeHtml(genreOf(a))}</small>
    </div>`).join("");
  const venueRowsHtml = venueMatches.slice(0, DISCOVER_SEARCH_MAX_PER_GROUP).map(v=> `
    <div class="item" style="cursor:pointer;" data-venue-jump="${escapeHtml(v.name)}">
      <strong>${escapeHtml(v.name)}</strong> — ${escapeHtml(v.type)}${v.near ? " · 📍 " + escapeHtml(v.near) : ""}<br>
      <small>${escapeHtml((v.info||"").slice(0,90))}${(v.info||"").length > 90 ? "…" : ""}</small>
    </div>`).join("");
  const discoverEntries = [
    ...sectionMatches.map(s=> ({ label: s.label, jumpId: s.jumpId, jumpTab: s.jumpTab })),
    ...districtMatches.map(d=> ({ label: `🏙 ${d}`, district: d })),
    ...characterMatches.slice(0, DISCOVER_SEARCH_MAX_PER_GROUP).map(c=> ({ label: `🗣 ${c.name}`, character: c.name })),
    ...glossaryMatches.slice(0, DISCOVER_SEARCH_MAX_PER_GROUP).map(g=> ({ label: `📔 ${g.term}`, glossaryTerm: g.term }))
  ];
  const discoverRowsHtml = discoverEntries.map((e,i)=> `<div class="item" style="cursor:pointer;" data-discover-entry="${i}"><strong>${escapeHtml(e.label)}</strong></div>`).join("");

  const groups = [];
  if(artistRowsHtml) groups.push(`<div class="daygroup">🎵 Lineup (${artistMatches.length})</div>${artistRowsHtml}${artistMatches.length > DISCOVER_SEARCH_MAX_PER_GROUP ? `<p class="empty-note" id="discoverSearchSeeAllArtists" style="cursor:pointer;">See all ${artistMatches.length} in Lineup →</p>` : ""}`);
  if(venueRowsHtml) groups.push(`<div class="daygroup">🕵 Directory (${venueMatches.length})</div>${venueRowsHtml}${venueMatches.length > DISCOVER_SEARCH_MAX_PER_GROUP ? `<p class="empty-note" id="discoverSearchSeeAllVenues" style="cursor:pointer;">See all ${venueMatches.length} in Directory →</p>` : ""}`);
  if(discoverRowsHtml) groups.push(`<div class="daygroup">✨ Discover</div>${discoverRowsHtml}`);
  box.innerHTML = groups.length ? groups.join("") : `<p class="empty-note">No matches for "${escapeHtml(raw)}".</p>`;

  box.querySelectorAll("[data-artist-jump]").forEach(el=>{
    el.onclick = ()=> jumpToArtistSearch(el.getAttribute("data-artist-jump"));
  });
  box.querySelectorAll("[data-venue-jump]").forEach(el=>{
    el.onclick = ()=> jumpToStageDirectory(el.getAttribute("data-venue-jump"));
  });
  box.querySelectorAll("[data-discover-entry]").forEach(el=>{
    const entry = discoverEntries[Number(el.getAttribute("data-discover-entry"))];
    el.onclick = ()=>{
      if(entry.district) jumpToDistrictOnMap(entry.district);
      else if(entry.character) jumpToCharacter(entry.character);
      else if(entry.glossaryTerm) jumpToGlossaryTerm(entry.glossaryTerm);
      else jumpToId(entry.jumpId, entry.jumpTab);
    };
  });
  const seeAllArtists = document.getElementById("discoverSearchSeeAllArtists");
  if(seeAllArtists) seeAllArtists.onclick = ()=> jumpToArtistSearch(raw);
  const seeAllVenues = document.getElementById("discoverSearchSeeAllVenues");
  if(seeAllVenues) seeAllVenues.onclick = ()=> jumpToStageDirectory(raw);
}
(function wireDiscoverGlobalSearch(){
  const input = document.getElementById("discoverGlobalSearch");
  const clearBtn = document.getElementById("clearDiscoverSearchBtn");
  if(!input) return;
  let debounceTimer = null;
  input.oninput = ()=>{
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderDiscoverGlobalSearch, 180);
  };
  if(clearBtn) clearBtn.onclick = ()=>{
    input.value = "";
    renderDiscoverGlobalSearch();
    input.focus();
  };
})();

function wireStageLinks(container){
  if(!container) return;
  container.querySelectorAll(".stage-link").forEach(el=>{
    el.onclick = (e)=>{ e.stopPropagation(); jumpToStageDirectory(el.dataset.stage); };
  });
}

// ===============================
// DISTRICT PASSPORT
// ===============================
const discoveries = [
  { title:"Area 404", location:"Downtown · industrial-punk district, now the political centre", description:"The far-edge district for outsiders and squatters won last year's election and was suddenly thrust into the centre of Boomtown's story. Chief Guardian Mr Biga now runs it with The Guardians, a police force that has curdled into abusive 'official fines', boot camps and work-permit checks. The 'Collector' seen in charge since is widely believed to be a deepfake built by Biga and Aurora Venturestone — the real Collector hasn't been seen outside occasional broadcasts.", characters:"Mr Biga · The Guardians · The Collector (missing)" },
  { title:"Botanica", location:"Downtown · plant-covered temple sanctuary", description:"The Great Mother is still furious after her election defeat, and is plotting a ritual to sacrifice her followers into her own portal to 'ascend' her whole community — a direct swipe at the Collector's authority. Her old base, the Temple of Zero, now belongs to The Network and its sentient mycelium AI IONA, working alongside a secretive group called Shadow Post on a strange photocopier phenomenon.", characters:"The Great Mother · IONA · Shadow Post · The Network" },
  { title:"Thrutopia", location:"Hilltop · new wellness & workshop zone", description:"Brand new for Chapter Five — a reflective corner of the city built around breathwork, sound baths, saunas and open conversation on climate, justice and collective futures, developed with input from author Manda Scott. It's less a story district than a daytime reset; The Retreat's spa woodlands and open workshop submissions live here.", characters:"Workshop hosts · The Retreat" },
  { title:"Copperwood", location:"1925 roaring-twenties film district", description:"Self-appointed Creative Director Edna Von Vanderhaus runs the in-world film industry here under her company VVH, currently shooting 'Race to the Red Planet.' Her fans have built her a whole fan settlement, Von Vanderland — worth a visit if you want a walk-on part or a peek behind the set dressing.", characters:"Edna Von Vanderhaus · VVH · Von Vanderland" },
  { title:"Oldtown", location:"Hilltop · circus & rogues district, rebuilt uphill", description:"Boomtown's founding district was relocated uphill after Area 404's expansion, and Rufus the Red's Den of Dis Order are now pushing full separatism as 'The People's Republic of Oldtownia' — a direct challenge to Area 404's rule.", characters:"Rufus the Red · Den of Dis Order" },
  { title:"Letsbe Avenue", location:"The everyday high street", description:"Patrick Kahn's old BLEP operation has rebranded as BLIP: Boomtown Lifestyle Important Product, sold exclusively to status-holders called VIPPs. Nobody's quite sure what it actually does yet — worth asking to try it, or what earns someone VIPP status.", characters:"Patrick Kahn · BLIP · VIPPs" },
  { title:"Metropolis", location:"Hyper-digital, hedonistic district", description:"Aurora Venturestone's Chief-of-Digital-Communications empire keeps Bettercorp™ thriving in public, despite mass layoffs behind the scenes. Unemployed 'inGeniuses' now run illegal, unofficial 'urban explorer' tours into a glitching Betterverse™ — a risky but revealing detour.", characters:"Aurora Venturestone · inGeniuses · Bettercorp™" }
];

const discoveriesBox = document.getElementById("discoveries");
const districtSearchInput = document.getElementById("districtSearch");
let districtSearchTerm = "";

function loadDiscoveries(){
  discoveriesBox.innerHTML = "";
  const clues = Store.get("clues") || {};
  const term = districtSearchTerm.trim().toLowerCase();
  const matches = term
    ? discoveries.map((item,index)=>({item,index})).filter(({item})=>
        (item.title + " " + item.location + " " + item.description + " " + item.characters).toLowerCase().includes(term))
    : discoveries.map((item,index)=>({item,index}));
  if(term && !matches.length){
    discoveriesBox.innerHTML = `<p class="empty-note">No districts match "${escapeHtml(districtSearchInput ? districtSearchInput.value.trim() : "")}".</p>`;
    return;
  }
  matches.forEach(({item, index})=>{
    const unlocked = Store.get("discoveries").includes(index);
    const box = document.createElement("div");
    box.className = "discovery";
    box.innerHTML = `
      <h3>${item.title} ${unlocked ? "✅" : "◻️"}</h3>
      <p>${item.location}</p>
      <p>${item.description}</p>
      <p style="color:var(--accent-teal); font-size:12px; text-transform:uppercase; letter-spacing:.05em; margin-top:8px;">${item.characters}</p>
      <button class="action">${unlocked ? "Visited" : "Mark visited"}</button>
      <textarea class="clue-input" placeholder="Leads your group has picked up here...">${clues[item.title] || ""}</textarea>
    `;
    box.querySelector("button").onclick = ()=> unlockDiscovery(index);
    box.querySelector(".clue-input").oninput = (e)=>{
      const c = Store.get("clues") || {};
      c[item.title] = e.target.value;
      Store.set("clues", c);
    };
    discoveriesBox.appendChild(box);
  });
}

function unlockDiscovery(index){
  let found = Store.get("discoveries");
  if(!found.includes(index)){ found.push(index); } else { found = found.filter(i=>i!==index); }
  Store.set("discoveries", found);
  loadDiscoveries();
}

loadDiscoveries();
if(districtSearchInput) districtSearchInput.oninput = ()=>{
  districtSearchTerm = districtSearchInput.value;
  loadDiscoveries();
};

async function copyText(text, btn){
  const old = btn.textContent;
  try{
    await navigator.clipboard.writeText(text);
    btn.textContent = "Copied!";
  }catch(e){
    window.prompt("Copy this manually:", text);
  }
  setTimeout(()=> btn.textContent = old, 1500);
}

document.getElementById("copyCluesBtn").onclick = (e)=>{
  const clues = Store.get("clues") || {};
  const visited = Store.get("discoveries");
  const lines = discoveries.map((d,i)=>{
    const v = visited.includes(i) ? "Visited" : "Not yet";
    const note = clues[d.title] ? ` — ${clues[d.title]}` : "";
    return `${d.title} (${v})${note}`;
  });
  copyText("District notes:\n" + lines.join("\n"), e.target);
};
document.getElementById("copyTheoriesBtn").onclick = (e)=>{
  const entries = Store.get("theories") || [];
  copyText(entries.length ? "Theories:\n" + entries.map(t=>`- ${t.text}`).join("\n") : "No theories saved yet.", e.target);
};
document.getElementById("copyVenuesBtn").onclick = (e)=>{
  const entries = Store.get("hiddenVenues") || [];
  const lines = entries.map(v=>`- ${v.name}${v.genre ? ` (${v.genre})` : ""}${v.info ? ` — ${v.info}` : ""}`);
  copyText(entries.length ? "Our hidden-venue finds:\n" + lines.join("\n") : "No hidden venues logged yet.", e.target);
};

// ===============================
// GROUP SYNC — turns everyone's clues/theories/finds/socials into a
// short pasteable code, and merges someone else's code in without
// duplicating anything already saved. This is how one phone ends up
// with everyone's info in it, ready to "Download shareable group copy"
// and share (that export leaves out personal-only fields — see
// PERSONAL_ONLY_KEYS below).
// ===============================
function buildSyncPayload(){
  return {
    v: 1,
    // Stable per-device identity — see ensureDeviceId() further down.
    // Included in the payload itself (not just used as the Firestore doc
    // ID) so the manual copy/paste sync-code path gets the same
    // collision-proof per-person keying as the automatic cloud sync does.
    deviceId: (typeof ensureDeviceId === "function") ? ensureDeviceId() : "",
    from: (Store.get("contributorName") || "").trim() || "Someone",
    clues: Store.get("clues") || {},
    characterNotes: Store.get("characterNotes") || {},
    theories: Store.get("theories") || [],
    hiddenVenues: Store.get("hiddenVenues") || [],
    involvedDone: Store.get("involvedDone") || [],
    discoveries: Store.get("discoveries") || [],
    customSocials: Store.get("customSocials") || [],
    quotes: Store.get("quotes") || [],
    sightings: Store.get("sightings") || [],
    customLandmarks: Store.get("customLandmarks") || [],
    customPlaces: Store.get("customPlaces") || [],
    // Official time corrections — see allArtists()/applyOfficialTimeCorrection.
    // A plain object keyed "day|name", merged the same key+updatedAt-wins
    // way as customPlaces (see mergeSyncPayload below).
    officialTimeCorrections: Store.get("officialTimeCorrections") || {},
    // Read-only snapshot of this device's own saved artists — the
    // receiving phone stores this under peopleSchedules[from], never
    // merged into its own "schedule". See the DATA ISOLATION MODEL note
    // near Store/DEFAULTS above.
    schedule: Store.get("schedule") || [],
    // Same read-only-snapshot treatment as schedule/peopleSchedules —
    // lands in peopleBingo[from] on the receiving end, viewable in its
    // own tab, never merged into or overwriting anyone's own card.
    bingo: {
      card: Store.get("bingoCard") || [],
      marked: Store.get("bingoMarked") || [],
      locked: !!Store.get("bingoLocked")
    },
    // Same read-only-snapshot treatment again — lands in
    // peopleCharacters[from], viewable in its own tab, never merged
    // into or overwriting your own myCharacter.
    character: Store.get("myCharacter") || null,
    // Lightweight "where am I" status — a preset or custom place plus
    // when it was set. Same read-only-snapshot treatment: lands in
    // peopleStatus[personId] on the receiving end, never merged into
    // anyone else's own myStatus.
    status: Store.get("myStatus") || null,
    // The shared meeting point and group invites aren't per-device —
    // every device just carries its own last-known copy of them here,
    // piggybacking on this same already-working per-member write. On
    // merge, whichever copy has the newest updatedAt wins (see
    // mergeSyncPayload below) — a simple last-write-wins spread across
    // however many devices happen to sync, no separate document needed.
    // `decisions` is the field name on the wire (see groupInviteKey/
    // toggleGroupInvite) — kept as-is rather than renamed, since a new
    // top-level sync field needs firestore.rules updated everywhere
    // before it'll accept writes.
    meeting: Store.get("meetingUpdatedAt") ? { place: Store.get("meeting") || "", by: Store.get("meetingBy") || "", updatedAt: Store.get("meetingUpdatedAt") } : null,
    decisions: Store.get("groupDecisions") || {},
    // Same read-only-snapshot treatment as schedule/bingo/character/status
    // above — lands in peopleActivities[personId] on the receiving end.
    // Every activity syncs regardless of visibility — "personal" vs
    // "group" only controls whether others can JOIN it (see
    // renderPlanActivitiesList's join-button gating), not whether they
    // can see it. It's always visible on the owner's own timeline lane
    // for anyone synced in, same as a group one.
    activities: Store.get("activities") || [],
    // Which OTHER people's group activities this device has marked "I'm
    // in" — lands in peopleJoins[personId], read alongside peopleActivities
    // so any device can compute a full attendee list for any activity
    // without a separate write path per activity.
    joinedActivities: Store.get("joinedActivities") || [],
    // "day|name" keys this device has flagged "want to see this
    // together" on a Lineup act — lands in peopleWantTogether[personId],
    // read alongside this device's own list to compute a combined
    // interest count/name list for any artist (see
    // wantTogetherInterestedNames).
    wantTogether: Store.get("wantTogether") || []
  };
}

function encodeSyncCode(payload){
  const json = JSON.stringify(payload);
  return "BTC1:" + btoa(unescape(encodeURIComponent(json)));
}

function decodeSyncCode(code){
  const raw = code.trim().replace(/^BTC1:/, "");
  const json = decodeURIComponent(escape(atob(raw)));
  const payload = JSON.parse(json);
  if(!payload || typeof payload !== "object") throw new Error("Bad payload");
  return payload;
}

function mergeSyncPayload(payload){
  const stats = { clues:0, theories:0, venues:0, districts:0, involved:0, socials:0, quotes:0, sightings:0, landmarks:0, places:0, corrections:0, schedule:0, bingo:0, character:0, characterNotes:0 };
  const from = payload.from || "Someone";
  // The stable identity to key per-person snapshots by, wherever one's
  // available — falls back to the display name only for payloads from
  // before deviceId existed (an old manual sync code someone still has
  // saved), so those don't just silently fail to merge.
  const personId = payload.deviceId || from;

  // Clue notes are freeform multi-line text per district, and an incoming
  // payload may itself already contain lines merged in from earlier syncs
  // (each tagged with its own contributor) — so dedupe line by line rather
  // than as one whole blob, or a re-send of the same code would double up.
  const clues = Store.get("clues") || {};
  const tagPattern = /^\[.+?\]\s/;
  Object.entries(payload.clues || {}).forEach(([district, text])=>{
    if(!text) return;
    const existing = clues[district] || "";
    const existingLines = new Set(existing.split("\n").map(l=>l.trim()).filter(Boolean));
    const incomingLines = String(text).split("\n").map(l=>l.trim()).filter(Boolean);
    const newLines = incomingLines
      .map(l=> tagPattern.test(l) ? l : `[${from}] ${l}`)
      .filter(l=> !existingLines.has(l));
    if(!newLines.length) return;
    clues[district] = existing ? existing + "\n" + newLines.join("\n") : newLines.join("\n");
    stats.clues += newLines.length;
  });
  Store.set("clues", clues);

  // Same line-by-line merge as clues above, but keyed per in-fiction
  // character instead of per district — lets you (and everyone else)
  // log more than one note about the same character over the weekend
  // without any of them overwriting each other.
  const characterNotes = Store.get("characterNotes") || {};
  Object.entries(payload.characterNotes || {}).forEach(([charName, text])=>{
    if(!text) return;
    const existing = characterNotes[charName] || "";
    const existingLines = new Set(existing.split("\n").map(l=>l.trim()).filter(Boolean));
    const incomingLines = String(text).split("\n").map(l=>l.trim()).filter(Boolean);
    const newLines = incomingLines
      .map(l=> tagPattern.test(l) ? l : `[${from}] ${l}`)
      .filter(l=> !existingLines.has(l));
    if(!newLines.length) return;
    characterNotes[charName] = existing ? existing + "\n" + newLines.join("\n") : newLines.join("\n");
    stats.characterNotes += newLines.length;
  });
  Store.set("characterNotes", characterNotes);

  const theories = Store.get("theories") || [];
  const theoryKeys = new Set(theories.map(t=>(t.text || "").trim().toLowerCase()));
  (payload.theories || []).forEach(t=>{
    const key = (t.text || "").trim().toLowerCase();
    if(!key || theoryKeys.has(key)) return;
    theoryKeys.add(key);
    theories.push({ text: t.text, when: t.when, from, ts: t.ts || null });
    stats.theories++;
  });
  Store.set("theories", theories);

  // Keyed by name+contributor+info, not just name+contributor — the
  // same person can log the same venue more than once (going back a
  // second night, a different set, a different note) and every one of
  // those must survive as its own entry. Only an exact re-send of the
  // identical note (same name+from+info, e.g. re-syncing the same code
  // twice) counts as a true duplicate.
  const venues = Store.get("hiddenVenues") || [];
  const venueKeys = new Set(venues.map(v=>`${(v.name || "").trim().toLowerCase()}|${(v.from || "").trim().toLowerCase()}|${(v.info || "").trim().toLowerCase()}`));
  (payload.hiddenVenues || []).forEach(v=>{
    const name = (v.name || "").trim().toLowerCase();
    const key = `${name}|${from.trim().toLowerCase()}|${(v.info || "").trim().toLowerCase()}`;
    if(!name || venueKeys.has(key)) return;
    venueKeys.add(key);
    venues.push({ ...v, from });
    stats.venues++;
  });
  Store.set("hiddenVenues", venues);

  const involved = Store.get("involvedDone") || [];
  const involvedTitles = new Set(involved.map(d=> typeof d === "string" ? d : d.title));
  (payload.involvedDone || []).forEach(entry=>{
    const title = typeof entry === "string" ? entry : entry.title;
    if(!title || involvedTitles.has(title)) return;
    involvedTitles.add(title);
    involved.push(typeof entry === "string" ? { title, from } : { title, from: entry.from || from });
    stats.involved++;
  });
  Store.set("involvedDone", involved);

  const disc = Store.get("discoveries") || [];
  (payload.discoveries || []).forEach(i=>{
    if(!disc.includes(i)){ disc.push(i); stats.districts++; }
  });
  Store.set("discoveries", disc);

  const socials = Store.get("customSocials") || [];
  const socialKeys = new Set(socials.map(s=>(s.url || "").trim().toLowerCase()));
  (payload.customSocials || []).forEach(s=>{
    const key = (s.url || "").trim().toLowerCase();
    if(!key || socialKeys.has(key)) return;
    socialKeys.add(key);
    socials.push(s);
    stats.socials++;
  });
  Store.set("customSocials", socials);

  const quotes = Store.get("quotes") || [];
  const quoteKeys = new Set(quotes.map(q=>(q.text || "").trim().toLowerCase()));
  (payload.quotes || []).forEach(q=>{
    const key = (q.text || "").trim().toLowerCase();
    if(!key || quoteKeys.has(key)) return;
    quoteKeys.add(key);
    quotes.push({ ...q, from: q.from || from });
    stats.quotes++;
  });
  Store.set("quotes", quotes);

  const sightings = Store.get("sightings") || [];
  const sightingKeys = new Set(sightings.map(s=>(s.text || "").trim().toLowerCase()));
  (payload.sightings || []).forEach(s=>{
    const key = (s.text || "").trim().toLowerCase();
    if(!key || sightingKeys.has(key)) return;
    sightingKeys.add(key);
    sightings.push({ ...s, from: s.from || from });
    stats.sightings++;
  });
  Store.set("sightings", sightings);

  // Same name+contributor+info keying as hiddenVenues above, and for
  // the same reason — a second note about the same landmark from the
  // same person must survive as its own entry, not get silently eaten
  // by the first one just because the name matches.
  const customLandmarksList = Store.get("customLandmarks") || [];
  const landmarkKeys = new Set(customLandmarksList.map(l=>`${(l.name || "").trim().toLowerCase()}|${(l.from || "").trim().toLowerCase()}|${(l.info || "").trim().toLowerCase()}`));
  (payload.customLandmarks || []).forEach(l=>{
    const name = (l.name || "").trim().toLowerCase();
    const entryFrom = l.from || from;
    const key = `${name}|${entryFrom.trim().toLowerCase()}|${(l.info || "").trim().toLowerCase()}`;
    if(!name || landmarkKeys.has(key)) return;
    landmarkKeys.add(key);
    customLandmarksList.push({ ...l, from: entryFrom });
    stats.landmarks++;
  });
  Store.set("customLandmarks", customLandmarksList);

  // customPlaces (Map's "Add a place" pins) carry a real stable `id`
  // and `updatedAt`, unlike the content-hash-keyed lists above, so this
  // merges by id with newer-updatedAt-wins instead — new ids are added,
  // and an id already present only gets replaced if the incoming copy
  // is strictly newer. That's what lets a creator's own edit actually
  // reach everyone else on their next sync (last-write-wins), while a
  // friend re-syncing a stale copy of someone else's place can never
  // clobber a fresher version anyone else already has. Deletes are NOT
  // propagated this way (no tombstone record) — same limitation
  // customLandmarks above already has today, just worth calling out
  // since customPlaces has an explicit delete button.
  const placesList = Store.get("customPlaces") || [];
  const placesById = new Map(placesList.map(p=> [p.id, p]));
  (payload.customPlaces || []).forEach(p=>{
    if(!p || !p.id || !(p.name || "").trim()) return;
    const existing = placesById.get(p.id);
    if(!existing){
      const fresh = { ...p, from: p.from || from };
      placesList.push(fresh);
      placesById.set(p.id, fresh);
      stats.places++;
    } else if((p.updatedAt || 0) > (existing.updatedAt || 0)){
      Object.assign(existing, p, { from: p.from || existing.from });
    }
  });
  Store.set("customPlaces", placesList);

  // Official time corrections merge the same key+updatedAt-wins way as
  // customPlaces just above — see allArtists()/applyOfficialTimeCorrection.
  // Re-reconciling saved artists right after means an incoming correction
  // updates this device's own already-saved schedule entries immediately,
  // not just future allArtists() lookups.
  const corrections = Store.get("officialTimeCorrections") || {};
  Object.entries(payload.officialTimeCorrections || {}).forEach(([key, c])=>{
    if(!c) return;
    const existing = corrections[key];
    if(!existing || (c.updatedAt || 0) > (existing.updatedAt || 0)){
      corrections[key] = c;
      stats.corrections++;
    }
  });
  Store.set("officialTimeCorrections", corrections);
  if(typeof reconcileSavedArtists === "function") reconcileSavedArtists();

  // Read-only per-person schedule snapshot — replaces that person's own
  // entry each time they resync (it's a full current snapshot of their
  // Plan, not incremental additions), and never touches this device's
  // own "schedule" key.
  if(Array.isArray(payload.schedule)){
    const people = Store.get("peopleSchedules") || {};
    // Keyed by personId (stable per device), with displayName kept as
    // its own field — so two different people/devices that happen to
    // type the same name never overlap into one tab, and renaming
    // yourself updates this same entry instead of orphaning it.
    people[personId] = { displayName: from, list: payload.schedule.map(a=>({ ...a })) };
    Store.set("peopleSchedules", people);
    stats.schedule = payload.schedule.length;
  }

  // Same read-only per-person snapshot treatment as schedule above —
  // replaces that person's own bingo entry each resync, never touches
  // this device's own bingoCard/bingoMarked/bingoLocked.
  if(payload.bingo && Array.isArray(payload.bingo.card) && payload.bingo.card.length){
    const peopleBingo = Store.get("peopleBingo") || {};
    peopleBingo[personId] = {
      displayName: from,
      card: payload.bingo.card.slice(),
      marked: Array.isArray(payload.bingo.marked) ? payload.bingo.marked.slice() : [],
      locked: !!payload.bingo.locked
    };
    Store.set("peopleBingo", peopleBingo);
    stats.bingo = 1;
  }

  // Same again for the character builder — replaces that person's own
  // entry each resync, never touches this device's own myCharacter.
  if(payload.character && payload.character.name){
    const peopleCharacters = Store.get("peopleCharacters") || {};
    peopleCharacters[personId] = { displayName: from, ...payload.character };
    Store.set("peopleCharacters", peopleCharacters);
    stats.character = 1;
  }

  // Same replace-snapshot treatment for "where am I" status — replaces
  // that person's own entry each resync, never touches this device's
  // own myStatus.
  if(payload.status && payload.status.place){
    const peopleStatus = Store.get("peopleStatus") || {};
    // gps carried through alongside place so the map can plot friends —
    // previously dropped here, which meant mapsLinkHtml() could only ever
    // build a maps deep-link for your OWN entry, never a friend's, and no
    // friend location could ever reach the map itself.
    peopleStatus[personId] = { displayName: from, place: payload.status.place, gps: payload.status.gps || null, updatedAt: payload.status.updatedAt || payload.updatedAt || Date.now() };
    Store.set("peopleStatus", peopleStatus);
  }

  // Same replace-snapshot treatment for group-visible activities — only
  // ever the "group" ones (buildSyncPayload already filters out personal
  // ones before they're sent), replaces that person's own entry each
  // resync, never touches this device's own "activities".
  if(Array.isArray(payload.activities)){
    const peopleActivities = Store.get("peopleActivities") || {};
    peopleActivities[personId] = { displayName: from, list: payload.activities.map(a=>({ ...a })) };
    Store.set("peopleActivities", peopleActivities);
  }

  // Read-only snapshot of who THAT device has joined (not who's joined
  // THEIR activities) — every device's own "I'm in" taps ride along on
  // its own payload the same way, so any device can compute a full
  // attendee list for any activity by scanning every peopleJoins entry.
  if(Array.isArray(payload.joinedActivities)){
    const peopleJoins = Store.get("peopleJoins") || {};
    peopleJoins[personId] = { displayName: from, list: payload.joinedActivities.slice() };
    Store.set("peopleJoins", peopleJoins);
  }

  // Same read-only-snapshot treatment for "want to see together" flags —
  // replaces that person's own entry each resync, never touches this
  // device's own "wantTogether".
  if(Array.isArray(payload.wantTogether)){
    const peopleWantTogether = Store.get("peopleWantTogether") || {};
    peopleWantTogether[personId] = { displayName: from, list: payload.wantTogether.slice() };
    Store.set("peopleWantTogether", peopleWantTogether);
  }

  // The shared meeting point and group invites ride along on every
  // device's own payload (see buildSyncPayload above) rather than a
  // separate document — last-write-wins PER KEY by comparing updatedAt
  // against whatever's already cached locally, same as every other
  // shared single-value field in this app.
  if(payload.meeting && (payload.meeting.updatedAt || 0) > (Store.get("meetingUpdatedAt") || 0)){
    Store.set("meeting", payload.meeting.place || "");
    Store.set("meetingBy", payload.meeting.by || "");
    Store.set("meetingUpdatedAt", payload.meeting.updatedAt);
  }
  if(payload.decisions && typeof payload.decisions === "object"){
    const decisions = Store.get("groupDecisions") || {};
    Object.entries(payload.decisions).forEach(([key, incoming])=>{
      if(!incoming) return;
      const existing = decisions[key];
      if(!existing || (incoming.updatedAt || 0) > (existing.updatedAt || 0)) decisions[key] = incoming;
    });
    Store.set("groupDecisions", decisions);
  }

  // "Online" in a live/real-time sense isn't something a periodic,
  // offline-first pull-based sync can honestly claim without an
  // always-on listener (which runs against the Spark-plan-usage goal
  // elsewhere in this file) — so this tracks "last seen," meaning the
  // timestamp of that person's own last successful push, piggybacked
  // on data already being pulled rather than a separate read.
  if(payload.updatedAt){
    const peopleLastSeen = Store.get("peopleLastSeen") || {};
    peopleLastSeen[personId] = { displayName: from, ts: payload.updatedAt };
    Store.set("peopleLastSeen", peopleLastSeen);
  }

  return { stats, from };
}

// Shared formatting for a person's last-seen timestamp — same relative/
// absolute split as formatLastSynced() above, so the two read
// consistently wherever they appear together.
function formatLastSeen(ts){
  if(!ts) return null;
  const diffMs = Date.now() - ts;
  const mins = Math.round(diffMs / 60000);
  if(mins < 1) return "just now";
  if(mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if(hours < 24) return `${hours}h ago`;
  const d = new Date(ts);
  return d.toLocaleDateString([], { day:"numeric", month:"short" });
}

// ===============================
// WHO'S USING THIS DEVICE — a fixed name picker (with an "Other" escape
// hatch) so every entry gets tagged with a real person, not a typo-prone
// free-text field. currentContributorName() is what every "add" handler
// below calls to stamp new entries. KNOWN_CONTRIBUTORS itself now lives
// all the way up near the top of the file — see the comment there for why.
// ===============================
// Used by statusLineHTML/renderFriendStatusBar (defined further down) —
// declared up here since renderAllFriendStatusUI() runs at load time
// (top-level call further down the file) and can trigger those before
// the FRIEND STATUS section below would otherwise run.
const STATUS_STALE_MS = 30 * 60 * 1000; // 30 min — past this, visibly flagged as stale
// Used by wireGpsToggle/startGpsWatch (defined much further down, in the
// GPS AUTO-LOCATION section) — declared up here for the same TDZ-safety
// reason as STATUS_STALE_MS above: wireGpsToggle("gpsLocationToggle") is
// called at load time (top-level, in the GPS AUTO-LOCATION section) and
// can reach these two before their own section would otherwise run.
const GPS_LOCATION_REFRESH_MS = 5 * 60 * 1000;
let _gpsWatchTimer = null;
const contributorNameInput = document.getElementById("contributorName");
const contributorOtherField = document.getElementById("contributorOtherField");
const contributorOtherInput = document.getElementById("contributorOtherInput");

function currentContributorName(){
  return (Store.get("contributorName") || "").trim();
}

// Anything logged via the various "add" buttons before a name was ever
// picked gets stamped with from:"" at creation time — there's no live
// lookup, it's baked in per-entry. That leaves
// otherwise-real entries permanently unattributed and invisible to any
// "filter by person" view, even after the person picks their name later.
// Since these are always this device's own past entries (nobody else
// could have written to this device's local storage), it's always safe
// to claim any blank one for whoever just picked their name.
function backfillOwnUnnamedEntries(name){
  if(!name) return;
  ["theories", "quotes", "sightings", "customLandmarks", "hiddenVenues", "customPlaces"].forEach(key=>{
    const list = Store.get(key);
    if(!Array.isArray(list) || !list.length) return;
    let changed = false;
    list.forEach(entry=>{
      if(entry && !(entry.from || "").trim()){ entry.from = name; changed = true; }
    });
    if(changed) Store.set(key, list);
  });
  const involved = Store.get("involvedDone");
  if(Array.isArray(involved) && involved.length){
    let changed = false;
    const updated = involved.map(entry=>{
      if(typeof entry === "object" && entry && !(entry.from || "").trim()){ changed = true; return { ...entry, from: name }; }
      return entry;
    });
    if(changed) Store.set("involvedDone", updated);
  }
}

// Single entry point for "this device's own user just (re)picked their
// name" — every local picker (Home's inline one, Discover's) should call
// this rather than writing contributorName to Store directly, so the
// unnamed-entry backfill above always runs alongside it. Not used by
// switchDeviceIdentity()'s device-handoff flow, which sets a name as
// part of adopting someone else's already-attributed synced data, not
// picking a fresh one for this device's own past entries.
function setContributorName(name){
  const trimmed = (name || "").trim();
  const previousName = currentContributorName();
  Store.set("contributorName", trimmed);
  backfillOwnUnnamedEntries(trimmed);

  // Automatic, but narrowly scoped enough that it can't repeat the
  // mistake from #123 (reverted in #124 after it once made a teammate's
  // own tab disappear): this only ever runs when THIS device has zero
  // data of its own AND is having a name typed into it for the very
  // first time — i.e. a genuinely fresh/empty device. The match is an
  // exact string match against the name just typed for THIS device, so
  // it can never reach out and merge/delete some other unrelated
  // person's tab (Dave's, say) — only ones sharing the exact name this
  // device itself just claimed. mergeAllMyDuplicates() (used by the
  // manual "Merge all my duplicate tabs" button too) is additive-only,
  // and now that mergePersonIntoMine also deletes the absorbed
  // duplicate's stale cloud doc (see deleteStaleRoomMember), this is
  // finally actually permanent instead of the duplicate quietly
  // reappearing on the next sync.
  if(!previousName && trimmed){
    const hasOwnData = (Store.get("schedule")||[]).length || (Store.get("bingoCard")||[]).length || Store.get("myCharacter");
    if(!hasOwnData && typeof mergeAllMyDuplicates === "function"){
      const { count, changed } = mergeAllMyDuplicates();
      if(count){
        setTimeout(()=> window.alert(`Found ${count} existing synced tab${count===1?"":"s"} under "${trimmed}" from another device and brought ${count===1?"it":"them"} into this one automatically (${changed} thing${changed===1?"":"s"} added) — nothing here was overwritten.`), 300);
      }
    }
  }

  // Notifications default OFF in every browser until someone actually
  // asks — picking a name is the first real user gesture available (a
  // select's onchange still counts as one), and it's the natural
  // onboarding moment, so ask here rather than leaving it buried behind
  // the 🔔 bell for people to find on their own. Only ever fires once:
  // Notification.permission is "default" only before the very first
  // grant/deny, so this silently no-ops on every later name edit.
  if(trimmed && typeof chatNotificationsSupported === "function" && chatNotificationsSupported() && Notification.permission === "default" && typeof toggleChatNotifications === "function"){
    toggleChatNotifications();
  }

  if(typeof refreshAfterMerge === "function") refreshAfterMerge();
}

// Keeps the Discover Sync card's picker and Home's inline picker (built
// below) showing the same value, whichever one someone actually used —
// both write to the same Store key, this just keeps the two displays
// from going stale relative to each other.
function syncContributorNameDisplays(){
  const name = currentContributorName();
  if(contributorNameInput){
    if(name && KNOWN_CONTRIBUTORS.includes(name)){
      contributorNameInput.value = name;
      if(contributorOtherField) contributorOtherField.style.display = "none";
    } else if(name){
      contributorNameInput.value = "__other__";
      if(contributorOtherField) contributorOtherField.style.display = "";
      if(contributorOtherInput) contributorOtherInput.value = name;
    } else {
      contributorNameInput.value = "";
      if(contributorOtherField) contributorOtherField.style.display = "none";
    }
  }
  if(typeof renderHomeSyncStatus === "function") renderHomeSyncStatus();
  if(typeof updateHeaderLastSynced === "function") updateHeaderLastSynced();
}

if(contributorNameInput){
  const saved = Store.get("contributorName") || "";
  if(saved && KNOWN_CONTRIBUTORS.includes(saved)){
    contributorNameInput.value = saved;
  } else if(saved){
    contributorNameInput.value = "__other__";
    contributorOtherField.style.display = "";
    contributorOtherInput.value = saved;
  }
  contributorNameInput.onchange = ()=>{
    if(contributorNameInput.value === "__other__"){
      contributorOtherField.style.display = "";
      setContributorName(contributorOtherInput.value.trim());
    } else {
      contributorOtherField.style.display = "none";
      setContributorName(contributorNameInput.value);
    }
    syncContributorNameDisplays();
    // Picking a name from the dropdown is the one moment a first-time
    // setup most needs instant feedback — otherwise nothing visibly
    // happens until the next periodic tick or a manual "Sync now" tap,
    // which reads as broken. Skip it for "Other…" itself (no name yet,
    // just the text field appearing) — the oninput handler below covers
    // that once something's actually typed.
    if(contributorNameInput.value !== "__other__" && typeof autoSyncNow === "function"){
      autoSyncNow("name picked");
      // chatContactNames()/presence never special-case KNOWN_CONTRIBUTORS —
      // they only look at names actually seen syncing — so a fixed-roster
      // pick needs this exactly like a typed "Other…" name does below.
      // Fires the heartbeat right away instead of waiting for the next
      // CHAT_HEARTBEAT_MS tick (up to 90s away), so whoever just picked
      // their name shows up as an online chat contact immediately.
      if(typeof sendChatHeartbeat === "function") sendChatHeartbeat();
    }
  };
  contributorOtherInput.oninput = ()=>{
    if(contributorNameInput.value === "__other__") setContributorName(contributorOtherInput.value.trim());
    syncContributorNameDisplays();
  };
  contributorOtherInput.onblur = ()=>{
    // Debounced to blur, not oninput above — same reason autoSyncNow is:
    // firing a Firestore write on every keystroke while someone's still
    // typing their name would be wasteful, this only fires once they're
    // actually done.
    if(contributorNameInput.value === "__other__" && contributorOtherInput.value.trim() && typeof autoSyncNow === "function"){
      autoSyncNow("name picked");
      if(typeof sendChatHeartbeat === "function") sendChatHeartbeat();
    }
  };
}

// A prominent, always-visible Home callout so it's obvious at a glance
// whether sync is actually going to work — "your name isn't set" is
// the single most common reason someone's inputs silently never leave
// their device, so this is deliberately hard to miss rather than
// buried only in the Sync card itself. Also fully editable right here,
// not just a status readout — Discover's Sync card keeps its own copy
// of the same picker too, for anyone who lands there first instead.
//
// renderHomeSyncStatus() does a full rebuild — safe for init and for
// changes that originate elsewhere (Discover's picker). It must NOT be
// called while someone is actively typing in Home's own "other name"
// field, though — that would destroy/recreate the input mid-keystroke
// and drop focus. updateHomeSyncStatusText() is the lightweight
// alternative for that case: it only touches the status text, never
// the picker's own DOM.
function updateHomeSyncStatusText(){
  const box = document.getElementById("homeSyncStatus");
  if(!box) return;
  const tag = box.querySelector(".tag");
  const heading = box.querySelector("h3");
  const para = box.querySelector("p");
  const name = currentContributorName();
  if(tag){
    tag.textContent = name ? "Syncing" : "Set this up once";
    tag.style.cssText = name ? "" : "background:rgba(242,168,60,.16); color:var(--accent-amber); border-color:rgba(242,168,60,.4);";
  }
  if(heading) heading.textContent = name ? `✅ Syncing as ${name}` : "⚠️ Pick your name to start syncing";
  if(para) para.innerHTML = name
    ? `Syncs automatically on open, every few minutes, and whenever you pull down from the top ↓ to refresh. <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpSync','settingsscreen')">Sync</a> also has a manual button, any time.`
    : `Pick who you are to start syncing — one-time, done for good on this device. Same picker as <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpSync','settingsscreen')">Sync</a> in Settings.`;
}

function wireHomeSyncStatusPicker(){
  const sel = document.getElementById("homeContributorName");
  const otherField = document.getElementById("homeContributorOtherField");
  const otherInput = document.getElementById("homeContributorOtherInput");
  if(!sel) return;
  sel.onchange = ()=>{
    if(sel.value === "__other__"){
      // Just opened "Other" with nothing typed yet — show the field
      // and mirror the open state to Discover's picker, but don't
      // clobber the saved name with an empty string until there's
      // actually something to save.
      otherField.style.display = "";
      if(otherInput.value.trim()) setContributorName(otherInput.value.trim());
      if(contributorNameInput){ contributorNameInput.value = "__other__"; }
      if(contributorOtherField){ contributorOtherField.style.display = ""; }
      updateHomeSyncStatusText();
    } else {
      otherField.style.display = "none";
      setContributorName(sel.value);
      syncContributorNameDisplays();
    }
  };
  otherInput.oninput = ()=>{
    setContributorName(otherInput.value.trim());
    if(contributorOtherInput){ contributorOtherInput.value = otherInput.value; }
    if(contributorNameInput){ contributorNameInput.value = "__other__"; }
    if(contributorOtherField){ contributorOtherField.style.display = ""; }
    updateHomeSyncStatusText();
  };
}

// Slim, top-of-Home version — the full location/friend-status/device-
// handoff controls this used to also render now live only in Discover's
// jumpFriendStatus/jumpSync/jumpDeviceHandoff cards (linked below), so
// this box doesn't duplicate them; it keeps only the one thing that
// needs to be immediate: picking your name so sync actually starts.
function renderHomeSyncStatus(){
  const box = document.getElementById("homeSyncStatus");
  if(!box) return;
  const name = currentContributorName();
  const isOther = name && !KNOWN_CONTRIBUTORS.includes(name);
  box.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
      <h3 style="margin:0; font-size:14px;">${name ? `✅ Syncing as ${escapeHtml(name)}` : "⚠️ Pick your name to sync"}</h3>
    </div>
    <p style="margin-top:4px; font-size:12.5px;">${name
      ? `Last synced: <strong>${formatLastSynced()}</strong> · <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpSync','settingsscreen')">manual sync &amp; more</a>`
      : `One-time pick, found &amp; restored automatically if it's synced before. <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpSync','settingsscreen')">More in Settings</a>`}</p>
    <div style="display:flex; gap:8px; align-items:flex-end; flex-wrap:wrap; margin-top:8px;">
      <div class="field" style="margin:0; flex:1; min-width:140px;">
        <select id="homeContributorName">
          <option value="">Select a name…</option>
          <option value="Emma">Emma</option>
          <option value="Dave">Dave</option>
          <option value="Rob">Rob</option>
          <option value="Jack">Jack</option>
          <option value="Lewis">Lewis</option>
          <option value="Dana">Dana</option>
          <option value="Rhea">Rhea</option>
          <option value="Katelyn">Katelyn</option>
          <option value="__other__">Other…</option>
        </select>
      </div>
      <button class="action" id="homeSyncNowBtn" style="flex-shrink:0;">☁️ Sync now</button>
    </div>
    <div class="field" id="homeContributorOtherField" style="display:${isOther ? "" : "none"}; margin-top:8px;"><label>Your name</label><input type="text" id="homeContributorOtherInput" placeholder="Type your name"></div>
    <p class="empty-note" id="homeSyncNowNote" style="margin-top:6px;"></p>
    <p style="margin-top:8px; font-size:12px; color:var(--text-muted);">📍 Friends' status &amp; using someone else's phone — all in <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpFriendStatus','settingsscreen')">Settings</a>.</p>
  `;
  const sel = document.getElementById("homeContributorName");
  const otherInput = document.getElementById("homeContributorOtherInput");
  if(name && KNOWN_CONTRIBUTORS.includes(name)) sel.value = name;
  else if(isOther){ sel.value = "__other__"; otherInput.value = name; }
  wireHomeSyncStatusPicker();
  const syncNowBtn = document.getElementById("homeSyncNowBtn");
  if(syncNowBtn) syncNowBtn.onclick = ()=> runManualSync(syncNowBtn, document.getElementById("homeSyncNowNote"));
}
renderHomeSyncStatus();
if(typeof updateHeaderLastSynced === "function") updateHeaderLastSynced();

// Location prompt directly under the name/sync card — a real inline
// picker (same select/GPS toggle as Settings' full "Location & GPS"
// card, via the same wireStatusControl/wireGpsToggle helpers below, just
// re-wired fresh on every render since the box is fully rebuilt each
// time) so setting or checking your status doesn't need a trip to
// Settings at all. Kept re-render-safe (called from
// renderAllFriendStatusUI, same refresh point as the friend status
// list/bar) so it never goes stale.
function renderHomeLocationStatus(){
  const box = document.getElementById("homeLocationStatus");
  if(!box) return;
  const name = currentContributorName();
  const myStatus = Store.get("myStatus");
  const gpsOn = !!Store.get("gpsLocationEnabled");
  const stale = !!(myStatus && myStatus.updatedAt && (Date.now() - myStatus.updatedAt) > STATUS_STALE_MS);
  const headline = !name
    ? `📍 Location &amp; GPS`
    : myStatus && myStatus.place
      ? `📍 You're at <span style="color:var(--accent-teal);">${escapeHtml(myStatus.place)}</span>${gpsOn ? ` <span style="font-size:11px; color:var(--text-muted);">(GPS)</span>` : ""}${stale ? ` <span class="status-stale-tag">stale</span>` : ""}`
      : `📍 Location not set`;
  box.innerHTML = `
    <h3 style="margin:0; font-size:14px;">${headline}</h3>
    ${!name ? `<p class="empty-note" style="margin-top:4px;">Pick your name above first, then set where you are.</p>` : ""}
    <div style="display:flex; gap:8px; align-items:flex-end; flex-wrap:wrap; margin-top:8px;">
      <div class="field" style="margin:0; flex:1; min-width:140px;">
        <label>Where are you?</label>
        <select id="homeStatusLocationSelect"></select>
      </div>
      <button class="action" id="homeStatusCustomBtn" style="flex-shrink:0;">Set</button>
    </div>
    <div class="field" id="homeStatusOtherField" style="display:none; margin-top:8px;"><label>Where, exactly?</label><input type="text" id="homeStatusCustomInput" placeholder="Type where you are"></div>
    <label class="gps-toggle-row" style="margin-top:8px; display:block;"><input type="checkbox" id="homeGpsLocationToggle"> Auto-update from GPS every few minutes</label>
    <p class="empty-note" id="homeStatusFeedbackNote" style="margin-top:6px;"></p>
    <p class="empty-note" style="margin-top:8px; font-size:11.5px;">Friends' status &amp; more location settings in <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpFriendStatus','settingsscreen')">Settings</a>.</p>
  `;
  wireStatusControl("homeStatusLocationSelect", "homeStatusOtherField", "homeStatusCustomInput", "homeStatusCustomBtn", "homeStatusFeedbackNote");
  wireGpsToggle("homeGpsLocationToggle");
}
renderHomeLocationStatus();

// The "how data/sync/updates work" explainer only needs a full read
// once — collapses to a one-liner after the first Home visit rather
// than reappearing in full on every single open. Still one tap away.
function renderHomeInfoCard(){
  const box = document.getElementById("homeInfoCard");
  if(!box) return;
  const seen = Store.get("seenHomeInfoCard");
  if(!seen){
    box.innerHTML = `
      <span class="tag">Read this once</span>
      <h3>💾 Your data, sync &amp; updates</h3>
      <p>Everything you add saves itself to this device the instant you type or tap — no save button. It also backs up to the cloud within seconds of any change to your saved artists, bingo card or character, not just on a periodic sync — so even if this device's local copy is ever lost, the cloud almost always has the latest version.</p>
      <p>Once you've picked your name in <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpSync','settingsscreen')">Sync</a>, this phone syncs itself automatically every time you open the app with signal, every few minutes while it's open, and whenever it comes back to the foreground — no button needed. A "Sync now" button is there too for an instant one mid-session.</p>
      <p>Shared things — theories, hidden-venue finds, quotebook entries, live sightings, district notes, get-involved ticks, found socials, landmarks — combine into one pool everyone sees (Discover's "All notes"). Your Plan, bingo card and character stay yours — sync never merges anyone else's into them — but everyone else's land in their own named tab right next to yours, on the Plan, Bingo and My Character screens, so you can see what your friends have without it touching your own.</p>
      <p><strong>Using more than one phone/browser as the same person?</strong> Each one gets tracked separately behind the scenes, so a fresh device (reinstalled, cleared, or just a different browser) can look "empty" at first. Picking your name on it now checks for your existing synced data automatically and pulls it straight in — and if a duplicate ever shows up anyway, <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpSync','settingsscreen')">Sync</a> has a "Merge all my duplicate tabs" button that fixes it permanently, any time. Nothing gets removed or overwritten by any of this — it only ever adds.</p>
      <p>If a sync ever looks wrong — something missing, or a device you didn't expect — <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpBackupHistory','settingsscreen')">Backup history</a> in Settings keeps snapshots of your own data (automatic every 20 min, or tap "Back up now" for a permanent one before doing anything risky) that you can step back to.</p>
      <p>Want just your own stuff backed up locally too? Grab your personal copy from <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpSettings','settingsscreen')">Settings</a>. Want a combined file to hand round once everyone's synced in? Same place — the shareable group copy leaves out everyone's personal bingo card, character and notes, so it's safe to actually share.</p>
      <p>The app itself updates quietly in the background whenever you're online, and keeps working fully offline once it's loaded once — updates never touch anything you've saved.</p>
      <button class="ghost" id="collapseHomeInfoBtn" style="margin-top:10px;">Got it, don't show this in full again</button>
    `;
    const collapseBtn = document.getElementById("collapseHomeInfoBtn");
    if(collapseBtn) collapseBtn.onclick = ()=>{ Store.set("seenHomeInfoCard", true); renderHomeInfoCard(); };
  } else {
    box.innerHTML = `
      <h3 style="margin-bottom:0;">💾 Your data, sync &amp; updates</h3>
      <p style="margin-top:6px;">Saves itself automatically, backs up to the cloud within seconds, syncs itself once you've picked a name — <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpSync','settingsscreen')">Sync</a> · <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpBackupHistory','settingsscreen')">Backup history</a> · <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpSettings','settingsscreen')">Settings</a> · <a class="inline-link" href="javascript:void(0)" id="expandHomeInfoLink">full explanation</a></p>
    `;
    const expandLink = document.getElementById("expandHomeInfoLink");
    if(expandLink) expandLink.onclick = ()=>{ Store.set("seenHomeInfoCard", false); renderHomeInfoCard(); };
  }
}
renderHomeInfoCard();

// "Add to Home Screen" card: hides itself once it's actually done — the
// most reliable signal is the app running in standalone/installed mode
// at all (display-mode: standalone covers Android/desktop PWA installs;
// navigator.standalone is the older iOS-Safari-specific equivalent) —
// plus a manual dismiss for anyone who installed it but hasn't yet
// relaunched from the Home Screen icon this session.
(function setupAddToHomeCard(){
  const card = document.getElementById("addToHomeCard");
  if(!card) return;
  const isStandalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  if(isStandalone || Store.get("dismissedAddToHome")){
    card.style.display = "none";
    return;
  }
  const dismissBtn = document.getElementById("dismissAddToHomeBtn");
  if(dismissBtn) dismissBtn.onclick = ()=>{
    Store.set("dismissedAddToHome", true);
    card.style.display = "none";
  };
})();

const copySyncCodeBtn = document.getElementById("copySyncCodeBtn");
if(copySyncCodeBtn) copySyncCodeBtn.onclick = (e)=>{
  if(!currentContributorName()){ window.alert("Pick who you are above first, so your teammates know whose update this is."); return; }
  copyText(encodeSyncCode(buildSyncPayload()), e.target);
};

const mergeSyncCodeBtn = document.getElementById("mergeSyncCodeBtn");
if(mergeSyncCodeBtn) mergeSyncCodeBtn.onclick = ()=>{
  const input = document.getElementById("syncCodeInput");
  const note = document.getElementById("syncStatusNote");
  const raw = input.value.trim();
  if(!raw){ note.textContent = "Paste a teammate's sync code first."; return; }
  try{
    const payload = decodeSyncCode(raw);
    const { stats, from } = mergeSyncPayload(payload);
    input.value = "";
    note.textContent = `Merged ${from}'s update: +${stats.clues} district notes, +${stats.characterNotes} character notes, +${stats.theories} theories, +${stats.venues} hidden venues, +${stats.districts} districts visited, +${stats.involved} get-involved ticks, +${stats.socials} socials, +${stats.quotes} journal quotes, +${stats.sightings} live sightings, +${stats.landmarks} landmarks, +${stats.places} map places, +${stats.corrections} official time corrections. ${stats.schedule ? `${from}'s ${stats.schedule} saved artists are now viewable in their own tab on the Plan screen (not merged into your list). ` : ""}${stats.bingo ? `${from}'s bingo card is now viewable in its own tab on the Bingo screen. ` : ""}${stats.character ? `${from}'s character is now viewable in its own tab on the My Character card. ` : ""}Nothing already saved was duplicated.`;
    recordLastSynced();
    refreshAfterMerge();
  }catch(err){
    note.textContent = "Couldn't read that code — make sure you copied the whole thing, with nothing missing from either end.";
  }
};

// ===============================
// CLOUD SYNC — optional, no-login auto-sync layered on top of the manual
// code flow above. A "room code" is just a shared password your group
// picks; each device pushes its own sync payload to
// rooms/{roomCode}/members/{yourName} and pulls everyone else's, running
// every pull through the exact same mergeSyncPayload() the manual code
// box uses, so the no-duplicates/no-silent-overwrite guarantees are
// identical either way. Fails quietly back to the manual flow if there's
// no signal or the Firebase scripts didn't load (e.g. fully offline).
// (FIREBASE_CONFIG/_firestoreDb/getFirestoreDb live at the very top of
// this file, not here — see the CLOUD SYNC block near the top. Kept
// there so nothing that runs at load time can reach getFirestoreDb()
// before it's initialized.)
// ===============================

// This group's shared room code is fixed — not something anyone types
// in or can accidentally clear. No editable field for it any more (an
// earlier version had one, and an empty blur/change event on it could
// silently wipe the room code, quietly breaking sync for that device).
// Forced on every load regardless of whatever's already in storage.
const GROUP_ROOM_CODE = "medway-massive";
Store.set("roomCode", GROUP_ROOM_CODE);

// Trimmed, lowercased, with slashes/whitespace collapsed to a single
// hyphen — a Firestore document ID, and needs to compare equal for
// "Medway Massive" / "medway-massive " / "medway/massive" alike, or
// stray formatting silently splits a group across two different rooms.
function normalizeRoomCode(raw){
  return (raw || "").trim().toLowerCase().replace(/[\/\s]+/g, "-");
}

function currentRoomCode(){
  return normalizeRoomCode(Store.get("roomCode"));
}


// A stable per-device identity, generated once and never re-derived from
// anything the user can retype (name, room code) — the whole point is
// that renaming yourself or switching rooms can't accidentally collide
// with, overwrite, or orphan someone else's (or your own past) synced
// data. Never included in the shareable group snapshot (see
// PERSONAL_ONLY_KEYS) — it's identity infrastructure, not content.
function ensureDeviceId(){
  let id = Store.get("deviceId");
  if(!id){
    id = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : "dev-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
    Store.set("deviceId", id);
  }
  return id;
}

// Changing rooms (or clearing the code to leave one) must clean up the
// membership doc left behind in the room you're moving away from —
// otherwise your last-synced data sits there frozen forever, still
// visible to anyone left in that room. Best-effort: offline or a
// permissions hiccup just leaves the old doc for next time, never blocks
// the actual room switch.
function cleanupOldRoomMembership(oldRoomId){
  const db = getFirestoreDb();
  if(!db || !oldRoomId) return Promise.resolve(false);
  const deviceId = ensureDeviceId();
  return db.collection("rooms").doc(oldRoomId).collection("members").doc(deviceId).delete().then(()=>true).catch(()=>false);
}

function setRoomCode(raw){
  const next = normalizeRoomCode(raw);
  const previous = currentRoomCode();
  const lastPushed = Store.get("lastPushedRoomId") || "";
  Store.set("roomCode", next);
  if(lastPushed && lastPushed !== next){
    // If this fails (offline, most likely), lastPushedRoomId deliberately
    // stays pointing at the uncleaned room rather than being cleared —
    // so the next room change (or a future retry) still knows there's a
    // leftover membership doc it owes a cleanup to, instead of losing
    // track of it the moment this one attempt didn't land.
    cleanupOldRoomMembership(lastPushed).then(ok=>{
      if(ok && Store.get("lastPushedRoomId") === lastPushed) Store.set("lastPushedRoomId", "");
    });
  }
  if(next && next !== previous && typeof autoSyncNow === "function") autoSyncNow("room changed");
}

// Separate from the header's app-version pill on purpose — that tracks
// when the APP ITSELF last shipped new code, this tracks when THIS
// DEVICE last successfully exchanged data with the group. Different
// things, easy to conflate, worth keeping visibly distinct.
function formatLastSynced(){
  const ts = Store.get("lastSyncedAt");
  if(!ts) return "Not synced yet";
  const d = new Date(ts);
  const now = new Date();
  const time = d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  return d.toDateString() === now.toDateString() ? `Today, ${time}` : `${d.toLocaleDateString([], { day:"numeric", month:"short" })}, ${time}`;
}

function updateHeaderLastSynced(){
  const el = document.getElementById("headerLastSynced");
  if(!el) return;
  const name = currentContributorName();
  if(!name){ el.textContent = ""; el.title = ""; return; }
  const ts = Store.get("lastSyncedAt");
  el.textContent = ts ? new Date(ts).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : "—";
  el.title = `Last synced: ${formatLastSynced()}`;
}

function recordLastSynced(){
  Store.set("lastSyncedAt", Date.now());
  if(typeof renderHomeSyncStatus === "function") renderHomeSyncStatus();
  updateHeaderLastSynced();
}

// Same refresh list a manual "Merge it in" and a cloud sync both need,
// shared so either path leaves the UI equally up to date.
function refreshAfterMerge(){
  loadDiscoveries();
  loadGetInvolved();
  loadTheories();
  renderVenueTable();
  loadCustomSocials();
  updateStats();
  if(typeof loadQuotes === "function") loadQuotes();
  if(typeof loadSightings === "function") loadSightings();
  if(typeof loadCustomLandmarksList === "function") loadCustomLandmarksList();
  if(typeof loadMap === "function") loadMap();
  if(typeof renderConsolidatedNotes === "function") renderConsolidatedNotes();
  if(typeof renderPlanOwnerSelector === "function") renderPlanOwnerSelector();
  if(typeof renderCompareFilterChips === "function") renderCompareFilterChips();
  if(typeof renderPlanCompare === "function" && planView === "compare") renderPlanCompare();
  if(typeof renderPlanTimeline === "function" && planView === "timeline") renderPlanTimeline();
  if(typeof renderBingoPersonTabs === "function"){ renderBingoPersonTabs(); renderBingo(); }
  if(typeof renderMyCharacterPersonTabs === "function"){ renderMyCharacterPersonTabs(); renderMyCharacter(); }
  if(typeof renderHomeContextBanner === "function") renderHomeContextBanner();
  if(typeof renderAllFriendStatusUI === "function") renderAllFriendStatusUI();
  if(typeof renderGroupInvites === "function") renderGroupInvites();
  if(typeof renderDiscoverForYou === "function") renderDiscoverForYou();
  if(typeof renderRecentActivity === "function") renderRecentActivity("recentActivityList");
}

// ===============================
// FRIEND STATUS — a lightweight, manually-set "where am I" per person,
// not continuous location tracking. Rides along on the same per-member
// sync doc as schedule/bingo/character (see buildSyncPayload/
// mergeSyncPayload's payload.status / peopleStatus above) — no separate
// write path or extra Firestore reads needed.
// ===============================
// gps is optional {lat, lon} — only ever set by the GPS auto-location
// path (refreshGpsLocationOnce). Always builds a fresh object rather
// than merging onto the previous one, so switching back to a manual
// location naturally drops any stale GPS coordinates from the old
// position instead of leaving a misleading "Open in Maps" link pointing
// at where GPS last saw you.
function setMyStatus(place, gps){
  const trimmed = (place || "").trim();
  if(!trimmed) return;
  Store.set("myStatus", { place: trimmed, updatedAt: Date.now(), ...(gps ? { gps } : {}) });
  renderAllFriendStatusUI();
}

// Own status plus everyone else's cached-from-sync status, newest first.
// One entry per PERSON (by name), not per device — the same duplicate-
// identity situation that shows up as two Plan person-tabs (see
// mergePersonIntoMine) shows up here too if someone's synced status
// under more than one deviceId, and a status list showing two different
// locations for the same person, one stale, is actively misleading
// rather than just cosmetic clutter like a duplicate Plan tab. Keeps
// only the most recently updated entry per name.
function friendStatusEntries(){
  const peopleStatus = Store.get("peopleStatus") || {};
  const peopleLastSeen = Store.get("peopleLastSeen") || {};
  const myDeviceId = (typeof ensureDeviceId === "function") ? ensureDeviceId() : null;
  const entries = Object.entries(peopleStatus)
    .filter(([id])=> id !== myDeviceId)
    // lastSyncedTs is separate from updatedAt (when they last SET their
    // location) — a device can sync more recently than it last changed
    // its status, so these two times can genuinely differ.
    .map(([id, s])=> ({ id, displayName: personDisplayName(s, id), place: s.place, updatedAt: s.updatedAt, lastSyncedTs: personLastSeenTs(peopleLastSeen[id]), gps: s.gps || null }));
  const myStatus = Store.get("myStatus");
  if(myStatus && myStatus.place && myDeviceId){
    entries.push({ id: myDeviceId, displayName: currentContributorName() || "You", place: myStatus.place, updatedAt: myStatus.updatedAt, lastSyncedTs: Store.get("lastSyncedAt"), gps: myStatus.gps || null, isMe: true });
  }
  const byName = new Map();
  entries.forEach(e=>{
    const key = (e.displayName || "").trim().toLowerCase();
    const existing = byName.get(key);
    if(!existing || (e.updatedAt||0) > (existing.updatedAt||0)) byName.set(key, e);
  });
  return [...byName.values()].sort((a,b)=> (b.updatedAt||0) - (a.updatedAt||0));
}

function statusLineHTML(entry){
  const stale = entry.updatedAt && (Date.now() - entry.updatedAt) > STATUS_STALE_MS;
  const label = entry.isMe ? `${escapeHtml(entry.displayName)} (you)` : escapeHtml(entry.displayName);
  const syncedLine = entry.lastSyncedTs ? `<br><span style="font-size:11px; color:var(--text-muted);">Last online ${formatLastSeen(entry.lastSyncedTs)}</span>` : "";
  // Only other people's statuses get a remove button — clearing your own
  // is done by just setting a new one. Mainly here for ghost/stale
  // entries left over from before sync worked properly.
  const removeBtn = entry.isMe ? "" : ` <button type="button" class="status-remove-btn" onclick="removeFriendStatus('${entry.id}')" title="Remove this status" aria-label="Remove ${escapeHtml(entry.displayName)}'s status" style="border:none; background:none; color:var(--text-muted); cursor:pointer; font-size:13px; padding:0 4px;">✕</button>`;
  const mapsLink = entry.gps ? mapsLinkHtml(entry.gps.lat, entry.gps.lon) : "";
  return `<div class="status-line${stale ? " status-stale" : ""}">${personDotHtml(entry.displayName)} <strong>${label}</strong> — ${escapeHtml(entry.place)} · Location set ${entry.updatedAt ? formatLastSeen(entry.updatedAt) : "a while ago"}${stale ? ` <span class="status-stale-tag">stale</span>` : ""}${removeBtn}${syncedLine}${mapsLink}</div>`;
}

// Clears a stale/ghost friend status — local cache first (so the UI
// updates immediately) and then best-effort clears ONLY the status
// field on that person's member doc in the shared room, so a future
// sync pull doesn't just bring the same stale entry straight back.
// Must never delete the whole doc — it also holds that device's
// schedule, bingo card, character and notes, none of which this button
// has anything to do with. (This used to call .delete() on the whole
// document, which wiped all of it — fixed after it took someone's
// synced picks out with it.)
function removeFriendStatus(id){
  if(!id) return;
  const peopleStatus = Store.get("peopleStatus") || {};
  delete peopleStatus[id];
  Store.set("peopleStatus", peopleStatus);
  const peopleLastSeen = Store.get("peopleLastSeen") || {};
  delete peopleLastSeen[id];
  Store.set("peopleLastSeen", peopleLastSeen);
  renderAllFriendStatusUI();
  if(typeof renderHomeContextBanner === "function") renderHomeContextBanner();
  const db = (typeof getFirestoreDb === "function") ? getFirestoreDb() : null;
  const roomId = (typeof currentRoomCode === "function") ? currentRoomCode() : "";
  if(db && roomId && typeof firebase !== "undefined" && firebase.firestore && firebase.firestore.FieldValue){
    db.collection("rooms").doc(roomId).collection("members").doc(id)
      .update({ status: firebase.firestore.FieldValue.delete() })
      .catch(()=>{}); // no-op if the doc doesn't exist or is unreachable — never worth surfacing an error for a best-effort cleanup
  }
}

function renderFriendStatusList(containerId){
  const box = document.getElementById(containerId);
  if(!box) return;
  const entries = friendStatusEntries();
  box.innerHTML = entries.length ? entries.map(statusLineHTML).join("") : `<p class="empty-note">No one's set a status yet.</p>`;
}

// The persistent top banner — visible on every tab, not just Discover/
// Home — so "where's everyone" doesn't need a trip anywhere. Only shows
// teammates, not your own status, and hides entirely if nobody's set one.
function renderFriendStatusBar(){
  const bar = document.getElementById("friendStatusBar");
  if(!bar) return;
  const entries = friendStatusEntries().filter(e=> !e.isMe);
  if(!entries.length){ bar.innerHTML = ""; bar.style.display = "none"; return; }
  bar.style.display = "";
  bar.innerHTML = entries.map(e=>{
    const stale = e.updatedAt && (Date.now() - e.updatedAt) > STATUS_STALE_MS;
    return `<span class="status-chip${stale ? " status-stale" : ""}">${personDotHtml(e.displayName)} ${escapeHtml(e.displayName)} · ${escapeHtml(e.place)}</span>`;
  }).join("");
}

function renderAllFriendStatusUI(){
  renderFriendStatusList("friendStatusList");
  renderFriendStatusList("homeFriendStatusList");
  renderFriendStatusBar();
  if(typeof renderHomeLocationStatus === "function") renderHomeLocationStatus();
}

// Shared by Discover's status card and Home's own copy of it — Home
// rebuilds its whole card on every renderHomeSyncStatus() call, so this
// gets (re)wired fresh each time rather than once at load, same pattern
// as wireDeviceHandoffControl above. A dropdown of known locations, not
// free text, so status entries can't drift into misspellings/near-dupes
// of the same place — "Other…" still opens a text field for anywhere
// not in the list (e.g. a meetup spot), same picker pattern as the
// contributor-name "Other…" select elsewhere in this file.
// The full location directory (districts, main + minor stages, hidden
// venues/things-to-find), grouped — same source data the Map's
// directory already uses, not a second hand-typed list to keep in sync.
function statusLocationOptionsHTML(){
  const optgroup = (label, names)=> names.length
    ? `<optgroup label="${escapeHtml(label)}">${names.map(n=> `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("")}</optgroup>`
    : "";
  const districts = locations.filter(l=> l.kind === "district").map(l=> l.name);
  const mainStages = locations.filter(l=> l.kind === "stage").map(l=> l.name);
  const otherStageNames = otherStages.map(s=> s.name);
  const hiddenNames = thingsToFind.map(t=> t.name);
  return `
    <option value="">Select a location…</option>
    <option value="Camp">Camp</option>
    ${optgroup("Districts", districts)}
    ${optgroup("Main stages", mainStages)}
    ${optgroup("Other stages", otherStageNames)}
    ${optgroup("Hidden venues / finds", hiddenNames)}
    <option value="__other__">Other…</option>
  `;
}

function wireStatusControl(selectId, otherFieldId, otherInputId, btnId, noteId){
  const sel = document.getElementById(selectId);
  const otherField = document.getElementById(otherFieldId);
  const otherInput = document.getElementById(otherInputId);
  const btn = document.getElementById(btnId);
  if(!sel || !btn) return;
  if(sel.options.length <= 1) sel.innerHTML = statusLocationOptionsHTML();
  const setNote = (text)=>{ if(!noteId) return; const el = document.getElementById(noteId); if(el) el.textContent = text; };
  sel.onchange = ()=>{
    if(otherField) otherField.style.display = sel.value === "__other__" ? "" : "none";
  };
  btn.onclick = async ()=>{
    let place = sel.value;
    if(place === "__other__") place = (otherInput && otherInput.value.trim()) || "";
    if(!place){ setNote("Pick a location above first."); return; }
    setMyStatus(place);
    sel.value = "";
    if(otherField) otherField.style.display = "none";
    if(otherInput) otherInput.value = "";
    // Actually sync it out (push + pull), not just save it locally and
    // hope the next background auto-sync picks it up — same full cycle
    // as the "Sync now" button, with feedback right here so it's clear
    // whether it actually reached the group or not.
    const noteEl = noteId ? document.getElementById(noteId) : null;
    if(typeof runManualSync === "function") await runManualSync(btn, noteEl);
  };
}
wireStatusControl("statusLocationSelect", "statusOtherField", "statusCustomInput", "statusCustomBtn", "statusFeedbackNote");
renderAllFriendStatusUI();
setInterval(renderAllFriendStatusUI, 60000);

// ===============================
// GPS AUTO-LOCATION — opt-in only (default off), sitting entirely on top
// of the manual status feature above rather than as a separate system:
// turning it on just calls setMyStatus() with a coordinate string instead
// of a picked location, on a timer, then syncs it out the same way a
// manual update does. No new Firestore fields, no new permissions model
// beyond the one-time browser geolocation prompt. GPS_LOCATION_REFRESH_MS
// and _gpsWatchTimer are declared up near STATUS_STALE_MS instead of here
// — see that comment for why.
// ===============================

// Boomtown's confirmed real-world 2026 site — Matterley Estate, near
// Winchester, Hampshire (SO21 1HW) — researched directly rather than
// assumed. This is a SINGLE reference point, not a per-stage one: no
// public GPS-accurate district/stage map exists for Boomtown (checked)
// — only an official qualitative layout (Downtown in the valley bowl,
// Hilltop above it, Lions Den/Temple Valley beyond that) with no
// compass bearing given anywhere. Claiming a specific "nearest stage"
// from that would be fabricating precision the source data doesn't
// have, so GPS location only ever surfaces a distance-from-site
// estimate, clearly labelled as one.
const FESTIVAL_SITE_COORDS = { lat: 51.0514, lon: -1.2456 };

function haversineDistanceKm(lat1, lon1, lat2, lon2){
  const R = 6371;
  const toRad = d=> d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// The site itself (valley + hilltop + Temple Valley) spans roughly this
// radius end to end per the official accessibility page's walking
// distances (Meadow campsite to Temple Valley ~3-3.6km one-way) — so
// "within ~2km of the reference point" reads as "somewhere on site"
// rather than claiming a specific district, which the data can't back.
function siteProximityLabel(lat, lon){
  const km = haversineDistanceKm(lat, lon, FESTIVAL_SITE_COORDS.lat, FESTIVAL_SITE_COORDS.lon);
  if(km < 2) return "on site (estimate)";
  if(km < 20) return `~${km.toFixed(1)}km from the festival site (estimate)`;
  return `~${Math.round(km)}km from the festival site (estimate)`;
}

function formatGpsPlace(coords){
  return `GPS ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)} · ${siteProximityLabel(coords.latitude, coords.longitude)}`;
}

// Cross-platform "open in the device's default maps app" link — Apple
// Maps' own web link (maps.apple.com) is what iOS treats as its native
// maps handoff; everything else (Android, desktop) gets Google Maps'
// universal search link, which opens the Google Maps app if installed
// or falls back to the browser. No dependency, just picking the right
// URL scheme per platform.
function mapsLinkUrl(lat, lon){
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent || "");
  return isIOS
    ? `https://maps.apple.com/?ll=${lat},${lon}`
    : `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}
function mapsLinkHtml(lat, lon){
  if(typeof lat !== "number" || typeof lon !== "number") return "";
  return `<a class="linkbtn" href="${mapsLinkUrl(lat, lon)}" target="_blank" rel="noopener" style="margin-left:6px;">📍 Open in Maps</a>`;
}

// Keeps both GPS toggle checkboxes (Discover's static one, Home's
// re-rendered-every-time one) showing the same on/off state, whichever
// one someone actually used or however a background failure changed it.
function syncGpsToggleCheckboxes(checked){
  ["gpsLocationToggle", "homeGpsLocationToggle"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.checked = checked;
  });
}

function refreshGpsLocationOnce(){
  if(!("geolocation" in navigator) || !currentContributorName()) return;
  navigator.geolocation.getCurrentPosition(
    (pos)=>{
      setMyStatus(formatGpsPlace(pos.coords), { lat: pos.coords.latitude, lon: pos.coords.longitude });
      if(typeof pushToCloud === "function") pushToCloud().catch(()=>{});
    },
    (err)=>{
      console.warn("GPS location failed:", err && err.code, err && err.message);
      const note = document.getElementById("statusFeedbackNote") || document.getElementById("homeStatusFeedbackNote");
      // code 1 = PERMISSION_DENIED — the browser remembers a "no" and
      // won't show its own prompt again on this site until the person
      // changes it themselves in browser/device settings, so retrying
      // silently in the background is pointless: turn the feature off
      // and say plainly what to do next. Anything else (2 =
      // POSITION_UNAVAILABLE, 3 = TIMEOUT) is transient — a GPS blip,
      // no signal indoors, whatever — so leave the toggle on and just
      // let the next scheduled refresh try again rather than forcing
      // them to notice and re-enable it by hand.
      if(err && err.code === 1){
        if(note) note.textContent = "Location access is blocked for this site. To use GPS, re-enable location for this site in your browser/device settings, then turn this back on.";
        Store.set("gpsLocationEnabled", false);
        syncGpsToggleCheckboxes(false);
        stopGpsWatch();
      } else if(note){
        note.textContent = `Couldn't get GPS location right now (${err && err.message ? err.message : "no signal"}) — will try again shortly.`;
      }
    },
    { enableHighAccuracy: false, maximumAge: 60000, timeout: 15000 }
  );
}

function startGpsWatch(){
  stopGpsWatch();
  refreshGpsLocationOnce();
  _gpsWatchTimer = setInterval(refreshGpsLocationOnce, GPS_LOCATION_REFRESH_MS);
}
function stopGpsWatch(){
  if(_gpsWatchTimer){ clearInterval(_gpsWatchTimer); _gpsWatchTimer = null; }
}
// Called once at load for Discover's static toggle, and fresh on every
// renderHomeSyncStatus() rebuild for Home's copy — same re-wire-on-
// every-render pattern as wireStatusControl/wireDeviceHandoffControl
// elsewhere in this file, since Home's box is fully replaced each time.
function wireGpsToggle(toggleId){
  const toggle = document.getElementById(toggleId);
  if(!toggle) return;
  toggle.checked = !!Store.get("gpsLocationEnabled");
  toggle.onchange = ()=>{
    Store.set("gpsLocationEnabled", toggle.checked);
    syncGpsToggleCheckboxes(toggle.checked);
    if(toggle.checked) startGpsWatch(); else stopGpsWatch();
  };
  if(toggle.checked) startGpsWatch();
}
wireGpsToggle("gpsLocationToggle");

// See LOCATION_REMINDER_INTERVAL_MS near the top of the file and
// renderHomeContextBanner's showLocationReminder logic — this toggle
// just flips the Store flag that check reads; the reminder itself never
// runs on a real timer.
function wireLocationReminderToggle(){
  const toggle = document.getElementById("locationReminderToggle");
  if(!toggle) return;
  toggle.checked = !!Store.get("locationReminderEnabled");
  toggle.onchange = ()=>{
    Store.set("locationReminderEnabled", toggle.checked);
    if(!toggle.checked) Store.remove("locationReminderDismissedAt");
    if(typeof renderHomeContextBanner === "function") renderHomeContextBanner();
  };
}
wireLocationReminderToggle();

// ===============================
// GROUP CLASH DETECTION — informational only: how many of the WHOLE
// GROUP's saved artists overlap in time, not just this device's own
// (that's the existing findClashes() above, used by the Plan "Clashes"
// view). A group clash is two different saved artists overlapping in
// time where at least one person is interested in each. Surfaced as a
// simple count (Big Picture, Today's GROUP section) — there's no
// group-wide "resolve this clash" flow any more; see GROUP INVITES
// further down for how the group actually coordinates on a set.
// ===============================
// Combines this device's own saved artists with every synced teammate's
// (peopleSchedules) into one map keyed by day+name, each entry carrying
// who's interested and whether it's a must-see for them. Shared by
// group-clash detection below and the Today dashboard's GROUP section —
// one data path, not two separate ones counting the same thing.
function buildCombinedArtistInterestMap(){
  const combined = [];
  const myName = currentContributorName() || "You";
  (Store.get("schedule") || []).forEach(a=> combined.push({ ...a, owner: myName }));
  const peopleSchedules = Store.get("peopleSchedules") || {};
  Object.entries(peopleSchedules).forEach(([id, entry])=>{
    const displayName = personDisplayName(entry, id);
    personSnapshotList(entry).forEach(a=> combined.push({ ...a, owner: displayName }));
  });

  const byArtist = {};
  combined.forEach(a=>{
    const startMin = toMinutes(a.day, a.start), endMin = toMinutes(a.day, a.end);
    const key = `${a.day || "TBC"}|${a.name}`;
    if(!byArtist[key]){
      byArtist[key] = { name: a.name, stage: a.stage, day: a.day, start: a.start, end: a.end,
        startMin, endMin: (startMin !== null && endMin !== null && endMin <= startMin) ? endMin + 1440 : endMin, interest: {} };
    }
    // A person's mustSee flag can differ from another's for the same
    // artist — once true for this artist from any owner, keep it true
    // rather than letting a later, less-starred owner downgrade it.
    if(!(a.owner in byArtist[key].interest) || a.mustSee) byArtist[key].interest[a.owner] = !!a.mustSee;
  });
  return byArtist;
}

function groupClashPairs(){
  const artists = Object.values(buildCombinedArtistInterestMap()).filter(a=> a.startMin !== null && a.endMin !== null);

  const pairs = [];
  const seen = new Set();
  for(let i=0;i<artists.length;i++){
    for(let j=i+1;j<artists.length;j++){
      const A = artists[i], B = artists[j];
      if(A.day !== B.day) continue;
      if(A.startMin < B.endMin && B.startMin < A.endMin){
        // Only a GROUP decision if 2+ different people are involved
        // across the two artists — one person clashing with themself
        // (both artists in their own list) is just their personal
        // clash, already covered by the Plan "Clashes" view, and
        // doesn't need the group to weigh in.
        const owners = new Set([...Object.keys(A.interest), ...Object.keys(B.interest)]);
        if(owners.size < 2) continue;
        const key = A.day + "|" + [A.name, B.name].sort().join("__");
        if(seen.has(key)) continue;
        seen.add(key);
        pairs.push({ key, day: A.day, a: A, b: B });
      }
    }
  }
  return pairs.sort((p1,p2)=> p1.a.startMin - p2.a.startMin);
}

// "Want to see together" is retired from the UI — no button creates new
// entries any more (see showArtists() above), and this always returns
// empty so nothing it used to feed (Decisions cards, the outstanding-
// count badge) can surface it either. Left as a function rather than
// deleted everywhere it's called, and the underlying wantTogether/
// peopleWantTogether sync fields are left alone rather than ripped out
// of buildSyncPayload/mergeSyncPayload/firestore.rules — doing that
// would reject syncs from any device that hasn't updated yet, which is
// a real risk this app doesn't need to take just to hide a feature.
function wantTogetherEntries(){
  return [];
}

function truncateName(name, max){
  return name.length > max ? name.slice(0, max - 1).trimEnd() + "…" : name;
}

// ===============================
// GROUP INVITES — replaces the old clash-resolution "Group decisions"
// flow (together/split/half/decide-later, one card per overlapping
// pair) with something much lighter: a single ❤️ on any artist card
// (see inviteHeartBtnHTML/wireInviteHeartBtn, wired from showArtists(),
// scheduleItemHTML() and showTimelineDetailModal()) that tells the rest
// of the group "this is a must-see for me, come with me". Whether to
// actually go stays each person's own call — the same star/must-see
// mechanism already merges that into their own Plan/Timeline — this is
// just the shared nudge that says "ask the group to go".
// Reuses the existing groupDecisions Store key and `decisions` sync
// field rather than adding a new one — same reasoning as
// wantTogetherEntries() below: a new top-level sync field needs
// firestore.rules updated (and deployed) before it'll accept writes,
// which risks rejecting syncs from any device that hasn't updated yet.
// Keyed by day+artist name (not a pair) since an invite is about ONE
// set, not a clash between two.
// ===============================
function groupInviteKey(day, name){
  return `${day || "TBC"}|${name}`;
}
function getGroupInvite(day, name){
  return (Store.get("groupDecisions") || {})[groupInviteKey(day, name)] || null;
}
function amInvitingGroup(day, name){
  const invite = getGroupInvite(day, name);
  const me = currentContributorName() || "You";
  return !!(invite && invite.invitedBy && invite.invitedBy.includes(me));
}

// Toggles THIS PERSON's own heart on an artist — adds/removes their name
// from invitedBy, deleting the entry entirely once nobody's left
// inviting. Pushes to cloud right away (same as the old setGroupDecision
// did) so the invite reaches the group without waiting for the next
// periodic auto-sync.
async function toggleGroupInvite(artist){
  const me = currentContributorName() || "You";
  const key = groupInviteKey(artist.day, artist.name);
  const decisions = Store.get("groupDecisions") || {};
  const existing = decisions[key];
  const invitedBy = existing && Array.isArray(existing.invitedBy) ? existing.invitedBy.slice() : [];
  const idx = invitedBy.indexOf(me);
  if(idx === -1) invitedBy.push(me); else invitedBy.splice(idx, 1);
  // Always keep the entry, even once invitedBy is empty — never delete
  // it outright. mergeSyncPayload (see its own comment) only ever
  // ADDS/UPDATES keys it finds in an incoming payload; a deleted key
  // simply isn't present in this device's own outgoing payload, so
  // other devices that already cached the invite would never learn it
  // was cancelled and would show it forever. An empty-invitedBy entry
  // with a fresh updatedAt is a proper tombstone instead: it wins the
  // same last-write-wins merge as any other update, and every read site
  // below (getGroupInvite/renderGroupInvites/renderTodayInvites/
  // outstandingGroupInvitesCount) already filters on invitedBy.length,
  // so an empty one is correctly treated as "not shown" everywhere.
  decisions[key] = {
    invitedBy,
    artist: { name: artist.name, day: artist.day, stage: artist.stage, start: artist.start, end: artist.end },
    updatedAt: Date.now()
  };
  Store.set("groupDecisions", decisions);
  if(typeof renderGroupInvites === "function") renderGroupInvites();
  if(typeof renderTodayInvites === "function") renderTodayInvites();
  if(typeof renderHomeContextBanner === "function") renderHomeContextBanner();
  if(typeof refreshAfterStarChange === "function") refreshAfterStarChange();
  if(typeof pushToCloud === "function"){
    try{ await pushToCloud(); return true; }catch(err){ return false; }
  }
  return false;
}

function outstandingGroupInvitesCount(){
  return Object.values(Store.get("groupDecisions") || {}).filter(d=> d && d.invitedBy && d.invitedBy.length).length;
}

// Small heart button, reused wherever an artist card shows a star/seen
// pair — filled once THIS PERSON has invited the group to it.
function inviteHeartBtnHTML(artist){
  const active = amInvitingGroup(artist.day, artist.name);
  return `<button class="ghost invite-heart-btn${active ? " active" : ""}" aria-label="${active ? "Cancel your group invite" : "Invite the group to this one"}" title="${active ? "You've invited the group — tap to cancel" : "Invite the group to join you at this set"}">${active ? "❤️" : "🤍"}</button>`;
}
function wireInviteHeartBtn(btn, artist){
  if(!btn) return;
  btn.onclick = (e)=>{ e.stopPropagation(); toggleGroupInvite(artist); };
}

function inviteCardHTML(entry){
  const artist = entry.artist;
  const me = currentContributorName() || "You";
  const invitedBy = entry.invitedBy || [];
  const others = invitedBy.filter(n=> n !== me);
  const whoLine = invitedBy.includes(me)
    ? (others.length ? `You and ${escapeHtml(others.join(", "))} invited the group` : `You invited the group`)
    : `${escapeHtml(invitedBy.join(", ") || "Someone")} invited the group`;
  const saved = Store.get("schedule").some(x=> x.name === artist.name);
  const mustSee = isMustSee(artist.name);
  return `
    <div class="decision-card" data-invite-key="${escapeHtml(groupInviteKey(artist.day, artist.name))}">
      <div class="decision-head"><span>❤️ ${escapeHtml(timeLabel(artist))}</span><span class="decision-pill together">Must-see for them</span></div>
      <div class="decision-vs">
        <div class="decision-vs-side"><strong>${escapeHtml(artist.name)}</strong><span class="decision-vs-stage">${escapeHtml(artist.stage)}</span><span class="decision-vs-owners">${whoLine}</span></div>
      </div>
      <div class="decision-actions">
        <div class="decision-actions-row decision-actions-together">
          <button data-invite-action="heart" class="${invitedBy.includes(me) ? "active" : ""}">❤️ ${invitedBy.includes(me) ? "You're in on this" : "I'm in too"}<br><span>${invitedBy.includes(me) ? "tap to cancel your invite" : "invite from you too"}</span></button>
          <button data-invite-action="save" class="${mustSee ? "active" : ""}">${mustSee ? "★" : "☆"} ${saved ? "In your plan" : "Add to my plan"}<br><span>${mustSee ? "already must-see" : "star it as must-see"}</span></button>
        </div>
      </div>
    </div>
  `;
}
function wireInviteCard(el, entry){
  const artist = entry.artist;
  el.querySelectorAll("[data-invite-action]").forEach(btn=>{
    btn.onclick = ()=>{
      const action = btn.getAttribute("data-invite-action");
      if(action === "heart") return toggleGroupInvite(artist);
      if(action === "save") setMustSee(artist, true);
    };
  });
}

// Reusable so the same render backs both the Plan tab's box and Today's
// INVITES section — no separate data path, same groupDecisions Store
// key either way. Capped with a "show more" toggle so a busy lineup with
// several live invites can't crowd out the actual Plan list underneath.
function renderGroupInvites(containerId){
  const box = document.getElementById(containerId || "groupInvitesBox");
  if(!box) return;
  const decisions = Store.get("groupDecisions") || {};
  const entries = Object.values(decisions).filter(d=> d && d.invitedBy && d.invitedBy.length)
    .sort((a,b)=> (b.updatedAt||0) - (a.updatedAt||0));
  if(!entries.length){ box.innerHTML = ""; box.style.display = "none"; return; }
  box.style.display = "";
  // Collapsed to one summary line by default — this used to sit full-
  // height above Compare's own list every time, effectively hiding the
  // thing Compare is actually for. The header/toggle is a "card" of its
  // own so it reads as collapsible rather than as a heading.
  const collapseHeader = `<div class="decisions-box-header${groupInvitesCollapsed ? "" : " expanded"}" id="groupInvitesCollapseToggle">
    <h3 style="margin:0; font-size:14px;">❤️ Group invites <span class="empty-note" style="font-weight:400;">${entries.length} live</span></h3>
    <span class="decisions-box-chevron">${groupInvitesCollapsed ? "▾" : "▴"}</span>
  </div>`;
  if(groupInvitesCollapsed){
    box.innerHTML = collapseHeader;
    document.getElementById("groupInvitesCollapseToggle").onclick = ()=>{ groupInvitesCollapsed = false; renderGroupInvites(containerId); };
    return;
  }
  const visible = groupInvitesExpanded ? entries : entries.slice(0, GROUP_INVITES_CAP);
  box.innerHTML = collapseHeader
    + visible.map(inviteCardHTML).join("")
    + (entries.length > GROUP_INVITES_CAP ? `<button class="ghost" id="groupInvitesToggle" style="margin-top:2px;">${groupInvitesExpanded ? "Show fewer" : `Show ${entries.length - GROUP_INVITES_CAP} more`}</button>` : "");
  document.getElementById("groupInvitesCollapseToggle").onclick = ()=>{ groupInvitesCollapsed = true; renderGroupInvites(containerId); };
  const cards = box.querySelectorAll(".decision-card");
  visible.forEach((entry,i)=>{ if(cards[i]) wireInviteCard(cards[i], entry); });
  const toggleBtn = document.getElementById("groupInvitesToggle");
  if(toggleBtn) toggleBtn.onclick = ()=>{ groupInvitesExpanded = !groupInvitesExpanded; renderGroupInvites(containerId); };
}
renderGroupInvites();

// ===============================
// TODAY / FESTIVAL MODE — a single-glance "what should we be doing
// right now" dashboard, built entirely from data the app already has
// (own Plan, group sync, group invites, shared meeting point) — no
// new state of its own beyond which tab is active.
// ===============================
// UTC-anchored, not a bare local-time string — the festival is in the
// UK, on BST (UTC+1) throughout August, so "midnight on 12 Aug UK time"
// is 23:00 UTC on 11 Aug. A bare "2026-08-12T00:00:00" string is parsed
// in whichever timezone the VIEWER'S OWN DEVICE happens to be set to,
// which is wrong for anyone whose device isn't on UK time (travelling,
// misconfigured, etc.) even though the festival itself never moves.
const FESTIVAL_START = new Date("2026-08-11T23:00:00Z"); // 00:00 BST, Wed 12 Aug 2026
const FESTIVAL_END = new Date("2026-08-16T23:00:00Z"); // exclusive — 00:00 BST Sun 16 Aug, through end of Sun 16 Aug
function isFestivalLive(){
  const now = new Date();
  return now >= FESTIVAL_START && now < FESTIVAL_END;
}

// Which DAY_ORDER label "right now" actually falls on, or null if the
// festival isn't currently live — used by buildTimelineHTML's now-line
// so it only ever appears on the day you're actually viewing when
// that's genuinely today, never guessed or left on for the wrong day.
function currentFestivalDayLabel(){
  if(!isFestivalLive()) return null;
  const diffDays = Math.floor((new Date() - FESTIVAL_START) / 86400000);
  return DAY_ORDER[diffDays] || null;
}

function timedFromSchedule(schedule){
  return (schedule || [])
    .map(a=>({ ...a, startMin: toMinutes(a.day, a.start), endMin: toMinutes(a.day, a.end) }))
    .filter(a=> a.startMin !== null && a.endMin !== null)
    .map(a=> ({ ...a, endMin: a.endMin <= a.startMin ? a.endMin + 1440 : a.endMin }));
}

function nowMinutesSinceFestivalStart(){
  const now = new Date();
  const diffDays = Math.floor((now - FESTIVAL_START) / 86400000);
  return diffDays * 1440 + now.getHours() * 60 + now.getMinutes();
}

function renderTodayNow(){
  const box = document.getElementById("todayNow");
  if(!box) return;
  const timed = timedFromSchedule(Store.get("schedule"));
  const nowMin = nowMinutesSinceFestivalStart();
  const current = timed.find(a=> a.startMin <= nowMin && nowMin < a.endMin);
  const next = timed.filter(a=> a.startMin > nowMin).sort((a,b)=> a.startMin - b.startMin)[0];
  box.innerHTML = `
    <h3 style="margin-bottom:6px;">NOW</h3>
    ${current
      ? `<div class="big">${escapeHtml(current.name)}</div><div class="sub">${escapeHtml(current.stage)} · ${timeLabel(current)}</div>`
      : `<p class="empty-note">Nothing from your Plan on right now.</p>`}
    ${next ? `<p style="margin-top:8px; font-size:13px; color:var(--text-muted);">Next: <strong>${escapeHtml(next.name)}</strong> · ${escapeHtml(next.stage)} · ${timeLabel(next)}</p>` : ""}
  `;
}

// Countdown label ("in 45m" / "in 2h 15m") for a NEXT UP row — same
// nowMin/startMin units as the rest of Today's timing (minutes since
// FESTIVAL_START), so no separate date math needed here.
function nextUpCountdownLabel(startMin, nowMin){
  const diff = startMin - nowMin;
  if(diff < 60) return `in ${diff}m`;
  const h = Math.floor(diff / 60), m = diff % 60;
  return `in ${h}h${m ? ` ${m}m` : ""}`;
}

function renderTodayNextUp(){
  const box = document.getElementById("todayNextUp");
  if(!box) return;
  const nowMin = nowMinutesSinceFestivalStart();
  const byArtist = buildCombinedArtistInterestMap();
  const upcoming = Object.values(byArtist)
    .filter(a=> a.startMin !== null && a.endMin !== null && a.startMin > nowMin)
    .sort((a,b)=>{
      const aMust = Object.values(a.interest).some(Boolean);
      const bMust = Object.values(b.interest).some(Boolean);
      if(aMust !== bMust) return aMust ? -1 : 1;
      return a.startMin - b.startMin;
    })
    .slice(0, 4);
  box.innerHTML = `
    <h3 style="margin-bottom:8px;">NEXT UP</h3>
    ${upcoming.length ? `<div class="nextup-list">${upcoming.map(a=>{
      const owners = Object.entries(a.interest).map(([o,m])=>
        `<span class="nextup-owner${m ? " mustsee" : ""}">${escapeHtml(o)}${m ? " ★" : ""}</span>`
      ).join("");
      return `<div class="nextup-row">
        <div class="nextup-time"><span class="nextup-day">${escapeHtml(a.day || "")}</span>${escapeHtml(a.start || "")}<span class="nextup-countdown">${nextUpCountdownLabel(a.startMin, nowMin)}</span></div>
        <div class="nextup-info">
          <div class="nextup-name">${escapeHtml(a.name)}${a.end ? ` <span class="nextup-fullwindow">(${escapeHtml(a.start || "")}–${escapeHtml(a.end)})</span>` : ""}</div>
          <div class="nextup-stage">${escapeHtml(a.stage)}</div>
          ${owners ? `<div class="nextup-owners">${owners}</div>` : ""}
        </div>
      </div>`;
    }).join("")}</div>` : `<p class="empty-note">Nothing upcoming saved yet.</p>`}
  `;
}

function renderTodayGroup(){
  const box = document.getElementById("todayGroup");
  if(!box) return;
  const byArtist = buildCombinedArtistInterestMap();
  const all = Object.values(byArtist);
  const shared = all.filter(a=> Object.keys(a.interest).length >= 2).sort((a,b)=> Object.keys(b.interest).length - Object.keys(a.interest).length);
  const sharedMustSees = shared.filter(a=> Object.values(a.interest).filter(Boolean).length >= 2);
  const clashCount = groupClashPairs().length;
  box.innerHTML = `
    <h3 style="margin-bottom:6px;">GROUP</h3>
    <p style="font-size:13px; margin-bottom:6px; color:var(--text-muted);">🔥 ${sharedMustSees.length} shared Must See${sharedMustSees.length===1?"":"s"} · ⚡ ${clashCount} clash${clashCount===1?"":"es"} in the group's picks</p>
    ${shared.length ? shared.slice(0,4).map(a=>{
      const owners = Object.entries(a.interest).map(([o,m])=> `${escapeHtml(o)}${m ? " ★" : " 👍"}`).join(" · ");
      return `<div class="decision-artist-line"><strong>${escapeHtml(a.name)}</strong> — ${owners}</div>`;
    }).join("") : `<p class="empty-note">No shared picks yet — sync with your group to see them here.</p>`}
  `;
}

function renderTodayInvites(){
  const box = document.getElementById("todayDecisions");
  if(!box) return;
  const entries = Object.values(Store.get("groupDecisions") || {}).filter(d=> d && d.invitedBy && d.invitedBy.length)
    .sort((a,b)=> (b.updatedAt||0) - (a.updatedAt||0));
  box.innerHTML = `
    <h3 style="margin-bottom:6px;">GROUP INVITES</h3>
    ${entries.length
      ? `<p style="font-size:13px; margin-bottom:8px;">❤️ ${entries.length} live invite${entries.length===1?"":"s"}</p>`
        + entries.slice(0,3).map(inviteCardHTML).join("")
        + (entries.length > 3 ? `<p class="empty-note">+${entries.length-3} more — see Plan.</p>` : "")
      : `<p class="empty-note">No group invites yet — tap the ❤️ on any artist to invite the group.</p>`}
  `;
  if(entries.length){
    const cards = box.querySelectorAll(".decision-card");
    entries.slice(0,3).forEach((entry,i)=>{ if(cards[i]) wireInviteCard(cards[i], entry); });
  }
}

function renderTodayMeet(){
  const box = document.getElementById("todayMeet");
  if(!box) return;
  const m = Store.get("meeting");
  box.innerHTML = `
    <h3 style="margin-bottom:6px;">MEET</h3>
    ${m
      ? `<p>📍 Meeting at: <strong>${escapeHtml(m)}</strong></p><p class="empty-note">${Store.get("meetingBy") ? "Set by " + escapeHtml(Store.get("meetingBy")) : ""}${Store.get("meetingUpdatedAt") ? " · " + formatLastSeen(Store.get("meetingUpdatedAt")) : ""}</p>`
      : `<p class="empty-note">No shared meeting point set yet.</p>`}
  `;
}

function renderTodayDashboard(){
  if(!document.getElementById("today")) return;
  renderTodayNow();
  renderTodayNextUp();
  renderTodayGroup();
  renderTodayInvites();
  renderTodayMeet();
}
renderTodayDashboard();
setInterval(renderTodayDashboard, 60000);

document.querySelectorAll('#todayQuickActions [data-today-jump]').forEach(btn=>{
  btn.onclick = ()=> jumpToTab(btn.getAttribute("data-today-jump"));
});
const todayQuickClashesBtn = document.getElementById("todayQuickClashes");
if(todayQuickClashesBtn) todayQuickClashesBtn.onclick = ()=>{ if(typeof jumpToClashes === "function") jumpToClashes(); };
const todayQuickSearchBtn = document.getElementById("todayQuickSearch");
if(todayQuickSearchBtn) todayQuickSearchBtn.onclick = ()=>{
  jumpToTab("artists");
  setTimeout(()=>{
    const listBtn = document.getElementById("artistsViewListBtn");
    if(listBtn) listBtn.click();
    const input = document.getElementById("artistSearch");
    if(input) input.focus();
  }, 100);
};

// Home always stays the screen people land on — that's where "pick your
// name and sync" lives, and auto-jumping past it during the festival
// meant some people never saw it. During the festival, Today just gets
// a "live" badge on its tab (positioned right after Home) so it's an
// obvious, one-tap-away next stop instead of the landing screen itself.
(function setupFestivalModeBadge(){
  if(!isFestivalLive()) return;
  const todayTabBtn = document.getElementById("todayTabBtn");
  if(todayTabBtn) todayTabBtn.classList.add("tab-live");
})();

// ===============================
// DISCOVER "FOR YOU" — a short, personalised strip above Discover's
// category nav, built entirely from data the app already computes
// (buildCombinedArtistInterestMap for group favourites/recommendations,
// hiddenVenues for latest finds) — no separate tracking of "what's new".
// ===============================
function renderDiscoverForYou(){
  const box = document.getElementById("discoverForYou");
  if(!box) return;
  const people = (typeof comparePeopleList === "function") ? comparePeopleList() : [{ key:"mine" }];
  const lines = [];

  if(people.length >= 2 && typeof buildCombinedArtistInterestMap === "function"){
    const byArtist = Object.values(buildCombinedArtistInterestMap());
    const favourites = byArtist
      .filter(a=> Object.keys(a.interest).length >= 2)
      .sort((a,b)=> Object.keys(b.interest).length - Object.keys(a.interest).length)
      .slice(0, 3);
    if(favourites.length){
      lines.push(`<div class="discover-for-you-line">🔥 <strong>Group favourites:</strong> ${favourites.map(a=> escapeHtml(a.name)).join(", ")}</div>`);
    }
    const myName = currentContributorName() || "You";
    const recs = byArtist
      .filter(a=> Object.values(a.interest).filter(Boolean).length >= 2 && !a.interest[myName])
      .slice(0, 3);
    if(recs.length){
      lines.push(`<div class="discover-for-you-line">⭐ <strong>Worth a look:</strong> ${recs.map(a=> escapeHtml(a.name)).join(", ")} — several of you have starred ${recs.length===1?"this":"these"}, you haven't saved ${recs.length===1?"it":"them"} yet.</div>`);
    }
  }

  const venues = Store.get("hiddenVenues") || [];
  if(venues.length){
    const latest = venues.slice(-2).reverse();
    lines.push(`<div class="discover-for-you-line">🕵 <strong>New finds:</strong> ${latest.map(v=> `${escapeHtml(v.name || "Untitled find")}${v.from ? " (via " + escapeHtml(v.from) + ")" : ""}`).join(", ")}</div>`);
  }

  box.innerHTML = lines.length ? `<div class="discover-for-you-card"><h3>For you</h3>${lines.join("")}</div>` : "";
}
renderDiscoverForYou();
if(typeof renderRecentActivity === "function") renderRecentActivity("recentActivityList");

// ===============================
// GROUP ACTIVITY — derived entirely from data already synced
// (peopleStatus, groupDecisions, the shared meeting point,
// hiddenVenues/theories timestamps) rather than a separate event log —
// no new collection, no extra Firestore writes at all.
// ===============================
function buildRecentActivity(){
  const events = [];
  const myDeviceId = (typeof ensureDeviceId === "function") ? ensureDeviceId() : null;

  const peopleStatus = Store.get("peopleStatus") || {};
  Object.entries(peopleStatus).forEach(([id, s])=>{
    if(s && s.updatedAt && s.place) events.push({ ts: s.updatedAt, text: `${escapeHtml(personDisplayName(s, id))} updated their location to ${escapeHtml(s.place)}`, icon: personDotHtml(personDisplayName(s, id)) });
  });
  const myStatus = Store.get("myStatus");
  if(myStatus && myStatus.updatedAt && myStatus.place && myDeviceId){
    events.push({ ts: myStatus.updatedAt, text: `You updated your location to ${escapeHtml(myStatus.place)}`, icon: personDotHtml(currentContributorName() || "You") });
  }

  const invites = Store.get("groupDecisions") || {};
  Object.values(invites).forEach(d=>{
    if(!d || !d.updatedAt || !d.artist || !d.invitedBy || !d.invitedBy.length) return;
    const latest = d.invitedBy[d.invitedBy.length - 1] || "Someone";
    events.push({ ts: d.updatedAt, text: `${escapeHtml(latest)} invited the group to ${escapeHtml(d.artist.name)}`, icon: "❤️" });
  });

  const meetingUpdatedAt = Store.get("meetingUpdatedAt");
  if(meetingUpdatedAt){
    events.push({ ts: meetingUpdatedAt, text: `${escapeHtml(Store.get("meetingBy") || "Someone")} set the meeting point to ${escapeHtml(Store.get("meeting") || "")}`, icon: "📍" });
  }

  (Store.get("hiddenVenues") || []).forEach(v=>{
    if(v.ts) events.push({ ts: v.ts, text: `${escapeHtml(v.from || "Someone")} added a hidden venue: ${escapeHtml(v.name || "Untitled find")}`, icon: "🕵" });
  });
  (Store.get("theories") || []).forEach(t=>{
    if(t.ts) events.push({ ts: t.ts, text: `${escapeHtml(t.from || "Someone")} added a theory`, icon: "🔮" });
  });

  return events.sort((a,b)=> b.ts - a.ts);
}

function renderRecentActivity(containerId, limit){
  const box = document.getElementById(containerId);
  if(!box) return;
  const events = buildRecentActivity().slice(0, limit || 12);
  box.innerHTML = events.length
    ? events.map(e=> `<div class="status-line">${e.icon} ${e.text} <span style="color:var(--text-muted); font-size:11px;">· ${formatLastSeen(e.ts)}</span></div>`).join("")
    : `<p class="empty-note">Nothing yet — activity shows up here as your group syncs, sets statuses, logs finds and makes decisions.</p>`;
}

async function pushToCloud(){
  const db = getFirestoreDb();
  const room = currentRoomCode();
  const name = currentContributorName();
  if(!db || !room || !name) return;
  const deviceId = ensureDeviceId();
  const payload = buildSyncPayload();
  payload.updatedAt = Date.now();
  // Firestore's SDK throws (not silently drops) on any field whose value
  // is literally `undefined`, anywhere in the object — a real bug here
  // used to write "from: currentContributorName() || undefined" whenever
  // a note/find/theory/quote/sighting/landmark was logged before picking
  // a name, baking an undefined into localStorage that broke every
  // future cloud sync with a generic "Couldn't sync" until that one
  // entry was found and removed by hand. That's fixed at the source now,
  // but this device (or a synced-in teammate's) may already be carrying
  // old poisoned entries — a JSON round-trip is a cheap, reliable way to
  // strip any undefined value recursively before every push, regardless
  // of where it came from.
  //
  // Keyed by deviceId, not by name — a document ID that never changes
  // just because someone retypes their name or two people happen to pick
  // the same one. Renaming updates the `from` field inside your one
  // stable document instead of creating (or colliding with) another.
  const cleanPayload = JSON.parse(JSON.stringify(payload));
  await db.collection("rooms").doc(room).collection("members").doc(deviceId).set(cleanPayload);
  Store.set("lastPushedRoomId", room);
  // Legacy cleanup: this room may still have a doc from before this
  // device had a stable id, filed under the old name-as-doc-id scheme.
  // Best-effort and safe to repeat forever — deleting an already-gone
  // doc is a no-op, so this just self-heals any leftover ghost from the
  // transition without needing a one-time migration flag.
  if(name) db.collection("rooms").doc(room).collection("members").doc(name).delete().catch(()=>{});
  // Best-effort snapshot history — see snapshotBackupIfDue() below. Never
  // allowed to affect the outcome of a sync: a backup hiccup (offline
  // mid-write, quota, whatever) must not turn a successful sync into a
  // failed one.
  snapshotBackupIfDue(db, room, deviceId, cleanPayload).catch(err=>{
    console.warn("Backup snapshot failed (non-fatal):", err);
  });
}

// Writes a timestamped copy of this device's own synced data to
// rooms/{room}/members/{deviceId}/backups/{takenAt}, so a bad sync (data
// cleared by mistake, a corrupted merge, two bad syncs in a row) can be
// stepped back from — see the "🗄️ Backup history" card in Discover.
// Deliberately cheap on Firestore's free quota:
//  - throttled to at most once per BACKUP_MIN_INTERVAL_MS, checked first
//    against a local timestamp (no read needed) before ever touching
//    Firestore;
//  - skipped entirely if the data hasn't actually changed since the last
//    snapshot (one extra read, no write);
//  - pruned to the newest BACKUP_MAX_SNAPSHOTS afterwards (oldest first) —
//    pinned snapshots (see takeManualBackupNow below) are never counted
//    or pruned here, so a manually-taken "keep this one for good" backup
//    can't get silently rotated out by ordinary automatic ones.
async function snapshotBackupIfDue(db, room, deviceId, payload){
  const now = Date.now();
  const lastAttempt = Store.get("lastBackupAttemptAt") || 0;
  if(now - lastAttempt < BACKUP_MIN_INTERVAL_MS) return;
  Store.set("lastBackupAttemptAt", now);
  const backupsRef = db.collection("rooms").doc(room).collection("members").doc(deviceId).collection("backups");
  const latest = await backupsRef.orderBy("takenAt", "desc").limit(1).get();
  const payloadJson = JSON.stringify(payload);
  if(!latest.empty && JSON.stringify(latest.docs[0].data().payload) === payloadJson) return; // nothing's changed — skip the write
  await backupsRef.doc(String(now)).set({ takenAt: now, payload });
  const all = await backupsRef.orderBy("takenAt", "desc").get();
  const extra = all.docs.filter(d=> !d.data().pinned).slice(BACKUP_MAX_SNAPSHOTS);
  await Promise.all(extra.map(d=> d.ref.delete()));
}

// Manual, on-demand backup — for testing, or just wanting a known-good
// point saved right now rather than waiting on the throttle above.
// Bypasses BACKUP_MIN_INTERVAL_MS and the "skip if unchanged" check (the
// whole point is "save this exact moment, regardless"), and is written
// pinned:true so the automatic pruning above can never rotate it out.
// Kept indefinitely — there's no manual delete for a single snapshot,
// only cleanup of a whole device's doc (e.g. via mergePersonIntoMine).
async function takeManualBackupNow(){
  const db = getFirestoreDb();
  const room = currentRoomCode();
  if(!db || !room) throw new Error("No room code set — check Sync above first.");
  const deviceId = ensureDeviceId();
  const payload = JSON.parse(JSON.stringify(buildSyncPayload()));
  payload.updatedAt = Date.now();
  const now = Date.now();
  await db.collection("rooms").doc(room).collection("members").doc(deviceId).collection("backups").doc(String(now)).set({ takenAt: now, payload, pinned: true });
  return now;
}

// Lists this device's own backup snapshots, newest first, for the
// "🗄️ Backup history" card.
async function listMyBackups(){
  const db = getFirestoreDb();
  const room = currentRoomCode();
  if(!db || !room) return [];
  const deviceId = ensureDeviceId();
  const snap = await db.collection("rooms").doc(room).collection("members").doc(deviceId).collection("backups").orderBy("takenAt", "desc").get();
  return snap.docs.map(d=> ({ id: d.id, takenAt: d.data().takenAt, payload: d.data().payload, pinned: !!d.data().pinned }));
}

// Restores one of this device's own backup snapshots: overwrites (not
// merges — this is a deliberate step back to an earlier point in time,
// not another teammate's additive sync) this device's local saved data
// with what was in that snapshot, then pushes it back up so the cloud
// copy and every teammate's next pull reflect the restored version too.
// Personal-only fields (schedule/bingo/character/status/notes etc. live
// in the payload the same way a normal sync does) are restored; nothing
// about restoring reaches into or removes another teammate's own data.
async function restoreBackupSnapshot(backupId){
  const backups = await listMyBackups();
  const found = backups.find(b=> b.id === backupId);
  if(!found) throw new Error("That backup could no longer be found.");
  const p = found.payload;
  Store.set("clues", p.clues || {});
  Store.set("characterNotes", p.characterNotes || {});
  Store.set("theories", p.theories || []);
  Store.set("hiddenVenues", p.hiddenVenues || []);
  Store.set("involvedDone", p.involvedDone || []);
  Store.set("discoveries", p.discoveries || []);
  Store.set("customSocials", p.customSocials || []);
  Store.set("quotes", p.quotes || []);
  Store.set("sightings", p.sightings || []);
  Store.set("customLandmarks", p.customLandmarks || []);
  Store.set("customPlaces", p.customPlaces || []);
  Store.set("schedule", p.schedule || []);
  if(p.bingo){
    Store.set("bingoCard", p.bingo.card || []);
    Store.set("bingoMarked", p.bingo.marked || []);
    Store.set("bingoLocked", !!p.bingo.locked);
  }
  Store.set("myCharacter", p.character || null);
  Store.set("myStatus", p.status || null);
  if(typeof refreshAfterMerge === "function") refreshAfterMerge();
  await pushToCloud();
  return found;
}

// Sets it locally (including clearing — an empty place still stamps a
// fresh updatedAt, so the "clear" itself wins the last-write-wins
// comparison on other devices rather than silently being ignored), then
// pushes this device's own regular sync doc right away. See
// buildSyncPayload/mergeSyncPayload's `meeting` handling above for how
// it reaches the group — piggybacked on the same per-member document
// that's always worked, not a separate document with its own
// permissions to worry about.
async function pushSharedMeeting(place){
  const trimmed = (place || "").trim();
  const name = currentContributorName() || "Someone";
  Store.set("meeting", trimmed);
  Store.set("meetingBy", name);
  Store.set("meetingUpdatedAt", Date.now());
  if(typeof renderCurrentMeeting === "function") renderCurrentMeeting();
  if(typeof renderHomeContextBanner === "function") renderHomeContextBanner();
  if(typeof pushToCloud === "function"){
    try{ await pushToCloud(); return true; }catch(err){ return false; }
  }
  return false;
}

// Device handoff (below) deliberately makes a borrowed phone adopt the
// original owner's actual deviceId rather than a new one, so it reads
// here as the SAME device continuing — meaning when that person later
// reopens their own original phone, its own pushed doc (same deviceId)
// may now hold newer picks than this phone ever saw locally. Additive
// only — never overwrites this device's own local data, since the
// borrowed phone might have started from an older snapshot and this
// device could since have its own newer edits too. Schedule merges by
// artist name (cloud-only artists get added), bingo by unioning marked
// squares (a card layout is only adopted if this device has none yet),
// character only fills in if this device doesn't already have one.
function mergeOwnCloudCopy(payload){
  let changed = 0;
  if(Array.isArray(payload.schedule) && payload.schedule.length){
    const mine = Store.get("schedule") || [];
    const mineNames = new Set(mine.map(a=> a && a.name));
    let added = 0;
    payload.schedule.forEach(a=>{
      if(a && a.name && !mineNames.has(a.name)){ mine.push({ ...a }); mineNames.add(a.name); added++; }
    });
    if(added){ Store.set("schedule", mine); changed += added; }
  }
  if(payload.bingo){
    const myMarked = new Set(Store.get("bingoMarked") || []);
    const before = myMarked.size;
    (payload.bingo.marked || []).forEach(m=> myMarked.add(m));
    if(myMarked.size !== before){ Store.set("bingoMarked", [...myMarked]); changed += (myMarked.size - before); }
    const myCard = Store.get("bingoCard") || [];
    if(!myCard.length && Array.isArray(payload.bingo.card) && payload.bingo.card.length){
      Store.set("bingoCard", payload.bingo.card);
      changed++;
    }
  }
  if(payload.character && !Store.get("myCharacter")){
    Store.set("myCharacter", { ...payload.character });
    changed++;
  }
  if(Array.isArray(payload.activities) && payload.activities.length){
    const mine = Store.get("activities") || [];
    const mineIds = new Set(mine.map(a=> a && a.id));
    let added = 0;
    payload.activities.forEach(a=>{
      if(a && a.id && !mineIds.has(a.id)){ mine.push({ ...a }); mineIds.add(a.id); added++; }
    });
    if(added){ Store.set("activities", mine); changed += added; }
  }
  if(Array.isArray(payload.joinedActivities) && payload.joinedActivities.length){
    const mineJoins = new Set(Store.get("joinedActivities") || []);
    const before = mineJoins.size;
    payload.joinedActivities.forEach(k=> mineJoins.add(k));
    if(mineJoins.size !== before){ Store.set("joinedActivities", [...mineJoins]); changed += (mineJoins.size - before); }
  }
  if(Array.isArray(payload.wantTogether) && payload.wantTogether.length){
    const mineWant = new Set(Store.get("wantTogether") || []);
    const before = mineWant.size;
    payload.wantTogether.forEach(k=> mineWant.add(k));
    if(mineWant.size !== before){ Store.set("wantTogether", [...mineWant]); changed += (mineWant.size - before); }
  }
  return changed;
}

async function pullFromCloud(){
  const db = getFirestoreDb();
  const room = currentRoomCode();
  if(!db || !room) return { stats: null, count: 0 };
  const deviceId = ensureDeviceId();
  const snap = await db.collection("rooms").doc(room).collection("members").get();
  const totals = { clues:0, theories:0, venues:0, districts:0, involved:0, socials:0, quotes:0, sightings:0, landmarks:0, schedule:0, bingo:0, character:0, characterNotes:0 };
  let count = 0;
  const seenIds = new Set();
  snap.forEach(doc=>{
    if(doc.id === deviceId){
      // Only a genuinely different, later push counts — this device's
      // own just-completed push already advanced lastSyncedAt to at or
      // after that same timestamp, so this never re-merges this same
      // device's own reflection back into itself.
      const lastSynced = Store.get("lastSyncedAt") || 0;
      const data = doc.data();
      if((data.updatedAt || 0) > lastSynced && mergeOwnCloudCopy(data) > 0) count++;
      return;
    }
    seenIds.add(doc.id);
    // Meeting point and group decisions merge here too now — see
    // buildSyncPayload/mergeSyncPayload's `meeting`/`decisions` handling
    // above — piggybacked on this same per-member document fetch.
    const { stats } = mergeSyncPayload(doc.data());
    Object.keys(totals).forEach(k=> totals[k] += stats[k] || 0);
    count++;
  });
  // Every pull fetches the FULL, current member list — never a cached or
  // partial one — so any deviceId this device previously synced in as a
  // teammate's tab, but that's now missing from the snapshot entirely,
  // is genuinely gone from the cloud (merged away, deleted, whatever),
  // not just quiet this cycle. Without this, a merge/cleanup on one
  // person's device (which deletes their old duplicate's cloud doc)
  // never reaches anyone else — every other device keeps showing that
  // duplicate's tab forever, since nothing ever told it the doc was
  // gone. Only prunes read-only teammate copies, never "mine".
  let pruned = false;
  ["peopleSchedules","peopleBingo","peopleCharacters","peopleLastSeen","peopleStatus","peopleActivities","peopleJoins","peopleWantTogether"].forEach(key=>{
    const map = Store.get(key) || {};
    let changed = false;
    Object.keys(map).forEach(id=>{
      if(!seenIds.has(id)){ delete map[id]; changed = true; }
    });
    if(changed){ Store.set(key, map); pruned = true; }
  });
  if(typeof renderCurrentMeeting === "function") renderCurrentMeeting();
  // Count a pruned duplicate as "something changed" too — otherwise a
  // pull that ONLY cleans up a now-gone duplicate (no new data from
  // anyone) looks like a no-op to autoSyncNow, which skips its UI
  // refresh when count is 0. The duplicate tab would then only
  // disappear next time something else happens to trigger a re-render,
  // not right away.
  return { stats: totals, count: pruned ? Math.max(count, 1) : count };
}

// ===============================
// DEVICE HANDOFF — "using someone else's phone" mode. Deliberately
// destructive and explicit: wipes this device's own current data and
// makes it continue AS the named person instead, adopting their actual
// synced deviceId (not a new one) so this becomes a clean continuation
// of their identity rather than a second, separately-tracked device
// sharing their name. Only restores what already made it to a sync —
// schedule, bingo card, character — never the PERSONAL_ONLY_KEYS fields
// (notes, meeting point, packing list, ...), since those never left
// their original device in the first place and can't be recovered from
// here. Always looks up live from Firestore rather than any locally
// cached snapshot, so it needs signal and always gets their latest.
async function findRoomMembersByName(name){
  const db = getFirestoreDb();
  const room = currentRoomCode();
  if(!db || !room) return { error: "unavailable" };
  const target = name.trim().toLowerCase();
  if(!target) return { error: "empty" };
  const snap = await db.collection("rooms").doc(room).collection("members").get();
  const matches = [];
  snap.forEach(doc=>{
    const data = doc.data();
    if((data.from || "").trim().toLowerCase() === target) matches.push({ id: doc.id, data });
  });
  return { matches };
}

function switchDeviceIdentity(targetId, payload){
  // Remember who this phone is switching AWAY from (if it already had
  // its own identity), so "Switch back" can offer a one-tap return —
  // by the time this runs, the caller has already confirmed a
  // successful cloud backup of that outgoing identity's data, so this
  // is always safe to restore from later.
  const outgoingName = currentContributorName();
  const outgoingDeviceId = Store.get("deviceId");
  if(outgoingName && outgoingDeviceId && outgoingDeviceId !== targetId){
    Store.set("previousIdentity", { name: outgoingName, deviceId: outgoingDeviceId });
  }

  // Wipe this device's own personal data — everything that's specific
  // to whoever was using it before, including their own saved-artist
  // schedule (not part of PERSONAL_ONLY_KEYS, since that list is about
  // what's excluded from the *shareable group snapshot*, a different
  // concern from "what counts as this device's own identity").
  [...PERSONAL_ONLY_KEYS, "schedule", "activities", "joinedActivities", "wantTogether"].forEach(key=> Store.remove(key));

  Store.set("contributorName", payload.from || "Someone");
  Store.set("deviceId", targetId);
  Store.set("roomCode", currentRoomCode());
  Store.set("lastPushedRoomId", currentRoomCode());
  if(Array.isArray(payload.schedule)) Store.set("schedule", payload.schedule.map(a=>({ ...a })));
  if(payload.bingo){
    Store.set("bingoCard", payload.bingo.card || []);
    Store.set("bingoMarked", payload.bingo.marked || []);
    Store.set("bingoLocked", !!payload.bingo.locked);
  }
  if(payload.character) Store.set("myCharacter", { ...payload.character });
  if(payload.status) Store.set("myStatus", { ...payload.status });
  // Only the GROUP activities this identity had already synced come back
  // this way — same limitation as everything else in this function:
  // personal-only data that never left their original device can't be
  // recovered from here.
  if(Array.isArray(payload.activities)) Store.set("activities", payload.activities.map(a=>({ ...a })));
  if(Array.isArray(payload.joinedActivities)) Store.set("joinedActivities", payload.joinedActivities.slice());
  if(Array.isArray(payload.wantTogether)) Store.set("wantTogether", payload.wantTogether.slice());

  // They're "mine" now, not a read-only teammate — drop any cached
  // snapshot under their old personId so they don't also linger as
  // their own separate person-tab right after taking over.
  ["peopleSchedules","peopleBingo","peopleCharacters","peopleLastSeen","peopleStatus","peopleActivities","peopleJoins","peopleWantTogether"].forEach(key=>{
    const map = Store.get(key) || {};
    if(map[targetId]){ delete map[targetId]; Store.set(key, map); }
  });

  recordLastSynced();
  refreshAfterMerge();
  if(typeof syncContributorNameDisplays === "function") syncContributorNameDisplays();
}

// Shared by both the Discover Sync card's controls and Home's own copy
// of them (Home rebuilds its whole card on every renderHomeSyncStatus()
// call, so this gets called fresh each time rather than once at load).
function wireDeviceHandoffControl(nameInputId, btnId, noteId){
  const btn = document.getElementById(btnId);
  const nameInput = document.getElementById(nameInputId);
  if(!btn || !nameInput || !document.getElementById(noteId)) return;
  // Re-queried by ID on every use rather than captured once — Home's
  // copy of this control lives inside #homeSyncStatus, which
  // switchDeviceIdentity() itself causes to fully re-render (via
  // syncContributorNameDisplays() -> renderHomeSyncStatus()) partway
  // through this same handler, which would otherwise detach the
  // originally-captured note/button and silently swallow the final
  // status message.
  const setNote = (text)=>{ const el = document.getElementById(noteId); if(el) el.textContent = text; };
  const setBtnDisabled = (disabled)=>{ const el = document.getElementById(btnId); if(el) el.disabled = disabled; };
  btn.onclick = async ()=>{
    const name = nameInput.value.trim();
    if(!name){ setNote("Type a name first."); return; }
    if(!currentRoomCode()){ setNote("No room code set — check Sync above first."); return; }
    if(!getFirestoreDb()){ setNote("Cloud sync isn't available right now."); return; }
    setBtnDisabled(true);
    setNote("Looking up…");
    try{
      const { matches, error } = await findRoomMembersByName(name);
      if(error){ setNote("Couldn't look that up right now — check your signal and try again."); return; }
      if(!matches.length){ setNote(`No one named "${name}" has synced to this room yet.`); return; }
      // More than one device has synced under this exact name — take
      // whichever pushed most recently, since that's the freshest
      // continuation of "them" to hand this phone off to.
      const chosen = matches.slice().sort((a,b)=> (b.data.updatedAt||0) - (a.data.updatedAt||0))[0];
      const theirName = chosen.data.from || name;
      const seenText = chosen.data.updatedAt ? formatLastSeen(chosen.data.updatedAt) : "a while ago";
      const ok = confirm(
        `Switch this phone to ${theirName}?\n\n` +
        `This WIPES everything currently saved on this device — its own saved artists, notes, meeting point, packing list, bingo card and character — and replaces it with ${theirName}'s last-synced saved artists, bingo card and character (as of ${seenText}).\n\n` +
        `${theirName}'s own private notes, meeting point and packing list can't be recovered this way — those only ever lived on their original phone.\n\n` +
        `Whatever's currently on this phone gets backed up to the cloud automatically first — if that backup fails, nothing is touched and this is cancelled. You'll also be able to switch straight back afterwards.\n\n` +
        `This can't be undone.`
      );
      if(!ok){ setNote("Cancelled — nothing changed."); return; }
      if(!(await backUpCurrentDeviceBeforeSwitch(setNote))) return;
      switchDeviceIdentity(chosen.id, chosen.data);
      setNote(`Done — this phone is now ${theirName}.`);
      const freshInput = document.getElementById(nameInputId);
      if(freshInput) freshInput.value = "";
    }catch(err){
      setNote(`Couldn't switch (${err && err.message ? err.message : "unknown error"}) — check your signal and try again.`);
    }finally{
      setBtnDisabled(false);
    }
  };
}
wireDeviceHandoffControl("handoffNameInput", "handoffSwitchBtn", "handoffStatusNote");

// Shared by the "someone else's phone" switch above and "Switch back"
// below — never proceed with a wipe unless whatever's currently on this
// device (if it has an identity of its own) definitely reached the
// cloud first. Returns true only if it's safe to go ahead and wipe.
async function backUpCurrentDeviceBeforeSwitch(setNote){
  if(!currentContributorName()) return true; // nothing of this device's own to lose
  if(typeof pushToCloud !== "function") return true;
  try{
    await pushToCloud();
    return true;
  }catch(err){
    if(setNote) setNote(`Couldn't back up this phone's current data before switching (${err && err.message ? err.message : "unknown error"}) — check your signal and try again. Nothing has been changed.`);
    return false;
  }
}

// "Switch back" — a one-tap undo for the handoff above, using whatever
// this phone remembered as its own identity right before the last
// switch (see switchDeviceIdentity's previousIdentity write). Reuses
// the exact same lookup-by-name + confirm + backup-then-switch flow,
// just pre-filled instead of typed, and prefers the exact remembered
// deviceId over "whoever's newest under that name" if it's still there.
async function switchBackToPreviousIdentity(setNote){
  const prev = Store.get("previousIdentity");
  if(!prev || !prev.name){ if(setNote) setNote("Nothing to switch back to."); return; }
  if(!currentRoomCode()){ if(setNote) setNote("No room code set — check Sync above first."); return; }
  if(!getFirestoreDb()){ if(setNote) setNote("Cloud sync isn't available right now."); return; }
  if(setNote) setNote("Looking up…");
  try{
    const { matches, error } = await findRoomMembersByName(prev.name);
    if(error){ if(setNote) setNote("Couldn't look that up right now — check your signal and try again."); return; }
    const exact = matches.find(m=> m.id === prev.deviceId);
    const chosen = exact || matches.slice().sort((a,b)=> (b.data.updatedAt||0) - (a.data.updatedAt||0))[0];
    if(!chosen){ if(setNote) setNote(`Couldn't find ${prev.name}'s synced data anymore.`); return; }
    const seenText = chosen.data.updatedAt ? formatLastSeen(chosen.data.updatedAt) : "a while ago";
    const ok = confirm(
      `Switch this phone back to ${prev.name}?\n\n` +
      `This wipes whatever's currently on it and restores ${prev.name}'s last-synced saved artists, bingo card and character (as of ${seenText}).\n\n` +
      `Whatever's currently here gets backed up to the cloud automatically first — if that backup fails, nothing is touched and this is cancelled.`
    );
    if(!ok){ if(setNote) setNote("Cancelled — nothing changed."); return; }
    if(!(await backUpCurrentDeviceBeforeSwitch(setNote))) return;
    switchDeviceIdentity(chosen.id, chosen.data);
    Store.remove("previousIdentity"); // that undo has now been used — nothing further back to offer until the next switch away
    if(setNote) setNote(`Done — this phone is ${prev.name} again.`);
  }catch(err){
    if(setNote) setNote(`Couldn't switch back (${err && err.message ? err.message : "unknown error"}) — check your signal and try again.`);
  }
}

// Shows/hides and wires the "Switch back" box — shared by both the
// Discover card and Home's own copy of it, same pattern as
// wireDeviceHandoffControl above.
function wireSwitchBackControl(boxId, labelId, btnId, noteId){
  const box = document.getElementById(boxId);
  const label = document.getElementById(labelId);
  const btn = document.getElementById(btnId);
  if(!box || !label || !btn) return;
  const prev = Store.get("previousIdentity");
  if(!prev || !prev.name || prev.name === currentContributorName()){
    box.style.display = "none";
    return;
  }
  box.style.display = "";
  label.textContent = prev.name;
  btn.onclick = async ()=>{
    const setNote = (text)=>{ const el = document.getElementById(noteId); if(el) el.textContent = text; };
    btn.disabled = true;
    try{ await switchBackToPreviousIdentity(setNote); }
    finally{ btn.disabled = false; }
  };
}
wireSwitchBackControl("handoffSwitchBackBox", "handoffSwitchBackLabel", "handoffSwitchBackBtn", "handoffStatusNote");

// Shared by the Discover "Sync now" button and Home's own copy of it
// (Home added later so status is visible without a trip to Discover) —
// same behaviour either way, just reporting into whichever button/note
// pair triggered it.
async function runManualSync(btn, note){
  const haveName = !!currentContributorName();
  if(!currentRoomCode()){ if(note) note.textContent = "Type your group's room code above first."; return; }
  if(!getFirestoreDb()){ if(note) note.textContent = "Cloud sync isn't available right now — use the manual code box in Settings instead."; return; }
  if(btn) btn.disabled = true;
  if(note) note.textContent = "Syncing…";
  try{
    // Pulling everyone else's picks never needs your own name — only
    // pushing your own update does, since that's what it gets filed
    // under. So without a name picked yet, this still pulls (you can see
    // synced teammates' tabs straight away), it just can't push you into
    // the room for them to see back.
    //
    // Pull BEFORE push — see autoSyncNow for why: pushing first would
    // overwrite a newer cloud copy of this same identity (e.g. from a
    // device-handoff phone sharing this deviceId) before pull ever got
    // the chance to merge it in via mergeOwnCloudCopy.
    const { stats, count } = await pullFromCloud();
    if(haveName) await pushToCloud();
    recordLastSynced();
    refreshAfterMerge();
    const namePrefix = haveName ? "" : "Pick who you are above to send your own update. ";
    if(!note){ /* no status note in this context — still ran, just nothing to write to */ }
    else if(!count){
      note.textContent = `${namePrefix}${haveName ? "Sent your update. " : ""}No one else's synced to this room code yet.`;
    }else{
      note.textContent = `${namePrefix}Synced with ${count} other device${count===1?"":"s"}: +${stats.clues} district notes, +${stats.characterNotes} character notes, +${stats.theories} theories, +${stats.venues} hidden venues, +${stats.districts} districts visited, +${stats.involved} get-involved ticks, +${stats.socials} socials, +${stats.quotes} journal quotes, +${stats.sightings} live sightings, +${stats.landmarks} landmarks${stats.bingo ? `, ${stats.bingo} bingo card${stats.bingo===1?"":"s"} updated` : ""}${stats.character ? `, ${stats.character} character${stats.character===1?"":"s"} updated` : ""}. Nothing already saved was duplicated.`;
    }
  }catch(err){
    console.error("Cloud sync failed:", err);
    // Include the Firestore error code (e.g. "permission-denied",
    // "resource-exhausted") alongside the message — the message alone
    // has been too vague to tell a rules problem apart from a quota or
    // network one from the outside.
    const codeSuffix = err && err.code ? ` [${err.code}]` : "";
    if(note) note.textContent = `Couldn't sync (${err && err.message ? err.message : "unknown error"}${codeSuffix}) — check you've got signal and try again.`;
  }finally{
    if(btn) btn.disabled = false;
  }
}

const cloudSyncBtn = document.getElementById("cloudSyncBtn");
if(cloudSyncBtn) cloudSyncBtn.onclick = ()=> runManualSync(cloudSyncBtn, document.getElementById("cloudSyncStatusNote"));

// ===============================
// SYNC DIAGNOSTICS — when "Sync now" appears to do nothing at all (not
// even the instant "Syncing…" text), that's not a network problem, it's
// something failing before the normal flow even gets a chance to show
// anything. This runs each step in isolation with its own try/catch and
// prints a plain-text report of exactly which one failed and why —
// completely separate code path from runManualSync, so it can't be
// silently swallowed by whatever's blocking the normal button.
// ===============================
async function runSyncDiagnostics(){
  const box = document.getElementById("syncDiagnosticsResults");
  if(!box) return;
  const lines = [];
  const log = (ok, label, detail)=>{
    lines.push(`${ok ? "✅" : "❌"} ${label}${detail ? " — " + detail : ""}`);
    box.textContent = lines.join("\n");
  };

  log(true, "Diagnostics started", new Date().toLocaleTimeString());

  try{
    const fbLoaded = typeof firebase !== "undefined" && !!firebase.initializeApp;
    log(fbLoaded, "Firebase SDK loaded", fbLoaded ? "" : "firebase is undefined — the CDN scripts (gstatic.com) likely didn't load. Check for a content/ad blocker, VPN, or firewall blocking Google's CDN.");
    if(!fbLoaded) return;
  }catch(err){
    log(false, "Firebase SDK check threw an error", err && err.message);
    return;
  }

  log(navigator.onLine !== false, "Device reports online", `navigator.onLine = ${navigator.onLine}`);

  const room = (typeof currentRoomCode === "function") ? currentRoomCode() : "";
  log(!!room, "Room code set", room || "(empty)");

  const name = (typeof currentContributorName === "function") ? currentContributorName() : "";
  log(!!name, "Name picked", name || "(none — pushing your own update needs this, but pulling doesn't)");

  let db;
  try{
    db = (typeof getFirestoreDb === "function") ? getFirestoreDb() : null;
    log(!!db, "Firestore connection created", db ? "" : "getFirestoreDb() returned null");
    if(!db) return;
  }catch(err){
    log(false, "Firestore connection threw an error", (err && err.message) + (err && err.code ? ` [${err.code}]` : ""));
    return;
  }

  if(name && room){
    try{
      const deviceId = ensureDeviceId();
      const payload = buildSyncPayload();
      payload.updatedAt = Date.now();
      await db.collection("rooms").doc(room).collection("members").doc(deviceId).set(JSON.parse(JSON.stringify(payload)));
      log(true, "Test write to Firestore succeeded", "your data was sent");
    }catch(err){
      log(false, "Test write to Firestore FAILED", `${err && err.message ? err.message : "unknown error"}${err && err.code ? ` [${err.code}]` : ""}`);
      log(true, "This is the real error — screenshot this and send it back");
      return;
    }
  } else {
    log(true, "Skipped test write", "no name/room set");
  }

  try{
    const snap = await db.collection("rooms").doc(room).collection("members").get();
    let count = 0;
    snap.forEach(()=> count++);
    log(true, "Test read from Firestore succeeded", `${count} device${count===1?"":"s"} found in this room`);
  }catch(err){
    log(false, "Test read from Firestore FAILED", `${err && err.message ? err.message : "unknown error"}${err && err.code ? ` [${err.code}]` : ""}`);
    log(true, "This is the real error — screenshot this and send it back");
    return;
  }

  log(true, "All checks passed", "sync itself works from here — if the normal Sync now button still shows no reaction, it's specifically a button/tap issue, not a sync issue. Try tapping directly on the button text.");
}
const syncDiagnosticsBtn = document.getElementById("syncDiagnosticsBtn");
if(syncDiagnosticsBtn) syncDiagnosticsBtn.onclick = ()=>{
  syncDiagnosticsBtn.disabled = true;
  runSyncDiagnostics().finally(()=>{ syncDiagnosticsBtn.disabled = false; });
};
// Home's own "Sync now" button lives inside #homeSyncStatus, which
// renderHomeSyncStatus() fully rebuilds on every call (new name picked,
// after a merge, etc.) — wiring it there, not here, so it's re-attached
// to the fresh button each time instead of going stale.

// ===============================
// BACKUP HISTORY — lists this device's own snapshot history (see
// snapshotBackupIfDue() near pushToCloud, further up this file) and lets
// you step back to one if a sync went wrong. Only ever touches this
// device's own data/own cloud doc — never another teammate's.
// ===============================
async function renderBackupHistoryList(){
  const box = document.getElementById("backupHistoryList");
  const note = document.getElementById("backupHistoryNote");
  if(!box) return;
  if(!getFirestoreDb()){ box.innerHTML = ""; if(note) note.textContent = "Cloud sync isn't available right now."; return; }
  if(note) note.textContent = "Loading…";
  try{
    const backups = await listMyBackups();
    if(!backups.length){
      box.innerHTML = "";
      if(note) note.textContent = "No backups yet — one's taken automatically in the background as you sync (at most once every 20 minutes, and only when something's actually changed), or tap \"Back up now\" to save this exact moment.";
      return;
    }
    const pinnedCount = backups.filter(b=> b.pinned).length;
    if(note) note.textContent = `${backups.length} snapshot${backups.length===1?"":"s"} kept, newest first${pinnedCount ? ` (${pinnedCount} pinned — kept indefinitely, never auto-pruned)` : ""}.`;
    box.innerHTML = backups.map(b=>{
      const d = new Date(b.takenAt);
      const now = new Date();
      const time = d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
      const when = d.toDateString() === now.toDateString() ? `Today, ${time}` : `${d.toLocaleDateString([], { day:"numeric", month:"short" })}, ${time}`;
      return `<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:6px 0; border-bottom:1px solid var(--line);">
        <span>${b.pinned ? "📌 " : ""}${escapeHtml(when)}${b.pinned ? ` <span style="color:var(--text-muted); font-size:11px;">(pinned)</span>` : ""}</span>
        <button class="ghost restoreBackupBtn" data-id="${escapeHtml(b.id)}" style="flex-shrink:0;">Restore this version</button>
      </div>`;
    }).join("");
    box.querySelectorAll(".restoreBackupBtn").forEach(btn=>{
      btn.onclick = async ()=>{
        const id = btn.getAttribute("data-id");
        const d = new Date(Number(id));
        if(!confirm(`Restore your data to how it was at ${d.toLocaleString()}?\n\nThis replaces your notes, theories, finds, bingo card etc. on this device with that snapshot, then pushes it back to the cloud. This can't be undone (though the version you're on now will itself become a backup once you sync again with changed data).`)) return;
        btn.disabled = true;
        if(note) note.textContent = "Restoring…";
        try{
          await restoreBackupSnapshot(id);
          if(note) note.textContent = `Restored to ${d.toLocaleString()} and synced.`;
          renderBackupHistoryList();
        }catch(err){
          console.error("Restore failed:", err);
          if(note) note.textContent = `Couldn't restore (${err && err.message ? err.message : "unknown error"}).`;
        }finally{
          btn.disabled = false;
        }
      };
    });
  }catch(err){
    console.error("Loading backup history failed:", err);
    if(note) note.textContent = `Couldn't load backup history (${err && err.message ? err.message : "unknown error"}).`;
  }
}
const refreshBackupHistoryBtn = document.getElementById("refreshBackupHistoryBtn");
if(refreshBackupHistoryBtn) refreshBackupHistoryBtn.onclick = ()=>{
  refreshBackupHistoryBtn.disabled = true;
  renderBackupHistoryList().finally(()=>{ refreshBackupHistoryBtn.disabled = false; });
};
const takeBackupNowBtn = document.getElementById("takeBackupNowBtn");
if(takeBackupNowBtn) takeBackupNowBtn.onclick = async ()=>{
  const note = document.getElementById("backupHistoryNote");
  takeBackupNowBtn.disabled = true;
  if(note) note.textContent = "Backing up…";
  try{
    await takeManualBackupNow();
    if(note) note.textContent = "Backed up — pinned, kept indefinitely.";
    renderBackupHistoryList();
  }catch(err){
    console.error("Manual backup failed:", err);
    if(note) note.textContent = `Couldn't back up (${err && err.message ? err.message : "unknown error"}).`;
  }finally{
    takeBackupNowBtn.disabled = false;
  }
};

// Auto-sync — on open, every few minutes while the app stays open, and
// whenever it comes back to the foreground (phone locked/backgrounded
// then reopened) — so nobody has to remember to tap "Sync now" or
// reopen the app just to pick up a teammate's latest picks. Pushes your
// own update (once you've picked who you are) AND always pulls everyone
// else's, same as the button does, just automatic. Not silent, though —
// it leaves a one-line note behind so background syncing is still
// visible, not invisible writes to your saved data. The manual button
// stays for an on-demand sync without waiting for the next automatic one.
// Tightened from 3 minutes so a merge (duplicate cleanup, data
// recovery, anything) reliably shows up on everyone else's device
// within 1-2 minutes rather than up to 3. Each pull reads every
// member's doc (see pullFromCloud), so this isn't free — 2 minutes
// (not tighter) keeps daily reads comfortably inside Firestore's free
// tier for a small group even with everyone's app open all festival.
const AUTO_SYNC_INTERVAL_MS = 2 * 60 * 1000;
let _lastAutoSyncAttempt = 0;
function autoSyncNow(trigger){
  if(!currentRoomCode()) return Promise.resolve();
  if(!getFirestoreDb()) return Promise.resolve();
  _lastAutoSyncAttempt = Date.now();
  // Pulling in synced teammates' picks (their Plan tab, Compare, etc.)
  // never needs your own name set — only pushing your own update does,
  // since that's what it gets filed under. So this still runs and still
  // shows you their tabs even before you've picked who you are.
  //
  // Pull BEFORE push, not after — pullFromCloud() also merges in this
  // device's own cloud copy if it's newer (see mergeOwnCloudCopy: a
  // device-handoff phone deliberately shares the original owner's
  // deviceId, so it can push newer picks under that same id). Pushing
  // first would overwrite that newer cloud copy with this device's own
  // stale local state before pull ever got a chance to merge it in,
  // permanently losing whatever the other device had added.
  const haveName = !!currentContributorName();
  return pullFromCloud().then(({ stats, count })=> (haveName ? pushToCloud() : Promise.resolve()).then(()=> ({ stats, count }))).then(({ stats, count })=>{
    recordLastSynced();
    const note = document.getElementById("cloudSyncStatusNote");
    const prefix = haveName ? `Auto-synced (${trigger}): sent your update, ` : `Auto-synced (${trigger}, pick who you are above to send your own update): `;
    if(!count){
      if(note) note.textContent = haveName ? `Auto-synced your update (${trigger}). No one else's synced to this room code yet.` : "No one else's synced to this room code yet.";
      return;
    }
    refreshAfterMerge();
    if(note){
      const total = Object.values(stats).reduce((a,b)=>a+b, 0);
      note.textContent = total
        ? `${prefix}picked up ${total} new item${total===1?"":"s"} from ${count} other device${count===1?"":"s"}.`
        : `${prefix}up to date with ${count} other device${count===1?"":"s"}, nothing new from them.`;
    }
  }).catch(err=>{
    console.error("Auto-sync failed:", err);
    // Auto-sync failures used to stay completely silent in the UI —
    // reasonable for "no signal right now," but it meant a persistent
    // problem (like a rules mismatch) could run silently in the
    // background forever with nothing to go on except "sync just
    // doesn't seem to work." Surface it the same way a manual Sync now
    // failure shows, so it's visible without needing to tap the button.
    const note = document.getElementById("cloudSyncStatusNote");
    if(note){
      const codeSuffix = err && err.code ? ` [${err.code}]` : "";
      note.textContent = `Auto-sync failed (${err && err.message ? err.message : "unknown error"}${codeSuffix}).`;
    }
  });
}
autoSyncNow("on open");
setInterval(()=> autoSyncNow("periodic"), AUTO_SYNC_INTERVAL_MS);
document.addEventListener("visibilitychange", ()=>{
  // Guard against firing right on top of the interval or another
  // just-happened attempt (e.g. rapid tab switching) — only worth a
  // fresh pull if it's actually been a while.
  if(document.visibilityState === "visible" && Date.now() - _lastAutoSyncAttempt > 60000){
    // A home-screen "added to icon" app can stay suspended in the
    // background for a long time without ever fully closing — unlike a
    // browser tab, which tends to get reloaded from scratch far more
    // often. That means it can keep running an OLD in-memory copy of
    // this exact script, silently missing whatever bugs got fixed since
    // it was last actually loaded, even though the page looks "open"
    // and its data sync still runs. Re-checking for a newer version
    // every time it's foregrounded (not just on first load or an
    // explicit pull-to-refresh) catches that — same one-tap-to-refresh
    // pill behaviour as the initial load check.
    if(typeof checkForStaleCopy === "function") checkForStaleCopy();
    autoSyncNow("welcome back");
  }
});

// ===============================
// LOCAL CHAT — group + 1:1 messaging for the same small friend group as
// the rest of sync, riding on the same no-auth Firestore room
// (rooms/medway-massive) but in its own chatMessages/chatPresence
// collections rather than the per-member sync doc, since a message is an
// append-only event, not a single per-device snapshot that gets replaced
// wholesale. Real-time (onSnapshot), not polled like the rest of
// sync — a 2-minute delay is fine for a schedule, not for a chat you
// just hit send on. Firestore's offline persistence (enabled once, up
// top, in getFirestoreDb()) already queues writes made offline and sends
// them the moment signal returns, so sending offline needs no extra
// outbox code here — it just shows optimistically from the local cache.
//
// Same trust model as the rest of this app: there's no login, so a "DM"
// here is private only by UI convention (not shown to anyone else in the
// app), not cryptographically private — anyone who has the room code
// could read the raw Firestore data. Fine for a small trusted friend
// group, worth knowing if you ever say something you wouldn't want a
// stranger with the code to see.
//
// Most of the const/let below is declared here, not further up the file,
// since nothing earlier in this file's load-time (synchronous, top-level)
// call chain reaches it — this feature is otherwise self-contained and
// only ever called from its own init calls at the bottom of this block,
// its own onSnapshot callbacks, or DOM event handlers wired within it.
// Three exceptions — CHAT_THREAD_GROUP, chatMessagesCache and
// chatPresenceCache — are declared up near the top of the file instead;
// see the comment up there for why (a since-removed Home feature used to
// reach them via totalUnreadCount() at load time).
// See CLAUDE.md's TDZ rule for why that check matters here.
// ===============================
const CHAT_HEARTBEAT_MS = 90 * 1000;
const CHAT_ONLINE_MS = 150 * 1000; // a bit over one missed heartbeat before flipping to "offline"
const CHAT_MESSAGE_FETCH_LIMIT = 500;
const CHAT_PRUNE_KEEP = 300;
const CHAT_PRUNE_MIN_INTERVAL_MS = 30 * 60 * 1000;
// See notifyNewChatMessage()/toggleChatNotifications() further down —
// foreground/backgrounded-tab only, same constraint as everywhere else
// in this app: a static GitHub Pages site with no server holding VAPID/
// FCM keys can't wake a genuinely closed tab, so this only fires while
// this tab or installed PWA's own JS is still alive to receive the live
// onSnapshot update that triggers it.
const CHAT_NOTIFY_KEY = "chatNotificationsEnabled";

let chatOpenThread = null; // null = showing the thread list; else the open thread's id
let chatOpenThreadLabel = null;
let chatMessagesUnsub = null;
let chatPresenceUnsub = null;
let chatHeartbeatTimer = null;

// Deterministic regardless of who opens the DM first — sorted, lowercased
// names, not deviceIds, so the same two people always land in the same
// thread even across a reinstall (new deviceId) or a device-handoff,
// same "identity is a name, not a device" model as friendStatusEntries.
function dmThreadId(nameA, nameB){
  const norm = n=> (n || "").trim().toLowerCase();
  return "dm:" + [norm(nameA), norm(nameB)].sort().join("|");
}

// Everyone chat's aware of: the fixed roster plus anyone actually seen
// syncing under a different (e.g. "Other…") name — same name-is-identity
// source as friendStatusEntries, so the chat contact list and the
// "Where's everyone?" list never disagree about who's in the group.
function chatContactNames(){
  const names = new Set(KNOWN_CONTRIBUTORS);
  const peopleStatus = Store.get("peopleStatus") || {};
  const peopleLastSeen = Store.get("peopleLastSeen") || {};
  Object.values(peopleStatus).forEach(s=>{ if(s && s.displayName) names.add(s.displayName); });
  Object.values(peopleLastSeen).forEach(s=>{ if(s && s.displayName) names.add(s.displayName); });
  Object.values(chatPresenceCache).forEach(p=>{ if(p && p.displayName) names.add(p.displayName); });
  const me = currentContributorName();
  if(me) names.delete(me);
  return [...names].sort((a,b)=> a.localeCompare(b));
}

function allMyThreadIds(){
  const me = currentContributorName();
  const ids = [CHAT_THREAD_GROUP];
  if(me) chatContactNames().forEach(n=> ids.push(dmThreadId(me, n)));
  return ids;
}

function presenceForName(name){
  const norm = (name || "").trim().toLowerCase();
  let latest = 0;
  Object.values(chatPresenceCache).forEach(p=>{
    if(p && (p.displayName || "").trim().toLowerCase() === norm) latest = Math.max(latest, p.lastActiveAt || 0);
  });
  return latest;
}
function isOnline(name){
  const ts = presenceForName(name);
  return !!ts && (Date.now() - ts) < CHAT_ONLINE_MS;
}
function myReadTs(thread){
  const mine = chatPresenceCache[ensureDeviceId()];
  return (mine && mine.reads && mine.reads[thread]) || 0;
}
// Newest read timestamp for `thread` among every device synced under
// `name` other than this one — mirrors presenceForName's per-name
// dedup, so a read receipt isn't fooled by someone's old/duplicate
// deviceId lagging behind their current one.
function otherReadTs(thread, name){
  const norm = (name || "").trim().toLowerCase();
  const me = ensureDeviceId();
  let latest = 0;
  Object.entries(chatPresenceCache).forEach(([id, p])=>{
    if(id === me) return;
    if(p && (p.displayName || "").trim().toLowerCase() === norm) latest = Math.max(latest, (p.reads && p.reads[thread]) || 0);
  });
  return latest;
}

function threadMessages(thread){
  return chatMessagesCache.filter(m=> m.thread === thread).sort((a,b)=> a.ts - b.ts);
}
function unreadCountForThread(thread){
  const readTs = myReadTs(thread);
  const me = ensureDeviceId();
  return chatMessagesCache.filter(m=> m.thread === thread && m.fromDeviceId !== me && m.ts > readTs).length;
}
function totalUnreadCount(){
  return allMyThreadIds().reduce((sum, t)=> sum + unreadCountForThread(t), 0);
}

function renderChatUnreadBadge(){
  const badge = document.getElementById("chatUnreadBadge");
  if(!badge) return;
  const n = totalUnreadCount();
  if(n > 0){ badge.textContent = n > 99 ? "99+" : String(n); badge.style.display = ""; }
  else badge.style.display = "none";
}

// Marks everything in `thread` read as of right now, both locally
// (instant badge/UI feedback) and on this device's own presence doc, so
// the read receipt reaches whoever's on the other end of a DM. Uses a
// dotted-field merge (only the one thread's key inside `reads`), not a
// full-document overwrite — never clobbers another thread's read
// timestamp, or the displayName/lastActiveAt the heartbeat wrote.
function markThreadRead(thread){
  const db = getFirestoreDb();
  const room = currentRoomCode();
  if(!db || !room) return;
  const deviceId = ensureDeviceId();
  const now = Date.now();
  const mine = chatPresenceCache[deviceId] || {};
  mine.reads = { ...(mine.reads || {}), [thread]: now };
  chatPresenceCache[deviceId] = mine;
  renderChatUnreadBadge();
  const docRef = db.collection("rooms").doc(room).collection("chatPresence").doc(deviceId);
  // FieldPath, not a "reads.<thread>" dotted string — a thread id can be
  // a custom "Other…" name a friend typed in (dmThreadId), and if that
  // name ever contained a literal "." a dotted string would misread it
  // as a deeper nested path and corrupt sibling threads' read receipts.
  // FieldPath takes each segment literally, with no such ambiguity.
  const fieldPath = (typeof firebase !== "undefined" && firebase.firestore && firebase.firestore.FieldPath)
    ? new firebase.firestore.FieldPath("reads", thread)
    : null;
  const fallback = ()=> docRef.set({ reads: { [thread]: now } }, { merge: true }).catch(()=>{});
  // update() fails outright if the doc doesn't exist yet (no heartbeat
  // sent yet this session) — falls back to a merge-set, which is safe
  // there since a brand-new doc has no sibling read keys to protect.
  (fieldPath ? docRef.update(fieldPath, now).catch(fallback) : fallback());
  // best-effort throughout — a missed read receipt just shows as unread
  // a little longer next time, never worth surfacing an error for.
}

async function sendChatMessage(thread, text){
  const trimmed = (text || "").trim();
  if(!trimmed) return;
  const db = getFirestoreDb();
  const room = currentRoomCode();
  const name = currentContributorName();
  if(!db || !room || !name) throw new Error("Pick who you are (Settings → Sync) before chatting.");
  const deviceId = ensureDeviceId();
  await db.collection("rooms").doc(room).collection("chatMessages").add({
    thread, text: trimmed.slice(0, 2000), fromName: name, fromDeviceId: deviceId, ts: Date.now()
  });
  markThreadRead(thread);
  pruneChatThreadIfNeeded(thread).catch(err=> console.warn("Chat prune failed (non-fatal):", err));
}

// Keeps each thread's history bounded so a chatty festival weekend can't
// quietly run past Firestore's free-tier reads — cheap on purpose:
// throttled to at most once per CHAT_PRUNE_MIN_INTERVAL_MS (checked
// against a local timestamp, no read needed) and only even considers
// pruning off the messages this device already has cached locally from
// the live listener, no extra query.
async function pruneChatThreadIfNeeded(thread){
  const now = Date.now();
  const lastPrune = Store.get("lastChatPruneAt") || 0;
  if(now - lastPrune < CHAT_PRUNE_MIN_INTERVAL_MS) return;
  const msgs = threadMessages(thread);
  if(msgs.length <= CHAT_PRUNE_KEEP) return;
  Store.set("lastChatPruneAt", now);
  const db = getFirestoreDb();
  const room = currentRoomCode();
  if(!db || !room) return;
  const toDelete = msgs.slice(0, msgs.length - CHAT_PRUNE_KEEP);
  const col = db.collection("rooms").doc(room).collection("chatMessages");
  await Promise.all(toDelete.map(m=> col.doc(m.id).delete().catch(()=>{})));
}

function sendChatHeartbeat(){
  const db = getFirestoreDb();
  const room = currentRoomCode();
  const name = currentContributorName();
  if(!db || !room || !name) return;
  const deviceId = ensureDeviceId();
  db.collection("rooms").doc(room).collection("chatPresence").doc(deviceId)
    .set({ displayName: name, lastActiveAt: Date.now() }, { merge: true })
    .catch(()=>{});
}

// CHAT NOTIFICATIONS — two layers behind the one CHAT_NOTIFY_KEY toggle.
// This local Notification API path only ever fires while the tab/PWA is
// actually running (foreground or merely backgrounded) — reliable on
// Android Chrome, best-effort on iOS Safari, which suspends background
// web content aggressively. registerPushToken()/unregisterPushToken()
// (further down) layer real Web Push (FCM) on top of the same toggle,
// which — via the sendChatPush Cloud Function (functions/index.js) —
// reaches the lock screen even with the app fully closed. That half
// needs the Blaze (pay-as-you-go) plan for Cloud Functions; this local
// path works regardless and is the fallback if push isn't available.
function chatNotificationsSupported(){
  return typeof Notification !== "undefined";
}
function chatNotificationsEnabled(){
  return chatNotificationsSupported() && Notification.permission === "granted" && !!Store.get(CHAT_NOTIFY_KEY);
}
// Web Push (FCM) registration — the actual lock-screen/closed-app
// delivery path, layered on top of the same CHAT_NOTIFY_KEY toggle that
// already controls the foreground-only Notification API path below.
// Registering just gets a per-device push token from FCM and saves it
// to Firestore so the sendChatPush Cloud Function (functions/index.js)
// can address this device — nothing here decides who gets notified;
// sending is entirely server-side via the Admin SDK, never a client
// write reaching anyone else's device directly. Best-effort throughout:
// a browser without Messaging support, no service worker, or Firestore
// unreachable just means this device falls back to foreground-only
// notifications, same as before this existed.
async function registerPushToken(){
  if(typeof firebase === "undefined" || !firebase.messaging || !("serviceWorker" in navigator)) return;
  const db = getFirestoreDb();
  if(!db) return;
  try{
    const reg = await navigator.serviceWorker.ready;
    const token = await firebase.messaging().getToken({ vapidKey: FCM_VAPID_KEY, serviceWorkerRegistration: reg });
    if(!token) return;
    const deviceId = ensureDeviceId();
    await db.collection("rooms").doc(currentRoomCode()).collection("pushTokens").doc(deviceId).set({
      deviceId, token, displayName: currentContributorName() || "", updatedAt: Date.now()
    });
  }catch(err){
    console.warn("Push token registration failed (non-fatal — falls back to foreground-only notifications):", err && err.message);
  }
}
async function unregisterPushToken(){
  const db = getFirestoreDb();
  if(!db) return;
  try{
    await db.collection("rooms").doc(currentRoomCode()).collection("pushTokens").doc(ensureDeviceId()).delete();
  }catch(err){
    console.warn("Push token cleanup failed (non-fatal):", err && err.message);
  }
}

// Must be called from a user gesture (a click), since requestPermission()
// silently no-ops outside one on most browsers — the bell toggle in
// renderChatThreadList's head is that gesture.
async function toggleChatNotifications(){
  if(!chatNotificationsSupported()) return false;
  if(Store.get(CHAT_NOTIFY_KEY)){
    Store.set(CHAT_NOTIFY_KEY, false);
    unregisterPushToken();
    return false;
  }
  const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  Store.set(CHAT_NOTIFY_KEY, perm === "granted");
  if(perm === "granted") registerPushToken();
  return perm === "granted";
}

// Settings' own notifications card — a second way to reach the exact
// same toggle as the 🔔 icon inside Chat (renderChatThreadList's
// chatNotifyBtn), not a separate setting, so the two can never disagree.
function renderSettingsNotifyBtn(){
  const btn = document.getElementById("settingsNotifyBtn");
  const note = document.getElementById("settingsNotifyNote");
  if(!btn) return;
  if(!chatNotificationsSupported()){
    btn.disabled = true;
    btn.textContent = "🔕 Not supported on this browser";
    return;
  }
  const on = chatNotificationsEnabled();
  btn.disabled = false;
  btn.textContent = on ? "🔔 Notifications on — tap to turn off" : "🔕 Notifications off — tap to turn on";
  if(note) note.textContent = "Reaches your lock screen even with the app fully closed, on devices/browsers that support it.";
}
(function wireSettingsNotifyBtn(){
  const btn = document.getElementById("settingsNotifyBtn");
  if(!btn) return;
  btn.onclick = ()=> toggleChatNotifications().then(()=>{
    if(!Notification || Notification.permission !== "denied"){ renderSettingsNotifyBtn(); return; }
    alert("Notifications are blocked for this site in your browser settings — allow them there, then try again.");
    renderSettingsNotifyBtn();
  });
  renderSettingsNotifyBtn();
})();
function notifyNewChatMessage(msg){
  if(!chatNotificationsEnabled()) return;
  if(msg.thread === chatOpenThread && document.getElementById("chatPanel")) return; // already looking at this exact thread
  const title = msg.thread === CHAT_THREAD_GROUP ? `${msg.fromName} (Everyone)` : msg.fromName;
  const body = (msg.text || "").slice(0, 200);
  const show = ()=>{
    try{ new Notification(title, { body }); }catch(err){ /* best-effort — never worth surfacing an error for a missed notification */ }
  };
  if(navigator.serviceWorker && navigator.serviceWorker.ready){
    navigator.serviceWorker.ready
      .then(reg=> reg.showNotification(title, { body, tag: "chat-" + msg.thread, icon: "./icons/icon-192.png" }))
      .catch(show);
  } else {
    show();
  }
}

function startChatListeners(){
  const db = getFirestoreDb();
  const room = currentRoomCode();
  if(!db || !room || chatMessagesUnsub) return;
  // True only for this listener's very first snapshot (the initial full
  // fetch) — every doc in it reports as docChanges() type "added" just
  // like a genuinely new message would, so without this a fresh
  // openChatPanel()/app-load would fire a notification for every
  // existing message in the room all at once.
  let firstMessagesSnapshot = true;
  chatMessagesUnsub = db.collection("rooms").doc(room).collection("chatMessages")
    .orderBy("ts", "desc").limit(CHAT_MESSAGE_FETCH_LIMIT)
    .onSnapshot(snap=>{
      if(!firstMessagesSnapshot){
        const myId = ensureDeviceId();
        snap.docChanges().forEach(change=>{
          if(change.type === "added" && change.doc.data().fromDeviceId !== myId) notifyNewChatMessage(change.doc.data());
        });
      }
      firstMessagesSnapshot = false;
      chatMessagesCache = snap.docs.map(d=> ({ id: d.id, ...d.data() }));
      renderChatUnreadBadge();
      if(chatOpenThread){
        renderChatMessagesOnly();
        if(unreadCountForThread(chatOpenThread) > 0) markThreadRead(chatOpenThread);
      } else if(document.getElementById("chatPanel")){
        renderChatThreadList();
      }
    }, err=> console.warn("Chat message listener failed:", err && err.code));
  chatPresenceUnsub = db.collection("rooms").doc(room).collection("chatPresence")
    .onSnapshot(snap=>{
      const next = {};
      snap.forEach(d=> next[d.id] = d.data());
      chatPresenceCache = next;
      renderChatUnreadBadge();
      if(document.getElementById("chatPanel")){
        // Never renderChatThreadShell() here — a heartbeat from ANY of up
        // to ~10 people lands roughly every CHAT_HEARTBEAT_MS/groupSize
        // seconds, and used to fully rebuild the open thread's <form>
        // (including the message <input>) on every single one of those,
        // silently wiping out whatever someone was mid-typing and
        // dropping keyboard focus. Only the messages/read-receipt area
        // updates here; the compose box is untouched.
        if(chatOpenThread) renderChatMessagesOnly(); else renderChatThreadList();
      }
    }, err=> console.warn("Chat presence listener failed:", err && err.code));
}
function stopChatListeners(){
  if(chatMessagesUnsub){ chatMessagesUnsub(); chatMessagesUnsub = null; }
  if(chatPresenceUnsub){ chatPresenceUnsub(); chatPresenceUnsub = null; }
}

function chatThreadSummary(thread){
  const msgs = threadMessages(thread);
  const last = msgs[msgs.length - 1];
  return last ? { text: last.text, ts: last.ts, mine: last.fromDeviceId === ensureDeviceId() } : null;
}

// Small, muted "location last set" + "Last online" line — same data
// friendStatusEntries() already tracks for the "Where's everyone?"
// status feature (including "Last online", the exact same term/value
// used there — entry.lastSyncedTs — so this doesn't introduce a second,
// differently-worded concept for the same thing). Shared by the
// thread-list row and the open DM header (chatOpenThreadLabel side) so
// the two stay consistent. Returns "" (renders nothing) rather than a
// placeholder when neither piece has ever been set, so a brand-new
// contact's row/header doesn't carry a permanent empty line.
function chatLocationLineHtml(name){
  if(!name) return "";
  const entry = friendStatusEntries().find(e=> (e.displayName || "").trim().toLowerCase() === name.trim().toLowerCase());
  if(!entry) return "";
  const parts = [];
  if(entry.place){
    const when = entry.updatedAt ? formatLastSeen(entry.updatedAt) : "a while ago";
    parts.push(`📍 ${escapeHtml(entry.place)} · set ${escapeHtml(when)}`);
  }
  if(entry.lastSyncedTs) parts.push(`Last online ${escapeHtml(formatLastSeen(entry.lastSyncedTs))}`);
  return parts.join(" · ");
}

function chatThreadRowHtml(t){
  const onlineDot = t.online === null ? "" : `<span class="chat-online-dot${t.online ? " online" : ""}"></span>`;
  const timeLabel = t.ts ? formatLastSeen(t.ts) : "";
  return `
    <div class="chat-thread-row" data-chat-thread="${escapeHtml(t.id)}" data-chat-label="${escapeHtml(t.label)}">
      <span class="chat-thread-icon">${t.icon}</span>
      <span class="chat-thread-main">
        <span class="chat-thread-name">${onlineDot}${escapeHtml(t.label)}</span>
        ${t.loc ? `<span class="chat-thread-location">${t.loc}</span>` : ""}
        <span class="chat-thread-sub">${t.sub}</span>
      </span>
      <span class="chat-thread-meta">
        ${timeLabel ? `<span class="chat-thread-time">${escapeHtml(timeLabel)}</span>` : ""}
        ${t.unread ? `<span class="chat-unread-pill">${t.unread}</span>` : ""}
      </span>
    </div>`;
}

function renderChatThreadList(){
  const card = document.querySelector("#chatPanel .chat-panel-card");
  if(!card) return;
  const me = currentContributorName();
  const groupSummary = chatThreadSummary(CHAT_THREAD_GROUP);
  const rows = [chatThreadRowHtml({
    id: CHAT_THREAD_GROUP, label: "Everyone", icon: "👥",
    sub: groupSummary ? `${groupSummary.mine ? "You: " : ""}${escapeHtml(groupSummary.text)}` : "Say hi to the group",
    ts: groupSummary ? groupSummary.ts : null, unread: unreadCountForThread(CHAT_THREAD_GROUP), online: null, loc: ""
  })];
  if(me){
    chatContactNames().forEach(name=>{
      const thread = dmThreadId(me, name);
      const summary = chatThreadSummary(thread);
      rows.push(chatThreadRowHtml({
        id: thread, label: name, icon: personDotHtml(name),
        // The last-message preview used to be the ONLY thing shown here
        // once a thread had any messages, silently replacing the
        // location line entirely — now they're two separate lines, so
        // location stays visible however active the conversation is.
        sub: summary ? `${summary.mine ? "You: " : ""}${escapeHtml(summary.text)}` : "No messages yet — say hi",
        ts: summary ? summary.ts : null, unread: unreadCountForThread(thread), online: isOnline(name),
        loc: chatLocationLineHtml(name)
      }));
    });
  }
  const notifySupported = chatNotificationsSupported();
  const notifyOn = chatNotificationsEnabled();
  card.innerHTML = `
    <div class="chat-panel-head">
      <span class="chat-panel-head-title"><strong>Chat</strong></span>
      ${notifySupported ? `<button type="button" class="chat-close-btn" id="chatNotifyBtn" aria-label="${notifyOn ? "Turn off message notifications" : "Turn on message notifications"}" title="${notifyOn ? "Notifications on — reaches your lock screen" : "Notifications off"}">${notifyOn ? "🔔" : "🔕"}</button>` : ""}
      <button type="button" class="chat-close-btn" id="chatCloseBtn" aria-label="Close chat">✕</button>
    </div>
    <div class="chat-thread-list">${rows.join("")}</div>
    ${!me ? `<p class="empty-note" style="padding:0 16px 14px;">Pick who you are in Settings → Sync to start 1:1 chats — you can still read and send in Everyone without it.</p>` : ""}
  `;
  document.getElementById("chatCloseBtn").onclick = closeChatPanel;
  const notifyBtn = document.getElementById("chatNotifyBtn");
  if(notifyBtn) notifyBtn.onclick = ()=> toggleChatNotifications().then(()=>{
    if(!Notification || Notification.permission !== "denied") { renderChatThreadList(); return; }
    alert("Notifications are blocked for this site in your browser settings — allow them there, then try again.");
    renderChatThreadList();
  });
  card.querySelectorAll("[data-chat-thread]").forEach(row=>{
    row.onclick = ()=> openChatThread(row.getAttribute("data-chat-thread"), row.getAttribute("data-chat-label"));
  });
}

function chatReadReceiptLine(thread, msgs, isGroup){
  const me = ensureDeviceId();
  const lastMine = [...msgs].reverse().find(m=> m.fromDeviceId === me);
  if(!lastMine) return "";
  if(isGroup){
    const seenBy = chatContactNames().filter(name=> otherReadTs(thread, name) >= lastMine.ts);
    return seenBy.length ? `<div class="chat-read-receipt">Seen by ${escapeHtml(seenBy.join(", "))}</div>` : "";
  }
  const read = otherReadTs(thread, chatOpenThreadLabel) >= lastMine.ts;
  return `<div class="chat-read-receipt">${read ? "Read" : "Sent"}</div>`;
}

function openChatThread(thread, label){
  chatOpenThread = thread;
  chatOpenThreadLabel = label;
  renderChatThreadShell();
  markThreadRead(thread);
}

// Full rebuild of the open thread's card — head, messages, AND the
// compose form. Only ever called when actually opening or switching
// threads (openChatThread), never from a live snapshot update, since
// recreating the <input> mid-draft would wipe whatever's been typed and
// drop keyboard focus. See renderChatMessagesOnly for the update path
// that's safe to call on every message/presence change.
function renderChatThreadShell(){
  const card = document.querySelector("#chatPanel .chat-panel-card");
  if(!card || !chatOpenThread) return;
  const thread = chatOpenThread;
  const isGroup = thread === CHAT_THREAD_GROUP;
  card.innerHTML = `
    <div class="chat-panel-head">
      <button type="button" class="chat-back-btn" id="chatBackBtn" aria-label="Back to chats">←</button>
      <span class="chat-panel-head-title">
        <strong>${escapeHtml(chatOpenThreadLabel || "Chat")}</strong>
        <span class="chat-panel-head-sub" id="chatHeadSub">${isGroup ? "" : chatLocationLineHtml(chatOpenThreadLabel)}</span>
      </span>
      <button type="button" class="chat-close-btn" id="chatCloseBtn" aria-label="Close chat">✕</button>
    </div>
    <div class="chat-messages" id="chatMessagesBox"></div>
    <form class="chat-input-row" id="chatSendForm">
      <input type="text" id="chatMessageInput" placeholder="Message…" autocomplete="off" maxlength="2000">
      <button type="submit" class="action" id="chatSendBtn">Send</button>
    </form>
  `;
  document.getElementById("chatCloseBtn").onclick = closeChatPanel;
  document.getElementById("chatBackBtn").onclick = ()=>{ chatOpenThread = null; chatOpenThreadLabel = null; renderChatThreadList(); };
  const form = document.getElementById("chatSendForm");
  const input = document.getElementById("chatMessageInput");
  form.onsubmit = async (e)=>{
    e.preventDefault();
    if(!input.value.trim()) return;
    const text = input.value;
    input.value = "";
    try{ await sendChatMessage(thread, text); }
    catch(err){
      input.value = text;
      alert(err && err.message ? err.message : "Couldn't send — check you've got signal and try again.");
    }
  };
  renderChatMessagesOnly();
}

// Updates just the bubbles + read-receipt line inside the already-open
// thread — safe to call from a live onSnapshot callback, unlike
// renderChatThreadShell above, because it never touches the compose
// <form>/<input>. Without this split, a heartbeat from any one of up to
// ~10 people (roughly every CHAT_HEARTBEAT_MS/group-size seconds), or
// someone else simply opening the same DM thread (their own
// markThreadRead write), landed on the chatPresence listener and forced
// a full rebuild of the open thread — wiping out a draft mid-typing,
// dropping keyboard focus, and (since the whole card was torn down and
// rebuilt) visually looking like the chat had closed and reopened.
// Only auto-scrolls to the bottom if the reader was already near it, so
// this also doesn't yank someone back down while they're scrolled up
// reading older messages.
function renderChatMessagesOnly(){
  if(!chatOpenThread) return;
  const box = document.getElementById("chatMessagesBox");
  if(!box) return;
  const thread = chatOpenThread;
  const msgs = threadMessages(thread);
  const me = ensureDeviceId();
  const isGroup = thread === CHAT_THREAD_GROUP;
  const bubbles = msgs.map(m=>{
    const mine = m.fromDeviceId === me;
    return `<div class="chat-bubble-row${mine ? " mine" : ""}">
      <div class="chat-bubble">
        ${!mine && isGroup ? `<span class="chat-bubble-name">${escapeHtml(m.fromName)}</span>` : ""}
        <span class="chat-bubble-text">${escapeHtml(m.text)}</span>
        <span class="chat-bubble-time">${new Date(m.ts).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}</span>
      </div>
    </div>`;
  }).join("");
  const wasNearBottom = (box.scrollHeight - box.scrollTop - box.clientHeight) < 80;
  box.innerHTML = bubbles || `<p class="empty-note" style="padding:14px;">No messages yet — say hi.</p>`;
  box.insertAdjacentHTML("beforeend", chatReadReceiptLine(thread, msgs, isGroup));
  if(wasNearBottom) box.scrollTop = box.scrollHeight;
  // Keeps the header's small location/last-seen line fresh too (e.g. the
  // other person updates their status while this thread's open) — a
  // plain innerHTML swap on one small span, never touching the close/
  // back buttons or the compose form, so it can't reintroduce the
  // draft-wiping bug this same render split fixed.
  const headSub = document.getElementById("chatHeadSub");
  if(headSub && !isGroup) headSub.innerHTML = chatLocationLineHtml(chatOpenThreadLabel);
}

function openChatPanel(){
  closeChatPanel();
  const backdrop = document.createElement("div");
  backdrop.id = "chatPanel";
  backdrop.style.cssText = "position:fixed; inset:0; z-index:70; background:rgba(5,10,8,.78); display:flex; align-items:flex-end; justify-content:center;";
  backdrop.innerHTML = `<div class="card chat-panel-card" style="width:100%; max-width:520px; height:88vh; max-height:88vh; margin:0; border-radius:20px 20px 0 0; padding:0;"></div>`;
  backdrop.onclick = (e)=>{ if(e.target === backdrop) closeChatPanel(); };
  document.body.appendChild(backdrop);
  startChatListeners();
  sendChatHeartbeat();
  renderChatThreadList();
}
function closeChatPanel(){
  const el = document.getElementById("chatPanel");
  if(el) el.remove();
  chatOpenThread = null;
  chatOpenThreadLabel = null;
}

function initChat(){
  const chatOpenBtn = document.getElementById("chatOpenBtn");
  if(chatOpenBtn) chatOpenBtn.onclick = openChatPanel;
  if(!getFirestoreDb()) return; // Firebase CDN didn't load (offline first visit, etc.) — chat just no-ops this session, same graceful fallback as the rest of cloud sync
  startChatListeners();
  sendChatHeartbeat();
  chatHeartbeatTimer = setInterval(sendChatHeartbeat, CHAT_HEARTBEAT_MS);
  // Re-registers (rather than re-prompts) on every load for anyone who's
  // already granted permission — FCM tokens can rotate/expire, and this
  // keeps Firestore's copy current without needing another click.
  if(chatNotificationsEnabled()) registerPushToken();
}
initChat();

// Pauses the live listeners and heartbeat while the tab/app is backgrounded
// (battery/data — a chat sheet nobody's looking at doesn't need to stay
// subscribed) and resumes them on return, mirroring autoSyncNow's own
// visibilitychange handling above but kept separate since chat's restart
// logic (listeners + heartbeat, not a one-shot pull) is different enough
// not to share a handler cleanly.
document.addEventListener("visibilitychange", ()=>{
  if(document.visibilityState === "visible"){
    startChatListeners();
    sendChatHeartbeat();
    if(!chatHeartbeatTimer) chatHeartbeatTimer = setInterval(sendChatHeartbeat, CHAT_HEARTBEAT_MS);
  }else{
    stopChatListeners();
    if(chatHeartbeatTimer){ clearInterval(chatHeartbeatTimer); chatHeartbeatTimer = null; }
  }
});

// ===============================
// YOUR CHARACTER BUILDER — a persona to introduce yourself to actors
// with, distinct from the in-fiction Characters & Factions roster below.
// ===============================
// "mine" is always this device's own myCharacter — the only one that's
// ever editable. Anything else is a name key into peopleCharacters, a
// read-only snapshot from a teammate's sync. Switching tabs never
// copies, merges, or overwrites one into the other.
let myCharacterActiveOwner = "mine";
let charFormForcedOpen = false;

function myCharacterPeopleNames(){
  const people = Store.get("peopleCharacters") || {};
  return Object.keys(people)
    .filter(id=> people[id] && people[id].name)
    .sort((a,b)=> personDisplayName(people[a], a).localeCompare(personDisplayName(people[b], b)));
}

function renderMyCharacterPersonTabs(){
  const box = document.getElementById("charPersonTabs");
  if(!box) return;
  const people = Store.get("peopleCharacters") || {};
  const personIds = myCharacterPeopleNames();
  if(personIds.length === 0){
    box.style.display = "none";
    myCharacterActiveOwner = "mine";
    return;
  }
  box.style.display = "";
  box.className = "tabstrip";
  box.innerHTML = `<button class="${myCharacterActiveOwner==="mine"?"active":""}" data-owner="mine">⭐ Mine</button>` +
    personIds.map(id=>`<button class="person ${myCharacterActiveOwner===id?"active":""}" data-owner="${escapeHtml(id)}">${escapeHtml(personDisplayName(people[id], id))}</button>`).join("");
  box.querySelectorAll("button").forEach(btn=>{
    btn.onclick = ()=>{
      myCharacterActiveOwner = btn.dataset.owner;
      renderMyCharacterPersonTabs();
      renderMyCharacter();
    };
  });
}

function renderMyCharacter(){
  const box = document.getElementById("charCardDisplay");
  const formFields = document.getElementById("charFormFields");
  if(!box) return;

  if(myCharacterActiveOwner !== "mine"){
    if(formFields) formFields.style.display = "none";
    const people = Store.get("peopleCharacters") || {};
    const c = people[myCharacterActiveOwner];
    if(!c || !c.name){ box.innerHTML = `<p class="empty-note">No character saved yet.</p>`; return; }
    box.innerHTML = `
      <div class="char-card">
        <div style="font-size:12px; color:var(--accent-teal);">${escapeHtml(personDisplayName(c, myCharacterActiveOwner))}'s character — read-only</div>
        <div style="font-size:16px; font-weight:700; color:var(--accent-amber); margin-top:4px;">${escapeHtml(c.name)}</div>
        <div style="font-size:12px; color:var(--text-muted); text-transform:uppercase; letter-spacing:.05em; margin-top:2px;">${c.district ? escapeHtml(c.district) : "Undecided / floating"}</div>
        ${c.quirk ? `<p style="margin-top:8px; font-size:14px;"><strong>Quirk:</strong> ${escapeHtml(c.quirk)}</p>` : ""}
        ${c.catchphrase ? `<p style="margin-top:6px; font-size:14px; font-style:italic;">"${escapeHtml(c.catchphrase)}"</p>` : ""}
        ${c.backstory ? `<p style="margin-top:6px; font-size:14px; color:var(--text-muted);">${escapeHtml(c.backstory)}</p>` : ""}
      </div>
    `;
    return;
  }

  const c = Store.get("myCharacter");
  const hasChar = !!(c && c.name);
  // Once a character's saved, the 5-field edit form is just clutter on
  // every return visit — lead with the summary card instead and only
  // bring the form back if they actually tap Edit.
  if(formFields) formFields.style.display = (hasChar && !charFormForcedOpen) ? "none" : "";
  if(!hasChar){ box.innerHTML = ""; return; }
  box.innerHTML = `
    <div class="char-card">
      <div style="font-size:16px; font-weight:700; color:var(--accent-amber);">${escapeHtml(c.name)}</div>
      <div style="font-size:12px; color:var(--text-muted); text-transform:uppercase; letter-spacing:.05em; margin-top:2px;">${c.district ? escapeHtml(c.district) : "Undecided / floating"}</div>
      ${c.quirk ? `<p style="margin-top:8px; font-size:14px;"><strong>Quirk:</strong> ${escapeHtml(c.quirk)}</p>` : ""}
      ${c.catchphrase ? `<p style="margin-top:6px; font-size:14px; font-style:italic;">"${escapeHtml(c.catchphrase)}"</p>` : ""}
      ${c.backstory ? `<p style="margin-top:6px; font-size:14px; color:var(--text-muted);">${escapeHtml(c.backstory)}</p>` : ""}
    </div>
    ${charFormForcedOpen ? "" : `<button class="ghost" id="editCharBtn" style="margin-top:8px;">Edit character</button>`}
  `;
  const editBtn = document.getElementById("editCharBtn");
  if(editBtn) editBtn.onclick = ()=>{
    charFormForcedOpen = true;
    renderMyCharacter();
  };
}

function loadMyCharacterForm(){
  const c = Store.get("myCharacter");
  if(!c) return;
  if(c.name) document.getElementById("charName").value = c.name;
  if(c.district) document.getElementById("charDistrict").value = c.district;
  if(c.quirk) document.getElementById("charQuirk").value = c.quirk;
  if(c.catchphrase) document.getElementById("charCatchphrase").value = c.catchphrase;
  if(c.backstory) document.getElementById("charBackstory").value = c.backstory;
}

document.getElementById("saveCharBtn").onclick = ()=>{
  const character = {
    name: document.getElementById("charName").value.trim(),
    district: document.getElementById("charDistrict").value,
    quirk: document.getElementById("charQuirk").value.trim(),
    catchphrase: document.getElementById("charCatchphrase").value.trim(),
    backstory: document.getElementById("charBackstory").value.trim()
  };
  Store.set("myCharacter", character);
  charFormForcedOpen = false;
  renderMyCharacter();
};

loadMyCharacterForm();
renderMyCharacterPersonTabs();
renderMyCharacter();

// ===============================
// BOOMTOWN BINGO — generate/shuffle freely until locked; after locking
// the 24 squares are permanent, but marking them off stays live.
// ===============================
const bingoPool = [
  "Find a hidden venue", "See a street performer mid-scene", "Get given Boomtown bucks",
  "Spot someone dressed as a Guardian", "Buy something at Pepperpot Market", "Get rained on",
  "Make a friend in a queue", "Visit all 7 districts", "Watch the sunrise from your tent",
  "Get (briefly) lost finding your tent", "Overhear an in-character argument", "Pick up a Daily Rag",
  "Try a themed cocktail", "Dance somewhere unlisted", "Join a Thrutopia workshop",
  "Visit The Retreat", "Stitch a Cloak of Hope patch", "Catch a fancy-dress theme change mid-set",
  "See the chair-o-plane", "Find a door that leads nowhere", "Get a good photo at Anara Forest",
  "Try food from 3 different districts", "Get your top-up sorted at a bank point",
  "Catch the closing ceremony", "Find Botanica Zoo", "Trade something for a favour",
  "Get told a story you don't believe", "Ask an actor who's really in charge",
  "Spot a Von Vanderland extra in costume", "Hear The Great Mother's followers chanting"
];

// All 12 standard 5x5 bingo win lines (5 rows + 5 cols + 2 diagonals),
// as flat-index arrays into the 25-cell card.
const BINGO_LINES = (()=>{
  const lines = [];
  for(let r=0;r<5;r++) lines.push([0,1,2,3,4].map(c=> r*5+c));
  for(let c=0;c<5;c++) lines.push([0,1,2,3,4].map(r=> r*5+c));
  lines.push([0,6,12,18,24]);
  lines.push([4,8,12,16,20]);
  return lines;
})();

function shuffledPick(pool, count){
  const copy = pool.slice();
  for(let i = copy.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

// Builds the 24 squares from whatever the user typed (one idea per line),
// topping up from the default pool if they wrote fewer than 24, or picking
// 24 at random from theirs if they wrote more.
function buildBingoSquares(){
  const input = document.getElementById("bingoCustomInput");
  const custom = input ? input.value.split("\n").map(l=>l.trim()).filter(Boolean) : [];
  if(custom.length >= 24) return shuffledPick(custom, 24);
  const need = 24 - custom.length;
  const filler = shuffledPick(bingoPool.filter(p=> !custom.includes(p)), need);
  return shuffledPick(custom.concat(filler), 24);
}

// "mine" is always this device's own bingoCard/bingoMarked/bingoLocked
// — the only one that's ever editable. Anything else is a name key into
// peopleBingo, a read-only snapshot from a teammate's sync. Switching
// tabs never copies, merges, or overwrites one into the other.
let bingoActiveOwner = "mine";

function bingoPeopleNames(){
  const people = Store.get("peopleBingo") || {};
  return Object.keys(people)
    .filter(id=> ((people[id] && people[id].card) || []).length > 0)
    .sort((a,b)=> personDisplayName(people[a], a).localeCompare(personDisplayName(people[b], b)));
}

function renderBingoPersonTabs(){
  const box = document.getElementById("bingoPersonTabs");
  if(!box) return;
  const people = Store.get("peopleBingo") || {};
  const personIds = bingoPeopleNames();
  if(personIds.length === 0){
    box.style.display = "none";
    bingoActiveOwner = "mine";
    return;
  }
  box.style.display = "";
  box.className = "tabstrip";
  box.innerHTML = `<button class="${bingoActiveOwner==="mine"?"active":""}" data-owner="mine">⭐ Mine</button>` +
    personIds.map(id=>`<button class="person ${bingoActiveOwner===id?"active":""}" data-owner="${escapeHtml(id)}">${escapeHtml(personDisplayName(people[id], id))}</button>`).join("");
  box.querySelectorAll("button").forEach(btn=>{
    btn.onclick = ()=>{
      bingoActiveOwner = btn.dataset.owner;
      renderBingoPersonTabs();
      renderBingo();
    };
  });
}

function renderBingo(){
  const grid = document.getElementById("bingoGrid");
  const generateBtn = document.getElementById("bingoGenerateBtn");
  const lockBtn = document.getElementById("bingoLockBtn");
  const note = document.getElementById("bingoStatusNote");
  const customInput = document.getElementById("bingoCustomInput");
  if(!grid) return;

  if(bingoActiveOwner !== "mine"){
    const people = Store.get("peopleBingo") || {};
    const data = people[bingoActiveOwner] || { card: [], marked: [], locked: false };
    const label = personDisplayName(data, bingoActiveOwner);
    if(customInput) customInput.style.display = "none";
    generateBtn.style.display = "none";
    lockBtn.style.display = "none";
    const theirMarked = new Set([...(data.marked || []), 12]);
    const completedLines = BINGO_LINES.filter(line=> line.every(i=> theirMarked.has(i)));
    const winningCells = new Set(completedLines.flat());
    grid.innerHTML = data.card.map((text,i)=>{
      const isFree = i === 12;
      const isMarked = isFree || (data.marked || []).includes(i);
      const isWinning = winningCells.has(i);
      return `<div class="bingo-cell${isMarked ? " marked" : ""}${isFree ? " free" : ""}${isWinning ? " winning" : ""}" data-i="${i}">${escapeHtml(text)}</div>`;
    }).join("");
    grid.querySelectorAll(".bingo-cell").forEach(cell=>{ cell.onclick = null; });
    note.textContent = data.locked
      ? `🔒 ${label} locked in — ${(data.marked || []).length}/24 crossed off. Read-only — this is their card, not yours.`
      : `${label} hasn't locked in yet — showing their card as last synced, still subject to change.`;
    return;
  }

  let card = Store.get("bingoCard") || [];
  const locked = !!Store.get("bingoLocked");
  const marked = Store.get("bingoMarked") || [];
  if(customInput) customInput.style.display = locked ? "none" : "";

  if(!card.length && !locked){
    card = buildBingoSquares();
    card.splice(12, 0, "FREE");
    Store.set("bingoCard", card);
  }

  // The FREE centre square always counts as marked for line-completion
  // purposes, even though it's never in bingoMarked itself.
  const effectiveMarked = new Set([...marked, 12]);
  const completedLines = BINGO_LINES.filter(line=> line.every(i=> effectiveMarked.has(i)));
  const winningCells = new Set(completedLines.flat());
  const linesSeen = Store.get("bingoLinesSeen") || 0;
  const isNewWin = locked && completedLines.length > linesSeen;
  if(completedLines.length !== linesSeen) Store.set("bingoLinesSeen", completedLines.length);

  grid.innerHTML = card.map((text,i)=>{
    const isFree = i === 12;
    const isMarked = isFree || marked.includes(i);
    const isWinning = winningCells.has(i);
    return `<div class="bingo-cell${isMarked ? " marked" : ""}${isFree ? " free" : ""}${isWinning ? " winning" : ""}" data-i="${i}">${escapeHtml(text)}</div>`;
  }).join("");

  grid.querySelectorAll(".bingo-cell").forEach(cell=>{
    cell.onclick = ()=>{
      const i = Number(cell.dataset.i);
      if(i === 12) return;
      if(!locked){ return; } // can't mark an unlocked (still-shuffling) card
      let m = Store.get("bingoMarked") || [];
      if(m.includes(i)) m = m.filter(x=>x!==i); else m.push(i);
      Store.set("bingoMarked", m);
      renderBingo();
    };
  });

  generateBtn.style.display = locked ? "none" : "";
  lockBtn.style.display = locked ? "none" : "";
  if(isNewWin){
    note.textContent = `🎉 Bingo! You've completed a line. ${marked.length}/24 crossed off — keep going for more.`;
  } else {
    note.textContent = locked
      ? `Locked in — ${marked.length}/24 crossed off. Tap a square to mark it done.`
      : "Not locked yet — keep shuffling, nothing counts until you lock it in.";
  }
}

document.getElementById("bingoGenerateBtn").onclick = ()=>{
  if(Store.get("bingoLocked")) return;
  const card = buildBingoSquares();
  card.splice(12, 0, "FREE");
  Store.set("bingoCard", card);
  Store.set("bingoMarked", []);
  Store.set("bingoLinesSeen", 0);
  renderBingo();
};

document.getElementById("bingoLockBtn").onclick = ()=>{
  if(!confirm("Lock in this card? The 24 squares can't be reshuffled after this — you'll only be able to cross them off.")) return;
  Store.set("bingoLocked", true);
  renderBingo();
};

const bingoCustomInputEl = document.getElementById("bingoCustomInput");
if(bingoCustomInputEl){
  bingoCustomInputEl.value = Store.get("bingoCustomText") || "";
  bingoCustomInputEl.oninput = ()=> Store.set("bingoCustomText", bingoCustomInputEl.value);
}

renderBingoPersonTabs();
renderBingo();

// ===============================
// CHARACTERS & FACTIONS
// ===============================
const characters = [
  { name:"The Collector", faction:"Independent (formerly Area 404)", where:"Whereabouts unclear — occasional broadcasts only", blurb:"Freed at the 2025 closing ceremony from Mr Biga and Aurora Venturestone, The Collector handed leadership of Boomtown to The Network, as the Lion's Gate Portal had foretold. Since then he's barely been seen in person, bar the odd official broadcast. Whether that handover of power actually sticks is this chapter's big open question.", ask:"Ask who's really making decisions now leadership has changed hands, and where he's actually gone." },
  { name:"Mr Biga", faction:"Area 404 / BBXL™", where:"Area 404", blurb:"Chief Guardian of Area 404, training up the enforcement squad whose 'official fines' and boot camps have residents nervous. Despite last year's disgrace, he and Aurora Venturestone have merged their companies into BBXL™ and launched a space programme built on the idea that Earth is a 'single-use planet.'", ask:"Ask what the Guardians are really protecting, and what the space programme costs Earth." },
  { name:"The Guardians", faction:"Area 404", where:"Area 404", blurb:"Area 404's enforcers, now abusing their new authority with bogus 'official fines', checkpoint stops and work-permit paperwork on ordinary residents.", ask:"Ask what a fine is actually for — the answers don't hold up under questioning." },
  { name:"The Network", faction:"Independent", where:"Temple of Zero, Botanica", blurb:"The underground movement The Collector handed power to. Trying to organise the city and return real power to the people, while BBXL's money, VIP clubs and district-level power plays keep undermining them.", ask:"Ask what they'd actually need from ordinary citizens to pull this off." },
  { name:"IONA", faction:"The Network", where:"Temple of Zero, Botanica", blurb:"A sentient mycelium-network AI helping The Network make sense of the city, working alongside the secretive Shadow Post group on a strange recurring photocopier phenomenon.", ask:"Ask what the photocopiers are copying, and why it matters." },
  { name:"Shadow Post", faction:"The Network", where:"Temple of Zero, Botanica", blurb:"A shadowy group with a deeper connection to Temple of Zero's transformation than they let on — allied with IONA and The Network, but they keep their own methods close to their chest.", ask:"Ask how they're connected to IONA — the answer tends to shift depending who you ask." },
  { name:"The Great Mother", faction:"Botanica", where:"Botanica", blurb:"Leader of Botanica's temple, still furious months on from her election defeat. She's plotting a ritual that would sacrifice her followers into her own portal to 'ascend' her whole community — a direct challenge to The Network and The Collector's authority.", ask:"Ask about the ritual, or what 'ascension' actually means to her followers." },
  { name:"The Immortal Children of the Eternal Seed", faction:"Botanica", where:"Botanica", blurb:"The Great Mother's inner devotees, running rituals and ceremony around Botanica's temple — the ones most likely to actually go through with the ascension plan.", ask:"Ask what happens to a follower after they 'ascend'." },
  { name:"Edna Von Vanderhaus", faction:"Copperwood", where:"Copperwood", blurb:"Self-appointed 'Creative Director' of Copperwood since her election loss, currently shooting her film 'Race to the Red Planet' under her production company VVH. Her fans have built her a whole fan settlement, Von Vanderland.", ask:"Ask for a walk-on part, or what the film is really about." },
  { name:"VVH (Von Vanderhaus Pictures)", faction:"Copperwood", where:"Copperwood", blurb:"Edna Von Vanderhaus's in-world production company, dressing the whole district as a live 1925 film set. Extras, crew and 'press' are all in on it — worth asking who's actually directing versus just performing for her.", ask:"Ask if they're cast, crew, or just caught up in it." },
  { name:"Von Vanderland", faction:"Copperwood", where:"Copperwood", blurb:"The fan-built settlement dedicated to Edna Von Vanderhaus and her film — part shrine, part squat, entirely devoted.", ask:"Ask a resident why they moved in, and what they get out of the devotion." },
  { name:"Rufus the Red", faction:"Oldtown", where:"Oldtown", blurb:"Leading the Den of Dis Order and Oldtown's separatist movement, declaring 'The People's Republic of Oldtownia' against Area 404's rule after the district was relocated uphill.", ask:"Ask what independence would actually look like for Oldtown, and who'd be left out." },
  { name:"Den of Dis Order", faction:"Oldtown", where:"Oldtown", blurb:"Rufus the Red's inner circle of circus hustlers, fortune tellers and rogues, running the day-to-day chaos behind the separatist push.", ask:"Ask what 'order' actually means to a group with 'disorder' in the name." },
  { name:"Patrick Kahn", faction:"Letsbe Avenue", where:"Letsbe Avenue", blurb:"Salesman pushing BLIP (Boomtown Lifestyle Important Product) — a rebrand of his old BLEP operation, sold exclusively to status-holders called VIPPs. Nobody's quite sure what it actually does yet.", ask:"Ask to try BLIP, or what makes someone a VIPP." },
  { name:"Aurora Venturestone", faction:"Metropolis / BBXL™", where:"Metropolis", blurb:"Chief of Digital Communications, running Metropolis's surveillance and media machine and co-running BBXL™ with Mr Biga. Bettercorp™ keeps thriving in public despite mass layoffs behind the scenes.", ask:"Ask about the unemployed inGeniuses wandering Metropolis, or what BBXL™ is really building." },
  { name:"BBXL™", faction:"Corporate", where:"Site-wide", blurb:"The merger of Mr Biga's BIGACORP™ and Aurora Venturestone's BETTERCORP™ — a corporate space programme that treats Earth as disposable while draining the city's land and water. Despite their disgrace, many residents still buy BBXL™ products and chase its exclusive VIP clubs. The chapter's central antagonist force, with reps and messaging in every district.", ask:"Ask a BBXL™ rep what the space programme actually costs Earth — and why people still buy in." }
];

const characterSearch = document.getElementById("characterSearch");
const characterResults = document.getElementById("characterResults");

function showCharacters(list){
  characterResults.innerHTML = "";
  if(list.length === 0){
    characterResults.innerHTML = `<p class="empty-note">No one matches "${escapeHtml(characterSearch ? characterSearch.value.trim() : "")}" — try a district or faction name instead.</p>`;
    return;
  }
  const characterNotes = Store.get("characterNotes") || {};
  list.forEach(c=>{
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <strong>${c.name}</strong><br>
      <small>${c.faction} · ${c.where}</small>
      <div class="linkify-zone">
        <p style="margin-top:6px; color:var(--text-muted); font-size:14px; line-height:1.5;">${c.blurb}</p>
        <p style="margin-top:6px; color:var(--accent-teal); font-size:12px;">💬 ${c.ask}</p>
      </div>
      <textarea class="char-note-input" placeholder="What actually happened when you met ${escapeHtml(c.name)}? Add a new line each time you interact with them again." style="margin-top:8px;">${escapeHtml(characterNotes[c.name] || "")}</textarea>
    `;
    // Only the blurb/ask text, not the card's own name heading, so a
    // character's own name doesn't turn into a pointless self-link.
    linkifyKeyTerms(div.querySelector(".linkify-zone"));
    div.querySelector(".char-note-input").oninput = (e)=>{
      const notes = Store.get("characterNotes") || {};
      notes[c.name] = e.target.value;
      Store.set("characterNotes", notes);
    };
    characterResults.appendChild(div);
  });
}
function currentFilteredCharacters(){
  const term = characterSearch.value.toLowerCase();
  return characters.filter(c=>
    c.name.toLowerCase().includes(term) ||
    c.faction.toLowerCase().includes(term) ||
    c.where.toLowerCase().includes(term) ||
    c.blurb.toLowerCase().includes(term)
  );
}
characterSearch.oninput = ()=> showCharacters(currentFilteredCharacters());
showCharacters(characters);

// ===============================
// GET INVOLVED
// ===============================
const getInvolved = [
  { title:"Cloak of Hope", text:"Stitch a 10–15cm fabric patch expressing a hope for the future — post it in ahead of time or stitch it on-site. Hundreds of patches went in during 2024; the collective artwork keeps growing each chapter.", link:null, linkLabel:null },
  { title:"Thrutopia workshop", text:"Propose your own talk, workshop or session for the new Thrutopia zone — art installation applications are also open for the wider site.", link:"https://docs.google.com/forms/d/e/1FAIpQLSfh4w5SDGJQoUsgQ2hRD1yZCZvnVMHwPLIMOVAsavkEzCg6fw/viewform", linkLabel:"Submit a workshop" },
  { title:"The Retreat", text:"Book in for massage, saunas, hot tubs or sound baths if the pace catches up with you. It's in the Thrutopia woodlands and separate from your festival ticket, so book ahead.", link:"https://www.boomtownfair.co.uk/the-retreat", linkLabel:"Browse & book" },
  { title:"The Observatory", text:"New for 2026 — take part in a genuine academic study or the before/after festival survey run by psychologist Dr Martha Newson and researchers from 10+ UK universities, looking at identity, belonging and behaviour at live events. This is real research, not in-fiction lore.", link:null, linkLabel:null },
  { title:"Agents of Change", text:"Sign up for the badge, HQ and a recycled-T-shirt screen print, plus early access to on-site quests and sustainability activities.", link:null, linkLabel:null },
  { title:"Vibe Check", text:"This chapter's community-responsibility campaign, covering wellness, party safety and looking out for your crew — worth a read before you go, and worth living by once you're there.", link:null, linkLabel:null }
];

const getInvolvedBox = document.getElementById("getInvolvedList");
// involvedDone entries are {title, from} objects so we know who ticked
// what — done() below reads either the old plain-string shape (from
// before this change) or the new object shape, so nobody's saved
// progress gets lost by the upgrade.
function involvedEntryFor(done, title){
  return done.find(d=> (typeof d === "string" ? d === title : d.title === title));
}
function loadGetInvolved(){
  const done = Store.get("involvedDone") || [];
  getInvolvedBox.innerHTML = "";
  getInvolved.forEach(g=>{
    const entry = involvedEntryFor(done, g.title);
    const isDone = !!entry;
    const who = entry && typeof entry === "object" ? entry.from : null;
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="item-top">
        <div>
          <strong>${g.title}</strong> ${isDone ? "✅" : ""}${who ? ` <small style="color:var(--accent-teal);">(${escapeHtml(who)})</small>` : ""}<br>
          <small class="linkify-zone">${g.text}</small>
          ${g.link ? `<br><a class="linkbtn" href="${g.link}" target="_blank" rel="noopener">${g.linkLabel}</a>` : ""}
        </div>
        <button>${isDone ? "Done" : "Mark done"}</button>
      </div>
    `;
    linkifyKeyTerms(div.querySelector(".linkify-zone"));
    div.querySelector(".item-top > button").onclick = ()=>{
      let d = Store.get("involvedDone") || [];
      if(involvedEntryFor(d, g.title)){
        d = d.filter(x=> (typeof x === "string" ? x !== g.title : x.title !== g.title));
      } else {
        d.push({ title: g.title, from: currentContributorName() || "" });
      }
      Store.set("involvedDone", d);
      loadGetInvolved();
      if(typeof renderConsolidatedNotes === "function") renderConsolidatedNotes();
    };
    getInvolvedBox.appendChild(div);
  });
}
loadGetInvolved();

// ===============================
// PACKING CHECKLIST — Emma's group kit list, device-local only (see
// PERSONAL_ONLY_KEYS: "packingChecked" never syncs, since packing is a
// personal to-do, not a shared group fact like theories/clues are).
// Grouped by category, with a text search across all items since it's
// long enough to overwhelm at a glance otherwise.
// ===============================
const packingCategories = [
  { title:"⛺ Shelter & camp setup", items:[
    "Tent","Pegs & mallet","Groundsheet, if needed","Sleeping bag","Extra blanket","Pillow",
    "Sleeping mat / air bed & pump","Picnic blanket","Folding chairs","Folding table (Emma)"
  ]},
  { title:"🍳 Kitchen & food", items:[
    "Camping stove","Gas canisters","Lighters / rolling supplies","Kettle, pots & pans for the stove",
    "Plates, bowls, cutlery","Toastie maker (Emma)","Cups","Water container / shower bag",
    "Bottled water pack (6–12 bottles)","Electrolyte sachets","Fresh food, snacks & drinks",
    "Alcohol","Ice packs / cool box contents (Emma)"
  ]},
  { title:"🔌 Power, light & entertainment", items:[
    "Speakers","Power banks","Projector with movies (Emma)","Charging cables","Lanterns / camp lamps",
    "String lights","Head torch","Batteries (AA and AAA)","Cards / games","Notebook and pen",
    "Dry bag for tech","Camera — disposable, or just your phone"
  ]},
  { title:"👕 Clothing", items:[
    "Festival clothes","Lots of socks and pants","Warm hoodie / fleece","Waterproof jacket",
    "Trainers / shoes (wellies, or comfy night shoes)","Hats","Sunglasses"
  ]},
  { title:"🧴 Hygiene & health", items:[
    "Toothbrush & toothpaste","Deodorant","Shower gel","Shampoo","Fans (electric for the tent, hand fan for stages)",
    "Wash cloth","Towel","Moisturiser","Hairbrush","Dry shampoo","Sun cream","Lip balm","Wet wipes",
    "Tweezers / nail clips","Emery board","Hand sanitiser","Toilet rolls","Tissue packs",
    "Painkillers / anti-acid","Antihistamines","Plasters / basic first aid","Earplugs — seriously, don't forget",
    "Eye mask, if light will bother you when sleeping"
  ]},
  { title:"🔧 Practical & repairs", items:[
    "Bin bags / plastic bags","Duct tape","Paracord or spare string for tent repairs, plus a patch kit",
    "A crate or box for a bedside table in the tent","A few carabiners, for hanging lights, bags and jackets around the tent",
    "A few zip ties","Clothesline — the tent's own guy-line usually works fine too","Small bag for daytime trips into the city"
  ]},
  { title:"🎫 Day-of essentials", items:[
    "Fully charge phone, speaker, lanterns, lights, torch and power banks","Festival ticket","Wallet, ID",
    "House keys","Phone"
  ]}
];

const packingListBox = document.getElementById("packingList");
const packingSearchInput = document.getElementById("packingSearch");
let packingSearchTerm = "";
// Collapsed by default, like the genre chips' "see more" — 78 items
// across 7 categories is a lot of scroll to land on all at once.
// Session-only (not persisted), same as genreChipsExpanded above.
const packingExpandedCats = new Set();

function packingItemKey(catTitle, item){ return catTitle + "::" + item; }

function loadPacking(){
  if(!packingListBox) return;
  const checked = new Set(Store.get("packingChecked") || []);
  const term = packingSearchTerm.trim().toLowerCase();

  // Progress always counts the whole list, regardless of any active
  // search filter, so it reads as a stable "how much of the whole list
  // is done" summary rather than jumping around as you type.
  let totalItems = 0, totalChecked = 0;
  packingCategories.forEach(cat=>{
    totalItems += cat.items.length;
    totalChecked += cat.items.filter(i=> checked.has(packingItemKey(cat.title, i))).length;
  });

  let html = "";
  let anyVisible = false;
  packingCategories.forEach(cat=>{
    const items = term ? cat.items.filter(i=> i.toLowerCase().includes(term)) : cat.items;
    if(!items.length) return;
    anyVisible = true;
    const catChecked = cat.items.filter(i=> checked.has(packingItemKey(cat.title, i))).length;
    // Searching auto-expands any category with a match, so results are
    // never hidden behind a collapsed header — the toggle only governs
    // the default, browse-everything state.
    const expanded = term ? true : packingExpandedCats.has(cat.title);
    html += `<button class="packing-cat-toggle" data-cat="${escapeHtml(cat.title)}">
      <span>${escapeHtml(cat.title)}</span>
      <span class="packing-cat-count">${catChecked}/${cat.items.length} ${expanded ? "▴" : "▾"}</span>
    </button>`;
    if(expanded){
      html += `<div>`;
      items.forEach(item=>{
        const key = packingItemKey(cat.title, item);
        const isChecked = checked.has(key);
        html += `
          <div class="item${isChecked ? " packed" : ""}" data-key="${escapeHtml(key)}">
            <div class="item-top">
              <div><strong style="${isChecked ? "text-decoration:line-through; opacity:.6;" : ""}">${escapeHtml(item)}</strong></div>
              <button class="pack-toggle-btn">${isChecked ? "Packed ✓" : "Not yet"}</button>
            </div>
          </div>`;
      });
      html += `</div>`;
    }
  });
  packingListBox.innerHTML = anyVisible ? html : `<p class="empty-note">No items match "${escapeHtml(packingSearchInput ? packingSearchInput.value.trim() : "")}".</p>`;
  const progressNote = document.getElementById("packingProgress");
  if(progressNote) progressNote.textContent = `${totalChecked}/${totalItems} packed`;

  packingListBox.querySelectorAll(".packing-cat-toggle").forEach(btn=>{
    btn.onclick = ()=>{
      const cat = btn.dataset.cat;
      if(packingExpandedCats.has(cat)) packingExpandedCats.delete(cat);
      else packingExpandedCats.add(cat);
      loadPacking();
    };
  });
  packingListBox.querySelectorAll(".item").forEach(el=>{
    el.querySelector(".pack-toggle-btn").onclick = ()=>{
      let c = Store.get("packingChecked") || [];
      const key = el.dataset.key;
      if(c.includes(key)) c = c.filter(k=> k !== key);
      else c.push(key);
      Store.set("packingChecked", c);
      loadPacking();
    };
  });
}
loadPacking();
if(packingSearchInput) packingSearchInput.oninput = ()=>{
  packingSearchTerm = packingSearchInput.value;
  loadPacking();
};

// ===============================
// HIDDEN VENUE LOG — the old standalone name/type/genre/location/notes
// form here is retired in favour of the unified "Add a place" flow (the
// ＋ button on the map above, see the ADD A PLACE section) — this jump
// button just opens that same modal, pre-set to the "Hidden venue"
// category, instead of duplicating a second add flow. Note this means
// new finds logged this way land in customPlaces, not the older
// hiddenVenues array the venue directory's "Your finds" filter and
// "Copy your finds" button below still read from — existing logged
// finds aren't touched or lost, there's just nowhere new for that
// specific list to grow from any more.
const jumpToAddPlaceFromHiddenBtn = document.getElementById("jumpToAddPlaceFromHidden");
if(jumpToAddPlaceFromHiddenBtn) jumpToAddPlaceFromHiddenBtn.onclick = ()=>{
  if(typeof openAddPlaceModal === "function") openAddPlaceModal({ name:"", category:"Hidden venue", note:"", x:null, y:null });
};

// ===============================
// THEORIES BOARD
// ===============================
const theoryInput = document.getElementById("theoryInput");
const theoriesBox = document.getElementById("theoriesList");

let theoriesPersonFilter = null;
function loadTheories(){
  const all = Store.get("theories") || [];
  renderPersonChipBar("theoriesPersonChips", all, ()=>theoriesPersonFilter, v=>{ theoriesPersonFilter = v; }, loadTheories);
  const entries = theoriesPersonFilter ? all.filter(e=>(e.from || "").trim() === theoriesPersonFilter) : all;
  theoriesBox.innerHTML = "";
  entries.slice().reverse().forEach(entry=>{
    const i = all.indexOf(entry);
    const div = document.createElement("div");
    div.className = "update-entry";
    div.innerHTML = `<div class="when">${entry.when}${entry.from ? " · via " + escapeHtml(entry.from) : ""}</div><div>${escapeHtml(entry.text)}</div><button data-i="${i}" class="ghost removeTheoryBtn" style="margin-top:4px;">Remove</button>`;
    theoriesBox.appendChild(div);
  });
  theoriesBox.querySelectorAll(".removeTheoryBtn").forEach(btn=>{
    btn.onclick = ()=>{
      const list = Store.get("theories") || [];
      list.splice(Number(btn.dataset.i), 1);
      Store.set("theories", list);
      loadTheories();
      if(typeof renderConsolidatedNotes === "function") renderConsolidatedNotes();
    };
  });
}

document.getElementById("addTheoryBtn").onclick = ()=>{
  const text = theoryInput.value.trim();
  if(!text) return;
  const entries = Store.get("theories") || [];
  entries.push({ text, when: new Date().toLocaleString(), from: currentContributorName() || "", ts: Date.now() });
  Store.set("theories", entries);
  theoryInput.value = "";
  loadTheories();
  if(typeof renderConsolidatedNotes === "function") renderConsolidatedNotes();
};

loadTheories();

// ===============================
// MEMORY JOURNAL — funny/ridiculous quotes, synced and copyable like
// theories and hidden venues.
// ===============================
const quoteInput = document.getElementById("quoteInput");
const quoteSaidByInput = document.getElementById("quoteSaidBy");
const quotesBox = document.getElementById("quotesList");

let journalPersonFilter = null;
function loadQuotes(){
  const all = Store.get("quotes") || [];
  renderPersonChipBar("journalPersonChips", all, ()=>journalPersonFilter, v=>{ journalPersonFilter = v; }, loadQuotes);
  const entries = journalPersonFilter ? all.filter(e=>(e.from || "").trim() === journalPersonFilter) : all;
  quotesBox.innerHTML = "";
  entries.slice().reverse().forEach(entry=>{
    const i = all.indexOf(entry);
    const div = document.createElement("div");
    div.className = "update-entry";
    div.innerHTML = `<div class="when">${entry.when}${entry.saidBy ? " · said by " + escapeHtml(entry.saidBy) : ""}${entry.from ? " · logged by " + escapeHtml(entry.from) : ""}</div><div>${escapeHtml(entry.text)}</div><button data-i="${i}" class="ghost removeQuoteBtn" style="margin-top:4px;">Remove</button>`;
    quotesBox.appendChild(div);
  });
  quotesBox.querySelectorAll(".removeQuoteBtn").forEach(btn=>{
    btn.onclick = ()=>{
      const list = Store.get("quotes") || [];
      list.splice(Number(btn.dataset.i), 1);
      Store.set("quotes", list);
      loadQuotes();
      if(typeof renderConsolidatedNotes === "function") renderConsolidatedNotes();
    };
  });
}

document.getElementById("addQuoteBtn").onclick = ()=>{
  const text = quoteInput.value.trim();
  if(!text) return;
  const entries = Store.get("quotes") || [];
  entries.push({ text, saidBy: quoteSaidByInput.value.trim(), from: currentContributorName() || "", when: new Date().toLocaleString() });
  Store.set("quotes", entries);
  quoteInput.value = "";
  quoteSaidByInput.value = "";
  loadQuotes();
  if(typeof renderConsolidatedNotes === "function") renderConsolidatedNotes();
};

document.getElementById("copyQuotesBtn").onclick = (e)=>{
  const entries = Store.get("quotes") || [];
  const lines = entries.map(q=>`- "${q.text}"${q.saidBy ? ` — ${q.saidBy}` : ""}`);
  copyText(entries.length ? "Quotebook:\n" + lines.join("\n") : "No quotes saved yet.", e.target);
};

loadQuotes();

// ===============================
// LIVE SIGHTINGS — a dated feed for "someone posted about a secret set" /
// "heard X is playing Y" type finds. This is a manual log, not a live
// scan of social media — see the Daily Rag & Live Intel card in Discover
// for why that isn't possible from a static page, and the quick-check
// links to do it by hand.
// ===============================
const sightingInput = document.getElementById("sightingInput");
const sightingSourceInput = document.getElementById("sightingSource");
const sightingsBox = document.getElementById("sightingsList");

let sightingsPersonFilter = null;
function loadSightings(){
  const all = Store.get("sightings") || [];
  renderPersonChipBar("sightingsPersonChips", all, ()=>sightingsPersonFilter, v=>{ sightingsPersonFilter = v; }, loadSightings);
  const entries = sightingsPersonFilter ? all.filter(e=>(e.from || "").trim() === sightingsPersonFilter) : all;
  sightingsBox.innerHTML = "";
  entries.slice().reverse().forEach(entry=>{
    const i = all.indexOf(entry);
    const div = document.createElement("div");
    div.className = "update-entry";
    div.innerHTML = `<div class="when">${entry.when}${entry.source ? " · via " + escapeHtml(entry.source) : ""}${entry.from ? " · logged by " + escapeHtml(entry.from) : ""}</div><div>${escapeHtml(entry.text)}</div><button data-i="${i}" class="ghost removeSightingBtn" style="margin-top:4px;">Remove</button>`;
    sightingsBox.appendChild(div);
  });
  sightingsBox.querySelectorAll(".removeSightingBtn").forEach(btn=>{
    btn.onclick = ()=>{
      const list = Store.get("sightings") || [];
      list.splice(Number(btn.dataset.i), 1);
      Store.set("sightings", list);
      loadSightings();
      if(typeof renderConsolidatedNotes === "function") renderConsolidatedNotes();
    };
  });
}

document.getElementById("addSightingBtn").onclick = ()=>{
  const text = sightingInput.value.trim();
  if(!text) return;
  const entries = Store.get("sightings") || [];
  entries.push({ text, source: sightingSourceInput.value.trim(), from: currentContributorName() || "", when: new Date().toLocaleString() });
  Store.set("sightings", entries);
  sightingInput.value = "";
  sightingSourceInput.value = "";
  loadSightings();
  if(typeof renderConsolidatedNotes === "function") renderConsolidatedNotes();
};

document.getElementById("copySightingsBtn").onclick = (e)=>{
  const entries = Store.get("sightings") || [];
  const lines = entries.map(s=>`- ${s.text}${s.source ? ` (${s.source})` : ""}`);
  copyText(entries.length ? "Live sightings & intel:\n" + lines.join("\n") : "Nothing logged yet.", e.target);
};

loadSightings();

// ===============================
// CONSOLIDATED NOTES — one readable/copyable report pulling together
// everything saved on this device, so a merged (Synced) phone can show
// and export the group's whole picture in one place.
// ===============================
function buildConsolidatedReport(){
  const clues = Store.get("clues") || {};
  const characterNotes = Store.get("characterNotes") || {};
  const visited = Store.get("discoveries") || [];
  const theoryEntries = Store.get("theories") || [];
  const venueEntries = Store.get("hiddenVenues") || [];
  const involved = Store.get("involvedDone") || [];
  const socials = Store.get("customSocials") || [];
  const quoteEntries = Store.get("quotes") || [];
  const sightingEntries = Store.get("sightings") || [];

  const sections = [];

  sections.push({
    heading: "Districts",
    lines: discoveries.map((d,i)=>{
      const status = visited.includes(i) ? "Visited" : "Not yet";
      const note = clues[d.title] ? ` — ${clues[d.title]}` : "";
      return `${d.title} (${status})${note}`;
    })
  });

  sections.push({
    heading: "Theories",
    lines: theoryEntries.length ? theoryEntries.map(t=>`${t.text}${t.from ? ` (via ${t.from})` : ""}`) : ["None saved yet."]
  });

  sections.push({
    heading: "Hidden-venue finds",
    lines: venueEntries.length ? venueEntries.map(v=>`${v.name}${v.genre ? ` (${v.genre})` : ""}${v.near ? ` — near ${v.near}` : ""}${v.info ? `: ${v.info}` : ""}${v.from ? ` (via ${v.from})` : ""}`) : ["None logged yet."]
  });

  sections.push({
    heading: "Character notes",
    lines: Object.keys(characterNotes).length
      ? Object.entries(characterNotes).flatMap(([charName, text])=> String(text).split("\n").map(l=>l.trim()).filter(Boolean).map(l=> `${charName}: ${l}`))
      : ["None saved yet."]
  });

  sections.push({
    heading: "Get involved",
    lines: getInvolved.map(g=>{
      const entry = involvedEntryFor(involved, g.title);
      const who = entry && typeof entry === "object" && entry.from ? ` (${entry.from})` : "";
      return `${g.title}: ${entry ? "Done" + who : "Not yet"}`;
    })
  });

  sections.push({
    heading: "Found socials",
    lines: socials.length ? socials.map(s=>`${s.name} — ${s.url}${s.from ? ` (via ${s.from})` : ""}`) : ["None added yet."]
  });

  sections.push({
    heading: "Quotebook",
    lines: quoteEntries.length ? quoteEntries.map(q=>`"${q.text}"${q.saidBy ? ` — ${q.saidBy}` : ""}${q.from ? ` (logged by ${q.from})` : ""}`) : ["None saved yet."]
  });

  sections.push({
    heading: "Live sightings & intel",
    lines: sightingEntries.length ? sightingEntries.map(s=>`${s.text}${s.source ? ` (${s.source})` : ""}${s.from ? ` (logged by ${s.from})` : ""}`) : ["None logged yet."]
  });

  return sections;
}

// Same underlying data, grouped by who added it instead of by category —
// answers "what has each person actually contributed?" at a glance.
function buildConsolidatedReportByPerson(){
  const clues = Store.get("clues") || {};
  const characterNotes = Store.get("characterNotes") || {};
  const theoryEntries = Store.get("theories") || [];
  const venueEntries = Store.get("hiddenVenues") || [];
  const involved = Store.get("involvedDone") || [];
  const socials = Store.get("customSocials") || [];
  const quoteEntries = Store.get("quotes") || [];
  const sightingEntries = Store.get("sightings") || [];
  const landmarkEntries = Store.get("customLandmarks") || [];
  const tagPattern = /^\[(.+?)\]\s(.*)$/;

  const byPerson = {};
  function bucket(name){
    const key = name && name.trim() ? name.trim() : "Unassigned";
    if(!byPerson[key]) byPerson[key] = { theories:[], venues:[], clues:[], characterNotes:[], involved:[], socials:[], quotes:[], sightings:[], landmarks:[] };
    return byPerson[key];
  }

  theoryEntries.forEach(t=> bucket(t.from).theories.push(t.text));
  // Include the actual note text (and when it was logged) — not just
  // the venue name — so a second visit/note about the same place reads
  // as its own distinct entry here, not an identical-looking repeat.
  venueEntries.forEach(v=> bucket(v.from).venues.push(`${v.name}${v.near ? ` (near ${v.near})` : ""}${v.info ? ` — ${v.info}` : ""}${v.when ? ` (${v.when})` : ""}`));
  Object.entries(clues).forEach(([district, text])=>{
    String(text).split("\n").map(l=>l.trim()).filter(Boolean).forEach(line=>{
      const m = line.match(tagPattern);
      if(m) bucket(m[1]).clues.push(`${district}: ${m[2]}`);
      else bucket(null).clues.push(`${district}: ${line}`);
    });
  });
  Object.entries(characterNotes).forEach(([charName, text])=>{
    String(text).split("\n").map(l=>l.trim()).filter(Boolean).forEach(line=>{
      const m = line.match(tagPattern);
      if(m) bucket(m[1]).characterNotes.push(`${charName}: ${m[2]}`);
      else bucket(null).characterNotes.push(`${charName}: ${line}`);
    });
  });
  involved.forEach(entry=>{
    const title = typeof entry === "string" ? entry : entry.title;
    const from = typeof entry === "string" ? null : entry.from;
    bucket(from).involved.push(title);
  });
  socials.forEach(s=> bucket(s.from).socials.push(`${s.name} — ${s.url}`));
  quoteEntries.forEach(q=> bucket(q.from).quotes.push(`"${q.text}"${q.saidBy ? ` — ${q.saidBy}` : ""}`));
  sightingEntries.forEach(s=> bucket(s.from).sightings.push(s.text));
  landmarkEntries.forEach(l=> bucket(l.from).landmarks.push(`${l.name} (${l.district})${l.info ? ` — ${l.info}` : ""}`));

  return Object.entries(byPerson).map(([name, data])=>({
    heading: name,
    lines: [
      ...data.theories.map(l=>`Theory: ${l}`),
      ...data.venues.map(l=>`Hidden venue: ${l}`),
      ...data.landmarks.map(l=>`Landmark: ${l}`),
      ...data.quotes.map(l=>`Quote: ${l}`),
      ...data.sightings.map(l=>`Sighting: ${l}`),
      ...data.clues.map(l=>`District note — ${l}`),
      ...data.characterNotes.map(l=>`Character note — ${l}`),
      ...data.involved.map(l=>`Get involved: ${l}`),
      ...data.socials.map(l=>`Social found: ${l}`)
    ]
  })).filter(s=> s.lines.length > 0);
}

// A person's saved-artist Plan, read the same read-only way the Plan
// screen's person tabs do — "mine" is this device's own Store schedule,
// anyone else comes from their last-synced peopleSchedules snapshot.
// Never merged into anything; purely for display here.
function planLinesForPerson(name){
  const isMine = name === currentContributorName();
  let schedule;
  if(isMine){
    schedule = Store.get("schedule") || [];
  }else{
    // peopleSchedules is keyed by stable personId, not name — this report
    // is grouped by display name instead, so find whichever synced
    // person currently goes by it. Ambiguous only if two different
    // people share the exact same typed name, in which case this shows
    // the first match — same ambiguity a plain name-keyed lookup would
    // have had, just no longer able to silently overwrite the other.
    const people = Store.get("peopleSchedules") || {};
    const match = Object.values(people).find(entry=> personDisplayName(entry, null) === name);
    schedule = match ? personSnapshotList(match) : [];
  }
  if(!schedule.length) return [];
  return schedule
    .slice()
    .sort((a,b)=> (toMinutes(a.day,a.start) ?? 99999) - (toMinutes(b.day,b.start) ?? 99999))
    .map(a=> `${a.name} — ${a.stage} — ${timeLabel(a)}`);
}

// All names with anything attributable to them — synced contributor
// data (from-tagged entries) plus anyone with a saved Plan snapshot —
// so the tab list covers people who've only ever shared a Plan.
function consolidatedPeopleNames(){
  const names = new Set();
  buildConsolidatedReportByPerson().forEach(s=>{ if(s.heading !== "Unassigned") names.add(s.heading); });
  const peopleSchedules = Store.get("peopleSchedules") || {};
  Object.keys(peopleSchedules).forEach(id=>{
    const label = personDisplayName(peopleSchedules[id], null);
    if(label) names.add(label);
  });
  const mine = currentContributorName();
  if(mine && ((Store.get("schedule")||[]).length || names.has(mine))) names.add(mine);
  return [...names].sort((a,b)=> a.localeCompare(b));
}

let consolidatedViewMode = "person";
let consolidatedActivePerson = null;

function renderPeopleTabs(){
  const box = document.getElementById("consolidatedPeopleTabs");
  if(!box) return;
  if(consolidatedViewMode !== "person"){ box.style.display = "none"; return; }
  const names = consolidatedPeopleNames();
  if(!names.length){ box.style.display = "none"; return; }
  if(!consolidatedActivePerson || !names.includes(consolidatedActivePerson)) consolidatedActivePerson = names[0];
  box.style.display = "";
  box.innerHTML = names.map(n=>`<button class="${n===consolidatedActivePerson?"active":""}" data-name="${escapeHtml(n)}">${escapeHtml(n)}</button>`).join("");
  box.querySelectorAll("button").forEach(btn=>{
    btn.onclick = ()=>{
      consolidatedActivePerson = btn.dataset.name;
      renderConsolidatedNotes();
    };
  });
}

function renderConsolidatedNotes(){
  const box = document.getElementById("consolidatedNotes");
  if(!box) return;
  renderPeopleTabs();

  if(consolidatedViewMode !== "person"){
    box.innerHTML = buildConsolidatedReport().map(s=>`
      <div style="margin-top:10px;">
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:var(--accent-teal); margin-bottom:4px;">${escapeHtml(s.heading)}</div>
        <ul class="compact-list">${s.lines.length ? s.lines.map(l=>`<li>${escapeHtml(l)}</li>`).join("") : "<li>Nothing here yet.</li>"}</ul>
      </div>
    `).join("");
    return;
  }

  const names = consolidatedPeopleNames();
  if(!names.length){
    box.innerHTML = `<p class="empty-note" style="margin-top:10px;">Nothing to show yet — add some notes/finds, or merge in a teammate's Sync code.</p>`;
    return;
  }
  const name = consolidatedActivePerson || names[0];
  const personSection = buildConsolidatedReportByPerson().find(s=> s.heading === name);
  const planLines = planLinesForPerson(name);
  const sections = [
    { heading: "Saved Plan", lines: planLines.length ? planLines : ["Nothing saved yet."] },
    { heading: "Everything else", lines: (personSection && personSection.lines.length) ? personSection.lines : ["Nothing here yet."] }
  ];
  box.innerHTML = `<p class="empty-note" style="margin:6px 0 4px;">${escapeHtml(name)}'s page — pulled from their synced notes and last saved Plan snapshot.</p>` +
    sections.map(s=>`
      <div style="margin-top:10px;">
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:var(--accent-teal); margin-bottom:4px;">${escapeHtml(s.heading)}</div>
        <ul class="compact-list">${s.lines.map(l=>`<li>${escapeHtml(l)}</li>`).join("")}</ul>
      </div>
    `).join("");
}

// Rolled up by default — everyone's own notes already surface in their
// own tab wherever they were logged (Plan, Bingo, My Character), so
// this combined view is only needed occasionally, not on every visit.
const consolidatedToggleBtn = document.getElementById("consolidatedToggleBtn");
if(consolidatedToggleBtn) consolidatedToggleBtn.onclick = ()=>{
  const body = document.getElementById("consolidatedNotesBody");
  if(!body) return;
  const nowOpen = body.style.display === "none";
  body.style.display = nowOpen ? "" : "none";
  consolidatedToggleBtn.textContent = nowOpen ? "Hide all notes ▴" : "Show all notes ▾";
};

const copyConsolidatedBtn = document.getElementById("copyConsolidatedBtn");
if(copyConsolidatedBtn) copyConsolidatedBtn.onclick = (e)=>{
  if(consolidatedViewMode === "person" && consolidatedActivePerson){
    const name = consolidatedActivePerson;
    const personSection = buildConsolidatedReportByPerson().find(s=> s.heading === name);
    const planLines = planLinesForPerson(name);
    const text = [
      `Saved Plan:\n` + (planLines.length ? planLines.map(l=>`- ${l}`).join("\n") : "- Nothing saved yet."),
      `Everything else:\n` + ((personSection && personSection.lines.length) ? personSection.lines.map(l=>`- ${l}`).join("\n") : "- Nothing here yet.")
    ].join("\n\n");
    copyText(`${name}'s Boomtown page:\n\n` + text, e.target);
    return;
  }
  const sections = consolidatedViewMode === "person" ? buildConsolidatedReportByPerson() : buildConsolidatedReport();
  const text = sections.map(s=> `${s.heading}:\n` + (s.lines.length ? s.lines.map(l=>`- ${l}`).join("\n") : "- Nothing here yet.")).join("\n\n");
  copyText(`Boomtown consolidated notes (by ${consolidatedViewMode}):\n\n` + text, e.target);
};

document.querySelectorAll("#consolidatedViewToggle button").forEach(btn=>{
  btn.onclick = ()=>{
    document.querySelectorAll("#consolidatedViewToggle button").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    consolidatedViewMode = btn.dataset.view;
    renderConsolidatedNotes();
  };
});

renderConsolidatedNotes();

// ===============================
// OFFICIAL LIVE INTEL — genuinely sourced findings from the daily
// auto-update's Reddit/social-media check, not a user's own log (that's
// the separate "sightings" feature below, which is personal + synced).
// Each entry must be real and sourced — the daily update never invents
// these. `confirmed:false` entries are rumour/fan speculation and are
// labelled as such, never presented as fact. Kept short — stale entries
// get removed by the daily update rather than piling up.
// ===============================
const officialLiveIntel = [
  { text:"Boomtown secured planning permission for a 20% capacity boost this chapter — from roughly 66,000 up to just under 77,000 attendees — the scale behind the 'Radical Redesign' push for more space, more woodland and more hidden places across the whole site.", source:"South Downs National Park Authority planning approval, via festival trade press", when:"2026", confirmed:true },
  { text:"Grand Central has moved to roomier woodland terrain as part of the redesign — if you remember it from a previous chapter, don't expect it in the same spot this year.", source:"Official Chapter Five redesign coverage", when:"2026", confirmed:true },
  { text:"Hydro XL has taken over the former Origins stage footprint in Downtown and doubled in capacity to 20,000, running entirely on green hydrogen fuel cells — one of the UK's first large-scale stages to do so.", source:"Boomtown official announcement / festival press", when:"2026", confirmed:true },
  { text:"Metropolis's Job Centre — long reported closed and folded into the Betterverse™ storyline — is confirmed reopening for Chapter Five as 'Jobcentre 2.0', now with aptitude tests, biometric data collection and new jobs to appraise your skillset.", source:"Boomtown Jobcentre official social posts", when:"2026", confirmed:true },
  { text:"Confirmed headliners span Kneecap, Faithless, Four Tet, Scissor Sisters, Madness and Skrillex — the widest genre spread the main stages have had in years, with more live bands on the bill than any previous chapter (deliberately broadening past the bass-heavy lineups of recent chapters).", source:"Official 2026 lineup announcement", when:"2026", confirmed:true },
  { text:"Hilltop has been reborn as a dedicated live-music hub for Chapter Five — worth knowing if you want guitars and bands in the mix alongside the electronic headliners this year.", source:"Boomtown 'Radical Redesign' site announcements", when:"2026", confirmed:true }
];

function loadOfficialLiveIntel(){
  const box = document.getElementById("officialLiveIntelList");
  if(!box) return;
  if(!officialLiveIntel.length){ box.innerHTML = ""; return; }
  box.innerHTML = officialLiveIntel.map(i=>`
    <div class="item" style="margin-top:8px;">
      <span class="status-pill2 ${i.confirmed ? "confirmed" : "rumoured"}">${i.confirmed ? "confirmed" : "rumour"}</span>
      <p style="margin-top:6px;">${escapeHtml(i.text)}</p>
      <small style="color:var(--text-muted);">${escapeHtml(i.source)}${i.when ? " · " + escapeHtml(i.when) : ""}</small>
    </div>
  `).join("");
}
loadOfficialLiveIntel();

// "Search for clues now" — investigated before building anything: this
// is a static GitHub Pages app with no server component beyond Firestore
// (used only for the sync room), running on Firebase's free Spark plan.
// That rules out every "proper" live-search option in order:
//   1. Existing connectors (Firestore) can't do web/social search at all.
//   2. There is no free, keyless, CORS-open public API for Instagram/X/
//      Reddit search that's safe to call directly from a static site —
//      any real key would be exposed client-side to every visitor, and
//      Reddit's own API blocks unauthenticated cross-origin fetches at
//      any real scale (and its ToS doesn't allow this attribution-free).
//   3. A Firebase Cloud Function could proxy a real search, but outbound
//      networking from Functions needs the paid Blaze plan — not free.
//   4. So: the lightweight, reliable fallback the spec itself calls for.
// This button doesn't fetch or scrape anything in-app (no fragile
// parsing, no rate limits to hit, nothing to silently break) — it just
// opens X's own live search in a new tab with a combined query covering
// social chatter, festival news and story clues in one go, the same way
// the "quick-check searches" links below it already work. Genuinely
// fresh, user-triggered results, zero backend, zero secrets, free
// forever — the daily-checked officialLiveIntel list above stays the
// source of truth for anything worth folding permanently into the app.
const searchForCluesBtn = document.getElementById("searchForCluesBtn");
if(searchForCluesBtn) searchForCluesBtn.onclick = ()=>{
  const note = document.getElementById("searchForCluesNote");
  const query = "boomtown (radical redesign OR secret set OR update OR clue)";
  const win = window.open(`https://twitter.com/search?q=${encodeURIComponent(query)}&f=live`, "_blank", "noopener");
  if(note) note.textContent = win
    ? "Opened a live search in a new tab — anything genuinely sourced from here or elsewhere gets folded into the list above by the daily update."
    : "Your browser blocked the pop-up — allow pop-ups for this site, or use one of the search links further down instead.";
};

// ===============================
// GLOSSARY
// ===============================
const glossary = [
  { term:"Boomtown bucks", def:"The story's in-game currency — earn, blag or trade for it, then use it to bribe characters or unlock information." },
  { term:"The Daily Rag", def:"The in-universe newspaper, published through the event — pick up copies for story updates and gossip." },
  { term:"Amnesty points", def:"Stations near entry where you can dispose of anything prohibited before you're searched, no questions asked." },
  { term:"Eco Bond", def:"A deposit-and-return scheme encouraging you to take your tent and rubbish home — part of Boomtown's leave-no-trace push." },
  { term:"Safer Spaces", def:"Support for sexual harassment, assault and domestic violence, based in Pepperpot Market, also roaming the site." },
  { term:"IONA", def:"The Network's sentient mycelium-network AI, based at the Temple of Zero in Botanica." },
  { term:"BBXL™", def:"This chapter's corporate antagonist — the merger of BIGACORP™ and BETTERCORP™, running a space programme." },
  { term:"BLIP", def:"Boomtown Lifestyle Important Product — Patrick Kahn's rebrand of his BLEP (Boomtown eLection oPportunities) campaign after losing the 2024 district election, exclusive to VIPPs. What it actually does is still part of the mystery. (Confirmed via Boomtown's own Letsbe Avenue district-spotlight post.)" },
  { term:"VIPP", def:"A status/tier referenced in this chapter's BLIP storyline — keep an ear out on-site for what it actually means this year." },
  { term:"Luck Exchange", def:"Letsbe Avenue's bureaucratic outfit, now expanded into Area 404 to help the Guardians manage the paperwork of power — including handing out 'work permits' to train new Guardians. (Confirmed via Boomtown's own district-spotlight posts.)" },
  { term:"Black Goo", def:"Aurora Venturestone's lucrative and distinctly murky side hustle in Metropolis, run alongside her Betterverse™ empire — nobody's said what's actually in it. (Confirmed via Boomtown's own Metropolis district-spotlight post.)" },
  { term:"Digital Foreverness", def:"The rumoured fate awaiting anyone who gets stuck in the crumbling Betterverse™ during one of the inGeniuses' unofficial urban-explorer tours — go carefully. (Confirmed via Boomtown's own Metropolis district-spotlight post.)" },
  { term:"Vibe Check", def:"Chapter Five's community-responsibility campaign around wellness, party safety and looking out for your crew." },
  { term:"The Observatory", def:"A genuine 2026 academic research hub on site, led by psychologist Dr Martha Newson, studying identity and behaviour at live events — real research, not story canon." },
  { term:"Lion's Gate Portal", def:"The story's central portal art piece — last chapter's closing ceremony used it to foretell the Lion's Den's return to Temple Valley this year." },
  { term:"Von Vanderland", def:"The fan-built settlement in Copperwood dedicated to Edna Von Vanderhaus and her film 'Race to the Red Planet.'" },
  { term:"inGeniuses", def:"Metropolis workers laid off by Bettercorp™, now running unofficial 'urban explorer' tours into the glitching Betterverse™." },
  { term:"Temple of Zero", def:"Botanica's transformed temple — home to The Network and IONA, and the site of the recurring photocopier mystery Shadow Post is tied up in." },
  { term:"People's Republic of Oldtownia", def:"Rufus the Red's declared separatist state for Oldtown, formed after the district was rebuilt uphill following Area 404's expansion." },
  { term:"Den of Dis Order", def:"Rufus the Red's inner circle of circus hustlers, fortune tellers and rogues, running Oldtown's day-to-day chaos behind the separatist push." },
  { term:"Hippie Highway", def:"The steep hill path connecting Downtown and Hilltop — the walking route between the site's two halves, alongside The Stairs." },
  { term:"The Stairs", def:"A temporary staircase structure linking Downtown and Hilltop, the alternative to walking Hippie Highway." },
  { term:"Kaboodle", def:"Boomtown's official account system for tickets and resale — the only legitimate way to buy or transfer a ticket after the initial sale." },
  { term:"Agents of Change", def:"A sign-up scheme for Chapter Five: a badge, an HQ, a recycled-T-shirt screen print, and early access to certain quests." },
  { term:"Cloak of Hope", def:"A collective on-site artwork — stitch a 10–15cm hope patch of your own to add to it." },
  { term:"Reparium", def:"A free volunteer repair hub that debuted in 2025; look out for it returning if your gear needs rescuing." },
  { term:"Camp Orchid / Camp Skylark", def:"Boomtown's premium camping options. Camp Orchid Downtown sits by West Gate for public-transport arrivals; Camp Skylark splits into Hilltop and Sunset sites for 2026, Sunset nearest South Gate." }
];

const glossarySearch = document.getElementById("glossarySearch");
function currentGlossaryList(){
  const term = (glossarySearch && glossarySearch.value || "").trim().toLowerCase();
  if(!term) return glossary;
  return glossary.filter(g=> g.term.toLowerCase().includes(term) || g.def.toLowerCase().includes(term));
}
function loadGlossary(){
  const list = currentGlossaryList();
  document.getElementById("glossaryList").innerHTML = list.length ? list.map(g=>`
    <div class="item"><strong>${escapeHtml(g.term)}</strong><p style="margin-top:4px; color:var(--text-muted); font-size:14px;">${escapeHtml(g.def)}</p></div>
  `).join("") : `<p class="empty-note">No terms match "${escapeHtml(glossarySearch ? glossarySearch.value.trim() : "")}".</p>`;
}
if(glossarySearch) glossarySearch.oninput = loadGlossary;
loadGlossary();

// ===============================
// FESTIVAL GUIDE
// ===============================
// Split across three containers positioned to match each card's actual
// topic (story-deep-dive stays with the Story section; extras/logistics
// render right after their matching summary card in Just for fun /
// Logistics & practical stuff), instead of one flat container that used
// to sit only in the Story area — extras and logistics cards had no
// business rendering there, and their JS-inserted section dividers used
// to collide with the id of the plain summary cards elsewhere on the
// page (jumpBeyondMusic, jumpLogistics), silently breaking navigation
// to whichever one lost the id lookup.
const GUIDE_CONTAINERS = {
  story: document.getElementById("guideStoryContent"),
  extras: document.getElementById("guideExtrasContent"),
  logistics: document.getElementById("guideLogisticsContent")
};

const chapterFiveGuide = [
  { section:"story", title:"Chapter Five — the one-page briefing", html:"<p><strong>Then:</strong> The Collector was freed at the 2025 closing ceremony and passed leadership to The Network. <strong>Now:</strong> Mr Biga and Aurora Venturestone have merged their companies into BBXL™ and are pushing a space programme that treats Earth as a ‘single-use planet’. <strong>The pressure point:</strong> BBXL is draining the city’s resources while still attracting citizens into its VIP world. The Network wants a shared, people-led redesign — but that is not yet a victory.</p>" },
  { section:"story", title:"🧩 This chapter's central question", text:"Chapter Five asks whether The Network can actually hand real power back to the people — or whether BBXL and the districts' own power plays make that impossible. Following the story district to district is how you find out." },
  { section:"story", title:"📰 What's new this chapter", text:"Chapter Five's redesign relocated some stages and opened new spaces. Thrutopia is a brand-new district — talks, workshops and rest space in the woodlands, alongside the Cloak of Hope collective artwork, a genuine on-site Observatory research study, and the Reparium repair hub returning. On the stages side: the Lion's Den is back in the Temple Valley amphitheatre, Hilltop is now built around live music, and Hydro XL — a new hydrogen-powered flagship stage — has been expanded and relocated to Downtown (the full stage-by-stage and hidden-venue directory is on the Map tab). This card gets edited in place as new sourced details come in, rather than growing a fresh note every time something changes — it should always read as where things stand now, not a log of when each fact arrived." },
  { section:"story", title:"A simple way to follow the story", html:"<ul class=\"compact-list\"><li><strong>Start with a side:</strong> Area 404 for power and policing; Botanica for portals, IONA and Shadow Post; Letsbe Avenue for the suspiciously cheerful BLIP product.</li><li><strong>Ask for a motive:</strong> ‘What do you want?’, ‘Who benefits?’, ‘Who should we speak to next?’ works better than hunting for a scripted answer.</li><li><strong>Keep a chain:</strong> person → place → strange phrase → next lead. Add it to the district note straight away, then compare notes as a group.</li><li><strong>Watch the public moments:</strong> announcements, meetings, ceremonies, arguments and queues are often more useful than an empty-looking door.</li></ul>" },
  { section:"story", title:"🕹 How the story actually works", text:"It's not something you read, it's something you play — closer to immersive theatre than a puzzle with one right answer. Street actors are in character across the whole site; approach them, ask questions, and stay in the fiction as long as you can bear it. They'll usually feed you a lead, a rumour, an object, or point you toward another district or person. Pick up copies of The Daily Rag (the in-universe newspaper) wherever you see them — often the clearest single source of plot for that day. Trade information, do favours, pay with 'Boomtown bucks' if you pick some up, and don't be afraid to lie, bluff or be a bit cheeky — the actors are trained to work with whatever you give them. Some of the best finds come from just opening doors that look like scenery, especially around Oldtown and Metropolis." },
  { section:"story", title:"🗺 A game plan for the weekend", text:"There's no single fixed path — it branches by who you meet — but this rhythm gets you properly pulled in rather than wandering past it. Wed/Thu (quiet build-up): walk every district once, cold, just to get your bearings and spot which plot grabs you. Friday daytime: the single best window all weekend — quieter, you're not tired or drunk yet, and actors have more time to engage properly. Pick your district and go looking for a person, not a place: a market stall, a bar, a 'closed' door. Fri evening–Sat: once you're in with one district you'll usually get passed sideways to another (Botanica's Network sending you toward Area 404's Guardians, say) — follow it rather than restarting cold elsewhere. Sat/Sun: threads tend to converge and pay off in bigger set-piece scenes — keep an ear out for anything that sounds like a public gathering, announcement or 'trial'. This is general guidance based on how past chapters have run; the exact actors, locations and beats for Chapter Five will only reveal themselves on-site." },
  { section:"story", title:"🎯 Tips to actually do well", text:"Talk to everyone in costume, not just the obviously theatrical ones — some of the best characters look like ordinary festival staff at first glance. Ask direct questions ('who are you', 'what's going on here', 'who's in charge') — actors are built to answer and redirect you. Revisit the same spot at a different time of day: a 'dead end' at 2pm can be very much alive at 10pm. Write down names and phrases you don't recognise and check them against the Characters and Glossary lists in Discover — half the fun is realising two odd conversations were connected. Go in a small group of 2–3 rather than a big pack, and split up occasionally so you're covering more ground and can compare notes after. Log everything in Discover's clue log per district — you will forget who told you what by day three. And don't expect a tidy ending: threads resolve in scenes, not menus, sometimes as a big public moment, sometimes as a quiet answer from one actor — both count." },
  { section:"story", title:"🔍 Where to start if you're not sure", text:"Area 404 and Botanica are this chapter's two poles — the deepfake cover-up versus The Network trying to expose it — so starting in either gets you into the main plot fastest. If you'd rather ease in first, Letsbe Avenue's BLIP subplot is lower-stakes and a good warm-up before diving into the bigger factions." },
  { section:"story", title:"🆘 If you're stuck, or want to see it through", text:"There's no single storyline to solve — it's many overlapping ones, and which you find depends on district, who you talk to, and luck. If a thread goes cold, just ask an actor directly; they're built to nudge you toward the next step rather than leave you hanging. In past chapters, sticking with one district has meant collecting a kind of 'stamp' at each stop, which eventually unlocks a bigger, sometimes intense final scene for that storyline. Don't expect to solve every district in one weekend — most people don't, and the festival's actual ending is a closing ceremony for everyone regardless of how much you've uncovered." },
  { section:"story", title:"Districts as story threads", html:"<p><strong>Area 404:</strong> having won last year's election, it now runs the city — Chief Guardian Mr Biga (appointed by The Collector) is training up more Guardians at a boot camp, and the Luck Exchange has expanded in from Letsbe Avenue to hand out 'work permits' and manage the paperwork of power. Some residents say the Guardians have gotten drunk on it, fleecing people with 'official' fines.</p><p><strong>Botanica:</strong> The Great Mother, still smarting from her electoral defeat, is plotting a ritual to sacrifice her followers and fire herself into her own portal to ASCEND — competing with The Collector, and sitting alongside Temple of Zero's Shadow Post / IONA photocopier mystery.</p><p><strong>Copperwood:</strong> now Edna 'VVH' Von Vanderhaus's permanent home and self-appointed Creative Director's chair, turning the district into a live film set for <em>Race to the Red Planet</em> — this year pioneering 'Actual Live Sound'.</p><p><strong>Oldtown:</strong> Rufus the Red and the Den of Dis Order are building the People's Republic of Oldtownia after a hard year moving their whole community.</p><p><strong>Metropolis:</strong> Aurora Venturestone, CEO of Betterverse™, now runs the district herself with Guardian help — Bettercorp™ posts record profits despite mass layoffs, while she quietly runs a 'Black Goo' side hustle. Laid-off inGeniuses offer illegal urban-explorer tours into the crumbling Betterverse™, risky because of 'Digital Foreverness'.</p><p class=\"empty-note\">Boomtown's own current copy also references an eighth city district beyond the seven this guide tracks (the five core plot districts, Letsbe Avenue and Thrutopia) — treat the exact map layout as unconfirmed until you're looking at it on-site.</p><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/discover\" target=\"_blank\" rel=\"noopener\">Official Discover &amp; district spotlights</a>" },
  { section:"story", title:"Ceremonies & city-wide moments", html:"<p>The opening and closing ceremonies are the official bookends of the chapter and are worth treating as story events, not merely big shows. Between them, The Daily Rag, district meetings, public broadcasts and characters’ sudden invitations are your best catch-up tools. If you hear a crowd gathering for an announcement, go.</p><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/discover\" target=\"_blank\" rel=\"noopener\">Official story & districts</a>" },
  { section:"extras", title:"Non-music things actually worth pencilling in", html:"<ul class=\"compact-list\"><li><strong>Thrutopia:</strong> new for Chapter Five — talks, workshops and thoughtful daytime programming around imagining better futures, with open workshop submissions (see Get Involved in Discover).</li><li><strong>The Retreat:</strong> massages, hot tubs, sauna/cold splash, sound baths, beauty and maker sessions. It is in the Thrutopia woodlands; book ahead for the most popular slots.</li><li><strong>Cloak of Hope:</strong> stitch a 10–15cm hope patch on-site for the collective artwork.</li><li><strong>Agents of Change:</strong> sign up for the badge, HQ, recycled-T-shirt screen print and early quest access.</li><li><strong>The Observatory:</strong> take part in a genuine 2026 academic study on identity and behaviour at live events, led by Dr Martha Newson.</li><li><strong>Reparium:</strong> it debuted as a free volunteer repair hub in 2025; look out for its return if gear needs rescuing.</li></ul>" },
  { section:"extras", title:"The Retreat — quick booking guide", html:"<p>Current listings include 90-minute spa/hot-tub access (£50), sauna and cold splash (£35), sound baths (£20), massages from £68, plus clay and silver workshops. Bring swimwear for the water/heat sessions; towel rental is available. It is separate from the festival ticket and the official advice is to book early.</p><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/the-retreat\" target=\"_blank\" rel=\"noopener\">Browse & book The Retreat</a>" },
  { section:"extras", title:"🕵 Hidden venues, shops & the full directory", text:"Beyond the 18 named stages, 40+ confirmed hidden venues, shops, workshops and support spaces are scattered through the districts, plus a handful of past-chapter names with no 2026 evidence — deliberately unlisted anywhere on an official map. The Map tab now has the full filterable confirmed/rumoured directory with genre and info for every one we could source, alongside the schematic itself. This redesign also moved some of the stages themselves: the Lion's Den is back in the Temple Valley amphitheatre, Hilltop is now built around live music, and Hydro XL — the new hydrogen-powered flagship stage — has been expanded and relocated to Downtown." },
  { section:"extras", title:"🎡 Fairground &amp; leisure", html:"<p>Beyond the stages, expect a scattering of fairground and leisure attractions — Boomtown's own 2026 guide confirms a chair-o-plane ride near Area 404/Downtown, and past chapters have run a retro amusements arcade and vintage fairground rides (waltzers and similar) elsewhere on site. Treat the wider fairground as a strong likelihood rather than a locked-in promise until you see it. The full rundown, with what's confirmed vs rumoured, is in the venue directory on the Map tab.</p><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/news/boomtown-chapter-five-radical-redesign-essential-guide\" target=\"_blank\" rel=\"noopener\">Official Chapter Five essential guide</a>" },
  { section:"logistics", title:"🎫 Tickets & resale", html:"<p>Boomtown 2026 sold out during its initial release. If you're still after a ticket, resale runs exclusively through the official Kaboodle account system on the Boomtown site — never buy from unofficial resale sites or social media listings, as tickets are registered to the original buyer and unofficial transfers can be refused entry.</p><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/tickets\" target=\"_blank\" rel=\"noopener\">Official tickets &amp; resale</a>" },
  { section:"logistics", title:"💳 Cashless", html:"<p>Boomtown runs on cashless RFID wristbands — top up before or on arrival, either through your Boomtown account or on-site top-up points.</p><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/info/cash-free\" target=\"_blank\" rel=\"noopener\">Official Cash Free page</a>" },
  { section:"logistics", title:"⛺ Camping field guide", text:"The site splits roughly into two halves either side of a big central hill: Downtown (west) and Hilltop (east) — worth knowing which half you're in before you start walking. West Camping and Downtown Camping sit nearest West Gate and the public transport hub, handy if you arrived by coach or shuttle. Meadow Camping is the accessible campsite — apply in advance if you need it, spaces are limited and prioritised for accessibility bookings. Valley and Temple Valley Camping sit toward Hilltop, closer to that side's stages. East Camping and Campervan Field are nearest East Gate and the car parks. Quiet Camping is set apart for those wanting more sleep. Standard fields aren't numbered, so pick a landmark (a flag, a food stall, a distinctive tree) and save it in Notes so you can find your tent at 2am." },
  { section:"logistics", title:"🍺 Alcohol — what you can bring in", html:"<p>There is a limit to the amount of alcohol you can bring on site. For a weekend ticket you may bring up to:</p><ul class=\"compact-list\"><li>16 x 440ml cans of lager/cider/beer, OR</li><li>18 x 250ml cans of premixed spirit drinks, OR</li><li>3-litre box of wine, OR</li><li>7 litres of cider/lager/beer in plastic bottles or cans</li></ul><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/legal/terms\" target=\"_blank\" rel=\"noopener\">Official Terms &amp; Conditions</a><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/info/safety\" target=\"_blank\" rel=\"noopener\">Official Safety page</a>" },
  { section:"logistics", title:"🚫 What not to bring", html:"<p>Aerosol paint cans, glass of any kind, and any alcohol beyond your first-entry allowance (see Alcohol above — there's no topping up on re-entry). Unsealed or unidentifiable e-cigarette liquid can also be confiscated.</p><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/info/safety\" target=\"_blank\" rel=\"noopener\">Official Safety page — full current list</a>" },
  { section:"logistics", title:"♻️ Sustainability", text:"Boomtown runs a leave-no-trace, no-litter policy — take your tent and rubbish home with you (there's an Eco Bond scheme to encourage it). No single-use plastic bottles on site; free water refill points are dotted around arenas and campsites, so bring a reusable bottle. Food stalls use compostable packaging only. The Reparium repair hub and on-site Permaculture and Energy Garden spaces are part of the same push." },
  { section:"logistics", title:"🧭 Vibe Check — take the pledge", html:"<p>Chapter Five's community-responsibility campaign, covering wellness, party safety and looking out for your crew: stay crew-conscious (keep people close, check in often), know your safe zones, party smart (know the risks, spot the signs), fuel up rather than burn out (real meals, hydration, spacers not chasers), and try at least one set or mission with a clear head. Boomtown runs a genuine pledge you can sign — anyone who takes it is in the running for festival prizes.</p><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/news/take-the-vibe-check-pledge\" target=\"_blank\" rel=\"noopener\">Take the Vibe Check pledge</a>" },
  { section:"logistics", title:"📍 Meeting up", text:"Agree a clear meeting point before you split up and save it in the Map tab. Don't rely on having signal to find each other — it's patchy on-site." },
  { section:"logistics", title:"🔋 Power", text:"Bring a charged power bank — this app and your photos are the main drain. Screens go dim fast in daylight, check brightness before you head out." }
];

// Only "story" gets its own divider/heading — its container
// (guideStoryContent, in the Discover markup) sits between the "Beyond
// the music" and "Get involved" cards, with no static heading of its own
// otherwise, so it needs one to visually separate from what's above it.
// Extras and logistics cards render directly into their container with no
// divider, since the summary card immediately above each container
// already introduces the topic; a second heading repeating the same
// title would be exactly the kind of duplicate-looking clutter this
// split was meant to fix.
const GUIDE_SECTION_LABELS = {
  story: "📖 The story, in depth"
};
const GUIDE_SECTION_IDS = {
  story: "jumpStoryDeep"
};

function loadGuide(){
  Object.values(GUIDE_CONTAINERS).forEach(el=>{ if(el) el.innerHTML = ""; });
  let lastSection = null;
  chapterFiveGuide.forEach(section=>{
    const container = GUIDE_CONTAINERS[section.section];
    if(!container) return;
    if(section.section && section.section !== lastSection){
      lastSection = section.section;
      const label = GUIDE_SECTION_LABELS[lastSection];
      if(label){
        const divider = document.createElement("div");
        divider.className = "daygroup";
        divider.id = GUIDE_SECTION_IDS[lastSection] || "";
        divider.textContent = label;
        container.appendChild(divider);
      }
    }
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h3>${section.title}</h3>${section.html || `<p>${section.text}</p>`}`;
    linkifyKeyTerms(card);
    container.appendChild(card);
  });
}

loadGuide();

// ===============================
// SETTINGS / RESET
// ===============================
document.getElementById("resetApp").onclick = ()=>{
  if(confirm("Clear all saved data on this device? This can't be undone.")){
    localStorage.clear();
    location.reload();
  }
};

// Fields that never leave this device via Sync (see the DATA ISOLATION
// MODEL note near Store/DEFAULTS above) — also left out of the
// shareable group snapshot below, so handing that file to the group
// can never leak one person's bingo card, character or private notes.
// "meeting" is deliberately absent — it's shared group data (stored on
// the room doc, not personal), and must survive things like device
// handoff instead of being wiped along with this device's own notes.
const PERSONAL_ONLY_KEYS = ["notes","customArtists","bingoCard","bingoMarked","bingoLocked","myCharacter","bingoCustomText","bingoLinesSeen","contributorName","roomCode","lastSyncedAt","seenHomeInfoCard","dismissedAddToHome","packingChecked","deviceId","lastPushedRoomId","personalClashChoices","personalClashTimes","lastOpenedAt","seenArtists"];

// Building the snapshot HTML is shared by both download flows below —
// each needs three fallbacks because a sandboxed viewer (like an
// embedded preview) can silently block a plain <a download> click.
// excludePersonal:true produces the shareable "group copy" variant.
//
// IMPORTANT: this snapshots a freshly-*fetched* copy of index.html
// (from cache/network, same as the service worker serves), never the
// live document.documentElement — every screen in this app is rendered
// into the DOM up front and just hidden with CSS (not removed), so a
// personal-only value like myCharacter's name is sitting in the live
// DOM's hidden Discover screen the moment it's ever been entered, and
// document.documentElement.outerHTML would happily capture it even
// though it's filtered out of the seed-data object below. Starting
// from the pristine served template sidesteps that entirely — it has
// no rendered personal content in it at all, only the seed script.
async function buildSnapshotHtml(opts){
  opts = opts || {};
  const keys = opts.excludePersonal ? Object.keys(DEFAULTS).filter(k=> !PERSONAL_ONLY_KEYS.includes(k)) : Object.keys(DEFAULTS);
  const saved = Object.fromEntries(keys.map(key=>[key, Store.get(key)]));
  // "activities" isn't in PERSONAL_ONLY_KEYS — both visibilities are
  // meant to be shared (see buildSyncPayload's own comment on this),
  // same as "schedule", so no stripping needed here any more either.
  const data = JSON.stringify(saved).replace(/</g, "\\u003c");
  const seedScript = `<script>window.__boomtownSavedData=${data};<\/script>`;
  let template;
  try{
    const res = await fetch("./index.html", { cache: "no-store" });
    template = await res.text();
  }catch(err){
    template = document.documentElement.outerHTML; // last-resort fallback if fetch fails entirely
  }
  return template.replace("</head>", `${seedScript}</head>`);
}

document.getElementById("downloadSnapshot").onclick = async ()=>{
  const note = document.getElementById("downloadStatusNote");
  try{
    const blob = new Blob([await buildSnapshotHtml()], { type:"text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Boomtown-Companion-2026-ours.html";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(link.href), 1000);
    note.textContent = "If a file didn't actually save (some in-app browsers block this silently), use the buttons below instead.";
  }catch(err){
    note.textContent = "Download blocked by this browser/viewer — use one of the buttons below instead.";
  }
};

document.getElementById("openSnapshotTab").onclick = async ()=>{
  const note = document.getElementById("downloadStatusNote");
  try{
    const blob = new Blob([await buildSnapshotHtml()], { type:"text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if(!win) throw new Error("popup blocked");
    note.textContent = "Opened in a new tab — use that tab's own save/share/print-to-PDF option to keep a copy.";
  }catch(err){
    note.textContent = "That was blocked too (likely a popup blocker, or this viewer doesn't allow it) — try 'copy the whole file as text' below.";
  }
};

document.getElementById("copySnapshotHtml").onclick = async (e)=>{
  copyText(await buildSnapshotHtml(), e.target);
  const note = document.getElementById("downloadStatusNote");
  note.textContent = "Copied the entire file as text — paste it into a plain text editor and save it with a .html extension.";
};

const downloadGroupSnapshotBtn = document.getElementById("downloadGroupSnapshot");
if(downloadGroupSnapshotBtn) downloadGroupSnapshotBtn.onclick = async ()=>{
  const note = document.getElementById("downloadGroupStatusNote");
  try{
    const blob = new Blob([await buildSnapshotHtml({ excludePersonal:true })], { type:"text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Boomtown-Companion-2026-group.html";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(link.href), 1000);
    note.textContent = "If a file didn't actually save (some in-app browsers block this silently), use the buttons below instead.";
  }catch(err){
    note.textContent = "Download blocked by this browser/viewer — use one of the buttons below instead.";
  }
};

const openGroupSnapshotTabBtn = document.getElementById("openGroupSnapshotTab");
if(openGroupSnapshotTabBtn) openGroupSnapshotTabBtn.onclick = async ()=>{
  const note = document.getElementById("downloadGroupStatusNote");
  try{
    const blob = new Blob([await buildSnapshotHtml({ excludePersonal:true })], { type:"text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if(!win) throw new Error("popup blocked");
    note.textContent = "Opened in a new tab — use that tab's own save/share/print-to-PDF option to keep a copy.";
  }catch(err){
    note.textContent = "That was blocked too (likely a popup blocker, or this viewer doesn't allow it) — try 'copy the whole file as text' below.";
  }
};

const copyGroupSnapshotHtmlBtn = document.getElementById("copyGroupSnapshotHtml");
if(copyGroupSnapshotHtmlBtn) copyGroupSnapshotHtmlBtn.onclick = async (e)=>{
  copyText(await buildSnapshotHtml({ excludePersonal:true }), e.target);
  const note = document.getElementById("downloadGroupStatusNote");
  note.textContent = "Copied the entire file as text — paste it into a plain text editor and save it with a .html extension.";
};

// renderVenueTable()/showCharacters()/loadGetInvolved() all first run
// earlier in this file than `characters`/`glossary` are fully defined
// (glossary is one of the very last things declared), so their
// inline-term links silently no-op that first time (see the try/catch
// in linkifyKeyTerms). Re-run them now, at the very end of the script
// once everything is defined, so the very first paint is fully linked
// too, not just after a user touches a filter/search.
renderVenueTable();
if(typeof characters !== "undefined") showCharacters(currentFilteredCharacters());
if(typeof loadGetInvolved === "function") loadGetInvolved();

// Timeline is the Lineup tab's default view (browseAllArtists() — the
// "Browse all artists" button — switches to List/search on demand). Its
// render needs venueDirectory (for main-stage ordering), which like
// characters/glossary above is only fully defined by this point in the
// script, so the initial paint happens here rather than back where the
// view-toggle buttons are wired up.
if(artistsView === "timeline"){
  renderArtistTimelineDayTabs();
  renderArtistsTimeline();
}
