import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const document = JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", "map-document.json"), "utf8"));
const camps = JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", "camp-zones.json"), "utf8")).zones;
const stages = document.objects.filter(object => ["main-stage", "minor-stage"].includes(object.metadata?.mapRole));
const amenities = document.objects.filter(object => object.metadata?.mapRole === "amenity");
const distance = (a,b) => Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y);
const closePairs = (items, threshold) => items.flatMap((item, index) => items.slice(index + 1).map(other => ({ item, other, distance: distance(item, other) }))).filter(pair => pair.distance < threshold);
const permittedStagePairs = new Set(["stage-acid-leak|stage-hangar-161"]);
const permittedCampPairs = new Set([
  "camp-camplight|camp-downtown", "camp-downtown|camp-orchid-downtown", "camp-camplight|camp-orchid-downtown", "camp-meadow-accessible|camp-meadow-living",
  // findings_screenshots.md: "EAST CAMPING, EAST GATE, CAMPERVAN FIELD labels
  // appear together moving further east/south-east from Anara, along the
  // perimeter road" — Campervan Field was moved next to East Camping to
  // match that grouping (see its own notes in camp-zones.json).
  "camp-campervan|camp-east",
  // IMG_3670 full-site overview (10 Aug 2026): the top-centre camping
  // cluster (Meadow Accessible / Meadow Living / Camplight / Downtown /
  // Orchid) sits together by West Gate; Valley Camping and Tangerine Fields
  // are adjacent on the east edge; East Camping and Quiet Camping share the
  // south-east corner by East Gate. All re-derived from that overview.
  "camp-camplight|camp-meadow-accessible", "camp-camplight|camp-meadow-living",
  "camp-tangerine|camp-valley", "camp-east|camp-quiet"
]);
const pairId = (a,b) => [a.id,b.id].sort().join("|");
const issues = [];
for(const item of [...stages, ...amenities, ...camps]) for(const axis of ["x", "y"]) if(!Number.isFinite(item.position?.[axis]) || item.position[axis] < 0 || item.position[axis] > 100) issues.push(`${item.id}: ${axis} is out of bounds`);
for(const pair of closePairs(stages, 5)) if(!permittedStagePairs.has(pairId(pair.item, pair.other))) issues.push(`Unexpected close stage pair: ${pair.item.name} / ${pair.other.name} (${pair.distance.toFixed(1)} units)`);
for(const pair of closePairs(camps, 8)) if(!permittedCampPairs.has(pairId(pair.item, pair.other))) issues.push(`Unexpected close camp pair: ${pair.item.name} / ${pair.other.name} (${pair.distance.toFixed(1)} units)`);
if(issues.length){ console.error(`Position audit failed (${issues.length} issue${issues.length === 1 ? "" : "s"}):\n- ${issues.join("\n- ")}`); process.exit(1); }
console.log(`Position audit passed: ${stages.length} stages, ${camps.length} camp zones and ${amenities.length} amenities are in bounds.`);
console.log("Reviewed close pairs: Hangar 161 / Acid Leak; Downtown Camping / Camplight / Camp Orchid; Meadow Camping / Meadow Living.");
