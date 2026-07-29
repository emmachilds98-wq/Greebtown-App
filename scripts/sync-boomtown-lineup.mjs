#!/usr/bin/env node
// Pulls the live Boomtown timetable from Clashfinder and regenerates the
// `artists` array in js/app.js between the AUTO-GENERATED:LINEUP markers.
//
// Why Clashfinder and not Boomtown's own app: Boomtown doesn't publish a
// public API. Clashfinder hosts a structured, API-accessible copy of the
// same timetable (this repo already leaned on it by hand — see the
// "Pulled from Clashfinder's Boomtown 26 schedule" comment history in
// js/app.js) and is the only source here that's actually fetchable on a
// schedule without reverse-engineering the official app's private traffic.
//
// Auth per https://clashfinder.com/pages/api/: authPublicKey is an
// sha256 hex hash of `${username}${privateKey}`. Required env:
//   CLASHFINDER_USERNAME
//   CLASHFINDER_PRIVATE_KEY
// Optional:
//   CLASHFINDER_SLUG (default "boomtown26" — the id from the clashfinder's
//     own URL, https://clashfinder.com/s/<slug>/)
//
// Safe by design: saved personal/group schedules are reconciled against
// `artists` by name at load time (see reconcileSavedArtists() in app.js),
// and one-off extras live in the separate `customArtists` store key — so
// wholesale-replacing this array on every sync is exactly what the app
// was built to tolerate.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP_JS = path.join(ROOT, "js", "app.js");
const SW_JS = path.join(ROOT, "service-worker.js");

const START_MARKER = "// AUTO-GENERATED:LINEUP:START";
const END_MARKER = "// AUTO-GENERATED:LINEUP:END";

const DAY_ORDER = ["Wed", "Thu", "Fri", "Sat", "Sun"];
// Festival "day" runs roughly 10am to next-day ~4/5am — anything before this
// local hour belongs to the previous calendar day's line-up block, matching
// how the existing hand-entered data treats e.g. 00:00-04:00 sets as still
// part of the prior day's night session.
const FESTIVAL_DAY_CUTOFF_HOUR = 10;

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

function buildAuthPublicKey(username, privateKey) {
  return createHash("sha256").update(`${username}${privateKey}`).digest("hex");
}

async function fetchClashfinderEvent(slug, username, privateKey) {
  const authPublicKey = buildAuthPublicKey(username, privateKey);
  const url = `https://clashfinder.com/data/s/${encodeURIComponent(slug)}.json` +
    `?authUsername=${encodeURIComponent(username)}&authPublicKey=${authPublicKey}`;
  const res = await fetch(url, { headers: { "User-Agent": "greebtown-app-lineup-sync" } });
  if (!res.ok) {
    throw new Error(`Clashfinder request failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data;
}

// Clashfinder's JSON shape varies by export version — tolerate a few.
function extractActs(data) {
  const acts = data.acts || data.data || (Array.isArray(data) ? data : null);
  if (!acts) throw new Error("Unrecognised Clashfinder response shape — no acts/data array found");
  return acts.map((raw) => ({
    name: raw.act ?? raw.name ?? raw.title,
    stage: raw.stage ?? raw.location,
    start: raw.start,
    end: raw.end,
  }));
}

function toDate(value) {
  // Clashfinder timestamps are typically epoch seconds or ISO strings.
  if (typeof value === "number") return new Date(value * 1000);
  if (typeof value === "string" && /^\d+$/.test(value)) return new Date(Number(value) * 1000);
  return new Date(value);
}

function londonParts(date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    weekday: parts.weekday,
    hour: Number(parts.hour === "24" ? "0" : parts.hour),
    minute: Number(parts.minute),
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

function festivalDay(date) {
  const { weekday, hour, dateKey } = londonParts(date);
  const shortDay = weekday.slice(0, 3);
  if (hour < FESTIVAL_DAY_CUTOFF_HOUR) {
    const prev = new Date(date.getTime() - 12 * 60 * 60 * 1000);
    return londonParts(prev).weekday.slice(0, 3);
  }
  return shortDay;
}

function hhmm(date) {
  const { hour, minute } = londonParts(date);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function escapeForJs(str) {
  return String(str).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildArtistsBlock(acts) {
  const rows = acts
    .filter((a) => a.name && a.stage && a.start && a.end)
    .map((a) => {
      const startDate = toDate(a.start);
      const endDate = toDate(a.end);
      return {
        name: a.name,
        stage: a.stage,
        day: festivalDay(startDate),
        start: hhmm(startDate),
        end: hhmm(endDate),
        sortKey: startDate.getTime(),
      };
    });

  rows.sort((a, b) => {
    const da = DAY_ORDER.indexOf(a.day);
    const db = DAY_ORDER.indexOf(b.day);
    if (da !== db) return da - db;
    if (a.stage !== b.stage) return a.stage.localeCompare(b.stage);
    return a.sortKey - b.sortKey;
  });

  const lines = [];
  let currentDay = null;
  let currentStage = null;
  for (const r of rows) {
    if (r.day !== currentDay) {
      currentDay = r.day;
      currentStage = null;
      lines.push(`  // ================= ${currentDay.toUpperCase()} =================`);
    }
    if (r.stage !== currentStage) {
      currentStage = r.stage;
      lines.push(`  // --- ${currentDay}: ${currentStage} ---`);
    }
    lines.push(
      `  {name:"${escapeForJs(r.name)}",stage:"${escapeForJs(r.stage)}",day:"${r.day}",start:"${r.start}",end:"${r.end}"},`
    );
  }
  // Drop the trailing comma on the final entry to match existing style.
  if (lines.length) lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, "");

  return `const artists = [\n${lines.join("\n")}\n];`;
}

