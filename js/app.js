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
//    (buildSyncPayload/mergeSyncPayload) — it's opt-in and only ever
//    touches the shared discovery-log style fields (clues, theories,
//    hiddenVenues, discoveries, customSocials, quotes, sightings,
//    customLandmarks), which merge additively with no duplicates, PLUS
//    one read-only snapshot field: each person's saved-artist "schedule"
//    rides along in the same code, but it is never merged into your own
//    "schedule" key. Incoming schedules land under peopleSchedules[name]
//    instead, kept separate per contributor, and the Plan screen's
//    person-tab bar is the only place they're ever displayed. Sync must
//    never read or write personal fields like schedule, meeting, notes,
//    bingoCard, bingoMarked, bingoLocked, or myCharacter.
const DEFAULTS = { schedule: [], peopleSchedules: {}, discoveries: [], meeting: null, notes: "", customArtists: [], hiddenVenues: [], clues: {}, involvedDone: [], theories: [], customSocials: [], contributorName: "", quotes: [], bingoCard: [], bingoMarked: [], bingoLocked: false, myCharacter: null, sightings: [], customLandmarks: [], bingoCustomText: "", bingoLinesSeen: 0 };
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

function setActiveGenreChip(chipEl){
  document.querySelectorAll("#genreChips .chip").forEach(c=>c.classList.remove("active"));
  if(chipEl) chipEl.classList.add("active");
}

function updateClearArtistSearchBtn(){
  if(!clearArtistSearchBtn) return;
  clearArtistSearchBtn.style.display = artistSearch.value.trim().length ? "" : "none";
}

function showArtists(list){
  artistResults.innerHTML = "";
  if(list.length === 0){
    artistResults.innerHTML = `<p class="empty-note">No artists match that search.</p>`;
    return;
  }
  list.forEach(artist=>{
    const saved = Store.get("schedule").some(x=>x.name === artist.name);
    const div = document.createElement("div");
    div.className = "item";
    const genre = genreOf(artist);
    const gDesc = genreDescriptorText(genre);
    div.innerHTML = `
      <div class="item-top">
        <div>
          <strong>${artist.name}</strong><br>
          ${artist.stage}<br>
          ${timeLabel(artist)}<br>
          <small>${genre}</small>
          <div class="artist-descriptor">${escapeHtml(artistDescriptor(artist))}</div>
          ${gDesc ? `<div class="genre-desc">${escapeHtml(gDesc)}</div>` : ""}
        </div>
        <button aria-label="Toggle saved">${saved ? "★" : "☆"}</button>
      </div>
    `;
    div.querySelector("button").onclick = ()=> saveArtist(artist);
    artistResults.appendChild(div);
  });
}

function currentFilteredArtists(){
  const term = artistSearch.value.toLowerCase();
  return allArtists().filter(artist=>
    artist.name.toLowerCase().includes(term) ||
    artist.stage.toLowerCase().includes(term) ||
    genreOf(artist).toLowerCase().includes(term)
  );
}

// With 1000+ acts across the full 5-day dataset, dumping everything to
// the DOM on load is slow on older phones — search-first instead.
function promptArtistSearch(){
  artistResults.innerHTML = `<p class="empty-note">Start typing a name, stage or genre — or tap a genre chip above — to search ${allArtists().length} acts across all 5 days.</p>`;
}
let artistSearchDebounceTimer = null;
artistSearch.oninput = ()=>{
  // Manual typing overrides whatever genre chip was tapped, so drop its highlight.
  setActiveGenreChip(null);
  updateClearArtistSearchBtn();
  clearTimeout(artistSearchDebounceTimer);
  artistSearchDebounceTimer = setTimeout(()=>{
    if(artistSearch.value.trim().length === 0){ promptArtistSearch(); return; }
    showArtists(currentFilteredArtists());
  }, 180);
};
if(clearArtistSearchBtn){
  clearArtistSearchBtn.onclick = ()=>{
    artistSearch.value = "";
    setActiveGenreChip(null);
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
function buildTimelineHTML(items, opts){
  opts = opts || {};
  const pxPerMin = opts.pxPerMin || 2;
  if(!items.length){
    return { html: `<p class="empty-note" style="padding:16px;">Nothing to show here yet.</p>`, stages: [] };
  }
  const parsed = items.map(a=>{
    const [sh,sm] = (a.start||"0:0").split(":").map(Number);
    const [eh,em] = (a.end||a.start||"0:0").split(":").map(Number);
    let start = (sh||0)*60 + (sm||0);
    let end = (eh||0)*60 + (em||0);
    if(end <= start) end += 1440;
    return { ...a, _start:start, _end:end };
  });
  const minMin = Math.floor(Math.min(...parsed.map(p=>p._start))/60)*60;
  const maxMin = Math.ceil(Math.max(...parsed.map(p=>p._end))/60)*60;
  const stages = [...new Set(parsed.map(p=>p.stage))].sort();
  const totalHeight = Math.max((maxMin-minMin)*pxPerMin, 40);
  const savedNames = opts.savedNames || null;

  let hourLabels = "", hourLines = "";
  for(let m=minMin; m<=maxMin; m+=60){
    const top = (m-minMin)*pxPerMin;
    const hh = Math.floor((((m%1440)+1440)%1440)/60).toString().padStart(2,"0");
    hourLabels += `<div class="timeline-hour-label" style="top:${top}px;">${hh}:00</div>`;
    hourLines += `<div class="timeline-hourline" style="top:${top}px;"></div>`;
  }

  const cols = stages.map(stage=>{
    const stageItems = parsed.filter(p=>p.stage===stage);
    const blocks = stageItems.map(p=>{
      const top = (p._start-minMin)*pxPerMin;
      const height = Math.max((p._end-p._start)*pxPerMin, 26);
      const isSaved = savedNames ? savedNames.has(p.name) : false;
      const cls = "timeline-block" + (isSaved ? " saved" : "") + (opts.readonly ? " readonly" : "");
      return `<div class="${cls}" style="top:${top}px; height:${height}px;" data-name="${escapeHtml(p.name)}" data-day="${escapeHtml(p.day||"")}"><b>${escapeHtml(p.name)}</b><span class="tb-time">${escapeHtml(p.start||"")}${p.end?"–"+escapeHtml(p.end):""}${isSaved?" ★":""}</span></div>`;
    }).join("");
    return `<div class="timeline-col"><div class="timeline-col-head">${escapeHtml(stage)}</div><div class="timeline-body" style="height:${totalHeight}px;">${hourLines}${blocks}</div></div>`;
  }).join("");

  const html = `<div class="timeline-grid">
    <div class="timeline-hours"><div class="timeline-col-head">&nbsp;</div><div class="timeline-body" style="height:${totalHeight}px;">${hourLabels}</div></div>
    ${cols}
  </div>`;
  return { html, stages };
}

let artistsTimelineDay = "Wed";
let artistsView = "list";

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
  const { html } = buildTimelineHTML(dayItems, { savedNames });
  grid.innerHTML = html;
  grid.querySelectorAll(".timeline-block").forEach(b=>{
    b.onclick = ()=>{
      const name = b.dataset.name, day = b.dataset.day;
      const artist = allArtists().find(a=>a.name===name && a.day===day);
      if(artist){ saveArtist(artist); renderArtistsTimeline(); }
    };
  });
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

function loadGenreChips(){
  const genres = [...new Set(allArtists().map(genreOf))].filter(g=>g && g !== "Unconfirmed").sort();
  const box = document.getElementById("genreChips");
  box.innerHTML = genres.map(g=>`<span class="chip" data-g="${g}">${g}</span>`).join("");
  box.querySelectorAll(".chip").forEach(s=>{
    s.onclick = ()=>{
      artistSearch.value = s.dataset.g;
      setActiveGenreChip(s);
      updateClearArtistSearchBtn();
      showArtists(currentFilteredArtists());
    };
  });
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

function saveArtist(artist){
  let schedule = Store.get("schedule");
  const exists = schedule.find(x=>x.name === artist.name);
  if(exists){
    schedule = schedule.filter(x=>x.name !== artist.name);
  } else {
    schedule.push({ ...artist });
  }
  Store.set("schedule", schedule);
  renderSchedule();
  showArtists(currentFilteredArtists());
  updateNextEvent();
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
        (clashMap[A.i] = clashMap[A.i] || []).push(B.name);
        (clashMap[B.i] = clashMap[B.i] || []).push(A.name);
      }
    }
  }
  return clashMap;
}

