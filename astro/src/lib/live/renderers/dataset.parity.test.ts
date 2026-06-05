// Renderer parity gate (docs/LIVE-DETAIL-FALLBACK.md): the client twin
// renderDatasetDetail(item) must produce the SAME HTML as the real
// DatasetView.astro for the same shaped item, so a live-detail-fallback dataset
// looks identical to the nightly-built page. Rendered via the Astro Container API;
// compared after normalizing the two INVISIBLE dev/prod diffs — data-astro-source-*
// and data-astro-cid-* (scoped-style hash, stripped in prod) — plus the cmstbl<n>
// counter and insignificant inter-tag whitespace.
//
// Datasets carry NO splash/thumbnail image (the only media is the datafile download
// link, built from {hash,ext}); so there is no §4 image deviation here — the markup
// matches exactly.
import { describe, it, expect } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import DatasetView from "../../../components/researchhub/DatasetView.astro";
import { renderToHtml } from "../../markdown.js";
import { renderDatasetDetail } from "./dataset";
import { shapeDataset } from "../shapers/dataset";

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
  return c.renderToString(DatasetView, { props: { dataset: item } });
}

// Full record: external marker, sources (mixed link/plain), categories, tags,
// timeperiod object, description, notes, variables table, funding, citation,
// related, datafile.
const rawFull = {
  id: 7,
  title: "Crime & Justice Dataset",
  slug: "crime-justice-dataset",
  date: "2026-05-20T00:00:00.000Z",
  description: "A dataset of crime & justice indicators. Second sentence here. Third one too.",
  external: "yes",
  categories: ["corrections", "law enforcement"],
  tags: ["crime", "statistics & data"],
  project: "",
  timeperiod: { yearmin: 2010, yearmax: 2024, yeartype: "calendar" },
  sources: [
    { title: "ICJIA", url: "https://icjia.illinois.gov" },
    { title: "FBI UCR", url: "https://fbi.gov" },
    { title: "Plain Source", url: "" },
  ],
  notes: ["First note.", "Second note & more."],
  variables: [
    { name: "year", type: "integer", definition: "Calendar year", values: "2010-2024" },
    { name: "rate", type: "float", definition: "Rate per 100k", values: "" },
  ],
  funding: "Funded by ICJIA & partners.",
  citation: "Suggested **citation** text.",
  datafile: { hash: "abc123", ext: ".csv", name: "data.csv", url: "/uploads/abc123.csv" },
  apps: [{ title: "Dashboard App", slug: "dashboard-app" }],
  articles: [{ title: "Companion Article", slug: "companion-article" }],
};

// Project marker (no external), no sources, no tags, no variables, no notes, no
// citation, no datafile, string timeperiod — exercises the other branches.
const rawProject = {
  id: 8,
  title: "Project Dataset",
  slug: "project-dataset",
  date: "2026-04-01T00:00:00.000Z",
  description: "Only one sentence.",
  external: "",
  project: "Some Project",
  categories: ["juvenile justice"],
  tags: [],
  timeperiod: "2015-2020",
  sources: [],
  notes: [],
  variables: [],
  funding: "",
  citation: "",
  datafile: null,
  apps: [],
  articles: [],
};

// Bare minimum: no marker, no date, empty everything (every conditional's empty
// branch). dateLabel still renders if date present, so omit date entirely.
const rawBare = {
  id: 9,
  title: "Bare Dataset",
  slug: "bare-dataset",
  description: "",
  external: "",
  project: "",
  categories: [],
  tags: [],
  sources: [],
  notes: [],
  variables: [],
  funding: "",
  citation: "",
  datafile: null,
  apps: [],
  articles: [],
};

describe("renderDatasetDetail twin/component parity", () => {
  it("matches DatasetView.astro — full record (external, all blocks)", async () => {
    const item = shapeDataset(rawFull, renderToHtml);
    expect(norm(renderDatasetDetail(item))).toBe(norm(await real(item)));
  });

  it("matches DatasetView.astro — project marker, string timeperiod, empty relations", async () => {
    const item = shapeDataset(rawProject, renderToHtml);
    expect(norm(renderDatasetDetail(item))).toBe(norm(await real(item)));
  });

  it("matches DatasetView.astro — bare record (all empty branches)", async () => {
    const item = shapeDataset(rawBare, renderToHtml);
    expect(norm(renderDatasetDetail(item))).toBe(norm(await real(item)));
  });
});
