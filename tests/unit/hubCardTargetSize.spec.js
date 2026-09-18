/* eslint-env mocha */
// =============================================================================
// Research Hub cards: the category buttons' touch target (v1.5.94)
//
// Lighthouse (WCAG 2.2 SC 2.5.8, Target Size, AA) scored the Hub's home and
// articles pages 96: the category buttons on the cards ("LAW ENFORCEMENT") are
// 15 px high, under the 24 px minimum. They are plain coloured text, with no
// background or border, so vertical padding on the inline box makes the target
// 25 px without moving a line or changing how the label looks.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";

describe("Hub card: category buttons are a 24 px target", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src/components/Hub/HubCard.vue"),
    "utf8"
  );
  const style = source.slice(source.lastIndexOf("<style"));

  it("pads the button, and only the button", () => {
    expect(style.replace(/\s+/g, " ")).to.match(
      /\.category\[role="button"\] \{ padding: 5px 0; \}/
    );
  });

  it("the label still has nothing the padding would show", () => {
    const rule = style.slice(
      style.indexOf(".category {"),
      style.indexOf("}", style.indexOf(".category {"))
    );
    expect(rule).to.not.match(/background|border/);
  });
});
