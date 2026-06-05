// Renderer parity gate (docs/LIVE-DETAIL-FALLBACK.md): the client twin
// renderBiographyDetail(item) must produce the SAME HTML as the real
// about/biographies/[slug].astro page content (the `markdown-body` wrapper + the
// <h1> of fullNameWithSuffix + <BiographyCard showName={false} />), so a
// live-detail-fallback bio looks identical to the nightly-built page. The card
// markup is the BiographyCard.astro component composed inline in the page, so we
// render the REAL PAGE via the Astro Container API — with getBiography() mocked to
// return the fixture instead of hitting Strapi — then slice the page-content region
// (the .markdown-body wrapper div), stopping at </main>, and diff after the same
// normalization the meeting/publication parity tests use.
//
// norm() (extends meeting/post.parity.test.ts) strips the INVISIBLE dev/prod diffs —
// data-astro-source-* and data-astro-cid-* (scoped-style hash, stripped in prod) —
// plus the cmstbl<n> table counter and insignificant whitespace, AND the accepted §4
// HEADSHOT image deviation: the real avatar <img> uses an astro:assets-optimized
// /_image URL (src + width/height + loading/decoding + data-image-component); the
// twin uses the raw Strapi URL. Those volatile <img> attributes are stripped on BOTH
// sides so only the stable markup (tag position, alt, class) is compared. The bio
// body (set:html) matches exactly.
//
// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import "../../markdown.js"; // installs globalThis.DOMParser (linkedom) for the body render
import { renderToHtml } from "../../markdown.js";
import { renderBiographyDetail } from "./biography";
import { shapeBiography, type BiographyItem } from "../shapers/biography";

// One mutable fixture the mocked getBiography returns; each test sets CURRENT before
// rendering the real page. (vi.mock is hoisted, so it reads CURRENT lazily.)
let CURRENT: any;
vi.mock("../../data", async (orig) => {
  const actual = await orig<typeof import("../../data")>();
  return {
    ...actual,
    getBiography: async () => CURRENT,
    // getStaticPaths isn't run by the Container, but the page imports
    // getAllBiographies — stub it so the module never reaches a live fetch.
    getAllBiographies: async () => [],
  };
});

