<template>
  <div
    id="contextBar"
    style="border-bottom: 1px solid #fff; z-index: 10 !important"
    v-resize="resize"
  >
    <nav aria-labelledby="nav-breadcrumb-label">
      <span id="nav-breadcrumb-label" class="sr-only"
        >Breadcrumb navigation</span
      >
      <v-app-bar
        class=""
        height="35"
        style="background: #0a3a60; color: #fff; font-size: 15px"
        :class="{
          'text-left':
            $vuetify.breakpoint.md ||
            $vuetify.breakpoint.lg ||
            $vuetify.breakpoint.xl,
          'text-center': $vuetify.breakpoint.sm || $vuetify.breakpoint.xs,
        }"
      >
        <!-- <v-spacer class="hidden-md-and-up"></v-spacer> -->
        <span>
          <span
            style="font-weight: 700"
            class="hover"
            role="link"
            tabindex="0"
            @click="$router.push('/')"
            @keydown.enter="$router.push('/')"
            >ICJIA &nbsp;&raquo;&nbsp;</span
          >
          <span
            style="font-weight: 700"
            class="hover hidden-sm-and-down"
            role="link"
            tabindex="0"
            @click="routeToPage(contextMenu[0].defaultPath)"
            @keydown.enter="routeToPage(contextMenu[0].defaultPath)"
          >
            {{ contextMenu[0].label }}</span
          >
          <span
            style="font-weight: 700"
            class="hover hidden-md-and-up"
            role="link"
            tabindex="0"
            @click="routeToPage(contextMenu[0].defaultPath)"
            @keydown.enter="routeToPage(contextMenu[0].defaultPath)"
          >
            {{ contextMenu[0].shortLabel }}</span
          >
          <span
            style="font-weight: 300"
            class="hidden-sm-and-down"
            v-if="contextTitle"
            >&nbsp;&raquo;&nbsp;{{ contextTitle | truncate(8) }}
          </span>
        </span>
        <v-spacer></v-spacer>
        <v-btn
          text
          x-small
          dark
          @click="openTranslationModal()"
          v-if="contextMenu[0].showTranslation"
          aria-label="Translate this site on Google"
        >
          <v-icon
            x-small
            :left="
              $vuetify.breakpoint.md ||
              $vuetify.breakpoint.lg ||
              $vuetify.breakpoint.xl
            "
            >fas fa-globe</v-icon
          >
          <span class="hidden-sm-and-down">Translate this site</span>
        </v-btn>
        <!--       
      <v-btn text x-small dark aria-label="Share this page on Twitter"
        ><v-icon small>fab fa-twitter </v-icon></v-btn
      ><v-btn text x-small dark aria-label="Share this page on Facebook"
        ><v-icon small>fab fa-facebook </v-icon></v-btn
      > -->
      </v-app-bar>
    </nav>

    <nav aria-labelledby="nav-section-label">
      <span id="nav-section-label" class="sr-only">Section navigation</span>
      <v-app-bar height="35" scroll-threshold="0" color="#eee">
        <v-tabs
          show-arrows
          centered
          v-model="contextTab"
          center-active
          height="35"
          optional
          class="context px-3"
        >
          <v-tabs-slider color="black"></v-tabs-slider>

          <v-tab
            style="background: #eee !important"
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
          <v-menu v-if="more.length" bottom left>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                text
                class="align-self-center mr-4"
                v-bind="attrs"
                v-on="on"
              >
                more
                <v-icon right> mdi-menu-down </v-icon>
              </v-btn>
            </template>

            <v-list class="grey lighten-3">
              <v-list-item v-for="item in more" :key="item">
                {{ item }}
              </v-list-item>
            </v-list>
          </v-menu>
        </v-tabs>
      </v-app-bar>
    </nav>
  </div>
</template>

<script>
import { EventBus } from "@/event-bus";
export default {
  props: {
    data() {
      return {
        contextTitle: null,
      };
    },
    contextMenu: {
      type: Array,
      default: () => [],
    },
  },
  watch: {
    // eslint-disable-next-line no-unused-vars
    contextTab(newValue, oldValue) {},
  },

  created() {
    this.selectTab();
    //console.log(this.contextMenu[0].items);
    EventBus.$on("context-label", (title) => {
      this.contextTitle = title;
      //console.log("Event: ", title);
    });
  },
  methods: {
    openTranslationModal() {
      EventBus.$emit("translate", this.$route.fullPath);
    },
    resize() {
      let words;
      if (this.$vuetify.breakpoint.xs) {
        words = 5;
      } else if (this.$vuetify.breakpoint.sm) {
        words = 8;
      } else {
        words = 15;
      }
      this.words = words;
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
      this.currentTab = "test";
    },
    fireEvent() {
      EventBus.$emit("search");
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
};
</script>

<style lang="scss"></style>
