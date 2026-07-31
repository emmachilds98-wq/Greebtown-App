#!/usr/bin/env node
// Live pull from the official Boomtown app's own (private, undocumented)
// API — the same traffic the app itself makes, captured once via HTTP
// Toolkit to learn the shape (see scripts/import-boomtown-official.mjs for
// the one-off file-based version of this same transform).
//
// Two calls:
//   1. POST securetoken.googleapis.com/v1/token — exchanges a long-lived
//      Firebase refresh token for a short-lived (1hr) id token. Google's
//      Secure Token API *sometimes* rotates the refresh token on exchange;
//      whatever comes back MUST be persisted for the next run, since the
//      old one may already be invalidated. This script never assumes the
//      refresh token is stable — see rotateGithubSecret() below.
//   2. GET boomtown.api.amplify.one/events/{eventId}/timetable — the
//      timetable itself, Bearer-authed with the id token from step 1.
//
// Required env:
//   BOOMTOWN_FIREBASE_API_KEY  — Firebase Web API key (the `?key=` on the
//     token endpoint URL)
//   BOOMTOWN_REFRESH_TOKEN     — long-lived refresh token seeded from an
//     HTTP Toolkit capture
// Optional (defaults captured from the iOS app's own traffic):
//   BOOMTOWN_EVENT_ID          — default "cda165bf-9d40-4d3c-9c9b-8396c0ae300a"
//   BOOMTOWN_APP_INSTALLATION_ID
//   BOOMTOWN_APP_VERSION       — default "8.22.2"
//
// If running inside GitHub Actions with a secret-rotation PAT available
// (GH_SECRETS_PAT + GITHUB_REPOSITORY), also persists a rotated refresh
// token back to the BOOMTOWN_REFRESH_TOKEN repo secret so the next
// scheduled run keeps working unattended.

import { applyLineup } from "./lib/boomtown-lineup.mjs";
import { rotateGithubSecret } from "./lib/rotate-github-secret.mjs";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

async function refreshIdToken(apiKey, refreshToken) {
  const url = `https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "FirebaseAuth.iOS/12.8.0 uk.co.boomtownfair.events.ios/8.22.2 iPhone/26.5 hw/iPhone16_1",
    },
    // Field names match exactly what the iOS app itself sends (captured
    // via HTTP Toolkit) — the endpoint also accepts the documented
    // snake_case names, but this is the proven-working shape.
    body: JSON.stringify({ grantType: "refresh_token", refreshToken }),
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${res.statusText}\n${await res.text()}`);
  }
  const data = await res.json();
  const idToken = data.id_token || data.access_token;
  if (!idToken) throw new Error("Token refresh response had no id_token/access_token");
  return { idToken, refreshToken: data.refresh_token || refreshToken };
}

// The real endpoint (confirmed against live data — matches exactly the
// 63 stages / 1623 acts already in js/app.js) returns a relational shape,
// not the flat {Stage,Start,End,ActName,Artists} rows a manual HTTP Toolkit
// capture had already denormalised: { artists: [{id,name,...}], stages:
// [{id,name,...}], acts: [{id,startTime,endTime (epoch ms),stageId,
// artistIds[],name,...}] }. Flattens it to the same row shape
// buildArtistsBlock() expects so both the live fetch and the file-based
// importer share one transform.
function londonTimestamp(epochMs) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date(epochMs)).map((p) => [p.type, p.value]));
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day} ${hour}:${parts.minute}`;
}

function flattenTimetable({ artists, stages, acts }) {
  const artistsById = new Map(artists.map((a) => [a.id, a.name]));
  const stagesById = new Map(stages.map((s) => [s.id, s.name]));
  return acts.map((act) => ({
    Stage: stagesById.get(act.stageId) || "",
    Start: londonTimestamp(act.startTime),
    End: londonTimestamp(act.endTime),
    ActName: act.name || "",
    Artists: (act.artistIds || []).map((id) => artistsById.get(id)).filter(Boolean).join(", "),
  }));
}

async function fetchTimetable(eventId, idToken, installationId, appVersion) {
  const url = `https://boomtown.api.amplify.one/events/${encodeURIComponent(eventId)}/timetable`;
  const res = await fetch(url, {
    headers: {
      Accept: "*/*",
      "Accept-Language": "en-GB,en;q=0.9",
      "app-installation-id": installationId,
      "app-platform": "ios",
      "app-version": appVersion,
      Authorization: `Bearer ${idToken}`,
      "User-Agent": "Boomtown/7248 CFNetwork/3860.600.12 Darwin/25.5.0",
    },
  });
  if (!res.ok) {
    throw new Error(`Timetable request failed: ${res.status} ${res.statusText}\n${await res.text()}`);
  }
  const data = await res.json();
  if (Array.isArray(data)) return data; // already-flat shape, if that ever comes back
  if (!data || !Array.isArray(data.acts) || !Array.isArray(data.artists) || !Array.isArray(data.stages)) {
    throw new Error(`Unexpected timetable response shape: ${JSON.stringify(Object.keys(data || {}))}`);
  }
  return flattenTimetable(data);
}

async function main() {
  const apiKey = requireEnv("BOOMTOWN_FIREBASE_API_KEY");
  const refreshTokenIn = requireEnv("BOOMTOWN_REFRESH_TOKEN");
  const eventId = process.env.BOOMTOWN_EVENT_ID || "cda165bf-9d40-4d3c-9c9b-8396c0ae300a";
  const installationId = process.env.BOOMTOWN_APP_INSTALLATION_ID || "44914af0-58f6-43f5-9002-9a11710569fc";
  const appVersion = process.env.BOOMTOWN_APP_VERSION || "8.22.2";

  console.log("Refreshing Firebase id token...");
  const { idToken, refreshToken: refreshTokenOut } = await refreshIdToken(apiKey, refreshTokenIn);

  if (refreshTokenOut !== refreshTokenIn) {
    // Mask immediately, before it can land in any log line.
    console.log(`::add-mask::${refreshTokenOut}`);
    console.log("Refresh token rotated by Google — persisting the new value.");
    // Best-effort, same as rotateGithubSecret()'s own stated design (it
    // already no-ops gracefully when GH_SECRETS_PAT/GITHUB_REPOSITORY
    // aren't set) — but a PAT that's *present* and simply lacks the
    // repo's "Secrets: write" permission throws instead of skipping, and
    // that throw was going uncaught here, aborting the whole script
    // before it ever reached fetchTimetable() below. This run's actual
    // job — pulling the current lineup — must not depend on secret
    // rotation succeeding: this device already has the fresh idToken in
    // memory and can fetch with it regardless of whether the rotated
    // refresh token made it back to the repo secret for NEXT time.
    try {
      await rotateGithubSecret("BOOMTOWN_REFRESH_TOKEN", refreshTokenOut);
    } catch (err) {
      console.warn(
        `Couldn't persist rotated refresh token (non-fatal, continuing with this run's fetch): ${err.message}`
      );
    }
  } else {
    console.log("Refresh token unchanged this exchange.");
  }

  console.log(`Fetching timetable for event ${eventId}...`);
  const rawRows = await fetchTimetable(eventId, idToken, installationId, appVersion);
  console.log(`Got ${rawRows.length} rows.`);

  const result = applyLineup(rawRows);
  console.log(`Built ${result.count} valid line-up entries.`);

  if (!result.changed) {
    console.log("No lineup changes — nothing to do.");
    return;
  }

  console.log(`Lineup updated, bumped to ${result.nextVersion}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
