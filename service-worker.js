<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

<title>Boomtown Companion 2026</title>

<!-- PWA manifest -->
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#0b1512">
<meta name="background-color" content="#0b1512">

<!-- iOS "Add to Home Screen" support -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Boomtown 26">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="152x152" href="icons/icon-152.png">
<link rel="apple-touch-icon" sizes="167x167" href="icons/icon-167.png">
<link rel="apple-touch-icon" sizes="180x180" href="icons/icon-180.png">

<!-- Android / Chrome -->
<meta name="mobile-web-app-capable" content="yes">

<!-- Favicons -->
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="icons/favicon-16.png">

<!-- Styles -->
<link rel="stylesheet" href="css/style.css">

<!--
  Seed script — DO NOT hand-edit this to a real snapshot.
  This must always stay {} in the copy of index.html that lives in the
  shared GitHub repo, because every user's browser loads this exact file.
  If it ever contains real saved values (a meeting point, notes, a
  schedule, etc.) that data becomes every visitor's fallback/default
  the first time they open the app — effectively leaking one person's
  personal data to everyone.
  The only legitimate way this placeholder gets populated with real
  data is client-side, inside a file a user generates for themselves via
  "Download a copy with our updates" (see buildSnapshotHtml() in
  js/app.js) — never inside the master index.html that gets committed.
-->
<script>window.__boomtownSavedData={};</script>
</head>
<body style="padding-bottom: 156px;">

<header class="appbar">
  <div class="titles">
    <h1>Boomtown 26</h1>
    <div>Chapter Five: Radical Redesign · 12–16 Aug</div>
  </div>
  <span class="status-pill" id="status">🟢 Offline ready</span>
</header>

<main>

  <!-- HOME -->
  <section id="home" class="screen active">
    <div class="eyebrow">Made for our weekend</div>
    <h2 style="margin-bottom:14px;">Our Boomtown</h2>

    <div class="ticket">
      <h3>Next saved event</h3>
      <div id="next-event">Nothing saved yet</div>
    </div>

    <div class="card">
      <h3>Countdown</h3>
      <div id="countdownText" class="empty-note"><span style="font-size:22px; font-weight:700; color:var(--accent-amber);">19d 6h 9m</span><br>until gates open (Wed 12 Aug, approx. lunchtime)</div>
    </div>

    <div class="card">
      <span class="tag">Read this once</span>
      <h3>💾 Your data &amp; backups</h3>
      <p>Everything you save here — Plan, Discover notes, theories, hidden-venue finds, HQ notes, custom social links — saves itself to this browser on this device the instant you type or tap. There's no separate save button because it's already saved; you'll never lose anything by just closing the tab.</p>
      <p>The catch: it's tied to this exact page in this exact browser. It won't be there if you open a private/incognito window, clear site data, switch browsers, or use a different device — nothing syncs between phones automatically.</p>
      <p>To back it up: use <strong>"Download a copy with our updates"</strong> in Settings, right at the bottom of this page. It bakes everything saved so far into a new file that already has your data in it when reopened — keep it as a backup. Worth doing every so often, and definitely before you set off.</p>
      <p>To combine everyone's info into one file without duplicating anything: use <strong>Sync</strong> in Discover — it turns your notes, theories, hidden-venue finds and more into a short code your teammates paste in and merge. Once one phone has everyone's code merged in, download a copy from that phone as the group's master file.</p>
      <p>Your <strong>Plan</strong> (saved artists) rides along in that same sync code now too, but it never merges into your own list — a teammate's saved lineup lands in its own tab, named after them, at the top of the Plan screen. Your list only ever has your own picks in it; theirs is there to look at, not to combine.</p>
    </div>

    <div class="card">
      <span class="tag">Read this once</span>
      <h3>🔄 Updates, Offline Use &amp; Your Data</h3>
      <p><strong>App updates:</strong> this app is a set of files sitting in a GitHub repo. When that repo gets updated and you have signal, your installed copy notices in the background, quietly downloads the new files, and reloads once — no reinstall, no App Store, nothing to tap. Updates only ever replace the app itself (screens, guide content, styling, this text); they cannot see or touch what's saved on your phone.</p>
      <p><strong>Your progress stays yours:</strong> your Plan, notes, HQ log, hidden-venue finds, bingo card and everything else lives only in this browser's storage on this device. A GitHub update can never combine your saved data with anyone else's, and it can't reset or overwrite it either — it only touches code and content files, never your local data.</p>
      <p><strong>Offline use:</strong> once the app has loaded with signal one time, the service worker has cached every screen, so it keeps working with none at all — browsing, saving and editing everything. Nothing here needs a connection except the external links out to Instagram, the app stores, etc. If a GitHub update lands while you're offline, it'll just sit there and download itself next time you get signal.</p>
      <p><strong>If you've been offline and want to combine devices:</strong> this app never merges devices automatically. To bring two phones' info together, use <strong>Sync</strong> in Discover — it's a manual, one-way-at-a-time code you paste in. It adds new shared entries (notes, theories, venue finds) without duplicating, and it now carries each person's saved-artist Plan along too — but that always lands in its own named tab on the Plan screen, never merged into your own list. It never touches personal things like your HQ notes or bingo card at all.</p>
      <p><strong>Back up before a big update:</strong> if you're not sure whether an update is coming, it costs nothing to be safe — use <strong>"Download a copy with our updates"</strong> in Settings first. That saves everything on this device into a file you keep, just in case.</p>
    </div>

    <div class="card">
      <h3>Your stats</h3>
      <div id="statsRow" style="display:flex; gap:10px; flex-wrap:wrap;">
    <div class="stat"><b>0</b>Artists saved</div>
    <div class="stat"><b>0/7</b>Districts visited</div>
    <div class="stat"><b>0</b>Hidden venues logged</div>
  </div>
    </div>

    <div class="card">
      <h3>Links worth keeping</h3>
      <p>The official app has the real timetable and surveyed map. These socials post lineup drops and in-character story updates. Some individual venues run their own accounts too — see below for the ones that have been verified.</p>
      <a class="linkbtn" href="https://apps.apple.com/gb/app/boomtown-festival/id6504767448" target="_blank" rel="noopener">iOS app</a>
      <a class="linkbtn" href="https://play.google.com/store/apps/details?id=uk.co.boomtownfair.events.android" target="_blank" rel="noopener">Android app</a>
      <a class="linkbtn" href="https://www.instagram.com/boomtownfairofficial/" target="_blank" rel="noopener">Instagram</a>
      <a class="linkbtn" href="https://x.com/BoomtownFair" target="_blank" rel="noopener">X / Twitter</a>
      <a class="linkbtn" href="https://www.facebook.com/boomtownofficial" target="_blank" rel="noopener">Facebook</a>
      <a class="linkbtn" href="https://www.boomtownfair.co.uk/discover" target="_blank" rel="noopener">Story &amp; districts</a>
      <a class="linkbtn" href="https://www.boomtownfair.co.uk/news" target="_blank" rel="noopener">Official news</a>
    </div>

    <div class="card">
      <h3>Story &amp; venue socials</h3>
      <p>Individual venue accounts aren't centrally listed and change year to year. Here's what's been verified by hand:</p>
      <a class="linkbtn" href="https://www.instagram.com/boomtownbobbies/" target="_blank" rel="noopener">Boomtown Bobbies</a>
      <a class="linkbtn" href="https://www.instagram.com/mr.biga/" target="_blank" rel="noopener">Mr Biga</a>
      <a class="linkbtn" href="https://www.instagram.com/acidleakboomtown/" target="_blank" rel="noopener">Acid Leak</a>
      <a class="linkbtn" href="https://www.instagram.com/hotel_paradiso_boomtown/" target="_blank" rel="noopener">Hotel Paradiso</a>
      <a class="linkbtn" href="https://www.instagram.com/shamrock_boomtown/" target="_blank" rel="noopener">Shamrock</a>
      <a class="linkbtn" href="https://www.instagram.com/postal_posse/" target="_blank" rel="noopener">Postal Posse</a>
      <a class="linkbtn" href="https://www.instagram.com/soapranos_laundrette/" target="_blank" rel="noopener">Soapranos</a>
      <a class="linkbtn" href="https://www.instagram.com/theinconveniencestore_uk/" target="_blank" rel="noopener">The Inconvenience Store</a>
      <a class="linkbtn" href="https://www.instagram.com/botanica_zoo/" target="_blank" rel="noopener">Botanica Zoo</a>
      <a class="linkbtn" href="https://www.instagram.com/gabber.kebabber/" target="_blank" rel="noopener">Gabber Kebabber</a>
      <a class="linkbtn" href="https://www.instagram.com/littlepharmaboomtown/" target="_blank" rel="noopener">Little Pharma</a>
      <a class="linkbtn" href="https://www.instagram.com/yeswepatrickkahn/" target="_blank" rel="noopener">Patrick Kahn (BLIP)</a>
      <a class="linkbtn" href="https://www.instagram.com/betterverse_/" target="_blank" rel="noopener">Bettercorp™ / Betterverse</a>
      <a class="linkbtn" href="https://www.instagram.com/hangar_161/" target="_blank" rel="noopener">Hangar 161</a>
      <a class="linkbtn" href="https://www.instagram.com/tribeoffrog/" target="_blank" rel="noopener">Tribe of Frog</a>
      <p class="empty-note" style="margin-top:10px;">No other dedicated accounts found for the remaining venues — worth a re-check nearer the date. Spot one live? Add it below.</p>
      <div class="field" style="margin-top:10px;"><label>Add an account you've found</label><input type="text" id="newSocialName" placeholder="e.g. Great Mother's Temple"></div>
      <div class="field"><input type="text" id="newSocialUrl" placeholder="Instagram / X link"></div>
      <button class="action" id="addSocialBtn">Save link</button>
      <div id="customSocialsList" style="margin-top:10px;"></div>
    </div>

    <div class="card">
      <h3>Our little HQ</h3>
      <p>Boomtown campsites aren't numbered, so jot down a landmark instead — nearest flag, row letter, campsite zone, whatever you'll actually spot at 2am. Also a good spot for meeting points and anything else you don't want to forget.</p>
      <textarea id="notes" placeholder="e.g. Yellow campsite, near the big oak past the water point
Meet at the clock tower if separated"></textarea>
    </div>
  <div class="card">
  <h3>⚙️ Settings</h3>
  <p>Reset saved favourites, plans, notes and district passport on this device. See "Your data &amp; backups" above for how saving and downloading actually works.</p>
  <button class="action" id="downloadSnapshot">Download a copy with our updates</button>
  <button class="ghost" id="openSnapshotTab" style="margin-top:6px;">If that didn't download: open it in a new tab</button>
  <button class="ghost" id="copySnapshotHtml" style="margin-top:6px;">Still stuck: copy the whole file as text</button>
  <p class="empty-note" id="downloadStatusNote" style="margin-top:8px;"></p>
  <button class="action danger" id="resetApp" style="margin-top:10px;">Reset app</button>
