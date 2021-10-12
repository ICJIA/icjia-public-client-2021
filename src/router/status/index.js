const status = [
  {
    path: "/status/",
    name: "Status",
    component: () =>
      import(/* webpackChunkName: "status" */ "@/views/Status/Status.vue"),
  },
];

export { status };
