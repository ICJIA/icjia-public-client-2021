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
    path: "/gata/funding/:slug",
    name: "FundingSingleAlt",
    component: () =>
      import(
        /* webpackChunkName: "funding" */ "@/views/Grants/FundingSingle.vue"
      ),
  },

  {
    path: "/gata/:slug",
    name: "FSGUPageAlt",
    component: () =>
      import(/* webpackChunkName: "funding" */ "@/views/BasePage.vue"),
  },

  //   {
  //     path: "/a/:slug",
  //     redirect: route => {
  //         return "/b/" + route.params.slug;
  //     }
  // }
];

export { grants };
