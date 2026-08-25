const homicide = [
  {
    path: "/homicide/",
    name: "Homicide",
    component: () =>
      import(
        /* webpackChunkName: "homicide" */ "@/views/Homicide/Homicide.vue"
      ),
  },
];

export { homicide };
