/**
 * Employment (job) DETAIL shaper — pure, client-safe.
 *
 * Reproduces data.ts's build-time `getJob()` / `shapeJobList()` shape so the
 * live-detail fallback can render a brand-new (post-build) job CLIENT-SIDE from the
 * Strapi v3 REST record, byte-identical to the eventual nightly-built page (see
 * docs/LIVE-DETAIL-FALLBACK.md). The Strapi REST `?slug=` record and the GraphQL
 * record carry the same fields jobs use (category, summary, body, start/end,
 * published_at, tags[].title, attachments[] with url/name/ext/size/updated_at,
 * external[] with title/url, and related `posts`), so the same shaping works on both.
 *
 * CLIENT-SAFE: zero server-only imports. `renderToHtml` is INJECTED by the caller
 * (markdown.js at build, markdown.client.js in the browser) so this module never
 * pulls in jsdom. The pure formatters are reused from the (already client-safe,
 * drift-guarded) meeting shaper / format.ts; the one job-specific formatter
 * (employmentCategoryLabel) and isExpired are duplicated from data.ts and locked to
 * the originals by shapers/job.test.ts so they cannot silently diverge.
 */
import { formatNewsDate } from "./format";
import {
  dateFormatAlt,
  niceBytes,
  strapiUrl,
  type MeetingAttachmentItem,
  type MeetingExternalItem,
  type MeetingRelatedItem,
} from "./meeting";

// data.ts's AttachmentItem / MeetingExternalItem / RelatedItem are structurally
// identical to the meeting shaper's shapes (same fields).
export type JobAttachmentItem = MeetingAttachmentItem;
export type JobExternalItem = MeetingExternalItem;
export type JobRelatedItem = MeetingRelatedItem;

export interface JobItem {
  id: string;
  slug: string;
  title: string;
  fullPath: string;
  category: string;
  /** "{CAT} EMPLOYMENT" — uppercase label + " EMPLOYMENT" (legacy kicker). */
  catLabel: string;
  summaryHtml: string;
  /** "Posted {date}" (legacy `format(start)`). */
  postedLine: string;
  start?: string;
  end?: string;
  published_at?: string;
  expired: boolean;
  /** "Accepting applications through {date}" — only when not expired + dates. */
  acceptingLine: string;
  /** "Expired: {dateFormatAlt(end)}" — the expired chip. */
  expiredChip: string;
  endMs: number;
  bodyHtml: string;
  tags: string[];
  attachments: JobAttachmentItem[];
  external: JobExternalItem[];
  /** related News only — "Related ICJIA Content" heading (legacy JobCard). */
  related: JobRelatedItem[];
}

// ── pure formatters (duplicated from data.ts; guarded by shapers/job.test.ts) ──

const EMPLOYMENT_LABELS: Record<string, string> = {
  contract: "Contract",
  fullTime: "Full Time",
  internship: "Internship",
  partTime: "Part Time",
};
/** Employment category → label (data.ts employmentCategoryLabel). */
export function employmentCategoryLabel(cat?: string): string {
  return (cat && EMPLOYMENT_LABELS[cat]) || "Undefined";
}

/** Expired = now is past end-of-(end-date) (legacy adds one day to `end`). */
export function isExpired(end?: string): boolean {
  if (!end) return false;
  const exp = new Date(end);
  if (Number.isNaN(exp.getTime())) return false;
  exp.setDate(exp.getDate() + 1);
  return Date.now() > exp.getTime();
}

// ── attachments / related (ports of data.ts shapeAttachments + getJob's related) ──

function shapeAttachments(arr?: any[]): JobAttachmentItem[] {
  return (Array.isArray(arr) ? [...arr] : [])
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
    .map((a) => ({
      name: a.name,
      url: strapiUrl(a.url) || a.url,
      ext: (a.ext || "").replace(/^\./, "").toLowerCase(),
      niceSize: niceBytes(a.size),
      updatedAlt: dateFormatAlt(a.updated_at),
    }));
}

// getJob wires RelatedList off the job's relations; the single query returns only
// `posts`, so related is News-only (heading "Related ICJIA Content"), sorted by title.
function buildRelated(j: any): JobRelatedItem[] {
  return (Array.isArray(j.posts) ? j.posts : [])
    .map((p: any) => ({
      displayTitle: `[News]: ${p.title}`,
      fullPath: `/news/${p.slug}/`,
    }))
    .sort((a: JobRelatedItem, b: JobRelatedItem) =>
      a.displayTitle.localeCompare(b.displayTitle),
    );
}

