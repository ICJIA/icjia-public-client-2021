# Site-wide live-islands — Phase A (lists/home) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every list/home surface of the static site live-on-refresh — read the baked baseline, then re-fetch the collection from public Strapi REST in the browser and swap on a content-signature change — with zero functions and the baked baseline preserved for crawlers/SiteImprove.

**Architecture:** One shared client core (`live-list`) generalizes the proven `PublicationTable` `fetchLive→swap` pilot. Each surface declares `{ host, collection, shaper, signatureKeys }`. Shapers are the **existing build-time shapers relocated** into a shared `src/lib/live/shapers/` module (Strapi v3 returns the same flat fields over REST and GraphQL, so `shapeNewsList` et al. work unchanged on the REST response). Image optimization stays build-only (applied after shaping); the live swap uses raw Strapi image URLs (post-paint, accepted per spec §7).

**Tech Stack:** Astro 6 (`output: 'static'`), Alpine.js islands, Strapi v3 REST (`agency.icjia-api.cloud`, `researchhub.icjia-api.cloud`), Vitest (unit), `astro preview` + branch deploy (island/browser verification).

**Spec:** `docs/superpowers/specs/2026-06-03-site-wide-live-islands-design.md`

**Scope:** Phase A only (all list/home surfaces). Phase B (detail-page live-render) is deferred to its own plan after the Phase A deploy-verify gate (Task 12), per spec §5.

**Adjustment vs spec (confirmed during planning):** The "shared isomorphic shaper" (spec §4.1) is viable — `shapeNewsList` (data.ts:322) already consumes the raw flat Strapi shape, so shapers are relocated, not rewritten. No fabricated shaper code in this plan; per-surface tasks relocate verified functions.