function replaceLineupBlock(appJsText, newBlock) {
  const startIdx = appJsText.indexOf(START_MARKER);
  const endIdx = appJsText.indexOf(END_MARKER);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error("Could not find AUTO-GENERATED:LINEUP markers in js/app.js");
  }
  const afterStartMarkerLineEnd = appJsText.indexOf("\n", startIdx) + 1;
  const before = appJsText.slice(0, afterStartMarkerLineEnd);
  const after = appJsText.slice(endIdx);
  return `${before}${newBlock}\n${after}`;
}

function currentLineupBlock(appJsText) {
  const startIdx = appJsText.indexOf(START_MARKER);
  const endIdx = appJsText.indexOf(END_MARKER);
  const afterStartMarkerLineEnd = appJsText.indexOf("\n", startIdx) + 1;
  return appJsText.slice(afterStartMarkerLineEnd, endIdx).trim();
}

function bumpVersion(appJsText, swJsText) {
  const m = swJsText.match(/CACHE_VERSION\s*=\s*"v(\d+)"/);
  if (!m) throw new Error("Could not find CACHE_VERSION in service-worker.js");
  const nextVersion = `v${Number(m[1]) + 1}`;
  const nowIso = new Date().toISOString().replace(/\.\d+Z$/, "Z");

  const newSwJsText = swJsText.replace(/CACHE_VERSION\s*=\s*"v\d+"/, `CACHE_VERSION = "${nextVersion}"`);
  let newAppJsText = appJsText.replace(/APP_CACHE_VERSION\s*=\s*"v\d+"/, `APP_CACHE_VERSION = "${nextVersion}"`);
  newAppJsText = newAppJsText.replace(/APP_BUILD_TIME\s*=\s*"[^"]*"/, `APP_BUILD_TIME = "${nowIso}"`);
  return { newAppJsText, newSwJsText, nextVersion };
}

async function main() {
  const username = requireEnv("CLASHFINDER_USERNAME");
  const privateKey = requireEnv("CLASHFINDER_PRIVATE_KEY");
  const slug = process.env.CLASHFINDER_SLUG || "boomtown26";

  console.log(`Fetching Clashfinder event "${slug}"...`);
  const data = await fetchClashfinderEvent(slug, username, privateKey);
  const acts = extractActs(data);
  console.log(`Got ${acts.length} acts.`);

  const newBlock = buildArtistsBlock(acts);

  let appJsText = readFileSync(APP_JS, "utf8");
  const existingBlock = currentLineupBlock(appJsText);

  if (existingBlock === newBlock.trim()) {
    console.log("No lineup changes — nothing to do.");
    return;
  }

  appJsText = replaceLineupBlock(appJsText, newBlock);

  let swJsText = readFileSync(SW_JS, "utf8");
  const bumped = bumpVersion(appJsText, swJsText);

  writeFileSync(APP_JS, bumped.newAppJsText);
  writeFileSync(SW_JS, bumped.newSwJsText);

  execFileSync(process.execPath, ["--check", APP_JS], { stdio: "inherit" });

  console.log(`Lineup updated, bumped to ${bumped.nextVersion}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
