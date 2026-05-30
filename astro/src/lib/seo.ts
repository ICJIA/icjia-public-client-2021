// Central SEO config + helpers (checklist §8). Values are the management-APPROVED
// prod ones (source of truth: repo-root public/index.html), so canonicals, OG, and
// JSON-LD match prod exactly. Consumed by BaseLayout via astro-seo's <SEO>.

export const siteConfig = {
  siteName: "Illinois Criminal Justice Information Authority",
  siteShortName: "ICJIA",
  /** PROD origin — canonicals/OG always use this, never the branch host. */
  siteOrigin: "https://icjia.illinois.gov",
  /** EXACT prod meta description (110 chars; 80–160 budget). */
  defaultDescription:
    "ICJIA is an Illinois state agency improving criminal justice through research, grants, and policy development.",
  /** Branded 1200×630 OG image — `public/icjia-og.png` (built by
   *  scripts/generate-og-image.mjs). A SITE-RELATIVE path on purpose: BaseLayout
   *  resolves it against the CURRENT deploy origin (not the pinned prod origin used
   *  for canonical), so it resolves on the branch preview AND post-cutover prod — an
   *  og:image only needs to point at wherever the image is actually hosted. */
  ogImage: "/icjia-og.png",
  /** EXACT prod google-site-verification token. */
  googleSiteVerification: "ztA1vSFu3a9Kfu-KCtYP5kNpFTDvbQ4hNfpY2A8ca7Q",
} as const;

// Build-time guard (§8): an over-budget default would silently truncate every
// fallback page's description.
if (siteConfig.defaultDescription.length > 160) {
  throw new Error(
    `siteConfig.defaultDescription is ${siteConfig.defaultDescription.length} chars; must be <= 160.`,
  );
}

/**
 * Build the page <title> as **`ICJIA | <chunk>`** — the EXACT prod convention
 * (legacy src/App.vue titleTemplate: `chunk ? \`ICJIA | ${chunk}\` : "ICJIA"`).
 * Pages pass a BARE chunk (a post title or a section name); the brand is prepended
 * here. A missing/blank chunk (or one that is just the brand) yields a bare "ICJIA".
 * NOT truncated — prod never truncates, and a clipped title drops SEO keywords
 * (Google clips the SERP *display* but ranks on the full title; Lighthouse SEO
 * doesn't score title length). Section chunks are short; CMS detail titles keep
 * their full text, matching prod byte-for-byte.
 */
export function buildTitle(chunk?: string): string {
  const brand = siteConfig.siteShortName; // "ICJIA"
  const c = (chunk || "").trim();
  if (!c || c === brand) return brand;
  return `${brand} | ${c}`;
}

/** Description clamped to ≤ `max` (word-boundary). Falls back to the site default. */
export function truncateDescription(desc?: string, max = 160): string {
  const d = (desc || "").trim() || siteConfig.defaultDescription;
  if (d.length <= max) return d;
  let cut = d.slice(0, max - 1);
  const sp = cut.lastIndexOf(" ");
  if (sp > 80) cut = cut.slice(0, sp);
  return cut + "…";
}

// ── JSON-LD (structured data) ────────────────────────────────────────────────
// Builders return PLAIN OBJECTS; BaseLayout serializes via serializeJsonLd() into a
// <script type="application/ld+json">. All URLs use the canonical (prod) origin since
// structured data describes the canonical resource. Detail-page JSON-LD (NewsArticle,
// Event, JobPosting, Person, …) gives Google rich-result eligibility + satisfies the
// AI-readiness checks (structured data + authorship + freshness) metapeek probes.

type JsonLd = Record<string, any>;

/** The agency, reused as publisher / author-of-record / organizer across types. */
const ORG: JsonLd = {
  "@type": "GovernmentOrganization",
  name: siteConfig.siteName,
  alternateName: siteConfig.siteShortName,
  url: siteConfig.siteOrigin + "/",
};
const ORG_WITH_LOGO: JsonLd = {
  ...ORG,
  logo: { "@type": "ImageObject", url: siteConfig.siteOrigin + "/icjia-logo.png" },
};

/** Resolve a site-relative path to a canonical (prod-origin) absolute URL. */
const absUrl = (path: string) => new URL(path, siteConfig.siteOrigin).href;
/** Strip tags + collapse whitespace; undefined when empty (so the key is omitted). */
const plain = (s?: string) =>
  (s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || undefined;

/** Serialize a JSON-LD object (or array) for set:html, escaping `<` to stay XSS-safe. */
export function serializeJsonLd(obj: JsonLd | JsonLd[]): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

/**
 * Home JSON-LD: WebSite (+ SearchAction → /search/?q=) + GovernmentOrganization,
 * matching the prod homepage @graph.
 */
export function buildHomeJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        url: siteConfig.siteOrigin + "/",
        name: siteConfig.siteName,
        alternateName: siteConfig.siteShortName,
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteConfig.siteOrigin}/search/?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      { ...ORG_WITH_LOGO },
    ],
  };
}

