import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "map-system", "data", "reference-layout.json"), "utf8"));
const rows = Object.entries(data.anchors).map(([name, anchor])=>({
  name,
  from: anchor.from.join(", "),
  to: anchor.to.join(", "),
  delta: `${anchor.to[0] - anchor.from[0]}, ${anchor.to[1] - anchor.from[1]}`,
  members: Object.entries(data.members).filter(([, group])=>group === name).map(([member])=>member).join(", ") || "—"
}));
console.table(rows);
