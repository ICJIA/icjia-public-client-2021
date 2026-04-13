<template>
  <div style="border-top: 1px solid #ddd">
    <nav aria-labelledby="nav-additional-label">
      <span id="nav-additional-label" class="sr-only"
        >Additional navigation</span
      >
      <v-app-bar height="35" scroll-threshold="0" color="#11568e">
        <v-tabs
          show-arrows
          centered
          v-model="contextTab"
          center-active
          height="35"
          optional
          dark
          class="context px-3"
        >
          <v-tabs-slider color="white"></v-tabs-slider>

          <v-tab
            style="background: #11568e !important; color: #fff !important"
            v-for="(item, index) in contextMenu[0].items"
            :key="index"
            @click="
              item.path && item.path.length
                ? routeToPage(item.path)
                : fireEvent(item.event)
            "
          >
            {{ item.label }}
            <v-icon v-if="item.icon" right small>{{ item.icon }}</v-icon>
          </v-tab>
          <v-tab
            style="background: #11568e !important; color: #fff !important"
            @click.stop.prevent="routeToPage('/search')"
          >
            Search</v-tab
          >
        </v-tabs>
      </v-app-bar>
    </nav>
  </div>
</template>

<script>
import { EventBus } from "@/event-bus";
import { goToSearch } from "@/utils/search";
export default {
  data() {
    return {
      contextDrawer: true,
      contextTab: null,
      currentLabel: null,
      contextTitle: null,
      isAtTop: false,
      disabled: false,
      more: [],
      words: 10,
    };
  },
  mounted() {
    EventBus.$on("context-label", (title) => {
      this.contextTitle = title;
    });
    this.selectTab();
  },

  methods: {
    openTranslationModal() {
      EventBus.$emit("translate", this.$route.fullPath);
    },

    selectTab() {
      this.contextMenu[0].items.forEach((item, index) => {
        let url = this.$route.fullPath;
        // add trailing slash if not present
        url = url.replace(/\/$|$/, "/");
        if (url === item.path) {
          this.contextTab = index;
          this.currentLabel = item.label;
        }
      });
      //this.currentTab = "test";
    },
    fireEvent() {
      // Was: EventBus.$emit("search") → ModalSearch. Now navigates to
      // the /search page like every other search trigger.
      goToSearch(this.$router, {});
      this.$nextTick(() => {
        this.contextTab = undefined;
        this.selectTab();
      });
    },
    routeToPage(page) {
      this.$router.push(page).catch(() => {
        this.$vuetify.goTo(0);
      });
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