/** Article-family (NewsArticle / Article / ScholarlyArticle / Report). */
export function buildArticleJsonLd(o: {
  type?: "NewsArticle" | "Article" | "ScholarlyArticle" | "Report";
  path: string;
  headline: string;
  description?: string;
  datePublished?: string;
  dateModified?: string;
  authors?: string[];
  image?: string;
}): JsonLd {
  const ld: JsonLd = {
    "@context": "https://schema.org",
    "@type": o.type || "Article",
    headline: o.headline,
    url: absUrl(o.path),
    mainEntityOfPage: { "@type": "WebPage", "@id": absUrl(o.path) },
    publisher: ORG_WITH_LOGO,
    author:
      o.authors && o.authors.length
        ? o.authors.map((n) => ({ "@type": "Person", name: n }))
        : ORG,
  };
  const d = plain(o.description);
  if (d) ld.description = d;
  if (o.datePublished) ld.datePublished = o.datePublished;
  ld.dateModified = o.dateModified || o.datePublished || undefined;
  if (o.image) ld.image = o.image;
  return ld;
}

/**
 * Event (events) / governmental Event (meetings). Faithful to the legacy structured
 * data: Mixed attendance mode (ICJIA events/meetings commonly offer in-person + online)
 * + inLanguage en-US + the agency as organizer. A `virtualLocation` (the meeting's
 * external link) and `attachments` (agenda/minutes PDFs → associatedMedia) are emitted
 * only when supplied — NO forced physical address (the legacy emitted none, and
 * asserting Offline/Chicago for a virtual meeting would be wrong).
 */
export function buildEventJsonLd(o: {
  path: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  cancelled?: boolean;
  inLanguage?: string;
  /** the meeting's external (often virtual) location link */
  virtualLocation?: { url: string; name?: string };
  /** downloadable agenda/minutes/materials → schema.org associatedMedia */
  attachments?: Array<{ name?: string; url: string; encodingFormat?: string }>;
}): JsonLd {
  const ld: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: o.name,
    url: absUrl(o.path),
    inLanguage: o.inLanguage || "en-US",
    eventStatus: o.cancelled
      ? "https://schema.org/EventCancelled"
      : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
    organizer: ORG,
  };
  const d = plain(o.description);
  if (d) ld.description = d;
  if (o.startDate) ld.startDate = o.startDate;
  if (o.endDate) ld.endDate = o.endDate;
  if (o.virtualLocation?.url) {
    ld.location = {
      "@type": "VirtualLocation",
      url: o.virtualLocation.url,
      ...(o.virtualLocation.name ? { name: o.virtualLocation.name } : {}),
    };
  }
  const media = (o.attachments || [])
    .filter((a) => a.url && a.name)
    .map((a) => ({
      "@type": "MediaObject",
      name: a.name,
      contentUrl: a.url,
      ...(a.encodingFormat ? { encodingFormat: a.encodingFormat } : {}),
    }));
  if (media.length) ld.associatedMedia = media;
  return ld;
}

/** JobPosting (employment). */
export function buildJobPostingJsonLd(o: {
  path: string;
  title: string;
  description?: string;
  datePosted?: string;
  validThrough?: string;
}): JsonLd {
  const ld: JsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: o.title,
    url: absUrl(o.path),
    hiringOrganization: ORG_WITH_LOGO,
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: "Chicago", addressRegion: "IL", addressCountry: "US" },
    },
  };
  ld.description = plain(o.description) || o.title;
  if (o.datePosted) ld.datePosted = o.datePosted;
  if (o.validThrough) ld.validThrough = o.validThrough;
  return ld;
}

/** Person (biographies). */
export function buildPersonJsonLd(o: {
  path: string;
  name: string;
  jobTitle?: string;
  unit?: string;
}): JsonLd {
  const ld: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: o.name,
    url: absUrl(o.path),
    worksFor: o.unit ? { "@type": "Organization", name: o.unit, parentOrganization: ORG } : ORG,
  };
  if (o.jobTitle) ld.jobTitle = o.jobTitle;
  return ld;
}

/** Dataset (research datasets). */
export function buildDatasetJsonLd(o: {
  path: string;
  name: string;
  description?: string;
}): JsonLd {
  const ld: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: o.name,
    url: absUrl(o.path),
    creator: ORG,
    includedInDataCatalog: { "@type": "DataCatalog", name: "ICJIA ResearchHub" },
  };
  const d = plain(o.description);
  if (d) ld.description = d;
  return ld;
}

/** WebApplication (research web apps). */
export function buildAppJsonLd(o: {
  path: string;
  name: string;
  description?: string;
  appUrl?: string;
}): JsonLd {
  const ld: JsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: o.name,
    url: o.appUrl || absUrl(o.path),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: ORG_WITH_LOGO,
  };
  const d = plain(o.description);
  if (d) ld.description = d;
  return ld;
}
