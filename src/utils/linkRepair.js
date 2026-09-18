// Links typed without a scheme (v1.5.91).
//
// An editor types [Euna](il.amplifund.com/Public/...), or links an email
// address to itself, and the browser reads the address as one on this site:
// https://icjia.illinois.gov/il.amplifund.com/... A survey of the CMS on
// 2026-09-18 found 15 such links in about 1,065 records. Two kinds can be
// repaired as the content is rendered, and are: a web address missing its
// https://, and a bare email address missing its mailto:. The rest (a bare
// file name, a placeholder, a mistyped scheme) are left as typed; where they
// should point is not known.
//
// CommonJS, and free of the DOM, because two renderers use it: the site's
// content pipeline (src/utils/contentSanitizer.js) and the feed generators'
// (generators/utils/Markdown.mjs), which runs in Node.

// A host is taken for one only when it ends in one of these, so that
// "report.final.pdf" and "packet.zip" stay file names.
const TOP_LEVEL_DOMAINS = "com|org|net|gov|edu|us|info|mil|io|co";
const WEB_ADDRESS = new RegExp(
  `^[a-z0-9-]+(\\.[a-z0-9-]+)*\\.(${TOP_LEVEL_DOMAINS})([/:?#]|$)`,
  "i"
);
const EMAIL_ADDRESS = /^[^\s@/:?#]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;

function repairHref(href) {
  if (typeof href !== "string") return href;
  const typed = href.trim();
  if (EMAIL_ADDRESS.test(typed)) return `mailto:${typed}`;
  if (WEB_ADDRESS.test(typed)) return `https://${typed}`;
  return href;
}

// Only the href of an <a>: an image's src and the text of the page are left
// alone.
function repairLinksInHtml(html) {
  if (typeof html !== "string" || html.indexOf("<a") === -1) return html;
  return html.replace(
    /(<a\b[^>]*?\shref\s*=\s*)(["'])(.*?)\2/gi,
    (match, before, quote, href) =>
      `${before}${quote}${repairHref(href)}${quote}`
  );
}

module.exports = { repairHref, repairLinksInHtml };
