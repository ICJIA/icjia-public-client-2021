// Renderer parity gate (docs/LIVE-DETAIL-FALLBACK.md): the client twin
// renderAppDetail(item) must produce the SAME HTML as the real AppView.astro for
// the same shaped item, so a live-detail-fallback app looks identical to the
// nightly-built page. Rendered via the Astro Container API; compared after
// normalizing data-astro-source-* + data-astro-cid-* (scoped-style hash, stripped
// in prod), the cmstbl<n> counter, and insignificant inter-tag whitespace.
//
// §4 IMAGE: the shaper sets imagePath=null client-side, so an app image (base64)
// renders through AppView's base64-island branch (JSON <script> + Alpine x-init/
// :src), which is reproducible verbatim — there is NO volatile build-vs-transient
// <img> markup to strip (the <img> uses a literal `:src="src"`). The direct-file
// branch (appImgFile) is unreachable client-side and is covered by the
// no-image / island cases below.
import { describe, it, expect } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import AppView from "../../../components/researchhub/AppView.astro";
import { renderToHtml } from "../../markdown.js";
import { renderAppDetail } from "./app";
import { shapeApp } from "../shapers/app";

const norm = (html: string) =>
  html
    .replace(/\s+data-astro-source-(?:file|loc)="[^"]*"/g, "")
    .replace(/\s+data-astro-cid-[\w-]+(?:="[^"]*")?/g, "")
    .replace(/cmstbl\d+/g, "cmstbl#")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/>\s+/g, ">")
    .replace(/\s+</g, "<")
    .trim();

async function real(item: any): Promise<string> {
  const c = await AstroContainer.create();
  return c.renderToString(AppView, { props: { app: item } });
}

// Full record: base64 image (island branch), external, multiple contributors
// (mixed link/plain), categories, tags, description, funding, citation, related,
// http url (Launch button).
const rawFull = {
  id: 3,
  title: "Crime Dashboard & Map",
  slug: "crime-dashboard-map",
  date: "2026-05-22T00:00:00.000Z",
  description: "An interactive dashboard. It maps crime trends. Third sentence.",
  contributors: [
    { title: "Jane Doe", url: "https://example.com/jane" },
    { title: "John Roe", url: "" },
    { title: "ICJIA Staff", url: "https://icjia.illinois.gov" },
  ],
  image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCA</test>",
  external: "yes",
  categories: ["law enforcement"],
  tags: ["mapping", "crime & data"],
  url: "https://apps.icjia.cloud/crime-dashboard",
  funding: "Funded by ICJIA & partners.",
  citation: "Cite **this** app.",
  datasets: [{ title: "Source Dataset", slug: "source-dataset" }],
  articles: [{ title: "Method Article", slug: "method-article" }],
};

// No image, no contributors (→ "ICJIA R&A staff"), no external, no tags, no
// funding/citation/related, no url (no Launch button), non-http url dropped.
const rawBare = {
  id: 4,
  title: "Bare App",
  slug: "bare-app",
  date: "2026-04-10T00:00:00.000Z",
  description: "Single sentence.",
  contributors: [],
  image: null,
  external: "",
  categories: ["juvenile justice"],
  tags: [],
  url: "javascript:alert(1)", // non-http → shaper drops it → no Launch button
  funding: "",
  citation: "",
  datasets: [],
  articles: [],
};

// No image + single contributor with link, no categories — exercises the
// md:col-span-3 prop column (no image) and a one-item contributor list.
const rawNoImage = {
  id: 5,
  title: "No-Image App",
  slug: "no-image-app",
  date: "",
  contributors: [{ title: "Solo Author", url: "https://example.com/solo" }],
  image: null,
  external: "",
  categories: [],
  tags: ["tag1"],
  url: "https://example.com/app",
  funding: "Some funding.",
  citation: "",
  datasets: [],
  articles: [],
};

describe("renderAppDetail twin/component parity", () => {
  it("matches AppView.astro — full record (base64 island, external, Launch)", async () => {
    const item = shapeApp(rawFull, renderToHtml);
    expect(norm(renderAppDetail(item))).toBe(norm(await real(item)));
  });

  it("matches AppView.astro — bare record (no image, default contributor, no Launch)", async () => {
    const item = shapeApp(rawBare, renderToHtml);
    expect(norm(renderAppDetail(item))).toBe(norm(await real(item)));
  });

  it("matches AppView.astro — no image (col-span-3), single contributor", async () => {
    const item = shapeApp(rawNoImage, renderToHtml);
    expect(norm(renderAppDetail(item))).toBe(norm(await real(item)));
  });
});
