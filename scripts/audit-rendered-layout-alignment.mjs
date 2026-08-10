import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = name => JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", name), "utf8"));
const references = read("reference-layout.json");
const districts = read("district-footprints.json");
const precincts = read("stage-precinct-layout.json");
const errors = [];
const centroid = points => points.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]).map(value => value / points.length);
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

for(const footprint of districts.footprints){
  const target = references.anchors?.[footprint.name]?.to;
  if(!target) continue;
  const centre = centroid(footprint.points);
  const drift = distance(centre, target);
  if(drift > 6) errors.push(`${footprint.name}: rendered footprint drifts ${drift.toFixed(1)} units from its reviewed anchor`);
}

const grandCentral = precincts.precincts.find(precinct => precinct.id === "grand-central-forecourt");
const oldtown = precincts.precincts.find(precinct => precinct.id === "oldtown-street-spine");
if(!grandCentral || grandCentral.footprint.width < 10 || grandCentral.footprint.height < 5) errors.push("Grand Central must retain a broad, correctly scaled forecourt");
if(!oldtown || oldtown.footprint.width < 11 || oldtown.footprint.height < 4.5) errors.push("Oldtown must retain a long, correctly scaled street spine");
const gcAnchor = references.anchors?.["Grand Central"]?.to;
const oldtownAnchor = references.anchors?.Oldtown?.to;
if(!gcAnchor || !oldtownAnchor || oldtownAnchor[1] - gcAnchor[1] < 8 || Math.abs(oldtownAnchor[0] - gcAnchor[0]) > 5) errors.push("Oldtown must remain directly south of the Grand Central Hilltop sequence");
const helixAnchor = references.anchors?.Helix?.to;
const hilltop = read("camp-zones.json").groundUseFields?.find(field => field.id === "hilltop-field");
// Threshold lowered 62 -> 50: a clean, high-res official-app close-up of
// this exact area (supplied directly this session) shows Hilltop as a
// compact ~1.4:1 height:width shape whose real south tip sits north of
// Quantum, not reaching down to it — the original 62 encoded a looser
// "must reach Quantum" inference from indirect video-frame evidence that
// this clearer reference supersedes. Kept as a floor (not removed) so a
// future pass can't silently flatten Hilltop back into a squat blob.
if(!hilltop || Math.max(...hilltop.points.map(point => point[1])) < 50) errors.push("Hilltop must remain a north-south corridor reaching down past Grand Central/Oldtown");
if(!helixAnchor || helixAnchor[1] < 60 || helixAnchor[0] > 63) errors.push("Helix must remain beside the lower Hilltop / Quantum junction");
if(!gcAnchor || !hilltop || gcAnchor[0] >= Math.min(...hilltop.points.map(point => point[0]))) errors.push("Grand Central must remain west of the Hilltop corridor");

if(errors.length){ console.error(`Rendered layout alignment failed:\n- ${errors.join("\n- ")}`); process.exit(1); }
console.log("Rendered layout alignment passed: district footprints track reviewed anchors; the Grand Central / Oldtown / Hilltop / Helix sequence retains its reviewed scale and order.");
