import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "map-system", "data", "map-document.json");
const campSource = path.join(root, "map-system", "data", "camp-zones.json");
const pathSource = path.join(root, "map-system", "data", "evidenced-paths.json");
const districtSource = path.join(root, "map-system", "data", "district-footprints.json");
const referenceLayoutSource = path.join(root, "map-system", "data", "reference-layout.json");
const output = path.join(root, "map-system", "data", "map-data.js");
const document = JSON.parse(fs.readFileSync(source, "utf8"));
const campZones = JSON.parse(fs.readFileSync(campSource, "utf8"));
const evidencedPaths = JSON.parse(fs.readFileSync(pathSource, "utf8"));
const districtFootprints = JSON.parse(fs.readFileSync(districtSource, "utf8"));
const referenceLayout = JSON.parse(fs.readFileSync(referenceLayoutSource, "utf8"));
const banner = "// Generated from map-system/data/map-document.json by scripts/build-map-data.mjs. Do not edit directly.\n";
fs.writeFileSync(output, `${banner}window.GREEBTOWN_MAP_DOCUMENT = ${JSON.stringify(document, null, 2)};\nwindow.GREEBTOWN_CAMP_ZONES = ${JSON.stringify(campZones, null, 2)};\nwindow.GREEBTOWN_EVIDENCED_PATHS = ${JSON.stringify(evidencedPaths, null, 2)};\nwindow.GREEBTOWN_DISTRICT_FOOTPRINTS = ${JSON.stringify(districtFootprints, null, 2)};\nwindow.GREEBTOWN_REFERENCE_LAYOUT = ${JSON.stringify(referenceLayout, null, 2)};\n`);
console.log(`Built ${path.relative(root, output)} from ${path.relative(root, source)}.`);
