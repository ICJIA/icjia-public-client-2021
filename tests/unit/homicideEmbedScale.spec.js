/* eslint-env mocha */
// =============================================================================
// /homicide: the dashboard was cut off on the right in any window whose text
// column is under 1390 px (v1.5.114). The page lays the Tableau frame out at
// 1390 px, the size the dashboard is drawn at, and scales it to the column. But
// app.css caps a frame in .markdown-body at the width of its container
// (max-width: 100%, for frames in CMS text, WCAG 1.4.10), and the page is a
// .markdown-body: the frame was laid out at the column's width, so Tableau drew
// 1366 px of dashboard in a narrower window, and the scale then shrank that.
// The frame opts out of the cap.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const page = read("src/views/Homicide/Homicide.vue");
const frame = (page.match(/<iframe\b[\s\S]*?>/) || [])[0];

describe("/homicide: the dashboard scales to the column, whole", () => {
  it("is caught by the rule for frames in CMS text", () => {
    expect(page).to.match(/<div class="markdown-body\b/);
    expect(read("src/assets/app.css")).to.match(
      /\.markdown-body iframe,[\s\S]{0,80}?max-width:\s*100%/
    );
  });

  it("opts out of it, so the frame keeps the width the scale is worked out from", () => {
    expect(frame).to.match(/style="[^"]*max-width:\s*none/);
    expect(frame).to.include(':width="embedWidth"');
    expect(frame).to.include("transform-origin: top left");
  });
});
