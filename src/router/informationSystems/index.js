const informationSystems = [
  {
    path: "/information-systems/",
    name: "ISUOvervierw",
    component: () =>
      import(
        /* webpackChunkName: "isu" */ "@/views/InformationSystems/ISUHome.vue"
      ),
  },

  {
    path: "/information-systems/:slug",
    name: "ISUpage",
    component: () =>
      import(/* webpackChunkName: "isu" */ "@/views/BasePage.vue"),
  },
];

export { informationSystems };