</div></section>

  <!-- ARTISTS -->
  <section id="artists" class="screen">
    <div class="eyebrow">Lineup</div>
    <h2 style="margin-bottom:14px;">Artists</h2>
    <input type="text" id="artistSearch" placeholder="Browsing all 1173 artists — use a genre chip or search to narrow it down">
    <div class="stagelist" id="genreChips" style="margin:10px 0 0;"><span class="chip" data-g="Acid / Techno">Acid / Techno</span><span class="chip" data-g="Alt / Punk / Metal">Alt / Punk / Metal</span><span class="chip" data-g="Bass / Alt">Bass / Alt</span><span class="chip" data-g="Bass / D&amp;B">Bass / D&amp;B</span><span class="chip" data-g="Bass / Drum &amp; Bass">Bass / Drum &amp; Bass</span><span class="chip" data-g="Bass / Dub / Jungle">Bass / Dub / Jungle</span><span class="chip" data-g="Bass / Hardstyle">Bass / Hardstyle</span><span class="chip" data-g="Bass / Party">Bass / Party</span><span class="chip" data-g="Bass / Rave">Bass / Rave</span><span class="chip" data-g="Breaks / Big Beat">Breaks / Big Beat</span><span class="chip" data-g="Cabaret / Variety">Cabaret / Variety</span><span class="chip" data-g="D&amp;B / Reggae / Headline">D&amp;B / Reggae / Headline</span><span class="chip" data-g="Dub / Bass">Dub / Bass</span><span class="chip" data-g="Dubstep / Bass">Dubstep / Bass</span><span class="chip" data-g="Eclectic / DJ">Eclectic / DJ</span><span class="chip" data-g="Folk / Balkan / Party">Folk / Balkan / Party</span><span class="chip" data-g="Hardcore / Gabber">Hardcore / Gabber</span><span class="chip" data-g="House / Dance">House / Dance</span><span class="chip" data-g="House / Techno">House / Techno</span><span class="chip" data-g="Irish Folk / Trad">Irish Folk / Trad</span><span class="chip" data-g="Live / Alternative">Live / Alternative</span><span class="chip" data-g="Party / Playback Sets">Party / Playback Sets</span><span class="chip" data-g="Party / Variety">Party / Variety</span><span class="chip" data-g="Psytrance / Trance">Psytrance / Trance</span><span class="chip" data-g="Swing / Variety">Swing / Variety</span><span class="chip" data-g="Techno / Electro">Techno / Electro</span><span class="chip" data-g="World / Eclectic">World / Eclectic</span></div>
    <p class="empty-note" style="margin:10px 0;">Full Wed–Sun times below, sourced from Clashfinder's crowd-maintained Boomtown 26 schedule and cross-checked after Boomtown posted official day splits/set times in the app. Most end times are real, not estimated — anything still marked <strong>(est.)</strong> wasn't in that source and is guessed as "until the next act on that stage." Always worth a final check against the official app once you're on-site, especially for anything added or changed last-minute.</p>
    <div class="viewtoggle" id="artistsViewToggle">
      <button class="active" id="artistsViewListBtn">List / search</button>
      <button id="artistsViewTimelineBtn">Timeline by stage</button>
    </div>

    <details class="card" id="genreGuideCard" style="margin-bottom:12px;">
      <summary style="cursor:pointer; font-weight:700; color:var(--accent-teal);">🎧 Genre guide — what each tag actually sounds like</summary>
      <div id="genreGuideList" style="margin-top:10px;"></div>
    </details>

    <div id="artistsListView">
    <div id="artistResults"><p class="empty-note">Start typing a name, stage or genre — or tap a genre chip above — to search 1173+ acts across all 5 days.</p></div>
    </div>

    <div id="artistsTimelineView" style="display:none;">
      <div class="stagelist" id="artistTimelineDayTabs" style="margin-bottom:10px;"></div>
      <p class="empty-note" style="margin-bottom:8px;">Scroll down for time, sideways for stage. Each block is one set — tap it to save or unsave.</p>
      <div class="timeline-outer" id="artistTimelineOuter"><div id="artistTimelineGrid"></div></div>
    </div>

    <div class="card">
      <h3>Add an artist or clash</h3>
      <p>Spotted a name on the app that's missing here, or a secret-venue act? Add it — it'll show up in search and can be saved to your Plan.</p>
      <div class="field"><label>Name</label><input type="text" id="newArtistName" placeholder="Act name"></div>
      <div class="row2">
        <div class="field"><label>Stage</label><input type="text" id="newArtistStage" placeholder="e.g. Hidden Woods"></div>
        <div class="field"><label>Genre</label><input type="text" id="newArtistGenre" placeholder="e.g. Techno"></div>
      </div>
      <button class="action" id="addArtistBtn">Add to lineup</button>
    </div>
  </section>

  <!-- PLAN -->
  <section id="plan" class="screen">
    <div class="eyebrow">Your timetable</div>
    <h2 style="margin-bottom:14px;">My Boomtown</h2>

    <div class="stagelist" id="planPersonTabs" style="display:none; margin-bottom:12px;"></div>
    <p class="empty-note" id="planPersonNote" style="display:none; margin-bottom:10px;"></p>

    <div class="viewtoggle">
      <button class="active" id="viewListBtn">List</button>
      <button id="viewClashBtn">Clashes</button>
      <button id="viewTimelineBtn">Timeline</button>
    </div>
    <div id="nowNextBanner"></div>
    <div id="scheduleList"><div class="card"><p class="empty-note">No saved artists yet. Add some from the Artists tab.</p></div></div>

    <div id="planTimelineView" style="display:none;">
      <div class="stagelist" id="planTimelineDayTabs" style="margin:10px 0;"></div>
      <div class="timeline-outer" id="planTimelineOuter"><div id="planTimelineGrid"></div></div>
    </div>

    <button class="ghost" id="copyPlanBtn" style="margin-top:12px;">Copy plan as text</button>
    <button class="action" id="browseAllArtistsBtn" style="margin:12px 0 0 8px;">Browse all artists</button>
  </section>

  <!-- MAP -->
  <section id="mapscreen" class="screen">
    <div class="eyebrow">Find your way</div>
    <h2 style="margin-bottom:14px;">Map</h2>
    <p class="empty-note" style="margin-bottom:10px;">An illustrated schematic, not the official surveyed map — venue positions inside the city are illustrative, especially with this chapter's redesign. Pinch or use the +/− buttons to zoom in, drag to pan around. Grab a printed map or use the official app on-site for real navigation.</p>
    <div class="stagelist" id="mapLayerToggles" style="margin-bottom:8px;">
      <span class="chip active" data-layer="minor">Other stages</span>
      <span class="chip active" data-layer="secret">Hidden venues &amp; things to find</span>
      <span class="chip active" data-layer="camp">Camping labels</span>
      <span class="chip active" data-layer="landmark">Landmarks</span>
    </div>
    <div id="map">
    <div id="mapInner" style="transform: translate(0px, 0px) scale(1);">
    <svg class="map-bg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <pattern id="grassTex" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
          <rect width="5" height="5" fill="none"></rect>
          <line x1="0.8" y1="5" x2="0.5" y2="2.6" stroke="rgba(255,255,255,0.05)" stroke-width="0.25"></line>
          <line x1="2.6" y1="5" x2="3" y2="2.3" stroke="rgba(0,0,0,0.10)" stroke-width="0.25"></line>
          <line x1="4.2" y1="5" x2="3.9" y2="2.8" stroke="rgba(255,255,255,0.04)" stroke-width="0.25"></line>
        </pattern>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="url(#grassTex)"></rect>
      <path d="M -5 38 Q 50 18 105 42" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.6"></path>
      <path d="M -5 68 Q 50 52 105 72" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="0.6"></path>
      <path d="M 5 45 C 5 25 15 10 30 8 C 45 4 55 2 65 8 C 80 10 90 18 95 30 C 98 40 97 55 90 65 C 85 80 75 90 60 93 C 45 95 30 92 18 82 C 8 70 5 58 5 45 Z" fill="none" stroke="rgba(143,168,156,0.3)" stroke-width="0.5" stroke-dasharray="2 2"></path>
      <g transform="translate(96.6 50.0) rotate(90)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(242,168,60,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(96.8 61.3) rotate(104)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(242,168,60,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(91.4 71.3) rotate(118)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(45,168,242,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(86.2 81.4) rotate(132)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(45,168,242,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(76.6 87.8) rotate(145)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(242,168,60,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(67.2 94.4) rotate(159)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(242,168,60,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(55.7 95.7) rotate(173)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(242,168,60,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(44.2 97.2) rotate(187)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(45,168,242,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(33.3 93.1) rotate(201)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(45,168,242,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(22.4 89.2) rotate(215)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(242,168,60,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(14.7 80.7) rotate(228)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(242,168,60,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(6.8 72.2) rotate(242)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(242,168,60,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(4.1 61.1) rotate(256)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(45,168,242,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(1.2 50.0) rotate(270)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(45,168,242,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(4.0 38.9) rotate(284)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(242,168,60,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(6.6 27.7) rotate(298)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(242,168,60,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(14.4 19.1) rotate(312)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(242,168,60,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(23.8 12.8) rotate(325)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(45,168,242,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(33.1 6.4) rotate(339)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(45,168,242,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(44.4 5.1) rotate(353)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(242,168,60,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(55.8 3.6) rotate(367)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(242,168,60,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(66.4 7.6) rotate(381)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(242,168,60,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(77.2 11.4) rotate(395)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(45,168,242,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(84.7 19.8) rotate(408)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(45,168,242,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(92.5 28.2) rotate(422)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(242,168,60,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g><g transform="translate(95.2 39.1) rotate(436)">
    <path d="M -1.3 1 L 0 -1.3 L 1.3 1 Z" fill="rgba(242,168,60,0.22)" stroke="rgba(238,246,241,0.35)" stroke-width="0.14"></path>
    <path d="M 0 -1.3 L 0 1" stroke="rgba(238,246,241,0.3)" stroke-width="0.1"></path>
    <path d="M -1.3 1 L -1.9 1.4 M 1.3 1 L 1.9 1.4" stroke="rgba(238,246,241,0.2)" stroke-width="0.08"></path>
  </g>
      <path d="M 35.4 28.0 Q 35.4 28.0 33.9 32.0 Q 32.3 36.0 27.2 36.8 Q 22.2 37.6 17.7 37.3 Q 13.3 37.1 9.6 34.6 Q 5.8 32.0 5.6 27.9 Q 5.4 23.8 9.6 21.8 Q 13.9 19.8 18.6 16.8 Q 23.2 13.8 27.8 16.8 Q 32.4 19.9 33.9 23.9 Z" fill="rgba(230,196,120,0.10)" stroke="rgba(242,168,60,0.35)" stroke-width="0.4" stroke-dasharray="1.4 1.6"></path><path d="M 55.3 20.0 Q 55.3 20.0 52.5 23.8 Q 49.7 27.7 45.4 30.7 Q 41.1 33.6 34.8 33.2 Q 28.6 32.7 25.0 28.7 Q 21.3 24.7 22.5 20.3 Q 23.7 15.9 27.0 12.8 Q 30.3 9.6 35.6 8.5 Q 40.8 7.4 45.3 9.8 Q 49.8 12.3 52.6 16.1 Z" fill="rgba(230,196,120,0.10)" stroke="rgba(242,168,60,0.35)" stroke-width="0.4" stroke-dasharray="1.4 1.6"></path><path d="M 75.2 16.0 Q 75.2 16.0 71.2 19.7 Q 67.2 23.3 62.9 25.4 Q 58.6 27.5 53.3 27.2 Q 47.9 26.9 46.1 23.1 Q 44.3 19.3 43.1 15.7 Q 41.9 12.0 44.3 7.7 Q 46.7 3.5 52.6 4.3 Q 58.5 5.1 62.8 6.9 Q 67.2 8.7 71.2 12.3 Z" fill="rgba(230,196,120,0.10)" stroke="rgba(242,168,60,0.35)" stroke-width="0.4" stroke-dasharray="1.4 1.6"></path><path d="M 87.1 26.0 Q 87.1 26.0 85.9 29.5 Q 84.7 33.0 80.4 34.2 Q 76.1 35.5 71.7 35.3 Q 67.3 35.1 63.6 32.6 Q 59.8 30.0 60.0 26.1 Q 60.2 22.1 63.7 19.4 Q 67.1 16.7 71.6 16.7 Q 76.1 16.8 80.3 17.9 Q 84.6 19.1 85.9 22.5 Z" fill="rgba(230,196,120,0.10)" stroke="rgba(242,168,60,0.35)" stroke-width="0.4" stroke-dasharray="1.4 1.6"></path><path d="M 95.0 52.0 Q 95.0 52.0 92.6 55.3 Q 90.1 58.6 86.6 62.1 Q 83.1 65.5 76.8 65.1 Q 70.6 64.7 67.0 60.7 Q 63.3 56.7 64.9 52.5 Q 66.5 48.2 69.0 44.4 Q 71.5 40.5 77.3 39.4 Q 83.1 38.3 86.5 41.9 Q 90.0 45.5 92.5 48.7 Z" fill="rgba(230,196,120,0.10)" stroke="rgba(242,168,60,0.35)" stroke-width="0.4" stroke-dasharray="1.4 1.6"></path><path d="M 76.9 66.0 Q 76.9 66.0 73.2 69.1 Q 69.6 72.3 66.1 74.9 Q 62.6 77.4 57.3 77.2 Q 51.9 76.9 50.1 73.1 Q 48.3 69.3 47.6 65.8 Q 46.8 62.3 50.4 60.0 Q 53.9 57.8 58.3 55.9 Q 62.7 54.0 66.1 56.9 Q 69.4 59.9 73.1 62.9 Z" fill="rgba(230,196,120,0.10)" stroke="rgba(242,168,60,0.35)" stroke-width="0.4" stroke-dasharray="1.4 1.6"></path><path d="M 52.8 68.0 Q 52.8 68.0 47.9 71.0 Q 43.1 73.9 39.6 75.7 Q 36.1 77.4 31.7 77.2 Q 27.3 77.1 23.6 74.5 Q 19.8 72.0 20.5 68.2 Q 21.1 64.3 23.7 61.0 Q 26.3 57.6 31.3 57.6 Q 36.3 57.7 42.6 58.0 Q 48.9 58.2 50.8 63.1 Z" fill="rgba(230,196,120,0.10)" stroke="rgba(242,168,60,0.35)" stroke-width="0.4" stroke-dasharray="1.4 1.6"></path>
      <path d="M 48 42 L 38 20" fill="none" stroke="rgba(196,158,110,0.22)" stroke-width="0.4" stroke-dasharray="0.3 1.2" stroke-linecap="round"></path><path d="M 28 46 L 20 28" fill="none" stroke="rgba(196,158,110,0.22)" stroke-width="0.4" stroke-dasharray="0.3 1.2" stroke-linecap="round"></path><path d="M 66 44 L 80 52" fill="none" stroke="rgba(196,158,110,0.22)" stroke-width="0.4" stroke-dasharray="0.3 1.2" stroke-linecap="round"></path><path d="M 18 62 L 34 68" fill="none" stroke="rgba(196,158,110,0.22)" stroke-width="0.4" stroke-dasharray="0.3 1.2" stroke-linecap="round"></path><path d="M 24 78 L 34 68" fill="none" stroke="rgba(196,158,110,0.22)" stroke-width="0.4" stroke-dasharray="0.3 1.2" stroke-linecap="round"></path><path d="M 52 56 L 60 66" fill="none" stroke="rgba(196,158,110,0.22)" stroke-width="0.4" stroke-dasharray="0.3 1.2" stroke-linecap="round"></path><path d="M 66 60 L 60 66" fill="none" stroke="rgba(196,158,110,0.22)" stroke-width="0.4" stroke-dasharray="0.3 1.2" stroke-linecap="round"></path><path d="M 40 42 L 38 20" fill="none" stroke="rgba(196,158,110,0.22)" stroke-width="0.4" stroke-dasharray="0.3 1.2" stroke-linecap="round"></path><path d="M 14 50 L 20 28" fill="none" stroke="rgba(196,158,110,0.22)" stroke-width="0.4" stroke-dasharray="0.3 1.2" stroke-linecap="round"></path><path d="M 58 30 L 56 16" fill="none" stroke="rgba(196,158,110,0.22)" stroke-width="0.4" stroke-dasharray="0.3 1.2" stroke-linecap="round"></path><path d="M 44 52 L 34 68" fill="none" stroke="rgba(196,158,110,0.22)" stroke-width="0.4" stroke-dasharray="0.3 1.2" stroke-linecap="round"></path><path d="M 30 58 L 34 68" fill="none" stroke="rgba(196,158,110,0.22)" stroke-width="0.4" stroke-dasharray="0.3 1.2" stroke-linecap="round"></path><path d="M 62 52 L 60 66" fill="none" stroke="rgba(196,158,110,0.22)" stroke-width="0.4" stroke-dasharray="0.3 1.2" stroke-linecap="round"></path><path d="M 12 36 L 20 28" fill="none" stroke="rgba(196,158,110,0.22)" stroke-width="0.4" stroke-dasharray="0.3 1.2" stroke-linecap="round"></path><path d="M 72 66 L 60 66" fill="none" stroke="rgba(196,158,110,0.22)" stroke-width="0.4" stroke-dasharray="0.3 1.2" stroke-linecap="round"></path><path d="M 40 76 L 34 68" fill="none" stroke="rgba(196,158,110,0.22)" stroke-width="0.4" stroke-dasharray="0.3 1.2" stroke-linecap="round"></path><path d="M 78 40 L 80 52" fill="none" stroke="rgba(196,158,110,0.22)" stroke-width="0.4" stroke-dasharray="0.3 1.2" stroke-linecap="round"></path><path d="M 56 80 L 60 66" fill="none" stroke="rgba(196,158,110,0.22)" stroke-width="0.4" stroke-dasharray="0.3 1.2" stroke-linecap="round"></path>
      <path d="M 20 28 L 38 20 L 56 16 L 74 26 L 80 52 L 60 66 L 34 68 Z" fill="none" stroke="rgba(196,158,110,0.55)" stroke-width="0.9" stroke-linejoin="round" stroke-dasharray="0.3 1.6" stroke-linecap="round"></path>
      <g transform="translate(26.5 57.0) scale(0.76)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(108,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(116,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(112,42%,42%,0.55)" stroke="hsla(108,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(9.4 66.7) scale(0.94)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(105,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(113,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(109,42%,42%,0.55)" stroke="hsla(105,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(13.9 65.1) scale(1.45)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(102,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(110,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(106,42%,42%,0.55)" stroke="hsla(102,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(18.2 63.0) scale(1.90)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(119,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(127,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(123,42%,42%,0.55)" stroke="hsla(119,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(16.3 62.9) scale(1.08)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(116,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(124,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(120,42%,42%,0.55)" stroke="hsla(116,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(17.8 62.9) scale(1.41)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(113,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(121,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(117,42%,42%,0.55)" stroke="hsla(113,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(16.9 64.4) scale(1.05)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(110,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(118,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(114,42%,42%,0.55)" stroke="hsla(110,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(19.6 60.9) scale(1.90)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(107,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(115,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(111,42%,42%,0.55)" stroke="hsla(107,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(16.0 62.7) scale(1.19)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(104,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(112,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(108,42%,42%,0.55)" stroke="hsla(104,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(12.9 66.8) scale(1.40)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(101,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(109,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(105,42%,42%,0.55)" stroke="hsla(101,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(19.8 62.8) scale(1.42)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(118,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(126,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(122,42%,42%,0.55)" stroke="hsla(118,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(29.6 64.1) scale(0.97)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(115,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(123,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(119,42%,42%,0.55)" stroke="hsla(115,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(13.1 58.3) scale(1.50)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(112,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(120,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(116,42%,42%,0.55)" stroke="hsla(112,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(17.3 65.2) scale(1.36)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(109,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(117,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(113,42%,42%,0.55)" stroke="hsla(109,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(10.8 66.3) scale(1.49)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(106,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(114,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(110,42%,42%,0.55)" stroke="hsla(106,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(16.0 63.2) scale(0.93)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(103,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(111,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(107,42%,42%,0.55)" stroke="hsla(103,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(21.7 77.8) scale(1.55)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(113,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(121,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(117,42%,42%,0.55)" stroke="hsla(113,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(26.1 83.7) scale(1.78)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(111,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(119,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(115,42%,42%,0.55)" stroke="hsla(111,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(33.4 80.7) scale(1.16)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(108,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(116,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(112,42%,42%,0.55)" stroke="hsla(108,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(23.4 78.0) scale(1.35)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(105,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(113,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(109,42%,42%,0.55)" stroke="hsla(105,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(31.6 75.2) scale(1.22)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(102,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(110,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(106,42%,42%,0.55)" stroke="hsla(102,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(24.3 75.7) scale(1.22)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(119,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(127,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(123,42%,42%,0.55)" stroke="hsla(119,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(22.5 78.4) scale(1.49)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(116,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(124,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(120,42%,42%,0.55)" stroke="hsla(116,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(18.4 82.5) scale(1.66)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(113,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(121,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(117,42%,42%,0.55)" stroke="hsla(113,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(28.9 76.9) scale(1.20)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(110,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(118,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(114,42%,42%,0.55)" stroke="hsla(110,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(17.8 74.0) scale(0.80)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(107,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(115,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(111,42%,42%,0.55)" stroke="hsla(107,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(26.4 70.3) scale(0.95)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(104,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(112,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(108,42%,42%,0.55)" stroke="hsla(104,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(28.4 74.4) scale(1.52)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(101,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(109,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(105,42%,42%,0.55)" stroke="hsla(101,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(22.2 86.2) scale(1.25)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(118,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(126,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(122,42%,42%,0.55)" stroke="hsla(118,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(17.0 80.2) scale(1.46)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(115,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(123,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(119,42%,42%,0.55)" stroke="hsla(115,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(24.5 70.3) scale(1.39)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(112,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(120,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(116,42%,42%,0.55)" stroke="hsla(112,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(22.3 76.1) scale(1.42)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(109,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(117,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(113,42%,42%,0.55)" stroke="hsla(109,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(3.0 16.6) scale(1.35)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(107,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(115,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(111,42%,42%,0.55)" stroke="hsla(107,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(10.7 11.2) scale(1.40)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(104,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(112,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(108,42%,42%,0.55)" stroke="hsla(104,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(10.2 14.1) scale(1.34)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(101,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(109,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(105,42%,42%,0.55)" stroke="hsla(101,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(8.1 14.2) scale(1.40)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(119,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(127,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(123,42%,42%,0.55)" stroke="hsla(119,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(2.2 13.7) scale(1.09)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(116,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(124,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(120,42%,42%,0.55)" stroke="hsla(116,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(4.6 10.9) scale(1.53)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(113,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(121,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(117,42%,42%,0.55)" stroke="hsla(113,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(9.6 15.8) scale(0.94)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(110,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(118,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(114,42%,42%,0.55)" stroke="hsla(110,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(6.2 9.4) scale(1.52)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(107,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(115,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(111,42%,42%,0.55)" stroke="hsla(107,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(2.0 15.2) scale(1.59)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(104,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(112,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(108,42%,42%,0.55)" stroke="hsla(104,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(87.5 82.9) scale(1.12)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(104,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(112,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(108,42%,42%,0.55)" stroke="hsla(104,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(93.7 83.6) scale(1.27)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(101,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(109,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(105,42%,42%,0.55)" stroke="hsla(101,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(88.9 84.0) scale(1.51)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(118,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(126,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(122,42%,42%,0.55)" stroke="hsla(118,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(85.1 87.7) scale(1.46)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(115,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(123,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(119,42%,42%,0.55)" stroke="hsla(115,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(90.8 85.8) scale(1.37)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(112,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(120,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(116,42%,42%,0.55)" stroke="hsla(112,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(88.9 82.9) scale(1.04)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(109,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(117,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(113,42%,42%,0.55)" stroke="hsla(109,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(97.8 84.9) scale(1.19)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(106,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(114,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(110,42%,42%,0.55)" stroke="hsla(106,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(92.9 85.2) scale(1.56)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(103,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(111,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(107,42%,42%,0.55)" stroke="hsla(103,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(92.9 85.5) scale(1.70)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(100,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(108,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(104,42%,42%,0.55)" stroke="hsla(100,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(94.5 13.3) scale(1.38)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(108,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(116,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(112,42%,42%,0.55)" stroke="hsla(108,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(88.4 7.4) scale(1.34)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(105,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(113,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(109,42%,42%,0.55)" stroke="hsla(105,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(85.5 9.1) scale(1.45)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(102,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(110,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(106,42%,42%,0.55)" stroke="hsla(102,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(93.1 12.1) scale(0.78)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(119,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(127,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(123,42%,42%,0.55)" stroke="hsla(119,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(93.1 6.5) scale(1.36)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(116,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(124,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(120,42%,42%,0.55)" stroke="hsla(116,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(94.2 12.3) scale(1.69)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(113,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(121,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(117,42%,42%,0.55)" stroke="hsla(113,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(86.9 13.2) scale(1.97)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(111,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(119,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(115,42%,42%,0.55)" stroke="hsla(111,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(8.3 87.1) scale(1.91)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(102,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(110,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(106,42%,42%,0.55)" stroke="hsla(102,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(8.0 86.2) scale(1.00)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(119,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(127,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(123,42%,42%,0.55)" stroke="hsla(119,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(15.0 88.9) scale(1.36)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(116,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(124,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(120,42%,42%,0.55)" stroke="hsla(116,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(13.8 87.2) scale(1.20)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(113,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(121,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(117,42%,42%,0.55)" stroke="hsla(113,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(11.9 88.6) scale(1.57)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(111,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(119,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(115,42%,42%,0.55)" stroke="hsla(111,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(5.3 93.4) scale(1.35)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(108,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(116,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(112,42%,42%,0.55)" stroke="hsla(108,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(11.4 85.6) scale(1.47)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(105,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(113,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(109,42%,42%,0.55)" stroke="hsla(105,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(50.3 4.1) scale(0.81)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(111,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(119,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(115,42%,42%,0.55)" stroke="hsla(111,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(50.0 4.0) scale(1.32)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(108,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(116,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(112,42%,42%,0.55)" stroke="hsla(108,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(50.3 3.9) scale(1.85)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(105,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(113,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(109,42%,42%,0.55)" stroke="hsla(105,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(49.8 6.7) scale(1.87)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(102,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(110,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(106,42%,42%,0.55)" stroke="hsla(102,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(49.3 4.4) scale(1.04)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(119,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(127,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(123,42%,42%,0.55)" stroke="hsla(119,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(95.5 50.0) scale(1.46)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(111,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(119,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(115,42%,42%,0.55)" stroke="hsla(111,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(94.2 49.2) scale(1.41)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(108,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(116,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(112,42%,42%,0.55)" stroke="hsla(108,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(95.4 51.6) scale(1.21)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(106,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(114,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(110,42%,42%,0.55)" stroke="hsla(106,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(99.7 50.7) scale(1.63)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(103,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(111,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(107,42%,42%,0.55)" stroke="hsla(103,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g><g transform="translate(95.7 52.0) scale(1.63)">
    <rect x="-0.35" y="0.1" width="0.7" height="1.6" rx="0.2" fill="rgba(92,64,42,0.55)"></rect>
    <circle cx="-1" cy="-0.2" r="1.25" fill="hsla(100,38%,38%,0.5)"></circle>
    <circle cx="1" cy="-0.2" r="1.25" fill="hsla(108,40%,34%,0.5)"></circle>
    <circle cx="0" cy="-1.1" r="1.55" fill="hsla(104,42%,42%,0.55)" stroke="hsla(100,40%,24%,0.4)" stroke-width="0.12"></circle>
  </g>
    </svg>
  <div class="marker" title="Area 404" style="left: 20%; top: 28%;"></div><div class="map-label district" style="left: 20%; top: 28%;">Area 404</div><div class="marker" title="Botanica" style="left: 38%; top: 20%;"></div><div class="map-label district" style="left: 38%; top: 20%;">Botanica</div><div class="marker" title="Thrutopia" style="left: 56%; top: 16%;"></div><div class="map-label district" style="left: 56%; top: 16%;">Thrutopia</div><div class="marker" title="Copperwood" style="left: 74%; top: 26%;"></div><div class="map-label district" style="left: 74%; top: 26%;">Copperwood</div><div class="marker" title="Oldtown" style="left: 80%; top: 52%;"></div><div class="map-label district" style="left: 80%; top: 52%;">Oldtown</div><div class="marker" title="Letsbe Avenue" style="left: 60%; top: 66%;"></div><div class="map-label district" style="left: 60%; top: 66%;">Letsbe Avenue</div><div class="marker" title="Metropolis" style="left: 34%; top: 68%;"></div><div class="map-label district" style="left: 34%; top: 68%;">Metropolis</div><div class="marker stage" title="Grand Central" style="left: 48%; top: 42%;"></div><div class="map-label" style="left: 48%; top: 42%;">Grand Central</div><div class="marker stage" title="The Lion's Den" style="left: 28%; top: 46%;"></div><div class="map-label" style="left: 28%; top: 46%;">The Lion's Den</div><div class="marker stage" title="Hydro XL" style="left: 66%; top: 44%;"></div><div class="map-label" style="left: 66%; top: 44%;">Hydro XL</div><div class="marker stage" title="Anara Forest" style="left: 18%; top: 62%;"></div><div class="map-label" style="left: 18%; top: 62%;">Anara Forest</div><div class="marker stage" title="Hidden Woods" style="left: 24%; top: 78%;"></div><div class="map-label" style="left: 24%; top: 78%;">Hidden Woods</div><div class="marker stage" title="NEXUS" style="left: 52%; top: 56%;"></div><div class="map-label" style="left: 52%; top: 56%;">NEXUS</div><div class="marker stage" title="Helix" style="left: 66%; top: 60%;"></div><div class="map-label" style="left: 66%; top: 60%;">Helix</div><div class="marker stage minor" title="Spectrum 360" style="left: 40%; top: 42%;"></div><div class="map-label minor" style="left: 40%; top: 42%;">Spectrum 360</div><div class="marker stage minor" title="Tangled Roots" style="left: 14%; top: 50%;"></div><div class="map-label minor" style="left: 14%; top: 50%;">Tangled Roots</div><div class="marker stage minor" title="Full Moon Ballroom" style="left: 58%; top: 30%;"></div><div class="map-label minor" style="left: 58%; top: 30%;">Full Moon Ballroom</div><div class="marker stage minor" title="Rose and Clown" style="left: 44%; top: 52%;"></div><div class="map-label minor" style="left: 44%; top: 52%;">Rose and Clown</div><div class="marker stage minor" title="The Fools Leap" style="left: 30%; top: 58%;"></div><div class="map-label minor" style="left: 30%; top: 58%;">The Fools Leap</div><div class="marker stage minor" title="Foggers Mill" style="left: 62%; top: 52%;"></div><div class="map-label minor" style="left: 62%; top: 52%;">Foggers Mill</div><div class="marker stage minor" title="Hangar 161" style="left: 12%; top: 36%;"></div><div class="map-label minor" style="left: 12%; top: 36%;">Hangar 161</div><div class="marker stage minor" title="Tribe of Frog" style="left: 72%; top: 66%;"></div><div class="map-label minor" style="left: 72%; top: 66%;">Tribe of Frog</div><div class="marker stage minor" title="Sibín Beag" style="left: 40%; top: 76%;"></div><div class="map-label minor" style="left: 40%; top: 76%;">Sibín Beag</div><div class="marker stage minor" title="Acid Leak" style="left: 78%; top: 40%;"></div><div class="map-label minor" style="left: 78%; top: 40%;">Acid Leak</div><div class="marker stage minor" title="Infinity" style="left: 56%; top: 80%;"></div><div class="map-label minor" style="left: 56%; top: 80%;">Infinity</div><div class="marker secret" title="Rumoured hidden venue territory" style="left: 14%; top: 70%;">?</div><div class="marker secret" title="Rumoured hidden venue territory" style="left: 30%; top: 14%;">?</div><div class="marker secret" title="Rumoured hidden venue territory" style="left: 84%; top: 66%;">?</div><div class="marker secret" title="Rumoured hidden venue territory" style="left: 70%; top: 84%;">?</div><div class="marker secret" title="Rumoured hidden venue territory" style="left: 16%; top: 84%;">?</div><div class="marker secret" title="Rumoured hidden venue territory" style="left: 86%; top: 20%;">?</div><div class="marker secret" title="Rumoured hidden venue territory" style="left: 54%; top: 90%;">?</div><div class="map-label camp" style="left: 14%; top: 7%;">⛺ West Camping</div><div class="map-label camp" style="left: 5%; top: 35%;">⛺ Downtown Camping</div><div class="map-label camp" style="left: 7%; top: 58%;">⛺ Meadow Camping (Accessible)</div><div class="map-label camp" style="left: 48%; top: 4%;">⛺ Valley Camping</div><div class="map-label camp" style="left: 70%; top: 6%;">⛺ Tangerine Fields</div><div class="map-label camp" style="left: 86%; top: 14%;">⛺ Campervan Field</div><div class="map-label camp" style="left: 85%; top: 32%;">⛺ Temple Valley Camping</div><div class="map-label camp" style="left: 91%; top: 48%;">⛺ East Camping</div><div class="map-label camp" style="left: 95%; top: 64%;">⛺ Quiet Camping</div><div class="marker gate" title="West Gate" style="left: 3%; top: 46%;"></div><div class="map-label gate" style="left: 3%; top: 46%;">West Gate</div><div class="marker gate" title="East Gate" style="left: 96%; top: 32%;"></div><div class="map-label gate" style="left: 96%; top: 32%;">East Gate</div><div class="marker gate" title="South Gate" style="left: 78%; top: 93%;"></div><div class="map-label gate" style="left: 78%; top: 93%;">South Gate</div></div>
    <div class="mapZoomControls">
      <button id="zoomInBtn" title="Zoom in">+</button>
      <button id="zoomOutBtn" title="Zoom out">−</button>
      <button id="zoomResetBtn" title="Reset view">⤢</button>
    </div>
    <div class="compass" title="North (approx.)">
      <svg viewBox="0 0 24 24" width="26" height="26">
        <circle cx="12" cy="12" r="11" fill="rgba(11,21,18,0.65)" stroke="rgba(238,246,241,0.35)" stroke-width="1"></circle>
        <path d="M12 3 L15 12 L12 21 L9 12 Z" fill="rgba(242,168,60,0.9)"></path>
        <text x="12" y="7.5" font-size="6" fill="#eef6f1" text-anchor="middle" font-weight="700">N</text>
      </svg>
    </div>
  </div>
    <div class="legend">
      <span><span class="dot"></span>District</span>
      <span><span class="dot teal"></span>Stage</span>
      <span><span class="dot" style="width:6px;height:6px;background:var(--accent-teal);opacity:.85;"></span>Other stage</span>
      <span><span class="dot outline"></span>Named hidden venue / thing to find</span>
      <span><span class="dot" style="border-radius:3px; background:rgba(196,158,110,.85);"></span>Gate</span>
      <span><span class="dot" style="border-radius:3px; background:rgba(45,168,242,.75);"></span>Landmark</span>
      <span><span class="line-swatch"></span>Approx. route, not a literal path</span>
    </div>
    <div id="mapInfo"></div>

    <div class="card">
      <h3>📍 Meeting point</h3>
      <p>Set directly here, or tap any stage/district marker above and use "Save as meeting point."</p>
      <div id="currentMeetingDisplay" class="empty-note" style="margin-bottom:8px;"></div>
      <div class="field"><input type="text" id="meetingPointInput" placeholder="e.g. Grand Central, or 'the big oak by West Camping'"></div>
      <button class="action" id="setMeetingBtn">Set meeting point</button>
    </div>

    <div class="card">
      <h3>Log a landmark</h3>
      <p>Spotted something worth marking that's not in the list — a good water point, a landmark tree, a meetup spot? Add it here; it shows up on the map above and can be removed any time.</p>
      <div class="field"><label>Name</label><input type="text" id="landmarkName" placeholder="What is it?"></div>
      <div class="field"><label>Nearest district</label>
        <select id="landmarkDistrict">
          <option value="Area 404">Area 404</option>
          <option value="Botanica">Botanica</option>
          <option value="Thrutopia">Thrutopia</option>
          <option value="Copperwood">Copperwood</option>
          <option value="Oldtown">Oldtown</option>
          <option value="Letsbe Avenue">Letsbe Avenue</option>
          <option value="Metropolis">Metropolis</option>
        </select>
      </div>
      <div class="field"><label>Notes (optional)</label><textarea id="landmarkInfo" placeholder="What's here, or why it matters"></textarea></div>
      <button class="action" id="addLandmarkBtn">Add to map</button>
    </div>
    <div id="customLandmarksList"></div>

    <div class="card">
      <h3>🕐 Gate, car park &amp; music hours</h3>
      <ul class="compact-list">
        <li><strong>Gates:</strong> Wed 14:00–21:30, Thu–Sun 10:00–21:30. No re-entry after 21:30.</li>
        <li><strong>Car parks:</strong> 10:00–21:00 daily.</li>
        <li><strong>Music hours:</strong> Wed 14:00–23:00 · Thu 12:00–00:00 · Fri–Sat 12:00–04:00 · Sun 12:00–00:00.</li>
        <li><strong>Medical centres:</strong> 24 hours (Pepperpot Market and Hilltop).</li>
        <li><strong>Site closes:</strong> Monday 12:00 — everyone off site by then.</li>
      </ul>
      <p class="empty-note" style="margin-top:8px;">Individual stage/venue set times aren't published this far out — where this app has a saved set time for a stage, its rough running window shows in the venue directory below.</p>
    </div>

    <div class="card">
      <h3>🍺 Bars &amp; food — prices &amp; where</h3>
      <p>No official price list is published in advance and it varies by stall, but as a rough guide from past chapters: pints run about £6–£7, cocktails and mixed drinks £7–£12, and hot food £8–£13 a portion. Everything runs on the cashless wristband, so top up before you're queuing.</p>
      <p>Every district has its own bars and food stalls in keeping with its theme, rather than one central food court — Letsbe Avenue and Metropolis tend to be the densest for options, and Pepperpot Market is a reliable food-and-drink hub roughly central to the site. Expect more stalls near the bigger stages (Grand Central, Lion's Den, Hydro XL) and around the main camping fields for a morning coffee. Exact stalls and locations for Chapter Five are confirmed on the official app once you're on-site.</p>
    </div>

    <div class="card">
      <h3 class="skip-card">What's around site</h3>
      <p>From past years' site maps — Boomtown typically has these dotted around the whole city and campsites (exact spots shown in the official app on-site once you're there):</p>
      <div class="stagelist">
        <span>🩹 Welfare &amp; medic points</span><span>🚰 Water refill points</span><span>🚻 Toilets (incl. accessible)</span>
        <span>🍺 Bars</span><span>🍔 Food &amp; drink vendors</span><span>🛍 Market stalls</span>
        <span>ℹ️ Info points</span><span>🔌 Phone charging</span><span>💳 Cashless top-up / bank points</span>
        <span>🔒 Lockers</span><span>🚿 Showers</span>
      </div>
    </div>

    <div class="card">
      <h3>Hidden venues &amp; things to find</h3>
      <p>On top of the 18 official stages, Boomtown runs 50+ unlisted hidden venues built by independent collectives inside the districts — some kitted out as a post office, hotel or police station, all deliberately not published anywhere. The named "?" markers on the map above are real past-chapter and 2026 venue names, positioned near the district their theme best fits; the plain "?" markers further out are a reminder there are always more than are named here. None of these positions are surveyed — finding them is the point.</p>
    </div>

    <div class="card">
      <span class="tag">Full directory, incl. your own finds</span>
      <h3>Every stage, hidden venue &amp; shop we could source</h3>
      <p>Main stages, confirmed 2026 hidden venues, food &amp; drink, shops, workshops, leisure/rides and support spaces, plus a handful of past-chapter names with no 2026 evidence — clearly marked. "Confirmed" means it appeared in Boomtown's own 2026 lineup/schedule tool or official site copy; "Rumoured" means it's a lead from a past chapter, not a promise; "Your find" is anything your group logs below. Every row also says 🎵 Music / 🔇 No music, so it's clear which entries are genuinely deliberately-hidden venues worth hunting versus places you'll simply walk past (food stalls, welfare, workshops). A 📍 note gives a rough location where we could place one.</p>
      <div class="venue-filters" id="venueStatusFilters">
        <button class="active" data-status="all">All statuses</button>
        <button data-status="confirmed">Confirmed only</button>
        <button data-status="rumoured">Rumoured only</button>
        <button data-status="logged">Your finds</button>
      </div>
      <div class="venue-filters" id="venueTypeFilters">
        <button class="active" data-type="all">All types</button>
        <button data-type="Main stage">Main stages</button>
        <button data-type="Hidden venue">Hidden venues</button>
        <button data-type="Shop / hidden venue">Shops</button>
        <button data-type="Workshop / shop">Workshops</button>
        <button data-type="Welfare / support">Welfare / support</button>
        <button data-type="Talks / installation">Talks / installations</button>
        <button data-type="Leisure / ride">Leisure / rides</button>
        <button data-type="Food & drink">Food &amp; drink</button>
      </div>
      <div class="venue-list" id="venueTableBody"></div>
      <p class="empty-note" id="venueTableCount" style="margin-top:2px;"></p>
      <p class="empty-note" style="margin-top:6px;">Best rule: if a storefront, queue or actor feels suspiciously over-designed, investigate — but don't expect last year's exact location to survive the redesign.</p>
    </div>

    <div class="card">
      <h3>Log a hidden venue</h3>
      <p>Found one of the 50+ secret spots? Save it here — it'll show up in the directory above tagged "Your find", and everyone in your group can copy the list out.</p>
      <div class="field"><label>Name</label><input type="text" id="hiddenVenueName" placeholder="What was it called?"></div>
      <div class="field"><label>Type</label>
        <select id="hiddenVenueType">
          <option value="Hidden venue">Hidden venue</option>
          <option value="Main stage">Main stage</option>
          <option value="Shop / hidden venue">Shop</option>
          <option value="Workshop / shop">Workshop</option>
          <option value="Welfare / support">Welfare / support</option>
          <option value="Talks / installation">Talks / installation</option>
          <option value="Leisure / ride">Leisure / ride</option>
        </select>
      </div>
      <div class="field"><label>Genre / vibe (optional)</label><input type="text" id="hiddenVenueGenre" placeholder="e.g. hard techno, folk, chill bar"></div>
      <div class="field"><label>Rough location (optional)</label><input type="text" id="hiddenVenueNear" placeholder="e.g. near Botanica, edge of Hidden Woods"></div>
      <div class="field"><label>Notes</label><textarea id="hiddenVenueInput" placeholder="What it was like, when you found it..."></textarea></div>
      <button class="action" id="addHiddenVenueBtn">Save find</button>
      <button class="ghost" id="copyVenuesBtn" style="margin:8px 6px 0 0;">Copy your finds</button>
    </div>

  <div class="card">
  <span class="tag">Food, bars &amp; useful extras</span>
  <h3>What to look for around the city</h3>
  <p><strong>2026 food:</strong> the festival has confirmed Indian street food, Caribbean comfort food and burger-van classics, plus a substantial £6 meal deal at selected traders. Exact stalls and pins will appear in the official app, so use it as the final word.</p>
  <ul class="compact-list">
    <li><strong>2025 food leads:</strong> Paelleria, Indian Street Food, Burger Shack and Greek Gyros were among last year’s trader-list names. Treat them as examples, not return guarantees.</li>
    <li><strong>Where to begin:</strong> Pepperpot Market and the larger stage routes were reliable food-and-drink areas in previous chapters; campsite edges were the better morning-coffee bet.</li>
    <li><strong>Merch:</strong> for 2026 the main stall is next to the info tent, with a second stand opposite Grand Central.</li>
    <li><strong>VIP / flushing loos:</strong> Camp Orchid and Camp Skylark packages include flushing toilets; Camp Skylark also gives access to the Hide Out Downtown (near Area 404 / the chair-o-plane) and its second 2026 bar in Copper Woods heights. These are package benefits, not a general-pay-per-loo facility.</li>
  </ul>
  <a class="linkbtn" href="https://www.boomtownfair.co.uk/news/boomtown-chapter-five-radical-redesign-essential-guide" target="_blank" rel="noopener">VIP &amp; camping facilities</a>
  <a class="linkbtn" href="https://www.boomtownfair.co.uk/the-retreat" target="_blank" rel="noopener">Spa, sauna &amp; workshops</a>
