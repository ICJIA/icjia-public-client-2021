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
];

export { grants };
