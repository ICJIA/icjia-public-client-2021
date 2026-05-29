// Server-only DOM shim.
//
// contentSanitizer.js's 10 HTML plugins call
//   `new DOMParser().parseFromString(html, "text/html")`
// then read back `doc.body.innerHTML`. In the browser `DOMParser` is global;
// under Astro SSR (Node) it is not.
//
// linkedom is the right engine here (a fraction of jsdom's weight + per-call
// startup, which matters per request inside the Netlify SSR function) — BUT its
// raw `DOMParser.parseFromString(fragment, "text/html")` does NOT auto-wrap a
// fragment in <html><body> the way a browser's text/html parser does, so
// `doc.body` comes back empty. We replicate browser behavior by parsing through
// linkedom's `parseHTML` with an explicit <body> wrapper, so `doc.body` and
// `doc.querySelectorAll(...)` behave exactly as on the client.
//
// The parity suite (contentSanitizer.parity.test.ts) verifies this shim's
// output matches jsdom (the browser-faithful reference) on realistic CMS
// fixtures. `ServerDOMParser` is exported so the suite exercises the exact
// production engine.
//
// Import for side effect BEFORE the first `sanitizeContent()` call:
//   import "./server-dom";
//   import { sanitizeContent } from "./contentSanitizer";
import { parseHTML } from "linkedom";

class ServerDOMParser {
  parseFromString(html: string, _type?: string): Document {
    const { document } = parseHTML(
      `<!DOCTYPE html><html><head></head><body>${html ?? ""}</body></html>`,
    );
    return document as unknown as Document;
  }
}

if (typeof (globalThis as Record<string, unknown>).DOMParser === "undefined") {
  (globalThis as Record<string, unknown>).DOMParser =
    ServerDOMParser as unknown as typeof DOMParser;
}

export { ServerDOMParser };
