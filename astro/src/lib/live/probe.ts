/**
 * Live-island freshness PROBE — isomorphic (build + browser), client-safe.
 *
 * Replaces the "download the whole collection to discover nothing changed"
 * pattern: each listing bakes the collection's (count, latest-updated stamp) at
 * build; on init the island re-reads the same two values from the SAME data
 * source its full fetch uses and skips the heavy fetch when they match.
 *
 *   add    → count changes (and usually the stamp)
 *   edit   → Strapi bumps updated_at → latest stamp changes
 *   delete → count changes
 *
 * Probe and full fetch MUST observe the same source:
 *   - agency collections fetch via REST  → restProbe (REST /count + _sort latest)
 *   - hub collections fetch via GraphQL → hubProbe  (one POST: Connection
 *     aggregate count + latest updatedAt) — the hub REST records inline base64
 *     images (the ~105MB /articles read), so REST is never probed there.
 *
 * Every helper returns null on ANY failure: the caller then runs the full
 * fetch (today's behavior). The probe only ever SKIPS work when it can PROVE
 * the baked baseline is current — never the other way around.
 */
import { HUB, SOURCES, type SourceKey } from './sources';

export interface LiveProbe {
  /** collection count (REST /count or GraphQL aggregate.count). */
  n: number;
  /** latest updated stamp, '' for an empty collection. */
  u: string;
}

/** Agency REST returns snake_case (updated_at); hub GraphQL camelCase. */
export function stampOf(raw: any): string {
  return (raw && (raw.updated_at ?? raw.updatedAt)) ?? '';
}

/** Two tiny parallel GETs against the same Strapi v3 REST API fetchCollection
 *  pages: /count and the single most-recently-updated record. */
export async function restProbe(
  host: string,
  collection: string,
  query = '',
): Promise<LiveProbe | null> {
  try {
    const [cRes, lRes] = await Promise.all([
      fetch(`${host}/${collection}/count${query ? `?${query}` : ''}`),
      fetch(`${host}/${collection}?_sort=updated_at:DESC&_limit=1${query ? `&${query}` : ''}`),
    ]);
    if (!cRes.ok || !lRes.ok) return null;
    const n = Number(await cRes.json());
    if (!Number.isFinite(n)) return null;
    const latest = await lRes.json();
    if (!Array.isArray(latest)) return null;
    return { n, u: stampOf(latest[0]) };
  } catch {
    return null;
  }
}

/** One GraphQL POST for a hub collection (status=published gate, matching the
 *  baked baseline + the live thin fetch). Inline args only — the hub Strapi
 *  silently ignores GraphQL `where` VARIABLES (see graphql/hub.js). */
export async function hubProbe(
  collection: 'articles' | 'datasets' | 'apps',
): Promise<LiveProbe | null> {
  const query = `{
  ${collection}Connection(where: { status: "published" }) { aggregate { count } }
  ${collection}(where: { status: "published" }, sort: "updatedAt:desc", limit: 1) { updatedAt }
}`;
  try {
    const res = await fetch(`${HUB}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return null;
    const out = await res.json();
    const conn = out?.data?.[`${collection}Connection`]?.aggregate?.count;
    const rows = out?.data?.[collection];
    if (!Number.isFinite(Number(conn)) || !Array.isArray(rows)) return null;
    return { n: Number(conn), u: stampOf(rows[0]) };
  } catch {
    return null;
  }
}

/** Build-side convenience: probe a SOURCES key with the SAME transport its
 *  island's full fetch uses (hub host → GraphQL, agency → REST). Components
 *  call this in frontmatter and bake the result into data-live-probe. */
export async function buildProbe(key: SourceKey): Promise<LiveProbe | null> {
  const src = SOURCES[key] as { host: string; collection: string; query?: string };
  if (src.host === HUB) return hubProbe(src.collection as 'articles' | 'datasets' | 'apps');
  return restProbe(src.host, src.collection, src.query ?? '');
}

/** True ⇔ both probes resolved AND count + latest stamp are identical. */
export function probeUnchanged(
  baked: LiveProbe | null | undefined,
  live: LiveProbe | null | undefined,
): boolean {
  return !!baked && !!live && baked.n === live.n && baked.u === live.u;
}
