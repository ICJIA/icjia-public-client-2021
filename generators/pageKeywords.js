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
  "/grants/funding/": "nofo nofos notice of funding opportunity",
  // "careers" found nothing at all: no page and no posting has the word.
  "/about/employment/": "careers",
};

// The records, with the words added to the keywords of the pages named above.
// Words a page already has are not added again.
function addKeywords(records) {
  return records.map((record) => {
    const words = KEYWORDS[record.fullPath];
    if (!words) return record;
    const own = (record.searchMeta || "").trim();
    if (own.toLowerCase().includes(words)) return record;
    return { ...record, searchMeta: own ? `${own} ${words}` : words };
  });
}

module.exports = { KEYWORDS, addKeywords };
