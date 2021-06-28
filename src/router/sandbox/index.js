const sandboxes = [
  {
    path: "/sandbox",
    name: "Sandbox",
    component: () =>
      import(/* webpackChunkName: "sandbox" */ "@/views/Sandbox.vue"),
  },
  {
    path: "/sandbox2",
    name: "Sandbox2",
    component: () =>
      import(/* webpackChunkName: "sandbox" */ "@/views/Sandbox2.vue"),
  },
];

export { sandboxes };
