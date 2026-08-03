import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", "reference-layout.json"), "utf8"));
const errors = [];
const MAX_CLUSTER_SHIFT = data.reviewedOverview === true ? 30 : 8;
const observationIds = new Set();
for(const [index, observation] of (data.observations || []).entries()){
  const prefix = `observations[${index}]`;
  if(!/^[a-z0-9-]+$/.test(observation.id || "") || observationIds.has(observation.id)) errors.push(`${prefix}: requires a unique kebab-case id`);
  observationIds.add(observation.id);
  if(!observation.source || !observation.notes) errors.push(`${prefix}: requires source and notes`);
  if(!["official-overview", "official-detail"].includes(observation.evidence)) errors.push(`${prefix}: requires official-map evidence`);
  if(!Array.isArray(observation.regions) || !observation.regions.length || observation.regions.some(region => typeof region !== "string" || !region.trim())) errors.push(`${prefix}: requires at least one named region`);
}
for(const [name, anchor] of Object.entries(data.anchors || {})){
  for(const key of ["from", "to"]) if(!Array.isArray(anchor[key]) || anchor[key].length !== 2 || !anchor[key].every(value=>Number.isFinite(value) && value >= 0 && value <= 100)) errors.push(`${name}: ${key} must be a two-value in-bounds point`);
  if(Array.isArray(anchor.from) && Array.isArray(anchor.to) && anchor.from.length === 2 && anchor.to.length === 2){
    const shift = Math.hypot(anchor.to[0] - anchor.from[0], anchor.to[1] - anchor.from[1]);
    if(shift > MAX_CLUSTER_SHIFT) errors.push(`${name}: cluster shift ${shift.toFixed(2)} exceeds the ${MAX_CLUSTER_SHIFT}-unit review limit; edit canonical stage positions instead`);
  }
}
for(const [member, anchor] of Object.entries(data.members || {})) if(!data.anchors?.[anchor]) errors.push(`${member}: unknown anchor ${anchor}`);
if(errors.length){ console.error(errors.join("\n")); process.exit(1); }
console.log(`Reference layout valid: ${Object.keys(data.anchors || {}).length} cluster anchors, ${Object.keys(data.members || {}).length} member assignments and ${(data.observations || []).length} official-map observations.`);
