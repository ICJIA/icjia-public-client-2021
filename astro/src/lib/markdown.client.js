// Browser wrapper around markdown-core.js — used by the live-detail fallback to
// render a brand-new (post-build) CMS record's body markdown CLIENT-SIDE, with
// output identical to the build's markdown.js (see docs/LIVE-DETAIL-FALLBACK.md).
//
// In the browser, DOMPurify binds to the real `window` and the DOM fixers /
// contentSanitizer use the native global `DOMParser` — so there is NO jsdom and
// NO server-dom (linkedom) import here, and neither is pulled into the client
// bundle. This module is only ever dynamically imported on a content-detail 404
// hit, so normal page loads never download the markdown/sanitizer code.
import createDOMPurify from "dompurify";
import { createMarkdownRenderer, parseHeadings } from "./markdown-core.js";

const DOMPurify = createDOMPurify(window);
const { renderToHtml, renderInline } = createMarkdownRenderer(DOMPurify);

export { renderToHtml, renderInline, parseHeadings };
