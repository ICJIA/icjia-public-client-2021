const grants = [
  {
    path: "/grants",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/grants/funding";
    },
  },
  {
    path: "/grants/programs",
    name: "ProgramsAll",
    component: () =>
      import(
        /* webpackChunkName: "funding" */ "@/views/Grants/ProgramsAll.vue"
      ),
  },
  {
    path: "/grants/policies",
    name: "PoliciesAll2",
    redirect: () => {
      return "/grants/rules-regs-policies";
    },
  },
  {
    path: "/gata/:slug",
    redirect: (route) => {
      return "/grants/" + route.params.slug;
    },
  },
  {
    path: "/grants/rules-regs-policies",
    name: "RulesRegsPoliciesAll",
    component: () =>
      import(
        /* webpackChunkName: "funding" */ "@/views/Grants/RulesRegsPoliciesAll.vue"
      ),
  },

  {
    path: "/grants/required-forms",
    name: "RequiredFormsAll",
    component: () =>
      import(
        /* webpackChunkName: "funding" */ "@/views/Grants/RequiredFormsAll.vue"
      ),
  },
  {
    path: "/grants/fsgu-staff",
    name: "FSGUStaff",
    component: () =>
      import(
        /* webpackChunkName: "funding" */ "@/views/Grants/GrantsStaff.vue"
      ),
  },

  {
    path: "/grants/funding",
    name: "FundingAll",
    component: () =>
      import(/* webpackChunkName: "funding" */ "@/views/Grants/FundingAll.vue"),
  },

  {
    path: "/grants/:slug",
    name: "FSGUPage",
    component: () =>
      import(/* webpackChunkName: "funding" */ "@/views/BasePage.vue"),
  },

  {
    path: "/grants/programs/:slug",
    name: "ProgramsSingle",
    component: () =>
      import(
        /* webpackChunkName: "funding" */ "@/views/Grants/ProgramsSingle.vue"
      ),
  },
  {
    path: "/grants/funding/:slug",
    name: "FundingSingle",
    component: () =>
      import(
        /* webpackChunkName: "funding" */ "@/views/Grants/FundingSingle.vue"
      ),
  },

  {
    path: "/gata/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/grants/funding/";
    },
  },
  {
    path: "/ta/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/grants/training/";
    },
  },
  {
    path: "/gata/technical-assistance/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/grants/training/";
    },
  },

  {
    path: "/gata/funding/",
    // eslint-disable-next-line no-unused-vars
    redirect: (route) => {
      return "/grants/funding/";
    },
  },

  {
    path: "/gata/:slug",
    redirect: (route) => {
      return "/grants/" + route.params.slug;
    },
  },

  {
    path: "/gata/funding/:slug",
    redirect: (route) => {
      return "/grants/funding/" + route.params.slug;
    },
  },
  // {
  //   path: "/grants/policies",
  //   redirect: () => {
  //     return "/grants/rules-regs-policies";
  //   },
  // },
];

export { grants };
