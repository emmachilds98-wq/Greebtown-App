import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css", "style.css"), "utf8");
const requiredAppTokens = [
  "function mapLabelPriority(label)",
  "function runMapLabelCollisionPass()",
  "function queueMapLabelCollisionPass()",
  'mapGL.on("moveend", queueMapLabelCollisionPass)',
  'queueMapLabelCollisionPass();'
];
const missing = requiredAppTokens.filter(token => !app.includes(token));
if(!css.includes(".map-label.map-label-collided{visibility:hidden;}")) missing.push("collision-hidden CSS treatment");
if(missing.length){
  console.error(`Map label-collision audit failed: ${missing.join(", ")}`);
  process.exit(1);
}
console.log("Map label-collision audit passed: priority-aware collision handling is wired to rendering and map movement.");
