// Writes a rotated value back to a GitHub Actions repo secret, so an
// unattended scheduled run can keep using a fresh value next time (Google's
// Secure Token API sometimes rotates the Boomtown refresh token on
// exchange, invalidating the old one).
//
// Requires GH_SECRETS_PAT (a PAT with this repo's "Secrets: write"
// permission — the default GITHUB_TOKEN cannot manage repo secrets) and
// GITHUB_REPOSITORY (set automatically by Actions). Silently skips outside
// that context (e.g. a manual/local run) rather than failing the whole
// fetch — the caller already has the fresh value in-memory for its own run.

import sodium from "libsodium-wrappers";

export async function rotateGithubSecret(secretName, value) {
  const pat = process.env.GH_SECRETS_PAT;
  const repoSlug = process.env.GITHUB_REPOSITORY;
  if (!pat || !repoSlug) {
    console.log(
      `Skipping ${secretName} rotation — GH_SECRETS_PAT/GITHUB_REPOSITORY not set (not running in Actions with a rotation PAT).`
    );
    return;
  }

  const apiBase = `https://api.github.com/repos/${repoSlug}/actions/secrets`;
  const authHeaders = {
    Authorization: `Bearer ${pat}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const keyRes = await fetch(`${apiBase}/public-key`, { headers: authHeaders });
  if (!keyRes.ok) {
    throw new Error(`Failed to fetch repo public key: ${keyRes.status} ${await keyRes.text()}`);
  }
  const { key, key_id } = await keyRes.json();

  await sodium.ready;
  const encryptedBytes = sodium.crypto_box_seal(
    sodium.from_string(value),
    sodium.from_base64(key, sodium.base64_variants.ORIGINAL)
  );
  const encryptedValue = sodium.to_base64(encryptedBytes, sodium.base64_variants.ORIGINAL);

  const putRes = await fetch(`${apiBase}/${secretName}`, {
    method: "PUT",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ encrypted_value: encryptedValue, key_id }),
  });
  if (!putRes.ok && putRes.status !== 201 && putRes.status !== 204) {
    throw new Error(`Failed to update secret ${secretName}: ${putRes.status} ${await putRes.text()}`);
  }
  console.log(`Rotated repo secret ${secretName}.`);
}
