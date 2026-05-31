import { defineMiddleware } from 'astro:middleware';

// Canonicalize to a trailing slash (config `trailingSlash: 'always'`).
//
// On-demand (SSR) section landings — /news, /grants/funding, /researchhub,
// /innovation-and-digital-services, /events, … — otherwise return 404 when requested
// WITHOUT the trailing slash (Astro SSR does no slash normalization). Legacy prod
// 200'd those (the SPA's catch-all), so bare-URL bookmarks/inbound links would break.
// We 301 them to the slashed canonical here.
//
// Why middleware and not a `_redirects` rule: Netlify's `_redirects` matching is
// trailing-slash-INSENSITIVE, so a `/news /news/ 301` rule also matches the already-
// slashed `/news/` and 301-loops. Middleware sees the exact path and only redirects
// the bare form. (Prerendered routes are slash-normalized by Netlify static serving;
// middleware doesn't run for them at request time, which is fine.)
//
// Skips: the root, real files (dotted last segment — .xml/.json/.ico/.pdf/.js…),
// and Astro/Netlify internals (/_image, /_astro, /.netlify/*). Only GET/HEAD are
// redirected (never rewrite a POST method via 3xx). Edge `_redirects` (proxied
// sub-sites `200!`, legacy 301s) are evaluated BEFORE the SSR function, so those
// paths never reach this middleware.
// VERIFICATION NOTE: `astro dev`'s router returns 404 for an unmatched path BEFORE
// running middleware, so a no-slash request like `/news` can NOT be smoke-tested in
// dev (it 404s without reaching here). In the production build the SSR function runs
// the full pipeline — middleware executes before the 404 render (Astro's documented
// behavior) — so this canonicalization takes effect on the Netlify deploy. MUST be
// verified post-deploy: `curl -sI <deploy>/news` should be 301 → `/news/`.
export const onRequest = defineMiddleware((context, next) => {
  const { request } = context;
  if (request.method !== 'GET' && request.method !== 'HEAD') return next();

  const url = context.url;
  const { pathname } = url;
  const lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1);
  const skip =
    pathname === '/' ||
    pathname.endsWith('/') ||
    pathname.startsWith('//') || // protocol-relative / malformed — never reflect into Location
    pathname.startsWith('/_') ||
    pathname.startsWith('/.netlify') ||
    lastSegment.includes('.'); // has a file extension → an asset/file, not a route

  if (!skip) {
    // Open-redirect-safe: clone the request URL (origin/host fixed) and only mutate
    // the pathname, so the Location stays same-origin no matter what the path
    // contained (a raw `pathname + '/'` would turn `//evil.com/x` into a
    // protocol-relative Location → open redirect). The query string is preserved
    // by the clone.
    const target = new URL(url);
    target.pathname = pathname + '/';
    return context.redirect(target.toString(), 301);
  }
  return next();
});
