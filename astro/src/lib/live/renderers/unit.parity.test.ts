// Renderer parity gate (docs/LIVE-DETAIL-FALLBACK.md): the client twins
// renderUnitCard(item) / renderBiographyCard(staff) must produce the SAME HTML as
// the real UnitCard.astro / BiographyCard.astro for the same shaped item, so a
// live-detail-fallback unit looks identical to the nightly-built page. Rendered via
// the Astro Container API; compared after normalizing the two INVISIBLE dev/prod
// diffs — data-astro-source-* and data-astro-cid-* (scoped-style hash, stripped in
// prod) — plus the cmstbl<n> table counter and insignificant inter-tag whitespace.
//
// §4 IMAGE: a staff headshot renders through CmsImage's astro:assets <Image> on the
// build (optimized same-origin /_image URL + width/height + loading/decoding); the
// transient twin emits the RAW Strapi <img>. Those volatile <img> attributes are
// stripped on BOTH sides (mirrors article/post.parity), so only the stable markup
// (bare <img> + alt + position) is compared.
//
// RELATED STAFF GAP: the live 404 path always renders the unit with NO staff (the
// single REST record carries no bios + the registry can't make the async bios-by-
// unit fetch — see shapers/unit.ts). We still lock the WITH-staff branch here so the
// component markup cannot silently drift before the nightly rebuild fills it in.
//
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import "../../markdown.js"; // installs globalThis.DOMParser (linkedom) for the container render
import UnitCard from "../../../components/UnitCard.astro";
import BiographyCard from "../../../components/BiographyCard.astro";
import { renderToHtml } from "../../markdown.js";
import { renderUnitCard, renderBiographyCard, renderUnitDetail } from "./unit";
import { shapeUnit, type UnitItem, type UnitStaffItem } from "../shapers/unit";

const norm = (html: string) =>
  html
    .replace(/\s+data-astro-source-(?:file|loc)="[^"]*"/g, "")
    .replace(/\s+data-astro-cid-[\w-]+(?:="[^"]*")?/g, "")
    // §4 headshot <img>: strip the build-vs-transient volatile attributes on both
    // sides (optimized /_image src + dimensions + loading/decoding + the
    // data-image-component marker) so only the stable markup is compared. CmsImage
    // also emits a bare `class` (the component passes class={klass} with klass='') —
    // strip that empty class attr too (the twin's raw <img> has none).
    .replace(/\s+(?:src|srcset|width|height|loading|decoding)="[^"]*"/g, "")
    .replace(/\s+data-image-component="[^"]*"/g, "")
    .replace(/\s+class(?=[\s>])/g, "")
    .replace(/cmstbl\d+/g, "cmstbl#")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/>\s+/g, ">")
    .replace(/\s+</g, "<")
    .trim();

async function realUnitCard(unit: UnitItem, staff: UnitStaffItem[]): Promise<string> {
  const c = await AstroContainer.create();
  // UnitCard's props are UnitDetail + Biography[]; the twin's UnitItem / UnitStaffItem
  // are structural subsets with identical field names → satisfy every property the
  // component (and the BiographyCards it renders) read.
  return c.renderToString(UnitCard, { props: { unit: unit as any, staff: staff as any } });
}

async function realBiographyCard(item: UnitStaffItem): Promise<string> {
  const c = await AstroContainer.create();
  return c.renderToString(BiographyCard, {
    props: { item: item as any, color: "#fdfdfd" },
  });
}

// Two staff members: one WITH a headshot (the §4 image branch) and a suffix (so
// fullNameWithSuffix differs from fullName), one WITHOUT a headshot + no unit/role
// (every empty-branch of BiographyCard).
const staffWithHeadshot: UnitStaffItem = {
  id: "6",
  slug: "jessica-reichert",
  fullName: "Jessica Reichert",
  fullNameWithSuffix: "Jessica Reichert, Ph.D.",
  title: "Manager, Center for Justice Research & Evaluation",
  unit: { title: "Research & Analysis Unit", shortName: "R&A", slug: "research-and-analysis-unit" },
  headshot: {
    url: "https://agency.icjia-api.cloud/uploads/small_reichert.jpeg",
    width: 500,
    height: 457,
  },
  bodyHtml: "<p>Bio body with a <strong>link</strong> &amp; emphasis.</p>",
};

