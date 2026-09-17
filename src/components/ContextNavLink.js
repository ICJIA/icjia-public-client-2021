import { VTab } from "vuetify/lib";

// A link in a context navigation bar (AppNavContext, AppNavContextBottom).
// The bars are page navigation, not tabs: built from v-tab, every link was a
// tab (role="tab", aria-selected, tabindex on a <div>) in a tab list with no
// tab panels, and a click ran a router push (WCAG 1.3.1, 4.1.2). This keeps
// v-tab's look and its place in the scrolling bar (active underline, arrows,
// centring on the current link) but renders a real link: given `to` and
// `exact`, v-tab renders a router-link, whose href opens in a new tab like
// any link, and which marks the link to the current page with
// aria-current="page".
export default VTab.extend({
  name: "context-nav-link",

  props: {
    // v-tab reads the router-link's exact-active class to mark itself
    // active in the bar (underline, centring). With no class given it looks
    // for one named "undefined v-tab--active" and never finds it.
    exactActiveClass: {
      type: String,
      default: "v-tab--active",
    },
  },

  data: () => ({
    proxyClass: "",
  }),

  render(h) {
    const { tag, data } = this.generateRouteLink();
    return h(tag, data, this.$slots.default);
  },
});
