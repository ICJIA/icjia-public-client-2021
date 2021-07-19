<template>
  <div id="contextBar" style="border-bottom: 1px solid #fff">
    <div
      class="pl-3 pr-9 py-2"
      style="background: #0a3a60; color: #fff; font-size: 16px"
      :class="{
        'text-left':
          $vuetify.breakpoint.md ||
          $vuetify.breakpoint.lg ||
          $vuetify.breakpoint.xl,
        'text-center': $vuetify.breakpoint.sm || $vuetify.breakpoint.xs,
      }"
    >
      <span>
        <span
          style="font-weight: 700"
          class="hover"
          @click="routeToPage(contextMenu[0].defaultPath)"
          >{{ contextMenu[0].label }}</span
        >
        <span
          style="font-weight: 300"
          v-if="currentLabel && currentLabel.length"
          >&nbsp;&raquo;&nbsp;{{ currentLabel }}</span
        >
      </span>
    </div>

    <v-app-bar height="45" scroll-threshold="0" color="#eee">
      <v-tabs
        show-arrows
        centered
        v-model="contextTab"
        center-active
        height="45"
        optional
        class="context px-8"
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
            <v-btn text class="align-self-center mr-4" v-bind="attrs" v-on="on">
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
  </div>
</template>

<script>
import { EventBus } from "@/event-bus";
export default {
  props: {
    contextMenu: {
      type: Array,
      default: () => [],
    },
  },
  watch: {
    // eslint-disable-next-line no-unused-vars
    contextTab(newValue, oldValue) {},
  },
  mounted() {
    //console.log(this.contextMenu[0].items);

    this.selectTab();
  },
  methods: {
    test(item) {
      this.currentLabel = item.label;
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
      isAtTop: false,
      disabled: false,
      more: [],
    };
  },
};
</script>

<style lang="scss"></style>
