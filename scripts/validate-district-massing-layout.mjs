import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", "district-massing-layout.json"), "utf8"));
const runtime = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const clusterIds = new Set(), massIds = new Set(), sources = new Set(), errors = [];
const fail = message => errors.push(message);
if(data.schemaVersion !== "1.0.0" || data.coordinateSystem !== "anchor-relative-schematic-percent-v1") fail("district massing schema or coordinate system is invalid");
for(const [clusterIndex, cluster] of (data.clusters || []).entries()){
  const prefix = `clusters[${clusterIndex}]`;
  if(!/^[a-z0-9-]+$/.test(cluster.id || "") || clusterIds.has(cluster.id)) fail(`${prefix}: requires a unique kebab-case id`);
  clusterIds.add(cluster.id);
  if(!cluster.sourceName || !runtime.includes(`name:"${cluster.sourceName}"`) || sources.has(cluster.sourceName)) fail(`${prefix}: sourceName must uniquely match a named runtime place`);
  sources.add(cluster.sourceName);
  if(!['official-overview', 'official-detail'].includes(cluster.evidence)) fail(`${prefix}: requires official-map evidence`);
  if(typeof cluster.notes !== "string" || cluster.notes.length < 50) fail(`${prefix}: requires a visual-review note`);
  if(!Array.isArray(cluster.masses) || cluster.masses.length < 3 || cluster.masses.length > 16) fail(`${prefix}: requires 3–16 reviewed structural masses`);
  for(const [massIndex, mass] of (cluster.masses || []).entries()){
    const massPrefix = `${prefix}.masses[${massIndex}]`;
    if(!/^[a-z0-9-]+$/.test(mass.id || "") || massIds.has(mass.id)) fail(`${massPrefix}: requires a globally unique kebab-case id`);
    massIds.add(mass.id);
    for(const axis of ['x', 'y']) if(!Number.isFinite(mass.offset?.[axis]) || Math.abs(mass.offset[axis]) > 8) fail(`${massPrefix}: offset.${axis} must be within 8 schematic units`);
    if(!Number.isFinite(mass.width) || mass.width < 0.8 || mass.width > 4 || !Number.isFinite(mass.height) || mass.height < 0.7 || mass.height > 3 || !Number.isFinite(mass.rotation) || mass.rotation < -180 || mass.rotation > 180) fail(`${massPrefix}: requires a bounded footprint`);
    if(!['terracotta', 'ochre', 'dark', 'canvas'].includes(mass.tone)) fail(`${massPrefix}: has an unsupported structural tone`);
    if(!['stall', 'yard', 'tent'].includes(mass.kind)) fail(`${massPrefix}: has an unsupported structural kind`);
  }
}
if(!Array.isArray(data.clusters) || data.clusters.length < 3) fail("district massing layout requires at least three reviewed clusters");
if(errors.length){ console.error(errors.join("\n")); process.exit(1); }
console.log(`District massing layout valid: ${data.clusters.length} clusters and ${massIds.size} reviewed structures.`);
