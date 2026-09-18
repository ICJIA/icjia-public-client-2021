/* eslint-env mocha */
// =============================================================================
// A meeting page's "Attachments" heading (v1.5.94)
//
// On a meeting's own page the card's title is the page's h1, and the attachment
// list under it rendered its heading as an h3: a skipped level (axe
// heading-order) until the runtime accessibility pass re-levelled it about a
// second later. axecap, run as the page appears, reported it on every run. The
// card knows where it is (titleTag), so the heading follows the title: h2 under
// an h1, h3 under the h2 of a card in the meetings list.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";

describe("Meeting card: the attachments heading follows the title", () => {
  const template = fs
    .readFileSync(
      path.join(process.cwd(), "src/components/MeetingCard.vue"),
      "utf8"
    )
    .split("<script>")[0]
    .replace(/\s+/g, " ");

  it("is a second-level heading when the title is the page's h1", () => {
    expect(template).to.match(
      /<AttachmentList[^>]*:headingTag="titleTag === 'h1' \? 'h2' : 'h3'"/
    );
  });

  // The plain h2 of useSecondLevelHeading looks different (a large heading);
  // only the level of the small uppercase label changes, not how it looks.
  it("keeps the label's look: the list takes the level, not another heading", () => {
    const list = fs
      .readFileSync(
        path.join(process.cwd(), "src/components/AttachmentList.vue"),
        "utf8"
      )
      .replace(/\s+/g, " ");
    expect(list).to.match(
      /<component :is="headingTag" v-if="!useSecondLevelHeading" style="[^"]*text-transform: uppercase/
    );
    expect(list).to.match(/headingTag: \{ type: String, default: "h3"/);
    expect(template).to.not.include("useSecondLevelHeading");
  });
});
