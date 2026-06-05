/**
 * ResearchHub DATASET detail twin renderer — pure, client-safe.
 *
 * Produces the same HTML as DatasetView.astro (the #dataset-view card: title,
 * MarkerExternal/MarkerProject, the "About this dataset" PropDisplay list, the md+
 * Variables table, the Funding / Suggested-citation / Related-contents InfoBlocks,
 * and the "Download here" button) for the live-detail fallback. Locked to the real
 * component by dataset.parity.test.ts (Astro Container API), so it cannot drift.
 * See docs/LIVE-DETAIL-FALLBACK.md.
 *
 * `item.citation` is already sanitized HTML (from the injected renderToHtml in the
 * shaper) and is emitted raw, exactly as InfoBlock's `set:html` does. Every other
 * interpolated value is HTML-escaped, matching Astro's auto-escaping.
 *
 * The page's `<script type="application/ld+json">` (SEO) is intentionally NOT
 * reproduced — the transient view is non-indexed (docs §2 non-goals).
 */
import type { DatasetItem } from "../shapers/dataset";

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// ── leaf-component twins (mirror the researchhub/*.astro components) ──────────

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

/** Mirror of MarkerExternal.astro. */
export const markerExternal = (): string =>
  `<div class="marker-row marker-external font-lato"><svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M11 9c0 .55-.45 1-1 1s-1-.45-1-1V7H7v2c0 .55-.45 1-1 1s-1-.45-1-1V7c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v2m9.06 3.94L12 21l-8.06-8.06a4.27 4.27 0 0 1 0-6.04 4.27 4.27 0 0 1 6.04 0L12 8.88l1.97-1.97a4.27 4.27 0 0 1 6.04 0 4.27 4.27 0 0 1 .05 6.03Z"></path></svg><span class="small">This is an external contribution</span></div>`;

/** Mirror of MarkerProject.astro. */
export const markerProject = (): string =>
  `<div class="marker-row marker-project font-lato"><svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M17 17H7V7h10m0-2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-2 4h-2v6h2V9m-4 2H9v4h2v-4Z"></path></svg><span class="small">This is a project-specific dataset</span></div>`;

// ── dataset-view helpers (ports of the DatasetView.astro frontmatter) ─────────

/** Time period: legacy {yearmin,yearmax,yeartype} -> "min-max (type)" (else string). */
function fmtTimeperiod(tp: any): string {
  if (!tp) return "";
  if (typeof tp === "string") return tp;
  const { yearmin, yearmax, yeartype } = tp;
  if (yearmin == null && yearmax == null) return "";
  return `${yearmin}-${yearmax} (${yeartype})`;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const COLS = ["name", "type", "definition", "values"] as const;

/** Mirror of DatasetView.astro. */
export function renderDatasetDetail(item: DatasetItem): string {
  const timeperiod = fmtTimeperiod(item.timeperiod);
  const sources = Array.isArray(item.sources) ? item.sources : [];
  const notes = Array.isArray(item.notes) ? item.notes : [];
  const vars = Array.isArray(item.variables) ? item.variables : [];
  const hasRelated = item.related.length > 0;
  const categoriesStr = item.categories.join(", ");

  // marker: external wins, else project (matches the .astro ternary).
  const marker = item.external
    ? markerExternal()
    : item.project
      ? markerProject()
      : "";

  const finalDate = item.dateLabel
    ? propDisplay("Final date reflected in dataset", esc(item.dateLabel))
    : "";

  const sourcesBlock =
    sources.length > 0
      ? propDisplay(
          "Sources",
          sources
            .map((s: any, i: number) => {
              const sep = i > 0 ? `<span>${i + 1 < sources.length ? ", " : " and "}</span>` : "";
              const link = s.url
                ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>`
                : esc(s.title);
              return `<span>${sep}${link}</span>`;
            })
            .join(""),
        )
      : "";

  const categoriesBlock =
    item.categories.length > 0
      ? propDisplay(
          "Categories",
          `<span class="category" style="font-size:14px">${esc(categoriesStr)}</span>`,
        )
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

  const timeperiodBlock = timeperiod ? propDisplay("Time period", esc(timeperiod)) : "";

  const descriptionBlock = item.description
    ? propDisplay("Description", esc(item.description), true)
    : "";

  const notesBlock =
    notes.length > 0
      ? propDisplay(
          "Notes",
          `<ul>${notes.map((n: string) => `<li>${esc(n)}</li>`).join("")}</ul>`,
        )
      : "";

  const variablesBlock =
    vars.length > 0
      ? `<div class="variables-md-only py-6"><h2 class="mt-4 mb-4" style="font-weight:300">Variables</h2><div class="variables-table font-lato small"><table><thead><tr>${COLS.map(
          (c) => `<th>${esc(cap(c))}</th>`,
        ).join("")}</tr></thead><tbody>${vars
          .map(
            (row: any) =>
              `<tr>${COLS.map((c) => `<td>${esc(row[c] ?? "")}</td>`).join("")}</tr>`,
          )
          .join("")}</tbody></table></div></div>`
      : "";

  const fundingBlock = item.funding ? infoBlock("Funding acknowledgment", esc(item.funding)) : "";

  const citationBlock = item.citation
    ? infoBlock("Suggested citation", item.citation, { html: true })
    : "";

  const relatedBlock = hasRelated
    ? infoBlock(
        "Related contents",
        `<ul class="font-lato">${item.related
          .map((r) => `<li><a href="${esc(r.fullPath)}">${esc(r.displayTitle)}</a></li>`)
          .join("")}</ul>`,
      )
    : "";

  const downloadBlock = item.dataFileUrl
    ? `<div class="mt-6 text-center"><a class="detail-btn" href="${esc(item.dataFileUrl)}" target="_blank" rel="noopener noreferrer">Download here</a></div>`
    : "";

  return `<div id="dataset-view" class="markdown-body mx-auto max-w-5xl px-4 pb-10 md:px-6"><div class="detail-card"><h1>${esc(item.title)}</h1>${marker}<h2 class="mt-4 mb-4" style="font-weight:300">About this dataset</h2>${finalDate}${sourcesBlock}${categoriesBlock}${tagsBlock}${timeperiodBlock}${descriptionBlock}${notesBlock}${variablesBlock}${fundingBlock}${citationBlock}${relatedBlock}${downloadBlock}</div></div>`;
}
