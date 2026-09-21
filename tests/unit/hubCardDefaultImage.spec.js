/* eslint-env mocha */
// =============================================================================
// Research Hub cards (HubCard.vue): a picture card whose record has no picture
// of any kind shows the ICJIA default image (v1.5.109). Until then the default
// showed only when a built picture file would not load (/researchhub/apps). The
// Hub's home page gives its "Latest Web Applications" cards the CMS record
// itself, with no built file; "Illinois Homicide Reporting" has `image: null`
// there, so its card had no picture at all beside its neighbours'.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { needsDefaultImage } from "@/utils/hubImage";

const DEFAULT = "/icjia-half-splash-thumb.jpg";

// The card's rule lives in utils/hubImage.js, with its other picture helpers.
const showDefault = ({ textOnly = false, imageOK = true, ...item }) =>
  needsDefaultImage({ item, textOnly, imageOK });

const source = fs.readFileSync(
  path.join(process.cwd(), "src/components/Hub/HubCard.vue"),
  "utf8"
);
const template = source.slice(0, source.indexOf("<script>"));
const images = template.match(/<v-img\b[^>]*>/g) || [];

describe("Research Hub cards: the ICJIA default image", () => {
  it("shows on a picture card with no picture of any kind", () => {
    [null, undefined, ""].forEach(
      (empty) =>
        expect(showDefault({ image: empty, imagePath: empty })).to.be.true
    );
  });

  it("shows when a built picture file would not load, as before", () => {
    expect(showDefault({ imagePath: "/images/x-image.png", imageOK: false })).to
      .be.true;
  });

  it("leaves a card its own picture", () => {
    expect(showDefault({ image: "data:image/png;base64,AAAA" })).to.be.false;
    expect(showDefault({ imagePath: "/images/x-image.png" })).to.be.false;
  });

  // Datasets and the list views are text only, and stay so.
  it("never shows on a text-only card", () => {
    expect(showDefault({ textOnly: true })).to.be.false;
    expect(showDefault({ textOnly: true, imagePath: "/x.png", imageOK: false }))
      .to.be.false;
  });

  it("is one picture in the card, shown by that rule and filling its space", () => {
    const defaults = images.filter((image) =>
      image.includes(`src="${DEFAULT}"`)
    );
    expect(defaults.length).to.equal(1);
    expect(defaults[0]).to.include('v-if="showDefault"');
    expect(defaults[0]).to.include('width="100%"');
    expect(defaults[0]).to.not.match(/\bcontain\b/);
  });
});
