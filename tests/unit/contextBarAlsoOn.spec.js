/* eslint-env mocha */
// =============================================================================
// Which context bar a page shows (v1.5.116). A page shows the bar of its
// section, found by the first part of its address. Two of the agency's
// statutory reports are not under /researchhub/ and showed the wrong bar or
// none: Drone Reporting the IDS bar, Homicide Reporting no bar. A bar can name
// pages outside its section now ("alsoOn" in src/config/contextMenus.json), and
// both show the Research and Analysis bar, where they have a tab each.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import bars from "@/config/contextMenus.json";
import { topContextMenuFor } from "@/lib/utils";

const nameOf = (route) => {
  const found = topContextMenuFor(bars, route);
  return found ? found.map((bar) => bar.name) : found;
};
const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("Which context bar a page shows", () => {
  it("the R&A bar on Homicide Reporting and on Drone Reporting", () => {
    expect(nameOf("/homicide/")).to.deep.equal(["researchhub"]);
    expect(nameOf("/homicide")).to.deep.equal(["researchhub"]);
    expect(nameOf("/innovation-and-digital-services/drone/")).to.deep.equal([
      "researchhub",
    ]);
  });

  it("the section's own bar everywhere else, as before", () => {
    expect(nameOf("/innovation-and-digital-services/")).to.deep.equal(["IDS"]);
    expect(nameOf("/innovation-and-digital-services/infonet/")).to.deep.equal([
      "IDS",
    ]);
    expect(nameOf("/researchhub/articles/an-article/")).to.deep.equal([
      "researchhub",
    ]);
    expect(nameOf("/about/dicra/")).to.deep.equal(["About"]);
    expect(nameOf("/grants/funding")).to.deep.equal(["Grants"]);
  });

  it("none on the front page, nor on a page of no section", () => {
    expect(nameOf("/")).to.equal(null);
    expect(nameOf("")).to.equal(null);
    expect(nameOf("/search/crimes")).to.equal(null);
    expect(nameOf("/no-such-section/page/")).to.equal(null);
  });

  // The page's own tab is then the active one.
  it("names only pages that have a tab in that bar, and only in the R&A bar", () => {
    bars.forEach((bar) => {
      const also = bar.alsoOn || [];
      expect(also.length, bar.name).to.equal(
        bar.name === "researchhub" ? 2 : 0
      );
      also.forEach((page) =>
        expect(
          bar.items.map((item) => item.path),
          bar.name
        ).to.include(page)
      );
    });
  });

  it("is what App.vue asks, and Homicide Reporting names itself in the bar", () => {
    expect(read("src/App.vue")).to.match(/topContextMenuFor\(/);
    expect(read("src/views/Homicide/Homicide.vue")).to.match(
      /EventBus\.\$emit\("context-label", "Illinois Homicide Reporting"\)/
    );
  });
});
