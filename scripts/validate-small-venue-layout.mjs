import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "map-system", "data", "small-venue-layout.json");
const runtimeSource = path.join(root, "js", "app.js");
const layout = JSON.parse(fs.readFileSync(source, "utf8"));
const runtime = fs.readFileSync(runtimeSource, "utf8");
const allowedShapes = new Set(["stall", "round", "yard"]);
const names = new Set();
const errors = [];

if (!Array.isArray(layout.venues) || layout.venues.length === 0) errors.push("venues must be a non-empty array");
for (const [index, venue] of (layout.venues || []).entries()) {
  const prefix = `venues[${index}]`;
  if (!venue.name || !venue.sourceName) errors.push(`${prefix} needs name and sourceName`);
  if (venue.sourceName && !runtime.includes(`name:"${venue.sourceName}"`)) errors.push(`${prefix} sourceName is not a runtime named place`);
  if (names.has(venue.name)) errors.push(`${prefix} duplicates ${venue.name}`);
  names.add(venue.name);
  if (!allowedShapes.has(venue.shape)) errors.push(`${prefix} has an unsupported shape`);
  if (!Number.isFinite(venue.width) || venue.width <= 0 || venue.width > 6) errors.push(`${prefix} has invalid width`);
  if (!Number.isFinite(venue.height) || venue.height <= 0 || venue.height > 6) errors.push(`${prefix} has invalid height`);
  if (!Number.isFinite(venue.rotation) || Math.abs(venue.rotation) > 180) errors.push(`${prefix} has invalid rotation`);
  if (venue.positionEvidence !== "official-detail" && venue.positionEvidence !== "official-overview") errors.push(`${prefix} needs official map evidence`);
}
if (errors.length) {
  console.error(`Small-venue layout validation failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Small-venue layout passed: ${layout.venues.length} reviewed venues.`);
