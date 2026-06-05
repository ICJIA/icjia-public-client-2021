/**
 * News-post DETAIL twin renderer — pure, client-safe.
 *
 * Produces the same HTML as news/[slug].astro (the .news-item wrapper +
 * Splash.astro + the date/category header + h1 + body + tag chips +
 * AttachmentList.astro + RelatedList.astro + the optional PageToc.astro sidebar)
 * for the live-detail fallback. Serves BOTH `/news/` and `/news/press/` (the same
 * posts collection + page). Locked to the real components by post.parity.test.ts
 * (Astro Container API), so it cannot drift. See docs/LIVE-DETAIL-FALLBACK.md.
 *
 * `item.safeBodyHtml` is already sanitized markdown (from the injected renderToHtml
 * in the shaper) and is emitted raw, exactly as the page's `set:html` does. Every
 * other interpolated value is HTML-escaped, matching Astro's auto-escaping.
 *
 * SPLASH: the page optimizes the hero via astro:assets (<Image>); a transient
 * client render can't, so the twin emits the RAW Strapi URL (§4). The parity test
 * normalizes the resulting <img> src/width/height/loading/decoding differences.
 */
import type { PostItem, PostTocItem, AttachmentItem, RelatedItem } from "../shapers/post";

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Astro's ATTRIBUTE-VALUE escaping (used for the x-data Alpine directive, which
// contains `=>` arrows + a `<` comparison): Astro escapes only `&` and `"` in
// attribute values — it leaves `<` and `>` LITERAL (which is why PageToc.astro
// manually `<`-escapes its data-ids JSON). So the arrows stay `=>` and the
// comparison stays `<`, matching the real component byte-for-byte.
const escAttr = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

/** Mirror of Splash.astro (raw-URL <img> for the transient render — §4). */
export function renderSplash(splash: NonNullable<PostItem["splash"]>): string {
  const caption = splash.caption
    ? `<div class="splash-caption">${esc(splash.caption)}</div>`
    : "";
  return `<div class="splash-bleed"><img src="${esc(splash.url)}" alt="${esc(splash.alt)}" loading="eager" decoding="async" class="splash-img">${caption}</div>`;
}

/** Mirror of AttachmentList.astro (NewsSingle passes hideUpdated → no "Last Updated"). */
export function renderAttachmentList(
  items: AttachmentItem[],
  label: string,
  hideUpdated: boolean,
): string {
  if (items.length === 0) return "";
  const heading = label || "Attachments";
  const updatedHead = !hideUpdated ? `<th>Last Updated</th>` : "";
  const rows = items
    .map((a) => {
      const updatedCell = !hideUpdated ? `<td class="att-updated">${esc(a.updatedAlt)}</td>` : "";
      return `<tr><td><a class="attachment" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer" onclick="try{if(typeof window.plausible==='function'){window.plausible('file_download',{props:{url:this.href}});window.plausible('Outbound Link: Click',{props:{url:this.href}})}}catch(e){}">${esc(a.name)}<span class="sr-only"> (opens in new tab)</span></a></td>${updatedCell}<td class="att-size">${esc(a.niceSize)}</td></tr>`;
    })
    .join("");
  return `<div class="attachment-list"><h3 class="sub-heading">${esc(heading)}</h3><div class="table-scroll" role="region" tabindex="0" aria-label="${esc(heading)}"><table class="att-table"><thead><tr><th>Filename</th>${updatedHead}<th>Size</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

/** Mirror of RelatedList.astro ("Related Web Content"). */
export function renderRelatedList(items: RelatedItem[]): string {
  if (items.length === 0) return "";
  const lis = items
    .map((r) => `<li><a href="${esc(r.fullPath)}">${esc(r.displayTitle)}</a></li>`)
    .join("");
  return `<div class="related-list"><h3 class="sub-heading">Related Web Content</h3><ul class="related-link-list">${lis}</ul></div>`;
}

// PageToc.astro x-data — copied VERBATIM from the component so the emitted Alpine
// directive is byte-identical (the parity norm() collapses whitespace on both
// sides). esc() escapes `&`→`&amp;` and `"`→`&quot;`, matching Astro's attribute
// escaping of this value.
const TOC_XDATA = `{
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

/** Mirror of PageToc.astro (sticky on-page TOC; default heading "Contents"). */
export function renderPageToc(items: PostTocItem[], heading = "Contents"): string {
  const tocItems = items.filter((i) => i.id && i.text);
  if (tocItems.length === 0) return "";
  // ids JSON with `<` escaped to < (component), then attr-escaped by esc().
  const ids = JSON.stringify(tocItems.map((i) => i.id)).replace(/</g, "\\u003c");
  const lis = tocItems
    .map(
      (item) =>
        `<li><a href="#${esc(item.id)}" @click="go('${esc(item.id)}', $event)" :class="active==='${esc(item.id)}' ? 'toc-active' : ''">${esc(item.text)}</a></li>`,
    )
    .join("");
  return `<nav class="page-toc hidden md:block" aria-label="On this page" x-data="${escAttr(TOC_XDATA)}" data-ids="${escAttr(ids)}"><h3 class="toc-heading">${esc(heading.toUpperCase())}</h3><div class="toc-divider"><ul class="toc-list">${lis}</ul></div></nav>`;
}

/** Mirror of news/[slug].astro's full body (wrapper + splash + meta + h1 + body +
 *  tags + attachments + related + optional TOC sidebar). */
export function renderPostDetail(item: PostItem): string {
  const showToc = !!item.showTOC && item.toc.length > 0;
  const showSplash = !!item.splash && !item.hideSplash;

  const splash = showSplash ? renderSplash(item.splash as NonNullable<PostItem["splash"]>) : "";

  // Grid wrapper: class:list joins only the true classes; empty → no class attr.
  const gridClasses = [
    !showSplash ? "-mt-[15px]" : "",
    showToc ? "md:flex md:items-start md:gap-[109px]" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const gridAttr = gridClasses ? ` class="${gridClasses}"` : "";

  // Body column: class:list → "md:min-w-0 md:flex-1" only when showToc, else none.
  const colAttr = showToc ? ` class="md:min-w-0 md:flex-1"` : "";

  const meta = `<div class="news-meta"><span class="category">${esc(item.catLabel.toUpperCase())}</span>${
    item.publicationDate ? ` | ${esc(item.publicationDate)}` : ""
  }</div>`;

  const title = `<h1 class="news-title">${esc(item.title)}</h1>`;

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

  const attachments = renderAttachmentList(item.attachments, item.attachmentLabel, true);
  const related = renderRelatedList(item.related);
  const bottom = `<div class="mt-12">${attachments}<div class="mt-10">${related}</div></div>`;

  const aside = showToc
    ? `<aside class="mt-8 md:mt-0 md:w-[270px] md:shrink-0">${renderPageToc(item.toc)}</aside>`
    : "";

  return `<div class="news-item markdown-body mx-auto max-w-[900px] lg:max-w-[1185px] xl:max-w-[1785px] px-3 py-8">${splash}<div${gridAttr}><div${colAttr}>${meta}${title}${body}${tags}${bottom}</div>${aside}</div></div>`;
}
