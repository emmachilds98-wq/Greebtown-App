// Registers the service worker and lets a published update take over
// automatically (the page reloads once, silently, when a new version
// has finished installing) — no extra UI, no change to existing screens.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

// --- stop perpetual "Update available" loop if SW/app versions briefly drift ---
(function(){
  function resetBuildPill(){
    try {
      const pill = document.getElementById("buildStatusPill");
      if (!pill) return;
      if (!/Update available/i.test(pill.textContent || "")) return;
      const d = (typeof APP_BUILD_TIME !== "undefined") ? new Date(APP_BUILD_TIME) : new Date();
      const time = d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
      const date = d.toLocaleDateString([], { day:"numeric", month:"short" });
      pill.textContent = "Updated " + date + ", " + time;
      pill.style.cursor = "";
      pill.style.background = "";
      pill.style.color = "";
      pill.style.borderColor = "";
      pill.onclick = null;
    } catch (e) {}
  }
  if (typeof checkForStaleCopy === "function") {
    checkForStaleCopy = function(){ return Promise.resolve(false); };
  }
  resetBuildPill();
  // In-flight checkForStaleCopy() from app.js may still resolve later — clear again
  setTimeout(resetBuildPill, 300);
  setTimeout(resetBuildPill, 1200);
  setTimeout(resetBuildPill, 3000);
})();

// --- map GPS matching upgrade (inlined; also available as js/map-matching.js) ---
// Map GPS name-matching upgrade (loaded after js/app.js).
// Improves realStageMatch so more schematic pins snap to scraped official-app GPS.
(function(){
  function normalizeVenueKey(s){
    return String(s || "")
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\b(the|of|and|a|an|bar|stage|tent|club|hq)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  const STAGE_ALIASES = {
    "church veg": "church of veg",
    "churchof veg": "church of veg",
    "church of veg": "church of veg",
    "tough love": "tough love",
    "v tough love": "tough love",
    "bad apple": "bad apple bar",
    "bad apple bar": "bad apple bar",
    "twisted time machine": "bad apple bar",
    "twisted time machine bad apple bar": "bad apple bar",
    "circus": "circus tent",
    "circus tent": "circus tent",
    "fools leap": "fools leap",
    "the fools leap": "fools leap",
    "grand central": "grand central",
    "postal posse": "postal posse",
    "reel news": "reel news",
    "magic teapot": "magic teapot",
    "the magic teapot": "magic teapot",
    "foggers mill": "foggers mill",
    "fogger s mill": "foggers mill",
    "topsy turvy trims": "topsy turvy trims",
    "topsy turvy": "topsy turvy trims",
    "ancient futures": "ancient futures",
    "rebel girls": "rebel girls club",
    "rebel girls club": "rebel girls club",
    "agents of change": "agents of change hq",
    "agents of change hq": "agents of change hq",
    "pomegranate parlour": "pomegranate parlour",
    "the pomegranate parlour": "pomegranate parlour",
    "pomegranare": "pomegranate parlour",
    "mining for gold town": "mining for g old town",
    "mining for g old town": "mining for g old town",
    "mining for old town": "mining for g old town",
    "den of disorder": "den of disorder",
    "games lounge": "games lounge",
    "games": "games lounge",
    "daily rag": "daily rag",
    "the daily rag": "daily rag",
    "da graffs": "da graffs",
    "dagraffs": "da graffs",
    "velvet rope": "velvet rope",
    "skylark hilltop": "skylark hilltop",
    "boomtown hall": "boomtown hall",
    "retreat": "retreat",
    "the retreat": "retreat",
    "tinker station": "tinker station",
    "spinney hollow": "spinney hollow",
    "energy garden": "energy garden",
    "climate live": "climate live",
    "sharing circles": "sharing circles",
    "giant tree circle": "giant tree circle",
    "the giant tree circle": "giant tree circle",
    "cocaine anonymous": "cocaine anonymous",
    "permaculture": "permaculture",
    "elemental": "elemental",
    "hapitat": "hapitat",
    "habitat": "hapitat",
    "xr": "xr",
    "crafts": "crafts",
    "sauna": "sauna",
    "crafty rascals": "crafty rascals"
  };
  function improvedRealStageMatch(name){
    const data = window.BOOMTOWN_LOCATIONS_2026;
    if(!data || !name) return null;
    const raw = name.trim().toLowerCase();
    let hit = data.stages.find(s => s.label.trim().toLowerCase() === raw);
    if(hit) return hit;
    const norm = normalizeVenueKey(name);
    const aliasTarget = STAGE_ALIASES[norm] || STAGE_ALIASES[raw] || null;
    if(aliasTarget){
      hit = data.stages.find(s => normalizeVenueKey(s.label) === normalizeVenueKey(aliasTarget)
                              || s.label.trim().toLowerCase() === aliasTarget);
      if(hit) return hit;
    }
    hit = data.stages.find(s => normalizeVenueKey(s.label) === norm);
    if(hit) return hit;
    if(norm.length >= 5){
      hit = data.stages.find(s => {
        const sn = normalizeVenueKey(s.label);
        return sn.length >= 5 && (sn.includes(norm) || norm.includes(sn));
      });
      if(hit) return hit;
    }
    return null;
  }
  // Override the function app.js defined (classic non-module scripts share globals).
  realStageMatch = improvedRealStageMatch;
  window.realStageMatch = improvedRealStageMatch;
  window.normalizeVenueKey = normalizeVenueKey;
  // app.js calls loadMap() at the end of its own script, which runs before
  // this file — re-run so markers use the improved matcher on first paint.
  if(typeof loadMap === "function"){
    try { loadMap(); } catch(e) { console.warn("map-matching: loadMap refresh failed", e); }
  }
})();