const norm = (html: string) =>
  html
    .replace(/\s+data-astro-source-(?:file|loc)="[^"]*"/g, "")
    .replace(/\s+data-astro-cid-[\w-]+(?:="[^"]*")?/g, "")
    // §4 headshot <img>: strip the build-vs-transient volatile attributes on both
    // sides (optimized /_image src + dimensions + loading/decoding + the
    // data-image-component marker) so only stable markup is compared.
    .replace(/\s+(?:src|srcset|width|height|loading|decoding)="[^"]*"/g, "")
    .replace(/\s+data-image-component="[^"]*"/g, "")
    .replace(/cmstbl\d+/g, "cmstbl#")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .replace(/>\s+/g, ">")
    .replace(/\s+</g, "<")
    .trim();

// The page's BiographyCard reads `item.headshot` (a StrapiImagePick {url,width,
// height}), NOT the twin's `headshotUrl`. So a fixture rendered through the REAL
// page must ALSO carry a `headshot` for the avatar to render — fixtures with a
// headshot set both fields (the StrapiImagePick + the matching raw headshotUrl).
type Fixture = BiographyItem & {
  headshot?: { url: string; width: number; height: number } | null;
};

// Render the REAL page and return only its content region (the .markdown-body
// wrapper div), dropping BaseLayout chrome and trailing wrappers.
async function realContent(item: Fixture): Promise<string> {
  CURRENT = item;
  const Page = (await import("../../../pages/about/biographies/[slug].astro")).default;
  const container = await AstroContainer.create();
  const html = await container.renderToString(Page, { params: { slug: item.slug } });
  // The page's <h1> sits inside `<div class="markdown-body mx-auto max-w-5xl …">`,
  // the LAST thing in <main> (BaseLayout's JSON-LD goes in <head>). Anchor the slice
  // on that class string; end on </main>.
  const start = html.indexOf('<div class="markdown-body mx-auto max-w-5xl');
  const end = html.indexOf("</main>", start);
  if (start === -1 || end === -1 || end < start)
    throw new Error("could not locate biography content region in rendered page");
  // BaseLayout wraps <slot/> in a `<div class="min-h-…">…</div>` inside <main>, so
  // the slice picks up that wrapper's closing </div> after the page content — strip
  // the single trailing </div> (+ whitespace) so we compare ONLY the page body.
  return html.slice(start, end).replace(/\s*<\/div>\s*$/, "");
}

// Full record: headshot + unit + role + suffix + a rendered bio body (every block).
// `headshot` (StrapiImagePick) is for the REAL page's BiographyCard; `headshotUrl`
// (the matching raw URL) is what the twin reads — both must be set together.
const full: Fixture = {
  id: "311",
  slug: "jane-q-researcher",
  fullName: "Jane Q. Researcher",
  suffix: "Ph.D.",
  fullNameWithSuffix: "Jane Q. Researcher, Ph.D.",
  title: "Research Analyst & Lead",
  unit: { title: "Research & Analysis Unit", shortName: "RA", slug: "ra", url: "" },
  headshot: { url: "https://agency.icjia-api.cloud/uploads/headshot_jane.jpg", width: 330, height: 431 },
  headshotUrl: "https://agency.icjia-api.cloud/uploads/headshot_jane.jpg",
  headshotAlt: "Jane Q. Researcher headshot",
  bodyHtml: "<p>A bio paragraph with a <strong>bold</strong> word & a quote.</p>",
};

// Edge: NO headshot (75/109 records have none), but unit + role + body present.
const noPhoto: Fixture = {
  ...full,
  id: "312",
  slug: "no-photo-staff",
  fullName: "No Photo Staff",
  suffix: undefined,
  fullNameWithSuffix: "No Photo Staff",
  headshot: null,
  headshotUrl: null,
  headshotAlt: "No Photo Staff headshot",
};

// Edge: headshot present but NO body (empty bio) — confirms the bio-text div omits.
const photoNoBody: Fixture = {
  ...full,
  id: "313",
  slug: "photo-no-body",
  fullName: "Photo NoBody",
  suffix: undefined,
  fullNameWithSuffix: "Photo NoBody",
  headshotAlt: "Photo NoBody headshot",
  bodyHtml: "",
};

// Edge: nothing optional — no headshot, no unit, no title, no body (every empty
// branch: avatar omitted, subtitle empty, bio-text omitted).
const minimal: Fixture = {
  id: "314",
  slug: "bare-bio",
  fullName: "Bare Bio",
  suffix: undefined,
  fullNameWithSuffix: "Bare Bio",
  title: undefined,
  unit: null,
  headshotUrl: null,
  headshotAlt: "Bare Bio headshot",
  bodyHtml: "",
};

describe("renderBiographyDetail twin/page parity", () => {
  it("matches the real [slug].astro — full record (headshot + unit + role + body)", async () => {
    expect(norm(renderBiographyDetail(full))).toBe(norm(await realContent(full)));
  });

  it("matches the real [slug].astro — no headshot", async () => {
    expect(norm(renderBiographyDetail(noPhoto))).toBe(norm(await realContent(noPhoto)));
  });

  it("matches the real [slug].astro — headshot but no body", async () => {
    expect(norm(renderBiographyDetail(photoNoBody))).toBe(
      norm(await realContent(photoNoBody)),
    );
  });

  it("matches the real [slug].astro — minimal (every empty branch)", async () => {
    expect(norm(renderBiographyDetail(minimal))).toBe(norm(await realContent(minimal)));
  });
});

// ── shaper correctness (RAW REST record → the shape the twin/page consume) ──────
describe("shapeBiography(raw REST) → renderBiographyDetail", () => {
  it("shapes a raw REST biography (bio field, headshot media) → matches the component", async () => {
    // Raw HUB-style REST record (field shape verified live against /biographies):
    // body lives under `bio` (the GraphQL alias `body: bio` is NOT applied to REST).
    const raw = {
      id: 99,
      slug: "jessica-reichert",
      fullName: "Jessica Reichert",
      suffix: null,
      title: "Manager, Center for Justice Research and Evaluation",
      unit: {
        title: "Research & Analysis Unit",
        shortName: "RA",
        slug: "ra",
        url: "",
      },
      bio: "## About\n\nManages the research center & evaluation work.",
      headshot: {
        url: "/uploads/Jessica_Reichert_headshot2_a78fd5b1a7.jpeg",
        width: 697,
        height: 637,
        formats: {
          small: { url: "/uploads/small_Jessica_Reichert_headshot2_a78fd5b1a7.jpeg" },
        },
      },
    };
    const item = shapeBiography(raw, renderToHtml);
    // Spot-check the shaper reproduced data.ts shapeBiography output.
    expect(item.fullNameWithSuffix).toBe("Jessica Reichert");
    expect(item.title).toBe("Manager, Center for Justice Research and Evaluation");
    expect(item.unit?.title).toBe("Research & Analysis Unit");
    expect(item.headshotAlt).toBe("Jessica Reichert headshot");
    // RAW headshot URL absolutized against AGENCY (the §4 transient deviation).
    expect(item.headshotUrl).toBe(
      "https://agency.icjia-api.cloud/uploads/Jessica_Reichert_headshot2_a78fd5b1a7.jpeg",
    );
    // body rendered from the `bio` field (markdown-it anchor adds the h2 id).
    expect(item.bodyHtml).toMatch(/<h2[^>]*id="about"/);
    expect(item.bodyHtml).toMatch(/research center/);
    // And the twin still matches the real page for the shaped record. The real
    // page's BiographyCard reads `headshot` (StrapiImagePick), which the client
    // shaper doesn't produce (it carries headshotUrl), so add the equivalent pick
    // for the real render only — same image, just the build-time shape.
    const realItem: Fixture = {
      ...item,
      headshot: { url: item.headshotUrl as string, width: 697, height: 637 },
    };
    expect(norm(renderBiographyDetail(item))).toBe(norm(await realContent(realItem)));
  });

  it("applies a suffix and falls back to the GraphQL `body` alias when `bio` is absent", () => {
    const item = shapeBiography(
      { slug: "x", fullName: "Sam Roe", suffix: "J.D.", body: "Plain body." },
      renderToHtml,
    );
    expect(item.fullNameWithSuffix).toBe("Sam Roe, J.D.");
    expect(item.headshotUrl).toBe(null);
    expect(item.bodyHtml).toMatch(/Plain body/);
  });
});
