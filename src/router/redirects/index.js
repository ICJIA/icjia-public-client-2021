const redirects = [
  {
    path: "/publications/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/about/publications/";
    },
  },
  {
    path: "/grants/fsgu-home/",
    redirect: { name: "FSGUHome" },
  },
  {
    path: "/researchhub/hub-home/",
    redirect: { name: "hubHome" },
  },
  {
    path: "/information-systems/information-systems-home/",
    redirect: { name: "ISUOverview" },
  },
  {
    path: "/press/",
    redirect: { name: "NewsPress" },
  },

  {
    path: "/drone/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/information-systems/drone/";
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
    path: "/foia/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/about/foia/";
    },
  },
];

export { redirects };
