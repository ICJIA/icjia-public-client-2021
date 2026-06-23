// =============================================================================
// Unit tests for hub card image-URL helpers (src/utils/hubImage.js)
//
// Regression: research hub article cards hard-coded a ".jpeg" splash URL while
// generators/generateImagesHub.js writes each image under its ORIGINAL
// extension (.png for a PNG upload, .jpeg for a JPEG). PNG articles 404'd and
// fell back to the default placeholder. splashCandidates() lets a card try the
// original extension first, then the alternate, before giving up.
// =============================================================================
import { expect } from "chai";
import { splashCandidates } from "@/utils/hubImage";

describe("hubImage.splashCandidates", () => {
  const JPEG = "https://icjia.illinois.gov/images/abc123-splash.jpeg";
  const PNG = "https://icjia.illinois.gov/researchhub/images/abc123-image.png";

  it("tries .jpeg first, then .png for a jpeg-built article URL", () => {
    expect(splashCandidates(JPEG)).to.deep.equal([
      "https://icjia.illinois.gov/images/abc123-splash.jpeg",
      "https://icjia.illinois.gov/images/abc123-splash.png",
    ]);
  });

  it("tries .png first, then .jpeg for a png-built app URL", () => {
    expect(splashCandidates(PNG)).to.deep.equal([
      "https://icjia.illinois.gov/researchhub/images/abc123-image.png",
      "https://icjia.illinois.gov/researchhub/images/abc123-image.jpeg",
    ]);
  });

  it("keeps the original extension as the first attempt (no regression for working images)", () => {
    expect(splashCandidates(JPEG)[0]).to.equal(JPEG);
    expect(splashCandidates(PNG)[0]).to.equal(PNG);
  });

  it("returns an empty list for a null/empty path", () => {
    expect(splashCandidates(null)).to.deep.equal([]);
    expect(splashCandidates(undefined)).to.deep.equal([]);
    expect(splashCandidates("")).to.deep.equal([]);
  });

  it("leaves an unrecognized extension untouched (single attempt)", () => {
    const webp = "https://icjia.illinois.gov/images/abc123-splash.webp";
    expect(splashCandidates(webp)).to.deep.equal([webp]);
  });

  it("treats .jpg the same as .jpeg (alternate is .png)", () => {
    const jpg = "https://icjia.illinois.gov/images/abc123-splash.jpg";
    expect(splashCandidates(jpg)).to.deep.equal([
      "https://icjia.illinois.gov/images/abc123-splash.jpg",
      "https://icjia.illinois.gov/images/abc123-splash.png",
    ]);
  });
});
