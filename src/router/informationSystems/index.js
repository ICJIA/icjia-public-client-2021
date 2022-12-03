const informationSystems = [
  // {
  //   path: "/innovation-and-digital-services/",
  //   name: "ISUOverview",
  //   component: () =>
  //     import(
  //       /* webpackChunkName: "isu" */ "@/views/InformationSystems/ISUHome.vue"
  //     ),
  // },
  // {
  //   path: "/innovation-and-digital-services/infonet/",
  //   name: "Infonet",
  //   component: () =>
  //     import(
  //       /* webpackChunkName: "isu" */ "@/views/InformationSystems/Infonet.vue"
  //     ),
  // },

  // {
  //   path: "/innovation-and-digital-services/isu-staff/",
  //   name: "ISUStaff",
  //   component: () =>
  //     import(
  //       /* webpackChunkName: "isu" */ "@/views/InformationSystems/ISUStaff.vue"
  //     ),
  // },

  // {
  //   path: "/innovation-and-digital-services/:slug",
  //   name: "ISUBasepage",
  //   component: () =>
  //     import(/* webpackChunkName: "isu" */ "@/views/BasePage.vue"),
  // },
  {
    path: "/innovation-and-digital-services/",
    name: "ISUOverview",
    component: () =>
      import(
        /* webpackChunkName: "isu" */ "@/views/InformationSystems/ISUHome.vue"
      ),
  },
  {
    path: "/innovation-and-digital-services/infonet/",
    name: "Infonet",
    component: () =>
      import(
        /* webpackChunkName: "isu" */ "@/views/InformationSystems/Infonet.vue"
      ),
  },

  {
    path: "/innovation-and-digital-services/isu-staff/",
    name: "ISUStaff",
    component: () =>
      import(
        /* webpackChunkName: "isu" */ "@/views/InformationSystems/ISUStaff.vue"
      ),
  },

  {
    path: "/innovation-and-digital-services/:slug",
    name: "ISUBasepage",
    component: () =>
      import(/* webpackChunkName: "isu" */ "@/views/BasePage.vue"),
  },
];

export { informationSystems };
