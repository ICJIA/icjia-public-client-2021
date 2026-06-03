import { contentSignature } from './signature';

/** Paged Strapi v3 REST read: /count then _limit/_start slices, de-duped by id.
 *  Returns shaped rows, or null on any failure (caller keeps the baked baseline). */
export async function fetchCollection<T extends { id: string | number }>(
  host: string,
  collection: string,
  shapeOne: (raw: any) => T,
  size = 500,
): Promise<T[] | null> {
  try {
    const cRes = await fetch(`${host}/${collection}/count`);
    if (!cRes.ok) return null;
    const count = Number(await cRes.json());
    let raw: any[] = [];
    for (let i = 0; i < Math.ceil(count / size); i++) {
      const r = await fetch(`${host}/${collection}?_limit=${size}&_start=${i * size}`);
      if (!r.ok) return null;
      const slice = await r.json();
      if (!Array.isArray(slice)) return null; // malformed response → keep the baked baseline
      raw = raw.concat(slice);
    }
    const seen = new Set<string>(), uniq: T[] = [];
    for (const p of raw) {
      const k = String(p.id);
      if (!seen.has(k)) { seen.add(k); uniq.push(shapeOne(p)); }
    }
    return uniq;
  } catch { return null; }
}

export interface LiveListOpts<T extends { id: string | number }> {
  host: string;
  collection: string;
  /** shape ONE raw record to the surface's display shape (relocated build shaper). */
  shapeOne: (raw: any) => T;
  /** baked baseline rows (already shaped) read from the JSON island. */
  baseline: T[];
  /** post-sort/slice for the surface (e.g. newest-first, top-N for home). */
  finalize?: (rows: T[]) => T[];
}

/** Alpine-friendly state factory. Surface usage:
 *    x-data="liveList(window.__news)"  with  window.__news = { ...opts, baseline }
 *  Renders `rows`; after init, fetches live + swaps only if the signature changed. */
export function liveList<T extends { id: string | number }>(opts: LiveListOpts<T>) {
  const finalize = opts.finalize ?? ((r: T[]) => r);
  return {
    rows: finalize(opts.baseline) as T[],
    ready: false,
    live: false,
    init() {
      this.ready = true;
      fetchCollection(opts.host, opts.collection, opts.shapeOne)
        .then((fetched) => {
          if (!fetched) return;
          const next = finalize(fetched);
          if (contentSignature(next as any) !== contentSignature(this.rows as any)) {
            this.rows = next;
          }
          this.live = true;
        })
        .catch(() => {});
    },
  };
}
