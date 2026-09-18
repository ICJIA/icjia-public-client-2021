// Search records for the Partners menu (v1.5.92).
//
// The Partners dropdown links to the agency's other sites and to its plans,
// and none of them was in the site search: "R3" found news about R3 and not
// the R3 site. A record is built here for every link in that dropdown, from
// src/config/menus.json itself, so a link added to the menu is searchable at
// the next build with nothing else to remember.
//
// WORDS is optional. `short` is the name people type ("R3", "ARI", "SPAC"). It
// is the record's whole searchMeta and altTitle, and a tag, because the search
// favours a short field that matches exactly: that is what puts the R3 site
// above the sixty other records that mention R3, and keeps "ARI" from losing
// to every Maria. Longer names are tags. A link without an entry is still
// found by its title. The descriptions follow each site's own.
//
// The records point off this site (`external: true`): searchIndexAndSitemap.js
// leaves them out of the sitemap, and the result cards open them in a new tab,
// as the menu does.
const WORDS = {
  "https://icjia.illinois.gov/adultredeploy/": {
    short: "ARI",
    summary:
      "Adult Redeploy Illinois (ARI) is the state grant program, administered by ICJIA, that funds community-based alternatives to incarceration.",
    tags: ["adult redeploy illinois", "adult redeploy"],
  },
  "http://dvfr.illinois.gov": {
    short: "DVFR",
    summary:
      "The Illinois Domestic Violence Fatality Review (DVFR) Committee is the statewide resource for domestic violence fatality review, regional review teams and systems change.",
    tags: ["domestic violence fatality review", "fatality review"],
  },
  "http://icjia.illinois.gov/ifvcc/": {
    short: "IFVCC",
    summary:
      "Family Violence Coordinating Councils, at the state and the local or circuit level, provide a forum to improve the institutional, professional and community response to family violence.",
    tags: ["family violence coordinating councils", "family violence"],
  },
  "http://ilheals.com": {
    short: "ilheals",
    summary:
      "Illinois HEALS (Helping Everyone Access Linked Systems) worked to connect children, youth and families who experienced victimization with services. The site has been archived.",
    tags: ["illinois heals", "heals"],
  },
  "http://i2i.illinois.gov": {
    short: "i2i",
    summary:
      "Institute to Innovate (i2i) is ICJIA's capacity-building hub for Illinois community-based organizations seeking training and support.",
    tags: [
      "institute to innovate",
      "institute 2 innovate",
      "capacity building",
    ],
  },
  "https://r3.illinois.gov/": {
    short: "R3",
    summary:
      "The R3 (Restore, Reinvest, and Renew) program invests in communities most affected by systemic racism and disinvestment, through economic development, violence prevention, reentry, youth development and civil legal aid.",
    tags: ["restore reinvest renew", "restore reinvest and renew"],
  },
  "https://spac.illinois.gov/": {
    short: "SPAC",
    summary:
      "The Sentencing Policy Advisory Council (SPAC) is Illinois' non-partisan, independent sentencing commission, which analyzes the effects of sentencing policy.",
    tags: ["sentencing policy advisory council", "sentencing policy"],
  },
  "https://researchhub.icjia-api.cloud/uploads/JAG%202024-29%20FINAL%20DRAFT%208-2024-240808T19411840.pdf":
    {
      short: "JAG",
      summary:
        "Illinois' strategic plan for the Edward Byrne Memorial Justice Assistance Grant (JAG) program, 2024-2029 (PDF).",
      tags: [
        "jag strategic plan",
        "justice assistance grant",
        "strategic plan",
      ],
    },
  "https://agency.icjia-api.cloud/uploads/SCIP_Plan_dcfbbe3669.pdf": {
    short: "SCIP",
    summary:
      "Illinois' plan for the Edward Byrne State Crisis Intervention Program (SCIP), 2023 (PDF).",
    tags: ["state crisis intervention program", "crisis intervention plan"],
  },
  "https://agency.icjia-api.cloud/uploads/Illinois_JAG_Strategic_Plan_c5287026fe.pdf":
    {
      short: "JAG",
      summary:
        "Illinois' strategic plan for the Edward Byrne Memorial Justice Assistance Grant (JAG) program, 2019-2024 (PDF).",
      tags: [
        "jag strategic plan",
        "justice assistance grant",
        "strategic plan",
      ],
    },
  "https://vpp.icjia.illinois.gov/": {
    short: "VPP",
    summary:
      "The Statewide Violence Prevention Plan for Illinois, 2025-2029: the state's violence prevention strategies and how they are carried out.",
    tags: ["statewide violence prevention plan", "violence prevention plan"],
  },
};

// The menu's section headings name the kind of record beneath them.
const TYPE_BY_SECTION = { "Plans and Initiatives": "plan" };
const DEFAULT_TYPE = "partner site";

function partnerRecords(menus) {
  const partners = (menus.menu || []).find((m) => m.main === "Partners");
  if (!partners) return [];
  let contentType = DEFAULT_TYPE;
  const records = [];
  for (const child of partners.children || []) {
    if (child.section)
      contentType = TYPE_BY_SECTION[child.section] || DEFAULT_TYPE;
    if (!child.link) continue;
    const words = WORDS[child.link] || {};
    const short = words.short || "";
    records.push({
      title: child.title,
      altTitle: short,
      summary: words.summary || child.title,
      searchMeta: short || child.title,
      // "website", so that "r3 website" finds the R3 site.
      tags: [short.toLowerCase(), ...(words.tags || [])]
        .concat(contentType === DEFAULT_TYPE ? ["website"] : [])
        .filter(Boolean),
      contentType,
      fullPath: child.link,
      external: true,
    });
  }
  return records;
}

module.exports = { partnerRecords };
