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
const APP_CACHE_VERSION = "v86";
const APP_BUILD_TIME = "2026-07-28T20:28:00Z";
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
// No separate floating indicator — an earlier version added one, but it
// needed its own safe-area math to avoid the iPhone notch and ended up
// as a stray sliver visible even at rest. Simpler and more reliable to
// just drive the existing "↓ Pull down to refresh & sync" header hint's
// own text through the same states, since it already sits somewhere
// safe-area-correct by construction.
// ===============================
(function setupPullToRefresh(){
  const THRESHOLD = 68;
  const hint = document.getElementById("ptrHint");
  const DEFAULT_TEXT = hint ? hint.textContent : "";
  let startY = null, pulling = false, refreshing = false, lastDist = 0;

  function atTop(){
    return (document.scrollingElement || document.documentElement).scrollTop <= 0;
  }

  function reset(){
    pulling = false; startY = null; lastDist = 0;
    if(hint && !refreshing) hint.textContent = DEFAULT_TEXT;
  }

  document.addEventListener("touchstart", (e)=>{
    if(refreshing || e.touches.length !== 1 || !atTop()) return;
    startY = e.touches[0].clientY;
    pulling = true;
  }, { passive: true });

  document.addEventListener("touchmove", (e)=>{
    if(!pulling || startY === null || refreshing) return;
    const delta = e.touches[0].clientY - startY;
    if(delta <= 0 || !atTop()){ reset(); return; }
    // Still pulling down from the very top — this is our gesture, not a
    // normal scroll, so take over the motion instead of letting the
    // browser's own rubber-band overscroll fight it.
    e.preventDefault();
    lastDist = delta * 0.5;
    if(hint) hint.textContent = lastDist >= THRESHOLD ? "↑ Release to refresh & sync" : DEFAULT_TEXT;
  }, { passive: false });

  document.addEventListener("touchend", ()=>{
    if(!pulling){ startY = null; return; }
    const pastThreshold = lastDist >= THRESHOLD;
    pulling = false; startY = null;
    if(!pastThreshold){ reset(); return; }

    refreshing = true;
    if(hint) hint.textContent = "Refreshing…";

    checkForStaleCopy().then(stale=>{
      if(stale) return forceAppRefresh(); // page is about to reload — nothing left to reset
      return Promise.resolve(typeof autoSyncNow === "function" ? autoSyncNow("pull to refresh") : null).then(()=>{
        if(hint) hint.textContent = "Up to date ✓";
        setTimeout(()=>{ refreshing = false; reset(); }, 1400);
      });
    }).catch(()=>{
      if(hint) hint.textContent = "Couldn't refresh — check signal";
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
// BACK TO TOP (Discover) — Discover is by far the longest screen, so a
// floating button to jump back to its top nav is worth having. Position
// is drag-to-move and remembered (plain localStorage, not Store — this
// is a device-local UI preference, not festival data, so it's
// deliberately kept out of the sync/backup system entirely). Only shown
// once you've actually scrolled down a bit, and only on Discover.
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

  function isDiscoverActive(){
    const el = document.getElementById("discover");
    return !!el && el.classList.contains("active");
  }

  function updateVisibility(){
    const shouldShow = isDiscoverActive() && (document.scrollingElement || document.documentElement).scrollTop > SHOW_AFTER_PX;
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
//    peopleSchedules[name]/peopleBingo[name]/peopleCharacters[name]
//    instead, kept separate per contributor, shown only in their own
//    person-tab on the Plan, Bingo, and My Character cards. Sync must
//    never read or write other personal fields: meeting, notes, roomCode.
const DEFAULTS = { schedule: [], peopleSchedules: {}, peopleBingo: {}, peopleCharacters: {}, discoveries: [], meeting: null, notes: "", customArtists: [], hiddenVenues: [], clues: {}, characterNotes: {}, involvedDone: [], theories: [], customSocials: [], contributorName: "", roomCode: "", quotes: [], bingoCard: [], bingoMarked: [], bingoLocked: false, myCharacter: null, sightings: [], customLandmarks: [], bingoCustomText: "", bingoLinesSeen: 0, lastSyncedAt: null, seenHomeInfoCard: false, dismissedAddToHome: false, packingChecked: [] };
const EMBEDDED_DATA = window.__boomtownSavedData || {};

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
  set(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
};

// ===============================
// TAB NAVIGATION
// ===============================
const screens = document.querySelectorAll(".screen");
const tabs = document.querySelectorAll(".tab");
tabs.forEach(tab=>{
  tab.onclick = ()=>{
    screens.forEach(s=>s.classList.remove("active"));
    tabs.forEach(t=>t.classList.remove("active"));
    document.getElementById(tab.dataset.tab).classList.add("active");
    tab.classList.add("active");
    window.scrollTo(0, 0);
    if(document.scrollingElement) document.scrollingElement.scrollTop = 0;
    if(tab.dataset.tab === "home" && typeof updateStats === "function") updateStats();
    if(tab.dataset.tab === "plan" && typeof renderNowNext === "function") renderNowNext();
    if(tab.dataset.tab === "discover" && typeof renderConsolidatedNotes === "function") renderConsolidatedNotes();
  };
});

// ===============================
// DISCOVER TOP NAVIGATOR — jump straight to any section instead of a
// long blind scroll, since it's grown to a lot of cards.
// ===============================
document.querySelectorAll("#discoverNav button").forEach(btn=>{
  btn.onclick = ()=>{
    const target = document.getElementById(btn.dataset.jump);
    if(target) target.scrollIntoView({ behavior:"smooth", block:"start" });
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
    if(target) target.scrollIntoView({ behavior:"smooth", block:"start" });
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
function updateCountdown(){
  const el = document.getElementById("countdownText");
  const gates = new Date("2026-08-12T12:00:00");
  const diff = gates - new Date();
  if(diff <= 0){
    el.textContent = "Gates are open — have the best one.";
    return;
  }
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  el.innerHTML = `<span style="font-size:22px; font-weight:700; color:var(--accent-amber);">${days}d ${hours}h ${mins}m</span><br>until gates open (Wed 12 Aug, approx. lunchtime)`;
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
// ===============================
const STAGE_GENRE = {
  "Anara Forest":"Bass / Drum & Bass", "Grand Central":"Live / Alternative",
  "Hidden Woods":"Bass / Dub / Jungle", "Hydro XL":"House / Dance",
  "The Lion's Den":"D&B / Reggae / Headline", "Nexus":"Party / Variety",
  "Rose and Clown":"Cabaret / Variety", "Spectrum 360":"Bass / Hardstyle",
  "Foggers Mill":"Eclectic / DJ", "The Fools Leap":"Folk / Balkan / Party",
  "Full Moon Ballroom":"Swing / Variety", "Hangar 161":"Alt / Punk / Metal",
  "Tangled Roots":"Dub / Bass", "Helix":"Breaks / Big Beat", "Infinity":"House / Techno",
  "Tribe of Frog":"Psytrance / Trance", "Acid Leak":"Acid / Techno",
  "The Boomtown Bobbies":"Bass / Party", "Sub Lab":"Dubstep / Bass",
  "Nachtlicker":"Techno / Electro", "Deviant Lounge":"Bass / Alt",
  "Gabber Kebabber":"Hardcore / Gabber", "E Numbers":"Bass / Rave",
  "The Pomegranate Parlour":"World / Eclectic", "Síbín Beag":"Irish Folk / Trad",
  "Twisted Time Machine":"Party / Playback Sets", "Botanica Zoo":"Bass / D&B",
  "Check app":"Unconfirmed"
};
function genreOf(a){ return a.genre || STAGE_GENRE[a.stage] || "Unconfirmed"; }

// One-line, genre-level (not artist-specific) descriptions of what each
// tag generally sounds like — shown under the tag on artist cards and
// in the Genre guide on the Artists screen, so a name you don't
// recognise still tells you roughly what you're walking into.
const GENRE_INFO = {
  "Acid / Techno": "Squelchy 303 acid lines over driving, hypnotic techno.",
  "Alt / Punk / Metal": "Guitar-led live bands — punk energy through to heavier metal.",
  "Bass / Alt": "Bass-weight production with an alternative, less-club-standard edge.",
  "Bass / D&B": "Fast breakbeats and heavy sub-bass — the drum & bass family.",
  "Bass / Drum & Bass": "Fast breakbeats and heavy sub-bass at full drum & bass tempo.",
  "Bass / Dub / Jungle": "Sound-system bass culture — dub weight and jungle's chopped breaks.",
  "Bass / Hardstyle": "Hard, distorted kicks and euphoric leads at high tempo.",
  "Bass / Party": "Crowd-pleasing bass music built for singalongs and big drops.",
  "Bass / Rave": "Old-school rave stabs and breakbeats with modern bass weight.",
  "Breaks / Big Beat": "Chunky breakbeats and big, riffy drops — festival breaks.",
  "Cabaret / Variety": "Live hosted variety — burlesque, comedy, circus and song.",
  "D&B / Reggae / Headline": "Big-stage drum & bass headliners alongside reggae/sound-system sets.",
  "Dub / Bass": "Deep, echo-laden dub reggae with sub-bass at its core.",
  "Dubstep / Bass": "Half-time wobble and weight — classic and modern dubstep.",
  "Eclectic / DJ": "Genre-hopping DJ sets that don't sit still in one lane.",
  "Folk / Balkan / Party": "Brass-heavy Balkan folk turned into a full-on party set.",
  "Hardcore / Gabber": "Very fast, distorted kicks — the hardcore/gabber end of the spectrum.",
  "House / Dance": "Classic four-to-the-floor house built for dancing.",
  "House / Techno": "The house/techno crossover — groovy but driving.",
  "Irish Folk / Trad": "Traditional Irish folk, played live and built for a sing-along.",
  "Live / Alternative": "Live bands outside the DJ/electronic lineup — alternative/indie leaning.",
  "Party / Playback Sets": "Themed nostalgia/playback sets built around a single album or era.",
  "Party / Variety": "Feel-good party sets — a bit of everything, low on pretension.",
  "Psytrance / Trance": "Fast, hypnotic, high-energy trance and psytrance.",
  "Swing / Variety": "Swing-era music and variety entertainment, live and danceable.",
  "Techno / Electro": "Driving, machine-built techno and electro.",
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

const artists = [
  // ================= WEDNESDAY =================
  // --- Wed: Hidden Woods ---
  {name:"Cal Jader (Movimientos)",stage:"Hidden Woods",day:"Wed",start:"16:00",end:"17:30"},
  {name:"Bryte & Burland",stage:"Hidden Woods",day:"Wed",start:"17:30",end:"18:30"},
  {name:"Marla Kether",stage:"Hidden Woods",day:"Wed",start:"18:30",end:"19:30"},
  {name:"The Nextmen",stage:"Hidden Woods",day:"Wed",start:"19:30",end:"21:00"},
  {name:"OneDa",stage:"Hidden Woods",day:"Wed",start:"21:00",end:"22:00"},
  {name:"Aziza Jaye",stage:"Hidden Woods",day:"Wed",start:"22:00",end:"23:00"},
  // --- Wed: Tangled Roots ---
  {name:"Lionpulse x Sinai",stage:"Tangled Roots",day:"Wed",start:"16:00",end:"17:00"},
  {name:"Roots Ginjah",stage:"Tangled Roots",day:"Wed",start:"17:00",end:"18:00"},
  {name:"DubTastic Music Ft. Youngalist",stage:"Tangled Roots",day:"Wed",start:"18:00",end:"19:00"},
  {name:"Jam Jah Sound",stage:"Tangled Roots",day:"Wed",start:"19:00",end:"20:00"},
  {name:"Vixen Sound",stage:"Tangled Roots",day:"Wed",start:"20:00",end:"21:00"},
  {name:"An Dannsa Dub (Live Dub Set) Ft. Wends",stage:"Tangled Roots",day:"Wed",start:"21:00",end:"22:00"},
  // --- Wed: Twisted Time Machine (Bad Apple Bar) ---
  {name:"One Direction Welcome Party",stage:"Twisted Time Machine",day:"Wed",start:"16:00",end:"17:00"},
  {name:"Far Out Man: Psychedelic 60s",stage:"Twisted Time Machine",day:"Wed",start:"17:00",end:"18:00"},
  {name:"Linkin Park: Hybrid Theory Album Playback",stage:"Twisted Time Machine",day:"Wed",start:"18:00",end:"19:00"},
  {name:"Funk & Seoul: K-Pop Rave",stage:"Twisted Time Machine",day:"Wed",start:"19:00",end:"20:00"},
  {name:"Alan Clusive's Eurotrash Mini Disco",stage:"Twisted Time Machine",day:"Wed",start:"20:00",end:"21:00"},
  {name:"Knight Club: Medieval Rave",stage:"Twisted Time Machine",day:"Wed",start:"21:00",end:"22:00"},
  {name:"Cider Drinkers Assembly",stage:"Twisted Time Machine",day:"Wed",start:"22:00",end:"23:00"},

  // ================= THURSDAY =================
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
  // --- Thu: Tangled Roots ---
  {name:"Lionpulse x Sinai",stage:"Tangled Roots",day:"Thu",start:"12:00",end:"13:00"},
  {name:"Daddy Nature B2B DJ Dansey",stage:"Tangled Roots",day:"Thu",start:"13:00",end:"14:00"},
  {name:"Cuppa T & Johnny Scratch Lee",stage:"Tangled Roots",day:"Thu",start:"14:00",end:"15:00"},
  {name:"Twende Takeover",stage:"Tangled Roots",day:"Thu",start:"15:00",end:"16:00"},
  {name:"Marla Kether",stage:"Tangled Roots",day:"Thu",start:"16:00",end:"17:00"},
  {name:"Ru Robinson",stage:"Tangled Roots",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Hiphoppapotamus B2B Fizzy Gillespie",stage:"Tangled Roots",day:"Thu",start:"18:00",end:"19:00"},
  {name:"Jinx In Dub",stage:"Tangled Roots",day:"Thu",start:"19:00",end:"20:00"},
  {name:"Cheza Lucina",stage:"Tangled Roots",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Ekula & Mista Jago",stage:"Tangled Roots",day:"Thu",start:"21:00",end:"22:00"},
  // --- Thu: Anara Forest ---
  {name:"Jimbitch B2B Stan Da Man",stage:"Anara Forest",day:"Thu",start:"14:00",end:"15:00"},
  {name:"Astar B2B Kaisha",stage:"Anara Forest",day:"Thu",start:"15:00",end:"16:00"},
  {name:"G-Class B2B RJD",stage:"Anara Forest",day:"Thu",start:"16:00",end:"17:00"},
  {name:"Bassi B2B Charli Brix",stage:"Anara Forest",day:"Thu",start:"17:00",end:"18:30"},
  {name:"Para B2B Umbra Ft. Strategy",stage:"Anara Forest",day:"Thu",start:"18:30",end:"20:00"},
  {name:"Sydney Bryce Live PA",stage:"Anara Forest",day:"Thu",start:"20:00",end:"21:00"},
  {name:"QZB Ft. Ellis Esco",stage:"Anara Forest",day:"Thu",start:"21:00",end:"22:00"},
  {name:"TeeBee Ft. MC Fokus",stage:"Anara Forest",day:"Thu",start:"22:00",end:"23:00"},
  {name:"Amoss Ft. MC Fokus",stage:"Anara Forest",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Tribe of Frog ---
  {name:"Ott",stage:"Tribe of Frog",day:"Thu",start:"14:00",end:"15:30"},
  {name:"Jakkar",stage:"Tribe of Frog",day:"Thu",start:"15:30",end:"17:00"},
  {name:"Ebru Al",stage:"Tribe of Frog",day:"Thu",start:"17:00",end:"18:30"},
  {name:"Minali",stage:"Tribe of Frog",day:"Thu",start:"18:30",end:"20:00"},
  {name:"Liquid Ross",stage:"Tribe of Frog",day:"Thu",start:"20:00",end:"21:30"},
  {name:"Neutron",stage:"Tribe of Frog",day:"Thu",start:"21:30",end:"23:00"},
  {name:"D-Ther",stage:"Tribe of Frog",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Nexus ---
  {name:"?",stage:"Nexus",day:"Thu",start:"14:00",end:"15:00"},
  {name:"RWKUS: 91-94 Jungle Review",stage:"Nexus",day:"Thu",start:"15:30",end:"16:30"},
  {name:"JayaHadADream",stage:"Nexus",day:"Thu",start:"17:00",end:"17:45"},
  {name:"Joe Yorke",stage:"Nexus",day:"Thu",start:"18:30",end:"19:30"},
  {name:"Gurriers",stage:"Nexus",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Komfortrauschen",stage:"Nexus",day:"Thu",start:"21:30",end:"22:30"},
  {name:"Keeno Live Ft. Vibre Strings",stage:"Nexus",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Spectrum 360 ---
  {name:"Holly Warcup B2B Miss Cabbage",stage:"Spectrum 360",day:"Thu",start:"15:00",end:"16:00"},
  {name:"Karlie Marx",stage:"Spectrum 360",day:"Thu",start:"16:00",end:"17:00"},
  {name:"Egg On Toast B2B Syntax",stage:"Spectrum 360",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Cicely B2B Hypershé",stage:"Spectrum 360",day:"Thu",start:"18:00",end:"19:00"},
  {name:"Peppa B2B Shirley Temper",stage:"Spectrum 360",day:"Thu",start:"19:00",end:"20:00"},
  {name:"Mollie Rush",stage:"Spectrum 360",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Promis3",stage:"Spectrum 360",day:"Thu",start:"21:00",end:"22:00"},
  {name:"Stinny Stone",stage:"Spectrum 360",day:"Thu",start:"22:00",end:"23:00"},
  {name:"Somniac One",stage:"Spectrum 360",day:"Thu",start:"23:00",end:"00:00"},
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
  // --- Thu: Rose and Clown ---
  {name:"Rose & Clown Opening Pilates Warmup",stage:"Rose and Clown",day:"Thu",start:"14:00",end:"14:30"},
  {name:"Loopy Takeover",stage:"Rose and Clown",day:"Thu",start:"14:30",end:"15:30"},
  {name:"Meg McHugh",stage:"Rose and Clown",day:"Thu",start:"15:30",end:"16:30"},
  {name:"The Third Nipple",stage:"Rose and Clown",day:"Thu",start:"16:30",end:"17:30"},
  {name:"Anna Prank B2B Ellament",stage:"Rose and Clown",day:"Thu",start:"17:30",end:"18:30"},
  {name:"Gorilla Tactics Rinseout",stage:"Rose and Clown",day:"Thu",start:"18:30",end:"19:15"},
  {name:"Raze Takeover",stage:"Rose and Clown",day:"Thu",start:"19:15",end:"20:00"},
  {name:"Octoposse",stage:"Rose and Clown",day:"Thu",start:"20:00",end:"21:00"},
  {name:"OneDa",stage:"Rose and Clown",day:"Thu",start:"21:00",end:"22:00"},
  {name:"Gorilla Tactics Rinseout",stage:"Rose and Clown",day:"Thu",start:"22:00",end:"22:45"},
  {name:"Mad Apple Circus",stage:"Rose and Clown",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Hangar 161 ---
  {name:"Music In Our Underpants",stage:"Hangar 161",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Dakka Skanks",stage:"Hangar 161",day:"Thu",start:"18:30",end:"19:30"},
  {name:"Pizzatramp",stage:"Hangar 161",day:"Thu",start:"20:00",end:"21:00"},
  {name:"The Menstrual Cramps",stage:"Hangar 161",day:"Thu",start:"21:30",end:"22:30"},
  {name:"Meryl Streek",stage:"Hangar 161",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: The Fools Leap ---
  {name:"shunTA!",stage:"The Fools Leap",day:"Thu",start:"12:00",end:"13:30"},
  {name:"The Sneak Eazies",stage:"The Fools Leap",day:"Thu",start:"14:00",end:"15:00"},
  {name:"Shanghai Treason",stage:"The Fools Leap",day:"Thu",start:"15:30",end:"16:30"},
  {name:"Fraser Morgan",stage:"The Fools Leap",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Girl In The Year Above",stage:"The Fools Leap",day:"Thu",start:"18:50",end:"19:30"},
  {name:"Scottish Fish",stage:"The Fools Leap",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Smag På Dig Selv",stage:"The Fools Leap",day:"Thu",start:"21:30",end:"22:30"},
  {name:"Clada",stage:"The Fools Leap",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Full Moon Ballroom ---
  {name:"Mad Apple Circus",stage:"Full Moon Ballroom",day:"Thu",start:"13:15",end:"14:15"},
  {name:"She's Got Brass",stage:"Full Moon Ballroom",day:"Thu",start:"14:45",end:"15:45"},
  {name:"Girl In The Year Above",stage:"Full Moon Ballroom",day:"Thu",start:"16:20",end:"17:00"},
  {name:"GrooveLine",stage:"Full Moon Ballroom",day:"Thu",start:"17:45",end:"18:45"},
  {name:"Clada",stage:"Full Moon Ballroom",day:"Thu",start:"19:15",end:"20:15"},
  {name:"Agbeko",stage:"Full Moon Ballroom",day:"Thu",start:"20:45",end:"22:00"},
  {name:"Franz Von",stage:"Full Moon Ballroom",day:"Thu",start:"22:30",end:"00:00"},
  // --- Thu: Foggers Mill ---
  {name:"The Back Wood Redeemers",stage:"Foggers Mill",day:"Thu",start:"13:00",end:"13:40"},
  {name:"Gurt Dog",stage:"Foggers Mill",day:"Thu",start:"14:00",end:"15:00"},
  {name:"Got Worms",stage:"Foggers Mill",day:"Thu",start:"15:30",end:"16:30"},
  {name:"Two Days as a Chimp",stage:"Foggers Mill",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Dog House Boat Boys",stage:"Foggers Mill",day:"Thu",start:"18:30",end:"19:30"},
  {name:"The Back Wood Redeemers",stage:"Foggers Mill",day:"Thu",start:"20:00",end:"21:00"},
  {name:"The Showhawk Duo",stage:"Foggers Mill",day:"Thu",start:"21:30",end:"22:30"},
  {name:"Shanghai Treason",stage:"Foggers Mill",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: The Boomtown Bobbies ---
  {name:"Scotland Yard Takeover",stage:"The Boomtown Bobbies",day:"Thu",start:"14:00",end:"17:00"},
  {name:"Merkata",stage:"The Boomtown Bobbies",day:"Thu",start:"17:00",end:"17:40"},
  {name:"Zamurai",stage:"The Boomtown Bobbies",day:"Thu",start:"18:20",end:"19:00"},
  {name:"Ka B2B Tomu",stage:"The Boomtown Bobbies",day:"Thu",start:"19:00",end:"20:00"},
  {name:"Kaisha",stage:"The Boomtown Bobbies",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Kelvin 373",stage:"The Boomtown Bobbies",day:"Thu",start:"21:00",end:"22:00"},
  {name:"Banshee",stage:"The Boomtown Bobbies",day:"Thu",start:"22:00",end:"23:00"},
  {name:"Zapya",stage:"The Boomtown Bobbies",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Soapranos Laundrette ---
  {name:"Lexii",stage:"Soapranos Laundrette",day:"Thu",start:"13:00",end:"14:00"},
  {name:"DJ Amber Rose",stage:"Soapranos Laundrette",day:"Thu",start:"14:00",end:"15:00"},
  {name:"Bumpah Takeover - Cheza Lucina",stage:"Soapranos Laundrette",day:"Thu",start:"15:00",end:"16:00"},
  {name:"Bumpah Takeover - Princess Xixi",stage:"Soapranos Laundrette",day:"Thu",start:"16:00",end:"17:00"},
  {name:"Bumpah Takeover - Thempress",stage:"Soapranos Laundrette",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Betsy Mae",stage:"Soapranos Laundrette",day:"Thu",start:"18:00",end:"19:00"},
  {name:"Morgane",stage:"Soapranos Laundrette",day:"Thu",start:"19:00",end:"20:00"},
  // --- Thu: Hotel Paradiso ---
  {name:"DJ Business Lady & Direct Debbie",stage:"Hotel Paradiso",day:"Thu",start:"18:00",end:"19:00"},
  {name:"Asher Ray & Goodfella",stage:"Hotel Paradiso",day:"Thu",start:"19:00",end:"20:00"},
  {name:"WBBL",stage:"Hotel Paradiso",day:"Thu",start:"20:00",end:"21:00"},
  {name:"DJ Hiphoppapotamus & Friends",stage:"Hotel Paradiso",day:"Thu",start:"21:00",end:"22:00"},
  {name:"Kaptin & Dregz",stage:"Hotel Paradiso",day:"Thu",start:"22:00",end:"23:00"},
  {name:"Daddy Skitz & Joe Burn",stage:"Hotel Paradiso",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Luck Exchange Casino ---
  {name:"Chattering Teeth Races",stage:"Luck Exchange Casino",day:"Thu",start:"19:05",end:"19:10"},
  {name:"Hold Your Horses",stage:"Luck Exchange Casino",day:"Thu",start:"19:10",end:"19:15"},
  {name:"Only Pools And Horses",stage:"Luck Exchange Casino",day:"Thu",start:"19:15",end:"19:20"},
  {name:"Play Your Cards Shite",stage:"Luck Exchange Casino",day:"Thu",start:"19:25",end:"19:40"},
  {name:"Beyblade Tournament",stage:"Luck Exchange Casino",day:"Thu",start:"19:40",end:"19:50"},
  {name:"Is It Piss?",stage:"Luck Exchange Casino",day:"Thu",start:"19:50",end:"20:00"},
  {name:"Wave",stage:"Luck Exchange Casino",day:"Thu",start:"20:05",end:"20:25"},
  {name:"Ayvbp",stage:"Luck Exchange Casino",day:"Thu",start:"20:25",end:"20:40"},
  {name:"Toybox",stage:"Luck Exchange Casino",day:"Thu",start:"20:40",end:"21:10"},
  // --- Thu: The Garden Centre ---
  {name:"Funkmaster General",stage:"The Garden Centre",day:"Thu",start:"14:00",end:"15:00"},
  {name:"Redpeppa",stage:"The Garden Centre",day:"Thu",start:"15:00",end:"16:00"},
  {name:"Rodderz",stage:"The Garden Centre",day:"Thu",start:"16:00",end:"17:00"},
  {name:"Dovetail",stage:"The Garden Centre",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Phillax",stage:"The Garden Centre",day:"Thu",start:"18:00",end:"19:00"},
  {name:"Dec",stage:"The Garden Centre",day:"Thu",start:"19:00",end:"20:00"},
  {name:"Astyx",stage:"The Garden Centre",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Diversion Audio Takeover",stage:"The Garden Centre",day:"Thu",start:"21:00",end:"23:00"},
  {name:"Nizan",stage:"The Garden Centre",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Botanica Zoo ---
  {name:"DJ Lessons",stage:"Botanica Zoo",day:"Thu",start:"18:00",end:"19:00"},
  {name:"Court Jester B2B Daddy Dopamine",stage:"Botanica Zoo",day:"Thu",start:"19:00",end:"20:00"},
  {name:"Niki Louder VS James Cunt",stage:"Botanica Zoo",day:"Thu",start:"20:00",end:"21:00"},
  {name:"DJ Dizzle B2B Peggy Vienetta",stage:"Botanica Zoo",day:"Thu",start:"21:00",end:"22:00"},
  {name:"Denis The Menis",stage:"Botanica Zoo",day:"Thu",start:"22:00",end:"23:00"},
  {name:"Slanty",stage:"Botanica Zoo",day:"Thu",start:"23:00",end:"23:55"},
  // --- Thu: The Immortal Children of the Eternal Seed ---
  {name:"Loose Forms Takeover",stage:"The Immortal Children of the Eternal Seed",day:"Thu",start:"20:00",end:"00:00"},
  // --- Thu: Topsy Turvy Trims ---
  {name:"Black Board Soundsystem",stage:"Topsy Turvy Trims",day:"Thu",start:"13:00",end:"16:00"},
  {name:"Goose",stage:"Topsy Turvy Trims",day:"Thu",start:"16:00",end:"17:00"},
  {name:"Hokey Cokey Cabaret",stage:"Topsy Turvy Trims",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Ignoring Izzy",stage:"Topsy Turvy Trims",day:"Thu",start:"19:00",end:"20:00"},
  {name:"Villain",stage:"Topsy Turvy Trims",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Frazr Musica",stage:"Topsy Turvy Trims",day:"Thu",start:"21:00",end:"22:00"},
  {name:"Merchant",stage:"Topsy Turvy Trims",day:"Thu",start:"22:00",end:"23:00"},
  {name:"She's Got Brass",stage:"Topsy Turvy Trims",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: PFP Robot ---
  {name:"Tripl3 B",stage:"PFP Robot",day:"Thu",start:"14:00",end:"15:00"},
  {name:"Audio Gutter",stage:"PFP Robot",day:"Thu",start:"15:00",end:"16:00"},
  {name:"Agent Scully",stage:"PFP Robot",day:"Thu",start:"16:00",end:"17:00"},
  {name:"Teotek",stage:"PFP Robot",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Special Guest",stage:"PFP Robot",day:"Thu",start:"18:00",end:"19:00"},
  // --- Thu: Sub Lab ---
  {name:"Bennett Ft Sylla, Limmz & Guest",stage:"Sub Lab",day:"Thu",start:"18:00",end:"19:00"},
  {name:"Stasis",stage:"Sub Lab",day:"Thu",start:"19:00",end:"20:00"},
  {name:"Nio B",stage:"Sub Lab",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Akira Ft Cola B",stage:"Sub Lab",day:"Thu",start:"21:00",end:"22:00"},
  {name:"Jaz Imsky Ft Special Guest MC",stage:"Sub Lab",day:"Thu",start:"22:00",end:"23:00"},
  {name:"1+1=??",stage:"Sub Lab",day:"Thu",start:"23:00",end:"23:59"},
  // --- Thu: Nachtlicker ---
  {name:"Shaggy FX",stage:"Nachtlicker",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Sînageddon",stage:"Nachtlicker",day:"Thu",start:"18:00",end:"19:00"},
  {name:"Nuks",stage:"Nachtlicker",day:"Thu",start:"19:00",end:"20:00"},
  {name:"Rizzy & The Gents Live",stage:"Nachtlicker",day:"Thu",start:"20:00",end:"20:45"},
  {name:"Theo Sheldrake",stage:"Nachtlicker",day:"Thu",start:"20:45",end:"22:00"},
  {name:"DJ Headtorch",stage:"Nachtlicker",day:"Thu",start:"22:00",end:"23:00"},
  {name:"Airbender",stage:"Nachtlicker",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Deviant Lounge ---
  {name:"Wrong'un Crew",stage:"Deviant Lounge",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Church of Donkology",stage:"Deviant Lounge",day:"Thu",start:"21:00",end:"22:00"},
  {name:"DJ Safe N Sound",stage:"Deviant Lounge",day:"Thu",start:"22:00",end:"23:00"},
  {name:"3dma",stage:"Deviant Lounge",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: E Numbers ---
  {name:"Kid Cosmit",stage:"E Numbers",day:"Thu",start:"19:00",end:"19:45"},
  {name:"Lounicorn",stage:"E Numbers",day:"Thu",start:"19:45",end:"20:30"},
  {name:"Theia's Orbit",stage:"E Numbers",day:"Thu",start:"20:30",end:"21:15"},
  {name:"D0llsw4g",stage:"E Numbers",day:"Thu",start:"21:45",end:"22:30"},
  {name:"Babiest Baby",stage:"E Numbers",day:"Thu",start:"22:30",end:"23:15"},
  {name:"Charles the Princess the DJ",stage:"E Numbers",day:"Thu",start:"23:15",end:"00:00"},
  // --- Thu: The Pomegranate Parlour ---
  {name:"Cassia",stage:"The Pomegranate Parlour",day:"Thu",start:"14:00",end:"15:00"},
  {name:"Scarba",stage:"The Pomegranate Parlour",day:"Thu",start:"15:00",end:"16:00"},
  {name:"Mattana",stage:"The Pomegranate Parlour",day:"Thu",start:"16:00",end:"17:00"},
  {name:"Me Miles & I",stage:"The Pomegranate Parlour",day:"Thu",start:"17:00",end:"18:00"},
  {name:"Somatic",stage:"The Pomegranate Parlour",day:"Thu",start:"18:00",end:"19:00"},
  {name:"Dmtree",stage:"The Pomegranate Parlour",day:"Thu",start:"19:00",end:"20:00"},
  {name:"Emma Ash",stage:"The Pomegranate Parlour",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Buddha",stage:"The Pomegranate Parlour",day:"Thu",start:"21:00",end:"22:00"},
  {name:"DJ Shakey",stage:"The Pomegranate Parlour",day:"Thu",start:"22:00",end:"23:00"},
  {name:"Illexxandra",stage:"The Pomegranate Parlour",day:"Thu",start:"23:00",end:"23:55"},
  // --- Thu: Busker's Wharf ---
  {name:"The Lobster Cabaret",stage:"Busker's Wharf",day:"Thu",start:"19:30",end:"21:00"},
  // --- Thu: Twisted Time Machine (Bad Apple Bar) ---
  {name:"The Abba Party",stage:"Twisted Time Machine",day:"Thu",start:"14:00",end:"15:00"},
  {name:"Tom Shanx & Rhi n B Live",stage:"Twisted Time Machine",day:"Thu",start:"15:00",end:"16:00"},
  {name:"Don't Diss My Ability",stage:"Twisted Time Machine",day:"Thu",start:"16:00",end:"18:00"},
  {name:"Guilty Pleasures Rewind Society",stage:"Twisted Time Machine",day:"Thu",start:"18:00",end:"19:00"},
  {name:"Very Daft Very Punk",stage:"Twisted Time Machine",day:"Thu",start:"19:00",end:"20:00"},
  {name:"Make EDM Great Again",stage:"Twisted Time Machine",day:"Thu",start:"20:00",end:"21:00"},
  {name:"Basic Pleasure Model",stage:"Twisted Time Machine",day:"Thu",start:"21:00",end:"22:00"},
  {name:"The Fleetwood Mac Celebration",stage:"Twisted Time Machine",day:"Thu",start:"22:00",end:"23:00"},
  {name:"My Chemical Hoemance",stage:"Twisted Time Machine",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Síbín Beag ---
  {name:"Fáilte Isteach Welcome In",stage:"Síbín Beag",day:"Thu",start:"14:00",end:"14:45"},
  {name:"Aurora Engine",stage:"Síbín Beag",day:"Thu",start:"15:15",end:"16:00"},
  {name:"FFTP",stage:"Síbín Beag",day:"Thu",start:"16:30",end:"17:15"},
  {name:"All for Jolly",stage:"Síbín Beag",day:"Thu",start:"17:45",end:"18:30"},
  {name:"The Groggy Dogs",stage:"Síbín Beag",day:"Thu",start:"18:30",end:"19:15"},
  {name:"Trad Folkin' Rocks House Band",stage:"Síbín Beag",day:"Thu",start:"20:30",end:"22:30"},
  // --- Thu: Helix ---
  {name:"Ze:Na",stage:"Helix",day:"Thu",start:"15:00",end:"16:00"},
  {name:"Music from the Mothership",stage:"Helix",day:"Thu",start:"16:00",end:"18:00"},
  {name:"Artemis B2B Esme Banks B2B Fluro",stage:"Helix",day:"Thu",start:"18:00",end:"19:30"},
  {name:"Cheetah B2B Janaway",stage:"Helix",day:"Thu",start:"19:30",end:"21:00"},
  {name:"Toby Ross",stage:"Helix",day:"Thu",start:"21:00",end:"22:30"},
  {name:"Ed Solo",stage:"Helix",day:"Thu",start:"22:30",end:"00:00"},
  // --- Thu: Mining for (g)Old Town ---
  {name:"DJ Shoulda Learnt The Clarinet",stage:"Mining for (g)Old Town",day:"Thu",start:"13:30",end:"14:30"},
  {name:"DJ Sarah Tonin",stage:"Mining for (g)Old Town",day:"Thu",start:"14:30",end:"16:00"},
  {name:"Wildsoul",stage:"Mining for (g)Old Town",day:"Thu",start:"16:00",end:"17:30"},
  {name:"Maggs",stage:"Mining for (g)Old Town",day:"Thu",start:"17:30",end:"19:00"},
  // --- Thu: End of the Line ---
  {name:"Donkline Takeover",stage:"End of the Line",day:"Thu",start:"14:00",end:"19:00"},
  {name:"DJ Shnoo",stage:"End of the Line",day:"Thu",start:"20:00",end:"20:45"},
  {name:"Merkata",stage:"End of the Line",day:"Thu",start:"20:45",end:"21:30"},
  {name:"Nego",stage:"End of the Line",day:"Thu",start:"21:30",end:"22:15"},
  {name:"Riguana",stage:"End of the Line",day:"Thu",start:"22:15",end:"23:00"},
  {name:"Norty",stage:"End of the Line",day:"Thu",start:"23:00",end:"00:00"},
  // --- Thu: Infinity ---
  {name:"Desiato DJs",stage:"Infinity",day:"Thu",start:"14:00",end:"16:00"},
  {name:"Hayliegh",stage:"Infinity",day:"Thu",start:"16:00",end:"17:30"},
  {name:"Paradisco Brad Bradley B2B Burly Chassis",stage:"Infinity",day:"Thu",start:"17:30",end:"19:30"},
  {name:"Paradisco Faith B2B Spicyivy",stage:"Infinity",day:"Thu",start:"19:30",end:"21:00"},
  {name:"Lips Sealed Club",stage:"Infinity",day:"Thu",start:"21:00",end:"22:30"},
  {name:"Sean Rudz",stage:"Infinity",day:"Thu",start:"22:30",end:"00:00"},

  // ================= FRIDAY =================
  // --- Fri: The Lion's Den ---
  {name:"Opening Ceremony",stage:"The Lion's Den",day:"Fri",start:"12:00",end:"12:30"},
  {name:"Madness",stage:"The Lion's Den",day:"Fri",start:"12:30",end:"13:50"},
  {name:"Shy FX Ft. Rage",stage:"The Lion's Den",day:"Fri",start:"14:05",end:"15:30"},
  {name:"Sub Focus",stage:"The Lion's Den",day:"Fri",start:"15:30",end:"16:30"},
  {name:"Alborosie & Shengen Clan",stage:"The Lion's Den",day:"Fri",start:"17:00",end:"18:00"},
  {name:"Gentleman's Dub Club & Friends",stage:"The Lion's Den",day:"Fri",start:"18:30",end:"20:00"},
  {name:"Ren",stage:"The Lion's Den",day:"Fri",start:"20:30",end:"21:30"},
  {name:"Kneecap",stage:"The Lion's Den",day:"Fri",start:"22:00",end:"23:15"},
  {name:"Wilkinson Ft. MC AD-APT",stage:"The Lion's Den",day:"Fri",start:"23:15",end:"00:30"},
  {name:"Camo & Krooked B2B Mefjus Ft. Daxta",stage:"The Lion's Den",day:"Fri",start:"00:30",end:"02:00"},
  // --- Fri: Hydro XL ---
  {name:"Opening Ceremony",stage:"Hydro XL",day:"Fri",start:"12:00",end:"12:30"},
  {name:"Groove Armada DJ Set",stage:"Hydro XL",day:"Fri",start:"12:30",end:"14:00"},
  {name:"DJ EZ",stage:"Hydro XL",day:"Fri",start:"14:00",end:"15:30"},
  {name:"Notion",stage:"Hydro XL",day:"Fri",start:"15:30",end:"17:00"},
  {name:"Diffrent",stage:"Hydro XL",day:"Fri",start:"17:00",end:"18:30"},
  {name:"Faster Horses B2B Y U QT",stage:"Hydro XL",day:"Fri",start:"18:30",end:"20:00"},
  {name:"Eats Everything B2B Tsha",stage:"Hydro XL",day:"Fri",start:"20:00",end:"21:30"},
  {name:"Effy B2B Ross From Friends",stage:"Hydro XL",day:"Fri",start:"21:30",end:"23:00"},
  {name:"999999999 AV Show",stage:"Hydro XL",day:"Fri",start:"23:00",end:"00:30"},
  {name:"Oguz",stage:"Hydro XL",day:"Fri",start:"00:30",end:"02:00"},
  {name:"Ivy vs Safyre",stage:"Hydro XL",day:"Fri",start:"02:00",end:"03:00"},
  // --- Fri: Grand Central ---
  {name:"Dutty Moonshine Big Band",stage:"Grand Central",day:"Fri",start:"12:30",end:"14:00"},
  {name:"Frankie Stew & Harvey Gunn",stage:"Grand Central",day:"Fri",start:"14:30",end:"15:30"},
  {name:"Havoc of Mobb Deep w/ Big Noyd + DJ L.E.S",stage:"Grand Central",day:"Fri",start:"16:00",end:"17:00"},
  {name:"Big Special",stage:"Grand Central",day:"Fri",start:"17:30",end:"18:30"},
  {name:"Kae Tempest",stage:"Grand Central",day:"Fri",start:"19:00",end:"20:00"},
  {name:"High Vis",stage:"Grand Central",day:"Fri",start:"20:30",end:"21:30"},
  {name:"L'Entourloop",stage:"Grand Central",day:"Fri",start:"22:00",end:"23:00"},
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
  // --- Fri: Tangled Roots ---
  {name:"Lionpulse x Sinai",stage:"Tangled Roots",day:"Fri",start:"12:00",end:"13:00"},
  {name:"Akira B2B Jaz Imsky (Buntai)",stage:"Tangled Roots",day:"Fri",start:"13:00",end:"14:30"},
  {name:"Skalah",stage:"Tangled Roots",day:"Fri",start:"14:30",end:"16:00"},
  {name:"Darkai B2B Felixculpah",stage:"Tangled Roots",day:"Fri",start:"16:00",end:"17:00"},
  {name:"Commodo B2B Pinch",stage:"Tangled Roots",day:"Fri",start:"17:00",end:"18:00"},
  {name:"Silkie",stage:"Tangled Roots",day:"Fri",start:"18:00",end:"19:30"},
  {name:"Mala",stage:"Tangled Roots",day:"Fri",start:"19:30",end:"21:00"},
  // --- Fri: Anara Forest ---
  {name:"Kaya Ft. Limmz",stage:"Anara Forest",day:"Fri",start:"15:00",end:"16:00"},
  {name:"Sin & Brook",stage:"Anara Forest",day:"Fri",start:"16:00",end:"17:00"},
  {name:"Young Franco",stage:"Anara Forest",day:"Fri",start:"17:00",end:"18:00"},
  {name:"PJ Bridger",stage:"Anara Forest",day:"Fri",start:"18:00",end:"19:00"},
  {name:"Mary Droppinz",stage:"Anara Forest",day:"Fri",start:"19:00",end:"20:00"},
  {name:"G33 B2B Plastician",stage:"Anara Forest",day:"Fri",start:"20:00",end:"21:30"},
  {name:"Champion",stage:"Anara Forest",day:"Fri",start:"21:30",end:"22:30"},
  {name:"Sbtrkt DJ Set",stage:"Anara Forest",day:"Fri",start:"22:30",end:"00:00"},
  {name:"Ahadadream",stage:"Anara Forest",day:"Fri",start:"00:00",end:"01:30"},
  {name:"Hamdi B2B Mala",stage:"Anara Forest",day:"Fri",start:"01:30",end:"03:00"},
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
  // --- Fri: Nexus ---
  {name:"Bongo's Bingo",stage:"Nexus",day:"Fri",start:"13:30",end:"14:30"},
  {name:"Pozzy",stage:"Nexus",day:"Fri",start:"15:00",end:"16:00"},
  {name:"Bexblu & Paul Stephan",stage:"Nexus",day:"Fri",start:"16:30",end:"17:30"},
  {name:"Mr Williamz & Friendly Fire Band",stage:"Nexus",day:"Fri",start:"18:00",end:"19:00"},
  {name:"Nubiyan Twist",stage:"Nexus",day:"Fri",start:"19:30",end:"20:30"},
  {name:"House Gospel Choir",stage:"Nexus",day:"Fri",start:"21:00",end:"22:00"},
  {name:"Donae'o",stage:"Nexus",day:"Fri",start:"22:30",end:"23:30"},
  {name:"The Skinner Brothers",stage:"Nexus",day:"Fri",start:"00:00",end:"01:00"},
  {name:"Fox Stevenson Live",stage:"Nexus",day:"Fri",start:"01:30",end:"02:30"},
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
  // --- Fri: Rose and Clown ---
  {name:"Strictly Chumps Dancing",stage:"Rose and Clown",day:"Fri",start:"13:00",end:"14:00"},
  {name:"Boomtown's Got Talent",stage:"Rose and Clown",day:"Fri",start:"14:00",end:"15:00"},
  {name:"An Dannsa Dub Live Dub Set",stage:"Rose and Clown",day:"Fri",start:"15:00",end:"16:30"},
  {name:"Illinformed Illin for Meds Showcase",stage:"Rose and Clown",day:"Fri",start:"17:15",end:"17:55"},
  {name:"Sika Studios 140 Showcase",stage:"Rose and Clown",day:"Fri",start:"18:10",end:"18:30"},
  {name:"Binksy",stage:"Rose and Clown",day:"Fri",start:"18:30",end:"19:15"},
  {name:"Rwkus",stage:"Rose and Clown",day:"Fri",start:"19:30",end:"20:30"},
  {name:"Molly Sellors",stage:"Rose and Clown",day:"Fri",start:"20:30",end:"21:00"},
  {name:"She's Got Brass",stage:"Rose and Clown",day:"Fri",start:"21:00",end:"22:00"},
  {name:"Jam Salad",stage:"Rose and Clown",day:"Fri",start:"22:00",end:"22:30"},
  {name:"Big Wett",stage:"Rose and Clown",day:"Fri",start:"22:30",end:"23:30"},
  {name:"Hang The Djs B2B Lobsta B",stage:"Rose and Clown",day:"Fri",start:"23:30",end:"01:00"},
  {name:"Jungyals and Gays",stage:"Rose and Clown",day:"Fri",start:"01:00",end:"02:00"},
  {name:"Oko",stage:"Rose and Clown",day:"Fri",start:"02:00",end:"03:00"},
  {name:"The Neuroheadz Ft. Keenan",stage:"Rose and Clown",day:"Fri",start:"03:00",end:"04:00"},
  // --- Fri: Hangar 161 ---
  {name:"The Screaming Dolls",stage:"Hangar 161",day:"Fri",start:"13:00",end:"13:40"},
  {name:"Ruena",stage:"Hangar 161",day:"Fri",start:"14:00",end:"14:40"},
  {name:"Baddy Issues",stage:"Hangar 161",day:"Fri",start:"15:00",end:"15:40"},
  {name:"Crae Wolf",stage:"Hangar 161",day:"Fri",start:"16:00",end:"17:00"},
  {name:"Ward Xvi",stage:"Hangar 161",day:"Fri",start:"17:30",end:"18:30"},
  {name:"Vexed",stage:"Hangar 161",day:"Fri",start:"19:00",end:"20:00"},
  {name:"Cody Frost",stage:"Hangar 161",day:"Fri",start:"20:30",end:"21:30"},
  {name:"Nightlives",stage:"Hangar 161",day:"Fri",start:"22:00",end:"23:00"},
  {name:"Hyphen",stage:"Hangar 161",day:"Fri",start:"23:30",end:"00:30"},
  {name:"Pengshui",stage:"Hangar 161",day:"Fri",start:"01:00",end:"02:00"},
  // --- Fri: The Fools Leap ---
  {name:"Nuala",stage:"The Fools Leap",day:"Fri",start:"12:00",end:"13:00"},
  {name:"The Balkan Wanderers",stage:"The Fools Leap",day:"Fri",start:"13:30",end:"14:30"},
  {name:"Moonshine Malarkey",stage:"The Fools Leap",day:"Fri",start:"15:00",end:"16:00"},
  {name:"Blue Bottle Club",stage:"The Fools Leap",day:"Fri",start:"16:30",end:"17:30"},
  {name:"New Age Collective",stage:"The Fools Leap",day:"Fri",start:"18:00",end:"19:00"},
  {name:"The Groggy Dogs",stage:"The Fools Leap",day:"Fri",start:"19:30",end:"20:30"},
  {name:"Rum Buffalo",stage:"The Fools Leap",day:"Fri",start:"21:00",end:"22:00"},
  {name:"Mista Trick's Balkan Bass",stage:"The Fools Leap",day:"Fri",start:"22:30",end:"23:30"},
  {name:"Zooblasters",stage:"The Fools Leap",day:"Fri",start:"00:00",end:"01:00"},
  {name:"Baltic Balkan",stage:"The Fools Leap",day:"Fri",start:"01:30",end:"02:45"},
  {name:"C@ In The H@'s Balkan Beats & Gypsy Bangers",stage:"The Fools Leap",day:"Fri",start:"02:45",end:"04:00"},
  // --- Fri: Full Moon Ballroom ---
  {name:"The Showhawk Duo",stage:"Full Moon Ballroom",day:"Fri",start:"13:15",end:"14:15"},
  {name:"Heavy Beat Brass Band",stage:"Full Moon Ballroom",day:"Fri",start:"14:45",end:"15:45"},
  {name:"New Car Smell",stage:"Full Moon Ballroom",day:"Fri",start:"16:15",end:"17:15"},
  {name:"Big Band of Boom",stage:"Full Moon Ballroom",day:"Fri",start:"17:45",end:"18:45"},
  {name:"Vibe Roulette",stage:"Full Moon Ballroom",day:"Fri",start:"19:15",end:"20:45"},
  {name:"Dogshow",stage:"Full Moon Ballroom",day:"Fri",start:"21:15",end:"22:15"},
  {name:"Direct Debbie B2B DJ Business Lady",stage:"Full Moon Ballroom",day:"Fri",start:"22:45",end:"00:00"},
  {name:"Extra Medium B2B Wbbl",stage:"Full Moon Ballroom",day:"Fri",start:"00:00",end:"01:15"},
  {name:"Mr Fitz & Mr Woodnote Ft. Limmz",stage:"Full Moon Ballroom",day:"Fri",start:"01:15",end:"02:30"},
  {name:"Swing & Bass: Fizzy Gillespie B2B Mista Trick Ft. She's Got Brass",stage:"Full Moon Ballroom",day:"Fri",start:"02:30",end:"04:00"},
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
  // --- Fri: The Boomtown Bobbies ---
  {name:"Music from the Mothership",stage:"The Boomtown Bobbies",day:"Fri",start:"15:00",end:"16:30"},
  {name:"Uncle Boomy",stage:"The Boomtown Bobbies",day:"Fri",start:"16:30",end:"17:15"},
  {name:"Elle B2B Frax",stage:"The Boomtown Bobbies",day:"Fri",start:"17:15",end:"18:00"},
  {name:"Aries",stage:"The Boomtown Bobbies",day:"Fri",start:"19:00",end:"20:00"},
  {name:"Amelia Leigh",stage:"The Boomtown Bobbies",day:"Fri",start:"20:00",end:"20:40"},
  {name:"Simmo",stage:"The Boomtown Bobbies",day:"Fri",start:"20:40",end:"21:20"},
  {name:"Villain",stage:"The Boomtown Bobbies",day:"Fri",start:"21:20",end:"22:00"},
  {name:"Bugsy",stage:"The Boomtown Bobbies",day:"Fri",start:"22:00",end:"22:40"},
  {name:"Illgroove",stage:"The Boomtown Bobbies",day:"Fri",start:"22:40",end:"00:00"},
  {name:"Euphonique",stage:"The Boomtown Bobbies",day:"Fri",start:"00:00",end:"01:00"},
  {name:"Zimma B2B Dox",stage:"The Boomtown Bobbies",day:"Fri",start:"01:00",end:"02:00"},
  {name:"Demolition Squad",stage:"The Boomtown Bobbies",day:"Fri",start:"02:00",end:"03:00"},
  {name:"Militant Music w MC Stezzy",stage:"The Boomtown Bobbies",day:"Fri",start:"03:00",end:"04:00"},
  // --- Fri: Soapranos Laundrette ---
  {name:"Borderline Massive",stage:"Soapranos Laundrette",day:"Fri",start:"13:00",end:"14:00"},
  {name:"Msg",stage:"Soapranos Laundrette",day:"Fri",start:"15:00",end:"16:00"},
  {name:"Empressplay",stage:"Soapranos Laundrette",day:"Fri",start:"16:00",end:"17:00"},
  {name:"G33",stage:"Soapranos Laundrette",day:"Fri",start:"17:00",end:"18:00"},
  {name:"Mina B2B Blck Stream",stage:"Soapranos Laundrette",day:"Fri",start:"18:00",end:"19:00"},
  {name:"Bubski B2B Rea",stage:"Soapranos Laundrette",day:"Fri",start:"19:00",end:"20:00"},
  {name:"Buntai: Mahnoor",stage:"Soapranos Laundrette",day:"Fri",start:"20:00",end:"21:00"},
  {name:"Buntai: Akira B2B Milzy",stage:"Soapranos Laundrette",day:"Fri",start:"21:00",end:"22:00"},
  {name:"Buntai: Nio B B2B Skye",stage:"Soapranos Laundrette",day:"Fri",start:"22:00",end:"23:00"},
  {name:"Buntai: Jaz Imsky B2B Felixculprah Ft Cola B",stage:"Soapranos Laundrette",day:"Fri",start:"23:00",end:"00:00"},
  // --- Fri: Hotel Paradiso ---
  {name:"Karyo",stage:"Hotel Paradiso",day:"Fri",start:"20:00",end:"21:00"},
  {name:"Dougie No Pain",stage:"Hotel Paradiso",day:"Fri",start:"21:00",end:"22:00"},
  {name:"Aziza Jaye & DJ Kyla C",stage:"Hotel Paradiso",day:"Fri",start:"23:00",end:"00:00"},
  {name:"Jfb",stage:"Hotel Paradiso",day:"Fri",start:"00:00",end:"01:00"},
  {name:"Dazee",stage:"Hotel Paradiso",day:"Fri",start:"01:00",end:"02:00"},
  // --- Fri: Luck Exchange Casino ---
  {name:"Teckno Pixxy",stage:"Luck Exchange Casino",day:"Fri",start:"19:05",end:"19:15"},
  {name:"Jesty Quinn",stage:"Luck Exchange Casino",day:"Fri",start:"19:15",end:"19:25"},
  {name:"Magic The Gabbering",stage:"Luck Exchange Casino",day:"Fri",start:"19:30",end:"19:45"},
  {name:"Dead Lorry, Yellow Lorry",stage:"Luck Exchange Casino",day:"Fri",start:"19:50",end:"19:55"},
  {name:"The Sex Cripples",stage:"Luck Exchange Casino",day:"Fri",start:"20:20",end:"20:50"},
  {name:"Iffyhype",stage:"Luck Exchange Casino",day:"Fri",start:"20:50",end:"21:20"},
  // --- Fri: The Garden Centre ---
  {name:"Heman",stage:"The Garden Centre",day:"Fri",start:"13:00",end:"14:00"},
  {name:"Sidetrakka",stage:"The Garden Centre",day:"Fri",start:"14:00",end:"15:15"},
  {name:"Cassia",stage:"The Garden Centre",day:"Fri",start:"15:15",end:"16:30"},
  {name:"The Blister Pack",stage:"The Garden Centre",day:"Fri",start:"16:30",end:"18:00"},
  {name:"Michael Joyce",stage:"The Garden Centre",day:"Fri",start:"18:00",end:"19:00"},
  {name:"The Regional Manager's Garden Show",stage:"The Garden Centre",day:"Fri",start:"21:00",end:"22:00"},
  {name:"Strawberry Jams",stage:"The Garden Centre",day:"Fri",start:"22:00",end:"22:30"},
  {name:"Wild Soul",stage:"The Garden Centre",day:"Fri",start:"22:30",end:"23:30"},
  {name:"Charlie Power",stage:"The Garden Centre",day:"Fri",start:"23:30",end:"00:30"},
  {name:"Prolifix",stage:"The Garden Centre",day:"Fri",start:"00:30",end:"01:30"},
  {name:"Basshead",stage:"The Garden Centre",day:"Fri",start:"01:30",end:"02:45"},
  {name:"The Prophet",stage:"The Garden Centre",day:"Fri",start:"02:45",end:"04:00"},
  // --- Fri: Botanica Zoo ---
  {name:"Cheza Lucina",stage:"Botanica Zoo",day:"Fri",start:"15:00",end:"15:50"},
  {name:"Pia Collada",stage:"Botanica Zoo",day:"Fri",start:"15:50",end:"16:40"},
  {name:"Misfit 'n' Kamer w/ Blythe",stage:"Botanica Zoo",day:"Fri",start:"16:40",end:"17:30"},
  {name:"Zak Smiff B2B Joel Deep w/ Rivibes",stage:"Botanica Zoo",day:"Fri",start:"17:30",end:"18:20"},
  {name:"Yasmine",stage:"Botanica Zoo",day:"Fri",start:"18:20",end:"19:10"},
  {name:"Bennie B2B DJ Hybrid 140 Set w/ Killa P",stage:"Botanica Zoo",day:"Fri",start:"19:10",end:"20:05"},
  {name:"Meltout Crew",stage:"Botanica Zoo",day:"Fri",start:"20:05",end:"21:00"},
  {name:"Dfuse w/ Ham",stage:"Botanica Zoo",day:"Fri",start:"21:00",end:"22:00"},
  {name:"???? w/ Rivibes",stage:"Botanica Zoo",day:"Fri",start:"22:00",end:"23:00"},
  {name:"N-Type B2B Ekula B2B Sheba Q w/ Nav & Ham",stage:"Botanica Zoo",day:"Fri",start:"23:00",end:"01:00"},
  {name:"Ezra B2B Serkus w/ Mista Jago",stage:"Botanica Zoo",day:"Fri",start:"01:00",end:"02:00"},
  {name:"Iller Instinct",stage:"Botanica Zoo",day:"Fri",start:"02:00",end:"03:00"},
  {name:"Humb B2B Highlander",stage:"Botanica Zoo",day:"Fri",start:"03:00",end:"04:00"},
  // --- Fri: The Immortal Children of the Eternal Seed ---
  {name:"Ikamba",stage:"The Immortal Children of the Eternal Seed",day:"Fri",start:"22:00",end:"23:00"},
  {name:"Vic Tandy",stage:"The Immortal Children of the Eternal Seed",day:"Fri",start:"23:00",end:"00:00"},
  {name:"Monticolombi",stage:"The Immortal Children of the Eternal Seed",day:"Fri",start:"00:00",end:"01:00"},
  {name:"Minki",stage:"The Immortal Children of the Eternal Seed",day:"Fri",start:"01:00",end:"02:00"},
  {name:"Chinese Daughter",stage:"The Immortal Children of the Eternal Seed",day:"Fri",start:"02:00",end:"03:00"},
  {name:"Mowgli B2B Slewy",stage:"The Immortal Children of the Eternal Seed",day:"Fri",start:"03:00",end:"04:00"},
  // --- Fri: Topsy Turvy Trims ---
  {name:"Black Board Soundsystem",stage:"Topsy Turvy Trims",day:"Fri",start:"13:00",end:"15:00"},
  {name:"Hokey Cokey Cabaret",stage:"Topsy Turvy Trims",day:"Fri",start:"17:00",end:"18:00"},
  {name:"Ignoring Izzy",stage:"Topsy Turvy Trims",day:"Fri",start:"19:00",end:"21:00"},
  {name:"Ed Spinna",stage:"Topsy Turvy Trims",day:"Fri",start:"21:00",end:"22:00"},
  {name:"Merchant",stage:"Topsy Turvy Trims",day:"Fri",start:"22:00",end:"00:00"},
  {name:"Goose",stage:"Topsy Turvy Trims",day:"Fri",start:"00:00",end:"01:00"},
  {name:"Bitchslap",stage:"Topsy Turvy Trims",day:"Fri",start:"01:30",end:"02:30"},
  // --- Fri: PFP Robot ---
  {name:"Comp Winner",stage:"PFP Robot",day:"Fri",start:"15:00",end:"15:30"},
  {name:"Darth Leng",stage:"PFP Robot",day:"Fri",start:"15:30",end:"16:30"},
  {name:"Indecline",stage:"PFP Robot",day:"Fri",start:"16:30",end:"17:30"},
  {name:"Roland K",stage:"PFP Robot",day:"Fri",start:"17:30",end:"18:30"},
  // --- Fri: Sub Lab ---
  {name:"Matteo",stage:"Sub Lab",day:"Fri",start:"18:00",end:"19:00"},
  {name:"Tacktile",stage:"Sub Lab",day:"Fri",start:"19:00",end:"20:00"},
  {name:"Panix",stage:"Sub Lab",day:"Fri",start:"20:00",end:"21:00"},
  {name:"Chad Dubz B2B Lotu Ft Slowie",stage:"Sub Lab",day:"Fri",start:"21:00",end:"22:30"},
  {name:"Breakfake",stage:"Sub Lab",day:"Fri",start:"22:30",end:"23:30"},
  {name:"Rea Ft Sylla",stage:"Sub Lab",day:"Fri",start:"23:30",end:"00:30"},
  {name:"Hijinx",stage:"Sub Lab",day:"Fri",start:"00:30",end:"01:30"},
  {name:"Glm",stage:"Sub Lab",day:"Fri",start:"01:30",end:"02:30"},
  {name:"Special Guest",stage:"Sub Lab",day:"Fri",start:"02:30",end:"03:59"},
  // --- Fri: Nachtlicker ---
  {name:"Sav.",stage:"Nachtlicker",day:"Fri",start:"18:00",end:"19:00"},
  {name:"Pinks Feat Mc Zira Flo",stage:"Nachtlicker",day:"Fri",start:"19:00",end:"20:00"},
  {name:"Theo Sheldrake B2B Tom Croome",stage:"Nachtlicker",day:"Fri",start:"20:00",end:"21:00"},
  {name:"Savannah",stage:"Nachtlicker",day:"Fri",start:"21:00",end:"22:00"},
  {name:"Cyber Steve",stage:"Nachtlicker",day:"Fri",start:"22:00",end:"23:00"},
  {name:"PJ Peek",stage:"Nachtlicker",day:"Fri",start:"23:00",end:"00:00"},
  {name:"Jack Jukes",stage:"Nachtlicker",day:"Fri",start:"00:30",end:"01:30"},
  {name:"Goff",stage:"Nachtlicker",day:"Fri",start:"01:30",end:"02:45"},
  {name:"Sloppy Spice",stage:"Nachtlicker",day:"Fri",start:"02:45",end:"04:00"},
  // --- Fri: Deviant Lounge ---
  {name:"Can't Stop Won't Stop",stage:"Deviant Lounge",day:"Fri",start:"20:00",end:"21:00"},
  {name:"Maui Pink",stage:"Deviant Lounge",day:"Fri",start:"21:00",end:"21:45"},
  {name:"Princ3ss Charming",stage:"Deviant Lounge",day:"Fri",start:"21:45",end:"22:30"},
  {name:"Grandma Wubplate B2B DJ Noodz",stage:"Deviant Lounge",day:"Fri",start:"22:30",end:"23:30"},
  {name:"Bby Goose",stage:"Deviant Lounge",day:"Fri",start:"23:30",end:"00:30"},
  {name:"Cicely",stage:"Deviant Lounge",day:"Fri",start:"00:30",end:"01:30"},
  {name:"Gullyteen B2B Iffyhype B2B Audio Gutter",stage:"Deviant Lounge",day:"Fri",start:"01:30",end:"03:00"},
  {name:"Scottish Gabber Punk",stage:"Deviant Lounge",day:"Fri",start:"03:00",end:"04:00"},
  // --- Fri: Gabber Kebabber ---
  {name:"2 Sick Puppiez",stage:"Gabber Kebabber",day:"Fri",start:"12:00",end:"13:00"},
  {name:"Reddem",stage:"Gabber Kebabber",day:"Fri",start:"13:00",end:"13:45"},
  {name:"Uptempo Anonymous",stage:"Gabber Kebabber",day:"Fri",start:"13:45",end:"14:30"},
  {name:"John Michelle Jarg",stage:"Gabber Kebabber",day:"Fri",start:"14:30",end:"15:30"},
  {name:"Dee Jay Say La Vee B2B Stripe N Co",stage:"Gabber Kebabber",day:"Fri",start:"15:30",end:"16:15"},
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
  {name:"Dj Osu!",stage:"Gabber Kebabber",day:"Fri",start:"01:00",end:"02:00"},
  {name:"Obsidian 23",stage:"Gabber Kebabber",day:"Fri",start:"02:00",end:"03:00"},
  {name:"Izzy Bolt",stage:"Gabber Kebabber",day:"Fri",start:"03:00",end:"04:00"},
  // --- Fri: E Numbers ---
  {name:"Dr Rat",stage:"E Numbers",day:"Fri",start:"19:00",end:"19:45"},
  {name:"Chlow333",stage:"E Numbers",day:"Fri",start:"19:45",end:"20:30"},
  {name:"Goldenaxe",stage:"E Numbers",day:"Fri",start:"20:30",end:"21:15"},
  {name:"Mollie Rush",stage:"E Numbers",day:"Fri",start:"21:15",end:"22:00"},
  {name:"DJ Gash Presents: Sherbert Sessions",stage:"E Numbers",day:"Fri",start:"22:00",end:"22:45"},
  {name:"Girldick",stage:"E Numbers",day:"Fri",start:"22:45",end:"23:30"},
  {name:"DJ Noeyedear",stage:"E Numbers",day:"Fri",start:"23:30",end:"00:15"},
  {name:"Sam Tearout",stage:"E Numbers",day:"Fri",start:"00:15",end:"01:00"},
  {name:"Lil Data",stage:"E Numbers",day:"Fri",start:"01:00",end:"01:45"},
  {name:"N4ts: Danny Stranger",stage:"E Numbers",day:"Fri",start:"01:45",end:"02:30"},
  {name:"N4ts: Dolfinboy",stage:"E Numbers",day:"Fri",start:"02:30",end:"03:15"},
  {name:"N4ts: Secret Set",stage:"E Numbers",day:"Fri",start:"03:15",end:"04:00"},
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
  {name:"Ludec",stage:"The Pomegranate Parlour",day:"Fri",start:"23:00",end:"00:00"},
  {name:"Gypsyndicate",stage:"The Pomegranate Parlour",day:"Fri",start:"00:00",end:"01:00"},
  {name:"Illexxandra",stage:"The Pomegranate Parlour",day:"Fri",start:"01:00",end:"02:00"},
  {name:"Charlie Power",stage:"The Pomegranate Parlour",day:"Fri",start:"02:00",end:"03:00"},
  {name:"Pablo Dutta",stage:"The Pomegranate Parlour",day:"Fri",start:"03:00",end:"03:55"},
  // --- Fri: Busker's Wharf ---
  {name:"The Pussy Catbaret",stage:"Busker's Wharf",day:"Fri",start:"19:30",end:"20:30"},
  {name:"The Lobster Cabaret",stage:"Busker's Wharf",day:"Fri",start:"21:00",end:"22:00"},
  // --- Fri: Twisted Time Machine (Bad Apple Bar) ---
  {name:"Unkle - Psyence Fiction Album Playback",stage:"Twisted Time Machine",day:"Fri",start:"12:00",end:"13:00"},
  {name:"The Fugees - The Score Album Playback",stage:"Twisted Time Machine",day:"Fri",start:"13:00",end:"14:00"},
  {name:"Zzzonked: Enter Shikari Power Hour",stage:"Twisted Time Machine",day:"Fri",start:"15:00",end:"16:00"},
  {name:"Sabrina Carpentry",stage:"Twisted Time Machine",day:"Fri",start:"16:00",end:"17:00"},
  {name:"That Disney Party!",stage:"Twisted Time Machine",day:"Fri",start:"17:00",end:"18:00"},
  {name:"Slayyyter: Worst Girl in America Album Playback",stage:"Twisted Time Machine",day:"Fri",start:"18:00",end:"19:00"},
  {name:"Cybertease: Boomtown Baddies",stage:"Twisted Time Machine",day:"Fri",start:"19:00",end:"20:00"},
  {name:"Boomtown Pride: Britney Spears Appreciation Society Part V",stage:"Twisted Time Machine",day:"Fri",start:"20:00",end:"21:00"},
  {name:"Boomtown Pride: Opening Ceremony with DJ Gaylord",stage:"Twisted Time Machine",day:"Fri",start:"21:00",end:"22:00"},
  {name:"Boomtown Pride: Queer House Party",stage:"Twisted Time Machine",day:"Fri",start:"22:00",end:"23:00"},
  {name:"Boomtown Pride: Bendy Wendy",stage:"Twisted Time Machine",day:"Fri",start:"23:00",end:"00:00"},
  {name:"Boomtown Pride: Donk If You're Horny",stage:"Twisted Time Machine",day:"Fri",start:"00:00",end:"00:45"},
  {name:"Boomtown Pride: Uokhuns Hen Do",stage:"Twisted Time Machine",day:"Fri",start:"00:45",end:"01:45"},
  {name:"Boomtown Pride: Figs Presents Europhobia",stage:"Twisted Time Machine",day:"Fri",start:"01:45",end:"02:30"},
  {name:"Boomtown Pride: Full Throttle Hard House",stage:"Twisted Time Machine",day:"Fri",start:"02:30",end:"03:15"},
  {name:"Boomtown Pride: Lg:Bx:T: Hard Pride",stage:"Twisted Time Machine",day:"Fri",start:"03:15",end:"04:00"},
  // --- Fri: Síbín Beag ---
  {name:"Green Diesel",stage:"Síbín Beag",day:"Fri",start:"14:00",end:"14:45"},
  {name:"John Kelly",stage:"Síbín Beag",day:"Fri",start:"15:15",end:"16:00"},
  {name:"Roof Cats",stage:"Síbín Beag",day:"Fri",start:"16:30",end:"17:15"},
  {name:"No Murder No Moustache",stage:"Síbín Beag",day:"Fri",start:"17:45",end:"18:30"},
  {name:"The Kahunas",stage:"Síbín Beag",day:"Fri",start:"19:00",end:"19:45"},
  {name:"Craic Man Fancy Dan",stage:"Síbín Beag",day:"Fri",start:"20:15",end:"21:00"},
  {name:"Trad Folkin' Rocks House Band",stage:"Síbín Beag",day:"Fri",start:"21:30",end:"23:30"},
  {name:"Trad Folkin' Rave Dj's",stage:"Síbín Beag",day:"Fri",start:"00:00",end:"00:45"},
  // --- Fri: Helix ---
  {name:"Dave Trotter B2B Tom Tucker",stage:"Helix",day:"Fri",start:"15:00",end:"16:30"},
  {name:"Freestylers",stage:"Helix",day:"Fri",start:"16:30",end:"18:00"},
  {name:"Jfb",stage:"Helix",day:"Fri",start:"18:00",end:"19:30"},
  {name:"Burt Cope",stage:"Helix",day:"Fri",start:"19:30",end:"21:00"},
  {name:"A.Skillz",stage:"Helix",day:"Fri",start:"21:00",end:"22:30"},
  {name:"Plump Dj's",stage:"Helix",day:"Fri",start:"22:30",end:"00:00"},
  {name:"Deekline",stage:"Helix",day:"Fri",start:"00:00",end:"01:30"},
  {name:"Madame Electrifie",stage:"Helix",day:"Fri",start:"01:30",end:"03:00"},
  // --- Fri: Mining for (g)Old Town ---
  {name:"Flails",stage:"Mining for (g)Old Town",day:"Fri",start:"13:30",end:"15:00"},
  {name:"Father Lynch",stage:"Mining for (g)Old Town",day:"Fri",start:"15:00",end:"16:30"},
  {name:"Light Gal",stage:"Mining for (g)Old Town",day:"Fri",start:"16:30",end:"18:00"},
  {name:"Emma Ash",stage:"Mining for (g)Old Town",day:"Fri",start:"18:00",end:"19:00"},
  // --- Fri: End of the Line ---
  {name:"Unfoldance",stage:"End of the Line",day:"Fri",start:"20:00",end:"20:45"},
  {name:"Lunae",stage:"End of the Line",day:"Fri",start:"20:45",end:"21:30"},
  {name:"Sticky Ricky",stage:"End of the Line",day:"Fri",start:"21:30",end:"22:15"},
  {name:"Loutan",stage:"End of the Line",day:"Fri",start:"22:15",end:"23:00"},
  {name:"Agent Scully",stage:"End of the Line",day:"Fri",start:"23:00",end:"23:45"},
  {name:"Scandal!st B2B Yoste",stage:"End of the Line",day:"Fri",start:"23:45",end:"00:45"},
  {name:"Dansfleur",stage:"End of the Line",day:"Fri",start:"00:45",end:"01:15"},
  {name:"Grandma Wubplate",stage:"End of the Line",day:"Fri",start:"01:15",end:"02:00"},
  {name:"Minor Science",stage:"End of the Line",day:"Fri",start:"02:00",end:"03:00"},
  {name:"Dromek",stage:"End of the Line",day:"Fri",start:"03:00",end:"04:00"},
  // --- Fri: Infinity ---
  {name:"Menu Music Presents: Salt B2B Stolen & Whos Jordan",stage:"Infinity",day:"Fri",start:"18:00",end:"20:30"},
  {name:"Arlo",stage:"Infinity",day:"Fri",start:"20:30",end:"22:00"},
  {name:"Jeremy Sylvester",stage:"Infinity",day:"Fri",start:"22:00",end:"23:30"},
  {name:"A For Alpha B2B Dani Wylie",stage:"Infinity",day:"Fri",start:"23:30",end:"01:00"},
  {name:"Dr Dubplate",stage:"Infinity",day:"Fri",start:"01:00",end:"02:30"},
  {name:"James Wonka B2B Paree",stage:"Infinity",day:"Fri",start:"02:30",end:"04:00"},

  // ================= SATURDAY =================
  // --- Sat: The Lion's Den ---
  {name:"Crossy B2B Gray B2B Harriet Jaxxon Ft. Spyda",stage:"The Lion's Den",day:"Sat",start:"13:00",end:"14:00"},
  {name:"Benny L B2B Break B2B Skeptical Ft. MC Gq & MC Det",stage:"The Lion's Den",day:"Sat",start:"14:00",end:"15:00"},
  {name:"Kings Of The Rollers Present: Royal Rumble",stage:"The Lion's Den",day:"Sat",start:"15:00",end:"16:00"},
  {name:"Brockie B2B Micky Finn B2B Ray Keith Ft. Jolie P & Shabba D",stage:"The Lion's Den",day:"Sat",start:"16:00",end:"17:00"},
  {name:"Mungo's Hi Fi Allstars Ft. Aziza Jaye, Charlie P, Eva Lazarus, Flowdan, Gardna, Killa P, Magugu & Solo Banton",stage:"The Lion's Den",day:"Sat",start:"17:00",end:"19:00"},
  {name:"Shaggy",stage:"The Lion's Den",day:"Sat",start:"19:30",end:"20:30"},
  {name:"Scooter",stage:"The Lion's Den",day:"Sat",start:"21:00",end:"22:10"},
  {name:"Alix Perez Ft. Sp:Mc",stage:"The Lion's Den",day:"Sat",start:"22:30",end:"00:00"},
  {name:"Andy C Presents: Nightlife",stage:"The Lion's Den",day:"Sat",start:"00:00",end:"02:00"},
  {name:"A.M.C Ft Phantom",stage:"The Lion's Den",day:"Sat",start:"02:00",end:"03:00"},
  // --- Sat: Hydro XL ---
  {name:"Melé B2B Olive F",stage:"Hydro XL",day:"Sat",start:"17:00",end:"18:30"},
  {name:"Folamour",stage:"Hydro XL",day:"Sat",start:"18:30",end:"20:00"},
  {name:"Rossi. B2B Silva Bumpa",stage:"Hydro XL",day:"Sat",start:"20:00",end:"21:15"},
  {name:"Floating Points Live",stage:"Hydro XL",day:"Sat",start:"21:25",end:"22:25"},
  {name:"Four Tet",stage:"Hydro XL",day:"Sat",start:"22:35",end:"00:05"},
  {name:"Brutalismus 3000",stage:"Hydro XL",day:"Sat",start:"00:15",end:"01:30"},
  {name:"Azyr",stage:"Hydro XL",day:"Sat",start:"01:40",end:"03:00"},
  // --- Sat: Grand Central ---
  {name:"Hak Baker",stage:"Grand Central",day:"Sat",start:"13:00",end:"14:00"},
  {name:"Rose Gray",stage:"Grand Central",day:"Sat",start:"14:30",end:"15:30"},
  {name:"Antony Szmierek",stage:"Grand Central",day:"Sat",start:"16:00",end:"17:00"},
  {name:"Songer",stage:"Grand Central",day:"Sat",start:"17:30",end:"18:30"},
  {name:"Sampa The Great",stage:"Grand Central",day:"Sat",start:"19:00",end:"20:00"},
  {name:"Princess Nokia",stage:"Grand Central",day:"Sat",start:"20:30",end:"21:30"},
  {name:"Ashnikko",stage:"Grand Central",day:"Sat",start:"22:00",end:"23:00"},
  {name:"Peaches",stage:"Grand Central",day:"Sat",start:"23:30",end:"00:30"},
  // --- Sat: Hidden Woods ---
  {name:"Rebel Clash",stage:"Hidden Woods",day:"Sat",start:"12:00",end:"13:30"},
  {name:"DJ Hype: Reggae 2 Jungle",stage:"Hidden Woods",day:"Sat",start:"13:30",end:"15:00"},
  {name:"General Levy Live PA",stage:"Hidden Woods",day:"Sat",start:"15:00",end:"15:30"},
  {name:"Sir Spyro Ft. Killa P & Lady Chann",stage:"Hidden Woods",day:"Sat",start:"15:30",end:"17:00"},
  {name:"Saint Ludo",stage:"Hidden Woods",day:"Sat",start:"17:00",end:"18:00"},
  {name:"Arthi",stage:"Hidden Woods",day:"Sat",start:"18:00",end:"19:00"},
  {name:"Bakey B2B Mia Koden",stage:"Hidden Woods",day:"Sat",start:"19:00",end:"20:30"},
  {name:"Ryota B2B Yung Singh",stage:"Hidden Woods",day:"Sat",start:"20:30",end:"22:00"},
  {name:"Neffa-T Ft. D Double E",stage:"Hidden Woods",day:"Sat",start:"22:00",end:"23:30"},
  {name:"Cesco B2B Halogenix Ft. Strategy",stage:"Hidden Woods",day:"Sat",start:"23:30",end:"01:00"},
  {name:"Zero",stage:"Hidden Woods",day:"Sat",start:"01:00",end:"02:30"},
  {name:"Voltage - Jungle Classics Ft. Shabba D",stage:"Hidden Woods",day:"Sat",start:"02:30",end:"04:00"},
  // --- Sat: Tangled Roots ---
  {name:"Channel One Sound System",stage:"Tangled Roots",day:"Sat",start:"12:00",end:"14:00"},
  {name:"Aba Shanti-I",stage:"Tangled Roots",day:"Sat",start:"14:00",end:"16:00"},
  {name:"10000 Lions",stage:"Tangled Roots",day:"Sat",start:"16:00",end:"18:00"},
  {name:"Firmly Rooted X Lionpulse X Sinai",stage:"Tangled Roots",day:"Sat",start:"18:00",end:"19:00"},
  {name:"Sasha Steppa",stage:"Tangled Roots",day:"Sat",start:"19:00",end:"20:00"},
  {name:"Omega Nebula",stage:"Tangled Roots",day:"Sat",start:"20:00",end:"21:00"},
  // --- Sat: Anara Forest ---
  {name:"Eloq B2B Esc",stage:"Anara Forest",day:"Sat",start:"14:00",end:"15:00"},
  {name:"Hitech",stage:"Anara Forest",day:"Sat",start:"15:00",end:"16:00"},
  {name:"Pete Cannon Live",stage:"Anara Forest",day:"Sat",start:"16:00",end:"17:00"},
  {name:"Ivy Lab",stage:"Anara Forest",day:"Sat",start:"17:00",end:"18:30"},
  {name:"Buunshin",stage:"Anara Forest",day:"Sat",start:"18:30",end:"19:45"},
  {name:"J:Kenzo B2B Skeptical 140 Set Ft. Sp:Mc",stage:"Anara Forest",day:"Sat",start:"19:45",end:"21:15"},
  {name:"Breakage B2B Flight",stage:"Anara Forest",day:"Sat",start:"21:15",end:"22:45"},
  {name:"Mantra B2B Tim Reaper",stage:"Anara Forest",day:"Sat",start:"22:45",end:"00:15"},
  {name:"Double O B2B Sherelle",stage:"Anara Forest",day:"Sat",start:"00:15",end:"01:45"},
  {name:"DJ Die B2B Krust",stage:"Anara Forest",day:"Sat",start:"01:45",end:"03:00"},
  // --- Sat: Tribe of Frog ---
  {name:"Dr.G",stage:"Tribe of Frog",day:"Sat",start:"12:00",end:"14:00"},
  {name:"Xenoben",stage:"Tribe of Frog",day:"Sat",start:"14:00",end:"15:30"},
  {name:"Typeone",stage:"Tribe of Frog",day:"Sat",start:"15:30",end:"17:00"},
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
  // --- Sat: Nexus ---
  {name:"Bongo's Bingo",stage:"Nexus",day:"Sat",start:"14:00",end:"15:00"},
  {name:"Miss Kaninna",stage:"Nexus",day:"Sat",start:"15:30",end:"16:30"},
  {name:"High Focus Records Showcase",stage:"Nexus",day:"Sat",start:"16:40",end:"19:40"},
  {name:"Lynks",stage:"Nexus",day:"Sat",start:"20:00",end:"21:00"},
  {name:"Henge",stage:"Nexus",day:"Sat",start:"23:00",end:"00:00"},
  {name:"Beardyman",stage:"Nexus",day:"Sat",start:"00:30",end:"01:30"},
  {name:"Daft Funk Live",stage:"Nexus",day:"Sat",start:"02:00",end:"03:00"},
  // --- Sat: Spectrum 360 ---
  {name:"Draggernauts",stage:"Spectrum 360",day:"Sat",start:"16:00",end:"18:00"},
  {name:"Hang The Dj's",stage:"Spectrum 360",day:"Sat",start:"18:00",end:"19:00"},
  {name:"Koarse",stage:"Spectrum 360",day:"Sat",start:"19:00",end:"20:00"},
  {name:"DJ Sarah Bonito",stage:"Spectrum 360",day:"Sat",start:"20:00",end:"21:00"},
  {name:"DJ G2g",stage:"Spectrum 360",day:"Sat",start:"21:00",end:"22:00"},
  {name:"Panteros666",stage:"Spectrum 360",day:"Sat",start:"22:00",end:"23:00"},
  {name:"Trampsta",stage:"Spectrum 360",day:"Sat",start:"23:00",end:"00:00"},
  {name:"Gonzi",stage:"Spectrum 360",day:"Sat",start:"00:00",end:"01:00"},
  {name:"Meg Mchugh",stage:"Spectrum 360",day:"Sat",start:"01:00",end:"02:00"},
  {name:"Sterling Moss",stage:"Spectrum 360",day:"Sat",start:"02:00",end:"03:00"},
  {name:"Fish56octagon",stage:"Spectrum 360",day:"Sat",start:"03:00",end:"04:00"},
  // --- Sat: Acid Leak ---
  {name:"Neutron (Tip Records)",stage:"Acid Leak",day:"Sat",start:"13:00",end:"14:30"},
  {name:"Mark Eg",stage:"Acid Leak",day:"Sat",start:"14:30",end:"16:00"},
  {name:"Tassid",stage:"Acid Leak",day:"Sat",start:"16:00",end:"17:30"},
  {name:"Aaron Liberator",stage:"Acid Leak",day:"Sat",start:"17:30",end:"19:00"},
  {name:"Birinight",stage:"Acid Leak",day:"Sat",start:"19:00",end:"20:30"},
  {name:"Chris Liberator",stage:"Acid Leak",day:"Sat",start:"20:30",end:"22:00"},
  {name:"Acid Mutant",stage:"Acid Leak",day:"Sat",start:"22:00",end:"23:30"},
  {name:"James Kinetec",stage:"Acid Leak",day:"Sat",start:"23:30",end:"01:00"},
  {name:"Brooksie",stage:"Acid Leak",day:"Sat",start:"01:00",end:"02:30"},
  {name:"Matt Acidic",stage:"Acid Leak",day:"Sat",start:"02:30",end:"04:00"},
  // --- Sat: Rose and Clown ---
  {name:"Reggaeoke",stage:"Rose and Clown",day:"Sat",start:"13:00",end:"14:00"},
  {name:"Boomtown's Got Talent",stage:"Rose and Clown",day:"Sat",start:"14:00",end:"15:00"},
  {name:"The Showhawk Duo",stage:"Rose and Clown",day:"Sat",start:"15:00",end:"16:00"},
  {name:"No Blacks No Irish DJ Set",stage:"Rose and Clown",day:"Sat",start:"16:00",end:"17:30"},
  {name:"Shabba Banks",stage:"Rose and Clown",day:"Sat",start:"17:30",end:"18:30"},
  {name:"Numa Crew",stage:"Rose and Clown",day:"Sat",start:"18:30",end:"19:45"},
  {name:"Flash Bang Brass",stage:"Rose and Clown",day:"Sat",start:"19:45",end:"20:45"},
  {name:"Amengyaldem",stage:"Rose and Clown",day:"Sat",start:"20:45",end:"21:45"},
  {name:"Jamu",stage:"Rose and Clown",day:"Sat",start:"22:00",end:"23:00"},
  {name:"Singularity Takeover: Silva Snipa B2B The Bass Injector",stage:"Rose and Clown",day:"Sat",start:"23:00",end:"00:00"},
  {name:"Cheetah B2B Jenny Sparks",stage:"Rose and Clown",day:"Sat",start:"00:00",end:"01:00"},
  {name:"Anaïs B2B Anton B2B Latte 140 Set",stage:"Rose and Clown",day:"Sat",start:"01:00",end:"02:00"},
  {name:"Bish",stage:"Rose and Clown",day:"Sat",start:"02:00",end:"03:00"},
  {name:"Diagnostix 140 & Ukg Set",stage:"Rose and Clown",day:"Sat",start:"03:00",end:"03:30"},
  {name:"Gray's Free Party Karaoke",stage:"Rose and Clown",day:"Sat",start:"03:30",end:"04:00"},
  // --- Sat: Hangar 161 ---
  {name:"Hot Squash",stage:"Hangar 161",day:"Sat",start:"13:00",end:"13:40"},
  {name:"Pussy Liquor",stage:"Hangar 161",day:"Sat",start:"14:00",end:"14:40"},
  {name:"Problem Patterns",stage:"Hangar 161",day:"Sat",start:"15:00",end:"15:40"},
  {name:"Vegan Meat Raffle",stage:"Hangar 161",day:"Sat",start:"16:00",end:"16:40"},
  {name:"Bruise Control",stage:"Hangar 161",day:"Sat",start:"17:00",end:"17:40"},
  {name:"The Restarts",stage:"Hangar 161",day:"Sat",start:"18:00",end:"18:40"},
  {name:"Inner Terrestrials",stage:"Hangar 161",day:"Sat",start:"19:00",end:"20:00"},
  {name:"Popes Of Chillitown",stage:"Hangar 161",day:"Sat",start:"20:30",end:"21:30"},
  {name:"Svetlanas",stage:"Hangar 161",day:"Sat",start:"22:00",end:"23:00"},
  {name:"China Shop Bull",stage:"Hangar 161",day:"Sat",start:"23:30",end:"00:30"},
  {name:"Silverwingkiller",stage:"Hangar 161",day:"Sat",start:"01:00",end:"02:00"},
  // --- Sat: The Fools Leap ---
  {name:"Fftp",stage:"The Fools Leap",day:"Sat",start:"12:00",end:"13:00"},
  {name:"Tropanka",stage:"The Fools Leap",day:"Sat",start:"13:30",end:"14:30"},
  {name:"Fidget & The Twitchers",stage:"The Fools Leap",day:"Sat",start:"15:00",end:"16:00"},
  {name:"Alphalfa",stage:"The Fools Leap",day:"Sat",start:"16:30",end:"17:30"},
  {name:"45s",stage:"The Fools Leap",day:"Sat",start:"18:00",end:"19:00"},
  {name:"Cam Cole",stage:"The Fools Leap",day:"Sat",start:"19:30",end:"20:30"},
  {name:"3 Daft Monkeys",stage:"The Fools Leap",day:"Sat",start:"21:00",end:"22:00"},
  {name:"Daraa Tribes",stage:"The Fools Leap",day:"Sat",start:"22:30",end:"23:30"},
  {name:"?",stage:"The Fools Leap",day:"Sat",start:"00:00",end:"01:00"},
  {name:"Dogshow",stage:"The Fools Leap",day:"Sat",start:"01:30",end:"02:30"},
  {name:"Fizzy Gillespie's Big Balkan Bash",stage:"The Fools Leap",day:"Sat",start:"03:00",end:"04:00"},
  // --- Sat: Full Moon Ballroom ---
  {name:"Funky Drummer Collective",stage:"Full Moon Ballroom",day:"Sat",start:"13:00",end:"14:00"},
  {name:"Daraa Tribes",stage:"Full Moon Ballroom",day:"Sat",start:"14:30",end:"15:30"},
  {name:"Malavita!",stage:"Full Moon Ballroom",day:"Sat",start:"16:00",end:"17:00"},
  {name:"Kotoa",stage:"Full Moon Ballroom",day:"Sat",start:"17:30",end:"18:30"},
  {name:"Pachango",stage:"Full Moon Ballroom",day:"Sat",start:"19:00",end:"20:00"},
  {name:"Gnawa Blues All Stars",stage:"Full Moon Ballroom",day:"Sat",start:"20:30",end:"21:30"},
  {name:"Okailey",stage:"Full Moon Ballroom",day:"Sat",start:"22:00",end:"23:00"},
  {name:"Pcha",stage:"Full Moon Ballroom",day:"Sat",start:"23:30",end:"00:30"},
  {name:"Raz & Afla",stage:"Full Moon Ballroom",day:"Sat",start:"01:00",end:"02:00"},
  {name:"Hippo Sound System & S.I.M.O",stage:"Full Moon Ballroom",day:"Sat",start:"02:30",end:"04:00"},
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
  // --- Sat: The Boomtown Bobbies ---
  {name:"Kick Bandit",stage:"The Boomtown Bobbies",day:"Sat",start:"15:00",end:"16:00"},
  {name:"Maddx",stage:"The Boomtown Bobbies",day:"Sat",start:"16:00",end:"17:00"},
  {name:"Millz B2B Kleu B2B Kivi",stage:"The Boomtown Bobbies",day:"Sat",start:"17:00",end:"18:00"},
  {name:"DJ Hybrid B2B Origin8a & Propa",stage:"The Boomtown Bobbies",day:"Sat",start:"18:00",end:"18:50"},
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
  // --- Sat: Soapranos Laundrette ---
  {name:"Selextorhood",stage:"Soapranos Laundrette",day:"Sat",start:"13:00",end:"14:00"},
  {name:"Rose Holland",stage:"Soapranos Laundrette",day:"Sat",start:"14:00",end:"15:00"},
  {name:"Laundry Night Live",stage:"Soapranos Laundrette",day:"Sat",start:"15:00",end:"16:00"},
  {name:"Kundarini",stage:"Soapranos Laundrette",day:"Sat",start:"16:00",end:"17:00"},
  {name:"Aura",stage:"Soapranos Laundrette",day:"Sat",start:"17:00",end:"18:00"},
  {name:"Esc",stage:"Soapranos Laundrette",day:"Sat",start:"18:00",end:"19:00"},
  {name:"Alina",stage:"Soapranos Laundrette",day:"Sat",start:"19:00",end:"20:00"},
  {name:"Simms",stage:"Soapranos Laundrette",day:"Sat",start:"20:00",end:"21:00"},
  {name:"Dominator Presents: Caliban",stage:"Soapranos Laundrette",day:"Sat",start:"21:00",end:"22:00"},
  {name:"Dominator Presents: Special Guest",stage:"Soapranos Laundrette",day:"Sat",start:"22:00",end:"23:00"},
  {name:"Dominator Presents: Meduse Noir",stage:"Soapranos Laundrette",day:"Sat",start:"23:00",end:"00:00"},
  // --- Sat: Hotel Paradiso ---
  {name:"Vibe Roulette",stage:"Hotel Paradiso",day:"Sat",start:"19:30",end:"21:30"},
  {name:"DJ Andres Cervero",stage:"Hotel Paradiso",day:"Sat",start:"21:30",end:"22:00"},
  {name:"Malavita!",stage:"Hotel Paradiso",day:"Sat",start:"22:00",end:"23:00"},
  {name:"DJ Andres Cervero",stage:"Hotel Paradiso",day:"Sat",start:"23:00",end:"00:00"},
  {name:"Tripl3 B & The Trouble Makers",stage:"Hotel Paradiso",day:"Sat",start:"00:00",end:"01:00"},
  {name:"Banshee Takeover",stage:"Hotel Paradiso",day:"Sat",start:"01:00",end:"02:00"},
  // --- Sat: Luck Exchange Casino ---
  {name:"Deal Of Fortune",stage:"Luck Exchange Casino",day:"Sat",start:"19:05",end:"19:20"},
  {name:"Air Horny",stage:"Luck Exchange Casino",day:"Sat",start:"19:25",end:"19:35"},
  {name:"DJ Buckaroo",stage:"Luck Exchange Casino",day:"Sat",start:"19:35",end:"19:50"},
  {name:"Carrot And Dick",stage:"Luck Exchange Casino",day:"Sat",start:"19:55",end:"20:00"},
  {name:"Rate My Horse Drawing",stage:"Luck Exchange Casino",day:"Sat",start:"20:05",end:"20:15"},
  {name:"The Paul Taylor Experience",stage:"Luck Exchange Casino",day:"Sat",start:"20:15",end:"20:45"},
  {name:"DJ Noeyedear",stage:"Luck Exchange Casino",day:"Sat",start:"20:45",end:"21:15"},
  {name:"Petrol Hoers",stage:"Luck Exchange Casino",day:"Sat",start:"21:15",end:"21:45"},
  // --- Sat: The Garden Centre ---
  {name:"DJ Mozzarella Stix",stage:"The Garden Centre",day:"Sat",start:"13:00",end:"14:00"},
  {name:"Yellowsix",stage:"The Garden Centre",day:"Sat",start:"14:00",end:"15:00"},
  {name:"Dky",stage:"The Garden Centre",day:"Sat",start:"15:00",end:"16:00"},
  {name:"Ravermonkey",stage:"The Garden Centre",day:"Sat",start:"16:00",end:"17:30"},
  {name:"Gnome Gala Ft. Smooches",stage:"The Garden Centre",day:"Sat",start:"17:30",end:"19:00"},
  {name:"The Regional Manager's Garden Show",stage:"The Garden Centre",day:"Sat",start:"21:00",end:"22:00"},
  {name:"Strawberry Jams",stage:"The Garden Centre",day:"Sat",start:"22:00",end:"22:30"},
  {name:"Fireworks Factory",stage:"The Garden Centre",day:"Sat",start:"22:30",end:"23:30"},
  {name:"Konetix",stage:"The Garden Centre",day:"Sat",start:"23:30",end:"00:30"},
  {name:"Hide The Soul",stage:"The Garden Centre",day:"Sat",start:"00:30",end:"01:30"},
  {name:"Medusa",stage:"The Garden Centre",day:"Sat",start:"01:30",end:"02:45"},
  {name:"Cheska Onyx",stage:"The Garden Centre",day:"Sat",start:"02:45",end:"04:00"},
  // --- Sat: Botanica Zoo ---
  {name:"Sis:Dem Taken Over",stage:"Botanica Zoo",day:"Sat",start:"15:00",end:"17:00"},
  {name:"Lady Lena w/ Nav",stage:"Botanica Zoo",day:"Sat",start:"17:00",end:"18:00"},
  {name:"Scorpio B2B Fendi K",stage:"Botanica Zoo",day:"Sat",start:"18:00",end:"19:00"},
  {name:"Origin8a & Propa B2B A.N.T",stage:"Botanica Zoo",day:"Sat",start:"19:00",end:"20:00"},
  {name:"Dwarde B2B Tim Reaper B2B Abby Daze",stage:"Botanica Zoo",day:"Sat",start:"20:00",end:"22:00"},
  {name:"Mike Frear",stage:"Botanica Zoo",day:"Sat",start:"22:00",end:"23:00"},
  {name:"Cicely",stage:"Botanica Zoo",day:"Sat",start:"23:00",end:"00:00"},
  {name:"Alk-M-E B2B Malware",stage:"Botanica Zoo",day:"Sat",start:"00:00",end:"01:00"},
  {name:"Crank Vinyl Set w/ MC Stretch",stage:"Botanica Zoo",day:"Sat",start:"01:00",end:"02:00"},
  {name:"E-Coli",stage:"Botanica Zoo",day:"Sat",start:"02:00",end:"03:00"},
  {name:"Asher Ashan",stage:"Botanica Zoo",day:"Sat",start:"03:00",end:"03:55"},
  // --- Sat: The Immortal Children of the Eternal Seed ---
  {name:"Kritical Mass",stage:"The Immortal Children of the Eternal Seed",day:"Sat",start:"22:00",end:"23:00"},
  {name:"Safe N Sound",stage:"The Immortal Children of the Eternal Seed",day:"Sat",start:"23:00",end:"00:00"},
  {name:"Baithead",stage:"The Immortal Children of the Eternal Seed",day:"Sat",start:"00:00",end:"01:00"},
  {name:"Glume B2B Phossa B2B Samba",stage:"The Immortal Children of the Eternal Seed",day:"Sat",start:"01:00",end:"03:00"},
  {name:"Ellament",stage:"The Immortal Children of the Eternal Seed",day:"Sat",start:"03:00",end:"04:00"},
  // --- Sat: Topsy Turvy Trims ---
  {name:"Kandy D. Licious",stage:"Topsy Turvy Trims",day:"Sat",start:"13:00",end:"13:30"},
  {name:"Merchant",stage:"Topsy Turvy Trims",day:"Sat",start:"13:30",end:"15:00"},
  {name:"Frazr Musica",stage:"Topsy Turvy Trims",day:"Sat",start:"15:00",end:"16:00"},
  {name:"Hokey Cokey Cabaret",stage:"Topsy Turvy Trims",day:"Sat",start:"17:00",end:"18:00"},
  {name:"Goose",stage:"Topsy Turvy Trims",day:"Sat",start:"19:00",end:"20:00"},
  {name:"Woody Cook",stage:"Topsy Turvy Trims",day:"Sat",start:"20:00",end:"21:00"},
  {name:"DJ Borat",stage:"Topsy Turvy Trims",day:"Sat",start:"21:00",end:"22:00"},
  {name:"Tickety Boo",stage:"Topsy Turvy Trims",day:"Sat",start:"22:00",end:"00:00"},
  {name:"Black Board Soundsystem",stage:"Topsy Turvy Trims",day:"Sat",start:"00:00",end:"02:00"},
  // --- Sat: PFP Robot ---
  {name:"The Blister Pack",stage:"PFP Robot",day:"Sat",start:"15:00",end:"16:00"},
  {name:"Jaz Imsky B2B Coco Dubz",stage:"PFP Robot",day:"Sat",start:"16:00",end:"17:00"},
  {name:"Eloquin B2B PJ Bridger",stage:"PFP Robot",day:"Sat",start:"17:00",end:"18:00"},
  // --- Sat: Sub Lab ---
  {name:"Supplya",stage:"Sub Lab",day:"Sat",start:"18:00",end:"19:00"},
  {name:"Bubski",stage:"Sub Lab",day:"Sat",start:"19:00",end:"20:00"},
  {name:"Aaee",stage:"Sub Lab",day:"Sat",start:"20:00",end:"21:00"},
  {name:"Anything But Becky",stage:"Sub Lab",day:"Sat",start:"21:00",end:"22:00"},
  {name:"Ruggz B2B Sonia Sol",stage:"Sub Lab",day:"Sat",start:"22:00",end:"23:30"},
  {name:"Sis:Dem",stage:"Sub Lab",day:"Sat",start:"23:30",end:"01:00"},
  {name:"Mystic State",stage:"Sub Lab",day:"Sat",start:"01:00",end:"02:00"},
  {name:"Numa Crew",stage:"Sub Lab",day:"Sat",start:"02:00",end:"03:00"},
  {name:"Rotate",stage:"Sub Lab",day:"Sat",start:"03:00",end:"03:59"},
  // --- Sat: Nachtlicker ---
  {name:"Jackdoesjungle",stage:"Nachtlicker",day:"Sat",start:"18:00",end:"19:00"},
  {name:"Peppa",stage:"Nachtlicker",day:"Sat",start:"19:00",end:"20:00"},
  {name:"PJ Peek",stage:"Nachtlicker",day:"Sat",start:"20:00",end:"21:15"},
  {name:"Rizzy & The Gents Live",stage:"Nachtlicker",day:"Sat",start:"21:15",end:"22:00"},
  {name:"Militant Music",stage:"Nachtlicker",day:"Sat",start:"22:00",end:"23:00"},
  {name:"Goff Feat Baby Sol",stage:"Nachtlicker",day:"Sat",start:"23:00",end:"00:15"},
  {name:"Shirley Temper",stage:"Nachtlicker",day:"Sat",start:"00:15",end:"01:30"},
  {name:"The Bass Injector",stage:"Nachtlicker",day:"Sat",start:"01:30",end:"02:30"},
  {name:"Kells",stage:"Nachtlicker",day:"Sat",start:"02:30",end:"04:00"},
  // --- Sat: Deviant Lounge ---
  {name:"Charles The Princess B2B Pretty Patel",stage:"Deviant Lounge",day:"Sat",start:"20:00",end:"21:00"},
  {name:"Plughole Takeover",stage:"Deviant Lounge",day:"Sat",start:"21:00",end:"22:00"},
  {name:"Miss Bee Spinner B2B Promiscuous Piggy",stage:"Deviant Lounge",day:"Sat",start:"22:00",end:"23:00"},
  {name:"DJ Elsa From Frozen",stage:"Deviant Lounge",day:"Sat",start:"23:00",end:"23:30"},
  {name:"Bunn13",stage:"Deviant Lounge",day:"Sat",start:"23:30",end:"00:10"},
  {name:"Kake",stage:"Deviant Lounge",day:"Sat",start:"00:10",end:"00:50"},
  {name:"Skrub",stage:"Deviant Lounge",day:"Sat",start:"00:50",end:"01:30"},
  {name:"Goosey",stage:"Deviant Lounge",day:"Sat",start:"01:30",end:"02:15"},
  {name:"Mums Against Donk Takeover (Pissxie)",stage:"Deviant Lounge",day:"Sat",start:"02:15",end:"03:00"},
  {name:"Mums Against Donk Takeover (Alterum)",stage:"Deviant Lounge",day:"Sat",start:"03:00",end:"04:00"},
  // --- Sat: Gabber Kebabber ---
  {name:"Jungyals and Gays Takeover",stage:"Gabber Kebabber",day:"Sat",start:"13:00",end:"15:00"},
  {name:"Shirley Temper B2B Syntax",stage:"Gabber Kebabber",day:"Sat",start:"15:00",end:"15:45"},
  {name:"Scottish Gabber Punk",stage:"Gabber Kebabber",day:"Sat",start:"15:45",end:"16:15"},
  {name:"Petrol Hoers",stage:"Gabber Kebabber",day:"Sat",start:"16:15",end:"16:45"},
  {name:"Phetcore",stage:"Gabber Kebabber",day:"Sat",start:"16:45",end:"17:30"},
  {name:"Audio Gutter",stage:"Gabber Kebabber",day:"Sat",start:"17:30",end:"18:30"},
  {name:"Dirty Chronic",stage:"Gabber Kebabber",day:"Sat",start:"18:30",end:"19:30"},
  {name:"Smifcour",stage:"Gabber Kebabber",day:"Sat",start:"19:30",end:"20:30"},
  {name:"Mikey Motion",stage:"Gabber Kebabber",day:"Sat",start:"20:30",end:"21:30"},
  {name:"Bobby Starchild",stage:"Gabber Kebabber",day:"Sat",start:"21:30",end:"22:30"},
  {name:"Manrat",stage:"Gabber Kebabber",day:"Sat",start:"22:30",end:"23:30"},
  {name:"Mcat",stage:"Gabber Kebabber",day:"Sat",start:"23:30",end:"00:10"},
  {name:"Nice'n'Spicy",stage:"Gabber Kebabber",day:"Sat",start:"00:10",end:"00:50"},
  {name:"Herbie",stage:"Gabber Kebabber",day:"Sat",start:"00:50",end:"01:30"},
  {name:"Ginny",stage:"Gabber Kebabber",day:"Sat",start:"01:30",end:"02:15"},
  {name:"Indecline",stage:"Gabber Kebabber",day:"Sat",start:"02:15",end:"03:15"},
  {name:"Mollie Rush",stage:"Gabber Kebabber",day:"Sat",start:"03:15",end:"04:00"},
  // --- Sat: E Numbers ---
  {name:"Dance Mums",stage:"E Numbers",day:"Sat",start:"19:00",end:"19:45"},
  {name:"Dykes On Decks",stage:"E Numbers",day:"Sat",start:"19:45",end:"21:15"},
  {name:"C.Exe",stage:"E Numbers",day:"Sat",start:"21:15",end:"22:00"},
  {name:"Mannequins: Tommy Tempo",stage:"E Numbers",day:"Sat",start:"22:00",end:"22:45"},
  {name:"Mannequins: Yoyo",stage:"E Numbers",day:"Sat",start:"22:45",end:"23:30"},
  {name:"Æon: Muzhit",stage:"E Numbers",day:"Sat",start:"23:30",end:"00:15"},
  {name:"Æon: Vaqero",stage:"E Numbers",day:"Sat",start:"00:15",end:"01:00"},
  {name:"Æon: Sissy Cinnamon",stage:"E Numbers",day:"Sat",start:"01:00",end:"01:45"},
  {name:"Æon: Spinks",stage:"E Numbers",day:"Sat",start:"01:45",end:"02:30"},
  {name:"Æon: Nohexcode",stage:"E Numbers",day:"Sat",start:"02:30",end:"03:15"},
  {name:"Æon: Citytronix",stage:"E Numbers",day:"Sat",start:"03:15",end:"04:00"},
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
  {name:"Lizaza",stage:"The Pomegranate Parlour",day:"Sat",start:"01:00",end:"02:00"},
  {name:"Omadhaun",stage:"The Pomegranate Parlour",day:"Sat",start:"02:00",end:"03:00"},
  {name:"Nego",stage:"The Pomegranate Parlour",day:"Sat",start:"03:00",end:"03:55"},
  // --- Sat: Busker's Wharf ---
  {name:"The Pussy Catbaret",stage:"Busker's Wharf",day:"Sat",start:"19:30",end:"20:30"},
  {name:"The Lobster Cabaret",stage:"Busker's Wharf",day:"Sat",start:"21:00",end:"22:00"},
  // --- Sat: Twisted Time Machine (Bad Apple Bar) ---
  {name:"Aim - Cold Water Music Album Playback",stage:"Twisted Time Machine",day:"Sat",start:"12:00",end:"13:00"},
  {name:"Ocean Colour Scene - Mosley Shoals Album Playback",stage:"Twisted Time Machine",day:"Sat",start:"13:00",end:"14:00"},
  {name:"The Musicals Party",stage:"Twisted Time Machine",day:"Sat",start:"15:00",end:"16:00"},
  {name:"The Council Of Bens",stage:"Twisted Time Machine",day:"Sat",start:"16:00",end:"18:00"},
  {name:"2djs2many",stage:"Twisted Time Machine",day:"Sat",start:"18:00",end:"19:00"},
  {name:"DJ Work Experience",stage:"Twisted Time Machine",day:"Sat",start:"19:00",end:"20:00"},
  {name:"4 Ur Mindz Jadey C N Friends",stage:"Twisted Time Machine",day:"Sat",start:"20:00",end:"21:00"},
  {name:"Disco Exotic Presents",stage:"Twisted Time Machine",day:"Sat",start:"21:00",end:"23:00"},
  {name:"Only Oasis",stage:"Twisted Time Machine",day:"Sat",start:"23:00",end:"00:00"},
  {name:"Dubtendo Presents: Just Dance Live",stage:"Twisted Time Machine",day:"Sat",start:"00:00",end:"00:30"},
  {name:"Twisted Time Machine X Dubtendo",stage:"Twisted Time Machine",day:"Sat",start:"00:30",end:"02:00"},
  {name:"Big Daddy Woof Woof",stage:"Twisted Time Machine",day:"Sat",start:"02:00",end:"03:00"},
  {name:"Pink Floyd - The Dark Side Of The Moon",stage:"Twisted Time Machine",day:"Sat",start:"03:00",end:"04:00"},
  // --- Sat: Síbín Beag ---
  {name:"Autonemy",stage:"Síbín Beag",day:"Sat",start:"14:00",end:"14:45"},
  {name:"The Deltones",stage:"Síbín Beag",day:"Sat",start:"15:15",end:"16:00"},
  {name:"The Deadshots",stage:"Síbín Beag",day:"Sat",start:"16:30",end:"17:15"},
  {name:"Tootinska Moon",stage:"Síbín Beag",day:"Sat",start:"17:45",end:"18:30"},
  {name:"Ria Rua",stage:"Síbín Beag",day:"Sat",start:"19:00",end:"19:45"},
  {name:"Fancy Dan",stage:"Síbín Beag",day:"Sat",start:"20:15",end:"21:00"},
  {name:"Trad Folkin' Rocks House Band",stage:"Síbín Beag",day:"Sat",start:"21:30",end:"23:30"},
  {name:"Trad Folkin' Rave",stage:"Síbín Beag",day:"Sat",start:"00:00",end:"02:00"},
  // --- Sat: Helix ---
  {name:"Josephine Gyasi",stage:"Helix",day:"Sat",start:"16:30",end:"17:30"},
  {name:"Joe Sonar B2B Rose Holland",stage:"Helix",day:"Sat",start:"17:30",end:"19:00"},
  {name:"Steady",stage:"Helix",day:"Sat",start:"19:00",end:"20:00"},
  {name:"Lemtom",stage:"Helix",day:"Sat",start:"20:00",end:"21:00"},
  {name:"Brown Excellence",stage:"Helix",day:"Sat",start:"21:00",end:"22:30"},
  {name:"Jialing",stage:"Helix",day:"Sat",start:"22:30",end:"00:00"},
  {name:"Jay Carder",stage:"Helix",day:"Sat",start:"00:00",end:"01:30"},
  {name:"DJ Cosworth B2B Oldboy",stage:"Helix",day:"Sat",start:"01:30",end:"03:00"},
  // --- Sat: Mining for (g)Old Town ---
  {name:"Maggs",stage:"Mining for (g)Old Town",day:"Sat",start:"13:30",end:"15:00"},
  {name:"Father Lynch",stage:"Mining for (g)Old Town",day:"Sat",start:"15:00",end:"16:30"},
  {name:"Emma Ash",stage:"Mining for (g)Old Town",day:"Sat",start:"16:30",end:"17:30"},
  {name:"Wildsoul",stage:"Mining for (g)Old Town",day:"Sat",start:"17:30",end:"19:00"},
  // --- Sat: End of the Line ---
  {name:"DJ Osu!",stage:"End of the Line",day:"Sat",start:"19:55",end:"20:35"},
  {name:"Clara",stage:"End of the Line",day:"Sat",start:"20:35",end:"21:15"},
  {name:"Waxtek",stage:"End of the Line",day:"Sat",start:"21:20",end:"22:00"},
  {name:"Mollie Rush",stage:"End of the Line",day:"Sat",start:"22:00",end:"22:45"},
  {name:"Gabba Banoush",stage:"End of the Line",day:"Sat",start:"22:45",end:"23:25"},
  {name:"Charlie Power",stage:"End of the Line",day:"Sat",start:"23:25",end:"00:05"},
  {name:"Seppa",stage:"End of the Line",day:"Sat",start:"00:05",end:"01:05"},
  {name:"Gullyteen",stage:"End of the Line",day:"Sat",start:"01:05",end:"01:50"},
  {name:"N1pp1lls",stage:"End of the Line",day:"Sat",start:"01:50",end:"02:30"},
  {name:"Kalisae",stage:"End of the Line",day:"Sat",start:"02:30",end:"03:15"},
  {name:"Iffyhype",stage:"End of the Line",day:"Sat",start:"03:15",end:"04:00"},
  // --- Sat: Infinity ---
  {name:"Queer House Party Takeover: Bledi",stage:"Infinity",day:"Sat",start:"18:00",end:"19:00"},
  {name:"Queer House Party Takeover: Bambi",stage:"Infinity",day:"Sat",start:"19:00",end:"20:00"},
  {name:"Queer House Party Takeover: Dykes On Decks",stage:"Infinity",day:"Sat",start:"20:00",end:"21:30"},
  {name:"Queer House Party Takeover: Uokhun",stage:"Infinity",day:"Sat",start:"21:30",end:"23:00"},
  {name:"Queer House Party Takeover: Rose Gray",stage:"Infinity",day:"Sat",start:"23:00",end:"00:00"},
  {name:"Queer House Party Takeover: I. Jordan",stage:"Infinity",day:"Sat",start:"00:00",end:"02:00"},
  {name:"Queer House Party Takeover: Harry Gay B2B Meg Ward",stage:"Infinity",day:"Sat",start:"02:00",end:"04:00"},

  // ================= SUNDAY =================
  // --- Sun: The Lion's Den ---
  {name:"David Rodigan Presents: Ram Jam Ft D Double E, Hollie Cook & Irah",stage:"The Lion's Den",day:"Sun",start:"14:30",end:"15:45"},
  {name:"Vengaboys",stage:"The Lion's Den",day:"Sun",start:"16:00",end:"16:50"},
  {name:"Eve",stage:"The Lion's Den",day:"Sun",start:"17:10",end:"18:10"},
  {name:"Fcukers",stage:"The Lion's Den",day:"Sun",start:"18:40",end:"19:40"},
  {name:"Scissor Sisters",stage:"The Lion's Den",day:"Sun",start:"20:10",end:"21:40"},
  {name:"Faithless",stage:"The Lion's Den",day:"Sun",start:"22:15",end:"23:45"},
  {name:"Closing Ceremony",stage:"The Lion's Den",day:"Sun",start:"23:50",end:"00:00"},
  // --- Sun: Hydro XL ---
  {name:"Nimino Live",stage:"Hydro XL",day:"Sun",start:"15:00",end:"16:20"},
  {name:"Kilimanjaro B2B Oppidan",stage:"Hydro XL",day:"Sun",start:"16:30",end:"18:00"},
  {name:"Vtss",stage:"Hydro XL",day:"Sun",start:"18:00",end:"19:30"},
  {name:"Marlon Hoffstadt",stage:"Hydro XL",day:"Sun",start:"19:30",end:"21:00"},
  {name:"Sherelle AV Show",stage:"Hydro XL",day:"Sun",start:"21:00",end:"22:30"},
  {name:"Skrillex",stage:"Hydro XL",day:"Sun",start:"22:30",end:"23:50"},
  {name:"Closing Ceremony",stage:"Hydro XL",day:"Sun",start:"23:50",end:"00:00"},
  // --- Sun: Grand Central ---
  {name:"Dub Pistols",stage:"Grand Central",day:"Sun",start:"14:00",end:"15:00"},
  {name:"Beans On Toast",stage:"Grand Central",day:"Sun",start:"15:30",end:"16:30"},
  {name:"Elvana",stage:"Grand Central",day:"Sun",start:"17:00",end:"18:00"},
  {name:"Dr Meaker Live",stage:"Grand Central",day:"Sun",start:"18:30",end:"19:30"},
  {name:"Less Than Jake",stage:"Grand Central",day:"Sun",start:"20:00",end:"21:00"},
  {name:"Skindred",stage:"Grand Central",day:"Sun",start:"21:30",end:"22:30"},
  // --- Sun: Hidden Woods ---
  {name:"Grooverider",stage:"Hidden Woods",day:"Sun",start:"13:00",end:"14:00"},
  {name:"Shades Of Rhythm",stage:"Hidden Woods",day:"Sun",start:"14:00",end:"15:00"},
  {name:"K-Klass B2B Morgan Seatree",stage:"Hidden Woods",day:"Sun",start:"15:00",end:"16:00"},
  {name:"Sonique",stage:"Hidden Woods",day:"Sun",start:"16:00",end:"17:00"},
  {name:"Kings Of The Rave",stage:"Hidden Woods",day:"Sun",start:"17:00",end:"18:00"},
  {name:"Pete Cannon B2B Time To Rush",stage:"Hidden Woods",day:"Sun",start:"18:00",end:"19:00"},
  {name:"Ratty & Serum Ft. Mad P",stage:"Hidden Woods",day:"Sun",start:"19:00",end:"20:00"},
  {name:"Cheff The Boy B2B Hypershé B2B Origin8a & Propa",stage:"Hidden Woods",day:"Sun",start:"20:00",end:"21:00"},
  {name:"Altern 8 B2B Slipmatt Ft. Dread MC",stage:"Hidden Woods",day:"Sun",start:"21:00",end:"22:00"},
  {name:"Anz B2B Special Request",stage:"Hidden Woods",day:"Sun",start:"22:00",end:"23:00"},
  {name:"Ratpack",stage:"Hidden Woods",day:"Sun",start:"23:00",end:"00:00"},
  // --- Sun: Tangled Roots ---
  {name:"Lionpulse X Sinai",stage:"Tangled Roots",day:"Sun",start:"12:00",end:"13:00"},
  {name:"Aziza Jaye",stage:"Tangled Roots",day:"Sun",start:"13:00",end:"14:00"},
  {name:"Cheshire Cat",stage:"Tangled Roots",day:"Sun",start:"14:00",end:"15:00"},
  {name:"Ras Demo Aka Demolition Man",stage:"Tangled Roots",day:"Sun",start:"15:00",end:"16:00"},
  {name:"Top Cat",stage:"Tangled Roots",day:"Sun",start:"16:00",end:"17:00"},
  {name:"Jolie P",stage:"Tangled Roots",day:"Sun",start:"17:00",end:"18:00"},
  {name:"Simms",stage:"Tangled Roots",day:"Sun",start:"18:00",end:"19:00"},
  {name:"Aries Jungle Set Ft. Carasel",stage:"Tangled Roots",day:"Sun",start:"19:00",end:"20:15"},
  {name:"Irah",stage:"Tangled Roots",day:"Sun",start:"20:15",end:"21:00"},
  // --- Sun: Anara Forest ---
  {name:"Silva Snipa B2B Vxrgo",stage:"Anara Forest",day:"Sun",start:"14:00",end:"15:30"},
  {name:"Sabrina Ft. Dread MC",stage:"Anara Forest",day:"Sun",start:"15:30",end:"16:30"},
  {name:"Skantia Ft. Strategy",stage:"Anara Forest",day:"Sun",start:"16:30",end:"18:00"},
  {name:"Kyrist B2B Waeys Ft. Strategy",stage:"Anara Forest",day:"Sun",start:"18:00",end:"19:00"},
  {name:"Molecular B2B Wingz Ft. Jakes",stage:"Anara Forest",day:"Sun",start:"19:00",end:"20:00"},
  {name:"Visages Ft. Sp:Mc",stage:"Anara Forest",day:"Sun",start:"20:00",end:"21:30"},
  {name:"Mandidextrous Ft. Maddy V",stage:"Anara Forest",day:"Sun",start:"21:30",end:"23:00"},
  {name:"Simula Ft. Jakes",stage:"Anara Forest",day:"Sun",start:"23:00",end:"00:00"},
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
  // --- Sun: Nexus ---
  {name:"Bongo's Bingo",stage:"Nexus",day:"Sun",start:"14:30",end:"15:30"},
  {name:"The League Of Rebelz",stage:"Nexus",day:"Sun",start:"16:00",end:"17:00"},
  {name:"Hollie Cook",stage:"Nexus",day:"Sun",start:"17:30",end:"18:30"},
  {name:"Talib Kweli",stage:"Nexus",day:"Sun",start:"19:15",end:"20:15"},
  {name:"Kibo",stage:"Nexus",day:"Sun",start:"20:40",end:"21:40"},
  {name:"Killowen",stage:"Nexus",day:"Sun",start:"22:00",end:"23:00"},
  // --- Sun: Spectrum 360 ---
  {name:"Peggy Vienetta Ft. MC Stone",stage:"Spectrum 360",day:"Sun",start:"15:00",end:"16:00"},
  {name:"Lobsta B",stage:"Spectrum 360",day:"Sun",start:"16:00",end:"17:00"},
  {name:"DJ Can't Say No",stage:"Spectrum 360",day:"Sun",start:"17:00",end:"18:00"},
  {name:"Keptek",stage:"Spectrum 360",day:"Sun",start:"18:00",end:"19:00"},
  {name:"Gullyteen",stage:"Spectrum 360",day:"Sun",start:"19:00",end:"20:00"},
  {name:"Darth Leng B2B Slinks",stage:"Spectrum 360",day:"Sun",start:"20:00",end:"21:00"},
  {name:"Roland K B2B Savage States B2B T-Menace",stage:"Spectrum 360",day:"Sun",start:"21:00",end:"22:00"},
  {name:"Spongebob Squarewave",stage:"Spectrum 360",day:"Sun",start:"22:00",end:"23:00"},
  {name:"Perceval",stage:"Spectrum 360",day:"Sun",start:"23:00",end:"00:00"},
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
  // --- Sun: Rose and Clown ---
  {name:"Boomtown's Got Talent",stage:"Rose and Clown",day:"Sun",start:"13:00",end:"15:00"},
  {name:"Sonia Sol",stage:"Rose and Clown",day:"Sun",start:"15:00",end:"16:00"},
  {name:"Nigel Garage",stage:"Rose and Clown",day:"Sun",start:"16:00",end:"17:00"},
  {name:"Robbieoke Williams",stage:"Rose and Clown",day:"Sun",start:"17:00",end:"18:00"},
  {name:"The 900 (Tony Hawk Tribute)",stage:"Rose and Clown",day:"Sun",start:"18:00",end:"19:00"},
  {name:"Annie Craic",stage:"Rose and Clown",day:"Sun",start:"19:00",end:"20:00"},
  {name:"Phatworld",stage:"Rose and Clown",day:"Sun",start:"20:00",end:"21:00"},
  {name:"DJ Lord Of The Rings",stage:"Rose and Clown",day:"Sun",start:"21:00",end:"22:00"},
  {name:"Haych & Movin Whata's",stage:"Rose and Clown",day:"Sun",start:"22:00",end:"23:00"},
  {name:"Crack Street Boys",stage:"Rose and Clown",day:"Sun",start:"23:00",end:"00:00"},
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
  // --- Sun: The Fools Leap ---
  {name:"Somerset Velvet",stage:"The Fools Leap",day:"Sun",start:"12:00",end:"13:00"},
  {name:"Whiskey Moonface",stage:"The Fools Leap",day:"Sun",start:"13:30",end:"14:30"},
  {name:"Black Kat Boppers",stage:"The Fools Leap",day:"Sun",start:"15:00",end:"16:00"},
  {name:"Panda And The Moniums",stage:"The Fools Leap",day:"Sun",start:"16:30",end:"17:30"},
  {name:"Wanton String Band",stage:"The Fools Leap",day:"Sun",start:"18:00",end:"19:00"},
  {name:"Horses On The Beach",stage:"The Fools Leap",day:"Sun",start:"19:30",end:"20:30"},
  {name:"Seas Of Mirth",stage:"The Fools Leap",day:"Sun",start:"21:00",end:"22:00"},
  {name:"Bear Twist's Honky Donk Rock'n'Rollers",stage:"The Fools Leap",day:"Sun",start:"22:00",end:"22:45"},
  {name:"Fiddler On The Doof",stage:"The Fools Leap",day:"Sun",start:"22:45",end:"23:45"},
  // --- Sun: Full Moon Ballroom ---
  {name:"Tripl3 B & The Troubl3 Makers",stage:"Full Moon Ballroom",day:"Sun",start:"13:30",end:"14:30"},
  {name:"Lfay",stage:"Full Moon Ballroom",day:"Sun",start:"15:00",end:"16:00"},
  {name:"House Of Pantha",stage:"Full Moon Ballroom",day:"Sun",start:"16:30",end:"17:15"},
  {name:"Cable Street Collective",stage:"Full Moon Ballroom",day:"Sun",start:"18:00",end:"19:00"},
  {name:"The Gulls",stage:"Full Moon Ballroom",day:"Sun",start:"19:30",end:"20:30"},
  {name:"Wanton String Band",stage:"Full Moon Ballroom",day:"Sun",start:"21:00",end:"22:00"},
  // --- Sun: Foggers Mill ---
  {name:"Easydread",stage:"Foggers Mill",day:"Sun",start:"13:00",end:"14:00"},
  {name:"Vegetable Collective",stage:"Foggers Mill",day:"Sun",start:"14:30",end:"15:30"},
  {name:"Year Of The Dog",stage:"Foggers Mill",day:"Sun",start:"16:00",end:"17:00"},
  {name:"Hot Squash",stage:"Foggers Mill",day:"Sun",start:"17:30",end:"18:30"},
  {name:"Tree House Fire",stage:"Foggers Mill",day:"Sun",start:"19:00",end:"20:00"},
  {name:"The Guns Of Navarone",stage:"Foggers Mill",day:"Sun",start:"20:30",end:"21:30"},
  // --- Sun: Soapranos Laundrette ---
  {name:"Empressure",stage:"Soapranos Laundrette",day:"Sun",start:"13:00",end:"14:00"},
  {name:"Soapranos: Hotwash!",stage:"Soapranos Laundrette",day:"Sun",start:"14:00",end:"15:00"},
  {name:"Jungyals And Gays",stage:"Soapranos Laundrette",day:"Sun",start:"15:00",end:"17:00"},
  {name:"Selectacee",stage:"Soapranos Laundrette",day:"Sun",start:"17:00",end:"18:00"},
  {name:"Euphonique & MC Enamie",stage:"Soapranos Laundrette",day:"Sun",start:"18:00",end:"19:00"},
  {name:"T-Lex + Special Guests",stage:"Soapranos Laundrette",day:"Sun",start:"19:00",end:"20:00"},
  // --- Sun: The Garden Centre ---
  {name:"Bateman",stage:"The Garden Centre",day:"Sun",start:"14:00",end:"15:30"},
  {name:"Tsp Ft. Factual MC",stage:"The Garden Centre",day:"Sun",start:"15:30",end:"16:30"},
  {name:"Joseph Dooley",stage:"The Garden Centre",day:"Sun",start:"16:30",end:"17:30"},
  {name:"Barcode-The-Dj",stage:"The Garden Centre",day:"Sun",start:"17:30",end:"19:00"},
  // --- Sun: Botanica Zoo ---
  {name:"Now That's Not What I Call Music",stage:"Botanica Zoo",day:"Sun",start:"15:00",end:"16:00"},
  {name:"Clifford Junior B2B Ironic Thug",stage:"Botanica Zoo",day:"Sun",start:"16:00",end:"17:00"},
  {name:"Dizzkid",stage:"Botanica Zoo",day:"Sun",start:"17:00",end:"18:00"},
  {name:"Secret Sexy Lady Takeover",stage:"Botanica Zoo",day:"Sun",start:"18:00",end:"19:00"},
  {name:"Ls Dare",stage:"Botanica Zoo",day:"Sun",start:"19:00",end:"20:00"},
  {name:"Insectcrusha w/ Taz-B",stage:"Botanica Zoo",day:"Sun",start:"20:00",end:"21:00"},
  {name:"Os:Man w/ MC Stezzy",stage:"Botanica Zoo",day:"Sun",start:"21:00",end:"22:00"},
  {name:"Simms B2B Os:Man",stage:"Botanica Zoo",day:"Sun",start:"22:00",end:"23:00"},
  {name:"Tashphrodisiac B2B Asset B2B Karmae T",stage:"Botanica Zoo",day:"Sun",start:"23:00",end:"23:55"},
  // --- Sun: The Immortal Children of the Eternal Seed ---
  {name:"Aerial Takeover",stage:"The Immortal Children of the Eternal Seed",day:"Sun",start:"20:00",end:"23:00"},
  // --- Sun: Topsy Turvy Trims ---
  {name:"Black Board Soundsystem",stage:"Topsy Turvy Trims",day:"Sun",start:"13:00",end:"15:00"},
  {name:"Ed Spinna",stage:"Topsy Turvy Trims",day:"Sun",start:"15:00",end:"16:00"},
  {name:"Hokey Cokey Cabaret",stage:"Topsy Turvy Trims",day:"Sun",start:"17:00",end:"18:00"},
  {name:"Ignoring Izzy",stage:"Topsy Turvy Trims",day:"Sun",start:"18:00",end:"19:00"},
  {name:"Tickety Boo",stage:"Topsy Turvy Trims",day:"Sun",start:"19:00",end:"21:00"},
  // --- Sun: Sub Lab ---
  {name:"Sublab Allstars",stage:"Sub Lab",day:"Sun",start:"16:00",end:"18:00"},
  {name:"El-Ze",stage:"Sub Lab",day:"Sun",start:"18:00",end:"19:00"},
  {name:"Tashphrodisiac",stage:"Sub Lab",day:"Sun",start:"19:00",end:"20:00"},
  {name:"Dwelha",stage:"Sub Lab",day:"Sun",start:"20:00",end:"21:00"},
  {name:"Felix Culpah",stage:"Sub Lab",day:"Sun",start:"21:00",end:"22:00"},
  {name:"Supplya",stage:"Sub Lab",day:"Sun",start:"22:00",end:"23:00"},
  {name:"Sublab Allstars",stage:"Sub Lab",day:"Sun",start:"23:00",end:"23:59"},
  // --- Sun: Nachtlicker ---
  {name:"Allen Tg",stage:"Nachtlicker",day:"Sun",start:"17:00",end:"18:15"},
  {name:"Cultur/Riot Feat Ciara May",stage:"Nachtlicker",day:"Sun",start:"18:15",end:"19:15"},
  {name:"Max Og",stage:"Nachtlicker",day:"Sun",start:"19:15",end:"20:15"},
  {name:"Eight Spring Rolls",stage:"Nachtlicker",day:"Sun",start:"20:15",end:"21:15"},
  {name:"Lakey",stage:"Nachtlicker",day:"Sun",start:"21:15",end:"22:30"},
  {name:"Sloppy Spice",stage:"Nachtlicker",day:"Sun",start:"22:30",end:"23:30"},
  // --- Sun: Deviant Lounge ---
  {name:"Half Broken Kru",stage:"Deviant Lounge",day:"Sun",start:"20:00",end:"21:00"},
  {name:"Juicy Goose B2B Froggy",stage:"Deviant Lounge",day:"Sun",start:"21:00",end:"22:00"},
  {name:"Captain Chaos B2B Queerdo",stage:"Deviant Lounge",day:"Sun",start:"22:00",end:"23:00"},
  {name:"DJ Bax",stage:"Deviant Lounge",day:"Sun",start:"23:00",end:"00:00"},
  // --- Sun: Gabber Kebabber ---
  {name:"Rhi Mysterio",stage:"Gabber Kebabber",day:"Sun",start:"14:00",end:"14:45"},
  {name:"Super Han",stage:"Gabber Kebabber",day:"Sun",start:"14:45",end:"15:30"},
  {name:"Adi",stage:"Gabber Kebabber",day:"Sun",start:"15:30",end:"16:30"},
  {name:"Riguana",stage:"Gabber Kebabber",day:"Sun",start:"16:30",end:"17:15"},
  {name:"Zen",stage:"Gabber Kebabber",day:"Sun",start:"17:15",end:"18:00"},
  {name:"Boltcropper Takeover",stage:"Gabber Kebabber",day:"Sun",start:"18:00",end:"22:00"},
  // --- Sun: E Numbers ---
  {name:"Bungzo",stage:"E Numbers",day:"Sun",start:"18:00",end:"18:45"},
  {name:"Hannza",stage:"E Numbers",day:"Sun",start:"18:45",end:"19:30"},
  {name:"Climaxxx: Gwlucas",stage:"E Numbers",day:"Sun",start:"19:30",end:"20:15"},
  {name:"Climaxxx: Bmol",stage:"E Numbers",day:"Sun",start:"20:15",end:"21:00"},
  {name:"Climaxxx: Princess Elf Bar",stage:"E Numbers",day:"Sun",start:"21:00",end:"21:45"},
  // --- Sun: The Pomegranate Parlour ---
  {name:"Digital Roses",stage:"The Pomegranate Parlour",day:"Sun",start:"14:00",end:"15:00"},
  {name:"Flibble",stage:"The Pomegranate Parlour",day:"Sun",start:"15:00",end:"16:00"},
  {name:"Habibtati",stage:"The Pomegranate Parlour",day:"Sun",start:"16:00",end:"17:00"},
  {name:"Dmtree",stage:"The Pomegranate Parlour",day:"Sun",start:"17:00",end:"18:00"},
  {name:"Decebelle",stage:"The Pomegranate Parlour",day:"Sun",start:"18:00",end:"19:00"},
  {name:"Illexxandra & DJ Shakey Mighty Morphin Power Combo",stage:"The Pomegranate Parlour",day:"Sun",start:"19:00",end:"20:00"},
  {name:"Gypsyndicate",stage:"The Pomegranate Parlour",day:"Sun",start:"20:00",end:"21:00"},
  {name:"Me Miles & I",stage:"The Pomegranate Parlour",day:"Sun",start:"21:00",end:"22:30"},
  {name:"Ludec",stage:"The Pomegranate Parlour",day:"Sun",start:"22:30",end:"23:55"},
  // --- Sun: Busker's Wharf ---
  {name:"The Pussy Catbaret",stage:"Busker's Wharf",day:"Sun",start:"19:30",end:"21:00"},
  // --- Sun: Twisted Time Machine (Bad Apple Bar) ---
  {name:"Mvm - Finally We Are No One Album Playback",stage:"Twisted Time Machine",day:"Sun",start:"13:00",end:"14:00"},
  {name:"Susomo Yakota - Acid Mt Fuji Album Playback",stage:"Twisted Time Machine",day:"Sun",start:"14:00",end:"15:00"},
  {name:"Motown Amore",stage:"Twisted Time Machine",day:"Sun",start:"15:00",end:"16:00"},
  {name:"The Beatles Hour",stage:"Twisted Time Machine",day:"Sun",start:"16:00",end:"17:00"},
  {name:"Emerging Beats: Dare To Disco",stage:"Twisted Time Machine",day:"Sun",start:"17:00",end:"18:00"},
  {name:"The Josh Baker Tribute Party",stage:"Twisted Time Machine",day:"Sun",start:"18:00",end:"19:00"},
  {name:"Church Of Donkology",stage:"Twisted Time Machine",day:"Sun",start:"19:00",end:"20:00"},
  {name:"Hang The Djs: Sunday Service",stage:"Twisted Time Machine",day:"Sun",start:"20:00",end:"22:00"},
  {name:"Papa Disco's Goodnight Set",stage:"Twisted Time Machine",day:"Sun",start:"22:00",end:"00:00"},
  // --- Sun: Síbín Beag ---
  {name:"Didn't Make Mass (Irish Pub Quiz)",stage:"Síbín Beag",day:"Sun",start:"14:00",end:"16:00"},
  {name:"Painted Sails",stage:"Síbín Beag",day:"Sun",start:"16:00",end:"16:45"},
  {name:"Polly Gone Wrong",stage:"Síbín Beag",day:"Sun",start:"17:15",end:"18:00"},
  {name:"Ruth Theodore",stage:"Síbín Beag",day:"Sun",start:"18:30",end:"19:15"},
  {name:"Graham Sweeney",stage:"Síbín Beag",day:"Sun",start:"19:45",end:"20:30"},
  {name:"Last Orders Karaoke",stage:"Síbín Beag",day:"Sun",start:"20:30",end:"22:00"},
  {name:"Slán Abhaile",stage:"Síbín Beag",day:"Sun",start:"22:00",end:"22:30"},
  // --- Sun: Helix ---
  {name:"Full Fat Records",stage:"Helix",day:"Sun",start:"15:00",end:"16:00"},
  {name:"Submatic",stage:"Helix",day:"Sun",start:"16:00",end:"17:00"},
  {name:"Sin & Brook - Does It Double",stage:"Helix",day:"Sun",start:"17:00",end:"18:00"},
  {name:"This Is Inja",stage:"Helix",day:"Sun",start:"18:00",end:"19:00"},
  {name:"K-65 90's D&B Set",stage:"Helix",day:"Sun",start:"19:00",end:"20:30"},
  {name:"Selecta J-Man",stage:"Helix",day:"Sun",start:"20:30",end:"22:00"},
  {name:"Strategy DJ Set",stage:"Helix",day:"Sun",start:"22:00",end:"23:00"},
  // --- Sun: Mining for (g)Old Town ---
  {name:"DJ Sarah Tonin",stage:"Mining for (g)Old Town",day:"Sun",start:"13:30",end:"15:00"},
  {name:"DJ Shoulda Learnt The Clarinet",stage:"Mining for (g)Old Town",day:"Sun",start:"15:00",end:"16:00"},
  {name:"Light Gal",stage:"Mining for (g)Old Town",day:"Sun",start:"16:00",end:"17:30"},
  {name:"Flails",stage:"Mining for (g)Old Town",day:"Sun",start:"17:30",end:"19:00"},
  // --- Sun: End of the Line ---
  {name:"Sufi",stage:"End of the Line",day:"Sun",start:"20:00",end:"21:00"},
  {name:"Loopy",stage:"End of the Line",day:"Sun",start:"21:00",end:"22:00"},
  {name:"Omadhaun",stage:"End of the Line",day:"Sun",start:"22:00",end:"23:00"},
  {name:"Jenny Sparks",stage:"End of the Line",day:"Sun",start:"23:00",end:"00:00"},
  // --- Sun: Infinity ---
  {name:"Olive F",stage:"Infinity",day:"Sun",start:"17:00",end:"18:30"},
  {name:"Storm Mollison",stage:"Infinity",day:"Sun",start:"18:30",end:"20:00"},
  {name:"Pbr Streetgang",stage:"Infinity",day:"Sun",start:"20:00",end:"21:30"},
  {name:"Gina Breeze",stage:"Infinity",day:"Sun",start:"21:30",end:"23:00"}
];

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

function allArtists(){
  return artists.concat(Store.get("customArtists"));
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
    const r = reconciled(people[person] || []);
    if(r.changed){ people[person] = r.list; peopleChanged = true; }
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

function hasActiveArtistFilters(){
  return artistSearch.value.trim().length > 0 || selectedGenres.size > 0;
}

function updateClearArtistSearchBtn(){
  if(!clearArtistSearchBtn) return;
  clearArtistSearchBtn.style.display = hasActiveArtistFilters() ? "" : "none";
}

function showArtists(list){
  artistResults.innerHTML = "";
  if(list.length === 0){
    artistResults.innerHTML = `<p class="empty-note">No artists match that search.</p>`;
    return;
  }
  list.forEach(artist=>{
    const saved = Store.get("schedule").some(x=>x.name === artist.name);
    const mustSee = isMustSee(artist.name);
    const div = document.createElement("div");
    div.className = "item" + (mustSee ? " mustsee" : "");
    const genre = genreOf(artist);
    const bioBlock = artistBioBlockHtml(artist);
    div.innerHTML = `
      <div class="item-top">
        <div>
          <strong>${artist.name}</strong><br>
          <span class="stage-link" data-stage="${escapeHtml(artist.stage)}">${artist.stage}</span><br>
          ${timeLabel(artist)}<br>
          <small>${genre}</small>
          <div class="artist-descriptor">${escapeHtml(artistDescriptor(artist))}</div>
          ${bioBlock}
        </div>
        <button class="star-btn${mustSee ? " mustsee" : ""}" aria-label="Toggle saved, hold for must-see">${saved ? "★" : "☆"}</button>
      </div>
    `;
    wireStarButton(div.querySelector(".star-btn"), artist);
    div.querySelector(".stage-link").onclick = (e)=>{ e.stopPropagation(); jumpToStageDirectory(artist.stage); };
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
    return matchesTerm && matchesGenres;
  });
}

// With 1000+ acts across the full 5-day dataset, dumping everything to
// the DOM on load is slow on older phones — search-first instead.
function promptArtistSearch(){
  artistResults.innerHTML = `<p class="empty-note">Start typing a name, stage or genre — or tap one or more genre chips above — to search ${allArtists().length} acts across all 5 days.</p>`;
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
// venueDirectory is declared further down the file, so this set is built
// lazily on first use rather than at module-evaluation time.
let _mainStageNames = null;
function mainStageNames(){
  if(!_mainStageNames) _mainStageNames = new Set(venueDirectory.filter(v=>v.type==="Main stage").map(v=>v.name));
  return _mainStageNames;
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
  // Main stages first (Grand Central, Hydro XL, etc.), then every smaller/
  // hidden venue, alphabetically within each group.
  const mainStages = mainStageNames();
  const stages = [...new Set(parsed.map(p=>p.stage))].sort((a,b)=>{
    const aMain = mainStages.has(a) ? 0 : 1;
    const bMain = mainStages.has(b) ? 0 : 1;
    return aMain !== bMain ? aMain - bMain : a.localeCompare(b);
  });
  const totalWidth = Math.max((maxMin-minMin)*pxPerMin, 40);
  const savedNames = opts.savedNames || null;
  const mustSeeNames = opts.mustSeeNames || null;

  let hourLabels = "", hourLines = "";
  for(let m=minMin; m<=maxMin; m+=60){
    const left = (m-minMin)*pxPerMin;
    const hh = Math.floor((((m%1440)+1440)%1440)/60).toString().padStart(2,"0");
    hourLabels += `<div class="timeline-hour-label" style="left:${left}px;">${hh}:00</div>`;
    hourLines += `<div class="timeline-vline" style="left:${left}px;"></div>`;
  }

  const rows = stages.map(stage=>{
    const stageItems = parsed.filter(p=>p.stage===stage);
    const blocks = stageItems.map(p=>{
      const left = (p._start-minMin)*pxPerMin;
      const width = Math.max((p._end-p._start)*pxPerMin, 60);
      const isSaved = savedNames ? savedNames.has(p.name) : false;
      const isMustSeeBlock = mustSeeNames ? mustSeeNames.has(p.name) : false;
      const cls = "timeline-block" + (isSaved ? " saved" : "") + (isMustSeeBlock ? " mustsee" : "") + (opts.readonly ? " readonly" : "");
      return `<div class="${cls}" style="left:${left}px; width:${width}px;" data-name="${escapeHtml(p.name)}" data-day="${escapeHtml(p.day||"")}"><b>${escapeHtml(p.name)}</b><span class="tb-time">${escapeHtml(p.start||"")}${p.end?"–"+escapeHtml(p.end):""}${isSaved?" ★":""}</span></div>`;
    }).join("");
    return `<div class="timeline-row"><div class="timeline-row-head stage-link" data-stage="${escapeHtml(stage)}">${escapeHtml(stage)}</div><div class="timeline-row-body" style="width:${totalWidth}px; height:${rowHeight}px;">${hourLines}${blocks}</div></div>`;
  }).join("");

  const html = `<div class="timeline-grid">
    <div class="timeline-hours-row"><div class="timeline-row-head">&nbsp;</div><div class="timeline-hours-body" style="width:${totalWidth}px;">${hourLabels}</div></div>
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
  const genre = genreOf(artist);
  const bioBlock = artistBioBlockHtml(artist);
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
        </div>
        ${opts.readonly ? "" : `<button class="star-toggle-lg${mustSee ? " mustsee" : ""}" aria-label="Toggle saved, hold for must-see" id="timelineDetailStarBtn">${saved ? "★" : "☆"}</button>`}
      </div>
    </div>
  `;
  backdrop.onclick = (e)=>{ if(e.target === backdrop) closeTimelineDetailModal(); };
  document.body.appendChild(backdrop);
  backdrop.querySelector("#timelineDetailCloseBtn").onclick = closeTimelineDetailModal;
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
  const { html } = buildTimelineHTML(dayItems, { savedNames, mustSeeNames });
  grid.innerHTML = html;
  grid.querySelectorAll(".timeline-block").forEach(b=>{
    b.onclick = ()=>{
      const name = b.dataset.name, day = b.dataset.day;
      const artist = allArtists().find(a=>a.name===name && a.day===day);
      if(artist) showTimelineDetailModal(artist, { onSaveToggle: renderArtistsTimeline });
    };
  });
  wireStageLinks(grid);
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

// ===============================
// PERSONAL SCHEDULE
// ===============================
const scheduleList = document.getElementById("scheduleList");
let planView = "list";
let planMustSeeFilter = false;
let clashSubView = "list";
let clashTimelineDay = "Wed";

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

function scheduleItemHTML(artist, idx, clashes, readonly, mustSeeNamesSet){
  const clashClass = clashes && clashes.length ? " clash" : "";
  const mustSee = !!artist.mustSee;
  const genre = genreOf(artist);
  const bioBlock = artistBioBlockHtml(artist);
  const mustSeeSet = mustSeeNamesSet || new Set();
  const clashLines = (clashes || []).map(c=>{
    const walk = estimateWalk(artist.stage, c.stage);
    const otherMustSee = mustSeeSet.has(c.name);
    return `<div>⚠ Clashes with <strong>${escapeHtml(c.name)}</strong>${otherMustSee ? ` <span class="mustsee-tag">★ must-see</span>` : ""} at <span class="stage-link" data-stage="${escapeHtml(c.stage)}">${escapeHtml(c.stage)}</span>${walk ? ` — ${escapeHtml(walk.text)}${escapeHtml(walk.suffix)}` : ""}</div>`;
  }).join("");
  return `
    <div class="item${clashClass}${mustSee ? " mustsee" : ""}" data-idx="${idx}">
      <div class="item-top">
        <div>
          <strong>${artist.name}</strong>${mustSee ? ` <span class="mustsee-tag">★ must-see</span>` : ""}<br>
          <span class="stage-link" data-stage="${escapeHtml(artist.stage)}">${artist.stage}</span><br>
          <span class="time-label">${timeLabel(artist)}</span>
          <div class="artist-descriptor">${escapeHtml(artistDescriptor(artist))}</div>
          ${bioBlock}
        </div>
        ${readonly ? "" : `<div class="btnrow plan-btnrow">
          <div class="btnrow-top">
            <button class="star-btn${mustSee ? " mustsee" : ""} mustsee-toggle-btn" aria-label="Toggle must-see" title="Must-see">${mustSee ? "★" : "☆"}</button>
            <button class="remove-btn">Remove</button>
          </div>
          <button class="set-time-btn">Set time</button>
        </div>`}
      </div>
      ${clashLines ? `<div class="clash-note">${clashLines}</div>` : ""}
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
    <div class="row2">
      <div class="field"><label>Start</label><input type="time" class="edit-start" value="${artist.start||""}"></div>
      <div class="field"><label>End</label><input type="time" class="edit-end" value="${artist.end||""}"></div>
    </div>
    <button class="action save-time-btn">Save time</button>
  `;
  container.querySelector(".save-time-btn").onclick = ()=>{
    const day = container.querySelector(".edit-day").value;
    const start = container.querySelector(".edit-start").value || null;
    const end = container.querySelector(".edit-end").value || null;
    onSave(day, start, end);
    container.innerHTML = "";
  };
}

// ===============================
// PLAN — WHOSE SCHEDULE AM I LOOKING AT
// ===============================
// "mine" is always this device's own Store.get("schedule") — the only
// one that's ever editable, saved to, or counted in stats/next-event.
// Anything else is a name key into peopleSchedules, a read-only snapshot
// that arrived via a teammate's Sync code. Switching tabs never copies
// or merges one into the other.
let planActiveOwner = "mine";

function activeScheduleData(){
  if(planActiveOwner === "mine") return Store.get("schedule");
  const people = Store.get("peopleSchedules") || {};
  return (people[planActiveOwner] || []).slice();
}

function renderPlanPersonTabs(){
  const box = document.getElementById("planPersonTabs");
  const note = document.getElementById("planPersonNote");
  if(!box) return;
  const people = Store.get("peopleSchedules") || {};
  const names = Object.keys(people).filter(n=> (people[n]||[]).length > 0);
  // If the previously-active friend has since disappeared from
  // peopleSchedules (nothing saved, or never actually synced), fall
  // back to your own tab rather than pointing at a button that's about
  // to stop existing.
  if(planActiveOwner !== "mine" && !names.includes(planActiveOwner)) planActiveOwner = "mine";

  // Your own tab is always shown, even with zero friends synced in yet —
  // labelled with your own picked name (matching what a friend would see
  // for you on their device) once you've set one, "Mine" until then.
  const myName = (Store.get("contributorName") || "").trim();
  const myLabel = myName ? `⭐ ${myName}` : "⭐ Mine";

  box.style.display = "";
  box.className = "tabstrip";
  box.innerHTML = `<button class="${planActiveOwner==="mine"?"active":""}" data-owner="mine">${escapeHtml(myLabel)}</button>` +
    names.map(n=>`<button class="person ${planActiveOwner===n?"active":""}" data-owner="${escapeHtml(n)}">${escapeHtml(n)}</button>`).join("");
  box.querySelectorAll("button").forEach(btn=>{
    btn.onclick = ()=>{
      planActiveOwner = btn.dataset.owner;
      renderPlanPersonTabs();
      renderSchedule();
      if(planView === "timeline") renderPlanTimeline();
    };
  });
  if(note){
    note.style.display = "";
    if(names.length === 0){
      note.textContent = "Nobody's synced in yet — a teammate's picks will show up as their own tab here (and in Compare below) once they have. Pick your name in Discover if you haven't already, and it syncs automatically whenever you've both got signal; no signal, there's a manual backup code there too.";
    } else {
      note.textContent = planActiveOwner === "mine"
        ? "Viewing your own saved artists. Switch tabs above to look at a synced teammate's — it's read-only and never merges into yours. See everyone at once in the Compare view below."
        : `Viewing ${planActiveOwner}'s saved artists from their last sync — read-only, and it hasn't changed or added anything to your own list.`;
    }
  }
}

function renderSchedule(){
  const fullSchedule = activeScheduleData();
  const readonly = planActiveOwner !== "mine";

  if(fullSchedule.length === 0){
    scheduleList.innerHTML = `<div class="card"><p class="empty-note">${readonly ? `${escapeHtml(planActiveOwner)} hasn't saved any artists yet.` : "No saved artists yet. Add some from the Lineup tab."}</p></div>`;
    return;
  }

  const mustSeeNamesSet = new Set(fullSchedule.filter(a=>a.mustSee).map(a=>a.name));
  // Keep each entry's ORIGINAL index into the full (unfiltered) schedule
  // even when the must-sees-only filter is on — remove/set-time/star
  // wiring below reads .dataset.idx straight into Store.get("schedule"),
  // so a filtered-array position would point at the wrong artist.
  const shown = fullSchedule.map((a,i)=>({a,i})).filter(({a})=> !planMustSeeFilter || a.mustSee);

  if(shown.length === 0){
    scheduleList.innerHTML = `<div class="card"><p class="empty-note">No must-sees yet — hold a star to upgrade one.</p></div>`;
    return;
  }

  if(planView === "list"){
    scheduleList.innerHTML = shown.map(({a,i})=> scheduleItemHTML(a,i,null,readonly,mustSeeNamesSet)).join("");
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
      items.forEach(({a,i})=> html += scheduleItemHTML(a,i,clashMap[i],readonly,mustSeeNamesSet));
    });
    scheduleList.innerHTML = html;
  }

  if(!readonly){
    scheduleList.querySelectorAll(".item").forEach(itemEl=>{
      const idx = Number(itemEl.dataset.idx);
      const artist = Store.get("schedule")[idx];

      itemEl.querySelector(".remove-btn").onclick = ()=>{
        let sched = Store.get("schedule");
        sched.splice(idx,1);
        Store.set("schedule", sched);
        renderSchedule();
        showArtists(currentFilteredArtists());
        updateNextEvent();
      };

      const mustSeeBtn = itemEl.querySelector(".mustsee-toggle-btn");
      if(mustSeeBtn) mustSeeBtn.onclick = ()=> setMustSee(artist, !isMustSee(artist.name));

      itemEl.querySelector(".set-time-btn").onclick = ()=>{
        openTimeEditor(itemEl.querySelector(".edit-slot"), artist, (day,start,end)=>{
          let sched = Store.get("schedule");
          sched[idx] = { ...sched[idx], day, start, end };
          Store.set("schedule", sched);
          renderSchedule();
          updateNextEvent();
        });
      };
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
  const listEls = [scheduleList, document.getElementById("nowNextBanner")];
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
  ["viewListBtn","viewClashBtn","viewTimelineBtn","viewCompareBtn"].forEach(id=>{
    const btn = document.getElementById(id);
    if(btn) btn.classList.remove("active");
  });
  const activeBtnId = view==="list" ? "viewListBtn" : view==="clash" ? "viewClashBtn" : view==="timeline" ? "viewTimelineBtn" : "viewCompareBtn";
  const activeBtn = document.getElementById(activeBtnId);
  if(activeBtn) activeBtn.classList.add("active");

  const listEls = [scheduleList, document.getElementById("nowNextBanner")];
  const timelineEl = document.getElementById("planTimelineView");
  const compareEl = document.getElementById("planCompareView");
  const clashTimelineEl = document.getElementById("clashTimelineView");
  const clashExtras = document.getElementById("clashExtras");
  const mustSeeFilterToggle = document.getElementById("mustSeeFilterToggle");
  if(clashExtras) clashExtras.style.display = view==="clash" ? "" : "none";
  if(mustSeeFilterToggle) mustSeeFilterToggle.style.display = view==="compare" ? "none" : "";
  if(timelineEl) timelineEl.style.display = view==="timeline" ? "" : "none";
  if(compareEl) compareEl.style.display = view==="compare" ? "" : "none";
  if(clashTimelineEl && view!=="clash") clashTimelineEl.style.display = "none";
  listEls.forEach(el=> el && (el.style.display = (view==="list"||(view==="clash"&&clashSubView==="list")) ? "" : "none"));

  if(view === "timeline"){
    renderPlanTimelineDayTabs();
    renderPlanTimeline();
  } else if(view === "compare"){
    renderCompareFilterChips();
    renderPlanCompare();
  } else if(view === "clash"){
    updateClashSubViewVisibility();
  } else {
    renderSchedule();
  }
}

document.getElementById("viewListBtn").onclick = ()=> setPlanView("list");
document.getElementById("viewClashBtn").onclick = ()=> setPlanView("clash");
document.getElementById("viewTimelineBtn").onclick = ()=> setPlanView("timeline");
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
let compareOnlyShared = false;

function comparePeopleList(){
  const people = [{ key:"mine", label:"You", list: Store.get("schedule") }];
  const peopleSchedules = Store.get("peopleSchedules") || {};
  Object.keys(peopleSchedules).forEach(n=>{
    if((peopleSchedules[n]||[]).length) people.push({ key:n, label:n, list:peopleSchedules[n] });
  });
  return people;
}

function renderCompareFilterChips(){
  const box = document.getElementById("compareFilterChips");
  if(!box) return;
  const people = comparePeopleList();
  if(people.length < 2){ box.innerHTML = ""; return; }
  box.innerHTML = `<span class="chip ${!compareOnlyShared?"active":""}" data-mode="all">Everyone's picks</span><span class="chip ${compareOnlyShared?"active":""}" data-mode="shared">Only shared (2+)</span>`;
  box.querySelectorAll(".chip").forEach(c=>{
    c.onclick = ()=>{
      compareOnlyShared = c.dataset.mode === "shared";
      renderCompareFilterChips();
      renderPlanCompare();
    };
  });
}

function renderPlanCompare(){
  const box = document.getElementById("planCompareList");
  if(!box) return;
  const people = comparePeopleList();

  if(people.length < 2){
    box.innerHTML = `<div class="card"><p class="empty-note">Sync with a friend first to compare plans — pick your name in Discover and it syncs automatically whenever you've both got signal (no signal, there's a manual backup code there too). Once they've synced, their picks show up here alongside yours.</p></div>`;
    return;
  }

  const rows = new Map();
  people.forEach(p=>{
    p.list.forEach(a=>{
      if(!rows.has(a.name)) rows.set(a.name, { artist:a, people:new Set() });
      rows.get(a.name).people.add(p.key);
    });
  });

  let entries = [...rows.values()];
  if(compareOnlyShared) entries = entries.filter(e=> e.people.size >= 2);

  if(entries.length === 0){
    box.innerHTML = `<div class="card"><p class="empty-note">${compareOnlyShared ? "Nothing picked by two or more of you yet." : "Nobody's saved anything yet."}</p></div>`;
    return;
  }

  entries.sort((x,y)=>{
    const dx = DAY_ORDER.indexOf(x.artist.day), dy = DAY_ORDER.indexOf(y.artist.day);
    const rd = (dx===-1?99:dx) - (dy===-1?99:dy);
    if(rd) return rd;
    return (toMinutes(x.artist.day, x.artist.start) ?? 999999) - (toMinutes(y.artist.day, y.artist.start) ?? 999999);
  });

  const byDay = {};
  entries.forEach(e=>{
    const key = e.artist.day && e.artist.day !== "TBC" ? e.artist.day : "No time set";
    (byDay[key] = byDay[key] || []).push(e);
  });

  const order = [...DAY_ORDER, "No time set"];
  let html = "";
  order.forEach(day=>{
    if(!byDay[day]) return;
    html += `<div class="daygroup">${day}</div>`;
    byDay[day].forEach(e=>{
      const peopleChips = people.map(p=>
        `<span class="compare-person${e.people.has(p.key) ? " in" : ""}">${escapeHtml(p.label)}</span>`
      ).join("");
      html += `
        <div class="item">
          <div class="item-top">
            <div>
              <strong>${escapeHtml(e.artist.name)}</strong><br>
              <span class="stage-link" data-stage="${escapeHtml(e.artist.stage)}">${escapeHtml(e.artist.stage)}</span><br>
              <span class="time-label">${timeLabel(e.artist)}</span>
            </div>
          </div>
          <div class="compare-people">${peopleChips}</div>
        </div>`;
    });
  });
  box.innerHTML = html;
  wireStageLinks(box);
}

// ===============================
// SAVED-ARTIST TIMELINE (Plan) — same scrollable stage/time grid as the
// Artists screen's Timeline view, but scoped to whichever person's tab
// (mine or a synced teammate's) is currently selected above.
// ===============================
let planTimelineDay = "Wed";

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
  const readonly = planActiveOwner !== "mine";
  const schedule = activeScheduleData();
  const dayItems = schedule.filter(a=> a.day === planTimelineDay && a.start && (!planMustSeeFilter || a.mustSee));
  const savedNames = new Set(dayItems.map(a=>a.name));
  const mustSeeNames = new Set(dayItems.filter(a=>a.mustSee).map(a=>a.name));
  const { html } = buildTimelineHTML(dayItems, { readonly, savedNames, mustSeeNames });
  grid.innerHTML = dayItems.length ? html : `<p class="empty-note" style="padding:16px;">${planMustSeeFilter ? `No must-sees with a set time saved for ${planTimelineDay} yet.` : `Nothing with a set time saved for ${planTimelineDay} yet.`}</p>`;

  const hint = document.getElementById("planTimelineHint");
  if(hint) hint.textContent = readonly
    ? "Scroll sideways for time, down for stage. Tap a block to see details."
    : "Scroll sideways for time, down for stage. Tap a block to see details or unsave it.";

  grid.querySelectorAll(".timeline-block").forEach(b=>{
    b.onclick = ()=>{
      const name = b.dataset.name, day = b.dataset.day;
      const artist = schedule.find(a=>a.name===name && a.day===day);
      if(artist) showTimelineDetailModal(artist, { readonly, onSaveToggle: renderPlanTimeline });
    };
  });
  wireStageLinks(grid);
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
  const readonly = planActiveOwner !== "mine";
  const fullSchedule = activeScheduleData();
  const clashMap = findClashes(fullSchedule);
  const clashingIdx = new Set(Object.keys(clashMap).map(Number));
  const dayItems = fullSchedule
    .map((a,i)=>({a,i}))
    .filter(({a,i})=> clashingIdx.has(i) && a.day === clashTimelineDay && a.start && (!planMustSeeFilter || a.mustSee))
    .map(({a})=>a);
  const savedNames = new Set(dayItems.map(a=>a.name));
  const mustSeeNames = new Set(dayItems.filter(a=>a.mustSee).map(a=>a.name));
  const { html } = buildTimelineHTML(dayItems, { readonly, savedNames, mustSeeNames });
  grid.innerHTML = dayItems.length ? html : `<p class="empty-note" style="padding:16px;">No clashes on ${clashTimelineDay}${planMustSeeFilter ? " among your must-sees" : ""}.</p>`;

  grid.querySelectorAll(".timeline-block").forEach(b=>{
    b.classList.add("clashing");
    b.onclick = ()=>{
      const name = b.dataset.name, day = b.dataset.day;
      const artist = fullSchedule.find(a=>a.name===name && a.day===day);
      if(artist) showTimelineDetailModal(artist, { readonly, onSaveToggle: ()=>{ renderClashTimeline(); } });
    };
  });
  wireStageLinks(grid);
}

// ===============================
// DASHBOARD NEXT EVENT
// ===============================
function updateNextEvent(){
  const target = document.getElementById("next-event");
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
  document.querySelector('.tab[data-tab="artists"]').click();
  if(artistsView !== "list" && artistsViewListBtn) artistsViewListBtn.click();
  artistSearch.value = "";
  clearGenreChips();
  updateGenreChipHighlights();
  updateClearArtistSearchBtn();
  showArtists(allArtists());
  artistSearch.placeholder = `Browsing all ${allArtists().length} artists — use a genre chip or search to narrow it down`;
  window.scrollTo(0, 0);
}
document.getElementById("browseAllArtistsBtn").onclick = browseAllArtists;
const artistsBrowseAllBtn = document.getElementById("artistsBrowseAllBtn");
if(artistsBrowseAllBtn) artistsBrowseAllBtn.onclick = browseAllArtists;

renderPlanPersonTabs();
renderSchedule();
updateNextEvent();

// ===============================
// SCHEMATIC MAP — real districts & key stages, approximate layout
// ===============================
const locations = [
  { name:"Area 404", kind:"district", x:"20%", y:"28%", info:"Downtown. Once the district for outsiders and squatters, 404 now runs Boomtown after winning last year's election, policed by Chief Guardian Mr Biga's own Guardians — whose boot camp, 'official fines' and work-permit machinery are worth questioning if you find them." },
  { name:"Botanica", kind:"district", x:"38%", y:"20%", info:"Downtown. A plant-covered temple district. Its leader, the Great Mother, is plotting an ascension ritual after her election defeat, centred on the transformed Temple of Zero — home to The Network and its sentient mycelium AI, IONA." },
  { name:"Thrutopia", kind:"district", x:"56%", y:"16%", info:"Hilltop. New for Chapter Five — a calmer corner for talks, workshops, breathwork and saunas on hopeful futures, developed with input from author Manda Scott. Home to The Retreat's spa/sauna woodlands." },
  { name:"Copperwood", kind:"district", x:"74%", y:"26%", info:"A 1925-set, roaring-twenties film district and the heart of Boomtown's in-universe movie industry, run by self-appointed Creative Director Edna Von Vanderhaus, currently shooting 'Race to the Red Planet'." },
  { name:"Oldtown", kind:"district", x:"80%", y:"52%", info:"Hilltop. The festival's founding district, rebuilt uphill after Area 404's expansion. Rufus the Red and the Den of Dis Order are now declaring the separatist 'People's Republic of Oldtownia'." },
  { name:"Letsbe Avenue", kind:"district", x:"60%", y:"66%", info:"The everyday high-street district, currently swept up in Patrick Kahn's new consumer product BLIP (Boomtown Lifestyle Important Product) — exclusive to status-holders called VIPPs." },
  { name:"Metropolis", kind:"district", x:"34%", y:"68%", info:"A hyper-digital district run by Aurora Venturestone's Bettercorp™ media machine, where laid-off 'inGeniuses' now run risky, unofficial tours into a glitching Betterverse™." },
  { name:"Grand Central", kind:"stage", x:"66%", y:"30%", info:"Hilltop, alongside Thrutopia, Anara Forest and Oldtown. Boomtown's original main stage, relocated for Chapter Five's redesign — bands, hip hop and headline sets across the weekend." },
  { name:"The Lion's Den", kind:"stage", x:"46%", y:"44%", info:"Its own third area — the Temple Valley amphitheatre — separate from both Downtown and Hilltop, as foretold by the Lion's Gate Portal at the last closing ceremony. Drum & bass, reggae and headline sets." },
  { name:"Hydro XL", kind:"stage", x:"28%", y:"34%", info:"Downtown, alongside Area 404 and Botanica. New hydrogen-powered flagship stage for Chapter Five — one of the UK's first hydrogen-powered festival stages, built around house, techno and dance music." },
  { name:"Anara Forest", kind:"stage", x:"72%", y:"44%", info:"Hilltop edge. Formerly Psyforest, reborn as Anara Forest in 2025 — a 360° sound-and-visual stage where the story has runaways from Area 404 taking refuge. Bass-driven: jungle, reggae, bassline, UK garage, DnB and grime, with a beach-vibe sand floor." },
  { name:"Hidden Woods", kind:"stage", x:"24%", y:"78%", info:"One of two woodland stages tucked among the trees, with its own beach bar and treetop walks. Leans eclectic bass and reggae/dub, often billing bigger DnB names alongside newer acts — explore carefully after dark." },
  { name:"NEXUS", kind:"stage", x:"42%", y:"26%", info:"Right in Botanica — its main stage, 'where nature connects', celebrating live music and the freshest names on the scene. The hip-hop, grime and garage side has previously pulled in names like Bashy, MJ Cole and Lady Leshurr." },
  { name:"Helix", kind:"stage", x:"40%", y:"64%", info:"Alongside Metropolis. Breaks, big beat and bass-heavy line-up." },
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
  { name:"Tangled Roots", status:"rumoured", info:"A laid-back dub and roots stage with its own cocktail bar — a good slow-down spot between bigger sets. No 2026-specific confirmation found; recent evidence ties it to Chapter Four (2025) and earlier." },
  { name:"Full Moon Ballroom", status:"rumoured", info:"A ballroom-themed stage — expect a mixed, dressed-up crowd and a more theatrical vibe than the bass-heavy stages. No 2026 confirmation found at all." },
  { name:"Rose and Clown", status:"confirmed", info:"One of the site's smaller character-led stages — treat the name as the clue and expect an eclectic, party-focused bill." },
  { name:"The Fools Leap", status:"rumoured", info:"A smaller stage leaning into Boomtown's playful, circus-adjacent side — good for stumbling on something odd and fun. No 2026-specific confirmation found." },
  { name:"Foggers Mill", status:"rumoured", info:"An industrial/mill-themed stage — exact genre policy varies by year, so follow the crowd and the smoke machines. No 2026 confirmation found." },
  { name:"Hangar 161", status:"confirmed", info:"Punk's home at Boomtown — a proudly loud, socialist, anti-racist stage with a mosh-pit crowd." },
  { name:"Tribe of Frog", status:"confirmed", info:"Hosted by the long-running UK psytrance party brand of the same name — expect psytrance, full-on and progressive sets deep into the night, confirmed with a full 2026 lineup running Thu-Sun." },
  { name:"Síbín Beag", status:"confirmed", info:"Irish for 'little shebeen' — a folk and traditional-music stage blending trad sessions with folk-tinged party sets, confirmed with a full 2026 lineup." },
  { name:"Acid Leak", status:"confirmed", info:"Area 404's acid techno and hard techno stage — expect a darker, sweatier crowd and relentless 4/4." },
  { name:"Infinity", status:"rumoured", info:"One of Chapter Five's smaller stages — no 2026-specific confirmation found for this name at all; treat it as a wildcard." }
];

const minorStagePositions = [[40,42],[14,50],[58,30],[44,52],[30,58],[62,52],[12,36],[72,66],[40,76],[78,40],[56,80]];
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
  { name:"The Boomtown Bobbies", near:"Area 404", x:"12%", y:"36%", info:"A mock police station hidden venue playing on Area 404's Guardians — expect in-character 'officers', a booking-desk bar and a wink at the district's own policing storyline." },
  { name:"The Luck Exchange", near:"Area 404", x:"14%", y:"70%", info:"A casino-themed hidden venue in Area 404's territory — cards, chips and a party underneath the gambling dressing." },
  { name:"Botanica Zoo", near:"Botanica", x:"30%", y:"14%", info:"A character-led 'zoo' micro-venue inside Botanica — the theme is the clue, so follow the animal keepers and see where they lead." },
  { name:"The Garden Centre", near:"Botanica", x:"44%", y:"14%", info:"A garden-centre-fronted hidden venue fitting Botanica's plant-temple theme — good spot to ask locals about the Great Mother's ritual plans." },
  { name:"Hotel Paradiso", near:"Copperwood", x:"84%", y:"20%", info:"A faded-glamour hotel-themed micro venue — sits well with Copperwood's 1925 film-world setting; check in at the 'front desk'." },
  { name:"Reel News", near:"Copperwood", x:"86%", y:"36%", info:"A newsreel/cinema-themed hidden spot tying into Von Vanderhaus's film empire — expect projected clips and in-character 'reporters'." },
  { name:"Mining for (g)Old Town", near:"Oldtown", x:"84%", y:"66%", info:"An Oldtown hidden venue playing on the district's rebuild uphill and its separatist storyline — look for a mining/prospecting theme." },
  { name:"Cas's Costumes", near:"Oldtown", x:"70%", y:"84%", info:"A costume-shop-fronted micro venue fitting Oldtown's circus and rogues theme — worth a look if you want to dress into the story." },
  { name:"Soapranos Laundrette", near:"Letsbe Avenue", x:"54%", y:"90%", info:"A laundrette-fronted hidden venue — in 2025 it hosted dance-music DJ sets behind the washing machines. Look for the set dressing, not a normal stage entrance." },
  { name:"E Numbers", near:"Letsbe Avenue", x:"62%", y:"78%", info:"A sweet-shop/E-numbers-themed party spot fitting Letsbe Avenue's consumer-product BLIP storyline — small, high-energy, easy to walk past." },
  { name:"Gabber Kebabber", near:"Letsbe Avenue", x:"46%", y:"84%", info:"Kebab-shop chaos paired with gabber and hardcore — a tiny, loud find rather than a destination with a published pin." },
  { name:"Sub Lab", near:"Metropolis", x:"16%", y:"84%", info:"A laboratory-themed bass venue fitting Metropolis's tech aesthetic — expect a heavier, sub-driven sound than the district's main stage." },
  { name:"Deviant Lounge", near:"Metropolis", x:"22%", y:"90%", info:"A late-night lounge venue with an eclectic, after-hours bill — good for when the bigger stages start winding down." },
  { name:"Pomegranate Parlour", near:"Site-wide", x:"86%", y:"20%", info:"A parlour-style oddity with eclectic party DJs — a good stop wherever a district venue is doing something theatrical rather than a straight dancefloor." },
  { name:"Twisted Time Machine (Bad Apple Bar)", near:"Site-wide", x:"56%", y:"30%", info:"A themed bar/party room; 2025 listings ranged from emo and nu-metal to jungle disco and a 90s rave cave — expect a different fancy-dress theme by time slot." }
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
  { name:"The Retreat", x:"60%", y:"12%", info:"Boomtown's paid spa space in the Thrutopia woodlands — spa/hot-tub sessions, sauna and cold splash, sound baths and massages. Book ahead; it's separate from your festival ticket." },
  { name:"The Observatory", x:"52%", y:"14%", info:"New for 2026 — a genuine academic research hub embedded in the festival, led by psychologist Dr Martha Newson with researchers from 10+ UK universities studying identity, belonging and collective behaviour at live events. Take part in a study or the before/after survey if you're curious." },
  { name:"Lion's Gate Portal", x:"26%", y:"44%", info:"The story's central portal art piece near the Lion's Den — last chapter's closing ceremony used it to foretell the Lion's Den's return to Temple Valley this year." },
  { name:"Medical Centre — Hilltop", x:"72%", y:"50%", info:"One of two confirmed 24-hour medical centres for Chapter Five (the other is at Pepperpot Market).", hours:"24 hours." },
  { name:"Public Transport Hub", x:"6%", y:"42%", info:"Near West Gate — coach, shuttle and accessible-transport drop-off/pick-up point." },
  { name:"Lockers — Hidden Woods", x:"28%", y:"80%", info:"One of the confirmed 2026 locker locations, alongside Thrutopia, the Lion's Den/Orchid area and Downtown Village." },
  { name:"Lockers — Thrutopia", x:"58%", y:"10%", info:"Locker point in the Thrutopia woodlands." },
  { name:"Amnesty Points — West Gate", x:"5%", y:"50%", info:"Dispose of anything prohibited before you're searched, no questions asked — every gate has one." },
  { name:"Charge Candy — Pepperpot Market", x:"50%", y:"52%", info:"One of six confirmed phone-charging points dotted across the site." }
];

// Named camping fields & gates, positioned from a real (previous-year)
// site map you shared — general site geography like this tends to carry
// over year to year even when the in-city venues get redesigned.
const campLabels = [
  { x:"14%", y:"7%", text:"West Camping" },
  { x:"5%", y:"35%", text:"Downtown Camping" },
  { x:"7%", y:"58%", text:"Meadow Camping (Accessible)" },
  { x:"48%", y:"4%", text:"Valley Camping" },
  { x:"70%", y:"6%", text:"Tangerine Fields" },
  { x:"86%", y:"14%", text:"Campervan Field" },
  { x:"85%", y:"32%", text:"Temple Valley Camping" },
  { x:"91%", y:"48%", text:"East Camping" },
  { x:"95%", y:"64%", text:"Quiet Camping" },
  { x:"9%", y:"39%", text:"Camp Orchid Downtown (premium, public transport)" },
  { x:"75%", y:"22%", text:"Camp Skylark Hilltop (premium)" },
  { x:"74%", y:"87%", text:"Camp Skylark Sunset (premium)" }
];

const gates = [
  { name:"West Gate", x:"3%", y:"46%", info:"Main entrance — shuttle buses, taxi rank and coach drop-off land here. Nearest to West, Downtown and Meadow (accessible) camping, plus the Public Transport Hub and the premium Camp Orchid Downtown pitches (built for coach/shuttle arrivals — closest gate access is here, not South Gate).", hours:"Wed 14:00–21:30, Thu–Sun 10:00–21:30. No re-entry after 21:30." },
  { name:"East Gate", x:"96%", y:"32%", info:"Nearest the White Carparks, motorcycle and cycle parking, and Campervan Field.", hours:"Wed 14:00–21:30, Thu–Sun 10:00–21:30. No re-entry after 21:30." },
  { name:"South Gate", x:"78%", y:"93%", info:"Nearest White Carpark 4 and Camp Skylark Sunset (one of two Camp Skylark premium sites for 2026 — the other, Camp Skylark Hilltop, sits up on Hilltop instead).", hours:"Wed 14:00–21:30, Thu–Sun 10:00–21:30. No re-entry after 21:30." }
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
  { name:"Tangled Roots", type:"Main stage", status:"rumoured", music:true, genre:"Dub, roots", near:"Unclear", info:"Laid-back stage with its own cocktail bar; no 2026 confirmation found — recent hits tie it to Chapter Four (2025) and earlier, not Chapter Five." },
  { name:"Full Moon Ballroom", type:"Main stage", status:"rumoured", music:true, genre:"Ballroom, eclectic", near:"Unclear", info:"A dressed-up, theatrical crowd rather than a straight dancefloor; no 2026 confirmation found at all — treat as unconfirmed for Chapter Five." },
  { name:"Rose and Clown", type:"Main stage", status:"confirmed", music:true, genre:"Eclectic, party", near:"Unclear", info:"Smaller character-led stage run by Gorilla Tactics — a 2026 lineup-drop post and Boomtown 2026 set-time listings confirm its Chapter Five return." },
  { name:"The Fools Leap", type:"Main stage", status:"rumoured", music:true, genre:"Playful, circus-adjacent", near:"Oldtown", info:"Good for stumbling on something odd and fun; no 2026-specific confirmation found — recent mentions trace to earlier chapters, not yet reconfirmed for Chapter Five." },
  { name:"Foggers Mill", type:"Main stage", status:"rumoured", music:true, genre:"Industrial-themed, genre varies", near:"Unclear", info:"Follow the crowd and the smoke machines; no 2026 confirmation found — was part of past chapters, not yet reconfirmed for Chapter Five." },
  { name:"Hangar 161", type:"Main stage", status:"confirmed", music:true, genre:"Punk", near:"Unclear", info:"Last Gang's proudly loud, socialist, anti-racist stage with a mosh-pit crowd — its own account posted 'BOOMTOWN 2026! Hangar 161, see you there' confirming its Chapter Five return." },
  { name:"Tribe of Frog", type:"Main stage", status:"confirmed", music:true, genre:"Psytrance, full-on, progressive", near:"Unclear", info:"Hosted by the long-running UK psytrance party brand of the same name — confirmed with a full 2026 lineup running Thursday through Sunday." },
  { name:"Síbín Beag", type:"Main stage", status:"confirmed", music:true, genre:"Folk, traditional", near:"Unclear", info:"Irish for 'little shebeen' — trad sessions and folk-tinged party sets, confirmed with a full 2026 Boomtown lineup; also runs as its own venue at Shambala." },
  { name:"Acid Leak", type:"Main stage", status:"confirmed", music:true, genre:"Acid techno, hard techno", near:"Area 404", info:"Area 404's darker, sweatier 4/4 stage." },
  { name:"Infinity", type:"Main stage", status:"rumoured", music:"unclear", genre:"Genre policy unconfirmed", near:"Unclear", info:"One of Chapter Five's smaller stages — treat as a wildcard; no 2026-specific confirmation found for this name at all." },
  { name:"The Observatory", type:"Research hub", status:"confirmed", music:false, genre:"—", near:"Thrutopia (likely)", info:"Genuine 2026 academic study led by Dr Martha Newson, 10+ UK universities — real research, not story canon." },
  { name:"The Boomtown Bobbies", type:"Hidden venue", status:"confirmed", music:true, genre:"DJs, live takeovers", near:"Area 404 / Oldtown", info:"Long-running mock police station tied to the storyline's rising Area 404 crackdown — confirmed for 2026 with a full Thu-Sun DJ programme." },
  { name:"Soapranos Laundrette", type:"Hidden venue", status:"confirmed", music:true, genre:"Dance/house DJs", near:"Letsbe Avenue", info:"Laundrette-fronted micro venue on Letsbe Avenue's high street — confirmed for 2026 with a full Thu–Sun DJ programme including Laundry Night Live and Soapranos: Hotwash!" },
  { name:"Hotel Paradiso", type:"Hidden venue", status:"confirmed", music:true, genre:"Eclectic, lounge", near:"Copperwood", info:"Faded-glamour hotel-themed micro venue in Copperwood — confirmed returning for 2026 ('Hotel on Wheels') with a full Thu–Sat lounge/DJ programme; check in at the 'front desk'." },
  { name:"Luck Exchange Casino", type:"Hidden venue", status:"rumoured", music:true, genre:"Party, eclectic", near:"Area 404", info:"Casino-themed venue promoted by Boomtown's own account in past chapters; no 2026 confirmation found." },
  { name:"The Garden Centre", type:"Shop / hidden venue", status:"rumoured", music:true, genre:"Chill, eclectic", near:"Botanica", info:"Garden-centre-fronted spot fitting Botanica's plant-temple theme; found live at Boomtown 2025 but no 2026 confirmation found yet." },
  { name:"Botanica Zoo", type:"Hidden venue", status:"confirmed", music:true, genre:"Jungle, hardcore, breaks, UK garage, bass", near:"Botanica", info:"Feral, animal-led 'anarcho-squat zoo' venue — 2026 event listings (Killa P, DJ Hybrid, 14 Aug) and its own 'just over 2 weeks til Boomtown' July 2026 post confirm it's back for Chapter Five." },
  { name:"The Immortal Children of the Eternal Seed", type:"Hidden venue", status:"rumoured", music:true, genre:"Ritual, ambient/eclectic", near:"Botanica", info:"Botanica-flavoured cult/ritual-themed micro venue — only evidence found dates to a 2023 Boomtown post, no 2026 confirmation found." },
  { name:"Topsy Turvy Trims", type:"Shop / hidden venue", status:"confirmed", music:true, genre:"Barbershop novelty, party", near:"Oldtown", info:"Barbershop/salon-themed spot — fits Oldtown's topsy-turvy rebuild." },
  { name:"PFP Robot", type:"Hidden venue", status:"rumoured", music:true, genre:"Electro, makina, trance, acid, techno", near:"Area 404", info:"PFP's robotic soundsystem — a real, long-running fixture of Area 404 (documented 2022 through 2024) but no 2026 confirmation found yet." },
  { name:"Sub Lab", type:"Hidden venue", status:"rumoured", music:true, genre:"Bass, dubstep", near:"Metropolis", info:"Laboratory-themed bass venue — documented at Boomtown 2025 but no 2026 confirmation found." },
  { name:"Nachtlicker", type:"Hidden venue", status:"rumoured", music:true, genre:"Punk theatre, hard house, techno, speed garage, DnB", near:"Area 404", info:"Curated nocturnal-rave/punk-theatre night in Area 404 in 2024 and 2025 — no 2026 confirmation found yet." },
  { name:"Deviant Lounge", type:"Hidden venue", status:"rumoured", music:true, genre:"Eclectic, after-hours", near:"Metropolis (likely)", info:"No evidence found tying this name to Boomtown at all in current searches (past or present) — treat as unverified until seen on site." },
  { name:"Gabber Kebabber", type:"Shop / hidden venue", status:"confirmed", music:true, genre:"Gabber, hardcore", near:"Letsbe Avenue", info:"Dystopian kebab-shop gabber stage running since 2023 — confirmed for 2026 with a full Thu-Sun DJ programme." },
  { name:"E Numbers", type:"Shop / hidden venue", status:"rumoured", music:true, genre:"Hyperpop, party, eclectic", near:"Metropolis", info:"Hyperpop 'sweetshop' venue documented in Metropolis 2023 through 2025; no 2026 confirmation found yet." },
  { name:"The Pomegranate Parlour", type:"Hidden venue", status:"rumoured", music:true, genre:"Eclectic party DJs", near:"Site-wide", info:"Actor-led parlour-style venue documented in 2023 and 2024; no 2026 confirmation found yet." },
  { name:"Busker's Wharf", type:"Hidden venue", status:"confirmed", music:true, genre:"Live/acoustic, folk", near:"Site-wide", info:"Wharf/street-performance themed spot — a real, recurring hidden venue, though no year-dated source was found to pin down a specific chapter." },
  { name:"Twisted Time Machine (Bad Apple Bar)", type:"Hidden venue", status:"rumoured", music:true, genre:"Rotates by slot: emo, nu-metal, jungle disco, 90s rave", near:"Site-wide", info:"Long-running takeover of Boomtown's historic Bad Apple Bar (documented Chapter 10, Chapter 11, and 2024) — no 2026 confirmation found yet." },
  { name:"Circus Tent", type:"Hidden venue", status:"confirmed", music:true, genre:"Circus, live performance", near:"Oldtown (likely)", info:"Performance-led rather than a straight dancefloor." },
  { name:"Airetiko", type:"Hidden venue", status:"rumoured", music:true, genre:"Aerial circus — trapeze, rope, silks, hoop", near:"Site-wide", info:"Real aerial-arts collective (trapeze, rope, silks, hoop) that runs its own area 'every year' at Boomtown, Glastonbury and WOMAD — not a techno room as previously listed; no explicit 2026 confirmation found, so left as rumoured pending one." },
  { name:"Rebel Girls Club", type:"Hidden venue", status:"rumoured", music:true, genre:"Party, empowerment-themed", near:"Downtown Village", info:"Women-led venue documented at Downtown Village in 2022; no 2026 confirmation found." },
  { name:"Mining for (g)Old Town", type:"Hidden venue", status:"confirmed", music:true, genre:"Eclectic, party", near:"Oldtown", info:"Mining/prospecting theme playing on Oldtown's rebuild-uphill storyline." },
  { name:"XR", type:"Installation / talks", status:"rumoured", music:false, genre:"Climate activism, talks", near:"Thrutopia", info:"Extinction Rebellion-linked space from past chapters; Thrutopia itself is confirmed newly redesigned for Chapter Five (formerly The Rookery) but this specific installation wasn't found reconfirmed under the new area." },
  { name:"End of the Line", type:"Hidden venue", status:"rumoured", music:true, genre:"Atmospheric, genre unclear", near:"Unclear", info:"Train-station-themed venue documented at Boomtown 2024 and 2025 — no 2026 confirmation found yet." },
  { name:"Cas's Costumes", type:"Shop / hidden venue", status:"confirmed", music:true, genre:"Dress-up, party", near:"Oldtown", info:"Costume-shop-fronted micro venue fitting Oldtown's circus theme." },
  { name:"Garden", type:"Chill space", status:"confirmed", music:false, genre:"—", near:"Botanica (likely)", info:"Planting/chill space, likely Botanica or Thrutopia-adjacent." },
  { name:"Craft Tent", type:"Workshop / shop", status:"rumoured", music:false, genre:"—", near:"Thrutopia", info:"Craft-making workshops and stalls from past chapters; Thrutopia is confirmed newly redesigned for Chapter Five (formerly The Rookery), and 2026 coverage confirms craft workshops there generally, but this specific named tent wasn't found reconfirmed." },
  { name:"Hapitat", type:"Installation", status:"rumoured", music:false, genre:"—", near:"Thrutopia", info:"Wellbeing/habitat-themed space from past chapters; Thrutopia's 2026 redesign centres on The Retreat (confirmed) instead — this specific name wasn't found reconfirmed for Chapter Five." },
  { name:"The Retreat", type:"Chill space", status:"confirmed", music:false, genre:"—", near:"Thrutopia (woodland)", info:"New wellness sanctuary for Chapter Five, with its own page on Boomtown's site — professional massage, holistic treatments, communal saunas, hot tubs, sound baths, breathwork and artisan workshops; book slots in advance as they fill fast." },
  { name:"Crafty Rascals", type:"Workshop / shop", status:"rumoured", music:false, genre:"—", near:"Thrutopia", info:"Family/kids craft activities from past chapters; no 2026 confirmation found under this name for the newly redesigned Thrutopia." },
  { name:"Spinney Hollow", type:"Hidden venue", status:"confirmed", music:true, genre:"Eclectic, woodland", near:"Woodland edge (Anara/Hidden Woods)", info:"Small grove venue tucked into wooded ground." },
  { name:"Tinker Station", type:"Workshop / shop", status:"rumoured", music:false, genre:"—", near:"Thrutopia", info:"Repair/maker space, pairs with the Reparium ethos, from past chapters — the Reparium itself is confirmed back for 2026, but this specific named space wasn't found reconfirmed." },
  { name:"Blink Mental Health", type:"Welfare / support", status:"confirmed", music:false, genre:"—", near:"Pepperpot Market / Thrutopia", info:"On-site mental health support — named alongside The Samaritans and Cocaine Anonymous as a 2026 welfare partner on Boomtown's own Chapter Five safety page." },
  { name:"Energy Garden", type:"Installation", status:"rumoured", music:false, genre:"—", near:"Thrutopia", info:"Sustainable-energy themed space from past chapters; no 2026 confirmation found for the newly redesigned Thrutopia." },
  { name:"Climate Live", type:"Talks / installation", status:"rumoured", music:false, genre:"—", near:"Thrutopia", info:"Climate talks and programming from past chapters; no 2026 confirmation found for the newly redesigned Thrutopia." },
  { name:"Reparium", type:"Workshop / shop", status:"confirmed", music:false, genre:"—", near:"Thrutopia (hilltop)", info:"Free volunteer repair hub — Boomtown's own 2026 coverage confirms it 'will return this year' in Pepperpot Market/on the Thrutopia hilltop to fix camping gear and kit." },
  { name:"Games Lounge", type:"Chill space", status:"confirmed", music:false, genre:"—", near:"Pepperpot Market", info:"Games and downtime area away from the stages." },
  { name:"Permaculture", type:"Talks / installation", status:"rumoured", music:false, genre:"—", near:"Thrutopia", info:"Growing and permaculture talks from past chapters; no 2026 confirmation found for the newly redesigned Thrutopia." },
  { name:"The Magic Teapot", type:"Shop / cafe", status:"confirmed", music:false, genre:"—", near:"Thrutopia", info:"Tea-themed chill spot and cafe." },
  { name:"Cocaine Anonymous", type:"Welfare / support", status:"confirmed", music:false, genre:"—", near:"Pepperpot Market / Thrutopia", info:"On-site 12-step support meeting — explicitly named as a 2026 welfare partner on Boomtown's own Chapter Five safety page." },
  { name:"Narcotics Anonymous", type:"Welfare / support", status:"rumoured", music:false, genre:"—", near:"Pepperpot Market", info:"On-site 12-step support meeting in past chapters; Boomtown's 2026 safety page names Blink Mental Health and Cocaine Anonymous as welfare partners but NA wasn't found listed for Chapter Five — likely still present, but not explicitly confirmed." },
  { name:"Ancient Futures", type:"Talks / installation", status:"rumoured", music:false, genre:"—", near:"Thrutopia", info:"Future-facing talks from past chapters; no 2026 confirmation found for the newly redesigned Thrutopia." },
  { name:"Reel News", type:"Hidden venue", status:"confirmed", music:true, genre:"Eclectic, spoken-word", near:"Copperwood", info:"Newsreel/cinema-themed spot tying into Copperwood's film-district story." },
  { name:"The Chair-o-Plane", type:"Leisure / ride", status:"confirmed", music:false, genre:"—", near:"Area 404 / Downtown", info:"A classic swing-carousel fairground ride, named in Boomtown's own 2026 essential guide near the Hide Out Downtown venue." },
  { name:"The Boomtown Bank", type:"Leisure / ride", status:"rumoured", music:false, genre:"Games, novelty", near:"Unclear", info:"A recurring past-chapter attraction offering fun-and-nonsense games rather than real banking; not explicitly reconfirmed for 2026 yet." },
  { name:"Retro Amusements Arcade", type:"Leisure / ride", status:"rumoured", music:false, genre:"—", near:"Unclear", info:"Past chapters have run a retro amusements arcade among the site's entertainment; not explicitly reconfirmed for 2026 yet." },
  { name:"Vintage Fairground (waltzers & rides)", type:"Leisure / ride", status:"rumoured", music:false, genre:"—", near:"Oldtown / Area 404 (typical)", info:"Past chapters have included a vintage fairground with waltzers and similar rides alongside the chair-o-plane; general presence expected but exact 2026 line-up of rides unconfirmed." },
  { name:"Little Pharma", type:"Hidden venue", status:"rumoured", music:true, genre:"Eclectic party DJs", near:"Unclear", info:"Seen in past chapters; no 2026 listing found — chase it but don't bank on it." },
  { name:"Postal Posse", type:"Hidden venue", status:"confirmed", music:true, genre:"Eclectic", near:"Botanica", info:"Character-led micro world tied to Botanica's postal-worker subplot — confirmed operating across all 2026 festival dates, programming DJs from noon to 2am daily around its giant post box and letter-writing stations." },
  { name:"Copper Feel Cabaret", type:"Hidden venue", status:"rumoured", music:true, genre:"Cabaret, live", near:"Copperwood (past chapters)", info:"Copperwood-adjacent name from past searches; not confirmed for 2026." },
  { name:"Cosmic Junkyard", type:"Hidden venue", status:"rumoured", music:true, genre:"Eclectic bass", near:"Unclear", info:"Turned up in past-chapter searches with no dedicated account; treat as unconfirmed." },
  { name:"Clik Clik", type:"Hidden venue", status:"rumoured", music:false, genre:"Photo-booth / party novelty", near:"Unclear", info:"Seen in past social mentions; no 2026 confirmation found." },
  { name:"Engine House", type:"Hidden venue", status:"rumoured", music:true, genre:"Industrial, eclectic", near:"Unclear", info:"Past-chapter name with no dedicated 2026 account found." },
  { name:"Job Centre", type:"Hidden venue", status:"confirmed", music:false, genre:"—", near:"Metropolis", info:"Reopens for 2026 as 'Jobcentre 2.0', after previously folding into the Betterverse™ storyline — this year's version adds aptitude tests, biometric data collection and new jobs to appraise your skillset." },
  { name:"Shamrock", type:"Hidden venue", status:"rumoured", music:true, genre:"Irish/folk, party", near:"Unclear", info:"Past-chapter name; no 2026 evidence found." },
  { name:"Indian Street Food", type:"Food & drink", status:"confirmed", music:false, genre:"—", near:"Site-wide", info:"One of the cuisines Boomtown has confirmed for 2026, plus a £6 meal deal at selected traders — you'll pass stalls like this rather than need to seek them out." },
  { name:"Caribbean Comfort Food", type:"Food & drink", status:"confirmed", music:false, genre:"—", near:"Site-wide", info:"Confirmed 2026 food category — an everyday-encounter stall, not a hidden find." },
  { name:"Burger-van Classics", type:"Food & drink", status:"confirmed", music:false, genre:"—", near:"Site-wide", info:"Confirmed 2026 food category, dotted around the bigger stages and camping fields." },
  { name:"Paelleria", type:"Food & drink", status:"rumoured", music:false, genre:"—", near:"Pepperpot Market (2025)", info:"A 2025 trader-list name (paella). Treat as an example of the kind of stall to expect, not a return guarantee for 2026." },
  { name:"Burger Shack", type:"Food & drink", status:"rumoured", music:false, genre:"—", near:"Site-wide (2025)", info:"A 2025 trader-list name; no 2026 confirmation." },
  { name:"Greek Gyros", type:"Food & drink", status:"rumoured", music:false, genre:"—", near:"Site-wide (2025)", info:"A 2025 trader-list name; no 2026 confirmation." }
];

// CLASH WALK ESTIMATOR — there's no verified precise map of Boomtown's
// real site distances, so rather than fabricate exact minute figures,
// this groups each venue's researched `near` text into one of the
// festival's named areas and gives a rough band (same area / neighbouring
// areas / different areas). Genuinely approximate — always allow extra
// time and double-check the official app/map on-site.
const VENUE_AREA_GROUPS = {
  "downtown": "Downtown", "downtown village": "Downtown", "area 404": "Downtown", "botanica": "Downtown",
  "hilltop": "Hilltop", "hilltop edge": "Hilltop", "oldtown": "Hilltop", "thrutopia": "Hilltop",
  "woodland edge": "Hilltop", "pepperpot market": "Hilltop",
  "temple valley": "Temple Valley",
  "copperwood": "Copperwood",
  "letsbe avenue": "Letsbe Avenue",
  "metropolis": "Metropolis",
};
// Downtown and Hilltop sit next to each other in the site's central
// cluster; Temple Valley is explicitly its own third area separate from
// both (per Boomtown's own copy); Copperwood, Letsbe Avenue and
// Metropolis are each their own named district further round the site.
const NEIGHBOURING_AREAS = new Set(["Downtown|Hilltop", "Hilltop|Downtown"]);

let _venueAreaByStage = null;
function venueArea(stageName){
  if(!_venueAreaByStage){
    _venueAreaByStage = new Map();
    venueDirectory.forEach(v=>{
      const near = (v.near || "").toLowerCase().replace(/\s*\(.*?\)\s*/g, "").trim();
      const area = VENUE_AREA_GROUPS[near];
      if(area) _venueAreaByStage.set(v.name, area);
    });
  }
  return _venueAreaByStage.get(stageName) || null;
}

function estimateWalk(stageA, stageB){
  if(stageA === stageB) return null;
  const areaA = venueArea(stageA), areaB = venueArea(stageB);
  if(!areaA || !areaB) return { text:"Distance unclear — check the map on-site", suffix:"" };
  if(areaA === areaB) return { text:"~5 min", suffix:" walk (same area)" };
  if(NEIGHBOURING_AREAS.has(`${areaA}|${areaB}`)) return { text:"~10–15 min", suffix:" walk (neighbouring areas)" };
  return { text:"~15–25 min", suffix:" walk (different areas — allow good time)" };
}

const map = document.getElementById("map");
const mapInfo = document.getElementById("mapInfo");

// Illustrated background: grass texture, organic district clearings, tree
// icons, a ring of little tent icons for camping, and a worn dirt-trail
// route — all generated from the same coordinates the markers use so it
// lines up. An original illustration (can't legally embed Boomtown's own
// survey map, and an external image would break offline use), styled to
// read like a hand-drawn festival map rather than a schematic.
function seededRand(seed){
  let s = seed;
  return ()=>{ s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

// Soft organic blob outline (a "clearing") through a ring of jittered
// points, smoothed with quadratic curves — reads far less mechanical
// than a plain ellipse.
function blobPath(cx, cy, baseR, seed, points){
  points = points || 9;
  const rand = seededRand(seed);
  const pts = [];
  for(let i=0;i<points;i++){
    const angle = (i / points) * Math.PI * 2;
    const r = baseR * (0.72 + rand() * 0.5);
    pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.78]);
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} `;
  for(let i=0;i<points;i++){
    const p0 = pts[i], p1 = pts[(i + 1) % points];
    const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
    d += `Q ${p0[0].toFixed(1)} ${p0[1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)} `;
  }
  return d + "Z";
}

// A simple pictorial tree: trunk + three overlapping canopy blobs.
function treeIcon(x, y, scale, seed){
  const rand = seededRand(seed);
  const s = scale * (0.8 + rand() * 0.5);
  const hue = 100 + Math.floor(rand() * 20);
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"/>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(${hue},38%,38%,0.5)"/>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(${hue+8},40%,34%,0.5)"/>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(${hue+4},42%,42%,0.55)" stroke="hsla(${hue},40%,24%,0.4)" stroke-width="0.12"/>
  </g>`;
}
function treeCluster(cx, cy, count, spread, seed){
  const rand = seededRand(seed);
  let out = "";
  for(let i=0;i<count;i++){
    const a = rand() * Math.PI * 2;
    const r = rand() * spread;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r * 0.7;
    out += treeIcon(x, y, 0.9 + rand() * 0.7, seed + i * 7 + 3);
  }
  return out;
}

// A little pitched tent: two canvas panels + a ridge line + guy ropes.
function tentIcon(x, y, rot, seed){
  const rand = seededRand(seed);
  const hue = rand() > 0.5 ? "45,168,242" : "242,168,60";
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)})">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(${hue},0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"/>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"/>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"/>
  </g>`;
}
function tentRing(){
  let out = "";
  for(let i=0;i<26;i++){
    const a = (i / 26) * Math.PI * 2;
    const wobble = seededRand(i * 13)();
    const rad = 46 + wobble * 3;
    const x = 50 + Math.cos(a) * rad;
    const y = 50 + Math.sin(a) * rad * 0.98;
    out += tentIcon(x, y, (a * 180 / Math.PI) + 90, i * 5 + 1);
  }
  return out;
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

function buildMapBackground(){
  const districts = locations.filter(p=>p.kind === "district");
  const blobs = districts.map((d,i)=>{
    const cx = parseFloat(d.x), cy = parseFloat(d.y);
    return `<path d="${blobPath(cx, cy, 16, i * 31 + 7)}" fill="rgba(230,196,120,0.10)" stroke="rgba(242,168,60,0.35)" stroke-width="0.4" stroke-dasharray="1.4 1.6"/>`;
  }).join("");
  const loopPath = "M " + districts.map(d=>`${parseFloat(d.x)} ${parseFloat(d.y)}`).join(" L ") + " Z";

  // Thin spokes from every stage (major + minor) to its nearest district,
  // so the path network reads like it actually connects the site rather
  // than one lonely ring.
  const spokeTargets = locations.filter(p=>p.kind === "stage").concat(minorStages);
  const spokes = spokeTargets.map(s=>{
    const sx = parseFloat(s.x), sy = parseFloat(s.y);
    const nd = nearestDistrict(sx, sy, districts);
    return `<path d="M ${sx} ${sy} L ${parseFloat(nd.x)} ${parseFloat(nd.y)}" fill="none" stroke="rgba(196,158,110,0.22)" stroke-width="0.4" stroke-dasharray="0.3 1.2" stroke-linecap="round"/>`;
  }).join("");

  const forestSpots = locations.filter(p=> /Forest|Woods/.test(p.name));
  const trees = forestSpots.map((f,i)=> treeCluster(parseFloat(f.x), parseFloat(f.y), 16, 12, 17 + i * 41)).join("")
    + treeCluster(9, 14, 9, 8, 5) + treeCluster(91, 86, 9, 8, 61) + treeCluster(90, 10, 7, 7, 23) + treeCluster(10, 90, 7, 7, 37)
    + treeCluster(50, 4, 5, 6, 71) + treeCluster(96, 50, 5, 6, 83);
  return `
    <svg class="map-bg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <pattern id="grassTex" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
          <rect width="5" height="5" fill="none"/>
          <line x1="0.8" y1="5" x2="0.5" y2="2.6" stroke="rgba(255,255,255,0.05)" stroke-width="0.25"/>
          <line x1="2.6" y1="5" x2="3" y2="2.3" stroke="rgba(0,0,0,0.10)" stroke-width="0.25"/>
          <line x1="4.2" y1="5" x2="3.9" y2="2.8" stroke="rgba(255,255,255,0.04)" stroke-width="0.25"/>
        </pattern>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="url(#grassTex)"/>
      <path d="M -5 38 Q 50 18 105 42" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.6"/>
      <path d="M -5 68 Q 50 52 105 72" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="0.6"/>
      <path d="M 5 45 C 5 25 15 10 30 8 C 45 4 55 2 65 8 C 80 10 90 18 95 30 C 98 40 97 55 90 65 C 85 80 75 90 60 93 C 45 95 30 92 18 82 C 8 70 5 58 5 45 Z" fill="none" stroke="rgba(143,168,156,0.3)" stroke-width="0.5" stroke-dasharray="2 2"/>
      ${tentRing()}
      ${blobs}
      ${spokes}
      <path d="${loopPath}" fill="none" stroke="rgba(196,158,110,0.55)" stroke-width="0.9" stroke-linejoin="round" stroke-dasharray="0.3 1.6" stroke-linecap="round"/>
      ${trees}
    </svg>
  `;
}

// Layer visibility persists across loadMap() re-renders (tab switches, syncs,
// adding a hidden venue, etc. all rebuild #mapInner from scratch). Off by
// default for the busier layers so the map isn't crowded on first arrival —
// "Other stages" stays on since stage wayfinding is core info.
let mapLayerVisible = { minor: true, secret: false, camp: false, landmark: false };

function loadMap(){
  map.innerHTML = `
    <div id="mapInner"></div>
    <div class="mapZoomControls">
      <button id="zoomInBtn" title="Zoom in">+</button>
      <button id="zoomOutBtn" title="Zoom out">−</button>
      <button id="zoomResetBtn" title="Reset view">⤢</button>
    </div>
    <div class="compass" title="North (approx.)">
      <svg viewBox="0 0 24 24" width="26" height="26">
        <circle cx="12" cy="12" r="11" fill="rgba(11,21,18,0.65)" stroke="rgba(238,246,241,0.35)" stroke-width="1"/>
        <path d="M12 3 L15 12 L12 21 L9 12 Z" fill="rgba(242,168,60,0.9)"/>
        <text x="12" y="7.5" font-size="6" fill="#eef6f1" text-anchor="middle" font-weight="700">N</text>
      </svg>
    </div>
  `;
  const inner = document.getElementById("mapInner");
  inner.innerHTML = buildMapBackground();

  locations.filter(place=>place.kind !== "meeting").forEach(place=>{
    const marker = document.createElement("div");
    marker.className = "marker" + (place.kind === "stage" ? " stage" : "") + (place.kind === "meeting" ? " meeting" : "");
    marker.style.left = place.x;
    marker.style.top = place.y;
    marker.title = place.name;
    marker.onclick = ()=>{
      mapInfo.innerHTML = `
        <div class="card">
          <span class="tag">${place.kind}</span>
          <h3>${place.name}</h3>
          <p>${place.info}</p>
          <button class="action" id="saveMeetingBtn">Save as meeting point</button>
        </div>
      `;
      document.getElementById("saveMeetingBtn").onclick = ()=> saveMeeting(place.name);
    };
    inner.appendChild(marker);

    const label = document.createElement("div");
    label.className = "map-label" + (place.kind === "district" ? " district" : "");
    label.style.left = place.x;
    label.style.top = place.y;
    label.textContent = place.name;
    inner.appendChild(label);
  });

  minorStages.forEach(place=>{
    const isRumoured = place.status === "rumoured";
    const marker = document.createElement("div");
    marker.className = "marker stage minor" + (isRumoured ? " rumoured" : "");
    marker.style.left = place.x;
    marker.style.top = place.y;
    marker.title = place.name + (isRumoured ? " (rumoured — no 2026 confirmation)" : "");
    marker.onclick = ()=>{
      mapInfo.innerHTML = `
        <div class="card">
          <span class="tag">stage${isRumoured ? " — rumoured" : ""}</span>
          <h3>${place.name}</h3>
          <p>${place.info} <em>Position here is illustrative, not surveyed.</em></p>
        </div>
      `;
    };
    inner.appendChild(marker);

    const label = document.createElement("div");
    label.className = "map-label minor" + (isRumoured ? " rumoured" : "");
    label.style.left = place.x;
    label.style.top = place.y;
    label.textContent = place.name;
    inner.appendChild(label);
  });

  thingsToFind.forEach(spot=>{
    const marker = document.createElement("div");
    marker.className = "marker secret";
    marker.style.left = spot.x;
    marker.style.top = spot.y;
    marker.textContent = "?";
    marker.title = spot.name;
    marker.onclick = ()=>{
      mapInfo.innerHTML = `
        <div class="card">
          <span class="tag">hidden venue — unlisted</span>
          <h3>${spot.name}</h3>
          <p>${spot.info}</p>
          <p class="empty-note" style="margin-top:6px;">Nearest theme: ${spot.near}. Boomtown never publishes exact hidden-venue locations, so this pin is a "go exploring here" nudge, not a surveyed spot — log what you actually find in Map's hidden-venue log.</p>
        </div>
      `;
    };
    inner.appendChild(marker);

    const label = document.createElement("div");
    label.className = "map-label secret";
    label.style.left = spot.x;
    label.style.top = spot.y;
    label.textContent = spot.name;
    inner.appendChild(label);
  });

  secretSpots.forEach(spot=>{
    const marker = document.createElement("div");
    marker.className = "marker secret";
    marker.style.left = spot.x;
    marker.style.top = spot.y;
    marker.textContent = "?";
    marker.title = "Rumoured hidden venue territory";
    marker.onclick = ()=>{
      mapInfo.innerHTML = `
        <div class="card">
          <span class="tag">unlisted</span>
          <h3>Rumoured hidden venue territory</h3>
          <p>Boomtown's 50+ hidden venues are never published, so this is just a "go exploring here" nudge, not a real surveyed spot. Wander, follow the sound, and log what you actually find below.</p>
        </div>
      `;
    };
    inner.appendChild(marker);
  });

  allLandmarks().forEach(place=>{
    const marker = document.createElement("div");
    marker.className = "marker landmark";
    marker.style.left = place.x;
    marker.style.top = place.y;
    marker.title = place.name;
    marker.onclick = ()=>{
      mapInfo.innerHTML = `
        <div class="card">
          <span class="tag">${place.custom ? "landmark — your addition" : "landmark"}</span>
          <h3>${place.name}</h3>
          <p>${place.info}</p>
          ${place.hours ? `<p style="margin-top:6px; color:var(--accent-teal); font-size:12px;">🕐 ${place.hours}</p>` : ""}
          ${place.custom ? `<p class="empty-note" style="margin-top:6px;">Remove or edit this from the landmark list in the card below the map.</p>` : ""}
        </div>
      `;
    };
    inner.appendChild(marker);

    const label = document.createElement("div");
    label.className = "map-label landmark";
    label.style.left = place.x;
    label.style.top = place.y;
    label.textContent = place.name;
    inner.appendChild(label);
  });

  campLabels.forEach(c=>{
    const label = document.createElement("div");
    label.className = "map-label camp";
    label.style.left = c.x;
    label.style.top = c.y;
    label.textContent = "⛺ " + c.text;
    inner.appendChild(label);
  });

  document.querySelectorAll("#mapLayerToggles .chip").forEach(chip=>{
    const layer = chip.dataset.layer;
    chip.classList.toggle("active", !!mapLayerVisible[layer]);
    inner.classList.toggle("hide-" + layer, !mapLayerVisible[layer]);
    chip.onclick = ()=>{
      mapLayerVisible[layer] = !mapLayerVisible[layer];
      chip.classList.toggle("active", mapLayerVisible[layer]);
      inner.classList.toggle("hide-" + layer, !mapLayerVisible[layer]);
    };
  });

  gates.forEach(place=>{
    const marker = document.createElement("div");
    marker.className = "marker gate";
    marker.style.left = place.x;
    marker.style.top = place.y;
    marker.title = place.name;
    marker.onclick = ()=>{
      mapInfo.innerHTML = `
        <div class="card">
          <span class="tag">gate</span>
          <h3>${place.name}</h3>
          <p>${place.info}</p>
          ${place.hours ? `<p style="margin-top:6px; color:var(--accent-teal); font-size:12px;">🕐 ${place.hours}</p>` : ""}
        </div>
      `;
    };
    inner.appendChild(marker);

    const label = document.createElement("div");
    label.className = "map-label gate";
    label.style.left = place.x;
    label.style.top = place.y;
    label.textContent = place.name;
    inner.appendChild(label);
  });

  setupMapZoomPan();
}

// ===============================
// MAP ZOOM & PAN — drag to pan once zoomed, pinch or wheel/buttons to
// zoom. A capture-phase click guard stops a drag from also firing the
// marker underneath it.
// ===============================
let mapScale = 1, mapTx = 0, mapTy = 0;

function applyMapTransform(){
  const inner = document.getElementById("mapInner");
  if(inner) inner.style.transform = `translate(${mapTx}px, ${mapTy}px) scale(${mapScale})`;
}
function clampMapPan(){
  const rect = map.getBoundingClientRect();
  const maxX = rect.width * (mapScale - 1);
  const maxY = rect.height * (mapScale - 1);
  mapTx = Math.min(0, Math.max(-maxX, mapTx));
  mapTy = Math.min(0, Math.max(-maxY, mapTy));
}
function setMapScale(newScale){
  mapScale = Math.min(3.5, Math.max(1, newScale));
  clampMapPan();
  applyMapTransform();
}

let mapDragGuardInstalled = false;
function setupMapZoomPan(){
  mapScale = 1; mapTx = 0; mapTy = 0;
  applyMapTransform();

  document.getElementById("zoomInBtn").onclick = ()=> setMapScale(mapScale + 0.5);
  document.getElementById("zoomOutBtn").onclick = ()=> setMapScale(mapScale - 0.5);
  document.getElementById("zoomResetBtn").onclick = ()=> { mapScale = 1; mapTx = 0; mapTy = 0; applyMapTransform(); };

  const pointers = new Map();
  let dragging = false, dragMoved = false, startX = 0, startY = 0, startTx = 0, startTy = 0;
  let pinchStartDist = null, pinchStartScale = 1;
  const dist = (p1, p2)=> Math.hypot(p1.x - p2.x, p1.y - p2.y);

  map.onpointerdown = (e)=>{
    // Let the zoom buttons handle their own clicks untouched — capturing
    // the pointer to #map for a tap that started on a button can suppress
    // the button's click event in some browsers.
    if(e.target.closest(".mapZoomControls")) return;
    pointers.set(e.pointerId, { x:e.clientX, y:e.clientY });
    if(pointers.size === 1){
      // Only take over a single-finger touch when there's something to pan.
      // At scale 1 there's nothing to drag, so leave the pointer uncaptured
      // and don't touch touch-action — this is what lets an ordinary swipe
      // scroll the page instead of getting stuck on the map.
      if(mapScale > 1){
        try{ map.setPointerCapture(e.pointerId); }catch(err){}
        map.style.touchAction = "none";
        dragging = true; dragMoved = false;
        startX = e.clientX; startY = e.clientY; startTx = mapTx; startTy = mapTy;
      }
    } else if(pointers.size === 2){
      try{ map.setPointerCapture(e.pointerId); }catch(err){}
      map.style.touchAction = "none";
      dragging = false;
      const pts = [...pointers.values()];
      pinchStartDist = dist(pts[0], pts[1]);
      pinchStartScale = mapScale;
    }
  };
  map.onpointermove = (e)=>{
    if(!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x:e.clientX, y:e.clientY });
    if(pointers.size === 2 && pinchStartDist){
      const pts = [...pointers.values()];
      setMapScale(pinchStartScale * (dist(pts[0], pts[1]) / pinchStartDist));
      dragMoved = true;
    } else if(dragging && pointers.size === 1){
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if(Math.abs(dx) > 5 || Math.abs(dy) > 5) dragMoved = true;
      if(mapScale > 1){
        mapTx = startTx + dx; mapTy = startTy + dy;
        clampMapPan();
        applyMapTransform();
      }
    }
  };
  function endPointer(e){
    pointers.delete(e.pointerId);
    if(pointers.size < 2) pinchStartDist = null;
    if(pointers.size === 0){
      dragging = false;
      // Gesture's over — always give touch-action back to the page, even
      // if still zoomed in, so the very next swipe can scroll normally.
      map.style.touchAction = "pan-y";
    }
  }
  map.onpointerup = endPointer;
  map.onpointercancel = endPointer;

  map.onwheel = (e)=>{
    e.preventDefault();
    setMapScale(mapScale + (e.deltaY < 0 ? 0.3 : -0.3));
  };

  if(!mapDragGuardInstalled){
    map.addEventListener("click", (e)=>{
      if(dragMoved){ e.stopPropagation(); dragMoved = false; }
    }, true);
    mapDragGuardInstalled = true;
  }
}

function saveMeeting(name){
  Store.set("meeting", name);
  mapInfo.innerHTML = `<div class="card"><p class="empty-note">Meeting point saved: <strong style="color:var(--accent-amber)">${name}</strong></p></div>`;
  renderCurrentMeeting();
}

function renderCurrentMeeting(){
  const box = document.getElementById("currentMeetingDisplay");
  if(!box) return;
  const m = Store.get("meeting");
  box.textContent = m ? `Current meeting point: ${m}` : "No meeting point set yet.";
}

const meetingPointInput = document.getElementById("meetingPointInput");
document.getElementById("setMeetingBtn").onclick = ()=>{
  const val = meetingPointInput.value.trim();
  if(!val) return;
  saveMeeting(val);
  meetingPointInput.value = "";
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

document.getElementById("addLandmarkBtn").onclick = ()=>{
  const name = document.getElementById("landmarkName").value.trim();
  if(!name) return;
  const list = Store.get("customLandmarks") || [];
  list.push({
    name,
    district: document.getElementById("landmarkDistrict").value,
    info: document.getElementById("landmarkInfo").value.trim(),
    from: currentContributorName() || ""
  });
  Store.set("customLandmarks", list);
  document.getElementById("landmarkName").value = "";
  document.getElementById("landmarkInfo").value = "";
  loadCustomLandmarksList();
  loadMap();
};

loadCustomLandmarksList();

loadMap();

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
  body.innerHTML = rows.map(v=>{
    const hours = v.status === "logged" ? null : stageHoursFromSchedule(v.name);
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
      ${v.status === "logged" ? `<button data-i="${v._hiddenVenueIndex}" class="ghost removeHiddenVenueBtn" style="margin-top:6px;">Remove this find</button>` : ""}
    </div>
  `;
  }).join("") || `<p class="empty-note">No entries match these filters yet.</p>`;
  if(countNote) countNote.textContent = `Showing ${rows.length} of ${all.length} entries.`;
  // Only the meta line ("near Botanica") and info blurb, never the venue's
  // own name heading — a venue like "Botanica Zoo" would otherwise get its
  // own name partially turned into a link.
  body.querySelectorAll(".venue-row-meta, .venue-row-info").forEach(el=> linkifyKeyTerms(el));
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
  if(tab) document.querySelector(`.tab[data-tab="${tab}"]`).click();
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
    if(el) el.scrollIntoView({ behavior:"smooth", block:"start" });
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

// Jump straight to a district's own marker/card on the map, from a
// mention of its name anywhere else in the app (guide text, etc.).
function jumpToDistrictOnMap(name){
  document.querySelector('.tab[data-tab="mapscreen"]').click();
  requestAnimationFrame(()=>{
    const marker = [...document.querySelectorAll("#mapInner .marker")].find(m=> m.title === name);
    if(marker) marker.click();
    const info = document.getElementById("mapInfo");
    if(info) info.scrollIntoView({ behavior:"smooth", block:"start" });
  });
}

function jumpToGlossaryTerm(term){
  document.querySelector('.tab[data-tab="discover"]').click();
  requestAnimationFrame(()=>{
    const box = document.getElementById("jumpGlossary");
    if(box) box.scrollIntoView({ behavior:"smooth", block:"start" });
    if(glossarySearch){ glossarySearch.value = term; glossarySearch.dispatchEvent(new Event("input")); }
  });
}

function jumpToCharacter(name){
  document.querySelector('.tab[data-tab="discover"]').click();
  requestAnimationFrame(()=>{
    const box = document.getElementById("jumpCharacters");
    if(box) box.scrollIntoView({ behavior:"smooth", block:"start" });
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
        if(isGeneric) a.onclick = ()=> document.querySelector('.tab[data-tab="mapscreen"]').click();
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
function jumpToStageDirectory(stageName){
  document.querySelector('.tab[data-tab="mapscreen"]').click();
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
    character: Store.get("myCharacter") || null
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
  const stats = { clues:0, theories:0, venues:0, districts:0, involved:0, socials:0, quotes:0, sightings:0, landmarks:0, schedule:0, bingo:0, character:0, characterNotes:0 };
  const from = payload.from || "Someone";

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
    theories.push({ text: t.text, when: t.when, from });
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

  // Read-only per-person schedule snapshot — replaces that person's own
  // entry each time they resync (it's a full current snapshot of their
  // Plan, not incremental additions), and never touches this device's
  // own "schedule" key.
  if(Array.isArray(payload.schedule)){
    const people = Store.get("peopleSchedules") || {};
    people[from] = payload.schedule.map(a=>({ ...a }));
    Store.set("peopleSchedules", people);
    stats.schedule = payload.schedule.length;
  }

  // Same read-only per-person snapshot treatment as schedule above —
  // replaces that person's own bingo entry each resync, never touches
  // this device's own bingoCard/bingoMarked/bingoLocked.
  if(payload.bingo && Array.isArray(payload.bingo.card) && payload.bingo.card.length){
    const peopleBingo = Store.get("peopleBingo") || {};
    peopleBingo[from] = {
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
    peopleCharacters[from] = { ...payload.character };
    Store.set("peopleCharacters", peopleCharacters);
    stats.character = 1;
  }

  return { stats, from };
}

// ===============================
// WHO'S USING THIS DEVICE — a fixed name picker (with an "Other" escape
// hatch) so every entry gets tagged with a real person, not a typo-prone
// free-text field. currentContributorName() is what every "add" handler
// below calls to stamp new entries.
// ===============================
const KNOWN_CONTRIBUTORS = ["Emma","Dave","Rob","Jack","Lewis","Dana"];
const contributorNameInput = document.getElementById("contributorName");
const contributorOtherField = document.getElementById("contributorOtherField");
const contributorOtherInput = document.getElementById("contributorOtherInput");

function currentContributorName(){
  return (Store.get("contributorName") || "").trim();
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
      Store.set("contributorName", contributorOtherInput.value.trim());
    } else {
      contributorOtherField.style.display = "none";
      Store.set("contributorName", contributorNameInput.value);
    }
    syncContributorNameDisplays();
    // Picking a name from the dropdown is the one moment a first-time
    // setup most needs instant feedback — otherwise nothing visibly
    // happens until the next periodic tick or a manual "Sync now" tap,
    // which reads as broken. Skip it for "Other…" itself (no name yet,
    // just the text field appearing) — the oninput handler below covers
    // that once something's actually typed.
    if(contributorNameInput.value !== "__other__" && typeof autoSyncNow === "function") autoSyncNow("name picked");
  };
  contributorOtherInput.oninput = ()=>{
    if(contributorNameInput.value === "__other__") Store.set("contributorName", contributorOtherInput.value.trim());
    syncContributorNameDisplays();
  };
  contributorOtherInput.onblur = ()=>{
    if(contributorNameInput.value === "__other__" && contributorOtherInput.value.trim() && typeof autoSyncNow === "function") autoSyncNow("name picked");
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
    ? `Syncs automatically on open, every few minutes, and whenever you pull down from the top ↓ to refresh. <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpSync','discover')">Sync</a> also has a manual button, any time.`
    : `Pick who you are to start syncing — one-time, done for good on this device. Same picker as <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpSync','discover')">Sync</a> in Discover.`;
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
      if(otherInput.value.trim()) Store.set("contributorName", otherInput.value.trim());
      if(contributorNameInput){ contributorNameInput.value = "__other__"; }
      if(contributorOtherField){ contributorOtherField.style.display = ""; }
      updateHomeSyncStatusText();
    } else {
      otherField.style.display = "none";
      Store.set("contributorName", sel.value);
      syncContributorNameDisplays();
    }
  };
  otherInput.oninput = ()=>{
    Store.set("contributorName", otherInput.value.trim());
    if(contributorOtherInput){ contributorOtherInput.value = otherInput.value; }
    if(contributorNameInput){ contributorNameInput.value = "__other__"; }
    if(contributorOtherField){ contributorOtherField.style.display = ""; }
    updateHomeSyncStatusText();
  };
}

function renderHomeSyncStatus(){
  const box = document.getElementById("homeSyncStatus");
  if(!box) return;
  const name = currentContributorName();
  const isOther = name && !KNOWN_CONTRIBUTORS.includes(name);
  box.innerHTML = `
    <span class="tag" style="${name ? "" : "background:rgba(242,168,60,.16); color:var(--accent-amber); border-color:rgba(242,168,60,.4);"}">${name ? "Syncing" : "Set this up once"}</span>
    <h3>${name ? `✅ Syncing as ${escapeHtml(name)}` : "⚠️ Pick your name to start syncing"}</h3>
    <p>${name
      ? `Syncs automatically on open, every few minutes, and whenever you pull down from the top ↓ to refresh. <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpSync','discover')">Sync</a> also has a manual button, any time.`
      : `Pick who you are to start syncing — one-time, done for good on this device. Same picker as <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpSync','discover')">Sync</a> in Discover.`}</p>
    ${name ? `<p style="margin-top:6px; font-size:12px; color:var(--text-muted);">🔄 Data last synced with the group: <strong>${formatLastSynced()}</strong> — not the same as the app-version pill up top, that's about new code shipping, this is about your notes actually reaching everyone.</p>` : ""}
    <div class="field" style="margin-top:10px;"><label>Who are you?</label>
      <select id="homeContributorName">
        <option value="">Select a name…</option>
        <option value="Emma">Emma</option>
        <option value="Dave">Dave</option>
        <option value="Rob">Rob</option>
        <option value="Jack">Jack</option>
        <option value="Lewis">Lewis</option>
        <option value="Dana">Dana</option>
        <option value="__other__">Other…</option>
      </select>
    </div>
    <div class="field" id="homeContributorOtherField" style="display:${isOther ? "" : "none"};"><label>Your name</label><input type="text" id="homeContributorOtherInput" placeholder="Type your name"></div>
    <button class="action" id="homeSyncNowBtn" style="margin-top:10px;">☁️ Sync now</button>
    <p class="empty-note" id="homeSyncNowNote" style="margin-top:6px;"></p>
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
      <p>Everything you add saves itself to this device the instant you type or tap — no save button. Once you've picked your name in <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpSync','discover')">Sync</a>, this phone syncs itself automatically every time you open the app with signal — no button needed, and no one has to remember. It quietly sends your updates up and pulls everyone else's in behind the scenes; a "Sync now" button is there too for an instant one mid-session.</p>
      <p>Shared things — theories, hidden-venue finds, quotebook entries, live sightings, district notes, get-involved ticks, found socials, landmarks — combine into one pool everyone sees (Discover's "All notes"). Your Plan, bingo card and character stay yours — sync never merges anyone else's into them — but everyone else's land in their own named tab right next to yours, on the Plan, Bingo and My Character screens, so you can see what your friends have without it touching your own.</p>
      <p>Want just your own stuff backed up? Grab your personal copy from <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpSettings')">Settings</a>. Want a combined file to hand round once everyone's synced in? Same place — the shareable group copy leaves out everyone's personal bingo card, character and notes, so it's safe to actually share.</p>
      <p>The app itself updates quietly in the background whenever you're online, and keeps working fully offline once it's loaded once — updates never touch anything you've saved.</p>
      <button class="ghost" id="collapseHomeInfoBtn" style="margin-top:10px;">Got it, don't show this in full again</button>
    `;
    const collapseBtn = document.getElementById("collapseHomeInfoBtn");
    if(collapseBtn) collapseBtn.onclick = ()=>{ Store.set("seenHomeInfoCard", true); renderHomeInfoCard(); };
  } else {
    box.innerHTML = `
      <h3 style="margin-bottom:0;">💾 Your data, sync &amp; updates</h3>
      <p style="margin-top:6px;">Saves itself automatically, syncs itself automatically once you've picked a name — <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpSync','discover')">Sync</a> · <a class="inline-link" href="javascript:void(0)" onclick="jumpToId('jumpSettings')">Settings</a> · <a class="inline-link" href="javascript:void(0)" id="expandHomeInfoLink">full explanation</a></p>
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
    note.textContent = `Merged ${from}'s update: +${stats.clues} district notes, +${stats.characterNotes} character notes, +${stats.theories} theories, +${stats.venues} hidden venues, +${stats.districts} districts visited, +${stats.involved} get-involved ticks, +${stats.socials} socials, +${stats.quotes} journal quotes, +${stats.sightings} live sightings, +${stats.landmarks} landmarks. ${stats.schedule ? `${from}'s ${stats.schedule} saved artists are now viewable in their own tab on the Plan screen (not merged into your list). ` : ""}${stats.bingo ? `${from}'s bingo card is now viewable in its own tab on the Bingo screen. ` : ""}${stats.character ? `${from}'s character is now viewable in its own tab on the My Character card. ` : ""}Nothing already saved was duplicated.`;
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
// ===============================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAgiBfNu3IpTCpumJQrYkFOh03VNFTWOVQ",
  authDomain: "greebtown.firebaseapp.com",
  projectId: "greebtown",
  storageBucket: "greebtown.firebasestorage.app",
  messagingSenderId: "944940862671",
  appId: "1:944940862671:web:f84ece4e66b052b4f97bba"
};

let _firestoreDb = null;
function getFirestoreDb(){
  if(_firestoreDb) return _firestoreDb;
  if(typeof firebase === "undefined" || !firebase.initializeApp) return null;
  try{
    if(!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    _firestoreDb = firebase.firestore();
    return _firestoreDb;
  }catch(err){
    return null;
  }
}

// This group's shared room code is fixed (not something to make up) —
// pre-filled and saved automatically so nobody has to type it in.
const GROUP_ROOM_CODE = "medway-massive";
const roomCodeInput = document.getElementById("roomCodeInput");
if(roomCodeInput){
  if(!Store.get("roomCode")) Store.set("roomCode", GROUP_ROOM_CODE);
  roomCodeInput.value = Store.get("roomCode");
  roomCodeInput.onchange = ()=> Store.set("roomCode", roomCodeInput.value.trim());
  roomCodeInput.onblur = roomCodeInput.onchange;
}

function currentRoomCode(){
  return (Store.get("roomCode") || "").trim();
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

function recordLastSynced(){
  Store.set("lastSyncedAt", Date.now());
  if(typeof renderHomeSyncStatus === "function") renderHomeSyncStatus();
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
  if(typeof renderPlanPersonTabs === "function") renderPlanPersonTabs();
  if(typeof renderCompareFilterChips === "function") renderCompareFilterChips();
  if(typeof renderPlanCompare === "function" && planView === "compare") renderPlanCompare();
  if(typeof renderBingoPersonTabs === "function"){ renderBingoPersonTabs(); renderBingo(); }
  if(typeof renderMyCharacterPersonTabs === "function"){ renderMyCharacterPersonTabs(); renderMyCharacter(); }
}

async function pushToCloud(){
  const db = getFirestoreDb();
  const room = currentRoomCode();
  const name = currentContributorName();
  if(!db || !room || !name) return;
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
  await db.collection("rooms").doc(room).collection("members").doc(name).set(JSON.parse(JSON.stringify(payload)));
}

async function pullFromCloud(){
  const db = getFirestoreDb();
  const room = currentRoomCode();
  const name = currentContributorName();
  if(!db || !room) return { stats: null, count: 0 };
  const snap = await db.collection("rooms").doc(room).collection("members").get();
  const totals = { clues:0, theories:0, venues:0, districts:0, involved:0, socials:0, quotes:0, sightings:0, landmarks:0, schedule:0, bingo:0, character:0, characterNotes:0 };
  let count = 0;
  snap.forEach(doc=>{
    if(doc.id === name) return; // never merge your own payload back into yourself
    const { stats } = mergeSyncPayload(doc.data());
    Object.keys(totals).forEach(k=> totals[k] += stats[k] || 0);
    count++;
  });
  return { stats: totals, count };
}

// Shared by the Discover "Sync now" button and Home's own copy of it
// (Home added later so status is visible without a trip to Discover) —
// same behaviour either way, just reporting into whichever button/note
// pair triggered it.
async function runManualSync(btn, note){
  const haveName = !!currentContributorName();
  if(!currentRoomCode()){ if(note) note.textContent = "Type your group's room code above first."; return; }
  if(!getFirestoreDb()){ if(note) note.textContent = "Cloud sync isn't available right now — use the manual code box in Discover instead."; return; }
  if(navigator.onLine === false){ if(note) note.textContent = "No signal — use the manual code box in Discover, or try Sync now again once you're back online."; return; }
  if(btn) btn.disabled = true;
  if(note) note.textContent = "Syncing…";
  try{
    // Pulling everyone else's picks never needs your own name — only
    // pushing your own update does, since that's what it gets filed
    // under. So without a name picked yet, this still pulls (you can see
    // synced teammates' tabs straight away), it just can't push you into
    // the room for them to see back.
    if(haveName) await pushToCloud();
    const { stats, count } = await pullFromCloud();
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
    if(note) note.textContent = `Couldn't sync (${err && err.message ? err.message : "unknown error"}) — check you've got signal and try again.`;
  }finally{
    if(btn) btn.disabled = false;
  }
}

const cloudSyncBtn = document.getElementById("cloudSyncBtn");
if(cloudSyncBtn) cloudSyncBtn.onclick = ()=> runManualSync(cloudSyncBtn, document.getElementById("cloudSyncStatusNote"));
// Home's own "Sync now" button lives inside #homeSyncStatus, which
// renderHomeSyncStatus() fully rebuilds on every call (new name picked,
// after a merge, etc.) — wiring it there, not here, so it's re-attached
// to the fresh button each time instead of going stale.

// Auto-sync — on open, every few minutes while the app stays open, and
// whenever it comes back to the foreground (phone locked/backgrounded
// then reopened) — so nobody has to remember to tap "Sync now" or
// reopen the app just to pick up a teammate's latest picks. Pushes your
// own update (once you've picked who you are) AND always pulls everyone
// else's, same as the button does, just automatic. Not silent, though —
// it leaves a one-line note behind so background syncing is still
// visible, not invisible writes to your saved data. The manual button
// stays for an on-demand sync without waiting for the next automatic one.
const AUTO_SYNC_INTERVAL_MS = 3 * 60 * 1000;
let _lastAutoSyncAttempt = 0;
function autoSyncNow(trigger){
  if(navigator.onLine === false) return Promise.resolve();
  if(!currentRoomCode()) return Promise.resolve();
  if(!getFirestoreDb()) return Promise.resolve();
  _lastAutoSyncAttempt = Date.now();
  // Pulling in synced teammates' picks (their Plan tab, Compare, etc.)
  // never needs your own name set — only pushing your own update does,
  // since that's what it gets filed under. So this still runs and still
  // shows you their tabs even before you've picked who you are.
  const haveName = !!currentContributorName();
  return (haveName ? pushToCloud() : Promise.resolve()).then(()=> pullFromCloud()).then(({ stats, count })=>{
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
  }).catch(err=>{ console.error("Auto-sync failed:", err); /* stays quiet in the UI — no signal, or room not set up yet — but still logged for diagnosis */ });
}
autoSyncNow("on open");
setInterval(()=> autoSyncNow("periodic"), AUTO_SYNC_INTERVAL_MS);
document.addEventListener("visibilitychange", ()=>{
  // Guard against firing right on top of the interval or another
  // just-happened attempt (e.g. rapid tab switching) — only worth a
  // fresh pull if it's actually been a while.
  if(document.visibilityState === "visible" && Date.now() - _lastAutoSyncAttempt > 60000){
    autoSyncNow("welcome back");
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
  return Object.keys(people).filter(n=> people[n] && people[n].name).sort((a,b)=> a.localeCompare(b));
}

function renderMyCharacterPersonTabs(){
  const box = document.getElementById("charPersonTabs");
  if(!box) return;
  const names = myCharacterPeopleNames();
  if(names.length === 0){
    box.style.display = "none";
    myCharacterActiveOwner = "mine";
    return;
  }
  box.style.display = "";
  box.className = "tabstrip";
  box.innerHTML = `<button class="${myCharacterActiveOwner==="mine"?"active":""}" data-owner="mine">⭐ Mine</button>` +
    names.map(n=>`<button class="person ${myCharacterActiveOwner===n?"active":""}" data-owner="${escapeHtml(n)}">${escapeHtml(n)}</button>`).join("");
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
        <div style="font-size:12px; color:var(--accent-teal);">${escapeHtml(myCharacterActiveOwner)}'s character — read-only</div>
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
  return Object.keys(people).filter(n=> ((people[n] && people[n].card) || []).length > 0).sort((a,b)=> a.localeCompare(b));
}

function renderBingoPersonTabs(){
  const box = document.getElementById("bingoPersonTabs");
  if(!box) return;
  const names = bingoPeopleNames();
  if(names.length === 0){
    box.style.display = "none";
    bingoActiveOwner = "mine";
    return;
  }
  box.style.display = "";
  box.className = "tabstrip";
  box.innerHTML = `<button class="${bingoActiveOwner==="mine"?"active":""}" data-owner="mine">⭐ Mine</button>` +
    names.map(n=>`<button class="person ${bingoActiveOwner===n?"active":""}" data-owner="${escapeHtml(n)}">${escapeHtml(n)}</button>`).join("");
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
      ? `🔒 ${bingoActiveOwner} locked in — ${(data.marked || []).length}/24 crossed off. Read-only — this is their card, not yours.`
      : `${bingoActiveOwner} hasn't locked in yet — showing their card as last synced, still subject to change.`;
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
    characterResults.innerHTML = `<p class="empty-note">No matches.</p>`;
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
    "Tent","Pegs & mallet","Groundsheet if needed","Sleeping bag","Extra blanket","Pillow",
    "Sleeping mat/air bed & pump","Picnic blanket","Folding chairs","Folding table (Emma has 1)"
  ]},
  { title:"🍳 Kitchen & food", items:[
    "Camping stove","Gas canisters","Lighters / rolling supplies","Kettle/pots/pans for stove",
    "Plates, bowls, cutlery","Toastie maker (Emma)","Cups","Water container / shower bag",
    "Small bottled water pack (6–12 small bottles)","Electrolyte sachets","Fresh food / snacks / drinks",
    "Alcohol","Ice packs/cool box contents (Emma)"
  ]},
  { title:"🔌 Power, light & entertainment", items:[
    "Speakers","Power banks","Projector with movies (Emma)","Charging cables","Lanterns/camp lamps",
    "String lights","Head torch","Batteries (AA and AAA)","Cards/games","Notebook and pen",
    "Dry bag for tech","Disposable camera or digital?"
  ]},
  { title:"👕 Clothing", items:[
    "Festival clothes","Lots of socks and pants","Warm hoodie/fleece","Waterproof jacket",
    "Trainers / shoes (wellies / comfy night shoes)","Hats","Sunglasses"
  ]},
  { title:"🧴 Hygiene & health", items:[
    "Toothbrush & toothpaste","Deodorant","Shower gel","Shampoo","Fans (electric for tent, hand fan for stages)",
    "Wash cloth","Towel","Moisturiser","Hairbrush","Dry shampoo","Sun cream","Lip balm","Wet wipes",
    "Tweezers / nail clips","Emery board","Hand sanitiser","Toilet rolls","Tissue packs",
    "Painkillers / anti-acid","Antihistamines","Plasters/basic first aid","Earplugs!!!!",
    "Eye mask if you'll struggle to sleep"
  ]},
  { title:"🔧 Practical & repairs", items:[
    "Bin bags / plastic bags","Duct tape","Paracord/string spares for tent / patch kit",
    "A crate or box to use as a bedside table in the tent","A few carabiners for hanging lights, bags and jackets around tent",
    "Few zip ties","Clothesline (string) — the tent line works fine too","Small bag for daytime"
  ]},
  { title:"🎫 Day-of essentials", items:[
    "Fully charge phone, speaker, lanterns, lights, torch and power banks","Festival ticket","Wallet, ID",
    "House keys","Phone"
  ]}
];

const packingListBox = document.getElementById("packingList");
const packingSearchInput = document.getElementById("packingSearch");
let packingSearchTerm = "";

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
  packingCategories.forEach(cat=>{
    const items = term ? cat.items.filter(i=> i.toLowerCase().includes(term)) : cat.items;
    if(!items.length) return;
    html += `<div class="daygroup">${escapeHtml(cat.title)}</div><div>`;
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
  });
  packingListBox.innerHTML = html || `<p class="empty-note">No items match "${escapeHtml(packingSearchInput ? packingSearchInput.value.trim() : "")}".</p>`;
  const progressNote = document.getElementById("packingProgress");
  if(progressNote) progressNote.textContent = `${totalChecked}/${totalItems} packed`;

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
// HIDDEN VENUE LOG — feeds straight into the venue directory above,
// tagged "Your find".
// ===============================
const hiddenVenueNameInput = document.getElementById("hiddenVenueName");
const hiddenVenueTypeInput = document.getElementById("hiddenVenueType");
const hiddenVenueGenreInput = document.getElementById("hiddenVenueGenre");
const hiddenVenueNearInput = document.getElementById("hiddenVenueNear");
const hiddenVenueInput = document.getElementById("hiddenVenueInput");

document.getElementById("addHiddenVenueBtn").onclick = ()=>{
  const name = hiddenVenueNameInput.value.trim();
  const info = hiddenVenueInput.value.trim();
  if(!name && !info) return;
  const entries = Store.get("hiddenVenues");
  entries.push({
    name: name || "Untitled find",
    type: hiddenVenueTypeInput.value,
    genre: hiddenVenueGenreInput.value.trim(),
    near: hiddenVenueNearInput.value.trim(),
    info,
    from: currentContributorName() || "",
    when: new Date().toLocaleString()
  });
  Store.set("hiddenVenues", entries);
  hiddenVenueNameInput.value = "";
  hiddenVenueGenreInput.value = "";
  hiddenVenueNearInput.value = "";
  hiddenVenueInput.value = "";
  renderVenueTable();
  if(typeof renderConsolidatedNotes === "function") renderConsolidatedNotes();
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
  entries.push({ text, when: new Date().toLocaleString(), from: currentContributorName() || "" });
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
  const schedule = isMine ? (Store.get("schedule") || []) : ((Store.get("peopleSchedules") || {})[name] || []);
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
  Object.keys(Store.get("peopleSchedules") || {}).forEach(n=> names.add(n));
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
  { text:"Metropolis's Job Centre — long reported closed and folded into the Betterverse™ storyline — is confirmed reopening for Chapter Five as 'Jobcentre 2.0', now with aptitude tests, biometric data collection and new jobs to appraise your skillset.", source:"Boomtown Jobcentre official social posts", when:"2026", confirmed:true }
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
const guideContent = document.getElementById("guideContent");

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
  { section:"story", title:"Districts as story threads", html:"<p><strong>Area 404:</strong> having won last year's election, it now runs the city — Chief Guardian Mr Biga (appointed by The Collector) is training up more Guardians at a boot camp, and the Luck Exchange has expanded in from Letsbe Avenue to hand out 'work permits' and manage the paperwork of power. Some residents say the Guardians have gotten drunk on it, fleecing people with 'official' fines. <strong>Botanica:</strong> The Great Mother, still smarting from her electoral defeat, is plotting a ritual to sacrifice her followers and fire herself into her own portal to ASCEND — competing with The Collector, and sitting alongside Temple of Zero's Shadow Post / IONA photocopier mystery. <strong>Copperwood:</strong> now Edna 'VVH' Von Vanderhaus's permanent home and self-appointed Creative Director's chair, turning the district into a live film set for <em>Race to the Red Planet</em> — this year pioneering 'Actual Live Sound'. <strong>Oldtown:</strong> Rufus the Red and the Den of Dis Order are building the People's Republic of Oldtownia after a hard year moving their whole community. <strong>Metropolis:</strong> Aurora Venturestone, CEO of Betterverse™, now runs the district herself with Guardian help — Bettercorp™ posts record profits despite mass layoffs, while she quietly runs a 'Black Goo' side hustle. Laid-off inGeniuses offer illegal urban-explorer tours into the crumbling Betterverse™, risky because of 'Digital Foreverness'. Boomtown's own current copy also references an eighth city district beyond the seven this guide tracks (the five core plot districts, Letsbe Avenue and Thrutopia) — treat the exact map layout as unconfirmed until you're looking at it on-site.</p><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/discover\" target=\"_blank\" rel=\"noopener\">Official Discover &amp; district spotlights</a>" },
  { section:"story", title:"Ceremonies & city-wide moments", html:"<p>The opening and closing ceremonies are the official bookends of the chapter and are worth treating as story events, not merely big shows. Between them, The Daily Rag, district meetings, public broadcasts and characters’ sudden invitations are your best catch-up tools. If you hear a crowd gathering for an announcement, go.</p><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/discover\" target=\"_blank\" rel=\"noopener\">Official story & districts</a>" },
  { section:"extras", title:"Non-music things actually worth pencilling in", html:"<ul class=\"compact-list\"><li><strong>Thrutopia:</strong> new for Chapter Five — talks, workshops and thoughtful daytime programming around imagining better futures, with open workshop submissions (see Get Involved in Discover).</li><li><strong>The Retreat:</strong> massages, hot tubs, sauna/cold splash, sound baths, beauty and maker sessions. It is in the Thrutopia woodlands; book ahead for the most popular slots.</li><li><strong>Cloak of Hope:</strong> stitch a 10–15cm hope patch on-site for the collective artwork.</li><li><strong>Agents of Change:</strong> sign up for the badge, HQ, recycled-T-shirt screen print and early quest access.</li><li><strong>The Observatory:</strong> take part in a genuine 2026 academic study on identity and behaviour at live events, led by Dr Martha Newson.</li><li><strong>Reparium:</strong> it debuted as a free volunteer repair hub in 2025; look out for its return if gear needs rescuing.</li></ul>" },
  { section:"extras", title:"The Retreat — quick booking guide", html:"<p>Current listings include 90-minute spa/hot-tub access (£50), sauna and cold splash (£35), sound baths (£20), massages from £68, plus clay and silver workshops. Bring swimwear for the water/heat sessions; towel rental is available. It is separate from the festival ticket and the official advice is to book early.</p><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/the-retreat\" target=\"_blank\" rel=\"noopener\">Browse & book The Retreat</a>" },
  { section:"extras", title:"🕵 Hidden venues, shops & the full directory", text:"Beyond the 18 named stages, 40+ confirmed hidden venues, shops, workshops and support spaces are scattered through the districts, plus a handful of past-chapter names with no 2026 evidence — deliberately unlisted anywhere on an official map. The Map tab now has the full filterable confirmed/rumoured directory with genre and info for every one we could source, alongside the schematic itself. This redesign also moved some of the stages themselves: the Lion's Den is back in the Temple Valley amphitheatre, Hilltop is now built around live music, and Hydro XL — the new hydrogen-powered flagship stage — has been expanded and relocated to Downtown." },
  { section:"extras", title:"🎡 Fairground &amp; leisure", html:"<p>Beyond the stages, expect a scattering of fairground and leisure attractions — Boomtown's own 2026 guide confirms a chair-o-plane ride near Area 404/Downtown, and past chapters have run a retro amusements arcade and vintage fairground rides (waltzers and similar) elsewhere on site. Treat the wider fairground as a strong likelihood rather than a locked-in promise until you see it. The full rundown, with what's confirmed vs rumoured, is in the venue directory on the Map tab.</p><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/news/boomtown-chapter-five-radical-redesign-essential-guide\" target=\"_blank\" rel=\"noopener\">Official Chapter Five essential guide</a>" },
  { section:"logistics", title:"🎟 Set times & clashes", text:"Boomtown holds its own official timetable back until a few days before gates open, so the Fri/Sat times in this app are early and subject to change. Once the official app confirms things, use 'Set time' on any saved act in Plan to correct it — the Clashes view flags overlaps automatically." },
  { section:"logistics", title:"🎫 Tickets & resale", html:"<p>Boomtown 2026 sold out during its initial release. If you're still after a ticket, resale runs exclusively through the official Kaboodle account system on the Boomtown site — never buy from unofficial resale sites or social media listings, as tickets are registered to the original buyer and unofficial transfers can be refused entry.</p><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/tickets\" target=\"_blank\" rel=\"noopener\">Official tickets &amp; resale</a>" },
  { section:"logistics", title:"💳 Cashless", html:"<p>Boomtown runs on cashless RFID wristbands — top up before or on arrival, either through your Boomtown account or on-site top-up points.</p><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/info/cash-free\" target=\"_blank\" rel=\"noopener\">Official Cash Free page</a>" },
  { section:"logistics", title:"⛺ Camping field guide", text:"The site splits roughly into two halves either side of a big central hill: Downtown (west) and Hilltop (east) — worth knowing which half you're in before you start walking. West Camping and Downtown Camping sit nearest West Gate and the public transport hub, handy if you arrived by coach or shuttle. Meadow Camping is the accessible campsite — apply in advance if you need it, spaces are limited and prioritised for accessibility bookings. Valley and Temple Valley Camping sit toward Hilltop, closer to that side's stages. East Camping and Campervan Field are nearest East Gate and the car parks. Quiet Camping is set apart for those wanting more sleep. Standard fields aren't numbered, so pick a landmark (a flag, a food stall, a distinctive tree) and save it in Notes so you can find your tent at 2am." },
  { section:"logistics", title:"🍺 Alcohol — what you can bring in", html:"<p>There is a limit to the amount of alcohol you can bring on site. For a weekend ticket you may bring up to:</p><ul class=\"compact-list\"><li>16 x 440ml cans of lager/cider/beer, OR</li><li>18 x 250ml cans of premixed spirit drinks, OR</li><li>3-litre box of wine, OR</li><li>7 litres of cider/lager/beer in plastic bottles or cans</li></ul><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/legal/terms\" target=\"_blank\" rel=\"noopener\">Official Terms &amp; Conditions</a><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/info/safety\" target=\"_blank\" rel=\"noopener\">Official Safety page</a>" },
  { section:"logistics", title:"🚫 What not to bring", html:"<p>Aerosol paint cans, glass of any kind, and any alcohol beyond your first-entry allowance (see Alcohol above — there's no topping up on re-entry). Unsealed or unidentifiable e-cigarette liquid can also be confiscated.</p><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/info/safety\" target=\"_blank\" rel=\"noopener\">Official Safety page — full current list</a>" },
  { section:"logistics", title:"♻️ Sustainability", text:"Boomtown runs a leave-no-trace, no-litter policy — take your tent and rubbish home with you (there's an Eco Bond scheme to encourage it). No single-use plastic bottles on site; free water refill points are dotted around arenas and campsites, so bring a reusable bottle. Food stalls use compostable packaging only. The Reparium repair hub and on-site Permaculture and Energy Garden spaces are part of the same push." },
  { section:"logistics", title:"🧭 Vibe Check — take the pledge", html:"<p>Chapter Five's community-responsibility campaign, covering wellness, party safety and looking out for your crew: stay crew-conscious (keep people close, check in often), know your safe zones, party smart (know the risks, spot the signs), fuel up rather than burn out (real meals, hydration, spacers not chasers), and try at least one set or mission with a clear head. Boomtown runs a genuine pledge you can sign — anyone who takes it is in the running for festival prizes.</p><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/news/take-the-vibe-check-pledge\" target=\"_blank\" rel=\"noopener\">Take the Vibe Check pledge</a>" },
  { section:"logistics", title:"📍 Meeting up", text:"Agree a clear meeting point before you split up and save it in the Map tab. Don't rely on having signal to find each other — it's patchy on-site." },
  { section:"logistics", title:"🔋 Power", text:"Bring a charged power bank — this app and your photos are the main drain. Screens go dim fast in daylight, check brightness before you head out." },
  { section:"logistics", title:"📲 Using this companion", text:"This is a self-contained web page, not an app-store app — Add to Home Screen (iOS Safari) or 'Install app' (Android Chrome) gives it a proper icon and offline access. Everything you save (Plan, Discover notes, hidden-venue log) stays on this device only; use the copy buttons in Discover and Map to share progress with your group." },
  { section:"logistics", title:"🤝 Getting one shared copy for the group", text:"Each phone saves its own data separately. To end up with one file that has everyone's notes, theories, hidden-venue finds and ticks in it: add your name and copy a Sync code in Discover, send it to a teammate, they paste and merge it in (nothing gets duplicated), and repeat round the group. Whoever's phone ends up with everyone merged in is the one to hit 'Download shareable group copy' on — that file is the group's master copy with personal things (bingo card, character, HQ notes) left out, so it's safe to actually hand round, and Discover's Consolidated Notes card shows you everything that's in it at a glance before you do." }
];

const GUIDE_SECTION_LABELS = {
  story: "📖 The story, in depth",
  extras: "🎯 Beyond the music",
  logistics: "🗓 Logistics for the day"
};
const GUIDE_SECTION_IDS = {
  story: "jumpStoryDeep",
  extras: "jumpBeyondMusic",
  logistics: "jumpLogistics"
};

function loadGuide(){
  guideContent.innerHTML = "";
  let lastSection = null;
  chapterFiveGuide.forEach(section=>{
    if(section.section && section.section !== lastSection){
      lastSection = section.section;
      const divider = document.createElement("div");
      divider.className = "daygroup";
      divider.id = GUIDE_SECTION_IDS[lastSection] || "";
      divider.textContent = GUIDE_SECTION_LABELS[lastSection] || lastSection;
      guideContent.appendChild(divider);
    }
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h3>${section.title}</h3>${section.html || `<p>${section.text}</p>`}`;
    linkifyKeyTerms(card);
    guideContent.appendChild(card);
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
const PERSONAL_ONLY_KEYS = ["meeting","notes","customArtists","bingoCard","bingoMarked","bingoLocked","myCharacter","bingoCustomText","bingoLinesSeen","contributorName","roomCode","lastSyncedAt","seenHomeInfoCard","dismissedAddToHome","packingChecked"];

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
