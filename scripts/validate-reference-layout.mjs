import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", "reference-layout.json"), "utf8"));
const errors = [];
for(const [name, anchor] of Object.entries(data.anchors || {})){
  for(const key of ["from", "to"]) if(!Array.isArray(anchor[key]) || anchor[key].length !== 2 || !anchor[key].every(value=>Number.isFinite(value) && value >= 0 && value <= 100)) errors.push(`${name}: ${key} must be a two-value in-bounds point`);
}
for(const [member, anchor] of Object.entries(data.members || {})) if(!data.anchors?.[anchor]) errors.push(`${member}: unknown anchor ${anchor}`);
if(errors.length){ console.error(errors.join("\n")); process.exit(1); }
console.log(`Reference layout valid: ${Object.keys(data.anchors || {}).length} cluster anchors and ${Object.keys(data.members || {}).length} member assignments.`);
