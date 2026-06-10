/**
 * Hub live-list fetch — thin GraphQL, client-safe.
 *
 * The hub's REST list endpoints inline base64 splash/thumbnail/images on every
 * record, so the old fetchCollection(REST) read for /researchhub/articles/ was
 * ~105MB per page view (LIVE-1's sibling). The hub GraphQL endpoint is public +
 * CORS-open (the legacy SPA and the build both use it), so the live islands now
 * fetch the SAME thin field set the build's group queries select — a few KB.
 *
 * Inline args only (limit/start/where literals): the hub Strapi v3 SILENTLY
 * IGNORES GraphQL `where` VARIABLES (see the defect note in graphql/hub.js).
 *
 * Every helper returns null on any failure — the island keeps its baked baseline.
 */
import { HUB } from './sources';

export type HubKind = 'articles' | 'datasets' | 'apps';

/** Exactly the build's list-query field sets (graphql/hub.js group queries),
 *  minus build-only heavies — never splash/thumbnail/images/markdown/image. */
const ROW_FIELDS: Record<HubKind, string> = {
  articles: 'id title slug abstract authors date tags categories',
  datasets: 'id title slug description date categories tags',
  apps: 'id title slug description date contributors categories tags',
};

const PAGE = 500;
const MAX_PAGES = 20; // safety backstop (252 articles today → 1 page)

/** POST one GraphQL query; resolve the `data` object or null. */
async function gqlPost(query: string): Promise<any | null> {
  try {
    const res = await fetch(`${HUB}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return null;
    const out = await res.json();
    return out && out.data ? out.data : null;
  } catch {
    return null;
  }
}

/** Paged thin list read for a hub collection (published only, build sort
 *  order), de-duped by id. Returns RAW records (the live shapers handle the
 *  GraphQL shape — same fields as REST for everything selected here). */
export async function fetchHubRows(kind: HubKind): Promise<any[] | null> {
  const seen = new Set<string>();
  const rows: any[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const query = `{
  ${kind}(where: { status: "published" }, sort: "date:desc", limit: ${PAGE}, start: ${page * PAGE}) {
    ${ROW_FIELDS[kind]}
  }
}`;
    const data = await gqlPost(query);
    const slice = data?.[kind];
    if (!Array.isArray(slice)) return null;
    for (const r of slice) {
      const k = String(r?.id);
      if (!seen.has(k)) {
        seen.add(k);
        rows.push(r);
      }
    }
    if (slice.length < PAGE) break;
  }
  return rows;
}

/** A live swap replaces every row, and live rows carry no build-time image
 *  fields (ip is minted by the build's hub-image extraction; hasImg keys the
 *  apps' base64 lazy-load). Carry the baked values over by slug so existing
 *  cards keep their thumbnails; genuinely-new rows stay imageless until the
 *  next rebuild (the accepted transient deviation). Pure; live owns membership. */
export function mergeBakedHubImages<
  T extends { slug: string; ip: string | null; hasImg: boolean },
>(live: T[], baked: Array<{ slug: string; ip: string | null; hasImg: boolean }>): T[] {
  const bySlug = new Map(baked.map((b) => [b.slug, b]));
  return live.map((r) => {
    const b = bySlug.get(r.slug);
    return b ? { ...r, ip: r.ip ?? b.ip ?? null, hasImg: r.hasImg || !!b.hasImg } : r;
  });
}
