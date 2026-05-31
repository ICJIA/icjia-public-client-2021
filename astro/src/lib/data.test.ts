// Unit tests for the pure (no-network) view-model helpers in data.ts. These are
// the content-correctness foundation: they map raw Strapi fields → the strings the
// templates render (labels, dates, file sizes, slugs, truncation). Fully
// deterministic (the hybrid strategy: fixtures here, live-deploy for E2E/VR).
import { describe, it, expect } from "vitest";
import {
  truncateWords,
  slugifyHeading,
  niceBytes,
  getFileType,
  isNew,
  filterUpcoming,
  fundingCategoryLabel,
  publicationTypeLabel,
  newsCategoryLabel,
  meetingCategoryLabel,
  employmentCategoryLabel,
  formatNewsDate,
  formatDate,
  strapiUrl,
  monthBucket,
} from "./data";

describe("truncateWords", () => {
  it("returns '' for empty/undefined", () => {
    expect(truncateWords()).toBe("");
    expect(truncateWords("")).toBe("");
  });
  it("keeps text within the limit unchanged (no ellipsis)", () => {
    expect(truncateWords("a b c", 5)).toBe("a b c");
  });
  it("truncates to N words + ellipsis", () => {
    expect(truncateWords("one two three four", 2)).toBe("one two...");
  });
  it("collapses runs of whitespace", () => {
    expect(truncateWords("  one   two   three ", 2)).toBe("one two...");
  });
});

describe("slugifyHeading (TOC anchor ids)", () => {
  it("lowercases + hyphenates non-alphanumerics", () => {
    expect(slugifyHeading("Hello World!")).toBe("hello-world");
  });
  it("collapses runs + strips leading/trailing hyphens", () => {
    expect(slugifyHeading("  Foo & Bar  ")).toBe("foo-bar");
    expect(slugifyHeading("A -- B")).toBe("a-b");
  });
  it("keeps digits", () => {
    expect(slugifyHeading("2024 Annual Report")).toBe("2024-annual-report");
  });
});

describe("niceBytes", () => {
  it("bytes under 1 KB", () => {
    expect(niceBytes(0)).toBe("0 B");
    expect(niceBytes(512)).toBe("512 B");
  });
  it("kilobytes (1 KB–1 MB) — NOT megabytes (regression guard)", () => {
    expect(niceBytes(1024)).toBe("1.0 KB");
    expect(niceBytes(1536)).toBe("1.5 KB");
    expect(niceBytes(51200)).toBe("50 KB");
  });
  it("megabytes + gigabytes", () => {
    expect(niceBytes(1048576)).toBe("1.0 MB");
    expect(niceBytes(1073741824)).toBe("1.0 GB");
  });
  it("coerces non-numbers to 0", () => {
    expect(niceBytes(undefined)).toBe("0 B");
  });
});

describe("getFileType (file-type chip)", () => {
  it("uppercases the extension", () => {
    expect(getFileType("https://x/path/file.pdf")).toBe("PDF");
    expect(getFileType("/uploads/Report.DOCX")).toBe("DOCX");
  });
  it("strips query + hash before reading the extension", () => {
    expect(getFileType("https://x/a.xlsx?v=2")).toBe("XLSX");
    expect(getFileType("https://x/a.pdf#page=3")).toBe("PDF");
  });
  it("empty for no url", () => {
    expect(getFileType()).toBe("");
    expect(getFileType("")).toBe("");
  });
});

describe("category label mappers", () => {
  it("news (known key + default)", () => {
    expect(newsCategoryLabel("pressRelease")).toBe("Press Release");
    expect(newsCategoryLabel("unknown")).toBe("News");
    expect(newsCategoryLabel()).toBe("News");
  });
  it("meeting (unknown → Special)", () => {
    expect(meetingCategoryLabel()).toBe("Special");
    expect(meetingCategoryLabel("nope")).toBe("Special");
  });
  it("employment (known + default)", () => {
    expect(employmentCategoryLabel("fullTime")).toBe("Full Time");
    expect(employmentCategoryLabel()).toBe("Undefined");
  });
  it("funding", () => {
    expect(fundingCategoryLabel("nofo")).toBe("Notice of Funding Opportunity");
    expect(fundingCategoryLabel("rfi")).toBe("Request for Information");
    expect(fundingCategoryLabel()).toBe("");
  });
  it("publication type (known + default → General)", () => {
    expect(publicationTypeLabel("researchReport")).toBe("Research Report");
    expect(publicationTypeLabel("annualReport")).toBe("Annual Report");
    expect(publicationTypeLabel("something-unmapped")).toBe("General");
    expect(publicationTypeLabel()).toBe("General");
  });
});

describe("formatNewsDate (UTC, full-month DD, YYYY)", () => {
  it("zero-pads the day", () => {
    expect(formatNewsDate("2026-05-14T12:00:00Z")).toBe("May 14, 2026");
    expect(formatNewsDate("2026-01-05T00:00:00Z")).toBe("January 05, 2026");
  });
  it("empty for missing/invalid", () => {
    expect(formatNewsDate()).toBe("");
    expect(formatNewsDate("not-a-date")).toBe("");
  });
});

describe("formatDate (America/Chicago long)", () => {
  it("formats a timestamp", () => {
    const s = formatDate("2026-05-14T17:00:00Z");
    expect(s).toContain("2026");
    expect(s).toContain("May");
    expect(s).toContain("14");
  });
  it("empty for missing", () => {
    expect(formatDate()).toBe("");
  });
});

describe("strapiUrl", () => {
  it("passes absolute URLs through", () => {
    expect(strapiUrl("https://x/y.jpg")).toBe("https://x/y.jpg");
  });
  it("prefixes relative paths with the Strapi host", () => {
    expect(strapiUrl("/uploads/a.jpg")).toBe("https://agency.icjia-api.cloud/uploads/a.jpg");
  });
  it("null for empty input", () => {
    expect(strapiUrl(null)).toBeNull();
    expect(strapiUrl()).toBeNull();
  });
});

describe("isNew (within N days of now)", () => {
  it("true for a just-published date", () => {
    expect(isNew(new Date().toISOString())).toBe(true);
  });
  it("false for an old date", () => {
    expect(isNew("2000-01-01T00:00:00Z")).toBe(false);
  });
  it("false for missing/invalid", () => {
    expect(isNew()).toBe(false);
    expect(isNew("nope")).toBe(false);
  });
});

describe("filterUpcoming", () => {
  it("keeps future-end items, drops past + undated", () => {
    const future = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const past = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const kept = filterUpcoming([{ end: future, id: "f" }, { end: past, id: "p" }, { id: "none" }]);
    expect(kept.map((i: any) => i.id)).toEqual(["f"]);
  });
});

describe("monthBucket", () => {
  it("'this' for now, 'earlier' for long ago / missing / invalid", () => {
    expect(monthBucket(new Date().toISOString())).toBe("this");
    expect(monthBucket("2000-01-01T00:00:00Z")).toBe("earlier");
    expect(monthBucket()).toBe("earlier");
    expect(monthBucket("nope")).toBe("earlier");
  });
});
