// The canonical address of a route: the slash-terminated form without a query,
// which is the form sitemap.xml lists (generators/searchIndexAndSitemap.js).
// "/homicide" and "/homicide/" are the same page; declaring one address for
// both keeps search engines from splitting the page's standing between them.
const SITE = "https://icjia.illinois.gov";

export function canonicalUrl(path) {
  const clean = String(path || "/").split(/[?#]/)[0];
  return SITE + (clean.endsWith("/") ? clean : `${clean}/`);
}
