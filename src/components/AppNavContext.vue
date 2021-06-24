<template>
  <div>
    <v-app-bar
      dense
      height="45"
      scroll-threshold="0"
      color="grey darken-2"
      id="context-bar"
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
        <v-tabs dark show-arrows center-active v-model="contextTab" height="45">
          <v-tabs-slider></v-tabs-slider>
          <v-tab
            v-for="(item, index) in contextMenu[0].items"
            :key="index"
            @click="routeToPage(item.path)"
          >
            {{ item.label }}
          </v-tab>
        </v-tabs>
      </v-card>
      <!-- <v-spacer v-if="!isAtTop"></v-spacer> -->
    </v-app-bar>
  </div>
</template>

<script>
export default {
  props: {
    contextMenu: {
      type: Array,
      default: () => [],
    },
  },
  watch: {
    // eslint-disable-next-line no-unused-vars
  },
  mounted() {
    //this.contextTab = 1;
    console.log(this.contextMenu[0].items);
    this.contextMenu[0].items.forEach((item, index) => {
      if (this.$route.fullPath === item.path) {
        this.contextTab = index;
      }
    });
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
    };
  },
};
</script>

<style scoped lang="scss">
.v-tab {
  font-size: 12px !important;
  font-weight: 700 !important;
  color: #ddd !important;
  /* letter-spacing: 0.01rem !important; */
  background: #616161 !important;
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
