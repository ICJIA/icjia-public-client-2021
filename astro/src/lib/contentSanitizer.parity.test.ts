// SSR GO/NO-GO gate for the live-data migration.
//
// contentSanitizer.js (1,277 lines, 10 DOM-based plugins) runs in the browser
// on the legacy site. The migration runs it SERVER-SIDE per request. This suite
// proves that is safe by installing each DOM engine as the global `DOMParser`
// the plugins read at call time and asserting:
//
//   1. PRIMARY (objective): linkedom output === jsdom output (normalized) on
//      realistic CMS fixtures. jsdom is the browser-faithful reference, so a
//      match means server-side linkedom reproduces today's browser behavior.
//   2. It never throws server-side on combined real-world content.
//   3. A snapshot of the linkedom output (inspectable ground truth + regression
//      guard) and a few high-confidence correctness checks.
//
// If linkedom ever diverges from jsdom, swap server-dom.ts to jsdom (already a
// devDependency) — the production code path is unaffected.
import { describe, it, expect } from "vitest";
import { ServerDOMParser } from "./server-dom";
import { JSDOM } from "jsdom";
import { sanitizeContent, sanitizeText } from "./contentSanitizer";

const JsdomDOMParser = new JSDOM("").window.DOMParser;

// Install a DOMParser engine as the global the plugins read, run fn, restore.
function runWith(
  engine: unknown,
  fn: (s: string) => string,
  input: string,
): string {
  const g = globalThis as Record<string, unknown>;
  const prev = g.DOMParser;
  g.DOMParser = engine;
  try {
    return fn(input);
  } finally {
    g.DOMParser = prev;
  }
}

// The table plugins assign ids from a module-global counter (cmstbl<N>-h<M>).
// Only one engine runs in production, so the absolute number is irrelevant —
// what matters is that id/headers cross-references are internally consistent
// (which both engines produce). Strip the counter value for comparison.
function stripCounter(html: string): string {
  return (html || "").replace(/cmstbl\d+/g, "cmstbl#");
}

// Semantic-equality normalizer: collapse whitespace, join adjacent tags,
// normalize void self-closing, strip the table-id counter, and SORT attributes
// within each start tag. Attribute order has no effect on the parsed DOM,
// rendering, accessibility, or SiteImprove — linkedom and jsdom simply emit
// attributes in different orders. We compare the DOM the browser would build.
function normalize(html: string): string {
  let s = stripCounter(html)
    .replace(/\s+/g, " ")
    .replace(/> </g, "><")
    .replace(/\s*\/>/g, ">")
    .replace(/\s+>/g, ">")
    .trim();
  s = s.replace(
    /<([a-zA-Z][\w-]*)((?:\s+[^\s/>=]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)+)\s*>/g,
    (_m: string, tag: string, attrs: string) => {
      const parts = attrs.match(/[^\s/>=]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/g) || [];
      parts.sort();
      return `<${tag} ${parts.join(" ")}>`;
    },
  );
  return s;
}

// One fixture per DOM-based plugin path — realistic Strapi-authored HTML.
const FIXTURES: Record<string, string> = {
  simpleTableWithTh:
    "<table><thead><tr><th>Year</th><th>Arrests</th></tr></thead><tbody><tr><td>2020</td><td>1,234</td></tr><tr><td>2021</td><td>1,400</td></tr></tbody></table>",
  headerlessTable:
    "<table><tbody><tr><td>Program</td><td>Status</td></tr><tr><td>R3</td><td>Open</td></tr></tbody></table>",
  imageNoAlt: '<p>See chart:</p><p><img src="/uploads/chart.png" width="600"></p>',
  emptyContainers:
    "<p></p><div>   </div><p>Real paragraph.</p><span></span>",
  whiteText: '<p style="color:#ffffff">Hard to read on a white background.</p>',
  linkWrappingImage:
    '<a href="/uploads/report.pdf"><img src="/uploads/thumb.png"></a>',
  focusablePre: "<pre>const x = 1;\nconst y = 2;</pre>",
  invalidListChild: "<ul><div>stray</div><li>item one</li><li>item two</li></ul>",
  misspellingHtml: "<p>activites in Illiois for the Independant review.</p>",
};

describe("contentSanitizer — server-side parity (linkedom vs jsdom)", () => {
  for (const [name, html] of Object.entries(FIXTURES)) {
    it(`linkedom output matches jsdom for "${name}"`, () => {
      const viaLinkedom = runWith(ServerDOMParser, sanitizeContent, html);
      const viaJsdom = runWith(JsdomDOMParser, sanitizeContent, html);
      expect(normalize(viaLinkedom)).toBe(normalize(viaJsdom));
    });
  }

  it("does not throw on a combined real-world document (linkedom)", () => {
    const combined = Object.values(FIXTURES).join("\n");
    expect(() =>
      runWith(ServerDOMParser, sanitizeContent, combined),
    ).not.toThrow();
  });
});

describe("contentSanitizer — linkedom output ground truth (inspect snapshot)", () => {
  it("matches snapshot of every fixture's server-side output", () => {
    const out: Record<string, string> = {};
    for (const [name, html] of Object.entries(FIXTURES)) {
      out[name] = stripCounter(runWith(ServerDOMParser, sanitizeContent, html));
    }
    expect(out).toMatchSnapshot();
  });
});

describe("contentSanitizer — high-confidence correctness (linkedom)", () => {
  it("adds an alt attribute to an image missing one", () => {
    const out = runWith(ServerDOMParser, sanitizeContent, FIXTURES.imageNoAlt);
    expect(out).toMatch(/<img[^>]*\balt=/i);
  });

  it("preserves real content while cleaning empty containers", () => {
    const out = runWith(
      ServerDOMParser,
      sanitizeContent,
      FIXTURES.emptyContainers,
    );
    expect(out).toContain("Real paragraph.");
  });
});

describe("contentSanitizer — text pipeline (pure regex, no DOM)", () => {
  it("fixes known misspellings", () => {
    expect(sanitizeText("activites in Illiois")).toBe(
      "activities in Illinois",
    );
  });

  it("is a no-op on clean text", () => {
    expect(sanitizeText("A perfectly normal sentence.")).toBe(
      "A perfectly normal sentence.",
    );
  });
});
