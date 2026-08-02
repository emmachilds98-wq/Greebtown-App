// --- force visible build stamp + one-time cache clear for map v284 ---
(function(){
  var KEY = "greebtown_bust_v284";
  var BUILD_LABEL = "Updated 2 Aug, 19:20";
  function setPill(){
    try {
      var pill = document.getElementById("buildStatusPill");
      if (!pill) return;
      pill.textContent = BUILD_LABEL;
      pill.style.cursor = "";
      pill.onclick = null;
    } catch (e) {}
  }
  setPill();
  setTimeout(setPill, 200);
  setTimeout(setPill, 1000);
  setTimeout(setPill, 2500);

  try {
    if (sessionStorage.getItem(KEY)) return;
    var stages = (window.BOOMTOWN_LOCATIONS_2026 && window.BOOMTOWN_LOCATIONS_2026.stages) || [];
    var hasLion = stages.some(function(s){ return /lion/i.test(s.label || ""); });
    if (hasLion) {
      sessionStorage.setItem(KEY, "1");
      return;
    }
    sessionStorage.setItem(KEY, "1");
    var done = function(){ window.location.reload(); };
    var clear = window.caches
      ? caches.keys().then(function(keys){ return Promise.all(keys.map(function(k){ return caches.delete(k); })); })
      : Promise.resolve();
    clear.then(function(){
      if (!("serviceWorker" in navigator)) return done();
      return navigator.serviceWorker.getRegistrations().then(function(regs){
        return Promise.all(regs.map(function(r){ return r.unregister(); }));
      }).then(done, done);
    }, done);
  } catch (e) {
    try { sessionStorage.setItem(KEY, "1"); } catch (e2) {}
  }
})();

// Registers the service worker and lets a published update take over
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

// Stop perpetual Update available loop
(function(){
  if (typeof checkForStaleCopy === "function") {
    checkForStaleCopy = function(){ return Promise.resolve(false); };
  }
})();

// Map GPS matching upgrade
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
    "circus": "circus tent",
    "circus tent": "circus tent",
    "fools leap": "fools leap",
    "grand central": "grand central",
    "lions den": "the lions den",
    "lion s den": "the lions den",
    "the lions den": "the lions den",
    "hydro": "hydro xl",
    "hydro xl": "hydro xl",
    "quantum": "quantum",
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
  realStageMatch = improvedRealStageMatch;
  window.realStageMatch = improvedRealStageMatch;
  if(typeof loadMap === "function"){
    try { loadMap(); } catch(e) { console.warn("map-matching refresh failed", e); }
  }
})();

// Schematic position fixes
(function(){
  const SCHEMATIC_FIXES = {
    "The Lion's Den": { x: "79%", y: "84%" },
    "Hydro XL":       { x: "16%", y: "62%" },
    "Quantum":        { x: "66%", y: "74%" },
    "Area 404":       { x: "28%", y: "38%" },
    "Metropolis":     { x: "14%", y: "40%" },
    "Botanica":       { x: "22%", y: "22%" },
    "Oldtown":        { x: "62%", y: "48%" },
    "Grand Central":  { x: "58%", y: "36%" }
  };
  try {
    if (typeof locations !== "undefined" && Array.isArray(locations)) {
      locations.forEach(function(p){
        const fix = SCHEMATIC_FIXES[p.name];
        if (fix) { p.x = fix.x; p.y = fix.y; }
      });
    }
  } catch (e) {}
  if (typeof loadMap === "function") {
    try { loadMap(); } catch (e) {}
  }
})();
