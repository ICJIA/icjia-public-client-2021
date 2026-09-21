/* eslint-env mocha */
// =============================================================================
// The front page's Funding, Meetings and Employment lists end with a button to
// the full list (v1.5.105), as the news list does ("Browse the news archive").
// The lists show the latest few items, and nothing under them led to the rest.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";

const tabs = fs.readFileSync(
  path.join(process.cwd(), "src/components/HomeTabbed.vue"),
  "utf8"
);
const template = tabs.slice(0, tabs.indexOf("<script>"));
// The three lists, in the order of their tabs.
const lists = template.split("<v-tab-item").slice(1);
const buttonIn = (list) =>
  (list.match(/<v-btn\b[\s\S]*?<\/v-btn\s*>/g) || []).filter((b) =>
    /class="[^"]*\bhome-browse-btn\b/.test(b)
  );

describe("Front page: a button to the full list under each tabbed list", () => {
  const expected = [
    ["Funding", "/grants/funding/", "Browse all funding"],
    ["Meetings", "/news/meetings/", "Browse all meetings"],
    ["Employment", "/about/employment/", "Browse all employment"],
  ];

  // Each label is "Browse all" and the name of its tab, and short: at 320 px
  // the lists' text is 256 px wide, and "Browse employment opportunities" made
  // a button of 312 px, "Browse funding opportunities" one of 282 px, wider
  // than the text above them. A label of 21 letters makes one of about 230 px.
  it("keeps the labels short enough for a phone", () => {
    expected.forEach(([, , label]) =>
      expect(label.length, label).to.be.at.most(21)
    );
  });

  it("has three lists", () => {
    expect(lists.length).to.equal(3);
  });

  expected.forEach(([name, address, label], index) => {
    // The addresses are the ones the site's menus use.
    it(`ends the ${name} list with a button to ${address}`, () => {
      const buttons = buttonIn(lists[index]);
      expect(buttons.length).to.equal(1);
      const button = buttons[0];
      expect(button).to.include(`to="${address}"`);
      expect(button.replace(/\s+/g, " ")).to.include(`>${label}<v-icon`);
      expect(button).to.include("mdi-arrow-right");
      // the look of "Browse the news archive" (Home.vue)
      expect(button).to.include('color="#0d4474"');
      expect(button).to.match(/\bdark\b/);
      expect(button).to.match(/\bsmall\b/);
      // after the list's rows
      expect(lists[index].indexOf(button)).to.be.above(
        lists[index].lastIndexOf("title-link-card")
      );
    });
  });

  // A v-btn with `to` is a link, and app.css paints every hovered link black
  // (a:hover, !important): on the navy button the label went to 2.1:1 and
  // read as vanishing (fixed for the news button in v1.5.55). The same rule
  // holds the label white here.
  it("keeps the label white under the pointer", () => {
    const css = tabs.slice(tabs.lastIndexOf("<style"));
    expect(css).to.match(
      /\.home-browse-btn:hover\s*\{\s*background-color: #092f51 !important;\s*color: #fff !important;/
    );
    expect(css).to.match(
      /\.home-browse-btn:hover \.v-icon\s*\{\s*color: #fff !important;/
    );
  });
});