function scheduleItemHTML(artist, idx, clashNames, readonly){
  const clashClass = clashNames && clashNames.length ? " clash" : "";
  const genre = genreOf(artist);
  const gDesc = genreDescriptorText(genre);
  return `
    <div class="item${clashClass}" data-idx="${idx}">
      <div class="item-top">
        <div>
          <strong>${artist.name}</strong><br>
          ${artist.stage}<br>
          <span class="time-label">${timeLabel(artist)}</span>
          <div class="artist-descriptor">${escapeHtml(artistDescriptor(artist))}</div>
          ${gDesc ? `<div class="genre-desc">${escapeHtml(gDesc)}</div>` : ""}
        </div>
        ${readonly ? "" : `<div class="btnrow">
          <button class="set-time-btn">Set time</button>
          <button class="remove-btn">Remove</button>
        </div>`}
      </div>
      ${clashNames && clashNames.length ? `<div class="clash-note">⚠ Clashes with ${clashNames.join(", ")}</div>` : ""}
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
  if(names.length === 0){
    box.style.display = "none";
    if(note) note.style.display = "none";
    planActiveOwner = "mine";
    return;
  }
  box.style.display = "";
  box.className = "tabstrip";
  box.innerHTML = `<button class="${planActiveOwner==="mine"?"active":""}" data-owner="mine">⭐ Mine</button>` +
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
    note.textContent = planActiveOwner === "mine"
      ? "Viewing your own saved artists. Switch tabs above to look at a synced teammate's — it's read-only and never merges into yours."
      : `Viewing ${planActiveOwner}'s saved artists from their last Sync code — read-only, and it hasn't changed or added anything to your own list.`;
  }
}

function renderSchedule(){
  const schedule = activeScheduleData();
  const readonly = planActiveOwner !== "mine";

  if(schedule.length === 0){
    scheduleList.innerHTML = `<div class="card"><p class="empty-note">${readonly ? `${escapeHtml(planActiveOwner)} hasn't saved any artists yet.` : "No saved artists yet. Add some from the Artists tab."}</p></div>`;
    return;
  }

  if(planView === "list"){
    scheduleList.innerHTML = schedule.map((a,i)=> scheduleItemHTML(a,i,null,readonly)).join("");
  } else {
    const clashMap = findClashes(schedule);
    const byDay = {};
    schedule.forEach((a,i)=>{
      const key = a.day && a.day !== "TBC" ? a.day : "No time set";
      (byDay[key] = byDay[key] || []).push({a, i});
    });
    const order = [...DAY_ORDER, "No time set"];
    let html = "";
    order.forEach(day=>{
      if(!byDay[day]) return;
      const items = byDay[day].sort((x,y)=> (x.a.start||"99:99").localeCompare(y.a.start||"99:99"));
      html += `<div class="daygroup">${day}</div>`;
      items.forEach(({a,i})=> html += scheduleItemHTML(a,i,clashMap[i],readonly));
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

  if(typeof renderNowNext === "function") renderNowNext();
}

function setPlanView(view){
  planView = view;
  ["viewListBtn","viewClashBtn","viewTimelineBtn"].forEach(id=>{
    const btn = document.getElementById(id);
    if(btn) btn.classList.remove("active");
  });
  const activeBtn = document.getElementById(view==="list"?"viewListBtn":view==="clash"?"viewClashBtn":"viewTimelineBtn");
  if(activeBtn) activeBtn.classList.add("active");

  const listEls = [scheduleList, document.getElementById("nowNextBanner")];
  const timelineEl = document.getElementById("planTimelineView");
  if(view === "timeline"){
    listEls.forEach(el=> el && (el.style.display = "none"));
    if(timelineEl) timelineEl.style.display = "";
    renderPlanTimelineDayTabs();
    renderPlanTimeline();
  } else {
    listEls.forEach(el=> el && (el.style.display = ""));
    if(timelineEl) timelineEl.style.display = "none";
    renderSchedule();
  }
}

document.getElementById("viewListBtn").onclick = ()=> setPlanView("list");
document.getElementById("viewClashBtn").onclick = ()=> setPlanView("clash");
document.getElementById("viewTimelineBtn").onclick = ()=> setPlanView("timeline");

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
  const dayItems = schedule.filter(a=> a.day === planTimelineDay && a.start);
  const savedNames = new Set(dayItems.map(a=>a.name));
  const { html } = buildTimelineHTML(dayItems, { readonly, savedNames });
  grid.innerHTML = dayItems.length ? html : `<p class="empty-note" style="padding:16px;">Nothing with a set time saved for ${planTimelineDay} yet.</p>`;

  const hint = document.getElementById("planTimelineHint");
  if(hint) hint.textContent = readonly
    ? "Scroll down for time, sideways for stage."
    : "Scroll down for time, sideways for stage. Tap a block to unsave it.";

  if(!readonly){
    grid.querySelectorAll(".timeline-block").forEach(b=>{
      b.onclick = ()=>{
        const name = b.dataset.name, day = b.dataset.day;
        const artist = Store.get("schedule").find(a=>a.name===name && a.day===day);
        if(artist){ saveArtist(artist); renderPlanTimeline(); }
      };
    });
  }
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

document.getElementById("browseAllArtistsBtn").onclick = ()=>{
  document.querySelector('.tab[data-tab="artists"]').click();
  artistSearch.value = "";
  setActiveGenreChip(null);
  updateClearArtistSearchBtn();
  showArtists(allArtists());
  artistSearch.placeholder = `Browsing all ${allArtists().length} artists — use a genre chip or search to narrow it down`;
  window.scrollTo(0, 0);
};

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

// The other 11 official stages, plotted small — real, confirmed names
// (matched against the 2026 lineup listing), illustrative positions —
// no verified coordinates for these, unlike the 15 pinned above.
const otherStages = [
  { name:"Spectrum 360", info:"A circular arena entirely enclosed in shipping containers, running 360° visuals with a broad electronic bill spanning UK garage through to gabber." },
  { name:"Tangled Roots", info:"A laid-back dub and roots stage with its own cocktail bar — a good slow-down spot between bigger sets." },
  { name:"Full Moon Ballroom", info:"A ballroom-themed stage — expect a mixed, dressed-up crowd and a more theatrical vibe than the bass-heavy stages." },
  { name:"Rose and Clown", info:"One of the site's smaller character-led stages — treat the name as the clue and expect an eclectic, party-focused bill." },
  { name:"The Fools Leap", info:"A smaller stage leaning into Boomtown's playful, circus-adjacent side — good for stumbling on something odd and fun." },
  { name:"Foggers Mill", info:"An industrial/mill-themed stage — exact genre policy varies by year, so follow the crowd and the smoke machines." },
  { name:"Hangar 161", info:"Punk's home at Boomtown — a proudly loud, socialist, anti-racist stage with a mosh-pit crowd." },
  { name:"Tribe of Frog", info:"Hosted by the long-running UK psytrance party brand of the same name — expect psytrance, full-on and progressive sets deep into the night." },
  { name:"Sibín Beag", info:"Irish for 'little shebeen' — a folk and traditional-music stage, with acts blending trad sessions and folk-tinged party sets." },
  { name:"Acid Leak", info:"Area 404's acid techno and hard techno stage — expect a darker, sweatier crowd and relentless 4/4." },
  { name:"Infinity", info:"One of Chapter Five's smaller stages — exact genre policy for 2026 isn't confirmed publicly, so treat it as a wildcard worth a look." }
];

const minorStagePositions = [[40,42],[14,50],[58,30],[44,52],[30,58],[62,52],[12,36],[72,66],[40,76],[78,40],[56,80]];
const minorStages = otherStages.map((s, i)=>({
  name: s.name,
  info: s.info,
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
  { x:"95%", y:"64%", text:"Quiet Camping" }
];

const gates = [
  { name:"West Gate", x:"3%", y:"46%", info:"Main entrance — shuttle buses, taxi rank and coach drop-off land here. Nearest to West, Downtown and Meadow (accessible) camping.", hours:"Wed 14:00–21:30, Thu–Sun 10:00–21:30. No re-entry after 21:30." },
  { name:"East Gate", x:"96%", y:"32%", info:"Nearest the White Carparks, motorcycle and cycle parking, and Campervan Field.", hours:"Wed 14:00–21:30, Thu–Sun 10:00–21:30. No re-entry after 21:30." },
  { name:"South Gate", x:"78%", y:"93%", info:"Nearest White Carpark 4 and the premium Camp Orchid / Camp Skylark camping pods.", hours:"Wed 14:00–21:30, Thu–Sun 10:00–21:30. No re-entry after 21:30." }
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
  { name:"Spectrum 360", type:"Main stage", status:"confirmed", music:true, genre:"UK garage through to gabber, 360° visuals", near:"Area 404", info:"A circular arena entirely enclosed in shipping containers." },
  { name:"Tangled Roots", type:"Main stage", status:"confirmed", music:true, genre:"Dub, roots", near:"Unclear", info:"Laid-back stage with its own cocktail bar." },
  { name:"Full Moon Ballroom", type:"Main stage", status:"confirmed", music:true, genre:"Ballroom, eclectic", near:"Unclear", info:"A dressed-up, theatrical crowd rather than a straight dancefloor." },
  { name:"Rose and Clown", type:"Main stage", status:"confirmed", music:true, genre:"Eclectic, party", near:"Unclear", info:"Smaller character-led stage — the name is the clue." },
  { name:"The Fools Leap", type:"Main stage", status:"confirmed", music:true, genre:"Playful, circus-adjacent", near:"Oldtown", info:"Good for stumbling on something odd and fun." },
  { name:"Foggers Mill", type:"Main stage", status:"confirmed", music:true, genre:"Industrial-themed, genre varies", near:"Unclear", info:"Follow the crowd and the smoke machines." },
  { name:"Hangar 161", type:"Main stage", status:"confirmed", music:true, genre:"Punk", near:"Unclear", info:"A proudly loud, socialist, anti-racist stage with a mosh-pit crowd." },
  { name:"Tribe of Frog", type:"Main stage", status:"confirmed", music:true, genre:"Psytrance, full-on, progressive", near:"Unclear", info:"Hosted by the long-running UK psytrance party brand of the same name." },
  { name:"Sibín Beag", type:"Main stage", status:"confirmed", music:true, genre:"Folk, traditional", near:"Unclear", info:"Irish for 'little shebeen' — trad sessions and folk-tinged party sets." },
  { name:"Acid Leak", type:"Main stage", status:"confirmed", music:true, genre:"Acid techno, hard techno", near:"Area 404", info:"Area 404's darker, sweatier 4/4 stage." },
  { name:"Infinity", type:"Main stage", status:"confirmed", music:"unclear", genre:"Genre policy unconfirmed", near:"Unclear", info:"One of Chapter Five's smaller stages — treat as a wildcard." },
  { name:"The Observatory", type:"Research hub", status:"confirmed", music:false, genre:"—", near:"Thrutopia (likely)", info:"Genuine 2026 academic study led by Dr Martha Newson, 10+ UK universities — real research, not story canon." },
  { name:"The Boomtown Bobbies", type:"Hidden venue", status:"confirmed", music:true, genre:"DJs, live takeovers", near:"Area 404", info:"Mock police station in Area 404's territory, playing on The Guardians storyline." },
  { name:"Soapranos Laundrette", type:"Hidden venue", status:"confirmed", music:true, genre:"Dance/house DJs", near:"Letsbe Avenue", info:"Laundrette-fronted micro venue in Letsbe Avenue — DJs behind the washing machines." },
  { name:"Hotel Paradiso", type:"Hidden venue", status:"confirmed", music:true, genre:"Eclectic, lounge", near:"Copperwood", info:"Faded-glamour hotel bar fitting Copperwood's 1925 film-world setting." },
  { name:"Luck Exchange Casino", type:"Hidden venue", status:"confirmed", music:true, genre:"Party, eclectic", near:"Area 404", info:"Casino-themed venue in Area 404's territory." },
  { name:"The Garden Centre", type:"Shop / hidden venue", status:"confirmed", music:true, genre:"Chill, eclectic", near:"Botanica", info:"Garden-centre-fronted spot fitting Botanica's plant-temple theme." },
  { name:"Botanica Zoo", type:"Hidden venue", status:"confirmed", music:true, genre:"Character-led, eclectic", near:"Botanica", info:"A 'zoo' micro-world inside Botanica — the theme is the clue." },
  { name:"The Immortal Children of the Eternal Seed", type:"Hidden venue", status:"confirmed", music:true, genre:"Ritual, ambient/eclectic", near:"Botanica", info:"Botanica-flavoured cult/ritual-themed micro venue — name suggests a Great Mother tie-in." },
  { name:"Topsy Turvy Trims", type:"Shop / hidden venue", status:"confirmed", music:true, genre:"Barbershop novelty, party", near:"Oldtown", info:"Barbershop/salon-themed spot — fits Oldtown's topsy-turvy rebuild." },
  { name:"PFP Robot", type:"Hidden venue", status:"confirmed", music:true, genre:"Electro, tech", near:"Metropolis (likely)", info:"Robot/tech-themed venue, likely Metropolis-adjacent." },
  { name:"Sub Lab", type:"Hidden venue", status:"confirmed", music:true, genre:"Bass, dubstep", near:"Metropolis", info:"Laboratory-themed bass venue with a heavier, sub-driven sound." },
  { name:"Nachtlicker", type:"Hidden venue", status:"confirmed", music:true, genre:"Techno, late-night electronic", near:"Metropolis (likely)", info:"Name suggests a darker after-hours techno room." },
  { name:"Deviant Lounge", type:"Hidden venue", status:"confirmed", music:true, genre:"Eclectic, after-hours", near:"Metropolis (likely)", info:"Late-night lounge for when the bigger stages wind down." },
  { name:"Gabber Kebabber", type:"Shop / hidden venue", status:"confirmed", music:true, genre:"Gabber, hardcore", near:"Letsbe Avenue", info:"Kebab-shop chaos paired with gabber and hardcore — tiny and loud." },
  { name:"E Numbers", type:"Shop / hidden venue", status:"confirmed", music:true, genre:"Party, eclectic", near:"Letsbe Avenue", info:"Sweet-shop-themed party spot fitting Letsbe Avenue's BLIP storyline." },
  { name:"The Pomegranate Parlour", type:"Hidden venue", status:"confirmed", music:true, genre:"Eclectic party DJs", near:"Site-wide", info:"Parlour-style oddity — a good stop wherever a venue is doing something theatrical." },
  { name:"Busker's Wharf", type:"Hidden venue", status:"confirmed", music:true, genre:"Live/acoustic, folk", near:"Site-wide", info:"Wharf/street-performance themed spot." },
  { name:"Twisted Time Machine (Bad Apple Bar)", type:"Hidden venue", status:"confirmed", music:true, genre:"Rotates by slot: emo, nu-metal, jungle disco, 90s rave", near:"Site-wide", info:"Themed bar/party room — expect a different fancy-dress theme by time slot." },
  { name:"Circus Tent", type:"Hidden venue", status:"confirmed", music:true, genre:"Circus, live performance", near:"Oldtown (likely)", info:"Performance-led rather than a straight dancefloor." },
  { name:"Airetiko", type:"Hidden venue", status:"confirmed", music:true, genre:"Techno, tech-house (inferred)", near:"Metropolis (likely)", info:"Name and past billing suggest a techno-leaning room." },
  { name:"Rebel Girls Club", type:"Hidden venue", status:"confirmed", music:true, genre:"Party, empowerment-themed", near:"Metropolis (likely)", info:"Female-led party space." },
  { name:"Mining for (g)Old Town", type:"Hidden venue", status:"confirmed", music:true, genre:"Eclectic, party", near:"Oldtown", info:"Mining/prospecting theme playing on Oldtown's rebuild-uphill storyline." },
  { name:"XR", type:"Installation / talks", status:"confirmed", music:false, genre:"Climate activism, talks", near:"Thrutopia", info:"Extinction Rebellion-linked space — fits Thrutopia's climate focus." },
  { name:"End of the Line", type:"Hidden venue", status:"confirmed", music:true, genre:"Atmospheric, genre unclear", near:"Unclear", info:"Name suggests a rail/transit theme — exact vibe unconfirmed." },
  { name:"Cas's Costumes", type:"Shop / hidden venue", status:"confirmed", music:true, genre:"Dress-up, party", near:"Oldtown", info:"Costume-shop-fronted micro venue fitting Oldtown's circus theme." },
  { name:"Garden", type:"Chill space", status:"confirmed", music:false, genre:"—", near:"Botanica (likely)", info:"Planting/chill space, likely Botanica or Thrutopia-adjacent." },
  { name:"Craft Tent", type:"Workshop / shop", status:"confirmed", music:false, genre:"—", near:"Thrutopia", info:"Craft-making workshops and stalls." },
  { name:"Hapitat", type:"Installation", status:"confirmed", music:false, genre:"—", near:"Thrutopia", info:"Wellbeing/habitat-themed space, Thrutopia-adjacent." },
  { name:"Crafty Rascals", type:"Workshop / shop", status:"confirmed", music:false, genre:"—", near:"Thrutopia", info:"Family/kids craft activities." },
  { name:"Spinney Hollow", type:"Hidden venue", status:"confirmed", music:true, genre:"Eclectic, woodland", near:"Woodland edge (Anara/Hidden Woods)", info:"Small grove venue tucked into wooded ground." },
  { name:"Tinker Station", type:"Workshop / shop", status:"confirmed", music:false, genre:"—", near:"Thrutopia", info:"Repair/maker space, pairs with the Reparium ethos." },
  { name:"Blink Mental Health", type:"Welfare / support", status:"confirmed", music:false, genre:"—", near:"Pepperpot Market", info:"On-site mental health support service." },
  { name:"Energy Garden", type:"Installation", status:"confirmed", music:false, genre:"—", near:"Thrutopia", info:"Sustainable-energy themed space." },
  { name:"Climate Live", type:"Talks / installation", status:"confirmed", music:false, genre:"—", near:"Thrutopia", info:"Climate talks and programming, Thrutopia-adjacent." },
  { name:"Reparium", type:"Workshop / shop", status:"confirmed", music:false, genre:"—", near:"Thrutopia", info:"Free volunteer repair hub — debuted 2025, back for Chapter Five." },
  { name:"Games Lounge", type:"Chill space", status:"confirmed", music:false, genre:"—", near:"Pepperpot Market", info:"Games and downtime area away from the stages." },
  { name:"Permaculture", type:"Talks / installation", status:"confirmed", music:false, genre:"—", near:"Thrutopia", info:"Growing and permaculture talks." },
  { name:"The Magic Teapot", type:"Shop / cafe", status:"confirmed", music:false, genre:"—", near:"Thrutopia", info:"Tea-themed chill spot and cafe." },
  { name:"Cocaine Anonymous", type:"Welfare / support", status:"confirmed", music:false, genre:"—", near:"Pepperpot Market", info:"On-site 12-step support meeting." },
  { name:"Narcotics Anonymous", type:"Welfare / support", status:"confirmed", music:false, genre:"—", near:"Pepperpot Market", info:"On-site 12-step support meeting." },
  { name:"Ancient Futures", type:"Talks / installation", status:"confirmed", music:false, genre:"—", near:"Thrutopia", info:"Future-facing talks in a Thrutopia-adjacent style." },
  { name:"Reel News", type:"Hidden venue", status:"confirmed", music:true, genre:"Eclectic, spoken-word", near:"Copperwood", info:"Newsreel/cinema-themed spot tying into Copperwood's film-district story." },
  { name:"The Chair-o-Plane", type:"Leisure / ride", status:"confirmed", music:false, genre:"—", near:"Area 404 / Downtown", info:"A classic swing-carousel fairground ride, named in Boomtown's own 2026 essential guide near the Hide Out Downtown venue." },
  { name:"The Boomtown Bank", type:"Leisure / ride", status:"rumoured", music:false, genre:"Games, novelty", near:"Unclear", info:"A recurring past-chapter attraction offering fun-and-nonsense games rather than real banking; not explicitly reconfirmed for 2026 yet." },
  { name:"Retro Amusements Arcade", type:"Leisure / ride", status:"rumoured", music:false, genre:"—", near:"Unclear", info:"Past chapters have run a retro amusements arcade among the site's entertainment; not explicitly reconfirmed for 2026 yet." },
  { name:"Vintage Fairground (waltzers & rides)", type:"Leisure / ride", status:"rumoured", music:false, genre:"—", near:"Oldtown / Area 404 (typical)", info:"Past chapters have included a vintage fairground with waltzers and similar rides alongside the chair-o-plane; general presence expected but exact 2026 line-up of rides unconfirmed." },
  { name:"Little Pharma", type:"Hidden venue", status:"rumoured", music:true, genre:"Eclectic party DJs", near:"Unclear", info:"Seen in past chapters; no 2026 listing found — chase it but don't bank on it." },
  { name:"Postal Posse", type:"Hidden venue", status:"rumoured", music:true, genre:"Eclectic", near:"Botanica (past chapters)", info:"Past-chapter character-led micro world tied to Botanica's postal-worker subplot; no 2026 evidence found." },
  { name:"Copper Feel Cabaret", type:"Hidden venue", status:"rumoured", music:true, genre:"Cabaret, live", near:"Copperwood (past chapters)", info:"Copperwood-adjacent name from past searches; not confirmed for 2026." },
  { name:"Cosmic Junkyard", type:"Hidden venue", status:"rumoured", music:true, genre:"Eclectic bass", near:"Unclear", info:"Turned up in past-chapter searches with no dedicated account; treat as unconfirmed." },
  { name:"Clik Clik", type:"Hidden venue", status:"rumoured", music:false, genre:"Photo-booth / party novelty", near:"Unclear", info:"Seen in past social mentions; no 2026 confirmation found." },
  { name:"Engine House", type:"Hidden venue", status:"rumoured", music:true, genre:"Industrial, eclectic", near:"Unclear", info:"Past-chapter name with no dedicated 2026 account found." },
  { name:"Job Centre", type:"Hidden venue", status:"rumoured", music:false, genre:"—", near:"Metropolis (past chapters)", info:"Reported to have closed for good in 2023 and folded into the Betterverse™ storyline — don't go looking for it." },
  { name:"Shamrock", type:"Hidden venue", status:"rumoured", music:true, genre:"Irish/folk, party", near:"Unclear", info:"Past-chapter name; no 2026 evidence found." },
  { name:"Indian Street Food", type:"Food & drink", status:"confirmed", music:false, genre:"—", near:"Site-wide", info:"One of the cuisines Boomtown has confirmed for 2026, plus a £6 meal deal at selected traders — you'll pass stalls like this rather than need to seek them out." },
  { name:"Caribbean Comfort Food", type:"Food & drink", status:"confirmed", music:false, genre:"—", near:"Site-wide", info:"Confirmed 2026 food category — an everyday-encounter stall, not a hidden find." },
  { name:"Burger-van Classics", type:"Food & drink", status:"confirmed", music:false, genre:"—", near:"Site-wide", info:"Confirmed 2026 food category, dotted around the bigger stages and camping fields." },
  { name:"Paelleria", type:"Food & drink", status:"rumoured", music:false, genre:"—", near:"Pepperpot Market (2025)", info:"A 2025 trader-list name (paella). Treat as an example of the kind of stall to expect, not a return guarantee for 2026." },
  { name:"Burger Shack", type:"Food & drink", status:"rumoured", music:false, genre:"—", near:"Site-wide (2025)", info:"A 2025 trader-list name; no 2026 confirmation." },
  { name:"Greek Gyros", type:"Food & drink", status:"rumoured", music:false, genre:"—", near:"Site-wide (2025)", info:"A 2025 trader-list name; no 2026 confirmation." }
];

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
    const marker = document.createElement("div");
    marker.className = "marker stage minor";
    marker.style.left = place.x;
    marker.style.top = place.y;
    marker.title = place.name;
    marker.onclick = ()=>{
      mapInfo.innerHTML = `
        <div class="card">
          <span class="tag">stage</span>
          <h3>${place.name}</h3>
          <p>${place.info} <em>Position here is illustrative, not surveyed.</em></p>
        </div>
      `;
    };
    inner.appendChild(marker);

    const label = document.createElement("div");
    label.className = "map-label minor";
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
    chip.onclick = ()=>{
      chip.classList.toggle("active");
      inner.classList.toggle("hide-" + chip.dataset.layer, !chip.classList.contains("active"));
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
    from: currentContributorName() || undefined
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

const statusLabels = { confirmed:"Confirmed", rumoured:"Rumoured", logged:"Your find" };

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c=>({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
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
  return (Store.get("hiddenVenues") || []).map(entry=>({
    name: entry.name || "Untitled find",
    type: entry.type || "Hidden venue",
    status: "logged",
    genre: entry.genre || "—",
    near: entry.near || "",
    music: typeof entry.music === "boolean" ? entry.music : "unclear",
    info: (entry.info ? entry.info : "") + (entry.when ? ` (logged ${entry.when}${entry.from ? " via " + entry.from : ""})` : "")
  }));
}

function fullVenueDirectory(){
  return venueDirectory.concat(loggedVenuesAsDirectory());
}

function renderVenueTable(){
  const body = document.getElementById("venueTableBody");
  const countNote = document.getElementById("venueTableCount");
  if(!body) return;
  const all = fullVenueDirectory();
  const rows = all.filter(v=>
    (venueStatusFilter === "all" || v.status === venueStatusFilter) &&
    (venueTypeFilter === "all" || v.type === venueTypeFilter)
  );
  const musicLabel = m => m === true ? "🎵 Music" : m === false ? "🔇 No music" : "🎵 Music unclear";
  body.innerHTML = rows.map(v=>{
    const hours = v.status === "logged" ? null : stageHoursFromSchedule(v.name);
    return `
    <div class="venue-row">
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
    </div>
  `;
  }).join("") || `<p class="empty-note">No entries match these filters yet.</p>`;
  if(countNote) countNote.textContent = `Showing ${rows.length} of ${all.length} entries.`;
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

function loadDiscoveries(){
  discoveriesBox.innerHTML = "";
  const clues = Store.get("clues") || {};
  discoveries.forEach((item, index)=>{
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
// with everyone's info in it, ready to "Download a copy" and share.
// ===============================
function buildSyncPayload(){
  return {
    v: 1,
    from: (Store.get("contributorName") || "").trim() || "Someone",
    clues: Store.get("clues") || {},
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
    schedule: Store.get("schedule") || []
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
  const stats = { clues:0, theories:0, venues:0, districts:0, involved:0, socials:0, quotes:0, sightings:0, landmarks:0, schedule:0 };
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

  const venues = Store.get("hiddenVenues") || [];
  const venueKeys = new Set(venues.map(v=>(v.name || "").trim().toLowerCase()));
  (payload.hiddenVenues || []).forEach(v=>{
    const key = (v.name || "").trim().toLowerCase();
    if(!key || venueKeys.has(key)) return;
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

  const customLandmarksList = Store.get("customLandmarks") || [];
  const landmarkKeys = new Set(customLandmarksList.map(l=>(l.name || "").trim().toLowerCase()));
  (payload.customLandmarks || []).forEach(l=>{
    const key = (l.name || "").trim().toLowerCase();
    if(!key || landmarkKeys.has(key)) return;
    landmarkKeys.add(key);
    customLandmarksList.push({ ...l, from: l.from || from });
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
  };
  contributorOtherInput.oninput = ()=>{
    if(contributorNameInput.value === "__other__") Store.set("contributorName", contributorOtherInput.value.trim());
  };
}

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
    note.textContent = `Merged ${from}'s update: +${stats.clues} district notes, +${stats.theories} theories, +${stats.venues} hidden venues, +${stats.districts} districts visited, +${stats.involved} get-involved ticks, +${stats.socials} socials, +${stats.quotes} journal quotes, +${stats.sightings} live sightings, +${stats.landmarks} landmarks. ${stats.schedule ? `${from}'s ${stats.schedule} saved artists are now viewable in their own tab on the Plan screen (not merged into your list). ` : ""}Nothing already saved was duplicated.`;
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
  }catch(err){
    note.textContent = "Couldn't read that code — make sure you copied the whole thing, with nothing missing from either end.";
  }
};

