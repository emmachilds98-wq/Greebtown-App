import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Lightweight integrity check for the evidence-only renderer.
//
// The map is being rebuilt from the north-up IMG_3670 master, so the previous
// version of this audit — which pinned the old portrait silhouette, inline
// polygon literals and retired camp names (Sunset Camping, Camp at Hilltop) —
// no longer describes the active scene and was intentionally removed. This
// keeps only the checks that stay true regardless of layout: the evidence
// display plane is present and the scene is built from the shared anchor set.
// Richer geometry rules will be re-added once the new layout is settled.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const fail = message => {
  console.error(`Evidence-map proportions failed: ${message}`);
  process.exit(1);
};

if(!app.includes("const EVIDENCE_LAYOUT_Y_SCALE = 2;")) fail("the active evidence renderer must retain the reviewed display-plane ratio");
if(!app.includes("function evidenceSchematicToLatLon(xPercent, yPercent){")) fail("the display-plane ratio must stay isolated to evidence-scene geometry");
if(!app.includes("const evidenceRingToLngLat = ring =>")) fail("active evidence geometry must use the reviewed display plane");
if(!app.includes("const EVIDENCE_ANCHORS = {")) fail("the evidence scene must be built from the shared north-up anchor set");
if(!app.includes("geo.evidenceTerritories = {")) fail("the evidence scene must build its territory collection");
if(!app.includes("geo.evidenceDistrictContours = {")) fail("the evidence scene must build its zoning/boundary lines");

console.log("Evidence map integrity passed: the evidence display plane and north-up anchor set are present.");
