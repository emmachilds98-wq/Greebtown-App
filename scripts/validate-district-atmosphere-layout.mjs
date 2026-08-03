import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", "district-atmosphere-layout.json"), "utf8"));
const runtime = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const clusterIds = new Set(), featureIds = new Set(), sources = new Set(), errors = [];
const fail = message => errors.push(message);
const kinds = new Set(["canopy", "planter", "seating", "art", "light"]);
const tones = new Set(["canvas", "leaf", "ember", "wood", "violet", "warm", "cool"]);

if(data.schemaVersion !== "1.0.0" || data.coordinateSystem !== "anchor-relative-schematic-percent-v1") fail("district atmosphere schema or coordinate system is invalid");
for(const [clusterIndex, cluster] of (data.clusters || []).entries()){
  const prefix = `clusters[${clusterIndex}]`;
  if(!/^[a-z0-9-]+$/.test(cluster.id || "") || clusterIds.has(cluster.id)) fail(`${prefix}: requires a unique kebab-case id`);
  clusterIds.add(cluster.id);
  if(!cluster.sourceName || !runtime.includes(`name:"${cluster.sourceName}"`) || sources.has(cluster.sourceName)) fail(`${prefix}: sourceName must uniquely match a named runtime place`);
  sources.add(cluster.sourceName);
  if(!['official-overview', 'official-detail'].includes(cluster.evidence)) fail(`${prefix}: requires official-map evidence`);
  if(typeof cluster.notes !== "string" || cluster.notes.length < 90) fail(`${prefix}: requires a detailed visual-review note`);
  if(!Array.isArray(cluster.features) || cluster.features.length < 4 || cluster.features.length > 12) fail(`${prefix}: requires 4–12 reviewed atmosphere features`);
  for(const [featureIndex, feature] of (cluster.features || []).entries()){
    const featurePrefix = `${prefix}.features[${featureIndex}]`;
    if(!/^[a-z0-9-]+$/.test(feature.id || "") || featureIds.has(feature.id)) fail(`${featurePrefix}: requires a globally unique kebab-case id`);
    featureIds.add(feature.id);
    if(!kinds.has(feature.kind)) fail(`${featurePrefix}: has an unsupported detail kind`);
    if(!tones.has(feature.tone)) fail(`${featurePrefix}: has an unsupported detail tone`);
    for(const axis of ['x', 'y']) if(!Number.isFinite(feature.offset?.[axis]) || Math.abs(feature.offset[axis]) > 6) fail(`${featurePrefix}: offset.${axis} must be within 6 schematic units`);
    if(!Number.isFinite(feature.size) || feature.size < 0.18 || feature.size > 1.2) fail(`${featurePrefix}: size must stay within close-zoom detail bounds`);
    if(!Number.isFinite(feature.rotation) || feature.rotation < -180 || feature.rotation > 180) fail(`${featurePrefix}: rotation must be bounded`);
  }
}
if(!Array.isArray(data.clusters) || data.clusters.length < 3) fail("district atmosphere layout requires at least three reviewed clusters");
if(errors.length){ console.error(errors.join("\n")); process.exit(1); }
console.log(`District atmosphere layout valid: ${data.clusters.length} clusters and ${featureIds.size} reviewed foreground details.`);
