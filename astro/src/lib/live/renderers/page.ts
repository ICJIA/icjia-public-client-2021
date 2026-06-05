/**
 * Generic CMS PAGE detail twin renderer — pure, client-safe.
 *
 * Produces the same HTML as BasePage.astro's content (the .markdown-body wrapper,
 * optional Splash, the bp-grid with the <h1> titleHtml + optional summary + body +
 * tag chips + AttachmentList, the optional PageToc aside, and the
 * ContentClickThroughBoxes) for the live-detail fallback. ONE twin serves all FOUR
 * section catch-alls (/about, /grants, /irb, /innovation-and-digital-services
 * <slug>): their [slug].astro bodies are IDENTICAL — each is just
 * `<BaseLayout …><BasePage page={page} /></BaseLayout>` (only the BaseLayout title/
 * description chrome differs, which the 404 shell supplies via document.title), so
 * the rendered page CONTENT is the same <BasePage> for all four. Locked to the real
 * BasePage by renderers/page.parity.test.ts (Astro Container API), so it cannot drift.
 * See docs/LIVE-DETAIL-FALLBACK.md.
 *
 * `item.titleHtml` / `item.safeBodyHtml` / clickthrough `teaserHtml` are already
 * sanitized (DOMPurify, via the injected renderers in the shaper) and are emitted
 * RAW, exactly as BasePage's `set:html` does. Every other interpolated value is
 * HTML-escaped, matching Astro's auto-escaping.
 *
 * ACCEPTED DEVIATIONS (§4) — present only when the page HAS them; excluded from the
 * strict-parity fixtures (every sampled real page has neither):
 *   • Splash hero — BasePage's <CmsImage> optimizes via astro:assets (a hashed
 *     /_astro asset) which can't be reproduced client-side; the transient render
 *     emits the RAW Strapi <img> (visually identical, different markup), mirroring
 *     the established live-island image deviation.
 *   • Clickthrough icons — ContentClickThroughBoxes uses astro-icon's <Icon> (build-
 *     time inlined SVG); the transient render emits a placeholder <span> with the same
 *     classes. The box layout/title/teaser/NEW badge are otherwise byte-matched.
 *
 * OMITTED (intentionally): BasePage's scoped <style> + the components' scoped
 * <style>/inline scripts (PageToc's Alpine x-data scroll-spy IS reproduced so the TOC
 * works; the JSON-LD the page wrappers emit is non-indexed per docs §2 and not here).
 */
import { isNew } from "../shapers/format";
import type {
  PageItem,
  PageAttachmentItem,
  PageClickthrough,
  PageTocItem,
  PageSplash,
} from "../shapers/page";

// Text-node escape — matches Astro's auto-escaping of {expr} text content
// (escapes & < > " AND ').
const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Attribute-VALUE escape — matches Astro's serialization of a dynamic string
// attribute (escapes only & and "; a double-quoted value may keep raw < > per HTML).
// Used for the PageToc x-data / :class / @click JS-expression attributes whose bodies
// contain `=>` arrows and `<` — escaping those (as the text esc does) would diverge
// from the real component.
const escAttr = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");

// ── Splash.astro (raw-image transient variant — §4) ──────────────────────────
function renderSplash(splash: PageSplash | null): string {
  if (!splash || !splash.url) return "";
  const alt = splash.alternativeText ?? "ICJIA Internet news item image";
  const caption = splash.caption;
  const img = `<img src="${escAttr(splash.url)}" alt="${escAttr(alt)}" loading="eager" decoding="async" class="splash-img">`;
  const cap = caption ? `<div class="splash-caption">${esc(caption)}</div>` : "";
  return `<div class="splash-bleed">${img}${cap}</div>`;
}

// ── AttachmentList.astro ──────────────────────────────────────────────────────
const ATT_ONCLICK =
  "try{if(typeof window.plausible==='function'){window.plausible('file_download',{props:{url:this.href}});window.plausible('Outbound Link: Click',{props:{url:this.href}})}}catch(e){}";

