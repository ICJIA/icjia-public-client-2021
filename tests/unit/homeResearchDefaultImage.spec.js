/* eslint-env mocha */
// =============================================================================
// Front page, "Latest Research": a card whose record has no picture in the
// Research Hub CMS shows the ICJIA default image (v1.5.107), the one the
// /researchhub/apps cards fall back to. Without it the picture's loading
// spinner turned for ever: "Illinois Homicide Reporting" was published with
// `image: null`, and v-img has nothing to finish loading.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import HomeResearchCard from "@/components/HomeResearchCard.vue";

const DEFAULT = "/icjia-half-splash-thumb.jpg";

const picture = (type, item) =>
  HomeResearchCard.computed.picture.call({ type, item });

const source = fs.readFileSync(
  path.join(process.cwd(), "src/components/HomeResearchCard.vue"),
  "utf8"
);
const template = source.slice(0, source.indexOf("<script>"));
const images = template.match(/<v-img\b[^>]*>/g) || [];

describe("Front page Latest Research: the ICJIA default image", () => {
  it("is a file the site serves", () => {
    expect(fs.existsSync(path.join(process.cwd(), "public", DEFAULT))).to.be
      .true;
  });

  // An article's picture is its `splash`, a web app's its `image`.
  [
    ["article", "splash"],
    ["app", "image"],
  ].forEach(([type, field]) => {
    it(`is the picture of an ${type} card with no ${field}`, () => {
      [null, undefined, ""].forEach((empty) =>
        expect(picture(type, { [field]: empty })).to.equal(DEFAULT)
      );
    });

    it(`leaves an ${type} card its own ${field}`, () => {
      const own = "data:image/png;base64,AAAA";
      expect(picture(type, { [field]: own })).to.equal(own);
    });
  });

  it("is what both of the card's pictures show", () => {
    expect(images.length).to.equal(2);
    images.forEach((image) => expect(image).to.include(':src="picture"'));
  });

  // The default's dark blue fills the picture's whole space, as the other
  // cards' pictures do and as on /researchhub/apps: cropped to fill, never
  // `contain`, which would leave white bands beside the logo.
  it("fills the picture's whole space", () => {
    images.forEach((image) => {
      expect(image).to.include('width="100%"');
      expect(image).to.include('height="250"');
      expect(image).to.not.match(/\bcontain\b/);
    });
  });

  // Dataset cards have no picture, and get none.
  it("adds no picture to a dataset card", () => {
    images.forEach((image) =>
      expect(image).to.match(/v-if="type === '(article|app)'"/)
    );
  });
});
