/* eslint-env mocha */
// =============================================================================
// The button that opens a row of the publications list is named as the row is
// drawn (v1.5.135, WCAG 4.1.2). Its name used to be written two seconds after
// the list loaded, so axe found 150 buttons without one. The words are those
// fixExpandButtons (src/a11y/index.js) gives the same button.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import PublicationsAll from "@/views/About/PublicationsAll.vue";

const expandLabel = PublicationsAll.methods.expandLabel;
const source = fs.readFileSync(
  path.resolve(__dirname, "../../src/views/About/PublicationsAll.vue"),
  "utf8"
);

describe("Publications list: the name of a row's expand button", () => {
  it("names the publication", () => {
    expect(expandLabel({ title: "SFY25 Drone Surveillance Report" })).to.equal(
      "Toggle details for SFY25 Drone Surveillance Report"
    );
  });

  it("shortens a long title as fixExpandButtons does (80 characters)", () => {
    const title = "A".repeat(81);
    expect(expandLabel({ title })).to.equal(
      `Toggle details for ${"A".repeat(77)}…`
    );
    expect(expandLabel({ title: "A".repeat(80) })).to.equal(
      `Toggle details for ${"A".repeat(80)}`
    );
  });

  it("still has a name when a record has no title", () => {
    expect(expandLabel({ title: "  " })).to.equal("Expand");
    expect(expandLabel({})).to.equal("Expand");
  });

  it("is given in the table's own template, with the open or closed state", () => {
    const slot = source.slice(
      source.indexOf("v-slot:item.data-table-expand"),
      source.indexOf("v-slot:item.publicationDate")
    );
    expect(slot).to.include(':aria-label="expandLabel(item)"');
    expect(slot).to.include(":aria-expanded=");
    expect(slot).to.include('class="v-data-table__expand-icon"');
  });
});
