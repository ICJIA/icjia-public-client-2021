/* Per-page copies of index.html for hand-built pages.
 *
 * The site is a single-page app: without JavaScript every address serves the
 * same index.html. Google runs the scripts, but link previews (LinkedIn,
 * Facebook, Teams, Slack) and crawlers that do not (Bing, DuckDuckGo, AI
 * assistants) saw the homepage's title, description and canonical address for
 * every page. After the build, this writes dist/<path>/index.html for each page
 * in ./manualPages.js: the same app shell with that page's own head tags and,
 * where the page declares a dataset, schema.org Dataset markup. Netlify serves a
 * real file before the single-page fallback, so the address loads the app as
 * before, with the right head from the first byte.
 *
 * Runs from "postbuild" (package.json). It throws when index.html no longer has
 * a tag it must replace: a silent miss would publish the homepage's tags again.
 */
const fs = require("fs");
const path = require("path");

const SITE = "https://icjia.illinois.gov";
const ORG = {
  "@type": "GovernmentOrganization",
  name: "Illinois Criminal Justice Information Authority",
  url: `${SITE}/`,
};
const FORMATS = {
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv",
  ".pdf": "application/pdf",
};

const escapeAttr = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// Replace exactly one tag, or stop the build.
function replaceOnce(html, pattern, replacement, label) {
  const matches = html.match(new RegExp(pattern.source, "gi")) || [];
  if (matches.length !== 1) {
    throw new Error(
      `generatePageShells: expected one ${label} tag in index.html, found ${matches.length}`
    );
  }
  return html.replace(new RegExp(pattern.source, "i"), replacement);
}

function datasetJsonLd(page, files) {
  const url = `${SITE}${page.fullPath}`;
  const distribution = files
    .filter((file) => FORMATS[path.extname(file).toLowerCase()])
    .sort()
    .map((file) => ({
      "@type": "DataDownload",
      encodingFormat: FORMATS[path.extname(file).toLowerCase()],
      contentUrl: `${url}${file}`,
    }));
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: page.shell.dataset.name,
    description: page.summary || page.shell.description,
    url,
    keywords: page.tags || [],
    creator: ORG,
    publisher: ORG,
    isAccessibleForFree: true,
    spatialCoverage: { "@type": "Place", name: "Illinois, United States" },
    temporalCoverage: page.shell.dataset.temporalCoverage,
    distribution,
  };
}

function renderShell(html, page, files = []) {
  const { title, socialTitle, description, dataset } = page.shell;
  const url = `${SITE}${page.fullPath}`;
  const meta = (attr, key, content) => [
    new RegExp(`<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*/?>`),
    `<meta ${attr}="${key}" content="${escapeAttr(content)}"/>`,
    key,
  ];
  const edits = [
    [/<title>[^<]*<\/title>/, `<title>${escapeAttr(title)}</title>`, "title"],
    [
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
      `<link rel="canonical" href="${url}"/>`,
      "canonical",
    ],
    meta("name", "description", description),
    meta("property", "og:title", socialTitle || title),
    meta("property", "og:description", description),
    meta("property", "og:url", url),
    meta("name", "twitter:title", socialTitle || title),
    meta("name", "twitter:description", description),
  ];
  let out = html;
  for (const [pattern, replacement, label] of edits) {
    out = replaceOnce(out, pattern, replacement, label);
  }
  if (dataset) {
    const json = JSON.stringify(datasetJsonLd(page, files)).replace(
      /</g,
      "\\u003c"
    );
    out = replaceOnce(
      out,
      /<\/head>/,
      `<script type="application/ld+json">${json}</script></head>`,
      "</head>"
    );
  }
  return out;
}

module.exports = { renderShell, datasetJsonLd };

if (require.main === module) {
  const pages = require("./manualPages");
  const shell = fs.readFileSync("./dist/index.html", "utf8");
  for (const page of pages.filter((p) => p.shell)) {
    const dir = path.join("./dist", page.fullPath);
    fs.mkdirSync(dir, { recursive: true });
    const files = fs.readdirSync(dir).filter((file) => file !== "index.html");
    fs.writeFileSync(
      path.join(dir, "index.html"),
      renderShell(shell, page, files)
    );
    console.log(`Page shell written: ${path.join(dir, "index.html")}`);
  }
}
