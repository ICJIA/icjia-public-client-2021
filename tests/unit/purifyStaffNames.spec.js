/* eslint-env mocha */
// =============================================================================
// Staff names are taken out of search keywords at build time (v1.5.98)
//
// CMS editors put people's names in a page's search keywords, and the build
// strips them before the index is published (generators/utils/
// purifyStaffNames.js). It knows the names from the biographies, so a name is
// stripped only while its owner has a biography. When the former research
// director's biography was removed, "timothy lavery", which had been in the
// Research & Analysis Unit's keywords all along, appeared in the public index,
// and a search for him led to a page he is not on. Former staff are named in
// the module's own list.
// =============================================================================
import { expect } from "chai";

const {
  EXTRAS,
  blocklistFrom,
  purifyString,
  purifyRecord,
} = require("../../generators/utils/purifyStaffNames");

// The roster as the build reads it from the biographies.
const roster = [
  { firstName: "Jane", lastName: "Roe", fullName: "Jane Roe" },
  { firstName: "Sam", lastName: "Li", fullName: "Sam Li" },
];
const UNIT = "timothy lavery SAC statistical analysis center data R&A";

describe("Search keywords: staff names are stripped", () => {
  it("a former director's, though he has no biography any more", () => {
    expect(EXTRAS).to.include("Timothy Lavery");
    expect(purifyString(UNIT, blocklistFrom(roster))).to.equal(
      "SAC statistical analysis center data R&A"
    );
    expect(purifyString(UNIT, blocklistFrom([]))).to.equal(
      "SAC statistical analysis center data R&A"
    );
  });

  it("by last name alone, and in any case", () => {
    const blocklist = blocklistFrom(roster);
    expect(purifyString("Lavery data", blocklist)).to.equal("data");
    expect(purifyString("TIMOTHY LAVERY", blocklist)).to.equal("");
  });

  it("everyone who has a biography", () => {
    const blocklist = blocklistFrom(roster);
    expect(purifyString("jane roe grants Roe victims", blocklist)).to.equal(
      "grants victims"
    );
    // A two-letter last name is not stripped on its own: it is in too many words.
    expect(purifyString("sam li reliability", blocklist)).to.equal(
      "reliability"
    );
    expect(blocklist).to.not.include("Li");
  });

  it("and nothing else", () => {
    const keywords = "SAC statistical analysis center data R&A";
    expect(purifyString(keywords, blocklistFrom(roster))).to.equal(keywords);
    expect(purifyString("", blocklistFrom(roster))).to.equal("");
  });

  it("in a record's keywords only, leaving the record as it was given", () => {
    const record = { title: "Research & Analysis Unit", searchMeta: UNIT };
    const clean = purifyRecord(record, blocklistFrom(roster));
    expect(clean).to.deep.equal({
      title: "Research & Analysis Unit",
      searchMeta: "SAC statistical analysis center data R&A",
    });
    expect(record.searchMeta).to.equal(UNIT);
  });
});