</div></section>

  <!-- DISCOVER -->
  <section id="discover" class="screen">
    <div class="eyebrow">Districts &amp; story</div>
    <h2 style="margin-bottom:14px;">Discover</h2>
    <p class="empty-note" style="margin-bottom:10px;">Boomtown's story runs district by district — real names and plotlines below. Mark each district off as you visit, and jot any leads your group picks up so you can compare notes later.</p>

    <div class="venue-filters" id="discoverNav" style="margin-bottom:14px;">
      <button data-jump="jumpNotes">👥 All notes</button>
      <button data-jump="jumpSync">🤝 Sync</button>
      <button data-jump="jumpCharacter">🎭 My character</button>
      <button data-jump="jumpBingo">🎲 Bingo</button>
      <button data-jump="jumpStory">📖 The story</button>
      <button data-jump="jumpDailyRag">🗞 Live intel</button>
      <button data-jump="discoveries">🏙 Districts</button>
      <button data-jump="jumpCharacters">🗣 Characters</button>
      <button data-jump="jumpInvolved">🙋 Get involved</button>
      <button data-jump="jumpTheories">🔮 Theories</button>
      <button data-jump="jumpJournal">😂 Journal</button>
      <button data-jump="jumpGlossary">📔 Glossary</button>
    </div>

    <div class="card">
      <h3>📋 Sharing with your group</h3>
      <p>Everything below saves only to this phone — it's not synced between friends' devices. Use these to paste your progress into your group chat as plain text so everyone stays up to date. Hidden-venue finds have their own log and copy button over on the Map tab. For a proper merge (see below), use Sync instead of these.</p>
      <p>Your saved-artist Plan isn't in these plain-text copy buttons — it travels through Sync below instead, into a tab of its own on the Plan screen, never merged into anyone's list.</p>
      <button class="ghost" id="copyCluesBtn" style="margin:4px 6px 0 0;">Copy district notes</button>
      <button class="ghost" id="copyTheoriesBtn" style="margin:4px 6px 0 0;">Copy theories</button>
    </div>

    <div class="card" id="jumpSync">
      <h3>🤝 Sync with your group — no duplicates</h3>
      <p>How it fits together, in three steps:</p>
      <ol class="compact-list" style="padding-left:20px;">
        <li><strong>Pick who you are below.</strong> Everything you add anywhere in the app from now on — theories, hidden-venue finds, get-involved ticks, found socials — is tagged with that name automatically.</li>
        <li><strong>Copy your sync code</strong> and send it to a teammate. They paste it into "Merge it in" on their phone; your notes, finds and theories combine with theirs (nothing already saved gets doubled up), and your current saved-artist Plan comes along too.</li>
        <li>That saved-artist Plan never gets folded into their own list, though — it shows up as its own tab, named after you, over on their Plan screen. Their picks stay theirs, yours stay yours; the tabs are just there to compare. Do the code-swap round the whole group and everyone ends up with the same shared notes plus a full set of everyone's named Plan tabs. Whoever hits <strong>"Download a copy with our updates"</strong> on Home last bakes that combined set into one shareable file. Discover's Consolidated Notes card (below) shows the notes side split by person or by category — so you can check what's actually in it first.</li>
      </ol>
      <div class="field"><label>Who are you?</label>
        <select id="contributorName">
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
      <div class="field" id="contributorOtherField" style="display:none;"><label>Your name</label><input type="text" id="contributorOtherInput" placeholder="Type your name"></div>
      <button class="ghost" id="copySyncCodeBtn" style="margin:4px 6px 0 0;">Copy your sync code</button>
      <div class="field" style="margin-top:10px;"><label>Paste a teammate's sync code</label><textarea id="syncCodeInput" placeholder="Paste a BTC1:... code here"></textarea></div>
      <button class="action" id="mergeSyncCodeBtn">Merge it in</button>
      <p class="empty-note" id="syncStatusNote" style="margin-top:8px;"></p>
    </div>

    <div class="card" id="jumpCharacter">
      <h3>🎭 Build your character</h3>
      <p>Give yourself a name and an angle before you go — actors respond to you a lot better when you're playing along rather than just watching. Doesn't lock in like Bingo; edit it any time.</p>
      <div class="field"><label>Character name</label><input type="text" id="charName" placeholder="e.g. Delia Voss"></div>
      <div class="field"><label>District allegiance</label>
        <select id="charDistrict">
          <option value="">Undecided / floating</option>
          <option value="Area 404">Area 404</option>
          <option value="Botanica">Botanica</option>
          <option value="Thrutopia">Thrutopia</option>
          <option value="Copperwood">Copperwood</option>
          <option value="Oldtown">Oldtown</option>
          <option value="Letsbe Avenue">Letsbe Avenue</option>
          <option value="Metropolis">Metropolis</option>
        </select>
      </div>
      <div class="field"><label>A quirk or trait</label><input type="text" id="charQuirk" placeholder="e.g. Convinced everyone owes her a favour"></div>
      <div class="field"><label>Opening line / catchphrase</label><input type="text" id="charCatchphrase" placeholder="e.g. &quot;I don't do introductions, I do arrivals.&quot;"></div>
      <div class="field"><label>Backstory (a line or two)</label><textarea id="charBackstory" placeholder="Why is this person in the city right now?"></textarea></div>
      <button class="action" id="saveCharBtn">Save character</button>
      <div id="charCardDisplay" style="margin-top:10px;"></div>
    </div>

    <div class="card" id="jumpBingo">
      <h3>🎲 Boomtown bingo</h3>
      <p>Write your own 24 squares below (one per line) — under 24 and the rest fill from a default list, over 24 and it picks 24 at random from what you wrote. Shuffle as much as you like, then lock it in: the squares are fixed for the weekend after that, but you can still tap any square to cross it off as you go.</p>
      <textarea id="bingoCustomInput" placeholder="One idea per line, e.g.
