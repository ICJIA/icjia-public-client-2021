/* eslint-env mocha */
// =============================================================================
// The About and the Research and Analysis context bars carry the agency's
// statutory reports (v1.5.113). The About bar had "Death in Custody Reporting"
// alone; "Homicide Reporting" and "Drone Reporting" stand beside it now, and in
// the R&A bar, with the labels and addresses of the Research menu's "Statutory
// Reporting" section (src/config/menus.json).
// =============================================================================
import { expect } from "chai";
import bars from "@/config/contextMenus.json";
import menus from "@/config/menus.json";

const bar = (name) => bars.find((b) => b.name === name);
const labels = (name) => bar(name).items.map((item) => item.label);
const REPORTS = [
  { label: "Homicide Reporting", path: "/homicide/" },
  { label: "Drone Reporting", path: "/innovation-and-digital-services/drone/" },
];

describe("Context bars: the statutory reports", () => {
  it("About: after Death in Custody Reporting, before FOIA", () => {
    const found = labels("About");
    const at = found.indexOf("Death in Custody Reporting");
    expect(found.slice(at, at + 4)).to.deep.equal([
      "Death in Custody Reporting",
      "Homicide Reporting",
      "Drone Reporting",
      "FOIA",
    ]);
  });

  it("Research and Analysis: after Publications, before the Institutional Review Board", () => {
    expect(labels("researchhub").slice(-4)).to.deep.equal([
      "Publications",
      "Homicide Reporting",
      "Drone Reporting",
      "Institutional Review Board",
    ]);
  });

  it("uses the Research menu's addresses for them", () => {
    const inMenus = JSON.stringify(menus);
    ["About", "researchhub"].forEach((name) =>
      REPORTS.forEach(({ label, path }) => {
        const item = bar(name).items.find((i) => i.label === label);
        expect(item, `${name}: ${label}`).to.include({ path });
        expect(inMenus).to.include(`"title":"${label}","link":"${path}"`);
      })
    );
  });

  it("adds them once to each bar, and to no other", () => {
    bars.forEach((b) =>
      REPORTS.forEach(({ label }) => {
        const count = b.items.filter((i) => i.label === label).length;
        const wanted =
          b.name === "About" || b.name === "researchhub"
            ? 1
            : label === "Drone Reporting" && b.name === "IDS"
            ? 1
            : 0;
        expect(count, `${b.name}: ${label}`).to.equal(wanted);
      })
    );
  });
});
