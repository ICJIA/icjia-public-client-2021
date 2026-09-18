/* eslint-env mocha */
// =============================================================================
// A search box in the front page's banner (v1.5.88)
//
// Search was reachable only through a magnifier icon in the header, and about
// 2% of visitors opened the search page. The banner now has a labelled search
// field with a Search button, above the two task buttons. It sends the visitor
// to the search page; the search index is not loaded on the front page.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import HomeSplashV2 from "@/components/HomeSplashV2.vue";

const search = (query) => {
  let pushed = null;
  const vm = {
    query,
    $router: { push: (to) => ((pushed = to), Promise.resolve()) },
  };
  HomeSplashV2.methods.search.call(vm);
  return pushed;
};

describe("Front page: search box in the banner", () => {
  it("sends the query to the search page, as every search link does", () => {
    expect(search("  homicide dashboard ")).to.deep.equal({
      name: "Search2",
      params: { query: "homicide%20dashboard" },
    });
  });

  it("opens the search page when nothing was typed", () => {
    expect(search("")).to.deep.equal({ name: "Search1" });
    expect(search(null)).to.deep.equal({ name: "Search1" });
  });

  it("is one labelled search form with a submit button", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/components/HomeSplashV2.vue"),
      "utf8"
    );
    const template = source
      .slice(0, source.indexOf("<script>"))
      .replace(/\s+/g, " ");
    expect(template.match(/role="search"/g) || []).to.have.length(1);
    expect(template).to.include('@submit.prevent="search"');
    expect(template).to.match(
      /<label for="splash-search-input"[^>]*>\s*Search ICJIA\s*<\/label\s*>/
    );
    expect(template).to.match(
      /<input[^>]*id="splash-search-input"[^>]*type="search"/
    );
    expect(template).to.match(
      /<v-btn[^>]*type="submit"[^>]*>\s*Search\s*<\/v-btn\s*>/
    );
  });
});
