// Words people search for that a CMS page's own keywords lack (v1.5.95).
//
// "nofo" found 110 funding notices and one job posting, and not the Funding
// Opportunities page, where the notices are listed: that page's keywords in
// the CMS are "funding", and its text says "Notice of Funding Opportunity"
// further down than the search reads. The words below are added to the page's
// keywords (searchMeta) in the search index at every build, whatever the CMS
// holds; they are shown nowhere. The site's pages come first in the results
// (src/utils/searchFields.js), so a page that holds the word leads.
//
// One entry per page, by its path. Add a page here when people look for it by
// a word its editors did not think of.
const KEYWORDS = {
  // v1.5.121: "rfp" and "how to apply" found nothing; "apply for a grant" and
  // "grant application" led with news posts.
  "/grants/funding/":
    "nofo nofos notice of funding opportunity rfp apply how to apply grant application",
  // "careers" found nothing at all: no page and no posting has the word.
  // v1.5.121: "job openings" found nothing, "vacancies" the postings alone.
  "/about/employment/": "careers vacancies vacant job openings openings",
  // v1.5.121: "phone number" found nothing.
  "/about/contact/": "phone phone number address email",
  // v1.5.121: "board members" found nothing; the page has no keywords of its own.
  "/about/composition-and-membership/": "board board members",
  // Reported because statutes require it, and listed in the Research menu
  // under "Statutory Reporting"; "statutory" found neither. The third such
  // page, /homicide/, is hand-built: its words are in ./manualPages.js.
  "/researchhub/dicra/": "statutory reporting requirement",
  "/innovation-and-digital-services/drone/": "statutory reporting requirement",
};

// Pages that are lists of links, and the CMS collections whose titles are the
// links' names. The collections have no search records of their own, so
// "time certification" and "language access plan" found nothing.
// generateIndexPageLinks.js fetches the titles at build time, and
// searchIndexAndSitemap.js adds them to each page's keywords. To make another
// such page searchable by its links, name it here.
const LINKED_COLLECTIONS = {
  "/grants/required-forms/": ["requiredForms"],
  "/grants/rules-regs-policies/": ["rules", "regulations", "policies"],
};

// Titles as keywords, tidied.
function linkLabels(items) {
  return (items || [])
    .map((item) => (item && item.title ? item.title : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

// What was fetched ({ collection: [{ title }] }), as keywords for each page.
// A collection that was not fetched adds nothing.
function labelsByPage(data) {
  const labels = {};
  Object.keys(LINKED_COLLECTIONS).forEach((fullPath) => {
    const items = LINKED_COLLECTIONS[fullPath].reduce(
      (all, name) => all.concat((data && data[name]) || []),
      []
    );
    labels[fullPath] = linkLabels(items);
  });
  return labels;
}

// The records, with words added to the keywords of the pages named above, and
// of the pages named in `more` (path: words). Words a page already has are not
// added again.
function addKeywords(records, more = {}) {
  return records.map((record) => {
    const words = [KEYWORDS[record.fullPath], more[record.fullPath]]
      .filter(Boolean)
      .join(" ");
    if (!words) return record;
    const own = (record.searchMeta || "").trim();
    if (own.toLowerCase().includes(words.toLowerCase())) return record;
    return { ...record, searchMeta: own ? `${own} ${words}` : words };
  });
}

module.exports = {
  KEYWORDS,
  LINKED_COLLECTIONS,
  addKeywords,
  linkLabels,
  labelsByPage,
};
