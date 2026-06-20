/* Resilient GraphQL schema download for eslint-plugin-graphql.
 *
 * `.eslintrc.js` does `require("./schema.json")` at lint time, so a broken
 * schema.json fails the ENTIRE production build. The previous build step ran
 *     get-graphql-schema <url> -j > schema.json
 * directly. The shell `>` truncates the committed schema.json BEFORE the fetch
 * runs, so when the download dies mid-stream (ERR_STREAM_PREMATURE_CLOSE) the
 * file is left empty/partial. get-graphql-schema exits 0 on that error, so the
 * corruption is silent and ESLint later dies with "Unexpected end of JSON
 * input". This started happening on Netlify's Noble build image (works locally,
 * fails only on Netlify) — an environmental fetch failure we don't control.
 *
 * This script fetches to a temp file, validates it parses and contains
 * __schema, and only then ATOMICALLY replaces schema.json. It retries a few
 * times in case the premature close is intermittent. On total failure it keeps
 * the committed schema.json and exits 0 — a flaky fetch must never break the
 * build — and fails loud only when there is no valid committed schema to fall
 * back to. Override the endpoint with GRAPHQL_SCHEMA_URL (used to verify the
 * fallback path). */

import { execFileSync } from "node:child_process";
import fs from "node:fs";

const ENDPOINT =
  process.env.GRAPHQL_SCHEMA_URL || "https://agency.icjia-api.cloud/graphql";
const OUT = "schema.json";
const TMP = "schema.json.tmp";
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = 1500;

function sleep(ms) {
  // Synchronous wait — execFileSync is synchronous, so we cannot await.
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  try {
    // get-graphql-schema prints the introspection JSON ({"__schema":...}) to
    // stdout. maxBuffer must exceed the ~1 MB schema or execFileSync throws.
    const json = execFileSync("get-graphql-schema", [ENDPOINT, "-j"], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    const parsed = JSON.parse(json); // throws on truncated/empty output
    if (!parsed || !parsed.__schema) {
      throw new Error("response parsed but has no __schema");
    }
    fs.writeFileSync(TMP, json);
    fs.renameSync(TMP, OUT); // atomic replace — only reached on a valid fetch
    console.log(`Schema updated: ${OUT} (attempt ${attempt}/${MAX_ATTEMPTS})`);
    process.exit(0);
  } catch (err) {
    try {
      fs.rmSync(TMP, { force: true });
    } catch {
      /* ignore */
    }
    console.warn(
      `Schema fetch attempt ${attempt}/${MAX_ATTEMPTS} failed: ${err.message}`
    );
    if (attempt < MAX_ATTEMPTS) sleep(BACKOFF_MS);
  }
}

// All fetches failed — fall back to the committed schema.json if it is valid.
if (fs.existsSync(OUT)) {
  try {
    JSON.parse(fs.readFileSync(OUT, "utf8"));
    console.warn(
      `⚠ Schema fetch failed after ${MAX_ATTEMPTS} attempts. Keeping committed ${OUT} (build continues).`
    );
    process.exit(0);
  } catch (err) {
    console.error(`✗ Committed ${OUT} is itself invalid: ${err.message}`);
    process.exit(1);
  }
}

console.error(`✗ Schema fetch failed and no committed ${OUT} to fall back to.`);
process.exit(1);
