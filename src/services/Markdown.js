// const config = require("@/config.json");
// import { EventBus } from "@/event-bus.js";
// const namedHeaders = require("markdown-it-named-headers");
// const attrs = require("markdown-it-attrs/markdown-it-attrs.browser.js");

const mdAnchorOpts = {
  level: 2,
  slugify: (s) =>
    String(s)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_]/g, ""),
};

const mdLinkAttrOpts = {
  attrs: {
    target: "_blank",
  },
};

const mdMultimdTableOpts = {
  multiline: true,
  enableRowspan: true,
};

const mdAttrs = {
  leftDelimiter: "{",
  rightDelimiter: "}",
  allowedAttributes: [],
};

let md = require("markdown-it")({
  html: true,
  xhtmlOut: false,
  breaks: false,
  langPrefix: "language-",
  linkify: true,
  typographer: true,
  quotes: "“”‘’",
})
  .use(require("markdown-it-anchor").default, mdAnchorOpts)
  .use(require("markdown-it-footnote"))
  .use(require("markdown-it-link-attributes"), mdLinkAttrOpts)
  .use(require("markdown-it-multimd-table"), mdMultimdTableOpts)
  .use(require("markdown-it-attrs"), mdAttrs);

const renderToHtml = function (markdown) {
  return md.render(markdown);
};

const parseHeadings = function (markdown) {
  return new DOMParser()
    .parseFromString(md.render(markdown), "text/html")
    .querySelectorAll("h2");
};

export { renderToHtml, parseHeadings };