Find a hidden venue
Get given Boomtown bucks
Talk to an actor in character
..."></textarea>
      <div id="bingoGrid"></div>
      <button class="action" id="bingoGenerateBtn">Build/shuffle my card</button>
      <button class="action danger" id="bingoLockBtn" style="display:none;">Lock in this card</button>
      <p class="empty-note" id="bingoStatusNote" style="margin-top:8px;"></p>
    </div>

    <div class="card story-brief" id="jumpStory">
  <span class="tag">Chapter Five: the clean version</span>
  <h3>Where the story begins</h3>
  <div class="story-step"><b>1 — Last chapter's ending</b><p>At the 2025 closing ceremony, The Collector was freed from Mr Biga and Aurora Venturestone and handed leadership of Boomtown to The Network — exactly as the Lion's Gate Portal had foretold, along with the Lion's Den's return to Temple Valley this year. He's barely been seen in person since, bar the odd official broadcast.</p></div>
  <div class="story-step"><b>2 — The new threat</b><p>Despite their disgrace, Biga and Aurora merged BIGACORP™ and BETTERCORP™ into BBXL™ and launched a corporate space programme, declaring Earth a 'single-use planet' — draining the city's land and water while plenty of residents still queue up for its exclusive VIP clubs.</p></div>
  <div class="story-step"><b>3 — The complication</b><p>The Network is trying to redesign the city around shared power, but BBXL™ still has customers, VIP clubs and influence everywhere, and every district has its own agenda running in parallel — The Great Mother's ritual, Oldtown's separatism, Copperwood's film empire, Letsbe Avenue's BLIP. The big question this chapter: can ordinary people actually organise before the corporate story wins?</p></div>
  <div class="story-step"><b>4 — How we play it</b><p>Start in Area 404, Botanica or Letsbe Avenue. Ask what each group wants, who benefits from BBXL™, and what they know about the missing or shifting pieces. Write down names, symbols and promised meetings; the story is deliberately made of overlaps, not a single route.</p></div>
  <div class="story-step"><b>5 — Beyond the plot</b><p>Not everything this chapter is faction warfare — Thrutopia's workshops, the Cloak of Hope community artwork, and the genuine on-site Observatory research project are all real, non-scripted ways to take part. This chapter's community campaign, Vibe Check, is also worth knowing before you go: look out for each other, and use welfare and Safer Spaces if you need them.</p></div>