function renderAttachmentList(
  items: PageAttachmentItem[],
  label: string,
  hideUpdated: boolean,
): string {
  if (items.length === 0) return "";
  const head = `<tr><th>Filename</th>${hideUpdated ? "" : "<th>Last Updated</th>"}<th>Size</th></tr>`;
  const rows = items
    .map(
      (a) =>
        `<tr><td><a class="attachment" href="${escAttr(a.url)}" target="_blank" rel="noopener noreferrer" onclick="${escAttr(ATT_ONCLICK)}">${esc(a.name)}<span class="sr-only"> (opens in new tab)</span></a></td>${hideUpdated ? "" : `<td class="att-updated">${esc(a.updatedAlt)}</td>`}<td class="att-size">${esc(a.niceSize)}</td></tr>`,
    )
    .join("");
  return `<div class="attachment-list"><h3 class="sub-heading">${esc(label)}</h3><div class="table-scroll" role="region" tabindex="0" aria-label="${escAttr(label)}"><table class="att-table"><thead>${head}</thead><tbody>${rows}</tbody></table></div></div>`;
}

// ── PageToc.astro (Alpine scroll-spy x-data reproduced verbatim) ──────────────
function renderPageToc(items: PageTocItem[], heading = "Contents"): string {
  const tocItems = items.filter((i) => i.id && i.text);
  if (tocItems.length === 0) return "";
  const headingUpper = heading.toUpperCase();
  const ids = JSON.stringify(tocItems.map((i) => i.id)).replace(/</g, "\\u003c");
  // x-data block — byte-identical to PageToc.astro's template literal (incl. indentation).
  const xData = `{
        active: '',
        // OFFSET = fixed app-bar (90px) + sticky context bar (70px) + breathing
        // room, so a heading scrolled-to lands just below BOTH sticky bands. Was
        // 96 (bar only), which tucked the heading under the 70px context bar.
        offset: 168,
        // Smooth-scroll to a heading with the navbar offset, then update the hash
        // (without the browser's default instant jump). Wired on each link's @click.
        go(id, e){
          if(e) e.preventDefault();
          const el = document.getElementById(id);
          if(!el) return;
          const top = el.getBoundingClientRect().top + window.pageYOffset - this.offset;
          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
          history.replaceState(null, '', '#' + id);
          this.active = id;
        },
        init(){
          const self = this;
          const ids = JSON.parse(this.$el.dataset.ids || '[]');
          const targets = ids
            .map((id)=>document.getElementById(id))
            .filter(Boolean);
          if(!targets.length) return;
          // Active heading = the last one whose top has scrolled past a line just
          // below the fixed bar (mirrors legacy Toc.vue's scroll spy).
          const recompute = ()=>{
            let above = '';
            for(const t of targets){
              if(t.getBoundingClientRect().top < self.offset + 40) above = t.id; else break;
            }
            self.active = above || targets[0].id;
          };
          // Deep-link: if the URL already has a #hash for one of our headings,
          // re-scroll with the offset (native jump would tuck it under the bar).
          const hash = decodeURIComponent(location.hash.slice(1));
          if(hash && ids.includes(hash)){
            requestAnimationFrame(()=>self.go(hash));
          }
          // IntersectionObserver = cheap "a heading crossed the band" trigger;
          // a rAF-throttled scroll listener guarantees we track every position
          // (IO callbacks coalesce and can skip fast/programmatic scrolls).
          let ticking = false;
          const onScroll = ()=>{
            if(ticking) return; ticking = true;
            requestAnimationFrame(()=>{ recompute(); ticking = false; });
          };
          const io = new IntersectionObserver(()=>recompute(), {
            rootMargin: '-130px 0px -70% 0px', threshold: 0,
          });
          targets.forEach((t)=>io.observe(t));
          window.addEventListener('scroll', onScroll, { passive: true });
          window.addEventListener('resize', onScroll, { passive: true });
          recompute();
        }
      }`;
  const lis = tocItems
    .map(
      (item) =>
        `<li><a href="#${escAttr(item.id)}" @click="${escAttr(`go('${item.id}', $event)`)}" :class="${escAttr(`active==='${item.id}' ? 'toc-active' : ''`)}">${esc(item.text)}</a></li>`,
    )
    .join("");
  return `<nav class="page-toc hidden md:block" aria-label="On this page" x-data="${escAttr(xData)}" data-ids="${escAttr(ids)}"><h3 class="toc-heading">${esc(headingUpper)}</h3><div class="toc-divider"><ul class="toc-list">${lis}</ul></div></nav>`;
}

