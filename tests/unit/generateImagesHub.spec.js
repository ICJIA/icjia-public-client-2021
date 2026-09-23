// =============================================================================
// The build step that writes the Research Hub pictures
// (generators/generateImagesHub.js): each app's `image` and each article's
// `splash`, from base64 in the CMS record, to public/images/<id>-<field>.<ext>,
// where the cards on /researchhub/articles/ and /researchhub/apps/ load them.
//
// Regression (v1.5.124): the "Illinois Homicide Reporting" app was published on
// 21 Sept 2026 with `image: null`. Reading it threw, the build's catch only
// logged the error, and the run ended before the articles: no article splash
// was written, and every article card showed the ICJIA default.
// =============================================================================
import { expect } from "chai";
import fs from "fs";

const { writeImages } = require("../../generators/generateImagesHub");

describe("generateImagesHub.writeImages", () => {
  let written;
  let writeFile;
  let log;

  beforeEach(() => {
    written = [];
    writeFile = fs.writeFile;
    log = console.log;
    fs.writeFile = (path) => written.push(path);
    console.log = () => {};
  });

  afterEach(() => {
    fs.writeFile = writeFile;
    console.log = log;
  });

  it("writes each picture under its record's id, field and own extension", () => {
    writeImages(
      [
        { _id: "a1", splash: "data:image/jpeg;base64,QUJD" },
        { _id: "a2", splash: "data:image/png;base64,QUJD" },
      ],
      ["splash"]
    );
    expect(written).to.deep.equal([
      "./public/images/a1-splash.jpeg",
      "./public/images/a2-splash.png",
    ]);
  });

  it("skips a record with no picture and still writes the records after it", () => {
    writeImages(
      [
        { _id: "p1", image: "data:image/jpeg;base64,QUJD" },
        { _id: "p2", image: null },
        { _id: "p3", image: "" },
        { _id: "p4", image: "data:image/png;base64,QUJD" },
      ],
      ["image"]
    );
    expect(written).to.deep.equal([
      "./public/images/p1-image.jpeg",
      "./public/images/p4-image.png",
    ]);
  });
});
