import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = name => JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", name), "utf8"));
const references = read("reference-layout.json");
const districts = read("district-footprints.json");
const precincts = read("stage-precinct-layout.json");
const document = read("map-document.json");
const errors = [];
const centroid = points => points.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]).map(value => value / points.length);
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

for(const footprint of districts.footprints){
  const target = references.anchors?.[footprint.name]?.to;
  if(!target) continue;
  const drift = distance(centroid(footprint.points), target);
  if(drift > 6) errors.push(`${footprint.name}: rendered footprint drifts ${drift.toFixed(1)} units from its reviewed anchor`);
}

// This is deliberately a source check, rather than an approximation of the
// renderer: it prevents a stale map document plus a hidden runtime offset.
for(const [name, anchor] of Object.entries(references.anchors || {})){
  const object = document.objects.find(item => item.name === name);
  if(object && (object.position.x !== anchor.to[0] || object.position.y !== anchor.to[1])){
    errors.push(`${name}: canonical stage position does not match its reviewed anchor`);
  }
}

const grandCentral = precincts.precincts.find(precinct => precinct.id === "grand-central-forecourt");
const oldtown = precincts.precincts.find(precinct => precinct.id === "oldtown-street-spine");
if(!grandCentral || grandCentral.footprint.width < 10 || grandCentral.footprint.height < 5) errors.push("Grand Central must retain a broad, correctly scaled forecourt");
if(!oldtown || oldtown.footprint.width < 11 || oldtown.footprint.height < 4.5) errors.push("Oldtown must retain a long, correctly scaled street spine");

const gc = references.anchors?.["Grand Central"]?.to;
const oldtownAnchor = references.anchors?.Oldtown?.to;
const lion = references.anchors?.["The Lion's Den"]?.to;
const helix = references.anchors?.Helix?.to;
const hilltop = read("camp-zones.json").groundUseFields?.find(field => field.id === "hilltop-field");
const hilltopXs = hilltop?.points.map(point => point[0]) || [];
const hilltopYs = hilltop?.points.map(point => point[1]) || [];
if(!gc || !oldtownAnchor || oldtownAnchor[1] - gc[1] < 3 || Math.abs(oldtownAnchor[0] - gc[0]) > 5) errors.push("Oldtown must remain directly south of Grand Central");
if(!hilltop || Math.max(...hilltopYs) < 67) errors.push("Hilltop must retain its full reviewed southern extent");
if(!gc || !hilltop || gc[1] >= Math.min(...hilltopYs)) errors.push("Hilltop must remain south of Grand Central");
if(!lion || !hilltop || lion[1] <= Math.min(...hilltopYs) || lion[0] >= Math.min(...hilltopXs)) errors.push("The Lion's Den must remain south-west of the Hilltop field");
if(!helix || !lion || helix[1] >= lion[1]) errors.push("Helix must remain north of The Lion's Den on the reviewed approach");

if(errors.length){ console.error(`Rendered layout alignment failed:\n- ${errors.join("\n- ")}`); process.exit(1); }
console.log("Rendered layout alignment passed: canonical stages, district footprints and the Grand Central / Oldtown / Hilltop / Lion's Den sequence share one reviewed coordinate plane.");
