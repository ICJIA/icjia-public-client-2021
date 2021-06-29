const grants = [
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