// ── ContentClickThroughBoxes.astro (§4 — icon placeholder) ────────────────────
const isExternal = (url?: string) => !!url && /^https?:\/\//.test(url);

function renderClickthroughBoxes(boxes: PageClickthrough[]): string {
  if (boxes.length === 0) return "";
  const cards = boxes
    .map((box) => {
      const href = box.url || "#";
      const tgt = isExternal(box.url) ? ' target="_blank" rel="noopener noreferrer"' : "";
      const badge = isNew(box.datePosted) ? `<span class="ctb-new">NEW!</span>` : "";
      // astro-icon <Icon> inlines an SVG at build — not reproducible client-side; emit
      // a placeholder span with the same class (§4). Excluded from the strict fixtures.
      const icon = `<span class="ctb-icon" aria-hidden="true"></span>`;
      const teaser = box.teaserHtml ? `<div class="ctb-teaser">${box.teaserHtml}</div>` : "";
      return `<a href="${escAttr(href)}"${tgt} class="ctb-box">${badge}${icon}<h3 class="ctb-title">${esc(box.title)}</h3>${teaser}</a>`;
    })
    .join("");
  return `<div class="ctb"><h2 id="for-more-information">For more information</h2><div class="ctb-grid">${cards}</div></div>`;
}

// ── BasePage.astro ────────────────────────────────────────────────────────────

/**
 * Mirror of BasePage.astro — the .markdown-body content subtree. `showSummary` and
 * `hideUpdated` are BasePage props; the section [slug].astro routes render <BasePage
 * page={page} /> with BOTH at their defaults (false), so the twin matches that call.
 */
export function renderBasePage(item: PageItem): string {
  const showToc = !!item.showTOC && item.toc.length > 0;

  // class:list join — array order, space-joined (matches Astro's class:list output).
  const wrapClass = showToc
    ? "markdown-body mx-auto px-3 py-8 max-w-[1185px] xl:max-w-[1785px]"
    : "markdown-body mx-auto px-3 py-8 max-w-[900px] lg:max-w-[1185px] xl:max-w-[1785px]";

  const splash = renderSplash(item.splash);

  const gridClass = showToc
    ? "bp-grid md:flex md:items-start md:gap-[109px]"
    : "bp-grid";
  const bodyColClass = showToc ? "md:min-w-0 md:flex-1" : "";

  const h1 = item.hideTitle ? "" : `<h1>${item.titleHtml}</h1>`;

  // showSummary defaults FALSE on the section routes → summary is never rendered here.
  const summary = "";

  const body = `<div>${item.safeBodyHtml}</div>`;

  const tags =
    item.tags.length > 0
      ? `<div class="mt-6">${item.tags
          .map(
            (tag) =>
              `<a class="chip" href="/search/?q=${encodeURIComponent(tag)}">${esc(tag)}</a>`,
          )
          .join("")}</div>`
      : "";

  // hideUpdated defaults FALSE on the section routes.
  const attachments = renderAttachmentList(item.attachments, item.attachmentLabel, false);

  const aside = showToc
    ? `<aside class="mt-8 md:mt-0 md:w-[270px] md:shrink-0">${renderPageToc(item.toc)}</aside>`
    : "";

  const bodyCol = `<div${bodyColClass ? ` class="${bodyColClass}"` : ""}>${h1}${summary}${body}${tags}${attachments}</div>`;

  const grid = `<div class="${gridClass}">${bodyCol}${aside}</div>`;

  const clickthrough = renderClickthroughBoxes(item.clickthrough);

  return `<div class="${wrapClass}">${splash}${grid}${clickthrough}</div>`;
}

/** Mirror of the section [slug].astro page body (BasePage in its BaseLayout wrapper);
 *  the BaseLayout chrome + JSON-LD are supplied/omitted by the 404 shell. */
export function renderPageDetail(item: PageItem): string {
  return renderBasePage(item);
}
