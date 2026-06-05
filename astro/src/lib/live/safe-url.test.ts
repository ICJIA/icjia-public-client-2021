// safe-url guard coverage (INJ-4…INJ-10): safeUrl() must neutralize dangerous URL
// schemes in client-rendered hrefs (javascript:/data:/vbscript:, case-insensitive,
// and control-char-obfuscated variants) → '#', while passing every legitimate value
// (http(s)/mailto/tel + site-relative + bare) through UNCHANGED, so it is a no-op for
// the renderer parity fixtures.
import { describe, it, expect } from "vitest";
import { safeUrl } from "./safe-url";

describe("safeUrl — dangerous schemes neutralized to '#'", () => {
  it("javascript:", () => expect(safeUrl("javascript:alert(document.cookie)")).toBe("#"));
  it("data:text/html", () =>
    expect(safeUrl("data:text/html,<script>alert(1)</script>")).toBe("#"));
  it("vbscript:", () => expect(safeUrl("vbscript:msgbox(1)")).toBe("#"));
  it("JAVASCRIPT: (uppercase scheme)", () => expect(safeUrl("JAVASCRIPT:alert(1)")).toBe("#"));
  it("java\\tscript: (control-char obfuscation)", () =>
    expect(safeUrl("java\tscript:alert(1)")).toBe("#"));
});

describe("safeUrl — legitimate values pass through unchanged", () => {
  it("https://x", () => expect(safeUrl("https://x")).toBe("https://x"));
  it("mailto:a@b", () => expect(safeUrl("mailto:a@b")).toBe("mailto:a@b"));
  it("site-relative /uploads/x.pdf", () =>
    expect(safeUrl("/uploads/x.pdf")).toBe("/uploads/x.pdf"));
  it("fragment #frag", () => expect(safeUrl("#frag")).toBe("#frag"));
});

describe("safeUrl — empty / nullish → '#'", () => {
  it("empty string", () => expect(safeUrl("")).toBe("#"));
  it("null", () => expect(safeUrl(null)).toBe("#"));
});
