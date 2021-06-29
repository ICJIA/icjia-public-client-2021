const grants = [
  {
    path: "/grants/grants-home/",
    redirect: { name: "FSGUHome" },
  },
  {
    path: "/grants/",
    name: "FSGUHome",
    component: () =>
      import(/* webpackChunkName: "funding" */ "@/views/Grants/GrantsHome.vue"),
  },
  {
    path: "/grants/staff",
    name: "FSGUStaff",
    component: () =>
      import(
        /* webpackChunkName: "funding" */ "@/views/Grants/GrantsStaff.vue"
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
