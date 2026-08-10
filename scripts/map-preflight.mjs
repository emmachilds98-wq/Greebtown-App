import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const steps = [
  ["scripts/assert-evidence-map-boundary.mjs"],
  ["--check", "js/app.js"],
  ["--check", "service-worker.js"]
];

for (const args of steps) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log("Map preflight passed: the evidence-only runtime boundary and syntax are aligned.");
