// Per-route CDN cache control for the live-data SSR model.
//
// The server always fetches fresh from Strapi, but the Netlify edge serves
// most requests from cache (s-maxage) and refreshes in the background
// (stale-while-revalidate). Net effect: content is live to within `s-maxage`
// seconds, with edge-fast TTFB for the cache-hit majority — which is how we
// hit mobile perf 95-98+ while keeping data live.
//
// This shared edge cache intentionally REPLACES the legacy gql-client
// per-session in-memory cache (a client-side SPA mechanism that has no place in
// SSR, where fetches run server-side). Decision (2026-05-29, with the user):
// the edge cache delivers the same "don't re-fetch the same page" speed
// cross-user, with background revalidation, so per-session caching was not
// ported. Server fetches stay fetchPolicy:"no-cache" so the edge is the single
// intentional cache layer.
//
// TTLs are tuned per content type by editorial cadence (see migration plan).
type Kind =
  | "home"
  | "news"
  | "meetings"
  | "grants"
  | "events"
  | "jobs"
  | "publications"
  | "bios"
  | "page"
  | "hub";

// [s-maxage, stale-while-revalidate] in seconds.
const TTL: Record<Kind, [number, number]> = {
  home: [60, 300],
  news: [60, 300],
  meetings: [120, 600],
  grants: [120, 600],
  events: [120, 600],
  jobs: [300, 900],
  publications: [300, 1800],
  bios: [600, 3600],
  page: [600, 3600],
  hub: [120, 600],
};

export function setCache(response: Response, kind: Kind): void {
  const [s, swr] = TTL[kind];
  response.headers.set(
    "Cache-Control",
    `public, s-maxage=${s}, stale-while-revalidate=${swr}`,
  );
}
