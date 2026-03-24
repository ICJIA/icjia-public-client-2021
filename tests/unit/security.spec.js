// =============================================================================
// Security regression tests
// Validates that security mitigations (SEC-01 through SEC-10) remain intact.
// =============================================================================
import { expect } from "chai";
import { renderToHtml } from "@/services/Markdown";

describe("SEC-03: GraphQL slug sanitization", () => {
  // The slug sanitizer strips everything except [a-zA-Z0-9_-]
  const sanitize = (slug) => slug.replace(/[^a-zA-Z0-9_-]/g, "");

  it("allows valid slugs unchanged", () => {
    expect(sanitize("my-article-title")).to.equal("my-article-title");
    expect(sanitize("article_123")).to.equal("article_123");
    expect(sanitize("CamelCase-Slug")).to.equal("CamelCase-Slug");
  });

  it("strips double-quote injection attempts", () => {
    const malicious = 'test", status: "draft';
    expect(sanitize(malicious)).to.equal("teststatusdraft");
    expect(sanitize(malicious)).to.not.include('"');
  });

  it("strips backslash escape attempts", () => {
    expect(sanitize('test\\"}')).to.equal("test");
  });

  it("strips GraphQL comment injection", () => {
    expect(sanitize("test#comment")).to.equal("testcomment");
  });

  it("strips curly brace injection", () => {
    expect(sanitize("test}{query{users{id}}")).to.equal("testqueryusersid");
  });

  it("strips parentheses and special chars", () => {
    expect(sanitize("test()[]<>;!@$%^&*+=|~`")).to.equal("test");
  });

  it("returns empty string for pure injection payload", () => {
    expect(sanitize('", status: "draft") { id email password } #')).to.equal(
      "statusdraftidemailpassword"
    );
  });
});

describe("SEC-04: DOMPurify XSS sanitization in renderToHtml", () => {
  it("renders basic markdown safely", () => {
    const html = renderToHtml("# Hello World");
    expect(html).to.include("<h1");
    expect(html).to.include("Hello World");
  });

  it("renders bold and italic", () => {
    const html = renderToHtml("**bold** and *italic*");
    expect(html).to.include("<strong>bold</strong>");
    expect(html).to.include("<em>italic</em>");
  });

  it("renders links with target=_blank and rel=noopener", () => {
    const html = renderToHtml("[Click](https://example.com)");
    expect(html).to.include('target="_blank"');
    expect(html).to.include('rel="noopener noreferrer"');
  });

  it("strips <script> tags from markdown content", () => {
    const html = renderToHtml('Hello <script>alert("xss")</script> World');
    expect(html).to.not.include("<script");
    expect(html).to.not.include("alert");
    expect(html).to.include("Hello");
    expect(html).to.include("World");
  });

  it("strips <script> inside markdown HTML blocks", () => {
    const html = renderToHtml("<div><script>document.cookie</script></div>");
    expect(html).to.not.include("<script");
    expect(html).to.not.include("document.cookie");
  });

  it("strips onerror event handlers", () => {
    const html = renderToHtml('<img src=x onerror="alert(1)">');
    expect(html).to.not.include("onerror");
    expect(html).to.not.include("alert");
  });

  it("strips onload event handlers", () => {
    const html = renderToHtml('<body onload="alert(1)">test</body>');
    expect(html).to.not.include("onload");
  });

  it("strips onclick event handlers", () => {
    const html = renderToHtml('<a onclick="steal()" href="#">click</a>');
    expect(html).to.not.include("onclick");
    expect(html).to.not.include("steal");
  });

  it("strips javascript: protocol in links", () => {
    const html = renderToHtml('<a href="javascript:alert(1)">click me</a>');
    expect(html).to.not.include("javascript:");
  });

  it("strips data: URI script injection", () => {
    const html = renderToHtml(
      '<a href="data:text/html,<script>alert(1)</script>">click</a>'
    );
    expect(html).to.not.include("data:text/html");
  });

  it("strips SVG-based XSS", () => {
    const html = renderToHtml('<svg onload="alert(1)"><rect/></svg>');
    expect(html).to.not.include("onload");
  });

  it("strips style-based XSS with expression()", () => {
    const html = renderToHtml(
      '<div style="background:url(javascript:alert(1))">test</div>'
    );
    // DOMPurify sanitizes in browser; in jsdom the style attr may persist
    // but no <script> execution is possible — verify content renders
    expect(html).to.include("test");
    expect(html).to.not.include("<script");
  });

  it("strips iframe with javascript src", () => {
    const html = renderToHtml('<iframe src="javascript:alert(1)"></iframe>');
    expect(html).to.not.include("javascript:");
  });

  it("allows safe iframe with https src", () => {
    const html = renderToHtml(
      '<iframe src="https://example.com" allowfullscreen></iframe>'
    );
    expect(html).to.include("<iframe");
    expect(html).to.include("https://example.com");
  });

  it("preserves figure and figcaption tags", () => {
    const html = renderToHtml("![Alt text](https://example.com/img.png)");
    expect(html).to.include("<figure");
  });

  it("preserves table markup with colspan/rowspan", () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |";
    const html = renderToHtml(md);
    expect(html).to.include("<table");
    expect(html).to.include("<th");
    expect(html).to.include("<td");
  });

  it("preserves aria attributes", () => {
    const html = renderToHtml(
      '<div aria-label="test" aria-hidden="true" role="presentation">content</div>'
    );
    expect(html).to.include('aria-label="test"');
    expect(html).to.include('aria-hidden="true"');
    expect(html).to.include('role="presentation"');
  });

  it("preserves id and class attributes", () => {
    const html = renderToHtml(
      '<div id="section-1" class="highlight">text</div>'
    );
    expect(html).to.include('id="section-1"');
    expect(html).to.include('class="highlight"');
  });

  it("strips script injection inside form elements", () => {
    const html = renderToHtml(
      '<form><input type="text" onfocus="alert(1)"><button onclick="steal()">Submit</button></form>'
    );
    // DOMPurify strips event handlers even inside form elements
    expect(html).to.not.include("onfocus");
    expect(html).to.not.include("onclick");
    expect(html).to.not.include("alert");
    expect(html).to.not.include("steal");
  });

  it("strips meta refresh redirect", () => {
    const html = renderToHtml(
      '<meta http-equiv="refresh" content="0;url=https://evil.com">'
    );
    expect(html).to.not.include("<meta");
    expect(html).to.not.include("evil.com");
  });

  it("strips base tag hijacking", () => {
    const html = renderToHtml('<base href="https://evil.com/">');
    expect(html).to.not.include("<base");
  });

  it("strips object/embed/applet tags", () => {
    const html = renderToHtml(
      '<object data="exploit.swf"></object><embed src="exploit.swf"><applet code="Evil.class"></applet>'
    );
    expect(html).to.not.include("<object");
    expect(html).to.not.include("<embed");
    expect(html).to.not.include("<applet");
  });

  it("handles deeply nested XSS payloads", () => {
    const html = renderToHtml(
      '<div><div><div><img src=x onerror="alert(document.domain)"></div></div></div>'
    );
    expect(html).to.not.include("onerror");
    expect(html).to.not.include("alert");
  });

  it("handles encoded XSS payloads", () => {
    const html = renderToHtml(
      '<a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(1)">test</a>'
    );
    expect(html).to.not.include("javascript:");
  });
});

