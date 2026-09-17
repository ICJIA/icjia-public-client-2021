<template>
  <div style="border-top: 1px solid #ddd">
    <nav aria-labelledby="nav-additional-label">
      <span id="nav-additional-label" class="sr-only"
        >Additional navigation</span
      >
      <v-app-bar
        height="35"
        scroll-threshold="0"
        color="#11568e"
        class="dark-surface"
      >
        <!-- Links, not tabs (ContextNavLink): the current page's link is
             active and has aria-current="page". -->
        <v-tabs
          show-arrows
          centered
          center-active
          height="35"
          optional
          :value="currentLink"
          dark
          class="context px-3"
        >
          <v-tabs-slider color="white"></v-tabs-slider>

          <ContextNavLink
            style="background: #11568e !important; color: #fff !important"
            v-for="(item, index) in contextMenu[0].items"
            :key="index"
            :to="item.path"
            exact
            @click="onLinkClick(item.path)"
          >
            {{ item.label }}
            <v-icon v-if="item.icon" right small>{{ item.icon }}</v-icon>
          </ContextNavLink>
          <ContextNavLink
            style="background: #11568e !important; color: #fff !important"
            to="/search"
            exact
            @click="onLinkClick('/search')"
          >
            Search</ContextNavLink
          >
        </v-tabs>
      </v-app-bar>
    </nav>
  </div>
</template>

<script>
import { EventBus } from "@/event-bus";
import ContextNavLink from "@/components/ContextNavLink";
export default {
  components: { ContextNavLink },
  data() {
    return {
      contextDrawer: true,
      contextTitle: null,
      isAtTop: false,
      disabled: false,
      more: [],
      words: 10,
    };
  },
  computed: {
    // The link to the page being shown: the bar marks it active and centres
    // it (the link itself carries aria-current="page").
    currentLink() {
      const here = this.$route.path.replace(/\/?$/, "/");
      const paths = [
        ...this.contextMenu[0].items.map((item) => item.path),
        "/search",
      ];
      return paths.find((path) => path && path.replace(/\/?$/, "/") === here);
    },
  },
  mounted() {
    EventBus.$on("context-label", (title) => {
      this.contextTitle = title;
    });
    // The bar is page navigation, not a tab list (see ContextNavLink).
    this.$el
      .querySelectorAll('[role="tablist"]')
      .forEach((el) => el.removeAttribute("role"));
  },

  methods: {
    openTranslationModal() {
      EventBus.$emit("translate", this.$route.fullPath);
    },

    // A click on the link to the page already shown scrolls back to the top,
    // as it did when the links pushed the route themselves.
    onLinkClick(path) {
      if (path && path === this.currentLink) this.$vuetify.goTo(0);
    },
  },
  props: {
    contextMenu: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style>
/* .router-link-exact-active {
  color: #fff !important;
  font-weight: 900;
} */
</style>
