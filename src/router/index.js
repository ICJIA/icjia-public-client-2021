/* eslint-disable no-unused-vars */
import Vue from "vue";
import VueRouter from "vue-router";
import Home from "@/views/Home/Home.vue";
import NProgress from "nprogress";
import appConfig from "@/config/config.json";
import { EventBus } from "@/event-bus";
// Add routes
import { hub } from "@/router/hub";
import { news } from "@/router/news";
import { grants } from "@/router/grants";
import { irb } from "@/router/irb";

import { events } from "@/router/events";
import { sandboxes } from "@/router/sandbox";
import { fourOhFour } from "@/router/404";
import { meetings } from "@/router/meetings";
import { about } from "@/router/about";
import { admin } from "@/router/admin";
// import { preview } from "@/router/preview";
Vue.use(VueRouter);

const home = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
];

const routes = [
  ...home,
  ...about,
  ...hub,
  ...irb,
  ...events,
  ...news,
  ...grants,
  ...meetings,
  ...sandboxes,
  ...admin,
  ...fourOhFour,
];

const router = new VueRouter({
  mode: "history",
  base: appConfig.publicPath,
  routes,
  scrollBehavior(to, from, savedPosition) {
    return { x: 0, y: 0 };
  },
});

router.beforeEach((to, from, next) => {
  NProgress.start();
  EventBus.$emit("closeSearch");
  next();
});

router.afterEach((routeTo, routeFrom) => {
  NProgress.done();
});

export default router;
