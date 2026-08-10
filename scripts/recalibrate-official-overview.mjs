import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = name => path.join(root, "map-system", "data", name);
const read = name => JSON.parse(fs.readFileSync(data(name), "utf8"));
const write = (name, value) => fs.writeFileSync(data(name), `${JSON.stringify(value, null, 2)}\n`);

// Coordinates were measured against IMG_3670, the only supplied full-site
// official-app overview.  Keep this deliberately small: it corrects anchors
// that are visible together in that frame and leaves unobserved anchors alone.
const reviewedAnchors = {
  "Botanica": [42, 41],
  "Metropolis": [26, 43],
  "Area 404": [31, 48],
  "Letsbe Avenue": [45, 43],
  "Grand Central": [50, 51],
  "Oldtown": [49, 56],
  "The Lion's Den": [35, 67],
  "Helix": [37, 63]
};

const references = read("reference-layout.json");
const previous = Object.fromEntries(Object.entries(reviewedAnchors).map(([name]) => [name, [...references.anchors[name].to]]));
const previousSourceAnchors = Object.fromEntries(Object.entries(references.anchors).map(([name, anchor]) => [name, [...anchor.from]]));
for(const [name, target] of Object.entries(reviewedAnchors)) references.anchors[name].to = target;
references.observations = (references.observations || []).filter(item => item.id !== "official-fullsite-calibration-2026-08-10");
references.observations.push({
  id: "official-fullsite-calibration-2026-08-10",
  source: "IMG_3670, user-supplied official-app full-site overview",
  evidence: "official-overview",
  regions: ["downtown", "grand-central", "oldtown", "hilltop-field", "lion-den-woodland", "east-camping"],
  notes: "This is the shared calibration datum for the overview. It places Botanica/Metropolis/Area 404 as one compact west-city group; Grand Central directly north of Oldtown; the Hilltop field to Oldtown's east; and The Lion's Den south-west of that field. Earlier single-frame estimates that placed Lion's Den on the far east side or put Helix below it are superseded."
});
write("reference-layout.json", references);

// Make the reviewed coordinates canonical.  Before this migration the app
// applied a second, run-time delta to old document positions; that meant
// fields, footprints and markers could each be on a different plane.
const deltaFor = name => {
  const target = references.anchors[name]?.to;
  const source = previousSourceAnchors[name];
  return target && source ? [target[0] - source[0], target[1] - source[1]] : [0, 0];
};
const document = read("map-document.json");
for(const object of document.objects){
  const group = references.members?.[object.name] || object.name;
  if(!references.anchors[group]) continue;
  const [dx, dy] = deltaFor(group);
  object.position.x += dx;
  object.position.y += dy;
}
// Minor venues retain their documented local order, but must not be stacked
// by a parent-cluster translation. These reviewed separations keep their
// markers and illustrated courts readable at normal map zoom.
const reviewedStagePositions = {
  "Full Moon Ballroom": [42, 50],
  "Rose and Clown": [44, 39],
  "The Fools Leap": [43, 55],
  "Foggers Mill": [53, 47]
};
for(const object of document.objects){
  const position = reviewedStagePositions[object.name];
  if(position) object.position = { ...object.position, x: position[0], y: position[1] };
}
write("map-document.json", document);

const appFile = path.join(root, "js", "app.js");
const appSource = fs.readFileSync(appFile, "utf8");
const migratedAppSource = appSource.replace(/\{ name:"([^"]+)"([^\n]*?)x:"(-?\d+(?:\.\d+)?)%", y:"(-?\d+(?:\.\d+)?)%"/g, (whole, name, beforePosition, x, y) => {
  const near = /near:"([^"]+)"/.exec(beforePosition)?.[1] || "";
  const group = references.members?.[name] || near || name;
  const [dx, dy] = deltaFor(group);
  if(!dx && !dy) return whole;
  return whole.replace(`x:"${x}%", y:"${y}%"`, `x:"${Number(x) + dx}%", y:"${Number(y) + dy}%"`);
});
if(migratedAppSource !== appSource) fs.writeFileSync(appFile, migratedAppSource);

for(const anchor of Object.values(references.anchors)) anchor.from = [...anchor.to];
references.reviewNote = "Canonical coordinates calibrated as one full-site composition from IMG_3670; no runtime anchor transform is applied.";
write("reference-layout.json", references);

const districts = read("district-footprints.json");
for(const footprint of districts.footprints){
  if(!reviewedAnchors[footprint.name]) continue;
  const [oldX, oldY] = previous[footprint.name];
  const [newX, newY] = reviewedAnchors[footprint.name];
  footprint.points = footprint.points.map(([x, y]) => [x + newX - oldX, y + newY - oldY]);
}
write("district-footprints.json", districts);

const camps = read("camp-zones.json");
const hilltop = camps.groundUseFields.find(field => field.id === "hilltop-field");
hilltop.points = [[50,57],[55,55],[61,57],[66,61],[65,67],[54,69],[50,68],[50,64]];
hilltop.detailLines = [
  [[43,58],[48,62],[46,67]],
  [[54,57],[58,62],[57,68]],
  [[62,60],[62,66]]
];
hilltop.notes = "Rebuilt from the full-site official overview (IMG_3670): a broad, faceted field east of Oldtown and north-east of The Lion's Den. Its outline uses the same overview coordinate plane as the city anchors and camp labels.";
const sunset = camps.groundUseFields.find(field => field.id === "sunset-field");
sunset.points = [[0,58],[10,56],[16,61],[15,74],[11,79],[3,75],[0,67]];
sunset.notes = "Rebuilt from IMG_3670: the separate large yellow Sunset field along Petersfield Road, west of the Lion's Den/Hilltop sequence.";
const setCamp = (id, x, y) => {
  const zone = camps.zones.find(item => item.id === id);
  zone.position = { x, y };
};
setCamp("camp-valley", 71, 40);
setCamp("camp-campervan", 42, 95);
write("camp-zones.json", camps);

console.log("Recalibrated reviewed overview anchors, district footprints and yellow/camping fields from IMG_3670.");
