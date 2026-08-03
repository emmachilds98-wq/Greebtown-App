import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = name => JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", name), "utf8"));
const camps = read("camp-zones.json");
const naturalAreas = read("natural-area-footprints.json");
const layout = read("reference-layout.json");
const errors = [];

function pointInPolygon([x, y], polygon){
  let inside = false;
  for(let i=0, j=polygon.length - 1; i<polygon.length; j=i++){
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if(((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function orientation(a, b, c){ return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); }
function onSegment(a, b, point){ return Math.min(a[0], b[0]) <= point[0] && point[0] <= Math.max(a[0], b[0]) && Math.min(a[1], b[1]) <= point[1] && point[1] <= Math.max(a[1], b[1]); }
function segmentsIntersect(a, b, c, d){
  const abC = orientation(a, b, c), abD = orientation(a, b, d), cdA = orientation(c, d, a), cdB = orientation(c, d, b);
  if(((abC > 0 && abD < 0) || (abC < 0 && abD > 0)) && ((cdA > 0 && cdB < 0) || (cdA < 0 && cdB > 0))) return true;
  const epsilon = 1e-9;
  return (Math.abs(abC) < epsilon && onSegment(a, b, c)) || (Math.abs(abD) < epsilon && onSegment(a, b, d)) || (Math.abs(cdA) < epsilon && onSegment(c, d, a)) || (Math.abs(cdB) < epsilon && onSegment(c, d, b));
}
function polygonsIntersect(a, b){
  if(a.some(point => pointInPolygon(point, b)) || b.some(point => pointInPolygon(point, a))) return true;
  return a.some((point, index) => b.some((other, otherIndex) => segmentsIntersect(point, a[(index + 1) % a.length], other, b[(otherIndex + 1) % b.length])));
}

const woodlandPolygons = (naturalAreas.footprints || []).map(area => {
  const anchor = layout.anchors?.[area.sourceName]?.to;
  if(!anchor){ errors.push(`${area.id}: missing reviewed layout anchor for ${area.sourceName}`); return null; }
  return { id: area.id, sourceName: area.sourceName, points: area.fringePoints.map(([dx, dy]) => [anchor[0] + dx, anchor[1] + dy]) };
}).filter(Boolean);
for(const field of camps.groundUseFields || []) for(const woodland of woodlandPolygons){
  if(polygonsIntersect(field.points, woodland.points)) errors.push(`${field.id}: overlaps reviewed woodland ${woodland.sourceName}`);
}
if(errors.length){ console.error(errors.join("\n")); process.exit(1); }
console.log(`Ground-use overlap audit passed: ${(camps.groundUseFields || []).length} fields clear of ${woodlandPolygons.length} reviewed woodland footprints.`);
