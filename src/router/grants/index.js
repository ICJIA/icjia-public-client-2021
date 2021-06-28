const grants = [
  {
    path: "/grants/funding/:slug",
    name: "FundingSingle",
    component: () =>
      import(/* webpackChunkName: "funding" */ "@/views/FundingSingle.vue"),
  },
];

export { grants };
