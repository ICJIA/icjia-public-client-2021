/* eslint-env mocha */
// =============================================================================
// Research Hub home page, the slideshow of latest articles (v1.5.109).
//  - The "Pause slideshow" button had its bottom 8 px behind the photo: its row's
//    negative margin (-12 px) pulled the carousel over a column with 4 px of
//    padding. The button stays, as WCAG 2.2.2 (Pause, Stop, Hide) needs it for a
//    slideshow that advances by itself; it has room under it now.
//  - The authors' line sat on the title (margin-top: -10px, 5 px of overlap).
//  - v1.5.110: the photos are in full colour. A scrim dimmed the whole photo by
//    70 % so that the white text on it could be read; the text sits in a dark
//    band along the bottom instead. With no backing at all, white text could be
//    read on one of the five photos of the day (contrast 1.8 to 2.9:1 on the
//    other four).
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

  it("shows the photo in full colour: nothing dims it", () => {
    const overlays = slideshow.match(/<v-overlay\b[^>]*>/g) || [];
    expect(overlays.length).to.equal(1);
    expect(overlays[0]).to.include(':opacity="0"');
    expect(overlays[0]).to.match(/class="[^"]*\bhub-slide-caption\b/);
  });

  // At 36 px a title filled a phone's slide: 6 to 8 lines, a band over 63 to
  // 80 % of the photo, and under the arrows at mid-height.
  it("makes the title smaller on a small screen, so the band stays low", () => {
    const heading = slideshow.match(/<p\b[^>]*role="heading"[^>]*>/)[0];
    expect(heading).to.match(/class="[^"]*\bhub-slide-title\b/);
    expect(heading).to.not.match(/font-size/);
    const styles = source.slice(source.lastIndexOf("<style"));
    const sizes = [
      ...styles.matchAll(/\.hub-slide-title\s*{[^}]*?font-size:\s*(\d+)px/g),
    ].map((m) => Number(m[1]));
    expect(sizes[0]).to.equal(36);
    expect(Math.min(...sizes)).to.be.at.most(24);
    expect(styles).to.match(/@media \(max-width: 599px\)/);
  });

  // White text has to be readable whatever the photo: the band's colour is
  // worked out over a white photo, the worst there is, and has to give white
  // text 7:1 (WCAG 1.4.6; 1.4.3 asks 4.5:1 of the date and the authors).
  it("sets the text in a band along the bottom, dark enough on any photo", () => {
    const styles = source.slice(source.lastIndexOf("<style"));
    const rule = styles.slice(styles.indexOf(".hub-slide-caption"));
    expect(rule).to.match(/align-items:\s*flex-end/);
    const rgba = rule.match(
      /background:\s*rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)/
    );
    expect(rgba, "the band's background").to.not.equal(null);
    const alpha = Number(rgba[4]);
    const linear = (v) =>
      v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4;
    const [r, g, b] = [rgba[1], rgba[2], rgba[3]].map(
      (v) => alpha * Number(v) + (1 - alpha) * 255
    );
    const luminance =
      0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
    expect(1.05 / (luminance + 0.05)).to.be.at.least(7);
  });
});
