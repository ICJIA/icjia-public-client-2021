<template>
  <div id="contextBar">
    <v-app-bar
      height="45"
      scroll-threshold="0"
      color="#0a3a60"
      elevate-on-scroll
      v-resize="resize"
    >
      <v-tabs
        dark
        show-arrows
        centered
        v-model="contextTab"
        center-active
        height="45"
        optional
        class="context"
      >
        <v-tabs-slider color="white"></v-tabs-slider>

        <v-tab
          style="background: #0a3a60 !important; font-size: 12px"
          v-for="(item, index) in contextMenu[0].items"
          :key="index"
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
  // props: {
  //   contextMenu: {
  //     type: Array,
  //     default: () => [],
  //   },
  // },
  watch: {
    // eslint-disable-next-line no-unused-vars
    contextTab(newValue, oldValue) {},
  },
  mounted() {
    //console.log(this.contextMenu[0].items);

    this.selectTab();
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
      more: [],
      contextMenu: [
        {
          name: "newsAndInfo",
          label: "News & Information",
          shortLabel: "News & Info",
          pathPrefix: "/news/",
          defaultPath: "/news/",
          items: [
            {
              label: "Latest News",
              path: "/news/",
            },
            {
              label: "Meetings",
              path: "/meetings/",
            },
            {
              label: "Funding",
              path: "/grants/funding/",
            },
            {
              label: "Employment",
              path: "/employment/",
            },
            {
              label: "Events",
              path: "/events/",
            },
            {
              label: "MeetingsA",
              path: "/meetings/",
            },
            {
              label: "FundingA",
              path: "/grants/funding/",
            },
            {
              label: "EmploymentA",
              path: "/employment/",
            },
            {
              label: "EventsB",
              path: "/events/",
            },
            {
              label: "MeetingsB",
              path: "/meetings/",
            },
            {
              label: "FundingB",
              path: "/grants/funding/",
            },
            {
              label: "EmploymentB",
              path: "/employment/",
            },
            {
              label: "EventsB",
              path: "/events/",
            },
          ],
        },
      ],
    };
  },
};
</script>

<style lang="scss"></style>
