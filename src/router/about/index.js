const about = [
  {
    path: "/about/",
    name: "ICJIAAbout",
    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/About/AboutHome.vue"),
  },
  {
    path: "/about/units/:slug",
    name: "ICJIAPublicationsAll",
    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/About/UnitsSingle.vue"),
  },

  {
    path: "/about/publications",
    name: "ICJIAPublications",
    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/About/PublicationsAll.vue"),
  },
  {
    path: "/about/publications/:slug",
    name: "ICJIAPublicationsSingle",
    component: () =>
      import(
        /* webpackChunkName: "hub" */ "@/views/About/PublicationsSingle.vue"
      ),
  },
  {
    path: "/about/composition-and-membership/",
    name: "Board",
    component: () =>
      import(
        /* webpackChunkName: "bios" */ "@/views/About/CompositionAndMembership.vue"
      ),
  },
  {
    path: "/about/icjia-staff/",
    name: "Staff",
    component: () =>
      import(/* webpackChunkName: "bios" */ "@/views/About/Staff.vue"),
  },
  {
    path: "/about/biographies/:slug",
    name: "BiosSingle",
    component: () =>
      import(
        /* webpackChunkName: "bios" */ "@/views/About/StaffAndBoardSingle.vue"
      ),
  },
  {
    path: "/about/:slug",
    name: "AboutPage",
    component: () =>
      import(/* webpackChunkName: "funding" */ "@/views/BasePage.vue"),
  },
];

export { about };
