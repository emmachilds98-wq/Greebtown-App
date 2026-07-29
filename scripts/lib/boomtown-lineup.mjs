// Shared transform: official Boomtown app schedule rows ({Stage, Start, End,
// ActName, Artists}) -> the `artists` array block in js/app.js.
//
// Used by both scripts/import-boomtown-official.mjs (one-off import from a
// captured export file) and scripts/fetch-boomtown-official.mjs (live pull
// from the app's own API), so the two stay in lockstep.

import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const APP_JS = path.join(ROOT, "js", "app.js");
export const SW_JS = path.join(ROOT, "service-worker.js");

const START_MARKER = "// AUTO-GENERATED:LINEUP:START";
const END_MARKER = "// AUTO-GENERATED:LINEUP:END";

const DAY_ORDER = ["Wed", "Thu", "Fri", "Sat", "Sun"];
// Festival "day" runs roughly 10am to next-day ~4/5am — anything before this
// local hour belongs to the previous calendar day's line-up block.
const FESTIVAL_DAY_CUTOFF_HOUR = 10;

// The official app's data has arrived UTF-8-as-windows-1252 mis-decoded in
// every capture so far (accented names like "Adélia" show up as "AdÃ©lia").
// Reverse it where it's detectable.
const CP1252_HIGH = {
  0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026,
  0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02c6, 0x89: 0x2030, 0x8a: 0x0160,
  0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018, 0x92: 0x2019,
  0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02dc, 0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a, 0x9c: 0x0153,
  0x9e: 0x017e, 0x9f: 0x0178,
};
const CP1252_REV = Object.fromEntries(
  Object.entries(CP1252_HIGH).map(([byte, cp]) => [cp, Number(byte)])
);

export function fixMojibake(str) {
  if (!str) return str;
  const bytes = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cp < 0x100) bytes.push(cp);
    else if (CP1252_REV[cp] !== undefined) bytes.push(CP1252_REV[cp]);
    else return str; // contains a "real" non-Latin1 char — not mojibake, leave as-is
  }
  try {
    const fixed = Buffer.from(bytes).toString("utf8");
    return fixed.includes("�") ? str : fixed;
  } catch {
    return str;
  }
}

function parseLocal(value) {
  // "YYYY-MM-DD HH:MM" already in festival-local (UK) time — parse the
  // fields directly rather than letting Date guess a timezone.
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value);
  if (!m) throw new Error(`Unrecognised timestamp: ${value}`);
  const [, y, mo, d, h, mi] = m.map(Number);
  return { y, mo, d, h, mi };
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function festivalDay(parts) {
  const { y, mo, d, h } = parts;
  if (h < FESTIVAL_DAY_CUTOFF_HOUR) {
    // Roll back to the previous calendar day for the "belongs to last
    // night's session" rows (e.g. a 00:00-04:00 set).
    const rolled = new Date(Date.UTC(y, mo - 1, d - 1));
    return WEEKDAYS[rolled.getUTCDay()];
  }
  const dateOnly = new Date(Date.UTC(y, mo - 1, d));
  return WEEKDAYS[dateOnly.getUTCDay()];
}

function hhmm(parts) {
  return `${String(parts.h).padStart(2, "0")}:${String(parts.mi).padStart(2, "0")}`;
}

function escapeForJs(str) {
  return String(str).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function buildArtistsBlock(rawRows) {
  const rows = rawRows
    .map((r) => ({
      // ActName is the display billing (handles "X B2B Y" etc. as one
      // string); Artists is sometimes the only populated field for
      // ceremony/closing-type rows, so fall back to it.
      name: fixMojibake((r.ActName && r.ActName.trim()) || (r.Artists && r.Artists.trim()) || ""),
      stage: fixMojibake(r.Stage),
      start: r.Start,
      end: r.End,
    }))
    .filter((r) => r.name && r.stage && r.start && r.end)
    .map((r) => {
      const startParts = parseLocal(r.start);
      const endParts = parseLocal(r.end);
      return {
        name: r.name,
        stage: r.stage,
        day: festivalDay(startParts),
        start: hhmm(startParts),
        end: hhmm(endParts),
        sortKey: Date.UTC(startParts.y, startParts.mo - 1, startParts.d, startParts.h, startParts.mi),
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
  if (lines.length) lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, "");

  return { block: `const artists = [\n${lines.join("\n")}\n];`, count: rows.length };
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

// Applies buildArtistsBlock's output to js/app.js and service-worker.js on
// disk. Returns { changed, count, nextVersion }.
export function applyLineup(rawRows) {
  const { block: newBlock, count } = buildArtistsBlock(rawRows);

  let appJsText = readFileSync(APP_JS, "utf8");
  const existingBlock = currentLineupBlock(appJsText);

  if (existingBlock === newBlock.trim()) {
    return { changed: false, count };
  }

  appJsText = replaceLineupBlock(appJsText, newBlock);

  let swJsText = readFileSync(SW_JS, "utf8");
  const bumped = bumpVersion(appJsText, swJsText);

  writeFileSync(APP_JS, bumped.newAppJsText);
  writeFileSync(SW_JS, bumped.newSwJsText);

  execFileSync(process.execPath, ["--check", APP_JS], { stdio: "inherit" });

  return { changed: true, count, nextVersion: bumped.nextVersion };
}