const staffNoHeadshot: UnitStaffItem = {
  id: "7",
  slug: "no-photo-staffer",
  fullName: "No Photo Staffer",
  fullNameWithSuffix: "No Photo Staffer",
  title: undefined,
  unit: null,
  headshot: null,
  bodyHtml: "",
};

// Full unit: body, a "Read more" url, and both staff (exercises the divider + the
// two BiographyCard branches).
const full: UnitItem = {
  id: "12",
  slug: "research-and-analysis-unit",
  title: "Research & Analysis Unit",
  shortName: "R&A",
  url: "/researchhub/",
  bodyHtml: "<p>The unit collects, analyzes &amp; disseminates crime data.</p>",
  staff: [staffWithHeadshot, staffNoHeadshot],
};

// No body (→ "No description available."), no url (no "Read more"), no staff
// (the live transient render's real shape) — every empty branch of UnitCard.
const bare: UnitItem = {
  id: "99",
  slug: "bare-unit",
  title: "Bare Unit & Co.",
  shortName: undefined,
  url: undefined,
  bodyHtml: "",
  staff: [],
};

describe("BiographyCard twin/component parity (as UnitCard renders it)", () => {
  it("matches BiographyCard.astro — with headshot, suffix, unit + role (§4 image)", async () => {
    expect(norm(renderBiographyCard(staffWithHeadshot))).toBe(
      norm(await realBiographyCard(staffWithHeadshot)),
    );
  });

  it("matches BiographyCard.astro — no headshot, no unit/role, no body", async () => {
    expect(norm(renderBiographyCard(staffNoHeadshot))).toBe(
      norm(await realBiographyCard(staffNoHeadshot)),
    );
  });
});

describe("renderUnitCard twin/component parity", () => {
  it("matches UnitCard.astro — full (body + Read more + staff list)", async () => {
    expect(norm(renderUnitCard(full))).toBe(norm(await realUnitCard(full, full.staff)));
  });

  it("matches UnitCard.astro — bare (No description, no link, no staff)", async () => {
    expect(norm(renderUnitCard(bare))).toBe(norm(await realUnitCard(bare, bare.staff)));
  });
});

describe("renderUnitDetail composition + shaped-record path", () => {
  it("wraps the card in the page's markdown-body + .unit-single-frame + sr-only h1", () => {
    const html = renderUnitDetail(bare);
    expect(html.startsWith('<div class="markdown-body mx-auto max-w-5xl px-4 py-8 md:px-6">')).toBe(
      true,
    );
    expect(html).toContain('<div class="unit-single-frame"><h1 class="sr-only">Bare Unit &amp; Co.</h1>');
    expect(html).toContain('<div class="unit-card markdown-body"><h2>Bare Unit &amp; Co.</h2>');
    expect(html.endsWith("</div></div>")).toBe(true);
  });

  it("shapeUnit(raw REST) → renderUnitCard matches the component (no staff, the live shape)", async () => {
    // Raw AGENCY REST record (field shape verified live against /units?slug=).
    const raw = {
      id: 3,
      title: "Federal & State Grants Unit",
      slug: "federal-and-state-grants-unit",
      summary: "The Federal & State Grants Unit oversees federal and state assistance programs.",
      shortName: "FSGU",
      url: "/grants/",
      body: "The FSGU administers grant programs overseen by ICJIA.\n\nSecond paragraph.",
    };
    const item = shapeUnit(raw, renderToHtml); // staff defaults to [] — the live path
    // Spot-check the shaper reproduced data.ts getUnit output.
    expect(item.id).toBe("3");
    expect(item.slug).toBe("federal-and-state-grants-unit");
    expect(item.title).toBe("Federal & State Grants Unit");
    expect(item.shortName).toBe("FSGU");
    expect(item.url).toBe("/grants/");
    expect(item.staff).toEqual([]);
    // body sanitized+rendered (wrapped in <p>).
    expect(item.bodyHtml).toMatch(/<p>The FSGU administers grant programs overseen by ICJIA\.<\/p>/);
    // And the twin still matches the real component for the shaped record.
    expect(norm(renderUnitCard(item))).toBe(norm(await realUnitCard(item, item.staff)));
  });
});
