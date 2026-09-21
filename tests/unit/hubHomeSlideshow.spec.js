/* eslint-env mocha */
// =============================================================================
// Research Hub home page, the slideshow of latest articles (v1.5.109).
//  - The "Pause slideshow" button had its bottom 8 px behind the photo: its row's
//    negative margin (-12 px) pulled the carousel over a column with 4 px of
//    padding. The button stays, as WCAG 2.2.2 (Pause, Stop, Hide) needs it for a
//    slideshow that advances by itself; it has room under it now.
//  - The authors' line sat on the title (margin-top: -10px, 5 px of overlap).
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/views/Hub/HubHome.vue"),
  "utf8"
);
const template = source.slice(0, source.indexOf("<script>"));
const slideshow = template.slice(template.indexOf('class="hub-slideshow"'));

describe("Research Hub home: the slideshow", () => {
  it("keeps its Pause button (WCAG 2.2.2)", () => {
    expect(slideshow).to.include("Pause slideshow");
    expect(slideshow).to.include("Play slideshow");
  });

  // The column's bottom padding has to be more than the 12 px its row's
  // negative margin takes back: pb-6 is 24 px, which leaves 12 px clear.
  it("gives the button room above the photo", () => {
    const column = slideshow
      .slice(0, slideshow.indexOf("Pause slideshow"))
      .match(/<v-col\b[^>]*>/g)
      .pop();
    expect(column).to.match(/class="[^"]*\bpb-6\b/);
    expect(column).to.not.match(/class="[^"]*\bpy-1\b/);
  });

  it("sets the authors' line below the title, not on it", () => {
    const authors = slideshow.slice(
      slideshow.lastIndexOf("<div", slideshow.indexOf("in article.authors"))
    );
    const block = slideshow
      .slice(0, slideshow.indexOf("in article.authors"))
      .match(/<div\b[^>]*>/g)
      .pop();
    expect(authors).to.include("author.title");
    expect(block).to.match(/margin-top:\s*\d+px/);
    expect(block).to.not.match(/margin-top:\s*-/);
  });
});
