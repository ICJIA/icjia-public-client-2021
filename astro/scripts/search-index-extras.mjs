// What the live (Vue) site's search index holds beyond the CMS records (v1.5.146),
// ported from generators/ so the two indexes match:
//
//   KEYWORDS / LINKED_COLLECTIONS / addKeywords / labelsByPage
//       ← generators/pageKeywords.js (v1.5.95, v1.5.97, v1.5.121)
//   RETIRED / withoutRetired   ← generators/retiredPages.js (v1.5.97)
//   MANUAL_PAGES               ← generators/manualPages.js, without `shell`
//                                (./search-manual-pages.json)
//   partnerRecords             ← generators/partnerLinks.js (v1.5.92), with its
//                                WORDS table in ./search-partner-words.json
//
// An entry added on one side belongs on the other until the cutover.
import { readFileSync } from "node:fs";

const json = (file) => JSON.parse(readFileSync(new URL(file, import.meta.url), "utf8"));

// Words people search for that a CMS page's own keywords lack, by page.
export const KEYWORDS = {
  "/grants/funding/":
    "nofo nofos notice of funding opportunity rfp apply how to apply grant application",
  "/about/employment/": "careers vacancies vacant job openings openings",
  "/about/contact/": "phone phone number address email",
  "/about/composition-and-membership/": "board board members",
  "/researchhub/dicra/": "statutory reporting requirement",
  "/innovation-and-digital-services/drone/": "statutory reporting requirement",
};

// Pages that are lists of links, and the CMS collections whose titles are the
// links' names: the titles are added to the page's keywords.
export const LINKED_COLLECTIONS = {
  "/grants/required-forms/": ["requiredForms"],
  "/grants/rules-regs-policies/": ["rules", "regulations", "policies"],
};

export const PAGE_LINKS_QUERY = `query {
${[].concat(...Object.values(LINKED_COLLECTIONS)).map((name) => `  ${name}(limit: -1) { title }`).join("\n")}
}`;

function linkLabels(items) {
  return (items || [])
    .map((item) => (item && item.title ? item.title : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

// What was fetched ({ collection: [{ title }] }), as keywords for each page.
export function labelsByPage(data) {
  const labels = {};
  for (const fullPath of Object.keys(LINKED_COLLECTIONS)) {
    const items = LINKED_COLLECTIONS[fullPath].reduce(
      (all, name) => all.concat((data && data[name]) || []),
      [],
    );
    labels[fullPath] = linkLabels(items);
  }
  return labels;
}

// The records, with KEYWORDS and `more` (path: words) added to their keywords;
// words a page already has are not added again.
export function addKeywords(records, more = {}) {
  return records.map((record) => {
    const words = [KEYWORDS[record.fullPath], more[record.fullPath]].filter(Boolean).join(" ");
    if (!words) return record;
    const own = (record.searchMeta || "").trim();
    if (own.toLowerCase().includes(words.toLowerCase())) return record;
    return { ...record, searchMeta: own ? `${own} ${words}` : words };
  });
}

// The CMS's empty "Rules, Regulations, Policies" page under About: the page is
// /grants/rules-regs-policies/ (a hand-built record below).
export const RETIRED = ["/about/policies/"];

export function withoutRetired(records) {
  return records.filter((record) => !RETIRED.includes(record.fullPath));
}

// Hand-built pages with no CMS record (News, Press Releases, the Hub's lists…).
export const MANUAL_PAGES = json("./search-manual-pages.json");

// The Partners menu: the agency's other sites and its plans, from the menu.
const WORDS = json("./search-partner-words.json");
const TYPE_BY_SECTION = { "Plans, Initiatives, and Partnerships": "plan" };
const DEFAULT_TYPE = "partner site";

export function partnerRecords(menus) {
  const partners = (menus.menu || []).find((m) => m.main === "Partners");
  if (!partners) return [];
  let contentType = DEFAULT_TYPE;
  const records = [];
  for (const child of partners.children || []) {
    if (child.section) contentType = TYPE_BY_SECTION[child.section] || DEFAULT_TYPE;
    if (!child.link || !child.external) continue;
    const words = WORDS[child.link] || {};
    const short = words.short || "";
    records.push({
      title: child.title,
      altTitle: short,
      summary: words.summary || child.title,
      searchMeta: short || child.title,
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
