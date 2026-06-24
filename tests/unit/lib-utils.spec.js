// =============================================================================
// src/lib/utils.js tests
//
// Pure recursive object helpers (getObjects/getValues/getKeys), the context-bar
// lookup (getContextMenu — reads the real src/config/contextMenus.json), and the
// publication-type label map (getPublicationType).
//
// getContextMenu drives the per-section navy/grey context bar shown on every
// non-home page, so the "known route resolves to the right section" assertion
// is the load-bearing one here.
// =============================================================================
import { expect } from "chai";
import {
  getObjects,
  getValues,
  getKeys,
  getContextMenu,
  getPublicationType,
} from "@/lib/utils";

// ---------------------------------------------------------------------------
// getObjects — collect objects where obj[key] == val (recursively)
// ---------------------------------------------------------------------------
describe("getObjects()", () => {
  it("finds a nested object by key/value match", () => {
    const tree = { a: { path: "/x", label: "X" }, b: { path: "/y" } };
    expect(getObjects(tree, "path", "/x")).to.deep.equal([
      { path: "/x", label: "X" },
    ]);
  });

  it("treats an empty val as a wildcard (any object owning the key)", () => {
    const tree = { item: { path: "/z" } };
    expect(getObjects(tree, "path", "")).to.deep.equal([{ path: "/z" }]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(getObjects({ a: 1, b: 2 }, "path", "/x")).to.deep.equal([]);
  });
});

// ---------------------------------------------------------------------------
// getValues — collect every value stored under a given key
// ---------------------------------------------------------------------------
describe("getValues()", () => {
  it("collects values for a key across nesting levels", () => {
    expect(getValues({ a: 1, b: { a: 2, c: 3 } }, "a")).to.deep.equal([1, 2]);
  });

  it("returns an empty array when the key is absent", () => {
    expect(getValues({ x: 1 }, "z")).to.deep.equal([]);
  });
});

// ---------------------------------------------------------------------------
// getKeys — collect every key whose value matches (loose ==)
// ---------------------------------------------------------------------------
describe("getKeys()", () => {
  it("collects keys whose value matches across nesting levels", () => {
    expect(getKeys({ a: 1, b: 2, c: { d: 1 } }, 1)).to.deep.equal(["a", "d"]);
  });

  it("uses loose equality (string '1' matches number 1)", () => {
    expect(getKeys({ a: "1" }, 1)).to.deep.equal(["a"]);
  });

  it("returns an empty array when no value matches", () => {
    expect(getKeys({ a: 1 }, 99)).to.deep.equal([]);
  });
});

// ---------------------------------------------------------------------------
// getContextMenu — resolve the context-bar section for a route
//
// NOTE: this helper is currently UNUSED in the Vue app — the context bar reads
// contextMenus.json directly (via AppInit), not through getContextMenu. These
// tests pin its behavior in case it's revived, and document one sharp edge:
// it returns the LAST top-level entry that contains the route (last-match-wins),
// so a path that also appears in the Footer sitemap resolves to "Footer".
// Use a path unique to one section ("/grants/programs/") for unambiguous cases.
// ---------------------------------------------------------------------------
describe("getContextMenu()", () => {
  const UNIQUE = "/grants/programs/"; // appears only in the Grants section

  it("resolves a section-unique route to that section menu", () => {
    const menu = getContextMenu("path", UNIQUE);
    expect(menu.name).to.equal("Grants");
    expect(menu.items).to.be.an("array").that.is.not.empty;
  });

  it("matches case-insensitively", () => {
    expect(getContextMenu("path", UNIQUE.toUpperCase()).name).to.equal(
      "Grants"
    );
  });

  it("defaults jsonKey to 'path' when omitted", () => {
    expect(getContextMenu(undefined, UNIQUE).name).to.equal("Grants");
  });

  it("returns an empty object for an unknown route", () => {
    expect(getContextMenu("path", "/no-such-route-xyz/")).to.deep.equal({});
  });

  it("last-match-wins: a path shared with the Footer sitemap resolves to Footer", () => {
    // "/grants/funding/" lives in Grants AND in the trailing Footer entry; the
    // Footer match overwrites the earlier one. Pinned as a known sharp edge.
    expect(getContextMenu("path", "/grants/funding/").name).to.equal("Footer");
  });
});

// ---------------------------------------------------------------------------
// getPublicationType — content-type code -> human label (default "General")
// ---------------------------------------------------------------------------
describe("getPublicationType()", () => {
  const cases = {
    researchReport: "Research Report",
    researchBulletin: "Research Bulletin",
    researchAtAGlance: "Research At A Glance",
    trendsAndIssuesUpdate: "Trends and Issues Update",
    motorVehicleTheftPublications: "Motor Vehicle Theft Publication",
    barj: "BARJ",
    compiler: "Compiler",
    dataset: "Dataset",
    getTheFacts: "GET THE FACTS",
    programEvaluationSummary: "Program Evaluation Summary",
    megProfiles: "MEG Profiles",
    annualReport: "Annual Report",
    article: "Article",
    report: "Report",
    evaluation: "Evaluation",
    toolkit: "Toolkit",
    onGoodAuthority: "On Good Authority",
    application: "Application",
  };

  Object.entries(cases).forEach(([code, label]) => {
    it(`maps "${code}" -> "${label}"`, () => {
      expect(getPublicationType(code)).to.equal(label);
    });
  });

  it('falls back to "General" for unknown / empty / null types', () => {
    expect(getPublicationType("somethingElse")).to.equal("General");
    expect(getPublicationType("")).to.equal("General");
    expect(getPublicationType(null)).to.equal("General");
    expect(getPublicationType(undefined)).to.equal("General");
  });
});
