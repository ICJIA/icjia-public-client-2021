const informationSystems = [
  {
    path: "/innovation-and-digital-services/",
    name: "IDSOverview",
    component: () =>
      import(
        /* webpackChunkName: "ids" */ "@/views/InformationSystems/ISUHome.vue"
      ),
  },
  {
    path: "/innovation-and-digital-services/infonet/",
    name: "Infonet",
    component: () =>
      import(
        /* webpackChunkName: "ids" */ "@/views/InformationSystems/Infonet.vue"
      ),
  },

  {
    path: "/innovation-and-digital-services/isu-staff/",
    name: "IDSStaff",
    component: () =>
      import(
        /* webpackChunkName: "ids" */ "@/views/InformationSystems/ISUStaff.vue"
      ),
  },

  {
    path: "/innovation-and-digital-services/:slug",
    name: "IDSBasepage",
    component: () =>
      import(/* webpackChunkName: "ids" */ "@/views/BasePage.vue"),
  },
  {
    path: "/information-systems/*",
    redirect: { name: "IDSOverview" },
  },
];

export { informationSystems };
