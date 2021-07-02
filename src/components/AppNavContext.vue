<template>
  <div>
    <v-app-bar
      dense
      height="35"
      color="#133e60"
      class="hidden-md-and-up hover"
      style="border-bottom: 1px solid #aaa"
    >
      <v-spacer></v-spacer>
      <span
        style="color: #fff; font-size: 12px; font-weight: 900"
        @click="routeToPage(contextMenu[0].defaultPath)"
      >
        {{ contextMenu[0].label.toUpperCase() }}</span
      >

      <v-spacer></v-spacer>
    </v-app-bar>
    <v-app-bar
      dense
      height="45"
      scroll-threshold="0"
      color="#0a3a60"
      elevate-on-scroll
    >
      <div
        style="font-weight: 900; text-transform: uppercase; color: #fff"
        class="hidden-sm-and-down hover"
        id="context-title"
        @click="routeToPage(contextMenu[0].defaultPath)"
      >
        {{ contextMenu[0].label }}
      </div>

      <v-spacer></v-spacer>
      <v-card elevation="0">
        <v-tabs
          dark
          show-arrows
          center-active
          v-model="contextTab"
          height="45"
          optional
          class="context"
        >
          <v-tabs-slider></v-tabs-slider>

          <v-tab
            style="background: #0a3a60 !important"
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
        </v-tabs>
      </v-card>
      <!-- <v-spacer v-if="!isAtTop"></v-spacer> -->
      <v-spacer
        v-if="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm"
      ></v-spacer>
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

    let distance = window.$("#context-bar").offset().top;

    let vm = this;
    window.$(window).scroll(function () {
      if (window.$(this).scrollTop() >= distance) {
        vm.isAtTop = true;
      } else {
        vm.isAtTop = false;
      }
    });
  },
  methods: {
    selectTab() {
      this.contextMenu[0].items.forEach((item, index) => {
        if (this.$route.fullPath === item.path) {
          this.contextTab = index;
        }
      });
    },
    fireEvent() {
      EventBus.$emit("search");
      this.$nextTick(() => {
        this.contextTab = undefined;
        this.selectTab();
      });
    },
    routeToPage(page) {
      //   if (page === "About the Research Hub") return;
      // console.log("route: ", page);
      this.$router.push(page).catch(() => {
        this.$vuetify.goTo(0);
      });
    },
  },
  data() {
    return {
      contextDrawer: true,
      contextTab: null,
      isAtTop: false,
      disabled: false,
    };
  },
};
</script>

<style lang="scss"></style>
