// Build-time hub image extraction — ports the legacy generators/generateImagesHub.js
// into the Astro app. Decodes the base64 splash/thumbnail/image fields from the
// ResearchHub Strapi and writes them as REAL files under astro/public/hub-images/,
// so cards reference same-origin /hub-images/<id>-<attr>.<ext> (CDN-cached,
// lazy-loadable, Astro-optimizable) instead of shipping multi-MB base64 per request
// — the latency/perf win. Also writes a manifest (hub-images-manifest.json) of the
// ids that HAVE a stored image, so the live data layer only falls back to a base64
// fetch for records added AFTER the last build (new posts). Runs in `prebuild`.
//
// Idempotent + safe: a Strapi/network failure does NOT fail the build (the app
// degrades to the live base64 fallback); it logs loudly and exits 0.
import { mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";

const HUB = process.env.PUBLIC_HUB_GRAPHQL || "https://researchhub.icjia-api.cloud/graphql";
const OUT = new URL("../public/hub-images/", import.meta.url);
const OUT_DIR = OUT.pathname;
const MANIFEST = new URL("../public/hub-images-manifest.json", import.meta.url).pathname;

// articles → splash (the list/carousel thumbnail), apps → image. (Datasets have no
// image.) Mirrors the legacy generator's attrs, keyed to how the cards reference them.
const QUERY = `query {
  articles(where: { status: "published" }) { id splash thumbnail }
  apps(where: { status: "published" }) { id image }
}`;

function decode(b64) {
  if (typeof b64 !== "string" || !b64.startsWith("data:image/")) return null;
  const ext = b64.split("data:image/")[1]?.split(";")[0];
  const data = b64.split(";base64,").pop();
  if (!ext || !data) return null;
  return { ext, buf: Buffer.from(data, "base64") };
}

async function main() {
  let data;
  try {
    const res = await fetch(HUB, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: QUERY }),
    });
    if (!res.ok) throw new Error(`hub GraphQL ${res.status}`);
    data = (await res.json())?.data;
    if (!data) throw new Error("no data in hub response");
  } catch (e) {
    console.warn(`[hub-images] SKIP (live base64 fallback still works): ${e.message}`);
    return; // exit 0 — never fail the build over images
  }

  // fresh dir each build (matches legacy: rm + recreate)
  if (existsSync(OUT_DIR)) await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  // manifest maps "<id>-<attr>" → the written filename (incl. real extension, which
  // varies: jpeg vs png). The app reads this so it references the EXACT file (no
  // ext-guessing) and knows which records are stored (else → live base64 fallback).
  const stored = {};
  let written = 0;
  const writeOne = async (id, attr, b64) => {
    const dec = decode(b64);
    if (!dec) return;
    const name = `${id}-${attr}.${dec.ext}`;
    await writeFile(new URL(name, OUT), dec.buf);
    stored[`${id}-${attr}`] = name;
    written++;
  };

  for (const a of data.articles || []) {
    await writeOne(a.id, "splash", a.splash);
    await writeOne(a.id, "thumbnail", a.thumbnail);
  }
  for (const ap of data.apps || []) {
    await writeOne(ap.id, "image", ap.image);
  }

  // manifest: { "<id>-<attr>": "<filename>" } — drives both the path + the fallback.
  await writeFile(MANIFEST, JSON.stringify(stored));
  console.log(`[hub-images] wrote ${written} files for ${(data.articles || []).length} articles + ${(data.apps || []).length} apps → public/hub-images/`);
}

main().catch((e) => {
  console.warn(`[hub-images] unexpected error (continuing): ${e.message}`);
});