</div>

<div class="card">
  <span class="tag">For context</span>
  <h3>📜 The story so far — chapter by chapter</h3>
  <p>Boomtown's storyline restarted its chapter numbering with the site's post-pandemic return; Chapter Five is the fifth instalment of that run (the festival itself is older — 2026 is its 16th edition overall). Broad strokes only below — treat exact plot beats as a general shape, not a script.</p>
  <div class="story-step"><b>Chapter One — The Gathering</b><p>The circus first arrived, with the Gypsy King rolling in on an enormous caravan train — the founding moment for the current run of the story.</p></div>
  <div class="story-step"><b>Chapter Two — The Twin Trail</b><p>A man calling himself The Kaptin arrived seeking to tighten control over what had been a fairly lawless town.</p></div>
  <div class="story-step"><b>Chapter Three — Revolution of Imagination</b><p>Opened on a sombre note: prominent figures paid tribute to founder Nickolas Boom, who'd gone searching the mountains for hidden treasure and never returned — before the city pushed toward its own revolution.</p></div>
  <div class="story-step"><b>Chapter Four — Power of Now</b><p>Set up this chapter's central conflict: the Collector was elected in a huge citywide vote hoping for unity, before it emerged the version in power was a deepfake built by Mr Biga and Aurora Venturestone. The real Collector was freed at the closing ceremony and handed leadership to The Network.</p></div>
  <div class="story-step"><b>Chapter Five — Radical Redesign</b><p>Where we are now: Biga and Venturestone, disgraced but undeterred, have merged their companies into BBXL™ and launched a space programme. The Network is trying to actually redesign the city around shared power — see "Where the story begins" above for the detail.</p></div>
