import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "map-system", "data", "camp-zones.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const referenceLayout = JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", "reference-layout.json"), "utf8"));
const ids = new Set();
const allowedSurfaces = new Set(["camp-green", "camp-premium"]);
const allowedGroundSurfaces = new Set(["hilltop-yellow"]);
const allowedEvidence = new Set(["official-overview", "official-detail", "schematic"]);
const errors = [];
function pointInPolygon([x, y], points){
  let inside = false;
  for(let i=0, j=points.length - 1; i<points.length; j=i++){
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if(((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
if(data.schemaVersion !== "1.0.0") errors.push("camp-zones schemaVersion must be 1.0.0");
if(!Array.isArray(data.zones) || !data.zones.length) errors.push("camp-zones must contain at least one zone");
for(const zone of data.zones || []){
  if(!/^[a-z0-9-]+$/.test(zone.id || "")) errors.push(`${zone.id || "(missing id)"}: invalid id`);
  if(ids.has(zone.id)) errors.push(`${zone.id}: duplicate id`);
  ids.add(zone.id);
  if(!zone.name) errors.push(`${zone.id}: missing name`);
  for(const axis of ["x", "y"]) if(!Number.isFinite(zone.position?.[axis]) || zone.position[axis] < 0 || zone.position[axis] > 100) errors.push(`${zone.id}: ${axis} must be between 0 and 100`);
  const footprint = zone.footprint;
  if(!footprint || !Number.isFinite(footprint.aspect) || footprint.aspect < 0.5 || footprint.aspect > 2 || !Number.isInteger(footprint.sides) || footprint.sides < 4 || footprint.sides > 9 || !Number.isFinite(footprint.rotation) || footprint.rotation < -180 || footprint.rotation > 180) errors.push(`${zone.id}: requires a reviewed footprint aspect, sides and rotation`);
  if(!allowedSurfaces.has(zone.surface)) errors.push(`${zone.id}: invalid surface`);
  if(!allowedEvidence.has(zone.evidence)) errors.push(`${zone.id}: invalid evidence status`);
}
const groundIds = new Set();
for(const field of data.groundUseFields || []){
  if(!/^[a-z0-9-]+$/.test(field.id || "")) errors.push(`${field.id || "(missing id)"}: invalid ground-use id`);
  if(groundIds.has(field.id)) errors.push(`${field.id}: duplicate ground-use id`);
  groundIds.add(field.id);
  if(!field.name || field.kind !== "ground-use") errors.push(`${field.id}: must have a ground-use name and kind`);
  if(!allowedGroundSurfaces.has(field.surface)) errors.push(`${field.id}: invalid ground-use surface`);
  if(!allowedEvidence.has(field.evidence) || field.evidence === "schematic") errors.push(`${field.id}: requires official-map evidence`);
  if(!Array.isArray(field.points) || field.points.length < 3 || field.points.some(point => !Array.isArray(point) || point.length !== 2 || point.some(axis => !Number.isFinite(axis) || axis < 0 || axis > 100))) errors.push(`${field.id}: requires in-bounds polygon points`);
  for(const [lineIndex, line] of (field.detailLines || []).entries()) if(!Array.isArray(line) || line.length < 2 || line.some(point => !Array.isArray(point) || point.length !== 2 || point.some(axis => !Number.isFinite(axis)))) errors.push(`${field.id}: detailLines[${lineIndex}] is invalid`);
  for(const name of field.excludes || []){
    const anchor = referenceLayout.anchors?.[name]?.to;
    if(!anchor) errors.push(`${field.id}: excluded place ${name} has no reviewed anchor`);
    else if(Array.isArray(field.points) && pointInPolygon(anchor, field.points)) errors.push(`${field.id}: excluded place ${name} falls inside the ground-use polygon`);
  }
}
if(errors.length){ console.error(errors.join("\n")); process.exit(1); }
console.log(`Camp zones valid: ${data.zones.length} zones and ${(data.groundUseFields || []).length} reviewed ground-use fields.`);
