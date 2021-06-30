const grants = [
  {
    path: "/grants/fsgu-home/",
    redirect: { name: "FSGUHome" },
  },
  {
    path: "/grants/",
    name: "FSGUHome",
    component: () =>
      import(/* webpackChunkName: "funding" */ "@/views/Grants/GrantsHome.vue"),
  },
  {
    path: "/grants/fsgu-staff",
    name: "FSGUStaff",
    component: () =>
      import(
        /* webpackChunkName: "funding" */ "@/views/Grants/GrantsStaff.vue"
      ),
  },
  {
    path: "/grants/funding/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/grants/fsgu-funding/";
    },
  },
  {
    path: "/grants/fsgu-funding/",
    name: "FundingAll",
    component: () =>
      import(/* webpackChunkName: "funding" */ "@/views/Grants/FundingAll.vue"),
  },
  {
    path: "/grants/ta/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/grants/fsgu-technical-assistance/";
    },
  },

  {
    path: "/grants/technical-assistance/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/grants/fsgu-technical-assistance/";
    },
  },
  {
    path: "/grants/:slug",
    name: "FSGUPage",
    component: () =>
      import(/* webpackChunkName: "funding" */ "@/views/BasePage.vue"),
  },
  {
    path: "/grants/funding/:slug",
    redirect: { name: "FundingSingle" },
  },
  {
    path: "/grants/fsgu-funding/:slug",
    name: "FundingSingle",
    component: () =>
      import(
        /* webpackChunkName: "funding" */ "@/views/Grants/FundingSingle.vue"
      ),
  },
];

export { grants };
