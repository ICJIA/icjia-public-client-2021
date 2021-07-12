const about = [
  {
    path: "/about/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/about/icjia-mission/";
    },
  },
  {
    path: "/about/icjia-publications",
    name: "ICJIAPublications",
    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/About/PublicationsAll.vue"),
  },
  {
    path: "/about/icjia-board/",
    name: "Board",
    component: () =>
      import(/* webpackChunkName: "bios" */ "@/views/About/Board.vue"),
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
