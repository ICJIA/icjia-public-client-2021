// CMS pages whose address is not their CMS category's (v1.5.137).
//
// A page's address is /<category>/<slug>/, and the CMS has no "partners"
// category. The page below is filed under About in the CMS and lives at
// /partners/: this is the address the search, the sitemap and the page shell
// hold (and so the canonical link). The route is in src/router/about, and the
// address under /about/ redirects to it (src/router/redirects).
const MOVED = {
  "icjia-umich-partnership": "/partners/icjia-umich-partnership/",
};

function pagePath(page) {
  if (MOVED[page.slug]) return MOVED[page.slug];
  return page.category === "general"
    ? `/${page.slug}/`
    : `/${page.category}/${page.slug}/`;
}

module.exports = { MOVED, pagePath };
