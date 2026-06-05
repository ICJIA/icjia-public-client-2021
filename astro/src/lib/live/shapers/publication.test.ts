// Publication shaper coverage (docs/LIVE-DETAIL-FALLBACK.md):
//   1. DRIFT GUARD — the pure formatters duplicated into this client-safe shaper
//      (publicationTypeLabel, getFileType) must stay identical to data.ts's build
//      originals, so the live-detail render cannot silently diverge from the
//      nightly-built page. (The date helper it REUSES from the meeting shaper and
//      isNew from format.ts are already pinned by their own drift tests.)
//   2. CORRECTNESS — shapePublication maps a raw Strapi v3 REST record to the same
//      shape data.ts's getPublication() returns: fileURL capitalization fixups,
//      local article path, type label, alt date, file-type chip, tags.
import { describe, it, expect } from "vitest";
import {
  publicationTypeLabel as d_type,
  getFileType as d_file,
} from "../../data";
import {
  publicationTypeLabel as s_type,
  getFileType as s_file,
  shapePublication,
} from "./publication";
import { renderToHtml } from "../../markdown.js";

describe("publication shaper — drift guard vs data.ts originals", () => {
  it("publicationTypeLabel matches (every case + default)", () => {
    const cases = [
      "researchReport",
      "researchBulletin",
      "researchAtAGlance",
      "trendsAndIssuesUpdate",
      "motorVehicleTheftPublications",
      "barj",
      "compiler",
      "dataset",
      "getTheFacts",
      "programEvaluationSummary",
      "megProfiles",
      "annualReport",
      "article",
      "report",
      "evaluation",
      "toolkit",
      "onGoodAuthority",
      "application",
      "unknown",
      "",
      undefined,
    ];
    for (const c of cases) expect(s_type(c)).toBe(d_type(c));
  });
  it("getFileType matches (ext, query/hash, no-ext, empty)", () => {
    const cases = [
      "https://x.com/a/b.pdf",
      "https://x.com/a/b.DOCX?dl=1",
      "https://x.com/a/b.xlsx#frag",
      "https://x.com/noext",
      "",
      undefined,
    ];
    for (const u of cases) expect(s_file(u)).toBe(d_file(u));
  });
});

describe("publication shaper — shapePublication correctness", () => {
  const raw = {
    id: 4788,
    title: "Assessing the Quality and Completeness of InfoNet Data",
    slug: "assessing-infonet-data",
    summary: "An abstract.",
    pubType: "article",
    publicationDate: "2026-06-05",
    tags: ["infonet", "domestic violence"],
    fileURL: "https://researchhub.icjia-api.cloud/uploads/InfoNet_Data.pdf",
    articleURL:
      "https://icjia.illinois.gov/researchhub/articles/assessing-infonet-data",
  };

  it("maps the record to a PublicationItem (parity with getPublication output)", () => {
    const p = shapePublication(raw, renderToHtml);
    expect(p.id).toBe("4788");
    expect(p.slug).toBe(raw.slug);
    expect(p.title).toBe(raw.title);
    expect(p.fullPath).toBe(`/about/publications/${raw.slug}/`);
    expect(p.typeLabel).toBe("Article");
    expect(p.dateAlt).toBe("Jun 05, 2026");
    expect(p.fileType).toBe("PDF");
    expect(p.tags).toEqual(["infonet", "domestic violence"]);
    // icjia.illinois.gov articleURL → path-only local link
    expect(p.localArticlePath).toBe("/researchhub/articles/assessing-infonet-data");
  });

  it("external articleURL yields an empty localArticlePath", () => {
    const p = shapePublication(
      { ...raw, articleURL: "https://example.com/x" },
      renderToHtml,
    );
    expect(p.localArticlePath).toBe("");
  });

  it("applies the legacy fileURL capitalization fixups (matches getPublication)", () => {
    const p = shapePublication(
      {
        ...raw,
        fileURL: "https://h/uploads/Compiler/OGA/researchreports/x.pdf",
      },
      renderToHtml,
    );
    // /Compiler/→/compiler/, /OGA/→/oga/, /researchreports/→/ResearchReports/
    expect(p.fileURL).toBe(
      "https://h/uploads/compiler/oga/ResearchReports/x.pdf",
    );
  });

  it("tags accept both string[] and Strapi {title}[]; missing → []", () => {
    expect(
      shapePublication({ ...raw, tags: [{ title: "a" }, { title: "b" }] }, renderToHtml)
        .tags,
    ).toEqual(["a", "b"]);
    expect(shapePublication({ ...raw, tags: undefined }, renderToHtml).tags).toEqual([]);
  });

  it("no summary leaves summary undefined (card shows the fallback note)", () => {
    const p = shapePublication({ ...raw, summary: undefined }, renderToHtml);
    expect(p.summary).toBeUndefined();
  });
});
