// =============================================================================
// Publications export — pure helper tests
// Validates the URL/format helpers used by scripts/export-publications.js.
// These are pure string functions (no network, no DOM).
//
// Written in CommonJS so they run under plain `npx mocha` (fast, no webpack)
// as well as the project's vue-cli-service test:unit suite. Run directly with:
//   npx mocha tests/unit/publications-export-helpers.spec.js
// =============================================================================
const { expect } = require("chai");
const {
  buildPageUrl,
  normalizeFileUrl,
  parseFileType,
  formatBytes,
  csvEscape,
} = require("../../scripts/lib/publications-export-helpers");

// ---------------------------------------------------------------------------
// buildPageUrl — constructs the absolute on-site detail page URL from a slug.
// The /about/publications/ prefix is hardcoded in the app router.
// ---------------------------------------------------------------------------
describe("buildPageUrl", () => {
  it("builds an absolute page URL with a trailing slash", () => {
    expect(buildPageUrl("my-slug")).to.equal(
      "https://icjia.illinois.gov/about/publications/my-slug/"
    );
  });

  it("handles the real example slug", () => {
    expect(
      buildPageUrl(
        "illinois-domestic-violence-fatality-review-committee-2026-biennial-report"
      )
    ).to.equal(
      "https://icjia.illinois.gov/about/publications/illinois-domestic-violence-fatality-review-committee-2026-biennial-report/"
    );
  });

  it("returns empty string when slug is missing", () => {
    expect(buildPageUrl("")).to.equal("");
    expect(buildPageUrl(null)).to.equal("");
    expect(buildPageUrl(undefined)).to.equal("");
  });
});

// ---------------------------------------------------------------------------
// normalizeFileUrl — returns an absolute, case-corrected file URL.
// Mirrors the ad-hoc fixes in PublicationsSingle.vue (90-103).
// ---------------------------------------------------------------------------
describe("normalizeFileUrl", () => {
  it("passes through an already-absolute URL unchanged", () => {
    const url = "https://agency.icjia-api.cloud/uploads/x.pdf";
    expect(normalizeFileUrl(url)).to.equal(url);
  });

  it("returns empty string for null/undefined/empty", () => {
    expect(normalizeFileUrl(null)).to.equal("");
    expect(normalizeFileUrl(undefined)).to.equal("");
    expect(normalizeFileUrl("")).to.equal("");
  });

  it("prefixes a relative path with the API base", () => {
    expect(normalizeFileUrl("/uploads/x.pdf")).to.equal(
      "https://agency.icjia-api.cloud/uploads/x.pdf"
    );
  });

  it("applies the /Compiler/ -> /compiler/ case fix", () => {
    expect(normalizeFileUrl("https://host/Compiler/x.pdf")).to.equal(
      "https://host/compiler/x.pdf"
    );
  });

  it("applies the /OGA/ -> /oga/ case fix", () => {
    expect(normalizeFileUrl("https://host/OGA/x.pdf")).to.equal(
      "https://host/oga/x.pdf"
    );
  });

  it("applies the /researchreports/ -> /ResearchReports/ case fix", () => {
    expect(normalizeFileUrl("https://host/researchreports/x.pdf")).to.equal(
      "https://host/ResearchReports/x.pdf"
    );
  });

  it("applies case fixes to relative paths and prefixes them", () => {
    expect(normalizeFileUrl("/OGA/x.pdf")).to.equal(
      "https://agency.icjia-api.cloud/oga/x.pdf"
    );
  });

  it("leaves existing URL-encoding (%20) untouched", () => {
    const url = "https://researchhub.icjia-api.cloud/uploads/a%20b.pdf";
    expect(normalizeFileUrl(url)).to.equal(url);
  });
});

// ---------------------------------------------------------------------------
// parseFileType — extracts the uppercased file extension from a URL.
// ---------------------------------------------------------------------------
describe("parseFileType", () => {
  it("extracts PDF from a plain upload URL", () => {
    expect(
      parseFileType(
        "https://agency.icjia-api.cloud/uploads/2026_dvfrc_biennial_report_7641e785ea.pdf"
      )
    ).to.equal("PDF");
  });

  it("extracts PDF from a URL-encoded filename", () => {
    expect(
      parseFileType(
        "https://researchhub.icjia-api.cloud/uploads/2025%20IFVCC%20Strategic%20Plan%20Summary_04242026_Final-260424T14563773.pdf"
      )
    ).to.equal("PDF");
  });

  it("uppercases a mixed-case extension", () => {
    expect(parseFileType("https://example.com/file.DocX")).to.equal("DOCX");
  });

  it("ignores a query string", () => {
    expect(parseFileType("https://example.com/file.pdf?download=1")).to.equal(
      "PDF"
    );
  });

  it("ignores a hash fragment", () => {
    expect(parseFileType("https://example.com/file.pdf#page=2")).to.equal(
      "PDF"
    );
  });

  it("returns empty string when there is no extension", () => {
    expect(parseFileType("https://example.com/noext")).to.equal("");
  });

  it("returns empty string for empty/null input", () => {
    expect(parseFileType("")).to.equal("");
    expect(parseFileType(null)).to.equal("");
    expect(parseFileType(undefined)).to.equal("");
  });

  it("uses only the last path segment to find the extension", () => {
    expect(
      parseFileType("https://example.com/path.with.dots/report.xlsx")
    ).to.equal("XLSX");
  });
});

// ---------------------------------------------------------------------------
// formatBytes — human-readable size from a byte count (base 1024).
// ---------------------------------------------------------------------------
describe("formatBytes", () => {
  it("formats bytes under 1 KB with a B suffix", () => {
    expect(formatBytes(0)).to.equal("0 B");
    expect(formatBytes(512)).to.equal("512 B");
  });

  it("formats kilobytes with one decimal", () => {
    expect(formatBytes(1024)).to.equal("1.0 KB");
    expect(formatBytes(1536)).to.equal("1.5 KB");
  });

  it("formats megabytes with one decimal", () => {
    expect(formatBytes(1048576)).to.equal("1.0 MB");
    expect(formatBytes(2621440)).to.equal("2.5 MB");
  });

  it("accepts a numeric string", () => {
    expect(formatBytes("2048")).to.equal("2.0 KB");
  });

  it("returns empty string for null/undefined/non-numeric", () => {
    expect(formatBytes(null)).to.equal("");
    expect(formatBytes(undefined)).to.equal("");
    expect(formatBytes("")).to.equal("");
    expect(formatBytes("abc")).to.equal("");
  });
});

// ---------------------------------------------------------------------------
// csvEscape — RFC-4180-style field escaping for the CSV companion output.
// ---------------------------------------------------------------------------
describe("csvEscape", () => {
  it("leaves a plain value unquoted", () => {
    expect(csvEscape("plain")).to.equal("plain");
  });

  it("quotes a value containing a comma", () => {
    expect(csvEscape("a,b")).to.equal('"a,b"');
  });

  it("escapes embedded double quotes", () => {
    expect(csvEscape('say "hi"')).to.equal('"say ""hi"""');
  });

  it("quotes a value containing a newline", () => {
    expect(csvEscape("line1\nline2")).to.equal('"line1\nline2"');
  });

  it("renders null/undefined as empty string", () => {
    expect(csvEscape(null)).to.equal("");
    expect(csvEscape(undefined)).to.equal("");
  });

  it("stringifies a number", () => {
    expect(csvEscape(123)).to.equal("123");
  });
});
