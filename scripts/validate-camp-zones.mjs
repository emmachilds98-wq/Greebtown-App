import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "map-system", "data", "camp-zones.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const ids = new Set();
const allowedSurfaces = new Set(["camp-green", "camp-premium"]);
const allowedEvidence = new Set(["official-overview", "official-detail", "schematic"]);
const errors = [];
if(data.schemaVersion !== "1.0.0") errors.push("camp-zones schemaVersion must be 1.0.0");
if(!Array.isArray(data.zones) || !data.zones.length) errors.push("camp-zones must contain at least one zone");
for(const zone of data.zones || []){
  if(!/^[a-z0-9-]+$/.test(zone.id || "")) errors.push(`${zone.id || "(missing id)"}: invalid id`);
  if(ids.has(zone.id)) errors.push(`${zone.id}: duplicate id`);
  ids.add(zone.id);
  if(!zone.name) errors.push(`${zone.id}: missing name`);
  for(const axis of ["x", "y"]) if(!Number.isFinite(zone.position?.[axis]) || zone.position[axis] < 0 || zone.position[axis] > 100) errors.push(`${zone.id}: ${axis} must be between 0 and 100`);
  if(!allowedSurfaces.has(zone.surface)) errors.push(`${zone.id}: invalid surface`);
  if(!allowedEvidence.has(zone.evidence)) errors.push(`${zone.id}: invalid evidence status`);
}
if(errors.length){ console.error(errors.join("\n")); process.exit(1); }
console.log(`Camp zones valid: ${data.zones.length} zones with explicit surface and evidence status.`);
