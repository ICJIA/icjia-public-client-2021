/* eslint-disable no-unused-vars */
import "regenerator-runtime/runtime";
import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import { createProvider } from "./vue-apollo";
import "@/assets/app.css";
import "@/assets/github-markdown.css";
import "@/components/_globals";
import "@/components/Hub/_hub";
import "@/filters";
import "@/assets/hub.css";
import config from "@/config/config.json";
// import "material-design-icons-iconfont/dist/material-design-icons.css";
// import Masonry from "masonry-layout";
import nprogress from "nprogress";
// import axios from "axios";
// import Fuse from "fuse.js";
import VueGtag from "vue-gtag";

// import "@fortawesome/fontawesome-free/css/all.css";

Vue.config.productionTip = false;

// Guard NProgress against null DOM element errors when called before
// the progress bar container exists (e.g. in Vue created() hooks).
const _npStart = nprogress.start.bind(nprogress);
const _npDone = nprogress.done.bind(nprogress);
nprogress.start = function () {
  try {
    return _npStart();
  } catch (e) {
    // Silently ignore — bar element not yet in DOM
  }
};
nprogress.done = function (force) {
  try {
    return _npDone(force);
  } catch (e) {
    // Silently ignore
  }
};

nprogress.start();
// Set up app wide read-only configs and install as plugin
import { myApp } from "./services/AppInit";
myApp.install = function () {
  Object.defineProperty(Vue.prototype, "$myApp", {
    get() {
      return myApp;
    },
  });
};

//TODO: scaffold this for future config from remote API instead of local json
//
// (async function () {
//   let configs = await require("./services/Configs");
//   //console.log(configs.data.message);
//   const fuse = new Fuse(configs.data.message, config.search.site);
//   myApp.fuse = fuse;
// })();

Vue.use(myApp);
console.log("App initialized.");

import VueMeta from "vue-meta";
Vue.use(VueMeta, {
  // optional pluginOptions
  refreshOnceOnNavigation: true,
});

import AOS from "aos";
import "aos/dist/aos.css"; // You can also use <link> for styles
AOS.init();

// import LoadScript from "vue-plugin-load-script";
// Vue.use(LoadScript);

// Vue.use(
//   VueGtag,
//   {
//     config: { id: "G-LJP4M9Y8B0" },
//     pageTrackerTemplate(to) {
//       //console.log(to);
//       return {
//         page_title: to.path,
//         page_path: to.path,
//       };
//     },
//   },
//   router
// );

new Vue({
  router,
  store,
  vuetify,
  apolloProvider: createProvider(),
  render: (h) => h(App),
}).$mount("#app");

nprogress.done();
