/**
 * Event DETAIL shaper — pure, client-safe.
 *
 * Reproduces data.ts's build-time `getEvent` shaping so the live-detail fallback
 * can render a brand-new (post-build) event CLIENT-SIDE from the Strapi v3 REST
 * record, byte-identical to the eventual nightly-built page (see
 * docs/LIVE-DETAIL-FALLBACK.md). The Strapi REST `?slug=` record and the GraphQL
 * record carry the same fields events use (name, category, slug, timed, start/end,
 * summary, details, tags[].title, meetings[]/posts[] relations), so the same
 * shaping works on both.
 *
 * CLIENT-SAFE: zero server-only imports. `renderToHtml` is INJECTED by the caller
 * (markdown.js at build, markdown.client.js in the browser) so this module never
 * pulls in jsdom. The pure date formatters below are duplicated from data.ts and
 * locked to the originals by shapers/event.test.ts — they cannot silently diverge.
 *
 * Date wording is the legacy EventsAll.getRange() form (America/Chicago, full month
 * name, h:mm a) — DELIBERATELY different from meetingDateLine, so events do NOT
 * reuse the meeting shaper's helpers; they get their own drift-guarded port.
 */

export interface EventRelatedItem {
  displayTitle: string;
  fullPath: string;
}
export interface EventItem {
  id: string;
  name: string;
  slug: string;
  fullPath: string;
  category?: string;
  summary?: string;
  start?: string;
  end?: string;
  timed: boolean;
  rangeLine: string;
  bodyHtml: string;
  related: EventRelatedItem[];
  tags: string[];
  published_at?: string;
}

// ── pure formatters (duplicated from data.ts; guarded by event.test.ts) ──────

// Chicago-tz parts with FULL month name + numeric pieces, for the legacy
// EventsAll.getRange() format strings.
function chicagoEventParts(iso: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(iso));
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    month: g("month"),
    day: g("day"),
    year: g("year"),
    hour: g("hour"),
    minute: g("minute"),
    dayPeriod: g("dayPeriod").toLowerCase().replace(/\./g, ""),
  };
}
// Chicago-local calendar-day difference (legacy dayjs diff in days, both tz'd).
function chicagoDayDiff(start: string, end: string): number {
  const dayMs = 86_400_000;
  const toChicagoMidnight = (iso: string): number => {
    const p = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(iso));
    const g = (t: string) => Number(p.find((x) => x.type === t)?.value);
    return Date.UTC(g("year"), g("month") - 1, g("day"));
  };
  return Math.floor((toChicagoMidnight(end) - toChicagoMidnight(start)) / dayMs);
}

/**
 * Legacy EventsAll.getRange(start, end, timed) — PLAIN-TEXT form. America/Chicago,
 * three branches:
 *   timed + same day  → "h:mm a to h:mm a | MMMM DD, YYYY"
 *   !timed + same day → "All Day | MMMM DD, YYYY"
 *   multi-day         → "MMMM D through MMMM D, YYYY"
 * (Differs from meetingDateLine — DO NOT reuse.)
 */
export function eventRangeLine(
  start?: string,
  end?: string,
  timed?: boolean,
): string {
  if (!start || !end) return "";
  const s = chicagoEventParts(start);
  const e = chicagoEventParts(end);
  const days = chicagoDayDiff(start, end);
  const time = (p: ReturnType<typeof chicagoEventParts>) =>
    `${p.hour}:${p.minute} ${p.dayPeriod}`;
  const padDay = (d: string) => (d.length < 2 ? "0" + d : d);
  if (days === 0 && timed) {
    return `${time(s)} to ${time(e)} | ${s.month} ${padDay(s.day)}, ${s.year}`;
  }
  if (days === 0 && !timed) {
    return `All Day | ${s.month} ${padDay(s.day)}, ${s.year}`;
  }
  return `${s.month} ${s.day} through ${e.month} ${e.day}, ${e.year}`;
}

// Faithful port of data.ts's buildRelated — "[Type]: title" links per relation
// kind, sorted by displayTitle. An event record carries meetings[]/posts[] (and
// the helper safely no-ops on the other arrays it may never see).
export function buildRelated(content: any): EventRelatedItem[] {
  const out: EventRelatedItem[] = [];
  const push = (arr: any, type: string, base: string) => {
    if (Array.isArray(arr))
      arr.forEach((e: any) =>
        out.push({ displayTitle: `[${type}]: ${e.title}`, fullPath: `${base}${e.slug}/` }),
      );
  };
  push(content?.events, "Event", "/events/");
  push(content?.meetings, "Meeting", "/news/meetings/");
  push(content?.posts, "News", "/news/");
  push(content?.grants, "Funding", "/grants/funding/");
  push(content?.programs, "Program", "/grants/programs/");
  push(content?.biographies, "Biography", "/about/biographies/");
  return out.sort((a, b) => a.displayTitle.localeCompare(b.displayTitle));
}

