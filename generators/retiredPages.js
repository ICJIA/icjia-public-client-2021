// CMS records whose page is somewhere else (v1.5.97).
//
// The CMS has a page "Rules, Regulations, Policies" in the About section with
// no body: /about/policies/ was blank, and it was the address the search and
// the sitemap held. The page is the hand-built view at
// /grants/rules-regs-policies/ (./manualPages.js), and the old address
// redirects to it (src/router/redirects). The empty record is left out of the
// search index and the sitemap.
const RETIRED = ["/about/policies/"];

function withoutRetired(records) {
  return records.filter((record) => !RETIRED.includes(record.fullPath));
}

module.exports = { RETIRED, withoutRetired };
