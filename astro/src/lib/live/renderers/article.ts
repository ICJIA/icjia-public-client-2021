/**
 * ResearchHub ARTICLE detail twin renderer — pure, client-safe.
 *
 * Produces the same HTML as researchhub/articles/[slug].astro's content — i.e. the
 * <ArticleView> component (which itself composes <ArticleToc>, <MarkerExternal> and
 * <InfoBlock>) — for the live-detail fallback. Locked to the real components by
 * renderers/article.parity.test.ts (Astro Container API), so it cannot drift. See
 * docs/LIVE-DETAIL-FALLBACK.md.
 *
 * `item.bodyHtml` / `item.abstract` / `item.citation` are already sanitized
 * (DOMPurify, via the injected renderToHtml in the shaper) and are emitted RAW,
 * exactly as the component's `set:html` does. Every other interpolated value is
 * HTML-escaped, matching Astro's auto-escaping.
 *
 * OMITTED (intentionally, per spec): the ScholarlyArticle JSON-LD <script>, the
 * footnote-scroll / print-helper inline <script>s, and the component's scoped
 * <style> (splash heights + grid) — none affect the rendered content markup. The
 * parity test slices the real component before the JSON-LD script to match.
 *
 * HERO (§4): on the transient client render imgPath is null and splash is the raw
 * base64 data-URI → the component renders its SPLASH-ISLAND branch (a tiny JSON
 * <script> + an Alpine <img :src>), which is fully reproducible client-side (no
 * astro:assets), so the hero is byte-matched here.
 */
import type { ArticleItem } from "../shapers/article";

// Text-node escape — matches Astro's auto-escaping of {expr} text content, which
// escapes & < > " AND ' (e.g. an author bio "ICJIA's …" → "ICJIA&#39;s …").
const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Attribute-VALUE escape — matches Astro's serialization of a dynamic string
// attribute, which escapes only & and " (a double-quoted attribute value may
// contain raw < and >, per HTML; Astro leaves them). Used for the JS-expression
// attributes (x-data / onclick) whose bodies contain `=>` arrows — escaping `>`
// there (as the text esc does) would diverge from the real component.
const escAttr = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");

// Mirror of ArticleView.astro's DOI escape (adds the &#39; for ' — set:html splice).
const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Download SVG (arrow-down) — identical markup in both download buttons.
const DL_SVG =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M5 20h14v-2H5m14-9h-4V3H9v6H5l7 7 7-7Z"></path></svg>';
const PRINT_SVG =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M18 3H6v4h12m1 5a1 1 0 0 1-1-1 1 1 0 0 1 1-1 1 1 0 0 1 1 1 1 1 0 0 1-1 1m-3 7H8v-5h8m3-6H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3Z"></path></svg>';
const PRINT_ONCLICK =
  "(function(){var w=window.open('','');if(!w)return;var d=w.document;Array.from(document.querySelectorAll('link[rel=stylesheet],style')).forEach(function(e){d.head.appendChild(e.cloneNode(true))});var v=d.createElement('div');v.id='article-view';var c=document.getElementById('article-content');if(c)v.appendChild(c.cloneNode(true));d.body.appendChild(v);w.focus();w.print();})()";

/** Extract {id,text} from each <h2 id="…"> in the rendered body — identical to the
 *  regex ArticleView.astro runs (strip inner tags + collapse whitespace). */
