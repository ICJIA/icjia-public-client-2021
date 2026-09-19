const redirects = [
  {
    path: "/publications/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/about/publications/";
    },
  },
  {
    // The Federal and State Grants Unit's home, and the grants breadcrumb's
    // link. The route named "FSGUHome" was removed in 2023, when /grants
    // began to lead to Funding Opportunities, and this redirect went to the
    // home page instead.
    path: "/grants/fsgu-home/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/grants/funding";
    },
  },
  {
    // The CMS's "Rules, Regulations, Policies" page (About) has no body, and
    // this address was blank. The page is the grants section's own view.
    // Read before the About pages' route, /about/:slug (src/router/index.js).
    path: "/about/policies/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/grants/rules-regs-policies/";
    },
  },
  {
    path: "/researchhub/hub-home/",
    redirect: { name: "hubHome" },
  },
  {
    path: "/innovation-and-digital-services/",
    redirect: { name: "IDSOverview" },
  },
  {
    path: "/press/",
    redirect: { name: "NewsPress" },
  },

  {
    path: "/drone/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/innovation-and-digital-services/drone/";
    },
  },
  {
    path: "/rss/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/about/rss/";
    },
  },
  {
    path: "/dicra/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/about/dicra/";
    },
  },
  {
    path: "/covid19/",
    name: "NewsCovidAlt",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/about/covid-19/";
    },
  },
  {
    path: "/foia/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/about/foia/";
    },
  },
  {
    path: "/news/volunteers/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/news/join-our-volunteer-reviewer-pool/";
    },
  },

  // {
  //   path: "/gata/funding/2021-cbvip-sfy22/",
  //   // eslint-disable-next-line no-unused-vars
  //   redirect: (route) => {
  //     return "/grants/funding/community-based-violence-intervention-and-prevention/";
  //   },
  // },

  //   {
  //     path: "/gata/:path*",
  //     redirect: (to) => {
  //       console.log("to: ", to);
  //       window.location.href = `https://icjia.illinois.gov${to.path}`;
  //       //   return '/redirecting' // not important since redirecting
  //     },
  //   },
];

export { redirects };
