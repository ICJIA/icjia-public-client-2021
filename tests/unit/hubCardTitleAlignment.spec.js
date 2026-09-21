/* eslint-env mocha */
// =============================================================================
// Research Hub cards: the titles of a row of cards line up (v1.5.111). The
// "NEW!" chip had a row of its own between the date and the title, which put a
// new card's title 36 px below its neighbours' ("Illinois Homicide Reporting"
// on /researchhub/apps and on the Hub's home page). The chip is out of the flow
// now, in the space above the date and the title, and moves nothing.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/components/Hub/HubCard.vue"),
  "utf8"
);
const template = source.slice(0, source.indexOf("<script>"));
const styles = source.slice(source.lastIndexOf("<style"));
const chip = (template.match(/<v-chip\b[^>]*isItNew[^>]*>/) || [])[0];

describe("Research Hub cards: the NEW chip does not move the title", () => {
  it("is still there, before the title", () => {
    expect(chip, "the NEW chip").to.be.a("string");
    expect(template.indexOf(chip)).to.be.below(template.indexOf("<h2"));
  });

  it("takes no room of its own", () => {
    expect(chip).to.match(/class="[^"]*\bhub-card-new\b/);
    // its old spacing, which made the row 36 px tall
    expect(chip).to.not.match(/\bmb-3\b/);
    const rule = styles.slice(styles.indexOf(".hub-card-new"));
    expect(styles).to.include(".hub-card-new");
    expect(rule.slice(0, rule.indexOf("}"))).to.match(/position:\s*absolute/);
  });
});
