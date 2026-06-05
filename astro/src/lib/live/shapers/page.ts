/**
 * Generic CMS PAGE detail shaper — pure, client-safe.
 *
 * Reproduces data.ts's build-time `getPage()` SHAPE so the live-detail fallback can
 * render a brand-new (post-build) CMS page CLIENT-SIDE from the Strapi v3 REST
 * record, byte-identical to the eventual nightly-built page except for the splash
 * hero (astro:assets) + clickthrough icons (astro-icon) — see
 * docs/LIVE-DETAIL-FALLBACK.md §4. ONE shape serves all four section catch-alls
 * (/about/<slug>, /grants/<slug>, /irb/<slug>, /innovation-and-digital-services/
 * <slug>): they all resolve the single Strapi `pages` collection by slug through
 * `getPage()` and render the SAME <BasePage> component, so one shaper covers them
 * all. The REST `?slug=` record and the GraphQL record carry the same fields pages
 * use (title, body, summary, showTOC, hideTitle, attachmentLabel, attachments[]
 * with url/name/ext/size/updated_at, clickthrough[] {title,teaser,icon,url,
 * datePosted}, splash, tags[].title, published_at), so the same shaping works on both.
 *
 * CLIENT-SAFE: zero server-only imports (no data.ts → it pulls gql-client +
 * markdown.js/jsdom; no astro:assets). The markdown renderers are INJECTED by the
 * caller: `render` (renderToHtml — body + clickthrough teasers) AND `renderInline`
 * (the title), both from markdown.js at build / markdown.client.js in the browser.
 * getPage uses renderInline for `titleHtml` (an <h1 set:html>) so a block render's
 * <p> wrapper doesn't produce invalid <h1><p>…</p></h1>; the twin must match, so the
 * inline renderer is injected too (the grant pattern's body-only single `render` did
 * not need it). buildToc uses the global `DOMParser` at call time — native in the
 * browser, linkedom-shimmed in Node (the parity test imports markdown.js to install
 * it), so this module pulls in no jsdom.
 *
 * `shapeAttachments` + the AttachmentItem shape are DUPLICATED from the meeting
 * shaper's identical helpers (re-used by import) so they cannot drift; `buildToc`
 * is a faithful port of data.ts's buildToc, locked to it by shapers/page.test.ts.
 */
import {
  dateFormatAlt,
  niceBytes,
  strapiUrl,
  type MeetingAttachmentItem,
} from "./meeting";
import { safeUrl } from "../safe-url";

// data.ts's AttachmentItem is structurally identical to the meeting one.
export type PageAttachmentItem = MeetingAttachmentItem;

/** Minimal splash passthrough — only the fields the twin's Splash markup reads.
 *  Typed locally (not data.ts's server-only StrapiImage) to stay client-safe. */
export interface PageSplash {
  url?: string;
  alternativeText?: string;
  caption?: string;
  [k: string]: any;
}

export interface PageTocItem {
  /** anchor id (markdown-it-anchor slug) — scroll target is `#${id}`. */
  id: string;
  /** heading text. */
  text: string;
}

export interface PageClickthrough {
  title?: string;
  teaser?: string;
  /** teaser markdown rendered + sanitized via the injected renderToHtml. */
  teaserHtml: string;
  icon?: string;
  url?: string;
  datePosted?: string;
}

/** Mirror of data.ts `CmsPage` (the subset BasePage.astro renders). */
export interface PageItem {
  title: string;
  /** title rendered as INLINE markdown (renderInline) — goes inside an <h1>. */
  titleHtml: string;
  hideTitle: boolean;
  summary?: string;
  /** body markdown rendered + sanitized via the injected renderToHtml. */
  safeBodyHtml: string;
  showTOC?: boolean;
  /** AttachmentList heading; "" → "Attachments" (legacy default). */
  attachmentLabel: string;
  attachments: PageAttachmentItem[];
  clickthrough: PageClickthrough[];
  splash: PageSplash | null;
  /** h2 anchors for the on-page TOC (legacy Toc: h2[id] not under #disclaimer). */
  toc: PageTocItem[];
  tags: string[];
  published_at?: string;
}

// ── attachments (port of data.ts shapeAttachments — reuses the meeting helpers) ──

function shapeAttachments(arr?: any[]): PageAttachmentItem[] {
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

// ── TOC (faithful port of data.ts buildToc; guarded by shapers/page.test.ts) ─────

/**
 * Build the legacy Toc list from rendered body HTML: every <h2> that is NOT inside
 * #disclaimer, in document order, as {id (markdown-it-anchor slug), text}. Mirrors
 * data.ts buildToc → Toc.vue setToc()/closest("#disclaimer"). Uses the global
 * DOMParser (native in the browser; linkedom in Node).
 */
function buildToc(html: string): PageTocItem[] {
  if (!html) return [];
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return Array.from(doc.querySelectorAll("h2"))
      .filter((h2: any) => !h2.closest("#disclaimer"))
      .map((h2: any) => ({
        id: h2.getAttribute("id") || "",
        text: (h2.textContent || "").trim(),
      }))
      .filter((t: PageTocItem) => t.text.length > 0);
  } catch {
    return [];
  }
}

// ── shaper ──────────────────────────────────────────────────────────────────

/**
 * Shape one raw Strapi page (REST `?slug=` OR GraphQL) the way data.ts's build-time
 * getPage does: inline-render the title, render+sanitize the body, build the TOC from
 * the rendered body, render each clickthrough teaser, shape attachments, flatten tags.
 *
 * @param render        renderToHtml — body + clickthrough teasers (block markdown).
 * @param renderInline  renderInline — the title (no <p> wrapper, for the <h1>).
 */
export function shapePage(
  p: any,
  render: (md: string) => string,
  renderInline: (md: string) => string,
): PageItem {
  const safeBodyHtml = p.body ? render(p.body) : "";
  return {
    title: p.title,
    titleHtml: p.title ? renderInline(p.title) : "",
    hideTitle: !!p.hideTitle,
    summary: p.summary,
    safeBodyHtml,
    showTOC: p.showTOC,
    attachmentLabel: p.attachmentLabel || "Attachments",
    attachments: shapeAttachments(p.attachments),
    clickthrough: Array.isArray(p.clickthrough)
      ? p.clickthrough.map((c: any) => ({
          title: c.title,
          teaser: c.teaser,
          teaserHtml: c.teaser ? render(c.teaser) : "",
          icon: c.icon,
          // clickthrough[].url reaches an href — scheme-guard before render.
          url: safeUrl(c.url),
          datePosted: c.datePosted,
        }))
      : [],
    splash: (p.splash as PageSplash) || null,
    toc: buildToc(safeBodyHtml),
    tags: Array.isArray(p.tags) ? p.tags.map((t: any) => t.title) : [],
    published_at: p.published_at,
  };
}
