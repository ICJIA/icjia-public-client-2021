import NProgress from "nprogress";
const about = [
  {
    path: "/about/",
    name: "ICJIAAbout",
    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/About/AboutHome.vue"),
  },
  {
    path: "/about/employment/",
    name: "ICJIAAboutEmployment",
    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/About/EmploymentAll.vue"),
  },
  {
    path: "/about/covid-19/",
    name: "ICJIACovid",
    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/About/Covid.vue"),
  },
  {
    path: "/about/employment/:slug",
    name: "ICJIAAboutEmploymentSingle",
    component: () =>
      import(
        /* webpackChunkName: "hub" */ "@/views/About/EmploymentSingle.vue"
      ),
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
    // eslint-disable-next-line no-unused-vars
    beforeRouteEnter(to, from, next) {
      NProgress.start();
      next();
    },
    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/About/PublicationsAll.vue"),
  },
  {
    path: "/about/employment",
    name: "ICJIAAllEmployment",
    // eslint-disable-next-line no-unused-vars

    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/About/EmploymentAll.vue"),
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
