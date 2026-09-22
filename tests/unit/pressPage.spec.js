/* eslint-env mocha */
// =============================================================================
// Press Releases in the search (v1.5.119)
//
// The press page (/news/press/) is a hand-built view, a listing of the news
// posts that are press releases and media advisories. Like the accessibility
// statement before it (v1.5.118), it was in the sitemap alone, through the
// generator's sitemap-only list, and the search could not find it. It has a
// record in generators/manualPages.js now, and the sitemap-only list is empty.
//
// v1.5.120: a press release is searched in full. The search reads only the
// opening 60 characters of a summary (src/utils/searchFields.js), and a press
// release's summary, about 290 characters, names what was announced past
// them. The worker (public/searchWorker.js) carries the same code.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import Fuse from "fuse.js";
import { createLocalVue } from "@vue/test-utils";
import VueRouter from "vue-router";
import config from "@/config/config.json";
import {
  searchOptions,
  searchAll,
  FULL_TEXT_CATEGORIES,
} from "@/utils/searchFields";
import { redirects } from "@/router/redirects";

const manualPages = require("../../generators/manualPages");

const PAGE = "/news/press/";

createLocalVue().use(VueRouter);

// v1.5.120: the addresses visitors guess for the press page (Plausible,
// 2025-26), and the old site's addresses of single releases (2015-17, none
// of them in the CMS, whose oldest post is of 2021), lead to the page.
describe("The addresses guessed for Press Releases", () => {
  const view = { render: (h) => h("div") };
  const router = () =>
    new VueRouter({
      mode: "abstract",
      routes: [
        { path: "/", component: view },
        ...redirects,
        { path: "/about/:slug", name: "AboutPage", component: view },
        { path: "/news/press/", name: "NewsPress", component: view },
        { path: "/news/:slug", name: "NewsSingle", component: view },
      ],
    });

  it("lead to the page, with or without their last slash", async () => {
    for (const address of [
      "/press/",
      "/news/press-releases/",
      "/news/press-releases",
      "/about/press/",
      "/news-information/press/",
      "/press/icjia-announces-adult-redeploy-illinois-2015-annual-report",
    ]) {
      const r = router();
      await r.push(address).catch(() => {});
      expect(r.currentRoute.name, address).to.equal("NewsPress");
    }
  });

  it("other About pages and news posts are untouched", async () => {
    const r = router();
    await r.push("/about/foia/");
    expect(r.currentRoute.name).to.equal("AboutPage");
    await r.push("/news/some-post/");
    expect(r.currentRoute.name).to.equal("NewsSingle");
  });
});

// The search code the worker carries, run in place (as searchQuality.spec.js
// runs it).
const workerApi = () => {
  const worker = fs.readFileSync(
    path.join(process.cwd(), "public/searchWorker.js"),
    "utf8"
  );
  const start = worker.indexOf("const SEARCH_HEAD_LENGTH");
  const end = worker.indexOf("// Message dispatcher");
  const source = worker.slice(start, worker.lastIndexOf("// ----", end));
  // eslint-disable-next-line no-new-func
  return new Function(
    "Fuse",
    `${source}\nreturn { searchOptions, searchAll, FULL_TEXT_CATEGORIES };`
  )(Fuse);
};

describe("A press release is searched in full", () => {
  // The words past the opening 60 characters: "announced 21 grants ...".
  const summary =
    "CHICAGO— Using revenue generated from adult-use cannabis sales, the Illinois Criminal Justice Information Authority (ICJIA) today announced 21 grants totaling $3.5 million in restorative justice funding.";
  const press = {
    fullPath: "/news/awards/",
    title: "Pritzker Administration Awards $3.5 Million",
    contentType: "news",
    category: "pressRelease",
    summary,
    searchMeta: "",
    tags: [],
  };
  const advisory = {
    ...press,
    fullPath: "/news/advisory/",
    category: "mediaAdvisory",
  };
  const plain = { ...press, fullPath: "/news/plain/", category: "news" };
  const records = [press, advisory, plain].concat(
    // eslint-disable-next-line no-unused-vars
    manualPages.map(({ shell, ...record }) => record)
  );
  // `options`: the app's searchOptions takes Fuse first; the worker's has it.
  const found = (options, api) => {
    const fuse = new Fuse(records, options);
    return api
      .searchAll(fuse, "restorative justice")
      .filter((r) => !r.similar)
      .map((r) => r.item.fullPath);
  };

  it("the app finds words past the opening 60 characters of a press release or a media advisory, and not of a news post", () => {
    const paths = found(searchOptions(Fuse, config.search.site), {
      searchAll,
    });
    expect(paths).to.include("/news/awards/");
    expect(paths).to.include("/news/advisory/");
    expect(paths).to.not.include("/news/plain/");
  });

  it("the search worker does the same", () => {
    const api = workerApi();
    expect(api.FULL_TEXT_CATEGORIES).to.deep.equal(FULL_TEXT_CATEGORIES);
    const paths = found(api.searchOptions(config.search.site), api);
    expect(paths).to.include("/news/awards/");
    expect(paths).to.include("/news/advisory/");
    expect(paths).to.not.include("/news/plain/");
  });

  it("names the two kinds of post the press page shows", () => {
    expect(FULL_TEXT_CATEGORIES).to.deep.equal([
      "pressRelease",
      "mediaAdvisory",
    ]);
  });
});

describe("Press Releases in the search", () => {
  it("the hand-built page has a record", () => {
    const record = manualPages.find((p) => p.fullPath === PAGE);
    expect(record, PAGE).to.not.equal(undefined);
    expect(record.title).to.equal("Press Releases");
    expect(record.contentType).to.equal("page");
  });

  it("the sitemap-only list is empty: every hand-built page has a record", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "generators/searchIndexAndSitemap.js"),
      "utf8"
    );
    const list = source.match(/const manualIndex = \[([^\]]*)\]/);
    expect(list, "the sitemap-only list").to.not.equal(null);
    expect(list[1].trim()).to.equal("");
  });

  it("a search finds the page first, ahead of a press release", () => {
    const records = [
      {
        fullPath: "/news/icjia-awards-grants-2026/",
        title: "ICJIA Announces Grant Awards",
        contentType: "news",
        category: "pressRelease",
        summary:
          "Press release: the Illinois Criminal Justice Information Authority announced grant awards today.",
        searchMeta: "",
        tags: ["press release"],
      },
      // eslint-disable-next-line no-unused-vars
    ].concat(manualPages.map(({ shell, ...record }) => record));
    const fuse = new Fuse(records, searchOptions(Fuse, config.search.site));
    ["press", "press releases", "press release", "media advisory"].forEach(
      (query) => {
        const found = searchAll(fuse, query)
          .filter((r) => !r.similar)
          .map((r) => r.item.fullPath);
        expect(found[0], query).to.equal(PAGE);
      }
    );
  });
});
