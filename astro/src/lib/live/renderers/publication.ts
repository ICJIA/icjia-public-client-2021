/**
 * Publication DETAIL twin renderer — pure, client-safe.
 *
 * Produces the same HTML as about/publications/[slug].astro (the sr-only h1 + the
 * standalone PublicationCard.astro + the "View all publications »" link) for the
 * live-detail fallback. Locked to the real page/component by
 * publication.parity.test.ts (Astro Container API), so it cannot drift.
 * See docs/LIVE-DETAIL-FALLBACK.md.
 *
 * The card's summary is PLAIN text (the component emits `{item.summary}`, NOT
 * set:html), so every interpolated value here is HTML-escaped with esc(), matching
 * Astro's auto-escaping — there is no raw body to inject. The two inline @click
 * Plausible handlers are reproduced verbatim (JSON.stringify of the URL inside a
 * try/catch), then attribute-escaped exactly as Astro escapes an `onclick={...}`.
 */
import type { PublicationItem } from "../shapers/publication";

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Mirror of PublicationCard.astro. */
export function renderPublicationCard(item: PublicationItem): string {
  const date = item.publicationDate
    ? `<span class="pub-card-date mb-5 px-3 block">${esc(item.dateAlt)}</span>`
    : "";

  const summary = item.summary
    ? `<div class="pub-card-summary px-3">${esc(item.summary)}</div>`
    : `<div class="pub-card-summary px-3">No summary available</div>`;

  const articleHandler = `try{window.plausible&&window.plausible('publicationList_article_view',{props:{url:${JSON.stringify(
    item.articleURL ?? "",
  )}}})}catch(e){}`;
  const articleLi = item.localArticlePath
    ? `<li class="mt-2"><span class="link-label">Article&nbsp;</span><br><a href="${esc(
        item.localArticlePath,
      )}" onclick="${esc(articleHandler)}">${esc(item.articleURL)}</a></li>`
    : "";

  const fileHandler = `try{window.plausible&&window.plausible('publicationList_file_download',{props:{url:${JSON.stringify(
    item.fileURL,
  )}}})}catch(e){}`;
  const fileLi = item.fileURL
    ? `<li class="mt-2"><span class="link-label">Download&nbsp;</span><br><a href="${esc(
        item.fileURL,
      )}" target="_blank" rel="noopener noreferrer" onclick="${esc(
        fileHandler,
      )}">${esc(item.title)}</a>&nbsp;<span class="file-chip">${esc(
        item.fileType,
      )}</span></li>`
    : "";

  const links =
    item.localArticlePath || item.fileURL
      ? `<ul class="pub-links mt-5 ml-2">${articleLi}${fileLi}</ul>`
      : "";

  const tags =
    item.tags.length > 0
      ? `<div class="py-2 px-3">${item.tags
          .map(
            (tag) =>
              `<a class="chip mt-1" href="/search/?q=${encodeURIComponent(
                tag,
              )}">${esc(tag)}</a>`,
          )
          .join("")}</div>`
      : "";

  return `<div class="pub-card markdown-body">${date}<h2 class="pub-card-title mt-2 mb-3 px-3"><a href="${esc(
    item.fullPath,
  )}">${esc(
    item.title,
  )}</a></h2>${summary}${links}${tags}<div class="pub-card-archive text-center mt-10 px-3 py-3">Individual publications, as well as old meeting agendas, minutes, and materials, are always available for download from the ICJIA Document Archive: <a href="https://archive.icjia.cloud" target="_blank" rel="noopener noreferrer">https://archive.icjia.cloud</a></div></div>`;
}

/** Mirror of about/publications/[slug].astro's body (sr-only h1 + card + "view all"). */
export function renderPublicationDetail(item: PublicationItem): string {
  return `<div class="publications markdown-body mx-auto max-w-4xl px-4 py-8 md:px-6"><h1 class="sr-only">${esc(
    item.title,
  )}</h1>${renderPublicationCard(item)}<div class="mt-5 text-right"><a class="view-all" href="/about/publications/">View all publications&nbsp;&raquo;</a></div></div>`;
}
