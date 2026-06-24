// =============================================================================
// Markdown rendering tests
// Validates that markdown-it + DOMPurify pipeline produces correct output.
// =============================================================================
import { expect } from "chai";
import { renderToHtml } from "@/services/Markdown";

describe("Markdown rendering — headings", () => {
  it("renders h1 through h6", () => {
    for (let i = 1; i <= 6; i++) {
      const prefix = "#".repeat(i);
      const html = renderToHtml(`${prefix} Heading ${i}`);
      expect(html).to.include(`<h${i}`);
      expect(html).to.include(`Heading ${i}`);
    }
  });

  it("generates anchor IDs for h2 headings", () => {
    const html = renderToHtml("## My Section Title");
    expect(html).to.include('id="my-section-title"');
  });

  it("slugifies anchor IDs correctly", () => {
    const html = renderToHtml("## Special (Characters) & More!");
    // Should strip non-alphanumeric except hyphens and underscores
    expect(html).to.include('id="special-characters--more"');
  });
});

describe("Markdown rendering — inline formatting", () => {
  it("renders bold text", () => {
    expect(renderToHtml("**bold**")).to.include("<strong>bold</strong>");
  });

  it("renders italic text", () => {
    expect(renderToHtml("*italic*")).to.include("<em>italic</em>");
  });

  it("renders inline code", () => {
    expect(renderToHtml("`code`")).to.include("<code>code</code>");
  });

  it("renders strikethrough (if supported)", () => {
    const html = renderToHtml("~~strikethrough~~");
    // markdown-it doesn't enable strikethrough by default, but check it doesn't break
    expect(html).to.be.a("string");
  });
});

describe("Markdown rendering — links", () => {
  it("renders markdown links", () => {
    const html = renderToHtml("[ICJIA](https://icjia.illinois.gov)");
    expect(html).to.include("<a");
    expect(html).to.include("https://icjia.illinois.gov");
    expect(html).to.include("ICJIA");
  });

  it("adds target=_blank to all links", () => {
    const html = renderToHtml("[Test](https://example.com)");
    expect(html).to.include('target="_blank"');
  });

  it("adds rel=noopener noreferrer to all links", () => {
    const html = renderToHtml("[Test](https://example.com)");
    expect(html).to.include('rel="noopener noreferrer"');
  });

  it("auto-links bare URLs", () => {
    const html = renderToHtml("Visit https://example.com today.");
    expect(html).to.include("<a");
    expect(html).to.include("https://example.com");
  });
});

describe("Markdown rendering — lists", () => {
  it("renders unordered lists", () => {
    const html = renderToHtml("- item 1\n- item 2\n- item 3");
    expect(html).to.include("<ul>");
    expect(html).to.include("<li>");
    expect(html).to.include("item 1");
  });

  it("renders ordered lists", () => {
    const html = renderToHtml("1. first\n2. second\n3. third");
    expect(html).to.include("<ol>");
    expect(html).to.include("<li>");
  });
});

describe("Markdown rendering — tables", () => {
  it("renders basic tables", () => {
    const md = "| Col A | Col B |\n|---|---|\n| val 1 | val 2 |";
    const html = renderToHtml(md);
    expect(html).to.include("<table>");
    expect(html).to.include("<thead>");
    expect(html).to.include("<tbody>");
    expect(html).to.match(/<th[^>]*scope="col"[^>]*>Col A<\/th>/);
    // The first data cell is promoted to <th scope="row"> by fixCmsTables,
    // so the value "val 1" ends up inside a <th>, not a <td>.
    expect(html).to.match(/<th[^>]*scope="row"[^>]*>val 1<\/th>/);
  });

  it("supports multiline table cells", () => {
    // markdown-it-multimd-table is enabled
    const md = "| Col A | Col B |\n|---|---|\n| line1\\nline2 | val |";
    const html = renderToHtml(md);
    expect(html).to.include("<table>");
  });
});

describe("Markdown rendering — blockquotes and code blocks", () => {
  it("renders blockquotes", () => {
    const html = renderToHtml("> This is a quote");
    expect(html).to.include("<blockquote>");
    expect(html).to.include("This is a quote");
  });

  it("renders fenced code blocks", () => {
    const html = renderToHtml("```\nconst x = 1;\n```");
    expect(html).to.match(/<pre[^>]*>/);
    expect(html).to.include("<code>");
    expect(html).to.include("const x = 1;");
  });

  it("renders code blocks with language class", () => {
    const html = renderToHtml("```javascript\nconst x = 1;\n```");
    expect(html).to.include('class="language-javascript"');
  });
});

describe("Markdown rendering — footnotes", () => {
  it("renders footnote references", () => {
    const md = "Text with a footnote[^1].\n\n[^1]: This is the footnote.";
    const html = renderToHtml(md);
    expect(html).to.include("footnote");
  });
});

describe("Markdown rendering — images and figures", () => {
  it("renders images inside figure elements", () => {
    const html = renderToHtml("![Alt text](https://example.com/img.png)");
    expect(html).to.include("<figure");
    expect(html).to.include("<img");
    expect(html).to.include("https://example.com/img.png");
  });

  it("preserves alt text on images", () => {
    const html = renderToHtml("![My description](https://example.com/img.png)");
    expect(html).to.include('alt="My description"');
  });
});

describe("Markdown rendering — typographer", () => {
  it("converts straight quotes to curly quotes", () => {
    const html = renderToHtml('"Hello"');
    // Typographer should convert to smart quotes
    expect(html).to.include("\u201C"); // left double quote
    expect(html).to.include("\u201D"); // right double quote
  });

  it("converts double dashes to em dash", () => {
    const html = renderToHtml("word -- word");
    expect(html).to.include("\u2013"); // en dash or em dash
  });
});

describe("Markdown rendering — empty/edge cases", () => {
  it("handles empty string", () => {
    const html = renderToHtml("");
    expect(html).to.be.a("string");
    expect(html.trim()).to.equal("");
  });

  it("handles whitespace-only string", () => {
    const html = renderToHtml("   \n\n   ");
    expect(html).to.be.a("string");
  });

  it("handles very long content", () => {
    const long = "word ".repeat(10000);
    const html = renderToHtml(long);
    expect(html).to.include("word");
  });

  it("handles unicode content", () => {
    const html = renderToHtml("# 日本語テスト — Ñoño — Ελληνικά");
    expect(html).to.include("日本語テスト");
    expect(html).to.include("Ñoño");
  });
});
