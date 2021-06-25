<template>
  <div>
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
        data-aos="zoom-in"
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

<style scoped lang="scss">
.v-tab {
  font-size: 12px !important;
  font-weight: 700 !important;
  color: #fff !important;
  /* letter-spacing: 0.01rem !important; */
  background: #0a3a60 !important;
}
.v-tab--active {
  font-weight: 900 !important;
  background: #333 !important;
  color: #fff !important;
}

* >>> .v-slide-group__next,
* >>> .v-slide-group__prev {
  background: #616161 !important;
}
</style>
