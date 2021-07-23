const irb = [
  {
    path: "/irb/",
    name: "IRBoverview",
    component: () =>
      import(/* webpackChunkName: "meetings" */ "@/views/Irb/IRBHome.vue"),
  },
  {
    path: "/irb/irb-meetings/",
    name: "IRBMeetings",
    component: () =>
      import(/* webpackChunkName: "meetings" */ "@/views/Irb/IRBMeetings.vue"),
  },
  {
    path: "/irb/:slug",
    name: "IRBpage",
    component: () =>
      import(/* webpackChunkName: "meetings" */ "@/views/BasePage.vue"),
  },
];

export { irb };
