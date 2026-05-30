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
// TTLs are tuned per content type by editorial cadence; they live in the single
// source of truth at astro/icjia.config.mjs (see that file). [s-maxage, swr] secs.
// @ts-expect-error — icjia.config.mjs is plain JS (shared by the raw Netlify fn).
import { cacheTTL } from "../../icjia.config.mjs";

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

const TTL = cacheTTL as Record<Kind, [number, number]>;

export function setCache(response: Response, kind: Kind): void {
  const [s, swr] = TTL[kind];
  // Netlify's CDN + Durable Cache honor THIS header for SSR/function responses;
  // a plain `Cache-Control: s-maxage` is bypassed (observed `cache-status:
  // "Netlify Durable"; fwd=bypass` on every SSR route — so nothing was edge-
  // cached, and slow-Strapi routes ate the full backend latency on every hit).
  // `durable` keeps one cached copy shared across regions + deploys, so a single
  // populate warms everywhere and the cold/SWR-revalidate path is rare. This is
  // what makes warm hits edge-fast (≈100-200ms TTFB) → mobile perf 98+.
  response.headers.set(
    "Netlify-CDN-Cache-Control",
    `public, s-maxage=${s}, stale-while-revalidate=${swr}, durable`,
  );
  // Browser: always revalidate (cheap against the warm CDN) so users never hold
  // stale HTML — keeps content "live" while the CDN absorbs the load.
  response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
}
