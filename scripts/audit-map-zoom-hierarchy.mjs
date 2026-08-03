import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "css", "style.css"), "utf8");
const errors = [];
const matchNumber = pattern => Number(app.match(pattern)?.[1]);
const labelThreshold = matchNumber(/const LABEL_ZOOM_THRESHOLD = (\d+(?:\.\d+)?)/);
const labelDetailThreshold = matchNumber(/const LABEL_DETAIL_ZOOM_THRESHOLD = (\d+(?:\.\d+)?)/);
const passageZoom = matchNumber(/id: "district-passages-fill"[^\n]*minzoom: (\d+(?:\.\d+)?)/);
const massingZoom = matchNumber(/id: "authored-massing-fill"[^\n]*minzoom: (\d+(?:\.\d+)?)/);
const atmosphereZoom = matchNumber(/id: "district-atmosphere-fill"[^\n]*minzoom: (\d+(?:\.\d+)?)/);
const infillZoom = matchNumber(/id: "infill-buildings-fill"[^\n]*minzoom: (\d+(?:\.\d+)?)/);
const fineFieldZoom = matchNumber(/id: "fields-fine-fill"[^\n]*minzoom: (\d+(?:\.\d+)?)/);
const hedgeZoom = matchNumber(/id: "hedges-line"[^\n]*minzoom: (\d+(?:\.\d+)?)/);
const broadFieldZoom = matchNumber(/id: "fields-fill"[^\n]*minzoom: (\d+(?:\.\d+)?)/);
const treeZoom = matchNumber(/id: "trees-circle"[^\n]*minzoom: (\d+(?:\.\d+)?)/);
const tentZoom = matchNumber(/id: "tents-circle"[^\n]*minzoom: (\d+(?:\.\d+)?)/);
const trunkPathZoom = matchNumber(/id: "trail-main-fill"[^\n]*minzoom: (\d+(?:\.\d+)?)/);

if(!app.includes('data: geo.siteGround') || !app.includes('id: "site-ground-fill"')) errors.push("the reviewed site boundary must render as the primary festival-ground silhouette");
if(!Number.isFinite(labelThreshold) || labelThreshold < 15.7 || labelThreshold > 16) errors.push("overview label thinning must cover the whole-site view");
if(!Number.isFinite(labelDetailThreshold) || labelDetailThreshold < labelThreshold + .5 || labelDetailThreshold > 17) errors.push("fine labels must have a distinct later reveal threshold");
if(!Number.isFinite(passageZoom) || passageZoom < 15.7 || passageZoom > 16) errors.push("district passages must emerge only after the overview, before close foreground detail");
if(!Number.isFinite(massingZoom) || massingZoom < 15.7 || massingZoom > 16) errors.push("authored massing must emerge only after the overview, before close foreground detail");
if(!Number.isFinite(atmosphereZoom) || atmosphereZoom < 16) errors.push("foreground atmosphere must remain deep-zoom only");
if(!Number.isFinite(infillZoom) || infillZoom < atmosphereZoom) errors.push("generic infill must not appear before authored foreground detail");
if(!Number.isFinite(broadFieldZoom) || broadFieldZoom < 16) errors.push("broad farmland texture must remain out of the silhouette-first overview");
if(!Number.isFinite(fineFieldZoom) || fineFieldZoom < 17) errors.push("fine field mottling must remain deep-zoom only");
if(!Number.isFinite(hedgeZoom) || hedgeZoom < 16) errors.push("outer hedgerows must remain secondary to the site silhouette");
if(!Number.isFinite(treeZoom) || treeZoom < 15.5) errors.push("individual trees must not obscure the overview silhouette");
if(!Number.isFinite(tentZoom) || tentZoom < 16) errors.push("individual tents must remain close-zoom texture");
if(!Number.isFinite(trunkPathZoom) || trunkPathZoom < 15.7) errors.push("trunk paths must not dominate the whole-site overview");
if(!css.includes("#map.map-labels-thin .map-label:not(.district){display:none;}")) errors.push("thin mode must leave only district labels visible");
if(!css.includes("#map.map-labels-mid .map-label.minor")) errors.push("middle zoom must defer minor labels until detailed exploration");
if(errors.length){ console.error(errors.join("\n")); process.exit(1); }
console.log(`Map zoom hierarchy passed: coherent site ground; overview/mid/detail labels ${labelThreshold}/${labelDetailThreshold}; paths/passages ${trunkPathZoom}/${passageZoom}; massing ${massingZoom}; atmosphere ${atmosphereZoom}; generic infill ${infillZoom}; fields ${broadFieldZoom}/${fineFieldZoom}; hedges ${hedgeZoom}; trees/tents ${treeZoom}/${tentZoom}.`);
