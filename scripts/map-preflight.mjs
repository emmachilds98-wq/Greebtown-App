import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const steps = [
  ["scripts/build-map-data.mjs"],
  ["scripts/validate-map-document.mjs"],
  ["scripts/validate-camp-zones.mjs"],
  ["scripts/validate-evidenced-paths.mjs"],
  ["scripts/validate-district-footprints.mjs"],
  ["scripts/validate-reference-layout.mjs"],
  ["scripts/validate-small-venue-layout.mjs"],
  ["scripts/validate-natural-area-footprints.mjs"],
  ["scripts/validate-site-layout.mjs"],
  ["scripts/validate-stage-precinct-layout.mjs"],
  ["scripts/audit-rendered-layout-alignment.mjs"],
  ["scripts/validate-district-massing-layout.mjs"],
  ["scripts/validate-district-passage-layout.mjs"],
  ["scripts/validate-district-atmosphere-layout.mjs"],
  ["scripts/audit-district-composition.mjs"],
  ["scripts/audit-map-zoom-hierarchy.mjs"],
  ["scripts/audit-ground-use-overlaps.mjs"],
  ["scripts/audit-map-positions.mjs"],
  ["--check", "js/app.js"],
  ["--check", "service-worker.js"]
];

for (const args of steps) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log("Map preflight passed: generated data, evidence layers, cross-layer safeguards and runtime syntax are aligned.");
