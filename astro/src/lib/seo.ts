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
  /** EXACT prod og:image (do not invent a new one). */
  ogImage: "https://icjia.illinois.gov/icjia-half-splash-thumb-v2.jpg",
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

/**
 * Home-only JSON-LD: WebSite (+ SearchAction → /search/?q=) + GovernmentOrganization,
 * matching the prod homepage block. Emitted ONLY when isHome (guarded in BaseLayout)
 * so it never duplicates on interior pages.
 */
export function buildHomeJsonLd(): string {
  const ld = {
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
      {
        "@type": "GovernmentOrganization",
        name: siteConfig.siteName,
        alternateName: siteConfig.siteShortName,
        url: siteConfig.siteOrigin + "/",
        logo: {
          "@type": "ImageObject",
          url: siteConfig.ogImage,
        },
      },
    ],
  };
  return JSON.stringify(ld).replace(/</g, "\\u003c");
}
