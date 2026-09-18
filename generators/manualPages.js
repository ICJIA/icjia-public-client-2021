// Hand-built routes: Vue views with no Strapi record behind them (src/router/*).
// They never pass through the per-type index generators, so this one list feeds
//   - the search index and the sitemap (searchIndexAndSitemap.js), on every build, and
//   - each page's own copy of index.html, written after the build
//     (generatePageShells.js).
// Each entry is a search record in the shape generateIndexPages produces. A page may
// also carry a `shell` object (its own head tags), which never reaches the search
// index; listing pages such as News and Meetings are search records only.
// Add new hand-built pages here.
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
  {
    id: "grant-status",
    title: "Grant Status Request",
    altTitle: "grant status request",
    slug: "grant-status",
    category: "forms",
    summary: "A form for asking ICJIA about the status of a grant.",
    searchMeta: "request grant status",
    tags: ["grant status", "grant status request", "grants"],
    fullPath: "/forms/grant-status/",
    imagePath: null,
    contentType: "page",
  },
  {
    id: "news",
    title: "News & Information",
    altTitle: "news & information",
    slug: "news",
    category: "news",
    summary:
      "ICJIA news and announcements: press releases, funding notices, research releases, and agency updates.",
    searchMeta: "news announcements",
    tags: ["news", "announcements", "press releases"],
    fullPath: "/news/",
    imagePath: null,
    contentType: "page",
  },
  {
    id: "meetings",
    title: "ICJIA Meetings",
    altTitle: "icjia meetings",
    slug: "meetings",
    category: "news",
    summary:
      "Upcoming and past ICJIA board, committee, and task force meetings, with agendas, minutes, and recordings.",
    searchMeta: "meetings agendas minutes",
    tags: [
      "meetings",
      "meeting minutes",
      "agendas",
      "board meetings",
      "committee meetings",
      "task force meetings",
      "meeting recordings",
    ],
    fullPath: "/news/meetings/",
    imagePath: null,
    contentType: "page",
  },
  {
    id: "publications",
    title: "ICJIA Publications",
    altTitle: "icjia publications",
    slug: "publications",
    category: "researchhub",
    summary:
      "All ICJIA publications: research reports, evaluations, annual reports, and statutory reports.",
    searchMeta: "publications reports",
    tags: ["publications", "reports", "research reports", "annual reports"],
    fullPath: "/researchhub/publications/",
    imagePath: null,
    contentType: "page",
  },
  {
    id: "researchhub",
    title: "Research Hub",
    altTitle: "research hub",
    slug: "researchhub",
    category: "researchhub",
    summary:
      "ICJIA's Research Hub: articles, web applications, datasets, and publications from the Research and Analysis Unit, the Illinois Statistical Analysis Center.",
    searchMeta: "research hub research and analysis",
    tags: [
      "research hub",
      "research",
      "research and analysis",
      "statistical analysis center",
      "SAC",
    ],
    fullPath: "/researchhub/",
    imagePath: null,
    contentType: "page",
  },
  {
    id: "researchhub-articles",
    title: "Research Hub Articles",
    altTitle: "research hub articles",
    slug: "researchhub-articles",
    category: "researchhub",
    summary:
      "Research Hub articles: ICJIA research on criminal justice in Illinois, written for a general audience.",
    searchMeta: "articles research articles",
    tags: ["articles", "research articles"],
    fullPath: "/researchhub/articles/",
    imagePath: null,
    contentType: "page",
  },
  {
    id: "researchhub-apps",
    title: "Research Hub Web Applications",
    altTitle: "research hub web applications",
    slug: "researchhub-apps",
    category: "researchhub",
    summary: "Interactive dashboards and data tools from ICJIA's Research Hub.",
    searchMeta: "web applications dashboards",
    tags: ["web applications", "apps", "dashboards", "data tools"],
    fullPath: "/researchhub/apps/",
    imagePath: null,
    contentType: "page",
  },
  {
    id: "researchhub-datasets",
    title: "Research Hub Datasets",
    altTitle: "research hub datasets",
    slug: "researchhub-datasets",
    category: "researchhub",
    summary:
      "Downloadable criminal justice datasets from ICJIA's Research Hub.",
    searchMeta: "datasets data downloads",
    tags: ["datasets", "data", "data downloads"],
    fullPath: "/researchhub/datasets/",
    imagePath: null,
    contentType: "page",
  },
  {
    id: "programs",
    title: "Funded Programs",
    altTitle: "funded programs",
    slug: "programs",
    category: "grants",
    summary:
      "The grant programs ICJIA funds and administers, current and archived.",
    searchMeta: "programs funded programs grant programs",
    tags: ["programs", "funded programs", "grant programs", "grants"],
    fullPath: "/grants/programs/",
    imagePath: null,
    contentType: "page",
  },
  {
    id: "events",
    title: "ICJIA Events",
    altTitle: "icjia events",
    slug: "events",
    category: "news",
    summary:
      "A calendar of ICJIA events, meetings, funding opportunity deadlines, and job posting deadlines.",
    searchMeta: "events calendar",
    tags: ["events", "calendar", "event calendar", "deadlines"],
    fullPath: "/events/",
    imagePath: null,
    contentType: "page",
  },
];