</div>

<div class="card" id="jumpDailyRag">
  <span class="tag">Staying up to date</span>
  <h3>🗞 The Daily Rag &amp; live intel</h3>
  <p>Quick-check searches (opens in a new tab — no auto-scanning, this file can't do that itself):</p>
  <div class="stagelist" style="margin-top:6px;">
    <a class="linkbtn" href="https://www.instagram.com/explore/tags/boomtownfair/" target="_blank" rel="noopener">#boomtownfair</a>
    <a class="linkbtn" href="https://www.instagram.com/explore/tags/boomtown2026/" target="_blank" rel="noopener">#boomtown2026</a>
    <a class="linkbtn" href="https://www.instagram.com/explore/tags/dailyrag/" target="_blank" rel="noopener">#dailyrag</a>
    <a class="linkbtn" href="https://www.instagram.com/explore/tags/boomtownfairofficial/" target="_blank" rel="noopener">#boomtownfairofficial</a>
    <a class="linkbtn" href="https://twitter.com/search?q=boomtown%20secret%20set&f=live" target="_blank" rel="noopener">"boomtown secret set" (X)</a>
    <a class="linkbtn" href="https://twitter.com/search?q=boomtown%202026&f=live" target="_blank" rel="noopener">"boomtown 2026" (X)</a>
    <a class="linkbtn" href="https://twitter.com/search?q=boomtown%20update&f=live" target="_blank" rel="noopener">"boomtown update" (X)</a>
    <a class="linkbtn" href="https://www.tiktok.com/tag/boomtownfair" target="_blank" rel="noopener">#boomtownfair (TikTok)</a>
    <a class="linkbtn" href="https://www.tiktok.com/tag/boomtown2026" target="_blank" rel="noopener">#boomtown2026 (TikTok)</a>
  </div>
  <textarea id="sightingInput" placeholder="e.g. Someone posted Bashy's doing a secret set at NEXUS Friday night" style="margin-top:10px;"></textarea>
  <div class="field" style="margin-top:8px;"><label>Source (optional)</label><input type="text" id="sightingSource" placeholder="e.g. Instagram story, a mate on-site"></div>
  <button class="action" id="addSightingBtn">Save it</button>
  <button class="ghost" id="copySightingsBtn" style="margin:8px 0 0;">Copy the log</button>
</div>
<div id="sightingsList"></div>

<div id="discoveries"><div class="discovery">
      <h3>Area 404 ◻️</h3>
      <p>Industrial-punk district, now the political centre</p>
      <p>A former outsider district now at the centre of city power. The Guardians police it under Chief Guardian Mr Biga; their boot camp, official fines and work-permit machinery are all worth questioning.</p>
      <p style="color:var(--accent-teal); font-size:12px; text-transform:uppercase; letter-spacing:.05em; margin-top:8px;">Mr Biga · The Guardians · The Luck Exchange</p>
      <button class="action">Mark visited</button>
      <textarea class="clue-input" placeholder="Leads your group has picked up here..."></textarea>
    </div><div class="discovery">
      <h3>Botanica ◻️</h3>
      <p>Plant-covered temple sanctuary</p>
      <p>The Great Mother is planning an ascension ritual, while the transformed Temple of Zero, Shadow Post, IONA, a stolen Nanco photocopier and missing postal workers form a second, stranger thread.</p>
      <p style="color:var(--accent-teal); font-size:12px; text-transform:uppercase; letter-spacing:.05em; margin-top:8px;">The Great Mother · Shadow Post · IONA</p>
      <button class="action">Mark visited</button>
      <textarea class="clue-input" placeholder="Leads your group has picked up here..."></textarea>
    </div><div class="discovery">
      <h3>Thrutopia ◻️</h3>
      <p>New wellness &amp; workshop zone</p>
      <p>A new space for talks, workshops and imagining better futures. It is less a story district than a daytime reset and a place for ideas to turn into participation.</p>
      <p style="color:var(--accent-teal); font-size:12px; text-transform:uppercase; letter-spacing:.05em; margin-top:8px;">Workshop hosts · The Retreat</p>
      <button class="action">Mark visited</button>
      <textarea class="clue-input" placeholder="Leads your group has picked up here..."></textarea>
    </div><div class="discovery">
      <h3>Copperwood ◻️</h3>
      <p>1925 roaring-twenties film district</p>
      <p>Edna Von Vanderhaus has made herself Creative Director and is filming Race to the Red Planet. Copperwood has become a live movie world, including fan settlement Von Vanderland.</p>
      <p style="color:var(--accent-teal); font-size:12px; text-transform:uppercase; letter-spacing:.05em; margin-top:8px;">Edna Von Vanderhaus · VVH</p>
      <button class="action">Mark visited</button>
      <textarea class="clue-input" placeholder="Leads your group has picked up here..."></textarea>
    </div><div class="discovery">
      <h3>Oldtown ◻️</h3>
      <p>Circus &amp; rogues district, rebuilt uphill</p>
      <p>Rufus the Red and the Den of Dis Order are creating the self-governed People’s Republic of Oldtownia after moving their whole, topsy-turvy district uphill.</p>
      <p style="color:var(--accent-teal); font-size:12px; text-transform:uppercase; letter-spacing:.05em; margin-top:8px;">Rufus the Red · Den of Dis Order</p>
      <button class="action">Mark visited</button>
      <textarea class="clue-input" placeholder="Leads your group has picked up here..."></textarea>
    </div><div class="discovery">
      <h3>Letsbe Avenue ◻️</h3>
      <p>The everyday high street</p>
      <p>Patrick Kahn’s former BLEP operation is now BLIP: Boomtown Lifestyle Important Product. The product is being pushed to Letsbe Avenue VIPPs — ask what it is really for.</p>
      <p style="color:var(--accent-teal); font-size:12px; text-transform:uppercase; letter-spacing:.05em; margin-top:8px;">Patrick Kahn · BLIP VIPPs</p>
      <button class="action">Mark visited</button>
      <textarea class="clue-input" placeholder="Leads your group has picked up here..."></textarea>
    </div><div class="discovery">
      <h3>Metropolis ◻️</h3>
      <p>Hyper-digital, hedonistic district</p>
      <p>Bettercorp’s techtopia has left laid-off inGeniuses behind. Aurora’s polished future includes unstable, unofficial Betterverse tours that may trap visitors in Digital Foreverness.</p>
      <p style="color:var(--accent-teal); font-size:12px; text-transform:uppercase; letter-spacing:.05em; margin-top:8px;">Aurora Venturestone · inGeniuses · Bettercorp™</p>
      <button class="action">Mark visited</button>
      <textarea class="clue-input" placeholder="Leads your group has picked up here..."></textarea>
    </div></div>

    <div class="card" id="jumpCharacters">
      <h3>🎭 Characters &amp; factions</h3>
      <p>Who's who this chapter — handy when an actor drops a name on you and you've got no idea who they mean.</p>
      <input type="text" id="characterSearch" placeholder="Search a name, faction or district">
    </div>
    <div id="characterResults"><div class="item">
      <strong>Mr Biga</strong><br>
      <small>Area 404 / BBXL · Area 404</small>
      <p style="margin-top:6px; color:var(--text-muted); font-size:14px; line-height:1.5;">Chief Guardian in Area 404 and co-creator of BBXL with Aurora Venturestone. The boot camp, fines and new Guardians make him a useful person to ask about who really holds power.</p>
      <p style="margin-top:6px; color:var(--accent-teal); font-size:12px;">💬 Ask what the Guardians are protecting — and who the rules serve.</p>
    </div><div class="item">
      <strong>The Collector</strong><br>
      <small>Area 404 · Missing, presumed imprisoned</small>
      <p style="margin-top:6px; color:var(--text-muted); font-size:14px; line-height:1.5;">Freed at the end of the previous chapter, The Collector handed leadership of Boomtown to The Network. Keep an ear out for how citizens think that promise is working out.</p>
      <p style="margin-top:6px; color:var(--accent-teal); font-size:12px;">💬 Ask who is making decisions now that leadership has changed hands.</p>
    </div><div class="item">
      <strong>The Guardians</strong><br>
      <small>Area 404 · Area 404</small>
      <p style="margin-top:6px; color:var(--text-muted); font-size:14px; line-height:1.5;">Area 404's enforcers, now abusing their power with bogus 'official fines' on residents.</p>
      <p style="margin-top:6px; color:var(--accent-teal); font-size:12px;">💬 Ask what a fine is actually for — the answers don't hold up.</p>
    </div><div class="item">
      <strong>The Great Mother</strong><br>
      <small>Botanica · Botanica</small>
      <p style="margin-top:6px; color:var(--text-muted); font-size:14px; line-height:1.5;">Leader of the Temple, still seething months on from her election defeat. She's plotting a ritual to sacrifice her followers into her own portal and 'ascend' her community — a direct swipe at the Collector.</p>
      <p style="margin-top:6px; color:var(--accent-teal); font-size:12px;">💬 Ask about the ritual, or what 'ascension' actually means to her followers.</p>
    </div><div class="item">
      <strong>IONA</strong><br>
      <small>The Network · Temple of Zero, Botanica</small>
      <p style="margin-top:6px; color:var(--text-muted); font-size:14px; line-height:1.5;">A sentient mycelium-network AI leading The Network's investigation into the deepfake and a strange photocopier phenomenon, working alongside the Shadow Post group.</p>
      <p style="margin-top:6px; color:var(--accent-teal); font-size:12px;">💬 Ask what the photocopiers are copying, and why.</p>
    </div><div class="item">
      <strong>Shadow Post</strong><br>
      <small>The Network · Temple of Zero, Botanica</small>
      <p style="margin-top:6px; color:var(--text-muted); font-size:14px; line-height:1.5;">A shadowy group rumoured to have a deeper connection to Temple of Zero's transformation — allied with IONA and The Network, but keep their own methods close to their chest.</p>
      <p style="margin-top:6px; color:var(--accent-teal); font-size:12px;">💬 Ask how they're connected to IONA — the answer tends to shift depending who you ask.</p>
    </div><div class="item">
      <strong>The Network</strong><br>
      <small>Independent · Temple of Zero, Botanica</small>
      <p style="margin-top:6px; color:var(--text-muted); font-size:14px; line-height:1.5;">A grassroots group trying to expose the truth about the election and hand power back to the people. This chapter's central question: can they actually pull it off, or do BBXL and the districts' own power plays make it impossible?</p>
      <p style="margin-top:6px; color:var(--accent-teal); font-size:12px;">💬 Ask what they'd need from ordinary citizens to actually succeed.</p>
    </div><div class="item">
      <strong>Edna Von Vanderhaus</strong><br>
      <small>Copperwood · Copperwood</small>
      <p style="margin-top:6px; color:var(--text-muted); font-size:14px; line-height:1.5;">Self-appointed 'Creative Director' of Copperwood since her election loss, currently shooting her film 'Race to the Red Planet' as production company VVH. Her fans have built her a whole settlement, Von Vanderland.</p>
      <p style="margin-top:6px; color:var(--accent-teal); font-size:12px;">💬 Ask for a walk-on part, or what the film is really about.</p>
    </div><div class="item">
      <strong>Rufus the Red</strong><br>
      <small>Oldtown · Oldtown</small>
      <p style="margin-top:6px; color:var(--text-muted); font-size:14px; line-height:1.5;">Leading Oldtown's separatist movement, 'The People's Republic of Oldtownia,' against Area 404's rule.</p>
      <p style="margin-top:6px; color:var(--accent-teal); font-size:12px;">💬 Ask what independence would actually look like for Oldtown.</p>
    </div><div class="item">
      <strong>Patrick Kahn</strong><br>
      <small>Letsbe Avenue · Letsbe Avenue</small>
      <p style="margin-top:6px; color:var(--text-muted); font-size:14px; line-height:1.5;">Salesman pushing BLIP, a new product exclusive to VIPPs. Nobody's quite sure what it actually does yet.</p>
      <p style="margin-top:6px; color:var(--accent-teal); font-size:12px;">💬 Ask to try BLIP, or what makes someone a VIPP.</p>
    </div><div class="item">
      <strong>Aurora Venturestone</strong><br>
      <small>Metropolis / BBXL · Metropolis</small>
      <p style="margin-top:6px; color:var(--text-muted); font-size:14px; line-height:1.5;">Chief of Digital Communications, running Metropolis's surveillance and media machine, and co-runs BBXL with Mr Biga.</p>
      <p style="margin-top:6px; color:var(--accent-teal); font-size:12px;">💬 Ask about the unemployed inGeniuses wandering Metropolis, or what BBXL is really building.</p>
    </div><div class="item">
      <strong>BBXL™</strong><br>
      <small>Corporate · Site-wide</small>
      <p style="margin-top:6px; color:var(--text-muted); font-size:14px; line-height:1.5;">The merger of BIGACORP™ and BETTERCORP™ — a corporate space programme threatening to strip Earth's resources. The chapter's main antagonist force, with reps and messaging popping up in every district.</p>
      <p style="margin-top:6px; color:var(--accent-teal); font-size:12px;">💬 Ask a BBXL rep what the space programme actually costs Earth.</p>
    </div></div>

    <div class="card" id="jumpInvolved">
      <h3>🙋 Get involved</h3>
      <p>Ways to actually take part in this chapter, beyond watching:</p>
    </div>
    <div id="getInvolvedList"><div class="item">
      <div class="item-top">
        <div>
          <strong>Cloak of Hope</strong> <br>
          <small>Stitch a 10–15cm fabric patch expressing a hope for the future — post it in ahead of time or stitch it on-site.</small>
          
        </div>
        <button>Mark done</button>
      </div>
    </div><div class="item">
      <div class="item-top">
        <div>
          <strong>Thrutopia workshop</strong> <br>
          <small>Propose your own talk, workshop or session for the new Thrutopia zone.</small>
          <br><a class="linkbtn" href="https://docs.google.com/forms/d/e/1FAIpQLSfh4w5SDGJQoUsgQ2hRD1yZCZvnVMHwPLIMOVAsavkEzCg6fw/viewform" target="_blank" rel="noopener">Submit a workshop</a>
        </div>
        <button>Mark done</button>
      </div>
    </div><div class="item">
      <div class="item-top">
        <div>
          <strong>The Retreat</strong> <br>
          <small>Book in for massage, saunas, hot tubs or sound baths if the pace catches up with you.</small>
          
        </div>
        <button>Mark done</button>
      </div>
    </div></div>

    <div class="card" id="jumpTheories">
      <h3>🔮 Theories</h3>
      <p>Wild guesses count — log your group's best theories about where this chapter's heading.</p>
      <textarea id="theoryInput" placeholder="e.g. I reckon the deepfake Collector is Mr Biga in a mask..."></textarea>
      <button class="action" id="addTheoryBtn">Save theory</button>
    </div>
    <div id="theoriesList"></div>

    <div class="card" id="jumpJournal">
      <h3>😂 Memory journal</h3>
      <p>The funny, ridiculous or unhinged things people actually said — the bits you'll want to read back in a year.</p>
      <textarea id="quoteInput" placeholder="e.g. &quot;I've told the Guardian we're the water inspectors&quot;"></textarea>
      <div class="field" style="margin-top:8px;"><label>Who said it? (optional)</label><input type="text" id="quoteSaidBy" placeholder="e.g. 'the Mr Biga actor', or a stranger in the queue"></div>
      <button class="action" id="addQuoteBtn">Save it</button>
      <button class="ghost" id="copyQuotesBtn" style="margin:8px 0 0;">Copy the journal</button>
    </div>
    <div id="quotesList"></div>

    <div class="card" id="jumpNotes" style="border:1px solid rgba(75,227,172,.45); background:linear-gradient(145deg, rgba(75,227,172,.08), var(--bg-panel));">
      <span class="tag">👥 One view, whose is whose</span>
      <h3>🗂 All notes — everyone's, in one place</h3>
      <p>Everything below is pulled live from this device — district notes, theories, hidden-venue finds, get-involved progress, memory journal, sightings and found socials. Defaults to <strong>By person</strong> so it's always clear who added what. Merge in your teammates' Sync codes first (above), and this becomes the group's full combined picture — copy it out, or use "Download a copy" on Home to bake all of it into one shareable file.</p>
      <div class="venue-filters" id="consolidatedViewToggle">
        <button data-view="category">By category</button>
        <button class="active" data-view="person">By person</button>
      </div>
      <button class="ghost" id="copyConsolidatedBtn" style="margin:4px 0 10px;">Copy full report</button>
      <div id="consolidatedNotes"></div>
    </div>

    <div class="card" id="jumpGlossary">
      <h3>📔 Glossary</h3>
      <p>Terms you'll hear around site:</p>
    </div>
    <div id="glossaryList">
    <div class="item"><strong>Boomtown bucks</strong><p style="margin-top:4px; color:var(--text-muted); font-size:14px;">The story's in-game currency — earn, blag or trade for it, then use it to bribe characters or unlock information.</p></div>
  
    <div class="item"><strong>The Daily Rag</strong><p style="margin-top:4px; color:var(--text-muted); font-size:14px;">The in-universe newspaper, published through the event — pick up copies for story updates and gossip.</p></div>
  
    <div class="item"><strong>Amnesty points</strong><p style="margin-top:4px; color:var(--text-muted); font-size:14px;">Stations near entry where you can dispose of anything prohibited before you're searched, no questions asked.</p></div>
  
    <div class="item"><strong>Eco Bond</strong><p style="margin-top:4px; color:var(--text-muted); font-size:14px;">A deposit-and-return scheme encouraging you to take your tent and rubbish home — part of Boomtown's leave-no-trace push.</p></div>
  
    <div class="item"><strong>Safer Spaces</strong><p style="margin-top:4px; color:var(--text-muted); font-size:14px;">Support for sexual harassment, assault and domestic violence, based in Pepperpot Market, also roaming the site.</p></div>
  
    <div class="item"><strong>IONA</strong><p style="margin-top:4px; color:var(--text-muted); font-size:14px;">The Network's sentient mycelium-network AI, based at the Temple of Zero in Botanica.</p></div>
  
    <div class="item"><strong>BBXL™</strong><p style="margin-top:4px; color:var(--text-muted); font-size:14px;">This chapter's corporate antagonist — the merger of BIGACORP™ and BETTERCORP™, running a space programme.</p></div>
  
    <div class="item"><strong>BLIP</strong><p style="margin-top:4px; color:var(--text-muted); font-size:14px;">Patrick Kahn's new product on Letsbe Avenue, exclusive to VIPPs — what it actually does is part of the mystery.</p></div>
  
    <div class="item"><strong>VIPP</strong><p style="margin-top:4px; color:var(--text-muted); font-size:14px;">A status/tier referenced in this chapter's BLIP storyline — keep an ear out on-site for what it actually means this year.</p></div>
  </div>
  </section>

  <!-- GUIDE -->
  <section id="guide" class="screen">
    <div class="eyebrow">Good to know</div>
    <h2 style="margin-bottom:14px;">Guide</h2>
    <div id="guideContent"><div class="card"><h3>Chapter Five — the one-page briefing</h3><p><strong>Then:</strong> The Collector was freed at the 2025 closing ceremony and passed leadership to The Network. <strong>Now:</strong> Mr Biga and Aurora Venturestone have merged their companies into BBXL™ and are pushing a space programme that treats Earth as a ‘single-use planet’. <strong>The pressure point:</strong> BBXL is draining the city’s resources while still attracting citizens into its VIP world. The Network wants a shared, people-led redesign — but that is not yet a victory.</p></div><div class="card"><h3>A simple way to follow the story</h3><ul class="compact-list"><li><strong>Start with a side:</strong> Area 404 for power and policing; Botanica for portals, IONA and Shadow Post; Letsbe Avenue for the suspiciously cheerful BLIP product.</li><li><strong>Ask for a motive:</strong> ‘What do you want?’, ‘Who benefits?’, ‘Who should we speak to next?’ works better than hunting for a scripted answer.</li><li><strong>Keep a chain:</strong> person → place → strange phrase → next lead. Add it to the district note straight away, then compare notes as a group.</li><li><strong>Watch the public moments:</strong> announcements, meetings, ceremonies, arguments and queues are often more useful than an empty-looking door.</li></ul></div><div class="card"><h3>Districts as story threads</h3><p><strong>Area 404:</strong> a former outsider district now running the city; power is concentrating around the Guardians and Mr Biga. <strong>Botanica:</strong> The Great Mother’s ascension plan sits alongside Temple of Zero’s Shadow Post / IONA photocopier mystery. <strong>Copperwood:</strong> Edna Von Vanderhaus is turning the district into a live film set for <em>Race to the Red Planet</em>. <strong>Oldtown:</strong> Rufus the Red and the Den of Dis Order are building the People’s Republic of Oldtownia. <strong>Metropolis:</strong> Bettercorp’s shiny future has left inGeniuses behind, with risky tours into the broken Betterverse™.</p></div><div class="card"><h3>Ceremonies &amp; city-wide moments</h3><p>The opening and closing ceremonies are the official bookends of the chapter and are worth treating as story events, not merely big shows. Between them, The Daily Rag, district meetings, public broadcasts and characters’ sudden invitations are your best catch-up tools. If you hear a crowd gathering for an announcement, go.</p><a class="linkbtn" href="https://www.boomtownfair.co.uk/discover" target="_blank" rel="noopener">Official story &amp; districts</a></div><div class="card"><h3>Non-music things actually worth pencilling in</h3><ul class="compact-list"><li><strong>Thrutopia:</strong> talks, workshops and thoughtful daytime programming around imagining better futures.</li><li><strong>The Retreat:</strong> massages, hot tubs, sauna/cold splash, sound baths, beauty and maker sessions. It is in the Thrutopia woodlands; book ahead for the most popular slots.</li><li><strong>Cloak of Hope:</strong> stitch a 10–15cm hope patch on-site for the collective artwork.</li><li><strong>Agents of Change:</strong> sign up for the badge, HQ, recycled-T-shirt screen print and early quest access.</li><li><strong>Repairium:</strong> it debuted as a free volunteer repair hub in 2025; look out for its return if gear needs rescuing.</li></ul></div><div class="card"><h3>The Retreat — quick booking guide</h3><p>Current listings include 90-minute spa/hot-tub access (£50), sauna and cold splash (£35), sound baths (£20), massages from £68, plus clay and silver workshops. Bring swimwear for the water/heat sessions; towel rental is available. It is separate from the festival ticket and the official advice is to book early.</p><a class="linkbtn" href="https://www.boomtownfair.co.uk/the-retreat" target="_blank" rel="noopener">Browse &amp; book The Retreat</a></div></div>
  </section>


</main>

<nav class="tabbar">
  <button class="tab active" data-tab="home"><span class="icon">🏠</span>Home</button>
  <button class="tab" data-tab="artists"><span class="icon">🎵</span>Artists</button>
  <button class="tab" data-tab="plan"><span class="icon">⭐</span>Plan</button>
  <button class="tab" data-tab="mapscreen"><span class="icon">🗺</span>Map</button>
  <button class="tab" data-tab="discover"><span class="icon">✨</span>Discover</button>
  <button class="tab" data-tab="guide"><span class="icon">📖</span>Guide</button>
</nav>


<script src="js/app.js"></script>
<script src="js/pwa-register.js"></script>
</body></html>
