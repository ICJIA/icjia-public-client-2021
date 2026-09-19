/* eslint-env mocha */
// =============================================================================
// Rules, Regulations, and Policies: one page, at one address (v1.5.97)
//
// The CMS has a page "Rules, Regulations, Policies" in the About section with
// no body, so /about/policies/ was blank; and it was that address the search
// and the sitemap held. The page itself is the hand-built view at
// /grants/rules-regs-policies/, which neither of them knew. The old address
// now redirects, the hand-built page is in the index and the sitemap
// (generators/manualPages.js), and the empty CMS record is left out
// (generators/retiredPages.js).
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import Fuse from "fuse.js";
import { createLocalVue } from "@vue/test-utils";
import VueRouter from "vue-router";
import config from "@/config/config.json";
import { searchOptions, searchAll } from "@/utils/searchFields";
import { redirects } from "@/router/redirects";

const { RETIRED, withoutRetired } = require("../../generators/retiredPages");
const manualPages = require("../../generators/manualPages");

const localVue = createLocalVue();
localVue.use(VueRouter);

const OLD = "/about/policies/";
const PAGE = "/grants/rules-regs-policies/";

describe("The old address of Rules, Regulations, and Policies", () => {
  const page = { render: (h) => h("div") };
  const router = () =>
    new VueRouter({
      mode: "abstract",
      routes: [
        { path: "/", component: page },
        ...redirects,
        { path: "/about/:slug", name: "AboutPage", component: page },
        { path: "/grants/rules-regs-policies", name: "Rules", component: page },
      ],
    });

  it("leads to the page, with or without its last slash", async () => {
    for (const address of [OLD, "/about/policies"]) {
      const r = router();
      await r.push(address).catch(() => {});
      expect(r.currentRoute.name, address).to.equal("Rules");
    }
  });

  it("other About pages are still About pages", async () => {
    const r = router();
    await r.push("/about/foia/");
    expect(r.currentRoute.name).to.equal("AboutPage");
  });

  it("the redirects are read before the About pages' own route", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/router/index.js"),
      "utf8"
    );
    expect(source.indexOf("...redirects,")).to.be.greaterThan(-1);
    expect(source.indexOf("...redirects,")).to.be.lessThan(
      source.indexOf("...about,")
    );
  });
});

describe("Rules, Regulations, and Policies in the search and the sitemap", () => {
  it("the empty CMS record is left out, and nothing else", () => {
    expect(RETIRED).to.deep.equal([OLD]);
    const kept = withoutRetired([
      { fullPath: OLD, title: "Rules, Regulations, Policies" },
      { fullPath: "/about/foia/", title: "FOIA" },
    ]);
    expect(kept.map((r) => r.fullPath)).to.deep.equal(["/about/foia/"]);
  });

  it("the hand-built page has a record", () => {
    const record = manualPages.find((p) => p.fullPath === PAGE);
    expect(record, PAGE).to.not.equal(undefined);
    expect(record.title).to.equal("Rules, Regulations, and Policies");
    expect(record.contentType).to.equal("page");
  });

  it("the generator leaves the one out and takes the other in", () => {
    const source = fs
      .readFileSync(
        path.join(process.cwd(), "generators/searchIndexAndSitemap.js"),
        "utf8"
      )
      .replace(/\s+/g, " ");
    expect(source).to.include('require("./retiredPages")');
    expect(source).to.include("...withoutRetired(addKeywords(pages");
  });

  it("a search finds the page, and not the blank one", () => {
    const records = withoutRetired([
      {
        fullPath: OLD,
        title: "Rules, Regulations, Policies",
        contentType: "page",
      },
      {
        fullPath: "/about/privacy/",
        title: "Privacy Policy",
        contentType: "page",
      },
      // eslint-disable-next-line no-unused-vars
    ]).concat(manualPages.map(({ shell, ...record }) => record));
    const fuse = new Fuse(records, searchOptions(Fuse, config.search.site));
    [
      "rules",
      "regulations",
      "policies",
      "rules regulations policies",
      "administrative code",
      "grant policies",
    ].forEach((query) => {
      const found = searchAll(fuse, query)
        .filter((r) => !r.similar)
        .map((r) => r.item.fullPath);
      expect(found, query).to.include(PAGE);
      expect(found, query).to.not.include(OLD);
    });
  });
});