const eventTags = (x: any): string[] =>
  Array.isArray(x?.tags) ? x.tags.map((t: any) => t.title) : [];

// ── shaper ──────────────────────────────────────────────────────────────────

/**
 * Shape one raw Strapi event (REST `?slug=` OR GraphQL) the way data.ts's
 * build-time getEvent does: compute the Chicago range line, build the related
 * list, and pre-render the body from `details || summary`. `render` is the
 * environment's markdown→HTML renderer (markdown.js at build / markdown.client.js
 * in the browser).
 */
export function shapeEvent(
  e: any,
  render: (md: string) => string,
  renderInline: (md: string) => string,
): EventItem {
  const bodySource = e.details || e.summary || "";
  return {
    id: String(e.id),
    // name renders via set:html (EventCard) — sanitize inline like the build's
    // calendar feed does (renderInline); raw CMS HTML otherwise = stored XSS.
    name: e.name ? renderInline(e.name) : e.name,
    slug: e.slug,
    fullPath: `/events/${e.slug}/`,
    category: e.category,
    summary: e.summary,
    start: e.start,
    end: e.end,
    timed: !!e.timed,
    rangeLine: eventRangeLine(e.start, e.end, !!e.timed),
    bodyHtml: bodySource ? render(bodySource) : "",
    related: buildRelated(e),
    tags: eventTags(e),
    published_at: e.published_at,
  };
}

// ── LIGHT list-row shape (live listing) ───────────────────────────────────────

// Chicago-local day key (YYYY-MM-DD) for an ISO instant — the SAME helper inlined
// in EventsListing.astro's frontmatter (en-CA → ISO-ordered parts). Buckets an
// event into its America/Chicago calendar day. Pure + client-safe.
function chiDayKey(iso?: string): string {
  if (!iso) return "";
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("year")}-${g("month")}-${g("day")}`;
}

/** The COMPACT row EventsListing.astro renders from #events-data — the short-key
 *  island shape its `x-data` builds from each EventListItem and its x-for / `shown`
 *  getter read (p=fullPath, n=name, c=category, r=rangeLine, s=summary, t=tags,
 *  sd/ed=Chicago day-keys, end=end ISO). `id` is NOT read by the template
 *  (x-for keys on `p`) but IS required by fetchCollection (de-dupes on it). */
export interface EventRow {
  id: string;
  p: string;
  /** rendered/sanitized name (filled by the events fetcher's renderInline swap;
   *  empty out of shapeEventRow, which carries the raw name as `nameRaw`). */
  n: string;
  /** raw CMS name — the fetcher renders it into `n` via renderInline (the list
   *  binds `n` via x-html, so it MUST be sanitized before reaching the DOM). */
  nameRaw: string;
  c: string;
  r: string;
  s: string;
  t: string[];
  sd: string;
  ed: string;
  end: string;
}

/** Shape one raw Strapi v3 REST event → the compact EventRow the live listing
 *  swaps into `this.all` (so a post-build event appears in the LIST without a
 *  rebuild). Mirrors EventsListing.astro's build-time `listData.map` exactly,
 *  reusing the drift-guarded eventRangeLine (the calendar grid keeps its baked
 *  #calendar-data feed — only the events-only LIST is swapped). */
export function shapeEventRow(e: any): EventRow {
  return {
    id: String(e.id),
    p: `/events/${e.slug}/`,
    // `n` (bound via x-html) is rendered/sanitized by the events fetcher's
    // renderInline swap (alpine-entry.ts); shapeEventRow can't render here (it's
    // called by fetchCollection with no injected renderer), so carry the raw name.
    n: "",
    nameRaw: e.name ?? "",
    c: e.category ?? "",
    r: eventRangeLine(e.start, e.end, !!e.timed),
    s: e.summary ?? "",
    t: eventTags(e),
    sd: chiDayKey(e.start),
    ed: chiDayKey(e.end || e.start),
    end: e.end ?? "",
  };
}
