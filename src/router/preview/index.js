const preview = [
  {
    path: "/preview",
    name: "Preview",
    component: () =>
      import(/* webpackChunkName: "preview" */ "@/views/Preview.vue"),
  },
];

export { preview };
