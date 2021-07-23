const admin = [
  {
    path: "/admin/",
    name: "adminIndex",
    meta: {
      requiresAuth: true,
    },
    component: () =>
      import(/* webpackChunkName: "admin" */ "@/views/Admin/AdminHome.vue"),
  },
  {
    path: "/admin/login/",
    name: "login",
    component: () =>
      import(/* webpackChunkName: "admin" */ "@/views/Admin/Login.vue"),
  },
  {
    path: "/admin/logout/",
    name: "logout",
    component: () =>
      import(/* webpackChunkName: "admin" */ "@/views/Admin/Logout.vue"),
  },
  {
    path: "/admin/publications",
    name: "adminPublicationEditor",
    meta: {
      requiresAuth: true,
    },
    component: () =>
      import(
        /* webpackChunkName: "admin" */ "@/views/Admin/PublicationEditor.vue"
      ),
  },
];

export { admin };
