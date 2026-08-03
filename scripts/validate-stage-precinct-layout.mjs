import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", "stage-precinct-layout.json"), "utf8"));
const runtime = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const ids = new Set(), sourceNames = new Set(), errors = [];
if(data.schemaVersion !== "1.0.0" || data.coordinateSystem !== "anchor-relative-schematic-percent-v1") errors.push("stage precinct schema or coordinate system is invalid");
for(const [index, precinct] of (data.precincts || []).entries()){
  const prefix = `precincts[${index}]`;
  if(!/^[a-z0-9-]+$/.test(precinct.id || "") || ids.has(precinct.id)) errors.push(`${prefix}: requires a unique kebab-case id`);
  ids.add(precinct.id);
  if(!precinct.sourceName || !runtime.includes(`name:"${precinct.sourceName}"`) || sourceNames.has(precinct.sourceName)) errors.push(`${prefix}: sourceName must uniquely match a named runtime place`);
  sourceNames.add(precinct.sourceName);
  if(!["stage-forecourt", "district-concourse", "venue-court"].includes(precinct.kind)) errors.push(`${prefix}: has an unsupported precinct kind`);
  if(!["official-overview", "official-detail"].includes(precinct.evidence)) errors.push(`${prefix}: requires official-map evidence`);
  if(typeof precinct.notes !== "string" || precinct.notes.length < 32) errors.push(`${prefix}: requires a visual-review note`);
  for(const axis of ["x", "y"]) if(!Number.isFinite(precinct.offset?.[axis]) || Math.abs(precinct.offset[axis]) > 10) errors.push(`${prefix}: offset.${axis} must be within 10 schematic units`);
  const footprint = precinct.footprint;
  if(!footprint || !Number.isFinite(footprint.width) || footprint.width < 2 || footprint.width > 16 || !Number.isFinite(footprint.height) || footprint.height < 2 || footprint.height > 12 || !Number.isInteger(footprint.sides) || footprint.sides < 4 || footprint.sides > 10 || !Number.isFinite(footprint.rotation) || footprint.rotation < -180 || footprint.rotation > 180) errors.push(`${prefix}: requires a bounded reviewed footprint`);
}
if(!Array.isArray(data.precincts) || !data.precincts.length) errors.push("stage precinct layout requires at least one reviewed precinct");
if(errors.length){ console.error(errors.join("\n")); process.exit(1); }
console.log(`Stage precinct layout valid: ${data.precincts.length} reviewed central-area surfaces.`);
