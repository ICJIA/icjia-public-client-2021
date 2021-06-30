const meetings = [
  {
    path: "/meetings/",
    name: "MeetingsAll",
    component: () =>
      import(
        /* webpackChunkName: "meetings" */ "@/views/Meetings/MeetingsAll.vue"
      ),
  },
  {
    path: "/meetings/:slug",
    name: "MeetingsSingle",
    component: () =>
      import(
        /* webpackChunkName: "meetings" */ "@/views/Meetings/MeetingsSingle.vue"
      ),
  },
];

export { meetings };
