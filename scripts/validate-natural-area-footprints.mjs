import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", "natural-area-footprints.json"), "utf8"));
const campZones = JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", "camp-zones.json"), "utf8"));
const mapDocument = JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", "map-document.json"), "utf8"));
const runtime = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const errors = [], ids = new Set();
const campNames = new Set((campZones.zones || []).flatMap(zone => [zone.name, zone.text]).filter(Boolean));
const runtimeWoodlandNames = new Set((mapDocument.objects || []).filter(object => object.type === "stage" && /Forest|Woods/.test(object.name || "")).map(object => object.name));
for (const [index, area] of (data.footprints || []).entries()) {
  const prefix = `footprints[${index}]`;
  if (!area.id || ids.has(area.id)) errors.push(`${prefix}: missing or duplicate id`);
  ids.add(area.id);
  if (!area.sourceName || !runtime.includes(`name:"${area.sourceName}"`)) errors.push(`${prefix}: sourceName is not a runtime named place`);
  if (campNames.has(area.sourceName)) errors.push(`${prefix}: a natural area must not use a camping-zone source`);
  if (area.kind !== "woodland") errors.push(`${prefix}: unsupported natural-area kind`);
  if (!['official-detail', 'official-overview'].includes(area.evidence)) errors.push(`${prefix}: requires official map evidence`);
  for (const field of ['points', 'fringePoints']) {
    if (!Array.isArray(area[field]) || area[field].length < 3) errors.push(`${prefix}: ${field} needs at least three points`);
    (area[field] || []).forEach((point, pointIndex)=>{ if (!Array.isArray(point) || point.length !== 2 || !point.every(value => Number.isFinite(value) && Math.abs(value) <= 25)) errors.push(`${prefix}: ${field}[${pointIndex}] must be a relative [x,y] within 25 units`); });
  }
  (area.treeClusters || []).forEach((cluster, clusterIndex)=>{ if (!Array.isArray(cluster) || cluster.length !== 4 || !cluster.every(Number.isFinite) || cluster[2] < 1 || cluster[3] <= 0 || cluster[3] > 8) errors.push(`${prefix}: treeClusters[${clusterIndex}] is invalid`); });
}
const reviewedSources = new Set((data.footprints || []).map(area => area.sourceName));
for (const woodlandName of runtimeWoodlandNames) if (!reviewedSources.has(woodlandName)) errors.push(`${woodlandName}: named woodland has no reviewed natural-area footprint`);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`Natural-area footprints valid: ${data.footprints.length} reviewed non-camping areas.`);
