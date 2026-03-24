import DOMPurify from "dompurify";
// const config = require("@/config/config.json");
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
    rel: "noopener noreferrer",
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

const mdImplicitFigureOpts = {
  dataType: false, // <figure data-type="image">, default: false
  figcaption: false, // <figcaption>alternative text</figcaption>, default: false
  tabindex: true, // <figure tabindex="1+n">..., default: false
  link: false, // <a href="img.png"><img src="img.png"></a>, default: false
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
  .use(require("markdown-it-implicit-figures"), mdImplicitFigureOpts)
  .use(require("markdown-it-attrs"), mdAttrs);

const renderToHtml = function (markdown) {
  const raw = md.render(markdown);
  return DOMPurify.sanitize(raw, {
    ADD_TAGS: ["figure", "figcaption", "iframe"],
    ADD_ATTR: [
      "target",
      "id",
      "class",
      "tabindex",
      "aria-label",
      "aria-hidden",
      "role",
      "data-type",
      "colspan",
      "rowspan",
      "allow",
      "allowfullscreen",
      "frameborder",
    ],
  });
};

const parseHeadings = function (markdown) {
  return new DOMParser()
    .parseFromString(md.render(markdown), "text/html")
    .querySelectorAll("h2");
};

export { renderToHtml, parseHeadings };
