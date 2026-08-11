import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css", "style.css"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const errors = [];
const matchNumber = pattern => Number(app.match(pattern)?.[1]);
const labelThreshold = matchNumber(/const LABEL_ZOOM_THRESHOLD = (\d+(?:\.\d+)?)/);
const labelDetailThreshold = matchNumber(/const LABEL_DETAIL_ZOOM_THRESHOLD = (\d+(?:\.\d+)?)/);
const entryUsesFullSiteOverview = app.includes('mapGL.once("load", ()=> showSiteOverview(0));');

const sceneStart = app.indexOf("function installEvidenceSceneLayers(map, geo){");
const sceneEnd = app.indexOf("function loadMap(){", sceneStart);
const scene = sceneStart >= 0 && sceneEnd > sceneStart ? app.slice(sceneStart, sceneEnd) : "";
if(!scene) errors.push("the active evidence scene must remain a distinct renderer");

const requiredSceneTokens = [
  'source("evidence-territories", geo.evidenceTerritories)',
  'id:"evidence-territories-fill"',
  'source("evidence-camp-fields", geo.evidenceCampFields)',
  'source("evidence-spine", geo.evidenceSpine)',
  'id:"evidence-detail-paths"',
  'source("evidence-stage-courts", geo.evidenceStageCourts)',
  'source("evidence-compound-blocks", geo.evidenceCompoundBlocks)',
  'source("evidence-stage-halos", geo.evidenceStageHalos)'
];
const missingScene = requiredSceneTokens.filter(token => !scene.includes(token));
if(missingScene.length) errors.push(`active evidence-scene layers missing: ${missingScene.join(", ")}`);
if(/geo\.(siteGround|parkingAreas|roads|gateForecourts|fields|districts)/.test(scene)) errors.push("active scene must not read legacy geometry collections");

if(!Number.isFinite(labelThreshold) || labelThreshold < 15.2 || labelThreshold > 15.5) errors.push("overview-to-explore label threshold is outside the reviewed range");
if(!Number.isFinite(labelDetailThreshold) || labelDetailThreshold < labelThreshold + .25 || labelDetailThreshold > 16) errors.push("close label reveal must follow the overview threshold");
// Entry is the whole reviewed site, not a central crop. It stays below the
// venue-chip tier, then a deliberate zoom reveals the explore/detail labels.
// This keeps every outer camp ground visible in the first reading level.
if(!entryUsesFullSiteOverview) errors.push("entry view must open on the complete reviewed site overview");
if(!scene.includes('id:"evidence-field-lanes", type:"line", source:"evidence-field-lanes", minzoom:15.35')) errors.push("camp circulation should appear at normal district-reading zoom");
if(!scene.includes('id:"evidence-camp-pitches", type:"fill", source:"evidence-camp-pitches", minzoom:15.45')) errors.push("camp pitch detail should remain a second reading level");
if(!scene.includes('id:"evidence-detail-paths", type:"line", source:"evidence-detail-paths", minzoom:15.55')) errors.push("fine routes must not dominate the overview");
if(!scene.includes('id:"evidence-stage-tiers", type:"line", source:"evidence-stage-tiers", minzoom:15.85')) errors.push("stage tiers must remain close-view detail");
if(!scene.includes('id:"evidence-stage-halos", type:"circle", source:"evidence-stage-halos", minzoom:13.5, paint:{ "circle-radius":["interpolate",["linear"],["zoom"]')) errors.push("stage-halo zoom radius must keep zoom as the top-level expression input");

if(!css.includes("#map.map-labels-thin .map-label:not(.overview){display:none;}")) errors.push("overview must reduce labels to territorial anchors");
if(!css.includes("#map.map-labels-mid .map-label.evidence-detail:not(.evidence-primary)")) errors.push("explore zoom must retain a primary-label tier before fine labels");
if(!css.includes(".map-label.map-label-collided{visibility:hidden;}")) errors.push("rendered-label collision protection is required");
if(!app.includes("function evidenceRebuildOverviewLabels()")) errors.push("site overview must have its own source-backed label set");
if(!app.includes('addMapMarker("overview", coord.lat, coord.lon,')) errors.push("site overview anchors must be rendered in the active evidence path");
if(!app.includes('label.classList.contains("evidence-territory")')) errors.push("evidence territories must retain collision priority over close detail");
if(!app.includes('label.classList.contains("evidence-primary") && label.classList.contains("evidence-stage")')) errors.push("primary evidence stages must retain close-view collision priority");

const evidenceGroups = ["territory", "evidence-stage", "evidence-venue", "evidence-camp"];
for(const group of evidenceGroups){
  if(!app.includes(`\"${group}\": true`) && !app.includes(`${group}: true`)) errors.push(`missing active label visibility group: ${group}`);
  if(!index.includes(`data-layer=\"${group}\"`)) errors.push(`missing map control for active label group: ${group}`);
}
if(index.includes('data-layer="poi"') || index.includes('data-layer="friend"') || index.includes('data-layer="minor"')) errors.push("retired map-layer controls remain visible in index.html");

if(errors.length){
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Evidence map hierarchy passed: overview/explore/detail labels ${labelThreshold}/${labelDetailThreshold}; entry uses the complete site overview; evidence-only layers and controls are aligned.`);
