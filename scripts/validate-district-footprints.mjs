import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", "district-footprints.json"), "utf8"));
const names = new Set(), errors = [];
for(const footprint of data.footprints || []){
  if(!footprint.name || names.has(footprint.name)) errors.push(`${footprint.name || "(missing name)"}: invalid or duplicate district name`);
  names.add(footprint.name);
  if(!["official-overview", "official-detail"].includes(footprint.evidence)) errors.push(`${footprint.name}: invalid evidence status`);
  if(!Array.isArray(footprint.points) || footprint.points.length < 3) errors.push(`${footprint.name}: needs at least three boundary points`);
  (footprint.points || []).forEach((point, index)=>{ if(!Array.isArray(point) || point.length !== 2 || !point.every(value=>Number.isFinite(value) && value >= 0 && value <= 100)) errors.push(`${footprint.name}: point ${index} must be [x,y] within map bounds`); });
}
if(errors.length){ console.error(errors.join("\n")); process.exit(1); }
console.log(`District footprints valid: ${data.footprints.length} reviewed area boundaries.`);
