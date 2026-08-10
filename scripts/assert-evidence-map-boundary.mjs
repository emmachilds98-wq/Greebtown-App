import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const fail = message => {
  console.error(`Evidence-map boundary failed: ${message}`);
  process.exit(1);
};

const builderStart = source.indexOf("function buildMapGeoJSON(){");
const evidenceReturn = source.indexOf("return buildEvidenceOnlyMapGeoJSON();", builderStart);
const legacyBuilder = source.indexOf("const districts = locations.filter", builderStart);
if(builderStart < 0 || evidenceReturn < 0 || legacyBuilder < 0 || evidenceReturn > legacyBuilder){
  fail("the evidence-only geometry return must precede the legacy generator");
}

const loadStart = source.indexOf("function loadMap(){");
const activeLayers = source.indexOf("installEvidenceSceneLayers(mapGL, geo);", loadStart);
const activeReturn = source.indexOf("return;", activeLayers);
const legacyLayer = source.indexOf('mapGL.addSource("mapFields"', loadStart);
const markerBoundary = source.indexOf("// Active construction boundary:", loadStart);
const markerReturn = source.indexOf("return;", markerBoundary);
const markerLegacy = source.indexOf("const districtList = locations.filter", loadStart);
if(loadStart < 0 || activeLayers < 0 || activeReturn < 0 || legacyLayer < 0 || activeReturn > legacyLayer){
  fail("legacy MapLibre sources must be behind the evidence-scene return");
}
if(markerBoundary < 0 || markerReturn < 0 || markerLegacy < 0 || markerReturn > markerLegacy){
  fail("legacy DOM markers must be behind the evidence-only return");
}

const activeMap = source.slice(loadStart, activeReturn);
const forbidden = ["locations.filter", "minorStages.forEach", "thingsToFind.forEach", "gates.forEach", "amenities.forEach", "parkingAreas.forEach", "siteLayout.siteBoundary", "BOOMTOWN_LOCATIONS_2026"];
const found = forbidden.filter(token => activeMap.includes(token));
if(found.length) fail(`legacy producers remain active: ${found.join(", ")}`);

console.log("Evidence-map boundary passed: only the evidence scene is constructed at runtime.");