// ===============================
// YOUR CHARACTER BUILDER — a persona to introduce yourself to actors
// with, distinct from the in-fiction Characters & Factions roster below.
// ===============================
function renderMyCharacter(){
  const box = document.getElementById("charCardDisplay");
  if(!box) return;
  const c = Store.get("myCharacter");
  if(!c || !c.name){ box.innerHTML = ""; return; }
  box.innerHTML = `
    <div class="char-card">
      <div style="font-size:16px; font-weight:700; color:var(--accent-amber);">${escapeHtml(c.name)}</div>
      <div style="font-size:12px; color:var(--text-muted); text-transform:uppercase; letter-spacing:.05em; margin-top:2px;">${c.district ? escapeHtml(c.district) : "Undecided / floating"}</div>
      ${c.quirk ? `<p style="margin-top:8px; font-size:14px;"><strong>Quirk:</strong> ${escapeHtml(c.quirk)}</p>` : ""}
      ${c.catchphrase ? `<p style="margin-top:6px; font-size:14px; font-style:italic;">"${escapeHtml(c.catchphrase)}"</p>` : ""}
      ${c.backstory ? `<p style="margin-top:6px; font-size:14px; color:var(--text-muted);">${escapeHtml(c.backstory)}</p>` : ""}
    </div>
  `;
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
  renderMyCharacter();
};

