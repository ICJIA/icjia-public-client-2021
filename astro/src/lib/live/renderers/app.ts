/**
 * ResearchHub APP detail twin renderer — pure, client-safe.
 *
 * Produces the same HTML as AppView.astro (the .researchhub card: title, the md+
 * two-column image|prop-list grid, MarkerExternal, the Updated / Contributors /
 * Categories / Tags / Description PropDisplays, the Funding / Suggested-citation /
 * Related-contents InfoBlocks, and the "Launch the App" button) for the
 * live-detail fallback. Locked to the real component by app.parity.test.ts (Astro
 * Container API), so it cannot drift. See docs/LIVE-DETAIL-FALLBACK.md.
 *
 * `item.citation` is already sanitized HTML (from the injected renderToHtml in the
 * shaper) and is emitted raw, exactly as InfoBlock's `set:html` does. Every other
 * interpolated value is HTML-escaped, matching Astro's auto-escaping.
 *
 * IMAGE (§4): the shaper always sets imagePath=null client-side, so the image (when
 * present) renders through AppView's base64-island branch (the JSON <script> +
 * Alpine x-init/:src) — reproduced verbatim here. The direct-file branch
 * (appImgFile) is unreachable client-side and so is not emitted.
 *
 * The page's `<script type="application/ld+json">` (SEO) is intentionally NOT
 * reproduced — the transient view is non-indexed (docs §2 non-goals).
 */
import type { AppItem } from "../shapers/app";
import { markerExternal } from "./dataset";

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// ── leaf-component twins (mirror researchhub/PropDisplay + InfoBlock) ──────────

/** Mirror of PropDisplay.astro. */
function propDisplay(name: string, valueHtml: string, dense = false): string {
  const cls = dense ? "prop-row font-lato dense" : "prop-row font-lato";
  const nameSpan = name ? `<span class="prop-name">${esc(name)}</span>` : "";
  return `<div class="${cls}">${nameSpan}<span class="prop-val">${valueHtml}</span></div>`;
}

/** Mirror of InfoBlock.astro (large default true). The `html` prop branch wraps the
 *  body in a `<div set:html>`; the default-<slot> branch emits the body bare. */
function infoBlock(
  title: string,
  bodyHtml: string,
  opts: { large?: boolean; html?: boolean } = {},
): string {
  const { large = true, html = false } = opts;
  const cls = large ? "info-block" : "info-block small";
  const body = html ? `<div>${bodyHtml}</div>` : bodyHtml;
  return `<div class="${cls}"><div class="info-block-title">${esc(title)}</div>${body}</div>`;
}

// ── app-view (port of the AppView.astro frontmatter + template) ───────────────

/** Mirror of AppView.astro. */
export function renderAppDetail(item: AppItem): string {
  const contributors =
    (item.contributors as Array<{ title?: string; url?: string }> | undefined) || [];
  const hasContributors = contributors.length > 0;
  const hasRelated = item.related.length > 0;
  const categoriesStr = item.categories.join(", ");

  // Client-side imagePath is always null → base64-island branch when an image
  // exists (matches AppView's `imageJson` path, with the same `<` escaping).
  const appImgFile = item.imagePath || null;
  const imageJson =
    !appImgFile && item.image
      ? JSON.stringify({ src: item.image }).replace(/</g, "\\u003c")
      : null;

  // appImgFile is unreachable client-side (shaper sets imagePath=null); only the
  // base64 island can appear.
  const imageCol = imageJson
    ? `<div class="md:col-span-1" x-data="{ src: '' }" x-init="src = JSON.parse(document.getElementById('app-img-json').textContent).src"><script type="application/json" id="app-img-json">${imageJson}</script><img :src="src" alt="" loading="lazy" decoding="async" class="app-img"></div>`
    : "";

  const propColClass = appImgFile || imageJson ? "md:col-span-2" : "md:col-span-3";

  const externalMarker = item.external ? markerExternal() : "";

  const updated = item.dateLabel ? propDisplay("Updated", esc(item.dateLabel)) : "";

  const contributorsVal = hasContributors
    ? contributors
        .map((c, i) => {
          const sep =
            i > 0 ? `<span>${i + 1 < contributors.length ? ", " : " and "}</span>` : "";
          const link = c.url
            ? `<a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">${esc(c.title)}</a>`
            : esc(c.title);
          return `<span>${sep}${link}</span>`;
        })
        .join("")
    : esc("ICJIA R&A staff");
  const contributorsBlock = propDisplay("Contributors", contributorsVal);

  const categoriesBlock =
    item.categories.length > 0
      ? propDisplay("Categories", `<span class="category">${esc(categoriesStr)}</span>`)
      : "";

  const tagsBlock =
    item.tags.length > 0
      ? propDisplay(
          "Tags",
          item.tags
            .map(
              (t) =>
                `<a class="chip" href="/search/?q=${encodeURIComponent(t)}">${esc(t)}</a>`,
            )
            .join(""),
        )
      : "";

  const descriptionBlock = item.description
    ? propDisplay("Description", esc(item.description))
    : "";

  const fundingBlock = item.funding
    ? infoBlock("Funding acknowledgment", esc(item.funding), { large: false })
    : "";

  const citationBlock = item.citation
    ? infoBlock("Suggested citation", item.citation, { large: false, html: true })
    : "";

  const relatedBlock = hasRelated
    ? infoBlock(
        "Related contents",
        `<ul class="font-lato">${item.related
          .map((r) => `<li><a href="${esc(r.fullPath)}">${esc(r.displayTitle)}</a></li>`)
          .join("")}</ul>`,
        { large: false },
      )
    : "";

  const launchBlock = item.url
    ? `<div class="mt-6 text-center"><button type="button" class="detail-btn" style="font-size:16px;padding:14px 28px" onclick="${esc(
        `window.open(${JSON.stringify(item.url)})`,
      )}">Launch the App<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7Z"></path></svg></button></div>`
    : "";

  return `<div class="researchhub markdown-body mx-auto max-w-5xl px-4 pb-12 md:px-6"><div class="detail-card"><h1 style="border:0">${esc(item.title)}</h1><div class="mt-2 grid grid-cols-1 gap-6 md:grid-cols-3">${imageCol}<div class="${propColClass}">${externalMarker}${updated}${contributorsBlock}${categoriesBlock}${tagsBlock}${descriptionBlock}${fundingBlock}${citationBlock}${relatedBlock}</div></div>${launchBlock}</div></div>`;
}
