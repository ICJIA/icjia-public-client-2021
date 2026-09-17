/* eslint-env mocha */
// =============================================================================
// Chips keep their text visible
// app.css standardizes every chip to black text on a white fill with a dark
// border (v1.5.9, WCAG 1.4.3), overriding any `color` a template gives the
// chip. A chip that also paints its own text white therefore renders white
// on white: the "NEW!" chip on the homepage Employment tab showed as an
// empty box (v1.5.79). A chip may only use white text when it opts out of
// the standardization with text-color="white" (the .white--text hook).
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";

const roots = ["src/components", "src/views"].map((d) =>
  path.join(process.cwd(), d)
);

function vueFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return vueFiles(full);
    return entry.name.endsWith(".vue") ? [full] : [];
  });
}

const stripComments = (html) => html.replace(/<!--[\s\S]*?-->/g, "");
const whiteText = /color:\s*(#fff(?:fff)?|white)\s*!important/i;

describe("Chips keep their text visible", () => {
  const offenders = [];
  for (const file of roots.flatMap(vueFiles)) {
    const source = stripComments(fs.readFileSync(file, "utf8"));
    const chips = source.match(/<v-chip\b[\s\S]*?<\/v-chip\s*>/g) || [];
    for (const chip of chips) {
      const optsOut = /text-color="white"/.test(chip);
      if (whiteText.test(chip) && !optsOut) {
        offenders.push(path.relative(process.cwd(), file));
      }
    }
  }

  it("no chip paints its text white without opting out of the black-on-white standard", () => {
    expect(
      offenders,
      `white text inside a standard chip in: ${offenders.join(", ")}`
    ).to.deep.equal([]);
  });
});
