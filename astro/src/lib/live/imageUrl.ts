/**
 * Image URL for the live-detail CLIENT render. Build pages optimize CMS images via
 * astro:assets (CmsImage); a transient post-build slug can't (no build-time asset),
 * so it uses the raw Strapi URL — the established live-island pattern
 * (shapers/news.ts:41-44). Single swap-point: if the owner wants optimized transient
 * images, emit a signed Thumbor URL here (image.icjia.cloud, PUBLIC_THUMBOR_KEY) —
 * deferred because signing is async (Web Crypto) and the owner accepted raw images
 * for the ≤24h transient window. See docs/LIVE-DETAIL-FALLBACK.md §4.
 */
import { AGENCY } from "./sources";

/** Absolutize a Strapi media URL (relative /uploads/… → absolute against `host`). */
export function imageUrl(url?: string | null, host: string = AGENCY): string | null {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith("/")) return host + url;
  return url;
}
