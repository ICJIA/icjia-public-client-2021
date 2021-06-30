const meetings = [
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
