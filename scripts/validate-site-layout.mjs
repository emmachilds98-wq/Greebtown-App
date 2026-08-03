import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", "site-layout.json"), "utf8"));
const mapDocument = JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", "map-document.json"), "utf8"));
const ids = new Set(), errors = [];
if(data.schemaVersion !== "1.0.0" || data.coordinateSystem !== "schematic-percent-v1") errors.push("site layout schema or coordinate system is invalid");
for(const [label, feature, minimum] of [["siteBoundary", data.siteBoundary, 3], ["hilltopDivider", data.hilltopDivider, 2]]){
  if(!feature || !["official-overview", "official-detail"].includes(feature.evidence) || !Array.isArray(feature.points) || feature.points.length < minimum || feature.points.some(point => !Array.isArray(point) || point.length !== 2 || point.some(axis => !Number.isFinite(axis) || axis < -20 || axis > 120))) errors.push(`${label}: requires official evidence and valid schematic points`);
}
for(const [index, area] of (data.parkingAreas || []).entries()){
  const prefix = `parkingAreas[${index}]`;
  if(!/^[a-z0-9-]+$/.test(area.id || "") || ids.has(area.id)) errors.push(`${prefix}: requires a unique kebab-case id`);
  ids.add(area.id);
  if(!area.name || !["official-overview", "official-detail"].includes(area.evidence)) errors.push(`${prefix}: requires a name and official-map evidence`);
  for(const axis of ["x", "y"]) if(!Number.isFinite(area.position?.[axis]) || area.position[axis] < 0 || area.position[axis] > 100) errors.push(`${prefix}: ${axis} must be in bounds`);
  if(!Number.isFinite(area.desiredRadius) || area.desiredRadius <= 0 || area.desiredRadius > 20) errors.push(`${prefix}: desiredRadius is invalid`);
  const footprint = area.footprint;
  if(!footprint || !Number.isFinite(footprint.aspect) || footprint.aspect < 0.4 || footprint.aspect > 2.5 || !Number.isInteger(footprint.sides) || footprint.sides < 4 || footprint.sides > 8 || !Number.isFinite(footprint.rotation) || footprint.rotation < -180 || footprint.rotation > 180) errors.push(`${prefix}: requires a reviewed footprint`);
}
if(!Array.isArray(data.parkingAreas) || !data.parkingAreas.length) errors.push("site layout requires parking areas");
const canonicalGates = mapDocument.objects.filter(object => object.type === "entrance" || object.type === "exit").map(object => object.name);
const configuredGateNames = new Set();
for(const [index, forecourt] of (data.gateForecourts || []).entries()){
  const prefix = `gateForecourts[${index}]`;
  if(!canonicalGates.includes(forecourt.sourceName) || configuredGateNames.has(forecourt.sourceName)) errors.push(`${prefix}: sourceName must uniquely match a canonical gate`);
  configuredGateNames.add(forecourt.sourceName);
  if(!["official-overview", "official-detail"].includes(forecourt.evidence)) errors.push(`${prefix}: requires official-map evidence`);
  const footprint = forecourt.footprint;
  if(!footprint || !Number.isFinite(footprint.width) || footprint.width < 0.5 || footprint.width > 5 || !Number.isFinite(footprint.height) || footprint.height < 0.5 || footprint.height > 5 || !Number.isInteger(footprint.sides) || footprint.sides < 4 || footprint.sides > 8 || !Number.isFinite(footprint.rotation) || footprint.rotation < -180 || footprint.rotation > 180) errors.push(`${prefix}: requires a bounded reviewed footprint`);
}
if(!Array.isArray(data.gateForecourts) || canonicalGates.some(name => !configuredGateNames.has(name)) || configuredGateNames.size !== canonicalGates.length) errors.push("site layout requires one reviewed forecourt for every canonical gate");
if(errors.length){ console.error(errors.join("\n")); process.exit(1); }
console.log(`Site layout valid: ${data.parkingAreas.length} reviewed arrival/parking areas and ${data.gateForecourts.length} gate forecourts.`);
