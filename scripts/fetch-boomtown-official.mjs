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
  if (!Array.isArray(data)) throw new Error("Unexpected timetable response shape — expected a JSON array");
  return data;
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
    await rotateGithubSecret("BOOMTOWN_REFRESH_TOKEN", refreshTokenOut);
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
