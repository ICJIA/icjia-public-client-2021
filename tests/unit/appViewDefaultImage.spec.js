/* eslint-env mocha */
// =============================================================================
// A web app's own page (/researchhub/apps/<slug>/): an app with no picture in
// the Research Hub CMS shows the ICJIA default image (v1.5.108), as its cards on
// the front page (v1.5.107) and on /researchhub/apps do. "Illinois Homicide
// Reporting" was published with `image: null`, and the page's loading spinner
// turned for ever in an empty 360 x 350 box.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import AppView from "@/components/Hub/AppView.vue";

const DEFAULT = "/icjia-half-splash-thumb.jpg";

const picture = (image) => AppView.computed.picture.call({ app: { image } });

const source = fs.readFileSync(
  path.join(process.cwd(), "src/components/Hub/AppView.vue"),
  "utf8"
);
const template = source.slice(0, source.indexOf("<script>"));
const images = template.match(/<v-img\b[^>]*>/g) || [];

describe("A web app's page: the ICJIA default image", () => {
  it("is a file the site serves", () => {
    expect(fs.existsSync(path.join(process.cwd(), "public", DEFAULT))).to.be
      .true;
  });

  it("is the picture of an app with none", () => {
    [null, undefined, ""].forEach((empty) =>
      expect(picture(empty)).to.equal(DEFAULT)
    );
  });

  it("leaves an app its own picture", () => {
    const own = "data:image/png;base64,AAAA";
    expect(picture(own)).to.equal(own);
  });

  // Cropped to fill, as the apps' own pictures are: never `contain`, which
  // would leave bands beside the logo.
  it("is what the page's picture shows, filling its space", () => {
    expect(images.length).to.equal(1);
    expect(images[0]).to.include(':src="picture"');
    expect(images[0]).to.not.match(/\bcontain\b/);
  });
});
