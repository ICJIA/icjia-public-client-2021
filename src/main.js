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
// import axios from "axios";

import "@fortawesome/fontawesome-free/css/all.css";

Vue.config.productionTip = false;
nprogress.start();
// Set up app wide read-only configs and install as plugin
import { myApp } from "./services/AppInit";

// scaffold this for future config from remote API instead of local json
(async function init() {
  // let siteConfig = await axios.get("https://agency.icjia-api.cloud/configs/2");
  // console.log(siteConfig);
  myApp.install = function () {
    Object.defineProperty(Vue.prototype, "$myApp", {
      get() {
        return myApp;
      },
    });
  };
  // myApp.test = "test";
  Vue.use(myApp);
  console.log("App initialized.");
})();

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

new Vue({
  router,
  store,
  vuetify,
  apolloProvider: createProvider(),
  render: (h) => h(App),
}).$mount("#app");

nprogress.done();
