const grants = [
  {
    path: "/grants/",
    name: "FSGUHome",
    component: () =>
      import(/* webpackChunkName: "funding" */ "@/views/Grants/GrantsHome.vue"),
  },
  {
    path: "/grants/programs/",
    name: "ProgramsAll",
    component: () =>
      import(
        /* webpackChunkName: "funding" */ "@/views/Grants/ProgramsAll.vue"
      ),
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
    name: "FundingAll",
    component: () =>
      import(/* webpackChunkName: "funding" */ "@/views/Grants/FundingAll.vue"),
  },

  {
    path: "/grants/:slug",
    name: "FSGUPage",
    component: () =>
      import(/* webpackChunkName: "funding" */ "@/views/BasePage.vue"),
  },

  {
    path: "/grants/programs/:slug",
    name: "ProgramsSingle",
    component: () =>
      import(
        /* webpackChunkName: "funding" */ "@/views/Grants/ProgramsSingle.vue"
      ),
  },
  {
    path: "/grants/funding/:slug",
    name: "FundingSingle",
    component: () =>
      import(
        /* webpackChunkName: "funding" */ "@/views/Grants/FundingSingle.vue"
      ),
  },
  {
    path: "/gata/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/grants/funding/";
    },
  },
  {
    path: "/ta/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/grants/technical-assistance/";
    },
  },
  {
    path: "/gata/technical-assistance/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/grants/technical-assistance/";
    },
  },
  {
    path: "/gata/funding/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/grants/funding/";
    },
  },

  {
    path: "/gata/:slug",
    redirect: (route) => {
      return "/grants/" + route.params.slug;
    },
  },

  {
    path: "/gata/funding/:slug",
    redirect: (route) => {
      return "/grants/funding/" + route.params.slug;
    },
  },
];

export { grants };
