const irb = [
  {
    path: "/irb/",
    name: "IRBoverview",
    component: () =>
      import(/* webpackChunkName: "meetings" */ "@/views/Irb/IRBOverview.vue"),
  },
  {
    path: "/irb/:slug",
    name: "IRBpage",
    component: () =>
      import(/* webpackChunkName: "meetings" */ "@/views/Irb/IRBPage.vue"),
  },
];

export { irb };
