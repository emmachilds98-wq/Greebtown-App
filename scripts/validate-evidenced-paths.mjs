import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", "evidenced-paths.json"), "utf8"));
const ids = new Set(), errors = [];
if(data.schemaVersion !== "1.0.0") errors.push("evidenced-paths schemaVersion must be 1.0.0");
for(const route of data.paths || []){
  if(!/^[a-z0-9-]+$/.test(route.id || "")) errors.push(`${route.id || "(missing id)"}: invalid id`);
  if(ids.has(route.id)) errors.push(`${route.id}: duplicate id`);
  ids.add(route.id);
  if(!route.from || !route.to || route.from === route.to) errors.push(`${route.id}: invalid endpoints`);
  if(!["official-overview", "official-detail"].includes(route.evidence)) errors.push(`${route.id}: invalid evidence status`);
  if(!Array.isArray(route.points) || route.points.length < 2) errors.push(`${route.id}: needs at least two points`);
  (route.points || []).forEach((point, index)=>{ if(!Array.isArray(point) || point.length !== 2 || !point.every(value=>Number.isFinite(value) && value >= 0 && value <= 100)) errors.push(`${route.id}: point ${index} must be [x,y] within map bounds`); });
}
if(errors.length){ console.error(errors.join("\n")); process.exit(1); }
console.log(`Evidenced paths valid: ${data.paths.length} routes with checked geometry.`);
