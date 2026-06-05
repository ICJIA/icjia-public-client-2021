/**
 * Funded Program DETAIL shaper — pure, client-safe.
 *
 * Reproduces data.ts's build-time `getProgram` shape so the live-detail fallback
 * can render a brand-new (post-build) program CLIENT-SIDE from the Strapi v3 REST
 * record, byte-identical to the eventual nightly-built page (see
 * docs/LIVE-DETAIL-FALLBACK.md). The Strapi REST `?slug=` record and the GraphQL
 * record carry the same fields programs use (status, category, summary, body,
 * published_at, tags[].title, attachments[] with url/name/ext/size/updated_at, and
 * the Program relations posts/grants), so the same shaping works on both.
 *
 * CLIENT-SAFE: zero server-only imports. `renderToHtml` is INJECTED by the caller
 * (markdown.js at build, markdown.client.js in the browser) so this module never
 * pulls in jsdom. The pure formatters are reused from the (already client-safe,
 * drift-guarded) meeting shaper; the attachment / related ports below are identical
 * to the grant shaper's (which mirror data.ts shapeAttachments + buildRelated).
 *
 * The grant shaper is the closest cousin — a grants-domain detail with a markdown
 * body via the injected renderToHtml. Programs differ only in the page chrome: no
 * expired banner, no NOFO header (the detail markup is otherwise identical to
 * grants/funding/[slug].astro). data.ts's program catLabel is "{CATEGORY} PROGRAM".
 */
import {
  dateFormatAlt,
  niceBytes,
  strapiUrl,
  type MeetingAttachmentItem,
  type MeetingRelatedItem,
} from "./meeting";

// data.ts's AttachmentItem / RelatedItem are structurally identical to the
// meeting (and grant) ones — reuse those shapes.
export type ProgramAttachmentItem = MeetingAttachmentItem;
export type ProgramRelatedItem = MeetingRelatedItem;

export interface ProgramItem {
  id: string;
  slug: string;
  title: string;
  status: string;
  category: string;
  /** uppercase kicker, e.g. "FEDERAL PROGRAM" (legacy BaseCardExpandable). */
  catLabel: string;
  bodyHtml: string;
  summary?: string;
  published_at?: string;
  attachments: ProgramAttachmentItem[];
  related: ProgramRelatedItem[];
  tags: string[];
}

// ── attachments / related (ports of data.ts shapeAttachments + buildRelated) ────

function shapeAttachments(arr?: any[]): ProgramAttachmentItem[] {
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

function buildRelated(content: any): ProgramRelatedItem[] {
  const out: ProgramRelatedItem[] = [];
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

/** data.ts program catLabel: "{CATEGORY} PROGRAM" (uppercase). */
function programCatLabel(category?: string): string {
  return `${String(category || "").toUpperCase()} PROGRAM`;
}

// ── shaper ──────────────────────────────────────────────────────────────────

/**
 * Shape one raw Strapi program (REST `?slug=` OR GraphQL) the way data.ts's
 * build-time getProgram does: "{CATEGORY} PROGRAM" kicker, pre-render the body,
 * shape attachments + related, flatten tags. `render` is the environment's
 * markdown→HTML renderer (markdown.js at build / markdown.client.js in the browser).
 */
export function shapeProgram(p: any, render: (md: string) => string): ProgramItem {
  return {
    id: String(p.id),
    slug: p.slug,
    title: p.title,
    status: p.status ?? "",
    category: p.category ?? "",
    catLabel: programCatLabel(p.category),
    bodyHtml: p.body ? render(p.body) : "",
    summary: p.summary,
    published_at: p.published_at,
    attachments: shapeAttachments(p.attachments),
    related: buildRelated(p),
    tags: Array.isArray(p.tags) ? p.tags.map((t: any) => t.title) : [],
  };
}

// ── LIGHT program list-row shape (live /grants/programs/ listing) ─────────────

/** The row ProgramsListing.astro renders from #programs-data — every field its
 *  cards read (id, category + status the Category/Status toggle getters split on,
 *  catLabel, fullPath, title, bodyHtml, tags, attachments). Mirrors data.ts
 *  `ProgramListItem` / `shapeProgramListItem`.
 *
 *  ONE deviation: `bodyHtml` is NOT pre-rendered here. This module is client-safe
 *  (zero server-only imports, no `window` at import — Node tests + SSR import it),
 *  so it cannot pull in a markdown renderer. It carries the RAW `bodyMd` instead;
 *  ProgramsListing's live swap renders `bodyHtml` via the browser markdown pipeline
 *  (markdown.client.js) after the fetch, byte-identical to the baked rows' build-time
 *  renderToHtml(body). (The cards bind bodyHtml via x-html — see the markdown-in-cards
 *  note in alpine-entry.ts's `funding` fetcher.) */
export interface ProgramRow {
  id: string;
  slug: string;
  title: string;
  fullPath: string;
  status: string;
  category: string;
  catLabel: string;
  /** raw body markdown — rendered to bodyHtml client-side after the swap. */
  bodyMd: string;
  bodyHtml: string;
  summary?: string;
  published_at?: string;
  attachments: ProgramAttachmentItem[];
  tags: string[];
}

/** Shape one raw Strapi v3 REST program → the ProgramRow the live listing swaps in
 *  (so a post-build program appears in the list without a rebuild). No filter —
 *  getAllPrograms selects all `programs`; the Category/Status toggles filter
 *  client-side off the row's category + status fields. */
export function shapeProgramRow(p: any): ProgramRow {
  return {
    id: String(p.id),
    slug: p.slug,
    title: p.title,
    fullPath: `/grants/programs/${p.slug}/`,
    status: p.status ?? "",
    category: p.category ?? "",
    catLabel: programCatLabel(p.category),
    bodyMd: p.body ?? "",
    bodyHtml: "",
    summary: p.summary,
    published_at: p.published_at,
    attachments: shapeAttachments(p.attachments),
    tags: Array.isArray(p.tags) ? p.tags.map((t: any) => t.title) : [],
  };
}
