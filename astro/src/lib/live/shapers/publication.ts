/**
 * Publication DETAIL shaper — pure, client-safe.
 *
 * Reproduces data.ts's build-time getPublication()/shapePublication() shape so the
 * live-detail fallback can render a brand-new (post-build) publication CLIENT-SIDE
 * from the Strapi v3 REST record, byte-identical to the eventual nightly-built page
 * (see docs/LIVE-DETAIL-FALLBACK.md).
 *
 * The build fetches the single record via GraphQL singlePub(where:{slug}); the
 * runtime fallback fetches it via REST `?slug=` from the AGENCY host. Both carry the
 * same publication fields (title, slug, summary, pubType, publicationDate, tags,
 * fileURL, articleURL), so the same shaping works on either. NOTE the fileURL
 * capitalization fixups data.ts's getPublication applies BEFORE shaping are
 * replicated here, so the live `Download` link matches the built page.
 *
 * CLIENT-SAFE: zero server-only imports (no jsdom/node/data.ts/astro:assets). The
 * publication card renders its summary as PLAIN auto-escaped text (no set:html /
 * markdown body), so `render` is part of the registry call signature but UNUSED for
 * the body — accepted for a uniform shaper API across types.
 *
 * The two publication-specific pure formatters (publicationTypeLabel, getFileType)
 * and the localArticlePath derivation are duplicated from data.ts and locked to the
 * originals by shapers/publication.test.ts so they cannot silently diverge. The date
 * helper (dateFormatAlt) is REUSED from the meeting shaper and `isNew` from format.ts
 * — each already pinned to data.ts by its own drift test.
 */
import { dateFormatAlt } from "./meeting";
import { isNew } from "./format";
import { safeUrl } from "../safe-url";

const PUB_CLIENT = "https://icjia.illinois.gov";
const DAYS_TO_SHOW_NEW = 5;

// ── pure formatters (duplicated from data.ts; guarded by shapers/publication.test.ts) ──

/** Verbatim port of data.ts publicationTypeLabel (utils.js getPublicationType) —
 *  19-case switch, default "General". */
export function publicationTypeLabel(type?: string): string {
  switch (type) {
    case "researchReport":
      return "Research Report";
    case "researchBulletin":
      return "Research Bulletin";
    case "researchAtAGlance":
      return "Research At A Glance";
    case "trendsAndIssuesUpdate":
      return "Trends and Issues Update";
    case "motorVehicleTheftPublications":
      return "Motor Vehicle Theft Publication";
    case "barj":
      return "BARJ";
    case "compiler":
      return "Compiler";
    case "dataset":
      return "Dataset";
    case "getTheFacts":
      return "GET THE FACTS";
    case "programEvaluationSummary":
      return "Program Evaluation Summary";
    case "megProfiles":
      return "MEG Profiles";
    case "annualReport":
      return "Annual Report";
    case "article":
      return "Article";
    case "report":
      return "Report";
    case "evaluation":
      return "Evaluation";
    case "toolkit":
      return "Toolkit";
    case "onGoodAuthority":
      return "On Good Authority";
    case "application":
      return "Application";
    default:
      return "General";
  }
}

/** Verbatim port of data.ts getFileType: last path segment's extension, uppercased. */
export function getFileType(url?: string): string {
  if (!url) return "";
  return url.split(/[#?]/)[0].split(".").pop()!.trim().toUpperCase();
}

/** Legacy PublicationsSingle ad-hoc fileURL capitalization fixups, applied by
 *  data.ts getPublication BEFORE shaping. Replicated so the Download link matches. */
function fixupFileUrl(url?: string): string | undefined {
  if (!url) return url;
  return url
    .replace("/Compiler/", "/compiler/")
    .replace("/OGA/", "/oga/")
    .replace("/researchreports/", "/ResearchReports/");
}

// ── types ─────────────────────────────────────────────────────────────────────

/** Mirror of data.ts PublicationListItem (single-row shape getPublication returns).
 *  Card reads: dateAlt, publicationDate, title, fullPath, summary, localArticlePath,
 *  articleURL, fileURL, fileType, tags. The rest (slug/pubType/typeLabel/isNew/
 *  haystack) are carried for shape parity (the build's single row has them). */
export interface PublicationItem {
  id: string;
  title: string;
  slug?: string;
  summary?: string;
  pubType?: string;
  publicationDate?: string;
  tags: string[];
  fileURL?: string;
  articleURL?: string;
  fullPath: string;
  /** site-relative article path ("" when none / not a true "/"-relative path). */
  localArticlePath: string;
  typeLabel: string;
  dateAlt: string;
  isNew: boolean;
  fileType: string;
  haystack: string;
}

// ── shaper ──────────────────────────────────────────────────────────────────

/**
 * Shape one raw Strapi publication (REST `?slug=` OR GraphQL) the way data.ts's
 * build-time getPublication → shapePublication does: apply the fileURL fixups,
 * derive the local article path, type label, alt date, file-type chip, and tags.
 * `render` is accepted for the uniform registry signature but UNUSED (the card's
 * summary is plain auto-escaped text, no markdown body).
 */
export function shapePublication(
  p: any,
  _render: (md: string) => string,
): PublicationItem {
  // fileURL feeds a Download href — scheme-guard it (safeUrl is a no-op for the
  // real https/relative file links the fixups produce). Keep undefined when absent
  // so the card renders NO Download link (a "#" would be a spurious one).
  const fixedFileUrl = fixupFileUrl(p.fileURL);
  const fileURL = fixedFileUrl ? safeUrl(fixedFileUrl) : fixedFileUrl;
  const tagsArr: string[] = Array.isArray(p.tags)
    ? p.tags.map((t: any) => (typeof t === "string" ? t : t?.title)).filter(Boolean)
    : [];
  // localArticlePath feeds an href — only accept a true site-relative path (starts
  // with "/"); a crafted articleURL (e.g. javascript:/*…icjia.illinois.gov…*/) that
  // survives the PUB_CLIENT strip would NOT start with "/", so it collapses to "".
  const stripped =
    p.articleURL && p.articleURL.includes(PUB_CLIENT)
      ? p.articleURL.replace(PUB_CLIENT, "")
      : "";
  const localArticlePath = stripped.startsWith("/") ? stripped : "";
  const typeLabel = publicationTypeLabel(p.pubType);
  return {
    id: String(p.id),
    title: p.title,
    slug: p.slug,
    summary: p.summary,
    pubType: p.pubType,
    publicationDate: p.publicationDate,
    tags: tagsArr,
    fileURL,
    articleURL: p.articleURL,
    fullPath: `/about/publications/${p.slug}/`,
    localArticlePath,
    typeLabel,
    dateAlt: dateFormatAlt(p.publicationDate),
    isNew: isNew(p.publicationDate, DAYS_TO_SHOW_NEW),
    fileType: getFileType(fileURL),
    haystack: [p.title, p.summary, typeLabel, tagsArr.join(" ")]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}