loadMyCharacterForm();
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

function renderBingo(){
  const grid = document.getElementById("bingoGrid");
  const generateBtn = document.getElementById("bingoGenerateBtn");
  const lockBtn = document.getElementById("bingoLockBtn");
  const note = document.getElementById("bingoStatusNote");
  if(!grid) return;

  let card = Store.get("bingoCard") || [];
  const locked = !!Store.get("bingoLocked");
  const marked = Store.get("bingoMarked") || [];
  const customInput = document.getElementById("bingoCustomInput");
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
  list.forEach(c=>{
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <strong>${c.name}</strong><br>
      <small>${c.faction} · ${c.where}</small>
      <p style="margin-top:6px; color:var(--text-muted); font-size:14px; line-height:1.5;">${c.blurb}</p>
      <p style="margin-top:6px; color:var(--accent-teal); font-size:12px;">💬 ${c.ask}</p>
    `;
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
          <small>${g.text}</small>
          ${g.link ? `<br><a class="linkbtn" href="${g.link}" target="_blank" rel="noopener">${g.linkLabel}</a>` : ""}
        </div>
        <button>${isDone ? "Done" : "Mark done"}</button>
      </div>
    `;
    div.querySelector(".item-top > button").onclick = ()=>{
      let d = Store.get("involvedDone") || [];
      if(involvedEntryFor(d, g.title)){
        d = d.filter(x=> (typeof x === "string" ? x !== g.title : x.title !== g.title));
      } else {
        d.push({ title: g.title, from: currentContributorName() || undefined });
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
    from: currentContributorName() || undefined,
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

function loadTheories(){
  const entries = Store.get("theories") || [];
  theoriesBox.innerHTML = "";
  entries.slice().reverse().forEach(entry=>{
    const div = document.createElement("div");
    div.className = "update-entry";
    div.innerHTML = `<div class="when">${entry.when}${entry.from ? " · via " + escapeHtml(entry.from) : ""}</div><div>${escapeHtml(entry.text)}</div>`;
    theoriesBox.appendChild(div);
  });
}

document.getElementById("addTheoryBtn").onclick = ()=>{
  const text = theoryInput.value.trim();
  if(!text) return;
  const entries = Store.get("theories") || [];
  entries.push({ text, when: new Date().toLocaleString(), from: currentContributorName() || undefined });
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

function loadQuotes(){
  const entries = Store.get("quotes") || [];
  quotesBox.innerHTML = "";
  entries.slice().reverse().forEach(entry=>{
    const div = document.createElement("div");
    div.className = "update-entry";
    div.innerHTML = `<div class="when">${entry.when}${entry.saidBy ? " · said by " + escapeHtml(entry.saidBy) : ""}${entry.from ? " · logged by " + escapeHtml(entry.from) : ""}</div><div>${escapeHtml(entry.text)}</div>`;
    quotesBox.appendChild(div);
  });
}

document.getElementById("addQuoteBtn").onclick = ()=>{
  const text = quoteInput.value.trim();
  if(!text) return;
  const entries = Store.get("quotes") || [];
  entries.push({ text, saidBy: quoteSaidByInput.value.trim(), from: currentContributorName() || undefined, when: new Date().toLocaleString() });
  Store.set("quotes", entries);
  quoteInput.value = "";
  quoteSaidByInput.value = "";
  loadQuotes();
  if(typeof renderConsolidatedNotes === "function") renderConsolidatedNotes();
};

document.getElementById("copyQuotesBtn").onclick = (e)=>{
  const entries = Store.get("quotes") || [];
  const lines = entries.map(q=>`- "${q.text}"${q.saidBy ? ` — ${q.saidBy}` : ""}`);
  copyText(entries.length ? "Memory journal:\n" + lines.join("\n") : "No quotes saved yet.", e.target);
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

function loadSightings(){
  const entries = Store.get("sightings") || [];
  sightingsBox.innerHTML = "";
  entries.slice().reverse().forEach(entry=>{
    const div = document.createElement("div");
    div.className = "update-entry";
    div.innerHTML = `<div class="when">${entry.when}${entry.source ? " · via " + escapeHtml(entry.source) : ""}${entry.from ? " · logged by " + escapeHtml(entry.from) : ""}</div><div>${escapeHtml(entry.text)}</div>`;
    sightingsBox.appendChild(div);
  });
}

document.getElementById("addSightingBtn").onclick = ()=>{
  const text = sightingInput.value.trim();
  if(!text) return;
  const entries = Store.get("sightings") || [];
  entries.push({ text, source: sightingSourceInput.value.trim(), from: currentContributorName() || undefined, when: new Date().toLocaleString() });
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
    heading: "Memory journal",
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
  const theoryEntries = Store.get("theories") || [];
  const venueEntries = Store.get("hiddenVenues") || [];
  const involved = Store.get("involvedDone") || [];
  const socials = Store.get("customSocials") || [];
  const quoteEntries = Store.get("quotes") || [];
  const sightingEntries = Store.get("sightings") || [];
  const tagPattern = /^\[(.+?)\]\s(.*)$/;

  const byPerson = {};
  function bucket(name){
    const key = name && name.trim() ? name.trim() : "Unassigned";
    if(!byPerson[key]) byPerson[key] = { theories:[], venues:[], clues:[], involved:[], socials:[], quotes:[], sightings:[] };
    return byPerson[key];
  }

  theoryEntries.forEach(t=> bucket(t.from).theories.push(t.text));
  venueEntries.forEach(v=> bucket(v.from).venues.push(`${v.name}${v.near ? ` (near ${v.near})` : ""}`));
  Object.entries(clues).forEach(([district, text])=>{
    String(text).split("\n").map(l=>l.trim()).filter(Boolean).forEach(line=>{
      const m = line.match(tagPattern);
      if(m) bucket(m[1]).clues.push(`${district}: ${m[2]}`);
      else bucket(null).clues.push(`${district}: ${line}`);
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

  return Object.entries(byPerson).map(([name, data])=>({
    heading: name,
    lines: [
      ...data.theories.map(l=>`Theory: ${l}`),
      ...data.venues.map(l=>`Hidden venue: ${l}`),
      ...data.quotes.map(l=>`Quote: ${l}`),
      ...data.sightings.map(l=>`Sighting: ${l}`),
      ...data.clues.map(l=>`District note — ${l}`),
      ...data.involved.map(l=>`Get involved: ${l}`),
      ...data.socials.map(l=>`Social found: ${l}`)
    ]
  })).filter(s=> s.lines.length > 0);
}

let consolidatedViewMode = "person";

function renderConsolidatedNotes(){
  const box = document.getElementById("consolidatedNotes");
  if(!box) return;
  const sections = consolidatedViewMode === "person" ? buildConsolidatedReportByPerson() : buildConsolidatedReport();
  box.innerHTML = sections.map(s=>`
    <div style="margin-top:10px;">
      <div style="font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:var(--accent-teal); margin-bottom:4px;">${escapeHtml(s.heading)}</div>
      <ul class="compact-list">${s.lines.length ? s.lines.map(l=>`<li>${escapeHtml(l)}</li>`).join("") : "<li>Nothing here yet.</li>"}</ul>
    </div>
  `).join("");
}

const copyConsolidatedBtn = document.getElementById("copyConsolidatedBtn");
if(copyConsolidatedBtn) copyConsolidatedBtn.onclick = (e)=>{
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
  { term:"BLIP", def:"Patrick Kahn's new product on Letsbe Avenue, exclusive to VIPPs — what it actually does is part of the mystery." },
  { term:"VIPP", def:"A status/tier referenced in this chapter's BLIP storyline — keep an ear out on-site for what it actually means this year." },
  { term:"Vibe Check", def:"Chapter Five's community-responsibility campaign around wellness, party safety and looking out for your crew." },
  { term:"The Observatory", def:"A genuine 2026 academic research hub on site, led by psychologist Dr Martha Newson, studying identity and behaviour at live events — real research, not story canon." },
  { term:"Lion's Gate Portal", def:"The story's central portal art piece — last chapter's closing ceremony used it to foretell the Lion's Den's return to Temple Valley this year." },
  { term:"Von Vanderland", def:"The fan-built settlement in Copperwood dedicated to Edna Von Vanderhaus and her film 'Race to the Red Planet.'" },
  { term:"inGeniuses", def:"Metropolis workers laid off by Bettercorp™, now running unofficial 'urban explorer' tours into the glitching Betterverse™." }
];

function loadGlossary(){
  document.getElementById("glossaryList").innerHTML = glossary.map(g=>`
    <div class="item"><strong>${g.term}</strong><p style="margin-top:4px; color:var(--text-muted); font-size:14px;">${g.def}</p></div>
  `).join("");
}
loadGlossary();

// ===============================
// FESTIVAL GUIDE
// ===============================
const guideContent = document.getElementById("guideContent");

const chapterFiveGuide = [
  { title:"Chapter Five — the one-page briefing", html:"<p><strong>Then:</strong> The Collector was freed at the 2025 closing ceremony and passed leadership to The Network. <strong>Now:</strong> Mr Biga and Aurora Venturestone have merged their companies into BBXL™ and are pushing a space programme that treats Earth as a ‘single-use planet’. <strong>The pressure point:</strong> BBXL is draining the city’s resources while still attracting citizens into its VIP world. The Network wants a shared, people-led redesign — but that is not yet a victory.</p>" },
  { title:"🧩 This chapter's central question", text:"Chapter Five asks whether The Network can actually hand real power back to the people — or whether BBXL and the districts' own power plays make that impossible. Following the story district to district is how you find out." },
  { title:"A simple way to follow the story", html:"<ul class=\"compact-list\"><li><strong>Start with a side:</strong> Area 404 for power and policing; Botanica for portals, IONA and Shadow Post; Letsbe Avenue for the suspiciously cheerful BLIP product.</li><li><strong>Ask for a motive:</strong> ‘What do you want?’, ‘Who benefits?’, ‘Who should we speak to next?’ works better than hunting for a scripted answer.</li><li><strong>Keep a chain:</strong> person → place → strange phrase → next lead. Add it to the district note straight away, then compare notes as a group.</li><li><strong>Watch the public moments:</strong> announcements, meetings, ceremonies, arguments and queues are often more useful than an empty-looking door.</li></ul>" },
  { title:"🕹 How the story actually works", text:"It's not something you read, it's something you play — closer to immersive theatre than a puzzle with one right answer. Street actors are in character across the whole site; approach them, ask questions, and stay in the fiction as long as you can bear it. They'll usually feed you a lead, a rumour, an object, or point you toward another district or person. Pick up copies of The Daily Rag (the in-universe newspaper) wherever you see them — often the clearest single source of plot for that day. Trade information, do favours, pay with 'Boomtown bucks' if you pick some up, and don't be afraid to lie, bluff or be a bit cheeky — the actors are trained to work with whatever you give them. Some of the best finds come from just opening doors that look like scenery, especially around Oldtown and Metropolis." },
  { title:"🗺 A game plan for the weekend", text:"There's no single fixed path — it branches by who you meet — but this rhythm gets you properly pulled in rather than wandering past it. Wed/Thu (quiet build-up): walk all seven districts once, cold, just to get your bearings and spot which plot grabs you. Friday daytime: the single best window all weekend — quieter, you're not tired or drunk yet, and actors have more time to engage properly. Pick your district and go looking for a person, not a place: a market stall, a bar, a 'closed' door. Fri evening–Sat: once you're in with one district you'll usually get passed sideways to another (Botanica's Network sending you toward Area 404's Guardians, say) — follow it rather than restarting cold elsewhere. Sat/Sun: threads tend to converge and pay off in bigger set-piece scenes — keep an ear out for anything that sounds like a public gathering, announcement or 'trial'. This is general guidance based on how past chapters have run; the exact actors, locations and beats for Chapter Five will only reveal themselves on-site." },
  { title:"🎯 Tips to actually do well", text:"Talk to everyone in costume, not just the obviously theatrical ones — some of the best characters look like ordinary festival staff at first glance. Ask direct questions ('who are you', 'what's going on here', 'who's in charge') — actors are built to answer and redirect you. Revisit the same spot at a different time of day: a 'dead end' at 2pm can be very much alive at 10pm. Write down names and phrases you don't recognise and check them against the Characters and Glossary lists in Discover — half the fun is realising two odd conversations were connected. Go in a small group of 2–3 rather than a big pack, and split up occasionally so you're covering more ground and can compare notes after. Log everything in Discover's clue log per district — you will forget who told you what by day three. And don't expect a tidy ending: threads resolve in scenes, not menus, sometimes as a big public moment, sometimes as a quiet answer from one actor — both count." },
  { title:"🔍 Where to start if you're not sure", text:"Area 404 and Botanica are this chapter's two poles — the deepfake cover-up versus The Network trying to expose it — so starting in either gets you into the main plot fastest. If you'd rather ease in first, Letsbe Avenue's BLIP subplot is lower-stakes and a good warm-up before diving into the bigger factions." },
  { title:"🆘 If you're stuck, or want to see it through", text:"There's no single storyline to solve — it's many overlapping ones, and which you find depends on district, who you talk to, and luck. If a thread goes cold, just ask an actor directly; they're built to nudge you toward the next step rather than leave you hanging. In past chapters, sticking with one district has meant collecting a kind of 'stamp' at each stop, which eventually unlocks a bigger, sometimes intense final scene for that storyline. Don't expect to solve every district in one weekend — most people don't, and the festival's actual ending is a closing ceremony for everyone regardless of how much you've uncovered." },
  { title:"Districts as story threads", html:"<p><strong>Area 404:</strong> a former outsider district now running the city; power is concentrating around the Guardians and Mr Biga. <strong>Botanica:</strong> The Great Mother’s ascension plan sits alongside Temple of Zero’s Shadow Post / IONA photocopier mystery. <strong>Copperwood:</strong> Edna Von Vanderhaus is turning the district into a live film set for <em>Race to the Red Planet</em>. <strong>Oldtown:</strong> Rufus the Red and the Den of Dis Order are building the People’s Republic of Oldtownia. <strong>Metropolis:</strong> Bettercorp’s shiny future has left inGeniuses behind, with risky tours into the broken Betterverse™.</p>" },
  { title:"Ceremonies & city-wide moments", html:"<p>The opening and closing ceremonies are the official bookends of the chapter and are worth treating as story events, not merely big shows. Between them, The Daily Rag, district meetings, public broadcasts and characters’ sudden invitations are your best catch-up tools. If you hear a crowd gathering for an announcement, go.</p><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/discover\" target=\"_blank\" rel=\"noopener\">Official story & districts</a>" },
  { title:"🆕 What's new this chapter", text:"The Lion's Den returns to the Temple Valley amphitheatre, Hilltop is now a live music hub, Hydro XL becomes a hydrogen-powered flagship stage expanded and relocated to Downtown, and a new Thrutopia zone brings talks, workshops and rest space. There's also a community 'Cloak of Hope' project, a genuine on-site Observatory research study, and open Thrutopia workshop submissions — see Get Involved in Discover." },
  { title:"Non-music things actually worth pencilling in", html:"<ul class=\"compact-list\"><li><strong>Thrutopia:</strong> talks, workshops and thoughtful daytime programming around imagining better futures.</li><li><strong>The Retreat:</strong> massages, hot tubs, sauna/cold splash, sound baths, beauty and maker sessions. It is in the Thrutopia woodlands; book ahead for the most popular slots.</li><li><strong>Cloak of Hope:</strong> stitch a 10–15cm hope patch on-site for the collective artwork.</li><li><strong>Agents of Change:</strong> sign up for the badge, HQ, recycled-T-shirt screen print and early quest access.</li><li><strong>The Observatory:</strong> take part in a genuine 2026 academic study on identity and behaviour at live events, led by Dr Martha Newson.</li><li><strong>Reparium:</strong> it debuted as a free volunteer repair hub in 2025; look out for its return if gear needs rescuing.</li></ul>" },
  { title:"The Retreat — quick booking guide", html:"<p>Current listings include 90-minute spa/hot-tub access (£50), sauna and cold splash (£35), sound baths (£20), massages from £68, plus clay and silver workshops. Bring swimwear for the water/heat sessions; towel rental is available. It is separate from the festival ticket and the official advice is to book early.</p><a class=\"linkbtn\" href=\"https://www.boomtownfair.co.uk/the-retreat\" target=\"_blank\" rel=\"noopener\">Browse & book The Retreat</a>" },
  { title:"🕵 Hidden venues, shops & the full directory", text:"Beyond the 18 named stages, 40+ confirmed hidden venues, shops, workshops and support spaces are scattered through the districts, plus a handful of past-chapter names with no 2026 evidence — deliberately unlisted anywhere on an official map. The Map tab now has the full filterable confirmed/rumoured directory with genre and info for every one we could source, alongside the schematic itself." },
  { title:"🎟 Set times & clashes", text:"Boomtown holds its own official timetable back until a few days before gates open, so the Fri/Sat times in this app are early and subject to change. Once the official app confirms things, use 'Set time' on any saved act in Plan to correct it — the Clashes view flags overlaps automatically." },
  { title:"🎫 Tickets & resale", text:"Boomtown 2026 sold out during its initial release. If you're still after a ticket, resale runs exclusively through the official Kaboodle account system — never buy from unofficial resale sites or social media listings, as tickets are registered to the original buyer and unofficial transfers can be refused entry." },
  { title:"🚆 Getting there", text:"South Western Railway runs from London Waterloo to Winchester in about an hour, with a shuttle to site. National Express also runs direct coaches from 50+ UK locations. Boomtown is sold out for 2026; resale runs through the official Kaboodle account." },
  { title:"💳 Cashless", text:"Boomtown runs on cashless RFID wristbands — top up before or on arrival. Check the official 'Cash Free Support' page linked from the main site if your top-up doesn't go through." },
  { title:"🎒 First-timer basics", text:"18+ only, five days of camping on working farmland in the South Downs — expect mud if it rains, so pack wellies alongside festival gear. Gates open Wednesday lunchtime with music from early afternoon." },
  { title:"⛺ Camping field guide", text:"The site splits roughly into two halves either side of a big central hill: Downtown (west) and Hilltop (east) — worth knowing which half you're in before you start walking. West Camping and Downtown Camping sit nearest West Gate and the public transport hub, handy if you arrived by coach or shuttle. Meadow Camping is the accessible campsite — apply in advance if you need it, spaces are limited and prioritised for accessibility bookings. Valley and Temple Valley Camping sit toward Hilltop, closer to that side's stages. East Camping and Campervan Field are nearest East Gate and the car parks. Quiet Camping is set apart for those wanting more sleep. Standard fields aren't numbered, so pick a landmark (a flag, a food stall, a distinctive tree) and save it in Notes so you can find your tent at 2am." },
  { title:"🛟 Welfare & safety", text:"Welfare centres on site have trained staff for support with anything from feeling overwhelmed to drug/alcohol concerns, bereavement or eating disorders — just walk in. Safer Spaces (sexual harassment, assault, domestic violence support) is based in Pepperpot Market and also roams the site. Blink Mental Health, plus on-site Cocaine Anonymous and Narcotics Anonymous meetings, are also confirmed for Chapter Five. Zero tolerance on illegal drugs — amnesty points near entry let you dispose of anything before you're searched, no questions asked." },
  { title:"🚫 What not to bring", text:"Illegal drugs and NPS (zero tolerance), aerosol paint cans, and — once you've brought your first lot of alcohol in — no topping up on re-entry. Unsealed or unidentifiable e-cigarette liquid can also be confiscated. Check the official Safety page for the full current list before you pack." },
  { title:"♻️ Sustainability", text:"Boomtown runs a leave-no-trace, no-litter policy — take your tent and rubbish home with you (there's an Eco Bond scheme to encourage it). No single-use plastic bottles on site; free water refill points are dotted around arenas and campsites, so bring a reusable bottle. Food stalls use compostable packaging only. The Reparium repair hub and on-site Permaculture and Energy Garden spaces are part of the same push." },
  { title:"🧭 Vibe Check — this chapter's community campaign", text:"Chapter Five's community-responsibility campaign, covering wellness, party safety and looking out for your crew. In practice: agree a plan with your group for if someone's had too much, check in on people who look lost or unwell even if you don't know them, and use welfare or Safer Spaces early rather than waiting for a crisis." },
  { title:"📍 Meeting up", text:"Agree a clear meeting point before you split up and save it in the Map tab. Don't rely on having signal to find each other — it's patchy on-site." },
  { title:"🔋 Power", text:"Bring a charged power bank — this app and your photos are the main drain. Screens go dim fast in daylight, check brightness before you head out." },
  { title:"📲 Using this companion", text:"This is a self-contained web page, not an app-store app — Add to Home Screen (iOS Safari) or 'Install app' (Android Chrome) gives it a proper icon and offline access. Everything you save (Plan, Discover notes, hidden-venue log) stays on this device only; use the copy buttons in Discover and Map to share progress with your group." },
  { title:"🤝 Getting one shared copy for the group", text:"Each phone saves its own data separately. To end up with one file that has everyone's notes, theories, hidden-venue finds and ticks in it: add your name and copy a Sync code in Discover, send it to a teammate, they paste and merge it in (nothing gets duplicated), and repeat round the group. Whoever's phone ends up with everyone merged in is the one to hit 'Download a copy with our updates' on — that file is the group's master copy, and Discover's Consolidated Notes card shows you everything that's in it at a glance before you do." },
  { title:"♿ Accessibility", text:"Boomtown runs an access scheme via Nimbus Access Card — apply with a valid Access Card number through the official Boomtown Accessibility Request Form; free Essential Companion (+1) tickets are available for anyone who qualifies. Packs can include an accessibility wristband, raised-viewing-platform access, an EC lanyard and an accessibility map. Note: the standard 2026 request deadline was 1 July — if you're reading this after that and still need access support, contact Boomtown's accessibility team directly rather than assuming you've missed out entirely, as late/on-the-day requests are sometimes still possible. Viewing platforms (with wheelchair charging and a nearby wide-access toilet) are first come, first served for access customers and their PA — expect stage names attached to specific platforms to have shifted with this chapter's redesign." },
  { title:"🎡 Fairground &amp; leisure", text:"Beyond the stages, expect a scattering of fairground and leisure attractions — Boomtown's own 2026 guide confirms a chair-o-plane ride near Area 404/Downtown, and past chapters have run a retro amusements arcade and vintage fairground rides (waltzers and similar) elsewhere on site. Treat the wider fairground as a strong likelihood rather than a locked-in promise until you see it. The full rundown, with what's confirmed vs rumoured, is in the venue directory on the Map tab." }
];

function loadGuide(){
  guideContent.innerHTML = "";
  chapterFiveGuide.forEach(section=>{
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h3>${section.title}</h3>${section.html || `<p>${section.text}</p>`}`;
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

// Building the snapshot HTML is shared by all three buttons below — the
// download itself needs three fallbacks because a sandboxed viewer (like
// an embedded preview) can silently block a plain <a download> click.
function buildSnapshotHtml(){
  const saved = Object.fromEntries(Object.keys(DEFAULTS).map(key=>[key, Store.get(key)]));
  const data = JSON.stringify(saved).replace(/</g, "\\u003c");
  const seedScript = `<script>window.__boomtownSavedData=${data};<\/script>`;
  return document.documentElement.outerHTML.replace("</head>", `${seedScript}</head>`);
}

document.getElementById("downloadSnapshot").onclick = ()=>{
  const note = document.getElementById("downloadStatusNote");
  try{
    const blob = new Blob([buildSnapshotHtml()], { type:"text/html;charset=utf-8" });
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

document.getElementById("openSnapshotTab").onclick = ()=>{
  const note = document.getElementById("downloadStatusNote");
  try{
    const blob = new Blob([buildSnapshotHtml()], { type:"text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if(!win) throw new Error("popup blocked");
    note.textContent = "Opened in a new tab — use that tab's own save/share/print-to-PDF option to keep a copy.";
  }catch(err){
    note.textContent = "That was blocked too (likely a popup blocker, or this viewer doesn't allow it) — try 'copy the whole file as text' below.";
  }
};

document.getElementById("copySnapshotHtml").onclick = (e)=>{
  copyText(buildSnapshotHtml(), e.target);
  const note = document.getElementById("downloadStatusNote");
  note.textContent = "Copied the entire file as text — paste it into a plain text editor and save it with a .html extension.";
};
