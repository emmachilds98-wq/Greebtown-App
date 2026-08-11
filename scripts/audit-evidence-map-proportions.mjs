import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const fail = message => {
  console.error(`Evidence-map proportions failed: ${message}`);
  process.exit(1);
};

const polygons = name => {
  const marker = `polygon("${name}",`;
  const found = [];
  let start = 0;
  while((start = app.indexOf(marker, start)) !== -1){
    const open = app.indexOf("[[", start);
    const close = app.indexOf("]]", open);
    if(open < 0 || close < 0) fail(`cannot read ${name}'s reviewed geometry`);
    const literal = app.slice(open, close + 2);
    try {
      found.push(Function(`"use strict"; return (${literal});`)());
    } catch {
      fail(`cannot parse ${name}'s reviewed geometry`);
    }
    start += marker.length;
  }
  if(!found.length) fail(`missing ${name}'s reviewed geometry`);
  return found;
};
const first = name => polygons(name)[0];
const last = name => polygons(name).at(-1);

const orient = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const onSegment = (a, b, p) => Math.min(a[0], b[0]) <= p[0] && p[0] <= Math.max(a[0], b[0]) && Math.min(a[1], b[1]) <= p[1] && p[1] <= Math.max(a[1], b[1]) && Math.abs(orient(a, b, p)) < 1e-9;
const intersects = (a, b, c, d) => {
  const abC = orient(a, b, c), abD = orient(a, b, d), cdA = orient(c, d, a), cdB = orient(c, d, b);
  return (abC * abD < 0 && cdA * cdB < 0) || (!abC && onSegment(a, b, c)) || (!abD && onSegment(a, b, d)) || (!cdA && onSegment(c, d, a)) || (!cdB && onSegment(c, d, b));
};
const contains = (point, polygon) => {
  let inside = false;
  for(let i = 0, j = polygon.length - 1; i < polygon.length; j = i++){
    const a = polygon[i], b = polygon[j];
    if((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
};
const overlaps = (a, b) => a.some((point, index) => b.some((other, otherIndex) => intersects(point, a[(index + 1) % a.length], other, b[(otherIndex + 1) % b.length]))) || contains(a[0], b) || contains(b[0], a);
const sameRing = (a, b) => JSON.stringify(a) === JSON.stringify(b);

if(!app.includes("const EVIDENCE_LAYOUT_Y_SCALE = 2;")) fail("the active evidence renderer must retain the reviewed portrait entry ratio");
if(!app.includes("function evidenceSchematicToLatLon(xPercent, yPercent){")) fail("the portrait ratio must stay isolated to evidence-scene geometry");
if(!app.includes("const evidenceRingToLngLat = ring =>")) fail("active evidence geometry must use the reviewed portrait display plane");
if(!sameRing(first("Festival grounds"), last("Festival grounds boundary"))) fail("the reviewed site ground and its boundary must remain on the same portrait silhouette");

const campPairs = [
  ["West Camping boundary", "West Camping"],
  ["Downtown Camping boundary", "Downtown Camping"],
  ["Valley Camping boundary", "Valley Camping"],
  ["Sunset Camping boundary", "Sunset Camping"],
  ["East Camping boundary", "East Camping"]
];
for(const [boundary, camp] of campPairs){
  if(!sameRing(last(boundary), last(camp))) fail(`${boundary} must match the active ${camp} silhouette`);
}

const separationPairs = [
  ["West Camping", "Hidden Woods court"],
  ["Downtown Camping", "Area 404"],
  ["Valley Camping", "Anara Forest"],
  ["Camp at Hilltop", "The Lion's Den"],
  ["Sunset Camping", "Quantum"],
  ["Sunset Camping", "East Camping"],
  ["East Camping", "The Lion's Den"]
];
for(const [left, right] of separationPairs){
  if(overlaps(last(left), first(right))) fail(`${left} must remain separate from ${right}`);
}

console.log("Evidence map proportions passed: active camp silhouettes match their outlines and remain separate from reviewed neighbouring zones.");
