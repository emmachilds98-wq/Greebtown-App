import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", "district-passage-layout.json"), "utf8"));
const runtime = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const clusterIds = new Set(), passageIds = new Set(), sources = new Set(), errors = [];
const fail = message => errors.push(message);

if(data.schemaVersion !== "1.0.0" || data.coordinateSystem !== "anchor-relative-schematic-percent-v1") fail("district passage schema or coordinate system is invalid");
for(const [clusterIndex, cluster] of (data.clusters || []).entries()){
  const prefix = `clusters[${clusterIndex}]`;
  if(!/^[a-z0-9-]+$/.test(cluster.id || "") || clusterIds.has(cluster.id)) fail(`${prefix}: requires a unique kebab-case id`);
  clusterIds.add(cluster.id);
  if(!cluster.sourceName || !runtime.includes(`name:"${cluster.sourceName}"`) || sources.has(cluster.sourceName)) fail(`${prefix}: sourceName must uniquely match a named runtime place`);
  sources.add(cluster.sourceName);
  if(!['official-overview', 'official-detail'].includes(cluster.evidence)) fail(`${prefix}: requires official-map evidence`);
  if(typeof cluster.notes !== "string" || cluster.notes.length < 70) fail(`${prefix}: requires a detailed visual-review note`);
  if(!Array.isArray(cluster.passages) || cluster.passages.length < 2 || cluster.passages.length > 8) fail(`${prefix}: requires 2–8 reviewed local passages`);
  for(const [passageIndex, passage] of (cluster.passages || []).entries()){
    const passagePrefix = `${prefix}.passages[${passageIndex}]`;
    if(!/^[a-z0-9-]+$/.test(passage.id || "") || passageIds.has(passage.id)) fail(`${passagePrefix}: requires a globally unique kebab-case id`);
    passageIds.add(passage.id);
    if(!['street', 'lane', 'service'].includes(passage.kind)) fail(`${passagePrefix}: has an unsupported passage kind`);
    if(!Number.isFinite(passage.width) || passage.width < 0.24 || passage.width > 0.9) fail(`${passagePrefix}: width must stay within close-zoom passage bounds`);
    if(!Array.isArray(passage.points) || passage.points.length < 2 || passage.points.length > 10) fail(`${passagePrefix}: needs 2–10 anchor-relative points`);
    for(const [pointIndex, point] of (passage.points || []).entries()){
      if(!Array.isArray(point) || point.length !== 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1]) || Math.abs(point[0]) > 8 || Math.abs(point[1]) > 8) fail(`${passagePrefix}.points[${pointIndex}]: must be within 8 schematic units of its source`);
    }
  }
}
if(!Array.isArray(data.clusters) || data.clusters.length < 3) fail("district passage layout requires at least three reviewed clusters");
if(errors.length){ console.error(errors.join("\n")); process.exit(1); }
console.log(`District passage layout valid: ${data.clusters.length} clusters and ${passageIds.size} reviewed local passages.`);