function extractHeadings(bodyHtml: string): Array<{ id: string; text: string }> {
  const headings: Array<{ id: string; text: string }> = [];
  const h2re = /<h2[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g;
  let m: RegExpExecArray | null;
  while ((m = h2re.exec(bodyHtml)) !== null) {
    const text = m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (text) headings.push({ id: m[1], text });
  }
  return headings;
}

/** Mirror of ArticleToc.astro (renders nothing when there are no headings). */
export function renderArticleToc(headings: Array<{ id: string; text: string }>): string {
  if (headings.length === 0) return "";
  const headingsJson = JSON.stringify(headings).replace(/</g, "\\u003c");
  // x-data block — byte-identical to the component's template literal (incl. indentation).
  const xData = `{
        headings: [],
        active: '',
        init(){
          try {
            const el = document.getElementById('article-toc-json');
            this.headings = el ? JSON.parse(el.textContent) : [];
          } catch (e) { this.headings = []; }
          if (this.headings.length) this.active = this.headings[0].id;
          const els = this.headings
            .map((h) => document.getElementById(h.id))
            .filter(Boolean);
          if (!('IntersectionObserver' in window) || !els.length) return;
          const obs = new IntersectionObserver((entries) => {
            entries.forEach((e) => { if (e.isIntersecting) this.active = e.target.id; });
          }, { rootMargin: '0px 0px -75% 0px', threshold: 0 });
          els.forEach((el) => obs.observe(el));
        },
        go(id){
          const el = document.getElementById(id);
          if (!el) return;
          // Offset by the live pinned chrome (fixed nav + sticky context bar) + a hair,
          // so the heading lands just below it rather than under it.
          let off = 12;
          document.querySelectorAll('header, .ctxbar').forEach((c) => {
            const p = getComputedStyle(c).position;
            if (p === 'fixed' || p === 'sticky') off += c.offsetHeight;
          });
          const t = el.getBoundingClientRect().top + window.pageYOffset - off;
          window.scrollTo({ top: Math.max(0, t), behavior: 'smooth' });
          this.active = id;
        }
      }`;
  const items = headings
    .map(
      (h) =>
        `<li><a href="#${escAttr(h.id)}" class="toc-item font-lato hover block py-1 pl-6" style="font-size:14px;cursor:pointer" :class="active === '${escAttr(h.id)}' ? 'toc-item-active' : ''" @click.prevent="go('${escAttr(h.id)}')">${esc(h.text)}</a></li>`,
    )
    .join("");
  return `<div id="article-toc" x-data="${escAttr(xData)}"><script type="application/json" id="article-toc-json">${headingsJson}</script><p class="font-oswald mb-2" style="font-weight:700;font-size:1.17em">TABLE OF CONTENTS</p><hr><ul class="m-0 list-none p-0">${items}</ul></div>`;
}

/** Mirror of MarkerExternal.astro. */
function renderMarkerExternal(): string {
  return `<div class="marker-row marker-external font-lato"><svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M11 9c0 .55-.45 1-1 1s-1-.45-1-1V7H7v2c0 .55-.45 1-1 1s-1-.45-1-1V7c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v2m9.06 3.94L12 21l-8.06-8.06a4.27 4.27 0 0 1 0-6.04 4.27 4.27 0 0 1 6.04 0L12 8.88l1.97-1.97a4.27 4.27 0 0 1 6.04 0 4.27 4.27 0 0 1 .05 6.03Z"></path></svg><span class="small">This is an external contribution</span></div>`;
}

/** Mirror of InfoBlock.astro with html= (set:html body) — large default → no `small`. */
function renderInfoBlockHtml(title: string, html: string): string {
  return `<div class="info-block"><div class="info-block-title">${esc(title)}</div><div>${html}</div></div>`;
}
/** Mirror of InfoBlock.astro with slotted <p> children (large default). */
function renderInfoBlockSlot(title: string, innerHtml: string): string {
  return `<div class="info-block"><div class="info-block-title">${esc(title)}</div>${innerHtml}</div>`;
}

/** Mirror of ArticleView.astro — the #article-view subtree (no JSON-LD / scripts / style). */
export function renderArticleView(item: ArticleItem): string {
  const headings = extractHeadings(item.bodyHtml);
  const hasDownloads = !!item.mainFileUrl || !!item.extraFileUrl;
  const heroFile = item.imgPath || null;
  const splashJson =
    !heroFile && item.splash
      ? JSON.stringify({ src: item.splash }).replace(/</g, "\\u003c")
      : null;
  const doiSafe = item.doi ? escapeHtml(item.doi) : null;

  // Splash hero: extracted-file branch (build) OR base64 island branch (transient).
  let hero = "";
  if (heroFile) {
    hero = `<div class="article-splash"><img src="${escAttr(heroFile)}" alt="" loading="eager" fetchpriority="high" decoding="async" class="article-splash-img"></div>`;
  } else if (splashJson) {
    hero = `<div class="article-splash" x-data="{ src: '' }" x-init="src = JSON.parse(document.getElementById('article-splash-json').textContent).src"><script type="application/json" id="article-splash-json">${splashJson}</script><img :src="src" alt="" loading="eager" fetchpriority="high" decoding="async" class="article-splash-img"></div>`;
  }

  // TOC + downloads sidebar (md+); rendered only when there are headings OR downloads.
  let aside = "";
  if (headings.length > 0 || hasDownloads) {
    const main = item.mainFileUrl
      ? `<a class="article-download detail-btn" href="${escAttr(item.mainFileUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escAttr(`Download ${item.mainFileType || "article"}`)}"><span>${esc(item.mainFileType || "Download")}</span>${DL_SVG}</a>`
      : "";
    const extra = item.extraFileUrl
      ? `<a class="article-download detail-btn" href="${escAttr(item.extraFileUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Download appendix"><span>appendix</span>${DL_SVG}</a>`
      : "";
    aside = `<aside class="article-toc-col"><div class="article-toc-sticky-wrap">${renderArticleToc(headings)}<div class="mt-6 flex flex-col items-start gap-2">${main}${extra}</div></div></aside>`;
  }

  // categories + | + tags row.
  const cats =
    item.categories.length > 0
      ? `<span>${item.categories
          .map(
            (c) =>
              `<span class="category mr-1" style="font-size:14px;font-weight:900">${esc(c)}</span>`,
          )
          .join("")}</span>`
      : "";
  const tags =
    item.tags.length > 0
      ? `<span><span class="mx-2">|</span>${item.tags
          .map(
            (t) =>
              `<a class="chip" href="/search/?q=${encodeURIComponent(t)}">${esc(t)}</a>`,
          )
          .join("")}</span>`
      : "";
  const catTagRow = `<div class="mb-2">${cats}${tags}</div>`;

  const markerExternal = item.external ? renderMarkerExternal() : "";

  const abstract = item.abstract
    ? `<div class="article-abstract my-6 px-5 py-5">${item.abstract}</div>`
    : "";

  const authorsSpan = item.authors ? `<span>${esc(item.authors)}</span>` : "";
  const dateSpan = item.dateLabel
    ? `<span><span class="mx-2">|</span>${esc(item.dateLabel)}</span>`
    : "";
  const metaRow = `<div class="font-oswald mb-4 text-uppercase" style="text-transform:uppercase">${authorsSpan}${dateSpan}<span class="mx-2">|</span><button type="button" class="article-print" aria-label="Print article" onclick="${escAttr(PRINT_ONCLICK)}">${PRINT_SVG}</button></div>`;

  const body = `<div class="article-body">${item.bodyHtml}</div>`;

  // "About the author(s)" — shown when any author has a description; plural keys off
  // the TOTAL author count (authorBios.length), matching ArticleView.astro.
  const withDesc = item.authorBios.filter((a) => a.description);
  const authorInfo =
    withDesc.length > 0
      ? renderInfoBlockSlot(
          `About the author${item.authorBios.length > 1 ? "s" : ""}`,
          withDesc.map((a) => `<p>${esc(a.description)}</p>`).join(""),
        )
      : "";
  const funding = item.funding
    ? renderInfoBlockSlot("Funding acknowledgment", `${esc(item.funding)}`)
    : "";
  const citation = item.citation
    ? renderInfoBlockHtml(
        "Suggested citation",
        doiSafe
          ? `${item.citation} <a href="${doiSafe}" target="_blank" rel="noreferrer">${doiSafe}</a>`
          : item.citation,
      )
    : "";
  const infoBlocks = `<div class="my-12">${authorInfo}${funding}${citation}</div>`;

  const content = `<div id="article-content" class="article-content pt-6">${catTagRow}${markerExternal}<h1 class="article-title">${esc(item.title)}</h1>${abstract}${metaRow}<hr>${body}${infoBlocks}</div>`;

  return `<div id="article-view">${hero}<div class="article-grid px-4 md:px-6">${aside}${content}</div></div>`;
}

/** Mirror of researchhub/articles/[slug].astro's page body (ArticleView in its
 *  page wrapper). The JSON-LD the page/component emit is intentionally omitted. */
export function renderArticleDetail(item: ArticleItem): string {
  return `<div class="pt-2 pb-12">${renderArticleView(item)}</div>`;
}
