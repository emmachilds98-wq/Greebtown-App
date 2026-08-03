import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "map-system", "data", "map-document.json");
const output = path.join(root, "map-system", "data", "map-data.js");
const document = JSON.parse(fs.readFileSync(source, "utf8"));
const banner = "// Generated from map-system/data/map-document.json by scripts/build-map-data.mjs. Do not edit directly.\n";
fs.writeFileSync(output, `${banner}window.GREEBTOWN_MAP_DOCUMENT = ${JSON.stringify(document, null, 2)};\n`);
console.log(`Built ${path.relative(root, output)} from ${path.relative(root, source)}.`);
