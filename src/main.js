import "regenerator-runtime/runtime";
import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import { createProvider } from "./vue-apollo";
import "@/assets/app.css";
import "@/assets/github-markdown.css";
import "@/assets/hub.css";
import "@/components/_globals";
import "@/components/Hub/_hub";
import "@/filters";
// import "material-design-icons-iconfont/dist/material-design-icons.css";
// import Masonry from "masonry-layout";
import nprogress from "nprogress";

import "@fortawesome/fontawesome-free/css/all.css";

Vue.config.productionTip = false;
nprogress.start();
// Set up app wide read-only configs and install as plugin
import { myApp } from "./services/AppInit";
// myApp.install = function () {
//   Object.defineProperty(Vue.prototype, "$myApp", {
//     get() {
//       return myApp;
//     },
//   });
// };
// Vue.use(myApp);

// scaffold this for future config from API
(async function init() {
  myApp.install = function () {
    Object.defineProperty(Vue.prototype, "$myApp", {
      get() {
        return myApp;
      },
    });
  };
  Vue.use(myApp);
  console.log("initialized");
})();

import VueMeta from "vue-meta";
Vue.use(VueMeta, {
  // optional pluginOptions
  refreshOnceOnNavigation: true,
});

// import LoadScript from "vue-plugin-load-script";
// Vue.use(LoadScript);

new Vue({
  router,
  store,
  vuetify,
  apolloProvider: createProvider(),
  render: (h) => h(App),
}).$mount("#app");

nprogress.done();
