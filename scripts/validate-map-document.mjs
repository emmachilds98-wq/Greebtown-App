import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "map-system", "data", "map-document.json");
const generatedFile = path.join(root, "map-system", "data", "map-data.js");
const document = JSON.parse(fs.readFileSync(file, "utf8"));
const objectTypes = new Set(["terrain", "district", "building", "stage", "vendor", "toilet", "medical", "camping", "entrance", "exit", "path", "boundary", "decoration", "hidden-location"]);
const errors = [];
const fail = (message) => errors.push(message);

if (document.schemaVersion !== "1.0.0") fail("schemaVersion must be 1.0.0");
if (document.coordinateSystem?.name !== "schematic-percent-v1") fail("coordinateSystem.name must be schematic-percent-v1");
const layers = new Set();
for (const layer of document.layers ?? []) {
  if (!/^[a-z0-9-]+$/.test(layer.id ?? "")) fail(`Invalid layer ID: ${layer.id}`);
  if (layers.has(layer.id)) fail(`Duplicate layer ID: ${layer.id}`);
  layers.add(layer.id);
}
const ids = new Set();
for (const object of document.objects ?? []) {
  if (!/^[a-z0-9-]+$/.test(object.id ?? "")) fail(`Invalid object ID: ${object.id}`);
  if (ids.has(object.id)) fail(`Duplicate object ID: ${object.id}`);
  ids.add(object.id);
  if (!objectTypes.has(object.type)) fail(`${object.id}: invalid object type ${object.type}`);
  if (!layers.has(object.layer)) fail(`${object.id}: missing layer ${object.layer}`);
  for (const axis of ["x", "y"]) if (!Number.isFinite(object.position?.[axis]) || object.position[axis] < 0 || object.position[axis] > 100) fail(`${object.id}: ${axis} must be between 0 and 100`);
  for (const field of ["width", "height"]) if (!(object.dimensions?.[field] > 0)) fail(`${object.id}: ${field} must be greater than zero`);
  if (!(object.transform?.scale > 0) || !Number.isFinite(object.transform?.rotation)) fail(`${object.id}: invalid transform`);
  if (object.asset !== null && typeof object.asset !== "string") fail(`${object.id}: asset must be a string or null`);
  if (typeof object.asset === "string" && !object.asset.startsWith("assets/")) fail(`${object.id}: asset must be relative to map-system/assets`);
}
const generatedBanner = "// Generated from map-system/data/map-document.json by scripts/build-map-data.mjs. Do not edit directly.\n";
const expectedGenerated = `${generatedBanner}window.GREEBTOWN_MAP_DOCUMENT = ${JSON.stringify(document, null, 2)};\n`;
if (!fs.existsSync(generatedFile) || fs.readFileSync(generatedFile, "utf8") !== expectedGenerated) {
  fail("map-system/data/map-data.js is stale; run node scripts/build-map-data.mjs");
}
if (errors.length) {
  console.error(`Map document validation failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log(`Map document valid: ${document.objects.length} objects across ${document.layers.length} layers.`);
