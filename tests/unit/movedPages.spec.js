/* eslint-env mocha */
// =============================================================================
// A CMS page that lives outside its category's section (v1.5.137)
//
// The ICJIA and University of Michigan partnership page is filed under About
// in the CMS, which has no "partners" category, and lives at /partners/. That
// is the address the search, the sitemap and the canonical link hold; the
// address under /about/ redirects to it.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { createLocalVue } from "@vue/test-utils";
import VueRouter from "vue-router";
import { redirects } from "@/router/redirects";
import { about } from "@/router/about";
import { canonicalUrl } from "@/utils/canonical";

const { MOVED, pagePath } = require("../../generators/movedPages");

const localVue = createLocalVue();
localVue.use(VueRouter);

const SLUG = "icjia-umich-partnership";
const OLD = `/about/${SLUG}/`;
const PAGE = `/partners/${SLUG}/`;

describe("The partnership page's address", () => {
  const router = () =>
    new VueRouter({ mode: "abstract", routes: [...redirects, ...about] });

  it("is /partners/, with the page's slug for the CMS query", async () => {
    for (const address of [PAGE, `/partners/${SLUG}`]) {
      const r = router();
      await r.push(address);
      expect(r.currentRoute.name, address).to.equal("PartnersPage");
      expect(r.currentRoute.params.slug).to.equal(SLUG);
      expect(canonicalUrl(r.currentRoute.path)).to.equal(
        `https://icjia.illinois.gov${PAGE}`
      );
    }
  });

  it("the address under /about/ leads to it", async () => {
    for (const address of [OLD, `/about/${SLUG}`]) {
      const r = router();
      await r.push(address).catch(() => {});
      expect(r.currentRoute.path, address).to.equal(PAGE);
    }
  });

  it("no other page is shown under /partners/", async () => {
    const r = router();
    await r.push("/partners/foia/").catch(() => {});
    expect(r.currentRoute.matched.length).to.equal(0);
  });

  it("other About pages are still About pages", async () => {
    const r = router();
    await r.push("/about/foia/");
    expect(r.currentRoute.name).to.equal("AboutPage");
  });
});

describe("The partnership page in the search and the sitemap", () => {
  it("has the /partners/ address, whatever its CMS category", () => {
    expect(MOVED).to.deep.equal({ [SLUG]: PAGE });
    expect(pagePath({ slug: SLUG, category: "about" })).to.equal(PAGE);
  });

  it("other pages keep their category's address", () => {
    expect(pagePath({ slug: "foia", category: "about" })).to.equal(
      "/about/foia/"
    );
    expect(pagePath({ slug: "privacy", category: "general" })).to.equal(
      "/privacy/"
    );
  });

  it("the generator takes its addresses from there", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "generators/generateIndexPages.js"),
      "utf8"
    );
    expect(source).to.include('require("./movedPages")');
    expect(source).to.include("fullPath: pagePath(p),");
  });
});
