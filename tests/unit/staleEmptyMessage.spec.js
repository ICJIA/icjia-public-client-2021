/* eslint-env mocha */
// =============================================================================
// "No current funding opportunities." stayed above the expired list (v1.5.106)
// On /grants/funding the message for an empty list was an <h3> after the
// page's <h1>. The accessibility pass that runs after a page opens
// (fixHeadingOrder, src/a11y) puts a heading that skips a level right by
// REPLACING the element, inside any .markdown-body, which the page is. The
// <h2> it put there was not Vue's: a click on "Expired" removed Vue's own <h3>,
// already out of the page, and the <h2> stayed above the 110 expired
// opportunities, still saying "No current". A heading Vue shows and hides must
// be at the right level in its template, so that the pass leaves it alone.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { fixHeadingOrder } from "@/a11y";

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("The accessibility pass and a heading that Vue shows and hides", () => {
  let holder;
  beforeEach(() => {
    holder = document.createElement("div");
    holder.className = "markdown-body";
    document.body.appendChild(holder);
  });
  afterEach(() => holder.remove());

  it("replaces a heading that skips a level: the page's own element leaves the page", () => {
    holder.innerHTML = "<h1>Funding Opportunities</h1><h3>No current</h3>";
    const own = holder.querySelector("h3");
    fixHeadingOrder();
    expect(own.isConnected).to.equal(false);
    expect(holder.querySelector("h2").textContent).to.equal("No current");
  });

  it("leaves a heading at the right level alone", () => {
    holder.innerHTML = "<h1>Funding Opportunities</h1><h2>No current</h2>";
    const own = holder.querySelector("h2");
    fixHeadingOrder();
    expect(own.isConnected).to.equal(true);
    expect(holder.querySelector("h2")).to.equal(own);
  });
});

describe("The message for an empty list of funding opportunities", () => {
  // /grants/funding, which /grants redirects to.
  it("is a heading of the level after the page's own", () => {
    const source = read("src/views/Grants/FundingAll.vue");
    const template = source.slice(0, source.indexOf("<script>"));
    expect(template).to.match(/<div class="[^"]*\bmarkdown-body\b/);
    expect(template).to.match(/<h1\b/);
    const message = template.match(
      /<(h[1-6])\b[^>]*v-if="filteredAndSortedGrants\.length === 0"[^>]*>\s*No [^<]*funding opportunities\.\s*<\/\1>/
    );
    expect(message, "the message").to.not.equal(null);
    expect(message[1]).to.equal("h2");
  });
});
