/* eslint-env mocha */
// =============================================================================
// A link to the page it is on keeps its own colour
// vue-router gives such a link the class router-link-exact-active. The footer
// painted it white and heavy, for its dark ground, with a rule for that class
// alone, in a style block that is not scoped (2021): the rule reached every
// link on the site. After a click on a result's tag the search is that tag's
// own link, so the tag's chips were white on their grey (1.13:1 on the hit
// yellow of v1.5.99), and after a click on a result's type ("PUBLICATION")
// every such label on the page was white on white (fixed v1.5.102). A rule for
// the router's active classes says where it applies.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";

const roots = ["src/components", "src/views", "src/assets"].map((d) =>
  path.join(process.cwd(), d)
);

function styleFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return styleFiles(full);
    return /\.(vue|css)$/.test(entry.name) ? [full] : [];
  });
}

// The CSS of a file that reaches the whole site: a stylesheet, or a
// component's style blocks that are not scoped.
function siteWideCss(file) {
  const source = fs.readFileSync(file, "utf8");
  if (file.endsWith(".css")) return source;
  const blocks = source.match(/<style\b[^>]*>[\s\S]*?<\/style>/g) || [];
  return blocks
    .filter((block) => !/^<style\b[^>]*\bscoped\b/.test(block))
    .map((block) => block.replace(/^<style\b[^>]*>|<\/style>$/g, ""))
    .join("\n");
}

const bareActiveClass = /^a?\.router-link(-exact)?-active(:[a-z-]+)*$/;

describe("A link to the page it is on keeps its own colour", () => {
  it("has no site-wide rule for the router's active classes alone", () => {
    const offenders = [];
    for (const file of roots.flatMap(styleFiles)) {
      const css = siteWideCss(file).replace(/\/\*[\s\S]*?\*\//g, "");
      for (const rule of css.match(/[^{}]+(?=\{)/g) || []) {
        const bare = rule
          .split(",")
          .map((selector) => selector.trim())
          .filter((selector) => bareActiveClass.test(selector));
        if (bare.length) {
          offenders.push(`${path.relative(process.cwd(), file)}: ${bare[0]}`);
        }
      }
    }
    expect(offenders).to.deep.equal([]);
  });

  it("keeps the footer's rule, for the footer", () => {
    const footer = siteWideCss(
      path.join(process.cwd(), "src/components/AppFooter.vue")
    );
    expect(footer).to.match(
      /\.v-footer \.router-link-exact-active\s*\{\s*color: #fff !important;\s*font-weight: 900;/
    );
  });
});
