// Canonicalize to a trailing slash (Astro config `trailingSlash: 'always'`).
//
// On-demand (SSR) section landings — /news, /grants/funding, /researchhub, /events,
// /innovation-and-digital-services, … — return 404 when requested WITHOUT a trailing
// slash: Astro's router rejects the unmatched path BEFORE middleware runs (confirmed
// on the Netlify build, not just `astro dev`), and a `_redirects` rule loops on
// Netlify's trailing-slash-INSENSITIVE matching. An edge function is the one layer
// that runs at the edge before the SSR function AND sees the exact (bare) path, so it
// can 301 only the no-slash form without looping.
//
// Pass-through (returns nothing → Netlify continues to _redirects / SSR / static):
// the root, already-slashed paths, and files (dotted last segment). Proxied sub-apps
// + platform internals are skipped via `config.excludedPath` so their in-place paths
// are never rewritten. The redirect mutates only `url.pathname` (origin/host fixed) →
// open-redirect-safe.
export default async (request: Request) => {
  const url = new URL(request.url);
  const { pathname } = url;
  const lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1);

  if (pathname === '/' || pathname.endsWith('/') || lastSegment.includes('.')) {
    return; // pass through unchanged
  }

  url.pathname = pathname + '/';
  return Response.redirect(url.toString(), 301);
};

export const config = {
  path: '/*',
  // Don't touch the in-place proxied sub-apps (200! rewrites — adding a slash would
  // break their own routing) or platform/asset endpoints.
  excludedPath: [
    '/_image',
    '/.netlify/*',
    '/api/*',
    '/adultredeploy/*',
    '/ifvcc/*',
    '/arrestexplorer/*',
    '/mhcontinuum/*',
    '/sudcontinuum/*',
    '/researchhub/studio/*',
  ],
};
