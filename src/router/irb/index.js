const irb = [
  {
    path: "/irb/",
    name: "IRBoverview",
    component: () =>
      import(/* webpackChunkName: "meetings" */ "@/views/Irb/IRBOverview.vue"),
  },
];

export { irb };
