/* eslint-env mocha */
// =============================================================================
// Links typed without a scheme (v1.5.91)
//
// An editor types [Euna](il.amplifund.com/Public/...) or links an email
// address to itself. The browser reads either as an address on this site:
// on the newest funding notice, two "Euna" links went to
// https://icjia.illinois.gov/il.amplifund.com/... A survey of the CMS found 15
// such links in about 1,065 records: 7 bare email addresses and 3 web
// addresses, which are repaired when the content is rendered (on the site and
// in the feeds), and 5 that cannot be (bare file names, a placeholder, a
// mistyped scheme), which are left as typed.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { repairHref, repairLinksInHtml } from "@/utils/linkRepair";
import { sanitizeContent } from "@/utils/contentSanitizer";

describe("repairHref()", () => {
  it("gives a web address typed without one its https://", () => {
    expect(
      repairHref("il.amplifund.com/Public/Opportunities/Details/0a95ac73")
    ).to.equal(
      "https://il.amplifund.com/Public/Opportunities/Details/0a95ac73"
    );
    expect(repairHref("ILGovAlliance.org")).to.equal(
      "https://ILGovAlliance.org"
    );
    expect(repairHref("www.icjia.state.il.us/research?x=1#top")).to.equal(
      "https://www.icjia.state.il.us/research?x=1#top"
    );
  });

  it("gives a bare email address its mailto:", () => {
    expect(repairHref("CJA.SACF@Illinois.gov")).to.equal(
      "mailto:CJA.SACF@Illinois.gov"
    );
  });

  it("leaves every other address as typed", () => {
    for (const href of [
      "https://il.amplifund.com/Public/",
      "http://example.com/",
      "mailto:cja.info@illinois.gov",
      "tel:+13127938550",
      "//cdn.example.com/x.js",
      "/grants/funding/",
      "#link-to-apply",
      "?page=2",
      "./notes.html",
      "../about/",
      // Found in the CMS and not repairable: where the file is, is not known.
      "CLEPDNOFOPacket.zip",
      "TechinicalAssistanceRecordingPPTSlides.DPA.pdf",
      "5ILCS820CLEPDSubstanceUseDisorderTreatmentAct.pdf",
      "link",
      "lhttps://r3.illinois.gov/",
      "report.final.docx",
      "",
    ]) {
      expect(repairHref(href), href).to.equal(href);
    }
    expect(repairHref(null)).to.equal(null);
  });
});

describe("repairLinksInHtml()", () => {
  it("repairs the links of a page and nothing else", () => {
    const html =
      '<p>Apply in <a href="il.amplifund.com/Public/x" target="_blank">Euna</a>, or write to ' +
      "<a class='mail' href='CJA.SACF@Illinois.gov'>CJA.SACF@Illinois.gov</a>. " +
      '<a href="/grants/">Grants</a> <img src="example.com/seal.png" alt=""> il.amplifund.com/Public/x</p>';
    expect(repairLinksInHtml(html)).to.equal(
      '<p>Apply in <a href="https://il.amplifund.com/Public/x" target="_blank">Euna</a>, or write to ' +
        "<a class='mail' href='mailto:CJA.SACF@Illinois.gov'>CJA.SACF@Illinois.gov</a>. " +
        '<a href="/grants/">Grants</a> <img src="example.com/seal.png" alt=""> il.amplifund.com/Public/x</p>'
    );
  });

  it("returns what it was given when there is nothing to repair", () => {
    expect(repairLinksInHtml("<p>No links.</p>")).to.equal("<p>No links.</p>");
    expect(repairLinksInHtml("")).to.equal("");
    expect(repairLinksInHtml(null)).to.equal(null);
  });
});

describe("Where the repair runs", () => {
  it("on the site: in the content pipeline, before links are judged broken", () => {
    expect(
      sanitizeContent('<p><a href="il.amplifund.com/Public/x">Euna</a></p>')
    ).to.include('href="https://il.amplifund.com/Public/x"');
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/utils/contentSanitizer.js"),
      "utf8"
    );
    const list = source.slice(
      source.indexOf("const htmlPlugins = ["),
      source.indexOf("const textPlugins")
    );
    expect(list.indexOf("repairLinksInHtml")).to.be.greaterThan(-1);
    expect(list.indexOf("repairLinksInHtml")).to.be.lessThan(
      list.indexOf("unwrapBrokenLinks")
    );
  });

  it("in the feeds: in the generators' markdown renderer", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "generators/utils/Markdown.mjs"),
      "utf8"
    );
    expect(source).to.include("repairLinksInHtml(md.render(markdown))");
  });
});
