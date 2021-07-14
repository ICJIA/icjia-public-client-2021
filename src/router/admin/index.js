const admin = [
  {
    path: "/admin/",
    name: "adminIndex",
    component: () =>
      import(/* webpackChunkName: "events" */ "@/views/Admin/AdminHome.vue"),
  },
  {
    path: "/admin/publications",
    name: "adminPublicationEditor",
    component: () =>
      import(
        /* webpackChunkName: "events" */ "@/views/Admin/PublicationEditor.vue"
      ),
  },
];

export { admin };