// ── shaper ──────────────────────────────────────────────────────────────────

/**
 * Shape one raw Strapi job (REST `?slug=` OR GraphQL) the way data.ts's build-time
 * getJob / shapeJobList does: uppercase category + " EMPLOYMENT" kicker,
 * "Posted {format(start)}" line, accepting/expired states keyed off isExpired(end),
 * pre-render the body, shape attachments + external + related, flatten tags.
 * `render` is the environment's markdown→HTML renderer (markdown.js at build /
 * markdown.client.js in the browser).
 */
export function shapeJob(j: any, render: (md: string) => string): JobItem {
  const catLabel = `${employmentCategoryLabel(j.category).toUpperCase()} EMPLOYMENT`;
  const expired = isExpired(j.end);
  const external: JobExternalItem[] = Array.isArray(j.external)
    ? j.external
        .filter((e: any) => e && e.url)
        .map((e: any) => ({ title: e.title || e.url, url: e.url }))
    : [];
  return {
    id: String(j.id),
    slug: j.slug,
    title: j.title,
    fullPath: `/about/employment/${j.slug}/`,
    category: j.category ?? "",
    catLabel,
    summaryHtml: j.summary ? render(j.summary) : "",
    postedLine: j.start ? `Posted ${formatNewsDate(j.start)}` : "",
    start: j.start,
    end: j.end,
    published_at: j.published_at,
    expired,
    acceptingLine:
      !expired && j.start && j.end
        ? `Accepting applications through ${formatNewsDate(j.end)}`
        : "",
    expiredChip: expired ? `Expired: ${dateFormatAlt(j.end)}` : "",
    endMs: j.end ? new Date(j.end).getTime() : 0,
    bodyHtml: j.body ? render(j.body) : "",
    tags: Array.isArray(j.tags) ? j.tags.map((t: any) => t.title) : [],
    attachments: shapeAttachments(j.attachments),
    external,
    related: buildRelated(j),
  };
}

// ── LIGHT list-row shape (live /about/employment/ listing) ────────────────────

/** The row EmploymentListing.astro renders from #jobs-data — every field its cards
 *  read (p, t, cl, posted, accepting, expired, expiredChip, s) plus the `expired`
 *  flag the Current/Expired tab getter splits on. Mirrors data.ts `shapeJobList`'s
 *  display fields (the listData map in EmploymentListing).
 *
 *  ONE deviation: `s` (summaryHtml) is NOT pre-rendered here. This module is client-
 *  safe (zero server-only imports, no `window` at import — Node tests + SSR import
 *  it), so it cannot pull in a markdown renderer. It carries the RAW `summaryMd`
 *  instead; EmploymentListing's live swap renders `s` via the browser markdown
 *  pipeline (markdown.client.js) after the fetch, byte-identical to the baked rows'
 *  build-time renderToHtml(summary). */
export interface JobRow {
  /** fullPath (the list's `:key` + card link). */
  p: string;
  /** title. */
  t: string;
  /** catLabel kicker. */
  cl: string;
  /** "Posted {date}" line. */
  posted: string;
  /** "Accepting applications through {date}" line. */
  accepting: string;
  expired: boolean;
  expiredChip: string;
  /** raw summary markdown — rendered to the `s` HTML client-side after the swap. */
  summaryMd: string;
  /** summary HTML (filled by the live swap; empty here). */
  s: string;
  /** end-date ms (server already sorts end:desc; kept for parity with shapeJobList). */
  endMs: number;
}

/** Shape one raw Strapi v3 REST job → the compact JobRow the live listing swaps in
 *  (so a post-build job appears in the list without a rebuild). Mirrors the exact
 *  field shape EmploymentListing's listData map builds. */
export function shapeJobRow(j: any): JobRow {
  const catLabel = `${employmentCategoryLabel(j.category).toUpperCase()} EMPLOYMENT`;
  const expired = isExpired(j.end);
  return {
    p: `/about/employment/${j.slug}/`,
    t: j.title,
    cl: catLabel,
    posted: j.start ? `Posted ${formatNewsDate(j.start)}` : "",
    accepting:
      !expired && j.start && j.end
        ? `Accepting applications through ${formatNewsDate(j.end)}`
        : "",
    expired,
    expiredChip: expired ? `Expired: ${dateFormatAlt(j.end)}` : "",
    summaryMd: j.summary ?? "",
    s: "",
    endMs: j.end ? new Date(j.end).getTime() : 0,
  };
}
