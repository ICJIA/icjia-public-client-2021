/* eslint-env mocha */
// =============================================================================
// The Partners menu in the site search (v1.5.92)
//
// The Partners dropdown links to the agency's other sites (R3, Adult Redeploy,
// i2i...) and to its plans. None of them was in the search: a search
// for "R3" found news and funding about R3 and not the R3 site. A record is now
// built for every link in that dropdown, from the menu itself, so a link added
// to the menu is searchable at the next build. They point off this site, so
// they stay out of the sitemap, and a result opens in a new tab as the menu's
// links do.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import Fuse from "fuse.js";
import config from "@/config/config.json";
import menus from "@/config/menus.json";
import sample from "./fixtures/searchSample.json";
import { searchOptions, searchAll } from "@/utils/searchFields";
import SearchCard from "@/components/SearchCard.vue";
import SearchCardAlt from "@/components/SearchCardAlt.vue";
import SearchStatic from "@/views/Search/SearchStatic.vue";
const { partnerRecords } = require("../../generators/partnerLinks");

const source = (file) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");
const partners = menus.menu.find((m) => m.main === "Partners");
const links = partners.children.filter((c) => c.link);
const records = partnerRecords(menus);

describe("Partners menu: a search record for every link", () => {
  it("builds one record per link, with the menu's title and address", () => {
    expect(records.length).to.equal(links.length);
    expect(records.map((r) => r.title)).to.deep.equal(
      links.map((l) => l.title)
    );
    expect(records.map((r) => r.fullPath)).to.deep.equal(
      links.map((l) => l.link)
    );
    for (const record of records)
      expect(record.external, record.title).to.equal(true);
  });

  it("names a record by the menu section it sits under", () => {
    const type = (title) => records.find((r) => r.title === title).contentType;
    expect(type("Restore, Reinvest, Renew (R3)")).to.equal("partner site");
    expect(type("Adult Redeploy Illinois")).to.equal("partner site");
    expect(type("Statewide Violence Prevention Plan: 2025-2029")).to.equal(
      "plan"
    );
  });

  it("gives every record the words people type for it", () => {
    const meta = (title) =>
      records.find((r) => r.title.startsWith(title)).searchMeta.toLowerCase();
    expect(meta("Restore, Reinvest, Renew")).to.include("r3");
    expect(meta("Adult Redeploy")).to.include("ari");
    expect(meta("Sentencing Policy")).to.include("spac");
    expect(meta("Illinois Family Violence")).to.include("ifvcc");
    expect(meta("Illinois Domestic Violence Fatality")).to.include("dvfr");
    for (const record of records) {
      expect(record.searchMeta, record.title)
        .to.be.a("string")
        .and.not.equal("");
      expect(record.summary, record.title).to.be.a("string").and.not.equal("");
    }
  });

  it("still builds a record for a link nobody has described yet", () => {
    const menu = {
      menu: [
        {
          main: "Partners",
          children: [
            { section: "Websites" },
            {
              title: "A New Partner",
              link: "https://new.example.gov/",
              external: true,
            },
          ],
        },
      ],
    };
    const [record] = partnerRecords(menu);
    expect(record.title).to.equal("A New Partner");
    expect(record.fullPath).to.equal("https://new.example.gov/");
    expect(record.contentType).to.equal("partner site");
  });
});

// v1.5.93: the Illinois Heals site was archived and left the menu, and one
// plan's title said "Justice Research Grant" where the plan is the Justice
// Assistance Grant (JAG) plan. The search records follow the menu.
describe("Partners menu: what it lists", () => {
  it("no longer lists the archived Illinois Heals site", () => {
    expect(links.map((l) => l.title)).to.not.include("Illinois Heals");
    expect(links.map((l) => l.link).join(" ")).to.not.include("ilheals");
    expect(records.map((r) => r.title)).to.not.include("Illinois Heals");
  });

  it("titles the 2024-2029 JAG plan as the plan titles itself", () => {
    expect(links.map((l) => l.title)).to.include(
      "Illinois Edward Byrne Memorial Justice Assistance Grant Strategic Plan 2024-2029"
    );
    expect(links.map((l) => l.title).join(" ")).to.not.include(
      "Justice Research Grant"
    );
  });
});

describe("Partners menu: the records rank high", () => {
  const fuse = new Fuse(
    sample.records.concat(records),
    searchOptions(Fuse, config.search.site)
  );
  const first = (query) => searchAll(fuse, query)[0].item.title;

  it("a partner's name or short name finds its site first", () => {
    expect(first("R3")).to.equal("Restore, Reinvest, Renew (R3)");
    expect(first("r3 website")).to.equal("Restore, Reinvest, Renew (R3)");
    expect(first("restore reinvest renew")).to.equal(
      "Restore, Reinvest, Renew (R3)"
    );
    expect(first("adult redeploy")).to.equal("Adult Redeploy Illinois");
    expect(first("ARI")).to.equal("Adult Redeploy Illinois");
    expect(first("i2i")).to.equal("Institute to Innovate (i2i)");
    expect(first("SPAC")).to.equal("Sentencing Policy and Advisory Council");
    expect(first("violence prevention plan")).to.equal(
      "Statewide Violence Prevention Plan: 2025-2029"
    );
  });
});

describe("Partners menu: off-site results", () => {
  it("stay out of the sitemap, which lists this site's pages", () => {
    const generator = source("generators/searchIndexAndSitemap.js");
    expect(generator).to.include('require("./partnerLinks")');
    expect(generator).to.match(
      /siteIndex\s*\.filter\(\(item\) => !item\.external\)/
    );
  });

  it("open in a new tab from the search page, as the menu's links do", () => {
    const template = source("src/components/SearchCard.vue")
      .split("<script>")[0]
      .replace(/\s+/g, " ");
    expect(template).to.match(
      /<a v-if="isExternal" :href="item\.fullPath" target="_blank" rel="noopener noreferrer" class="card-title-link"/
    );
    expect(template).to.include("(opens in a new tab)");
    let opened = null;
    let pushed = null;
    const open = window.open;
    window.open = (url) => (opened = url);
    const vm = {
      isStatic: true,
      isExternal: true,
      item: { fullPath: "https://r3.illinois.gov/" },
      $router: { push: (to) => ((pushed = to), Promise.resolve()) },
    };
    SearchCard.methods.route.call(vm, vm.item.fullPath);
    window.open = open;
    expect(opened).to.equal("https://r3.illinois.gov/");
    expect(pushed).to.equal(null);
  });

  it("are told apart by their address", () => {
    const is = (fullPath) =>
      SearchCard.computed.isExternal.call({ item: { fullPath } });
    expect(is("https://r3.illinois.gov/")).to.equal(true);
    expect(is("http://dvfr.illinois.gov")).to.equal(true);
    expect(is("/grants/programs/x/")).to.equal(false);
    expect(is(undefined)).to.equal(false);
    expect(
      SearchCardAlt.computed.isExternal.call({
        item: { fullPath: "https://spac.illinois.gov/" },
      })
    ).to.equal(true);
  });

  it("open in a new tab from a related-content list too", () => {
    const template = source("src/components/SearchCardAlt.vue")
      .split("<script>")[0]
      .replace(/\s+/g, " ");
    expect(template).to.match(
      /<a v-if="isExternal" :href="item\.fullPath" target="_blank" rel="noopener noreferrer" class="card-title-link"/
    );
  });

  it("have their own filter chips", () => {
    expect(SearchStatic.methods.prettifyType("partner site")).to.equal(
      "Partner Sites"
    );
    expect(SearchStatic.methods.prettifyType("plan")).to.equal("Plans");
  });
});