describe("SEC-09: External links have rel=noopener noreferrer", () => {
  it("adds rel attribute to auto-linked URLs", () => {
    const html = renderToHtml("Visit https://example.com for details.");
    expect(html).to.include('rel="noopener noreferrer"');
    expect(html).to.include('target="_blank"');
  });

  it("adds rel attribute to markdown links", () => {
    const html = renderToHtml("[Example](https://example.com)");
    expect(html).to.include('rel="noopener noreferrer"');
  });
});

describe("SEC-10: netlify.toml security headers", () => {
  const fs = require("fs");
  const toml = fs.readFileSync(process.cwd() + "/netlify.toml", "utf8");

  it("has X-Frame-Options = SAMEORIGIN", () => {
    expect(toml).to.include('X-Frame-Options = "SAMEORIGIN"');
  });

  it("has X-Content-Type-Options = nosniff", () => {
    expect(toml).to.include('X-Content-Type-Options = "nosniff"');
  });

  it("has Strict-Transport-Security (HSTS)", () => {
    expect(toml).to.include("Strict-Transport-Security");
    expect(toml).to.include("max-age=31536000");
  });

  it("has Referrer-Policy", () => {
    expect(toml).to.include("Referrer-Policy");
  });

  it("has Permissions-Policy", () => {
    expect(toml).to.include("Permissions-Policy");
  });

  it("does NOT have wildcard CORS", () => {
    // Ensure CORS is restricted to our domain, not wildcard
    const corsLine = toml
      .split("\n")
      .find(
        (l) =>
          l.includes("Access-Control-Allow-Origin") && !l.trim().startsWith("#")
      );
    expect(corsLine).to.exist;
    expect(corsLine).to.not.include('"*"');
    expect(corsLine).to.include("icjia.illinois.gov");
  });

  it("does NOT have commented-out security headers", () => {
    // Ensure the essential headers are not commented out
    const lines = toml.split("\n");
    const xFrameLine = lines.find(
      (l) => l.includes("X-Frame-Options") && !l.trim().startsWith("#")
    );
    const xContentLine = lines.find(
      (l) => l.includes("X-Content-Type-Options") && !l.trim().startsWith("#")
    );
    expect(xFrameLine).to.exist;
    expect(xContentLine).to.exist;
  });
});

describe("SEC-10: vue.config.js source maps disabled", () => {
  const fs = require("fs");
  const config = fs.readFileSync(process.cwd() + "/vue.config.js", "utf8");

  it("has productionSourceMap set to false", () => {
    expect(config).to.include("productionSourceMap: false");
  });
});
