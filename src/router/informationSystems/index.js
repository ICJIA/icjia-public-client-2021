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
    path: "/information-systems/infonet",
    name: "Infonet",
    component: () =>
      import(
        /* webpackChunkName: "isu" */ "@/views/InformationSystems/Infonet.vue"
      ),
  },

  {
    path: "/information-systems/isu-staff",
    name: "ISUStaff",
    component: () =>
      import(
        /* webpackChunkName: "isu" */ "@/views/InformationSystems/ISUStaff.vue"
      ),
  },

  {
    path: "/information-systems/:slug",
    name: "ISUBasepage",
    component: () =>
      import(/* webpackChunkName: "isu" */ "@/views/BasePage.vue"),
  },
];

export { informationSystems };
