/* eslint-disable no-unused-vars */
import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import NProgress from "nprogress";
import appConfig from "@/config.json";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/news",
    name: "News",
    component: () => import(/* webpackChunkName: "news" */ "../views/News.vue"),
  },
  {
    path: "/news/:slug",
    name: "NewsSingle",
    component: () =>
      import(/* webpackChunkName: "news" */ "../views/NewsSingle.vue"),
  },
  {
    path: "/meetings/:slug",
    name: "MeetingsSingle",
    component: () =>
      import(/* webpackChunkName: "meetings" */ "../views/MeetingsSingle.vue"),
  },
  {
    path: "/gata/funding/:slug",
    name: "FundingSingle",
    component: () =>
      import(/* webpackChunkName: "funding" */ "../views/FundingSingle.vue"),
  },
  {
    path: "/researchhub/articles",
    name: "hubArticles",
    component: () =>
      import(/* webpackChunkName: "hub" */ "../views/HubArticles.vue"),
  },
  {
    path: "/preview",
    name: "Preview",
    component: () =>
      import(/* webpackChunkName: "preview" */ "../views/Preview.vue"),
  },
  {
    path: "*",
    name: "FourOhFour",
    component: () => import(/* webpackChunkName: '404' */ "../views/404.vue"),
    meta: {},
  },
];

const router = new VueRouter({
  mode: "history",
  base: appConfig.publicPath,
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { x: 0, y: 0 };
    }
  },
});

router.beforeEach((to, from, next) => {
  NProgress.start();
  next();
});

router.afterEach((routeTo, routeFrom) => {
  NProgress.done();
});

export default router;