**Island-verification rule (checklist v7.2 lesson #1):** `pnpm build` cannot verify an Alpine island — Astro treats `x-data` as an opaque string. Pure logic (signature, shapers, fetch/shape pipeline with mocked fetch) gets Vitest tests; island DOM swaps are verified in a real browser via `astro preview` / branch deploy. Both forms appear below; do not skip the browser step.

---

## File Structure

**Create:**
- `src/lib/live/sources.ts` — the `{ surface → {host, collection} }` map (resolved in Task 1) + the two host base URLs.
- `src/lib/live/signature.ts` — order-independent content signature over `id + updatedAt`.
- `src/lib/live/shapers/news.ts` — relocated `shapeNewsList` + the news list-item shape (pure).
- `src/lib/live/shapers/index.ts` — re-exports; home of relocated shared pure helpers (`truncateWords`, `isNew`, date formatters, type-label maps) used by multiple shapers.
- `src/lib/live/live-list.ts` — the shared core: `createLiveList(opts)` returning the Alpine-friendly fetch/shape/signature/swap object.
- `src/lib/live/live-list.test.ts`, `signature.test.ts`, `shapers/news.test.ts` — Vitest.

**Modify (relocate-and-import, build output unchanged):**
- `src/lib/data.ts` — import relocated shapers/helpers instead of local copies (news first; meetings/events/funding/programs as their tasks land).
- `src/components/PublicationTable.astro` — migrate inline island onto `createLiveList` (Task 5).
- `src/components/NewsListing.astro`, `src/components/researchhub/HubListing.astro`, `src/components/MeetingTable.astro` — wire existing islands to the core (Tasks 6,7,10).
- `src/components/HomeCardNews.astro`, `src/components/HomeTabbed.astro` — refactor inline HTML → JSON-island + `x-for` + core (Task 8).
- `src/components/HomeResearch.astro` — repoint source from baked `/api/home-research.json` to live researchhub REST via the core (Task 9).
- CSP config (`netlify.toml` / wherever `connect-src` lives — confirm in Task 11).

---

## Task 1: Recon — resolve the collection map + raw field shapes

**Files:**
- Create: `src/lib/live/sources.ts`

- [ ] **Step 1: Probe each candidate REST collection on both hosts**

Run (executor has network; the dev sandbox does not):
```bash
for host in agency.icjia-api.cloud researchhub.icjia-api.cloud; do
  for c in posts publications meetings events fundings nofos funding programs articles datasets apps; do
    code=$(curl -s -m 8 -o /dev/null -w "%{http_code}" "https://$host/$c/count")
    [ "$code" = "200" ] && echo "200  $host/$c  ($(curl -s "https://$host/$c/count"))"
  done
done
```
Expected: `200` lines for the real collections (known: `agency/posts`, `agency/publications`). Record the agency vs researchhub split and exact names (e.g. funding may be `fundings` or `nofos`).

- [ ] **Step 2: Capture one raw record per resolved collection**

Run, per resolved `host/collection`:
```bash
curl -s "https://<host>/<collection>?_limit=1&_sort=updatedAt:DESC" | python3 -m json.tool | head -60
```
Note the field names the shaper must read (e.g. `published_at`, `dateOverride`, `tags[].title`, `slug`, `updatedAt`) and confirm an `updatedAt` (or equivalent) field exists for the signature.

- [ ] **Step 3: Write the resolved map**

Create `src/lib/live/sources.ts` with the confirmed values (example shape — fill from Steps 1–2):
```ts
export const AGENCY = 'https://agency.icjia-api.cloud';
export const HUB = 'https://researchhub.icjia-api.cloud';

/** Resolved Strapi v3 REST collections per live surface (Task 1 recon). */
export const SOURCES = {
  news:         { host: AGENCY, collection: 'posts' },
  publications: { host: AGENCY, collection: 'publications' },
  meetings:     { host: AGENCY, collection: 'meetings' },     // confirm
  events:       { host: AGENCY, collection: 'events' },       // confirm
  funding:      { host: AGENCY, collection: 'fundings' },     // confirm name
  programs:     { host: AGENCY, collection: 'programs' },     // confirm
  hubArticles:  { host: HUB,    collection: 'articles' },     // confirm
  hubDatasets:  { host: HUB,    collection: 'datasets' },     // confirm
  hubApps:      { host: HUB,    collection: 'apps' },         // confirm
} as const;
export type SourceKey = keyof typeof SOURCES;
```

- [ ] **Step 4: Commit**
```bash
git add src/lib/live/sources.ts
git commit -m "feat(live): resolved Strapi REST collection map for live-islands (Task 1)"
```

---

## Task 2: Content-signature util

**Files:**
- Create: `src/lib/live/signature.ts`, `src/lib/live/signature.test.ts`

- [ ] **Step 1: Write the failing test**
```ts
// src/lib/live/signature.test.ts
import { describe, it, expect } from 'vitest';
import { contentSignature } from './signature';

describe('contentSignature', () => {
  const a = [{ id: 1, updatedAt: '2026-01-01' }, { id: 2, updatedAt: '2026-02-01' }];
  it('is order-independent', () => {
    expect(contentSignature(a)).toBe(contentSignature([...a].reverse()));
  });
  it('changes when an item updatedAt changes (edit)', () => {
    const b = [{ id: 1, updatedAt: '2026-03-09' }, { id: 2, updatedAt: '2026-02-01' }];
    expect(contentSignature(a)).not.toBe(contentSignature(b));
  });
  it('changes when an item is removed (delete) or added', () => {
    expect(contentSignature(a)).not.toBe(contentSignature([a[0]]));
    expect(contentSignature(a)).not.toBe(contentSignature([...a, { id: 3, updatedAt: 'x' }]));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd astro && pnpm vitest run src/lib/live/signature.test.ts`
Expected: FAIL — `contentSignature` not defined.

- [ ] **Step 3: Implement**
```ts
// src/lib/live/signature.ts
/** Order-independent signature over id+updatedAt; detects add/edit/delete. */
export function contentSignature(
  rows: ReadonlyArray<{ id: string | number; updatedAt?: string | null }>,
): string {
  const parts = rows
    .map((r) => `${r.id}:${r.updatedAt ?? ''}`)
    .sort();
  // djb2 over the joined, sorted parts (no crypto dep; collision-safe enough here).
  let h = 5381;
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${rows.length}.${(h >>> 0).toString(36)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd astro && pnpm vitest run src/lib/live/signature.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**
```bash
git add src/lib/live/signature.ts src/lib/live/signature.test.ts
git commit -m "feat(live): content-signature util (add/edit/delete detection)"
```

---

## Task 3: Relocate the news shaper into the shared module

**Files:**
- Read first: `src/lib/data.ts:300-345` (`NewsListItem` + `shapeNewsList`), and the pure helpers it/`NewsListing` use (`truncateWords`, `isNew`, `formatNewsDate`, `newsCategoryLabel`, `pickStrapiImage`, `monthBucket`).
- Create: `src/lib/live/shapers/news.ts`, `src/lib/live/shapers/index.ts`, `src/lib/live/shapers/news.test.ts`
- Modify: `src/lib/data.ts` (import the relocated shaper/helpers instead of local copies)

- [ ] **Step 1: Read the source.** Open `data.ts:300-345` and confirm `shapeNewsList` reads only raw fields (`e.dateOverride`, `e.published_at`, `e.tags[].title`, `e.slug`, `e.splash`, `e.summary`, `e.category`, `e.id`, `e.title`) + `monthBucket`. Note any import it depends on.

- [ ] **Step 2: Write the failing parity test** (relocated shaper must equal the original output)
```ts
// src/lib/live/shapers/news.test.ts
import { describe, it, expect } from 'vitest';
import { shapeNewsList } from './news';

const raw = [{
  id: 7, title: 'T', slug: 't', summary: 'S', category: 'cat',
  published_at: '2026-05-01T00:00:00.000Z', dateOverride: '',
  tags: [{ title: 'a' }, { title: 'b' }], splash: { url: '/u.jpg' },
}];

describe('shapeNewsList (relocated, pure)', () => {
  it('flattens tags, derives publicationDate + fullPath', () => {
    const [it0] = shapeNewsList(raw);
    expect(it0.tags).toEqual(['a', 'b']);
    expect(it0.publicationDate).toBe('2026-05-01T00:00:00.000Z');
    expect(it0.fullPath).toBe('/news/t/');
  });
  it('prefers dateOverride when present', () => {
    const [it0] = shapeNewsList([{ ...raw[0], dateOverride: '2026-06-01' }]);
    expect(it0.publicationDate).toBe('2026-06-01');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd astro && pnpm vitest run src/lib/live/shapers/news.test.ts`
Expected: FAIL — `./news` not found.

- [ ] **Step 4: Relocate the code.** Move `NewsListItem` + `shapeNewsList` + the month-bucket logic verbatim from `data.ts` into `src/lib/live/shapers/news.ts` (drop any `getImage`/server-only import — `shapeNewsList` has none). Re-export the shared pure helpers (`truncateWords`, `isNew`, date/label fns) from `shapers/index.ts`. In `data.ts`, replace the moved definitions with `import { shapeNewsList, type NewsListItem } from './live/shapers/news';` (and helpers from `./live/shapers`). Keep every existing `data.ts` call site working.

- [ ] **Step 5: Run shaper test + full suite + build**

Run: `cd astro && pnpm vitest run && pnpm build`
Expected: shaper test PASS; existing suite PASS (no behavior change); build succeeds. If any snapshot/output differs, the relocation altered behavior — fix until identical.

- [ ] **Step 6: Commit**
```bash
git add src/lib/live/shapers/ src/lib/data.ts
git commit -m "refactor(live): relocate news shaper + pure helpers to shared module (build output unchanged)"
```

---

## Task 4: The `live-list` core

**Files:**
- Read first: `src/components/PublicationTable.astro:23-110` (the pilot `init`/`fetchLive`/`index`/`shape` logic this generalizes).
- Create: `src/lib/live/live-list.ts`, `src/lib/live/live-list.test.ts`

- [ ] **Step 1: Write the failing test** (pure pipeline: paged REST fetch + shape + signature; `fetch` mocked)
```ts
// src/lib/live/live-list.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchCollection } from './live-list';

describe('fetchCollection (paged REST)', () => {
  it('reads /count then _start slices and concatenates + de-dupes by id', async () => {
    const rows = Array.from({ length: 3 }, (_, i) => ({ id: i + 1, updatedAt: 'u' }));
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => 3 })          // /count
      .mockResolvedValueOnce({ ok: true, json: async () => rows });       // first slice
    vi.stubGlobal('fetch', fetchMock);
    const out = await fetchCollection('https://h', 'posts', (r) => r, 500);
    expect(out.map((r) => r.id)).toEqual([1, 2, 3]);
    expect(fetchMock).toHaveBeenCalledWith('https://h/posts/count');
  });
  it('returns null on a non-ok response (caller keeps baseline)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await fetchCollection('https://h', 'posts', (r) => r, 500)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd astro && pnpm vitest run src/lib/live/live-list.test.ts`
Expected: FAIL — `fetchCollection` not defined.

- [ ] **Step 3: Implement the core** (generalized from the publications pilot)
```ts
// src/lib/live/live-list.ts
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
      raw = raw.concat(await r.json());
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd astro && pnpm vitest run src/lib/live/live-list.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**
```bash
git add src/lib/live/live-list.ts src/lib/live/live-list.test.ts
git commit -m "feat(live): shared live-list core (paged REST fetch + signature swap)"
```

---

## Task 5: Migrate `PublicationTable` onto the core (reference surface)

**Files:**
- Read first: `src/components/PublicationTable.astro` (whole file).
- Create: `src/lib/live/shapers/publications.ts` (relocate the pilot's `shapePublication` + its helpers).
- Modify: `src/components/PublicationTable.astro`

- [ ] **Step 1: Relocate** the pilot's `shapePublication`, `truncateWords`, `publicationTypeLabel`, `dateFormatAlt`, `isNewDate`, `getFileType` from the `x-data` string into `src/lib/live/shapers/publications.ts` as pure exports (they are already pure; keep the backslash-free regexes — checklist v7.2 lesson #2).

- [ ] **Step 2: Add a Vitest test** asserting `shapePublication(raw)` returns the same fields the island renders (`title, dateAlt, typeLabel, localArticlePath, fileURL, isNew`). Run it red, implement (the relocated body), run green:
Run: `cd astro && pnpm vitest run src/lib/live/shapers/publications.test.ts`

- [ ] **Step 3: Rewrite the island** to consume the core. The component keeps its table/search/sort/paginate UI; replace the bespoke `fetchLive/fetchStatic/index` block so `all` comes from `liveList({ host, collection:'publications', shapeOne: shapePublication, baseline })` (baseline = the existing `#publications-data` parse). Keep the `/api/publications.json` fallback inside `shapeOne`/`fetchCollection`’s failure path only. **Behavior change:** swap now triggers on signature (edits/deletes), not `length >`.

- [ ] **Step 4: Build, then verify in the browser** (island rule):

Run: `cd astro && pnpm build && pnpm preview`
Then load `/publications/`, open the console, and assert:
- console clean; the `/publications/count` + slice requests return `200`;
- `Alpine.$data($0)` on the table root shows `live === true` and `rows.length` matching the full archive;
- search/sort/expand/paginate still work (parity with current behavior).

- [ ] **Step 5: Commit**
```bash
git add src/lib/live/shapers/publications.ts src/lib/live/shapers/publications.test.ts src/components/PublicationTable.astro
git commit -m "refactor(live): migrate publications island onto shared core (signature swap)"
```

---

## Task 6: Wire `NewsListing` to the core

**Files:**
- Modify: `src/components/NewsListing.astro` (the `#news-data` island already exists; its `init(){ this.ready = true }` does no network call today).

- [ ] **Step 1:** Keep the baked `listData` baseline + `#news-data` island. Set `window.__news = { host, collection:'posts', baseline: <parsed island>, shapeOne: shapeNewsListClient }` where `shapeNewsListClient` maps a raw `/posts` record to the island's compact row shape (`{ p, t, s, cl, c, d, b, n, img }`) by composing the relocated `shapeNewsList` + the existing field projection (note: `img` falls back to the raw `splash.url` client-side — optimized webp is build-only, accepted per spec §7).
- [ ] **Step 2:** Replace the `x-data` `init` so `all` is driven by `liveList(...)`; keep `filtered/pageItems/pageGroups/pagination` getters unchanged (they operate on `all`/`rows`).
- [ ] **Step 3: Build + browser-verify** (`pnpm build && pnpm preview`, load `/news/`): baseline paints first; after init, `/posts/count` + slices `200`; publishing/editing a post in Strapi then reloading shows it (verify on the **deploy**, Task 12). axe-core clean after swap.
- [ ] **Step 4: Commit**
```bash
git add src/components/NewsListing.astro
git commit -m "feat(live): /news listing live-on-refresh via shared core"
```

---

## Task 7: Wire `HubListing` (articles / datasets / apps) to the core

**Files:**
- Read first: `src/lib/research.ts:248-520` (the three list-item interfaces + their shapers).
- Create: `src/lib/live/shapers/hub.ts` (relocate the researchhub list shapers, pure).
- Modify: `src/components/researchhub/HubListing.astro` (per `kind`: articles/datasets/apps).

- [ ] **Step 1:** Relocate each hub list shaper into `shapers/hub.ts` (red/green Vitest as Task 3). The app base64-image lazy-load (`/api/hub-app-images.json` + IntersectionObserver) stays as-is; the core only governs the row data.
- [ ] **Step 2:** For each `kind`, set `window.__hub_<kind> = { host: HUB, collection: SOURCES['hub'+Kind].collection, baseline:<parsed island>, shapeOne: hubShaper[kind] }` and drive `all` via `liveList(...)`. Keep the grid/list `?view` toggle + Load-more getters.
- [ ] **Step 3: Build + browser-verify** all three hub list pages (`/researchhub/articles|datasets|apps/`): baseline paints, live slices `200`, view toggle + load-more intact, images still lazy-load.
- [ ] **Step 4: Commit**
```bash
git add src/lib/live/shapers/hub.ts src/lib/live/shapers/hub.test.ts src/components/researchhub/HubListing.astro
git commit -m "feat(live): researchhub list pages live-on-refresh via shared core"
```

---

## Task 8: Home refactor — `HomeCardNews` + `HomeTabbed` → island + core

**Files:**
- Read first: `src/lib/data.ts:1067-1313` (`HomeData` + `getHome`), `src/components/HomeCardNews.astro`, `src/components/HomeTabbed.astro`, `src/pages/index.astro:12-44`.
- Modify: those three files.

- [ ] **Step 1:** In `index.astro`, emit JSON islands for the home strips (`#home-news`, `#home-funding`, `#home-meetings`, `#home-employment`) from the existing build-time `home.*` arrays (same neutralized JSON-in-HTML pattern as `NewsListing`), keeping the inline server HTML as the `x-show="!ready"` baseline.
- [ ] **Step 2:** Refactor `HomeCardNews` to render via `x-for` over `liveList({ host, collection:'posts', baseline:<#home-news>, shapeOne: shapeNewsListClient, finalize: top-N matching the home count })`. Refactor `HomeTabbed`'s three tabs the same way over `posts`(filtered)/`fundings`/`meetings` — **confirm in Task 1 whether the home "news" cards and tabs each map to a single collection or a filtered slice**; if a strip is a cross-collection composite, give it its own `finalize`/multi-source variant rather than forcing one collection.
- [ ] **Step 3: Build + browser-verify** `/`: each strip's baked baseline paints (view-source contains the items — SiteImprove), then swaps live; layout unchanged at the 5 viewports (VR in Task 12).
- [ ] **Step 4: Commit**
```bash
git add src/pages/index.astro src/components/HomeCardNews.astro src/components/HomeTabbed.astro
git commit -m "feat(live): home news/tabbed strips → island + live-on-refresh"
```

---

## Task 9: `HomeResearch` → live researchhub REST

**Files:**
- Read first: `src/lib/research.ts:151-200` (`getHomeResearch`), `src/components/HomeResearch.astro`, `src/pages/api/home-research.json.ts`.
- Modify: `HomeResearch.astro`; fix the stale comment in `home-research.json.ts`.

- [ ] **Step 1:** Keep `/api/home-research.json` as the **fallback** (spec default). Change the island so `init` first tries live: fetch top-N of each researchhub collection (`articles`/`datasets`/`apps`) via `fetchCollection` + the hub shapers, shape to the strip's `{ img, dateLabel, title, authors, teaser, isNew, fullPath }`, and swap; on failure fall back to the existing `/api/home-research.json` fetch.
- [ ] **Step 2:** Correct the misleading header comment in `home-research.json.ts` ("Live per request; edge-cached 120s" → it is `prerender=true` = baked at build; now a live-island fallback).
- [ ] **Step 3: Build + browser-verify** `/`: research strip shows the live researchhub items; with network to the hub blocked, it falls back to the baked JSON.
- [ ] **Step 4: Commit**
```bash
git add src/components/HomeResearch.astro src/pages/api/home-research.json.ts
git commit -m "feat(live): home Latest Research strip fetches live researchhub REST (baked JSON = fallback)"
```

---

## Task 10: Remaining agency lists — meetings, events, funding, programs

**Files:**
- Read first: `data.ts` shapers — `getFunding`/`FundingListItem` (787-947), `ProgramListItem` (948), `EventListItem` (1314), and the meetings list shaper feeding `MeetingsListing`/`MeetingTable`.
- Create: `src/lib/live/shapers/{meetings,events,funding,programs}.ts` (relocate each, pure; red/green Vitest each).
- Modify: `MeetingTable.astro`, `MeetingsListing.astro`, `EventsListing.astro`, `FundingListing.astro`, `ProgramsListing.astro`.

For EACH of the four surfaces, repeat the Task-6 recipe:
- [ ] **Step 1:** Relocate its shaper into `shapers/<name>.ts` (Vitest red→green: assert the shaped fields the island renders).
- [ ] **Step 2:** Set `window.__<name>` (`{ host, collection, baseline, shapeOne }` from `SOURCES`) and drive `all`/`rows` via `liveList(...)`; keep each island's existing UI getters.
   - Note `MeetingTable`'s row-expand uses `/api/meeting/[slug].json` (baked) for detail — that stays baked until Phase B; only the **list** goes live here.
- [ ] **Step 3:** Build + browser-verify the surface's page; live slices `200`, UI intact.
- [ ] **Step 4:** Commit per surface, e.g. `git commit -m "feat(live): /grants/funding listing live-on-refresh via shared core"`.

---

## Task 11: CSP — allow the live fetches

**Files:**
- Read first: locate the CSP source (`grep -rn "connect-src\|Content-Security-Policy" netlify.toml astro.config.ts src` ).
- Modify: that file.

- [ ] **Step 1:** Add both Strapi hosts to `connect-src` (`https://agency.icjia-api.cloud https://researchhub.icjia-api.cloud`) and `https://researchhub.icjia-api.cloud` (uploads) to `img-src`. If CSP is currently report-only/unset (per the cutover "CSP enforce" TODO), record that these origins are prerequisites for enforce.
- [ ] **Step 2: Build + browser-verify** with CSP active: no `Refused to connect`/`Refused to load image` console violations on any live surface.
- [ ] **Step 3: Commit**
```bash
git add <csp-file>
git commit -m "chore(csp): allow live Strapi connect-src + researchhub img-src for live-islands"
```

---

## Task 12: Phase A deploy-verify gate (acceptance — the gate before Phase B)

Not a code task — the spec-mandated gate. Push the branch, let Netlify build a **preview deploy**, then verify on the **deployed URL** (not `astro dev`, not local preview — checklist v7.3 lesson #2):

- [ ] **Functionless:** Netlify deploy shows **0 functions**; `dist/` has no `.netlify/functions/`.
- [ ] **CORS in the real env:** every live surface's `/count` + slice requests return `200` from the **preview origin** (REST `ACAO:*` — confirms the preview-origin path the spec called out).
- [ ] **Live edit:** edit an existing news post (and one item in each other surface) in Strapi → reload the deployed list/home → the edit appears (~1s, post-paint), **no rebuild**.
- [ ] **Live delete:** unpublish/delete an item → reload → it disappears (this is what signature-swap buys over the old length-test).
- [ ] **Crawlable baseline:** `view-source` of `/`, `/news`, a researchhub list, `/publications` contains the real items (SiteImprove/no-JS view intact).
- [ ] **New-slug boundary:** publish a brand-new item → its **list** shows it on reload, but its new **detail URL** 404s until a rebuild (confirms the Phase 5 webhook is still required; not a Phase A regression).
- [ ] **VR + a11y:** VR sweep (baked baseline vs post-swap) within tolerance at the 5 viewports; axe-core clean after swap on each surface.
- [ ] **Perf:** baseline FCP/LCP unchanged (live fetch is post-paint); full-collection fetch sizes acceptable per surface.

**Gate:** all green → Phase B (detail-page live-render) gets its own plan. Any red → fix before Phase B.

---

## Self-Review (performed)

- **Spec coverage:** live-list core (§4.1) → T4; signature swap + shared shapers (§4.1 upgrades) → T2/T3; REST/host routing (§4.4) → T1/sources.ts; all Phase A surfaces (§5) → T5–T10; home refactor (§5) → T8; HomeResearch repoint + keep fallback (§5, §9 default) → T9; baked baseline preserved (§3.1) → asserted in every browser-verify + T12; REST-only (§3.2) → core uses REST exclusively; images accepted raw (§7) → T6/T8 notes; CSP (§7) → T11; cleanup stale comment (§7) → T9; verification (§7) → T12; new-slug boundary (§3.3) → T12. Phase B (§6) intentionally out of scope (own plan post-gate).
- **Placeholder scan:** the `SOURCES` `// confirm` markers are resolved by Task 1's recon (concrete commands), not hand-waving; no "TBD/add error handling/write tests for the above" left.
- **Type/name consistency:** `fetchCollection`, `liveList`, `contentSignature`, `SOURCES`, `shapeNewsList` used consistently across tasks; shaper modules under `src/lib/live/shapers/`.
- **Open risk flagged inline (T8):** whether each home strip maps to a single collection vs a composite — resolved by Task 1 recon before T8 implements.
