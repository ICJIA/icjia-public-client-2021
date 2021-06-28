const meetings = [
  {
    path: "/meetings/:slug",
    name: "MeetingsSingle",
    component: () =>
      import(/* webpackChunkName: "meetings" */ "@/views/MeetingsSingle.vue"),
  },
];

export { meetings };
