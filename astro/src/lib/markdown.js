// Server-side (build/Node) wrapper around markdown-core.js.
//
// The markdown pipeline was split (2026-06-05) so the SAME renderer can run in
// the browser for the live-detail fallback (see docs/LIVE-DETAIL-FALLBACK.md):
//   - markdown-core.js  — all the markdown-it + plugin + DOM-fixer + sanitizer
//                         logic, browser-safe, parameterized by a DOMPurify instance.
//   - markdown.js (here) — the Node/build environment binding: a jsdom-backed
//                         DOMPurify (complete + battle-tested for server-side XSS
//                         sanitization) and the linkedom `DOMParser` shim.
//   - markdown.client.js — the browser binding (native-window DOMPurify, native
//                         DOMParser).
// Both wrappers produce byte-identical output (same core); the parity suite proves it.
//
// This wrapper preserves the original public API and behavior exactly, so every
// existing build consumer (data.ts, research.ts, …) is unchanged.
import "./server-dom"; // installs globalThis.DOMParser (linkedom) — must precede the DOM helpers
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { createMarkdownRenderer, parseHeadings } from "./markdown-core.js";

// DOMPurify is backed by jsdom (complete + battle-tested for server-side XSS
// sanitization — correctness is non-negotiable here). The DOM fixers /
// contentSanitizer inside the core use the global `DOMParser`, shimmed to the
// lighter linkedom (see server-dom.ts), which the parity suite proved produces
// browser-identical output.
const DOMPurify = createDOMPurify(new JSDOM("").window);
const { renderToHtml, renderInline } = createMarkdownRenderer(DOMPurify);

export { renderToHtml, renderInline, parseHeadings };
