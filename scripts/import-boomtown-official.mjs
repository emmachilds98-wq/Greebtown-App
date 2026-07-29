#!/usr/bin/env node
// One-off / repeatable importer for a schedule export captured directly from
// the official Boomtown app's own API traffic (e.g. via HTTP Toolkit on a
// device you control), as opposed to scripts/sync-boomtown-lineup.mjs which
// pulls from Clashfinder because Boomtown has no *public* API.
//
// Input: a JSON array of {Stage, Start, End, ActName, Artists} objects
// (the shape the official app's own timetable endpoint returns), Start/End
// as "YYYY-MM-DD HH:MM" strings already in UK local time.
//
// Usage: node scripts/import-boomtown-official.mjs <path-to-export.json>
//
// For a live pull straight from the app's API (no manual export needed),
// see scripts/fetch-boomtown-official.mjs instead — this script stays
// useful as a fallback whenever you have a capture file on disk.

import { readFileSync } from "node:fs";
import { applyLineup } from "./lib/boomtown-lineup.mjs";

function loadExport(filePath) {
  const raw = readFileSync(filePath, "utf8").replace(/^﻿/, "");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("Expected a JSON array of schedule rows");
  return data;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: node scripts/import-boomtown-official.mjs <path-to-export.json>");
    process.exit(1);
  }

  const rawRows = loadExport(filePath);
  console.log(`Loaded ${rawRows.length} rows from ${filePath}.`);

  const result = applyLineup(rawRows);
  console.log(`Built ${result.count} valid line-up entries.`);

  if (!result.changed) {
    console.log("No lineup changes — nothing to do.");
    return;
  }

  console.log(`Lineup updated, bumped to ${result.nextVersion}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
