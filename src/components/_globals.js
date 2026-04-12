import Vue from "vue";
import upperFirst from "lodash/upperFirst";
import camelCase from "lodash/camelCase";

// Layout chrome — mounted directly by App.vue on every route, so these
// must be available synchronously on first paint. Kept in the main bundle.
import AppFooter from "./AppFooter.vue";
import AppNav from "./AppNav.vue";
import AppNavContext from "./AppNavContext.vue";
import AppNavContextBottom from "./AppNavContextBottom.vue";
import AppSidebar from "./AppSidebar.vue";
import SkipLink from "./SkipLink.vue";
import Disclaimer from "./Disclaimer.vue";
import ModalSearch from "./ModalSearch.vue";
import ModalTranslate from "./ModalTranslate.vue";

const eager = {
  AppFooter,
  AppNav,
  AppNavContext,
  AppNavContextBottom,
  AppSidebar,
  SkipLink,
  Disclaimer,
  ModalSearch,
  ModalTranslate,
};
Object.entries(eager).forEach(([name, comp]) => Vue.component(name, comp));

// Every other top-level component in this folder is registered as an
// async global — webpack emits one chunk per file, loaded on-demand the
// first time the component is rendered. Keeps the main bundle lean.
const lazy = require.context(".", false, /[\w-]+\.vue$/, "lazy");
lazy.keys().forEach((fileName) => {
  const name = upperFirst(
    camelCase(fileName.replace(/^\.\//, "").replace(/\.\w+$/, ""))
  );
  if (eager[name]) return;
  Vue.component(name, () => lazy(fileName));
});
