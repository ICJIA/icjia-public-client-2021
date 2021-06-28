/* eslint-disable no-unused-vars */
import Vue from "vue";
import VueRouter from "vue-router";
import Home from "@/views/Home.vue";
import NProgress from "nprogress";
import appConfig from "@/config.json";
import { EventBus } from "@/event-bus";
// Add routes
import { hub } from "@/router/hub";
import { news } from "@/router/news";
import { grants } from "@/router/grants";
import { sandboxes } from "@/router/sandbox";
import { fourOhFour } from "@/router/404";
import { meetings } from "@/router/meetings";
import { preview } from "@/router/preview";
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
  ...hub,
  ...news,
  ...grants,
  ...meetings,
  ...sandboxes,
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
