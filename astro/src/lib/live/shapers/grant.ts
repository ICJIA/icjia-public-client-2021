/**
 * Grant / funding (NOFO) DETAIL shaper — pure, client-safe.
 *
 * Reproduces data.ts's build-time `getGrant()` shape so the live-detail fallback
 * can render a brand-new (post-build) funding opportunity CLIENT-SIDE from the
 * Strapi v3 REST record, byte-identical to the eventual nightly-built page (see
 * docs/LIVE-DETAIL-FALLBACK.md). The Strapi REST `?slug=` record and the GraphQL
 * record carry the same fields grants use (category, summary, start/end,
 * published_at, body, tags[].title, attachments[] with url/name/ext/size/updated_at,
 * and the related relations events/meetings/posts/grants/programs/biographies), so
 * the same shaping works on both.
 *
 * CLIENT-SAFE: zero server-only imports. `renderToHtml` is INJECTED by the caller
 * (markdown.js at build, markdown.client.js in the browser) so this module never
 * pulls in jsdom. The pure formatters are either reused from the (already client-
 * safe, drift-guarded) meeting shaper / format.ts, or — for the two grant-specific
 * ones (fundingCategoryLabel, isExpired) — duplicated from data.ts and locked to
 * the originals by shapers/grant.test.ts so they cannot silently diverge.
 */
import { formatNewsDate } from "./format";
import {
  dateFormatAlt,
  niceBytes,
  strapiUrl,
  type MeetingAttachmentItem,
  type MeetingRelatedItem,
} from "./meeting";

// Reuse the meeting shaper's identical attachment/related shapes (same fields).
export type GrantAttachmentItem = MeetingAttachmentItem;
export type GrantRelatedItem = MeetingRelatedItem;

export interface GrantItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  catLabel: string;
  bodyHtml: string;
  summary?: string;
  start?: string;
  end?: string;
  published_at?: string;
  isExpired: boolean;
  /** formatNewsDate(end) — for the "Expired on …" banner. */
  endFormatted: string;
  attachments: GrantAttachmentItem[];
  related: GrantRelatedItem[];
  tags: string[];
}

// ── pure formatters (duplicated from data.ts; guarded by shapers/grant.test.ts) ──

/** Funding category → label (data.ts fundingCategoryLabel). */
export function fundingCategoryLabel(cat?: string): string {
  if (cat === "nofo") return "Notice of Funding Opportunity";
  if (cat === "rfi") return "Request for Information";
  return "";
}

/** Expired = now is past end-of-(end-date) (legacy adds one day to `end`). */
export function isExpired(end?: string): boolean {
  if (!end) return false;
  const exp = new Date(end);
  if (Number.isNaN(exp.getTime())) return false;
  exp.setDate(exp.getDate() + 1);
  return Date.now() > exp.getTime();
}

// ── attachments / related (ports of data.ts shapeAttachments + buildRelated) ────

function shapeAttachments(arr?: any[]): GrantAttachmentItem[] {
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

function buildRelated(content: any): GrantRelatedItem[] {
  const out: GrantRelatedItem[] = [];
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

// ── shaper ──────────────────────────────────────────────────────────────────

/**
 * Shape one raw Strapi grant (REST `?slug=` OR GraphQL) the way data.ts's
 * build-time getGrant does: uppercase NOFO/RFI label, pre-render the body, shape
 * attachments + related, flatten tags. `render` is the environment's markdown→HTML
 * renderer (markdown.js at build / markdown.client.js in the browser).
 */
export function shapeGrant(g: any, render: (md: string) => string): GrantItem {
  return {
    id: String(g.id),
    slug: g.slug,
    title: g.title,
    category: g.category ?? "",
    catLabel: fundingCategoryLabel(g.category).toUpperCase(),
    bodyHtml: g.body ? render(g.body) : "",
    summary: g.summary,
    start: g.start,
    end: g.end,
    published_at: g.published_at,
    isExpired: isExpired(g.end),
    endFormatted: formatNewsDate(g.end),
    attachments: shapeAttachments(g.attachments),
    related: buildRelated(g),
    tags: Array.isArray(g.tags) ? g.tags.map((t: any) => t.title) : [],
  };
}
