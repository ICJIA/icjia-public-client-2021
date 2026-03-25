import NProgress from "@/services/Progress";

const hub = [
  {
    path: "/researchhub/",
    name: "hubHome",
    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/Hub/HubHome.vue"),
  },

  {
    path: "/researchhub/hub-staff",
    name: "hubStaff",
    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/Hub/HubStaff.vue"),
  },
  {
    path: "/researchhub/articles",
    name: "hubArticles",
    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/Hub/ArticlesAll.vue"),
  },

  {
    path: "/researchhub/articles/:slug",
    name: "hubArticlesSingle",
    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/Hub/ArticlesSingle.vue"),
  },
  {
    path: "/researchhub/apps",
    name: "hubApps",
    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/Hub/AppsAll.vue"),
  },
  {
    path: "/researchhub/apps/:slug",
    name: "hubAppsSingle",
    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/Hub/AppsSingle.vue"),
  },
  {
    path: "/researchhub/datasets",
    name: "hubDatasets",
    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/Hub/DatasetsAll.vue"),
  },
  {
    path: "/researchhub/datasets/:slug",
    name: "hubDatasetsSingle",
    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/Hub/DatasetsSingle.vue"),
  },
  {
    path: "/researchhub/publications",
    name: "ICJIAHubPublications",
    // eslint-disable-next-line no-unused-vars
    beforeRouteEnter(to, from, next) {
      NProgress.start();
      next();
    },
    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/About/PublicationsAll.vue"),
  },
  {
    path: "/researchhub/:slug",
    name: "hubPageSingle",
    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/BasePage.vue"),
  },
];

export { hub };
