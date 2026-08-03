import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(root, "map-system", "data", "map-document.json");
const campFile = path.join(root, "map-system", "data", "camp-zones.json");
const pathFile = path.join(root, "map-system", "data", "evidenced-paths.json");
const districtFile = path.join(root, "map-system", "data", "district-footprints.json");
const referenceLayoutFile = path.join(root, "map-system", "data", "reference-layout.json");
const smallVenueLayoutFile = path.join(root, "map-system", "data", "small-venue-layout.json");
const naturalAreaFootprintsFile = path.join(root, "map-system", "data", "natural-area-footprints.json");
const siteLayoutFile = path.join(root, "map-system", "data", "site-layout.json");
const stagePrecinctLayoutFile = path.join(root, "map-system", "data", "stage-precinct-layout.json");
const generatedFile = path.join(root, "map-system", "data", "map-data.js");
const document = JSON.parse(fs.readFileSync(file, "utf8"));
const campZones = JSON.parse(fs.readFileSync(campFile, "utf8"));
const evidencedPaths = JSON.parse(fs.readFileSync(pathFile, "utf8"));
const districtFootprints = JSON.parse(fs.readFileSync(districtFile, "utf8"));
const referenceLayout = JSON.parse(fs.readFileSync(referenceLayoutFile, "utf8"));
const smallVenueLayout = JSON.parse(fs.readFileSync(smallVenueLayoutFile, "utf8"));
const naturalAreaFootprints = JSON.parse(fs.readFileSync(naturalAreaFootprintsFile, "utf8"));
const siteLayout = JSON.parse(fs.readFileSync(siteLayoutFile, "utf8"));
const stagePrecinctLayout = JSON.parse(fs.readFileSync(stagePrecinctLayoutFile, "utf8"));
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
const supersededIds = new Set();
for (const object of document.objects ?? []) {
  if (!/^[a-z0-9-]+$/.test(object.id ?? "")) fail(`Invalid object ID: ${object.id}`);
  if (ids.has(object.id)) fail(`Duplicate object ID: ${object.id}`);
  ids.add(object.id);
  if (!objectTypes.has(object.type)) fail(`${object.id}: invalid object type ${object.type}`);
  if (!layers.has(object.layer)) fail(`${object.id}: missing layer ${object.layer}`);
  for (const axis of ["x", "y"]) if (!Number.isFinite(object.position?.[axis]) || object.position[axis] < 0 || object.position[axis] > 100) fail(`${object.id}: ${axis} must be between 0 and 100`);
  if (object.geometry != null) {
    if (!['polyline', 'polygon'].includes(object.geometry.kind)) fail(`${object.id}: geometry.kind must be polyline or polygon`);
    if (!Array.isArray(object.geometry.points) || object.geometry.points.length < 2) fail(`${object.id}: geometry needs at least two points`);
    for (const [index, point] of (object.geometry.points || []).entries()) {
      for (const axis of ['x', 'y']) if (!Number.isFinite(point?.[axis]) || point[axis] < 0 || point[axis] > 100) fail(`${object.id}: geometry point ${index} ${axis} must be between 0 and 100`);
    }
    if (object.geometry.kind === 'polygon' && object.geometry.points.length < 3) fail(`${object.id}: polygon geometry needs at least three points`);
  }
  for (const field of ["width", "height"]) if (!(object.dimensions?.[field] > 0)) fail(`${object.id}: ${field} must be greater than zero`);
  // Stage hierarchy is visual data, not merely an icon choice. A main
  // stage accidentally assigned a minor footprint (or the reverse) is
  // especially hard to notice in JSON but immediately distorts the map.
  // Keep a generous range for original illustrated shapes while catching
  // the role/scale mix-up that previously made compact venues read as
  // headline fields.
  if (object.type === "stage") {
    const role = object.metadata?.mapRole;
    if (!['main-stage', 'minor-stage'].includes(role)) fail(`${object.id}: stage metadata.mapRole must be main-stage or minor-stage`);
    if (role === 'main-stage' && (object.dimensions.width < 4 || object.dimensions.height < 2)) fail(`${object.id}: main-stage footprint is too small for its visual hierarchy`);
    if (role === 'minor-stage' && (object.dimensions.width > 4 || object.dimensions.height > 4)) fail(`${object.id}: minor-stage footprint is too large for its visual hierarchy`);
  }
  if (!(object.transform?.scale > 0) || !Number.isFinite(object.transform?.rotation)) fail(`${object.id}: invalid transform`);
  if (object.asset !== null && typeof object.asset !== "string") fail(`${object.id}: asset must be a string or null`);
  if (typeof object.asset === "string" && !object.asset.startsWith("assets/")) fail(`${object.id}: asset must be relative to map-system/assets`);
  for (const replacedId of object.metadata?.supersedes || []) supersededIds.add(replacedId);
}
for (const replacedId of supersededIds) if (!ids.has(replacedId)) fail(`Superseded object does not exist: ${replacedId}`);
const generatedBanner = "// Generated from map-system/data/map-document.json by scripts/build-map-data.mjs. Do not edit directly.\n";
const expectedGenerated = `${generatedBanner}window.GREEBTOWN_MAP_DOCUMENT = ${JSON.stringify(document, null, 2)};\nwindow.GREEBTOWN_CAMP_ZONES = ${JSON.stringify(campZones, null, 2)};\nwindow.GREEBTOWN_EVIDENCED_PATHS = ${JSON.stringify(evidencedPaths, null, 2)};\nwindow.GREEBTOWN_DISTRICT_FOOTPRINTS = ${JSON.stringify(districtFootprints, null, 2)};\nwindow.GREEBTOWN_REFERENCE_LAYOUT = ${JSON.stringify(referenceLayout, null, 2)};\nwindow.GREEBTOWN_SMALL_VENUE_LAYOUT = ${JSON.stringify(smallVenueLayout, null, 2)};\nwindow.GREEBTOWN_NATURAL_AREA_FOOTPRINTS = ${JSON.stringify(naturalAreaFootprints, null, 2)};\nwindow.GREEBTOWN_SITE_LAYOUT = ${JSON.stringify(siteLayout, null, 2)};\nwindow.GREEBTOWN_STAGE_PRECINCT_LAYOUT = ${JSON.stringify(stagePrecinctLayout, null, 2)};\n`;
if (!fs.existsSync(generatedFile) || fs.readFileSync(generatedFile, "utf8") !== expectedGenerated) {
  fail("map-system/data/map-data.js is stale; run node scripts/build-map-data.mjs");
}
if (errors.length) {
  console.error(`Map document validation failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log(`Map document valid: ${document.objects.length} objects across ${document.layers.length} layers.`);
