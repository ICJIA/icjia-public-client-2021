/* eslint-env mocha */
// =============================================================================
// Page shells, canonical addresses and the statutory-reporting menu
//
// The site is a single-page app: without JavaScript every address serves the
// same index.html, so link previews (LinkedIn, Facebook, Teams, Slack) and
// crawlers that do not run scripts (Bing, DuckDuckGo, AI assistants) saw the
// homepage's title, description and canonical address for every page. After
// the build, generators/generatePageShells.js writes a copy of index.html for
// each hand-built page with that page's own head tags and, for data pages,
// schema.org Dataset markup. These tests pin that contract (v1.5.81).
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";

const { renderShell } = require("../../generators/generatePageShells");
const manualPages = require("../../generators/manualPages");
const { canonicalUrl } = require("@/utils/canonical");

const SHELL =
  '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>' +
  '<meta name="description" content="ICJIA is an Illinois state agency."/>' +
  '<link rel="canonical" href="https://icjia.illinois.gov/"/>' +
  '<meta property="og:type" content="website"/>' +
  '<meta property="og:title" content="ICJIA | Illinois Criminal Justice Information Authority"/>' +
  '<meta property="og:description" content="ICJIA is an Illinois state agency."/>' +
  '<meta property="og:image" content="https://icjia.illinois.gov/icjia-half-splash-thumb-v2.jpg"/>' +
  '<meta property="og:url" content="https://icjia.illinois.gov/"/>' +
  '<meta name="twitter:title" content="ICJIA | Illinois Criminal Justice Information Authority"/>' +
  '<meta name="twitter:description" content="ICJIA is an Illinois state agency."/>' +
  "<title>ICJIA | Illinois Criminal Justice Information Authority</title>" +
  '</head><body><div id="app"></div><script src="/js/app.abc123.js"></script></body></html>';

const PAGE = {
  fullPath: "/homicide/",
  shell: {
    title: "ICJIA | Homicide Reporting",
    socialTitle: "Illinois Homicide Reporting",
    description: 'Quarterly data on homicides & "clearances" in Illinois.',
    dataset: {
      name: "Illinois Homicide Reporting",
      temporalCoverage: "2023-01-01/..",
    },
  },
  tags: ["homicide", "clearance"],
};

describe("Page shells for hand-built pages", () => {
  const html = renderShell(SHELL, PAGE, [
    "homicide-reporting-annual_totals_sept2026.xlsx",
    "homicide-reporting-sept2026-A0.pdf",
    "index.html",
  ]);

  it("gives the page its own title, description and preview tags", () => {
    expect(html).to.include("<title>ICJIA | Homicide Reporting</title>");
    expect(html).to.include(
      '<meta name="description" content="Quarterly data on homicides &amp; &quot;clearances&quot; in Illinois."/>'
    );
    expect(html).to.include(
      '<meta property="og:title" content="Illinois Homicide Reporting"/>'
    );
    expect(html).to.include(
      '<meta name="twitter:title" content="Illinois Homicide Reporting"/>'
    );
    expect(html).to.not.include('content="ICJIA is an Illinois state agency."');
  });

  it("declares the page's own address, with the trailing slash, as canonical", () => {
    expect(html).to.include(
      '<link rel="canonical" href="https://icjia.illinois.gov/homicide/"/>'
    );
    expect(html).to.include(
      '<meta property="og:url" content="https://icjia.illinois.gov/homicide/"/>'
    );
  });

  it("keeps everything else in the shell, including the app bundle and the preview image", () => {
    expect(html).to.include('<script src="/js/app.abc123.js"></script>');
    expect(html).to.include("icjia-half-splash-thumb-v2.jpg");
  });

  it("adds schema.org Dataset markup listing the page's downloads, and nothing else in its folder", () => {
    const json = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
    );
    expect(json, "JSON-LD block").to.not.equal(null);
    const data = JSON.parse(json[1]);
    expect(data["@type"]).to.equal("Dataset");
    expect(data.name).to.equal("Illinois Homicide Reporting");
    expect(data.url).to.equal("https://icjia.illinois.gov/homicide/");
    expect(data.distribution.map((d) => d.contentUrl)).to.deep.equal([
      "https://icjia.illinois.gov/homicide/homicide-reporting-annual_totals_sept2026.xlsx",
      "https://icjia.illinois.gov/homicide/homicide-reporting-sept2026-A0.pdf",
    ]);
    expect(data.distribution[1].encodingFormat).to.equal("application/pdf");
  });

  it("fails loudly when the build's index.html no longer has a tag it must replace", () => {
    const broken = SHELL.replace(/<link rel="canonical"[^>]*>/, "");
    expect(() => renderShell(broken, PAGE, [])).to.throw(/canonical/);
  });
});

describe("Hand-built page list", () => {
  it("gives every page a slash-terminated path and head tags that fit a search result", () => {
    expect(manualPages.length).to.be.greaterThan(0);
    for (const page of manualPages) {
      expect(page.fullPath, page.id).to.match(/^\/.*\/$/);
      if (!page.shell) continue; // a search record only
      expect(page.shell.title, page.id).to.match(/^ICJIA \| /);
      expect(page.shell.description.length, page.id).to.be.within(70, 160);
    }
  });
});

describe("Canonical address", () => {
  it("is the slash-terminated address without a query, as the sitemap lists it", () => {
    expect(canonicalUrl("/homicide")).to.equal(
      "https://icjia.illinois.gov/homicide/"
    );
    expect(canonicalUrl("/homicide/")).to.equal(
      "https://icjia.illinois.gov/homicide/"
    );
    expect(canonicalUrl("/")).to.equal("https://icjia.illinois.gov/");
    expect(canonicalUrl("/researchhub/articles")).to.equal(
      "https://icjia.illinois.gov/researchhub/articles/"
    );
  });
});

describe("Research menu", () => {
  const menus = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "src/config/menus.json"), "utf8")
  );
  const research = menus.menu.find((m) => m.main === "Research").children;

  it("lists the three statutory reports in a section of their own", () => {
    const start = research.findIndex(
      (c) => c.section === "Statutory Reporting"
    );
    expect(start, "Statutory Reporting section").to.be.greaterThan(-1);
    const links = research
      .slice(start + 1, start + 4)
      .map((c) => [c.title, c.link]);
    expect(links).to.deep.equal([
      ["Death in Custody Reporting", "/about/dicra/"],
      ["Drone Reporting", "/innovation-and-digital-services/drone/"],
      ["Homicide Reporting", "/homicide/"],
    ]);
  });
});
