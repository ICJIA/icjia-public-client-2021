/**
 * @astrojs/alpinejs entrypoint — registers live-island Alpine.data() components.
 *
 * Wired via astro.config.ts:  alpinejs({ entrypoint: '/src/lib/live/alpine-entry' })
 *
 * CLIENT-SAFE: every import is browser-safe (no node:*, no astro:assets, no
 * server-only modules). All shared live cores (fetchCollection, contentSignature,
 * shapeNewsRow) live in lib/live/* which already carry the client-safe guarantee.
 */
import type { Alpine as AlpineType } from 'alpinejs';
import { fetchCollection } from './live-list';
import { shapeNewsRow } from './shapers/news';
import { shapeMeetingRow } from './shapers/meeting';
import { SOURCES } from './sources';

const NEWS_PER_PAGE = 15;

export default (Alpine: AlpineType) => {
  /**
   * Live-row fetchers for listing islands whose logic is INLINE x-data (they can't
   * import modules). Each returns fresh Strapi rows (or null on failure → the island
   * keeps its baked baseline). The island's init() calls window.__liveRows.<key>()
   * and swaps its list, so a post-build item appears in the LIST without a rebuild.
   * The shared cores stay in modules (fetchCollection + the shapers); this only
   * EXPOSES them (it does NOT re-inline the core — see checklist v7.4 #1).
   */
  (window as any).__liveRows = {
    meetings: () =>
      fetchCollection(SOURCES.meetings.host, SOURCES.meetings.collection, shapeMeetingRow),
  };

  /**
   * newsLive(baselineElId)
   *
   * Registered as `x-data="newsLive('news-data')"` on the NewsListing container.
   *
   * Baseline data layout (JSON island #news-data):
   *   - Already featured-excluded: the SSR frontmatter passes items.slice(1)
   *   - Shape: { p, t, s, cl, c, d, b, n, img } — no id/updatedAt (no sig fields)
   *
   * Live-fetch layout (shapeNewsRow via fetchCollection):
   *   - FULL set including the featured post at index 0
   *   - Shape: { id, updatedAt, p, t, s, cl, c, d, b, n, img }
   *   - Must be sorted newest-first then sliced at index 1 to exclude featured
   *
   * State provided by the factory:
   *   rows       — shaped rows (baseline on mount; swapped to live data after fetch)
   *   ready      — false until init() fires; controls SSR↔interactive flip
   *   live       — true once a live fetch completes (regardless of swap)
   *   cat/page/perPage — filter + pagination UI state
   *
   * The factory owns init() directly (rather than delegating to liveList) because
   * the news live path requires a news-specific finalize (sort + .slice(1) to
   * exclude featured) that must only apply to the live-fetched set — the baseline
   * is already sorted + featured-excluded by SSR.
   */
  Alpine.data('newsLive', (baselineElId: string) => ({
    rows: JSON.parse(
      (document.getElementById(baselineElId) as HTMLElement).textContent ?? '[]',
    ) as any[],
    ready: false,
    live: false,

    init(this: any) {
      this.ready = true;
      // LIVE ISLAND: fetch /posts via the shared fetchCollection + shapeNewsRow,
      // sort newest-first by the ISO publication date (pd — NOT the display string),
      // and drop index 0 (the featured post, rendered separately by the SSR card).
      // Live data is authoritative on a single fetch-per-load island, so we take it
      // directly; Alpine's keyed x-for (:key="it.p") diffs efficiently, making a
      // content-signature guard redundant here (contentSignature stays in lib/live
      // for a future polling variant). Falls back silently on network/parse failure
      // (the baked SSR baseline stays visible).
      fetchCollection(
        SOURCES.news.host,
        SOURCES.news.collection,
        shapeNewsRow,
      )
        .then((fetched) => {
          if (!fetched || !fetched.length) return;
          const next = fetched
            .slice()
            .sort((a, b) => String(b.pd || '').localeCompare(String(a.pd || '')))
            .slice(1); // exclude featured (most-recent, index 0)
          if (next.length) this.rows = next;
          this.live = true;
        })
        .catch(() => {});
    },

    // ── UI state ────────────────────────────────────────────────────────────────
    cat: 'all' as string,
    page: 1,
    perPage: NEWS_PER_PAGE,

    // ── Getters ─────────────────────────────────────────────────────────────────
    get filtered() {
      return this.cat === 'all'
        ? this.rows
        : this.rows.filter((x: any) => x.c === this.cat);
    },
    get totalPages() {
      return Math.max(1, Math.ceil((this.filtered as any[]).length / this.perPage));
    },
    get pageItems() {
      const s = (this.page - 1) * this.perPage;
      return (this.filtered as any[]).slice(s, s + this.perPage);
    },
    get pageGroups() {
      const g: Record<string, any[]> = { this: [], last: [], earlier: [] };
      (this.pageItems as any[]).forEach((it) => g[it.b].push(it));
      return (
        [
          ['this', 'This Month'],
          ['last', 'Last Month'],
          ['earlier', 'Earlier'],
        ] as const
      )
        .filter(([k]) => g[k].length)
        .map(([k, l]) => ({ label: l, items: g[k] }));
    },
    get empty() {
      return (this.filtered as any[]).length === 0;
    },

    // ── Methods ──────────────────────────────────────────────────────────────────
    pages(): (number | string)[] {
      const n = this.totalPages;
      const c = this.page;
      const win = 7;
      const o: (number | string)[] = [];
      if (n <= win) {
        for (let p = 1; p <= n; p++) o.push(p);
        return o;
      }
      const h = Math.floor(win / 2);
      let lo = Math.max(1, c - h);
      let hi = Math.min(n, c + h);
      if (c - h < 1) hi = win;
      if (c + h > n) lo = n - win + 1;
      if (lo > 1) {
        o.push(1);
        if (lo > 2) o.push('…');
      }
      for (let p = lo; p <= hi; p++) o.push(p);
      if (hi < n) {
        if (hi < n - 1) o.push('…');
        o.push(n);
      }
      return o;
    },
    setCat(c: string) {
      this.cat = c;
      this.page = 1;
      this.scrollList();
    },
    go(p: number | string) {
      if (p === '…' || (p as number) < 1 || (p as number) > this.totalPages) return;
      this.page = p as number;
      this.scrollList();
    },
    scrollList() {
      this.$nextTick(() => {
        const el = this.$refs['list'] as HTMLElement | undefined;
        if (el) {
          const t = el.getBoundingClientRect().top + window.pageYOffset - 130;
          window.scrollTo({ top: Math.max(0, t), behavior: 'smooth' });
        }
      });
    },
  }));
};
