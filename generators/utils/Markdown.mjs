/* eslint-disable no-unused-vars */
import MarkdownIt from "markdown-it";
import MarkdownItAnchor from "markdown-it-anchor";
import MarkdownItFootnote from "markdown-it-footnote";
import MarkdownItLinkAttributes from "markdown-it-link-attributes";
import MarkdownItAttrs from "markdown-it-attrs";

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

const mdImplicitFigureOpts = {
  dataType: false, // <figure data-type="image">, default: false
  figcaption: false, // <figcaption>alternative text</figcaption>, default: false
  tabindex: true, // <figure tabindex="1+n">..., default: false
  link: false, // <a href="img.png"><img src="img.png"></a>, default: false
};

let md = new MarkdownIt({
  html: true,
  xhtmlOut: false,
  breaks: false,
  langPrefix: "language-",
  linkify: true,
  typographer: true,
  quotes: "“”‘’",
})
  .use(MarkdownItAnchor, mdAnchorOpts)
  .use(MarkdownItFootnote)
  .use(MarkdownItLinkAttributes, mdLinkAttrOpts)
  .use(MarkdownItAttrs, mdAttrs);

const renderToHtml = function (markdown) {
  return md.render(markdown);
};

export { renderToHtml };
