import { describe, it, expect } from "vitest";
import { renderToHtml } from "./markdown.js";

// Guards the fixCmsLinkText pass (Lighthouse SEO "link-text" / WCAG 2.4.4): CMS
// "here"/"read more"/etc. links get a descriptive accessible name derived from the
// href, PREFIXED with the visible text (so it survives fixLabelInName + has no
// label-in-name mismatch). Visible text is never changed.
describe("fixCmsLinkText", () => {
  it("labels a bare 'here' link to a PDF (filename + ext, Strapi hash stripped)", () => {
    const html = renderToHtml(
      "Read the plan [here](https://researchhub.icjia-api.cloud/uploads/JAG%202024-29%20FINAL%20DRAFT%208-2024-240808T19411840.pdf).",
    );
    expect(html).toContain('aria-label="here — JAG 2024-29 FINAL DRAFT 8-2024 (PDF)"');
    expect(html).toContain(">here</a>"); // visible text unchanged
  });

  it("labels a 'click here' link to a page (humanized slug)", () => {
    const html = renderToHtml("File a request, [click here](/about/foia/).");
    expect(html).toContain('aria-label="click here — foia"');
  });

  it("leaves a descriptive link untouched (no aria-label added)", () => {
    const html = renderToHtml("See [the FY24 strategic plan](/grants/programs/jag/).");
    expect(html).not.toContain("aria-label");
  });

  it("leaves a bare-URL link alone (Lighthouse doesn't flag those)", () => {
    const html = renderToHtml("Visit [https://r3.illinois.gov](https://r3.illinois.gov).");
    expect(html).not.toContain("aria-label");
  });

  it("the prefixed label survives fixLabelInName (contains the visible text)", () => {
    const html = renderToHtml("Details [here](/news/annual-report-2024/).");
    // aria-label must start with the visible text so fixLabelInName keeps it
    const m = html.match(/aria-label="([^"]*)"/);
    expect(m).toBeTruthy();
    expect(m![1].toLowerCase()).toContain("here");
  });
});
