const events = [
  {
    path: "/events/",
    name: "EventsAll",
    component: () =>
      import(/* webpackChunkName: "events" */ "@/views/Events/EventsAll.vue"),
  },
  {
    path: "/events/:slug",
    name: "EventsSingle",
    component: () =>
      import(
        /* webpackChunkName: "events" */ "@/views/Events/EventsSingle.vue"
      ),
  },
];

export { events };
