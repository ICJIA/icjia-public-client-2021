// Hand-built routes: Vue views with no Strapi record behind them (src/router/*).
// They never pass through the per-type index generators, so this one list feeds
//   - the search index and the sitemap (searchIndexAndSitemap.js), on every build, and
//   - each page's own copy of index.html, written after the build
//     (generatePageShells.js).
// Each entry is a search record in the shape generateIndexPages produces, plus a
// `shell` object that never reaches the search index. Add new hand-built pages here.
module.exports = [
  {
    id: "homicide",
    title: "Illinois Homicide Reporting",
    altTitle: "illinois homicide reporting",
    slug: "homicide",
    category: "general",
    summary:
      "Homicide and firearm aggravated assault dashboard: offense and clearance data reported by Illinois law enforcement agencies through NIBRS, beginning in 2023, by county, agency, and reporting period, with a summary report and downloadable datasets, published under the Illinois Criminal Justice Information Act (20 ILCS 3930).",
    // The site's Fuse settings score by position (location 0, distance 200,
    // threshold 0.25), so only the first ~50 characters of a string field
    // can match. Keep searchMeta short and put the rest in tags: each tag is
    // matched on its own, from its first character.
    searchMeta: "homicide dashboard clearance rates NIBRS",
    tags: [
      "homicide",
      "homicide dashboard",
      "clearance",
      "aggravated assault",
      "firearm",
      "NIBRS",
      "Illinois State Police",
      "20 ILCS 3930",
      "PA 104-0197",
    ],
    fullPath: "/homicide/",
    imagePath: null,
    contentType: "page",
    // Head tags for the page's own copy of index.html (generatePageShells.js):
    // what link previews and crawlers that do not run JavaScript see.
    shell: {
      title: "ICJIA | Homicide Reporting",
      socialTitle: "Illinois Homicide Reporting",
      description:
        "Quarterly data on homicides and aggravated assaults with a firearm reported by Illinois law enforcement: offenses, clearances, and downloads.",
      // schema.org Dataset markup (Google Dataset Search). Downloads are listed
      // from the page's folder at build time, so a quarterly refresh needs no edit here.
      dataset: {
        name: "Illinois Homicide Reporting",
        temporalCoverage: "2023-01-01/..",
      },
    },
  },
];
