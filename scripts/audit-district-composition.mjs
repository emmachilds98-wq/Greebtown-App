import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = name => JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", name), "utf8"));
const massing = read("district-massing-layout.json");
const passages = read("district-passage-layout.json");
const atmosphere = read("district-atmosphere-layout.json");
const expected = ["Grand Central", "Oldtown", "Botanica", "Metropolis", "Area 404", "Quantum"];
const sources = [massing, passages, atmosphere];
const sourceNames = data => new Set((data.clusters || []).map(cluster => cluster.sourceName));
const errors = [];

for(const [index, data] of sources.entries()){
  const names = sourceNames(data);
  for(const expectedName of expected) if(!names.has(expectedName)) errors.push(`authoring source ${index + 1} is missing ${expectedName}`);
  for(const name of names) if(!expected.includes(name)) errors.push(`authoring source ${index + 1} has an unexpected core district ${name}`);
}
const countFor = (data, sourceName, key) => data.clusters.find(cluster => cluster.sourceName === sourceName)?.[key]?.length || 0;
for(const sourceName of expected){
  const structureCount = countFor(massing, sourceName, "masses");
  const passageCount = countFor(passages, sourceName, "passages");
  const detailCount = countFor(atmosphere, sourceName, "features");
  const details = atmosphere.clusters.find(cluster => cluster.sourceName === sourceName)?.features || [];
  const foregroundCount = details.filter(feature => feature.kind !== "light").length;
  const lightCount = details.filter(feature => feature.kind === "light").length;
  if(structureCount < 3 || passageCount < 2 || detailCount < 4) errors.push(`${sourceName} lacks a complete authored composition`);
  if(structureCount > 10 || passageCount > 4 || foregroundCount > 6 || lightCount > 3) errors.push(`${sourceName} is over-detailed for its close-zoom hierarchy`);
  if(new Set(details.map(feature => feature.kind)).size < 3) errors.push(`${sourceName} lacks enough foreground variety to read as designed space`);
}
if(errors.length){ console.error(errors.join("\n")); process.exit(1); }
console.log("# District composition audit");
for(const sourceName of expected){
  const details = atmosphere.clusters.find(cluster => cluster.sourceName === sourceName)?.features || [];
  console.log(`- ${sourceName}: ${countFor(massing, sourceName, "masses")} structures, ${countFor(passages, sourceName, "passages")} passages, ${details.filter(feature => feature.kind !== "light").length} foreground forms, ${details.filter(feature => feature.kind === "light").length} light points`);
}
console.log("District composition audit passed: every core district has reviewed structure, circulation and atmosphere.");
