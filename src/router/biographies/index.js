const biographies = [
  {
    path: "/biographies/",
    name: "BiosAll",
    component: () =>
      import(
        /* webpackChunkName: "bios" */ "@/views/Biographies/BiographiesAll.vue"
      ),
  },
  {
    path: "/biographies/:slug",
    name: "BiosSingle",
    component: () =>
      import(
        /* webpackChunkName: "bios" */ "@/views/Biographies/BiographiesSingle.vue"
      ),
  },
];

export { biographies };
