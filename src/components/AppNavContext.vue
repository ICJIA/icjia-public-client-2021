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
      <!-- dark-surface: the yellow focus ring used on the site's dark bars
           (WCAG 1.4.11). -->
      <v-app-bar
        class="dark-surface"
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
            style="
              font-weight: 300;
              display: inline-block;
              max-width: 60ch;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              vertical-align: bottom;
            "
            class="hidden-sm-and-down"
            v-if="contextTitle"
            :title="contextTitle"
            >&nbsp;&raquo;&nbsp;{{ contextTitle }}
          </span>
        </span>
        <v-spacer></v-spacer>
        <v-btn
          text
          x-small
          dark
          @click="openTranslationModal()"
          v-if="contextMenu[0].showTranslation"
        >
          <span class="sr-only">Translate this site</span>
          <v-icon
            x-small
            :left="
              $vuetify.breakpoint.md ||
              $vuetify.breakpoint.lg ||
              $vuetify.breakpoint.xl
            "
            >mdi-web</v-icon
          >
          <span class="hidden-sm-and-down" aria-hidden="true"
            >Translate this site</span
          >
        </v-btn>
        <!--       
      <v-btn text x-small dark aria-label="Share this page on Twitter"
        ><v-icon small>mdi-twitter</v-icon></v-btn
      ><v-btn text x-small dark aria-label="Share this page on Facebook"
        ><v-icon small>mdi-facebook</v-icon></v-btn
      > -->
      </v-app-bar>
    </nav>

    <nav aria-labelledby="nav-section-label">
      <span id="nav-section-label" class="sr-only">Section navigation</span>
      <v-app-bar height="35" scroll-threshold="0" color="#eee">
        <!-- Links, not tabs (ContextNavLink): the current page's link is
             active and has aria-current="page". -->
        <v-tabs
          show-arrows
          centered
          center-active
          height="35"
          optional
          :value="currentLink"
          class="context px-3"
        >
          <v-tabs-slider color="black"></v-tabs-slider>

          <ContextNavLink
            style="background: #eee !important"
            v-for="(item, index) in contextMenu[0].items"
            :key="index"
            :to="item.path"
            exact
            @click="onLinkClick(item.path)"
          >
            {{ item.label }}
            <v-icon v-if="item.icon" right small>{{ item.icon }}</v-icon>
          </ContextNavLink>
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
import ContextNavLink from "@/components/ContextNavLink";
export default {
  components: { ContextNavLink },
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
  computed: {
    // The link to the page being shown: the bar marks it active and centres
    // it (the link itself carries aria-current="page").
    currentLink() {
      const here = this.$route.path.replace(/\/?$/, "/");
      const paths = this.contextMenu[0].items.map((item) => item.path);
      return paths.find((path) => path && path.replace(/\/?$/, "/") === here);
    },
  },
  created() {
    //console.log(this.contextMenu[0].items);
    EventBus.$on("context-label", (title) => {
      this.contextTitle = title;
      //console.log("Event: ", title);
    });
  },
  mounted() {
    // The bar is page navigation, not a tab list (see ContextNavLink).
    this.$el
      .querySelectorAll('[role="tablist"]')
      .forEach((el) => el.removeAttribute("role"));
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
    // A click on the link to the page already shown scrolls back to the top,
    // as it did when the links pushed the route themselves.
    onLinkClick(path) {
      if (path && path === this.currentLink) this.$vuetify.goTo(0);
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
