const about = [
  {
    path: "/about/publications",
    name: "ICJIAPublications",
    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/About/PublicationsAll.vue"),
  },
  {
    path: "/about/biographies/",
    name: "BiosAll",
    component: () =>
      import(/* webpackChunkName: "bios" */ "@/views/About/BiographiesAll.vue"),
  },
  {
    path: "/about/biographies/:slug",
    name: "BiosSingle",
    component: () =>
      import(
        /* webpackChunkName: "bios" */ "@/views/About/BiographiesSingle.vue"
      ),
  },
];

export { about };
