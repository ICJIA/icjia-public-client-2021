<template>
  <div>
    <v-app-bar fixed app color="white" height="90" style="z-index: 50">
      <button
        class="hover hamburger text-center hidden-md-and-up"
        style="
          margin-left: -10px;
          background: none;
          border: none;
          cursor: pointer;
        "
        @click="toggleSidebar()"
        aria-label="MENU"
        :aria-expanded="sidebarOpen ? 'true' : 'false'"
      >
        <span class="v-icon mdi mdi-menu"></span>
        <div style="font-size: 10px; font-weight: 900">MENU</div>
      </button>

      <v-spacer
        v-if="$vuetify.breakpoint.sm || $vuetify.breakpoint.xs"
      ></v-spacer>
      <router-link to="/" aria-label="ICJIA Home" style="text-decoration: none">
        <v-img
          alt="ICJIA Logo"
          class="shrink mr-3"
          contain
          :src="require('@/assets/icjia-logo.png')"
          transition="scale-transition"
          width="90"
        />
      </router-link>

      <v-toolbar-title class="hidden-sm-and-down"
        ><router-link
          to="/"
          style="
            text-decoration: none !important;
            color: #000 !important;
            background: none !important;
            display: inline-flex;
            align-items: center;
            min-height: 44px;
            padding: 4px 0;
          "
          ><span style="font-weight: 900 !important" class="agency"
            >ILLINOIS CRIMINAL JUSTICE INFORMATION AUTHORITY</span
          ></router-link
        ></v-toolbar-title
      >

      <v-spacer></v-spacer>

      <span
        v-for="(menu, index) in $myApp.menus.menu"
        :key="index"
        style="display: inline-block"
      >
        <span v-if="menu.children.length && menu.children" class="d-flex">
          <v-menu
            bottom
            offset-y
            origin="center center"
            transition="scale-transition"
            :nudge-left="menu.nudgeLeft ? menu.nudgeLeft : '0px'"
            style="z-index: 500"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                text
                large
                class="hidden-sm-and-down navItem"
                v-bind="attrs"
                v-on="on"
                style="font-weight: 900 !important; font-size: 16px"
              >
                {{ menu.main }}<v-icon>mdi-menu-down</v-icon>
                <!-- <v-icon right small>arrow_drop_down</v-icon> -->
              </v-btn>
            </template>

            <v-list nav dense elevation="2">
              <span
                v-for="(child, index) in menu.children"
                :key="`child-${index}`"
              >
                <v-divider v-if="child.divider"></v-divider>
                <v-list-item-title
                  v-if="child.section"
                  style="margin-top: 10px; font-weight: 900; color: #222"
                  class="pr-5"
                  >{{ child.section }}</v-list-item-title
                >
                <v-list-item
                  class="appNav"
                  exact
                  :to="isLinkExternal(child.external) ? null : child.link"
                  :href="isLinkExternal(child.external) ? child.link : null"
                  :target="isLinkExternal(child.external) ? '_blank' : null"
                  v-if="child.link"
                >
                  <v-list-item-content class="hover">
                    <v-list-item-title style="font-size: 12px !important"
                      >{{ child.title }}
                      <v-icon v-if="child.icon" small right color="black">{{
                        child.icon
                      }}</v-icon></v-list-item-title
                    >
                  </v-list-item-content>
                </v-list-item>
              </span>
            </v-list>
          </v-menu>
        </span>
        <span v-else>
          <v-btn
            text
            large
            :aria-label="menu.main"
            class="hidden-sm-and-down navItem"
            style="font-weight: 900 !important; font-size: 16px"
            >{{ menu.main }}
            <v-icon v-if="menu.icon" right small color="black">{{
              menu.icon
            }}</v-icon>
          </v-btn>
        </span>
      </span>

      <v-tooltip left>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            text
            small
            v-bind="attrs"
            v-on="on"
            class="navItem"
            aria-label="Search ICJIA"
            style="font-weight: 900 !important; font-size: 16px"
            @click="openSearchModal()"
          >
            <!-- <span class="hidden-sm-and-down">Search</span> -->
            <v-icon color="black" style="font-size: 30px">mdi-magnify</v-icon>
          </v-btn>
        </template>
        <span>Search ICJIA</span>
      </v-tooltip>
    </v-app-bar>
  </div>
</template>

<script>
import { EventBus } from "@/event-bus";
export default {
  methods: {
    toggleSidebar() {
      EventBus.$emit("toggleSidebar");
    },
    openSearchModal() {
      EventBus.$emit("search");
    },
    openTranslationModal() {
      EventBus.$emit("translate", this.$route.fullPath);
    },
    isLinkExternal(type = "internal") {
      if (type === "internal") {
        return false;
      } else {
        return true;
      }
    },
  },
  data() {
    return {
      sidebarOpen: false,
      drawer: false,
      title: "Default Page Title",
      items: [
        {
          url: "/",
          items: [
            { title: "SubItem 1", url: "/" },
            { title: "SubItem 2", url: "/" },
            { title: "SubItem 3", url: "/" },
            { title: "SubItem 4", url: "/" },
          ],
          title: "Item 1",
        },
        {
          url: "/",
          items: [],
          title: "Item 2",
        },
        {
          url: "/",
          items: [],
          title: "Item 3",
        },
        {
          items: [],
          title: "Item 4",
        },
        {
          items: [
            { title: "SubItem 1", url: "/" },
            { title: "SubItem 2", url: "/" },
            { title: "SubItem 3", url: "/" },
            { title: "SubItem 4", url: "/" },
          ],
          title: "Item 5",
        },
      ],
    };
  },
  mounted() {
    EventBus.$on("sidebarToggled", (state) => {
      this.sidebarOpen = state;
    });
    EventBus.$on("searchMounted", () => {
      console.log("search mounted");
    });
    EventBus.$on("systemBar", (title) => {
      this.title = title;
    });
  },
};
</script>

<style>
.navItem {
  color: #000 !important;
  font-weight: 900;
}

.hamburger {
  width: 70px;
  margin-left: 10px;
  margin-right: 10px;
}

.hamburger:hover {
  background: #eee;
  padding: 5px;
}

.translate {
  position: absolute;
  right: 40px;
  top: 10px;
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
}

.searchResults {
  position: absolute;
  top: 100px;
  z-index: 999;
  background: #000;
}

.v-icon.twitter {
  color: #1da1f2 !important;
}

.v-icon.facebook {
  color: #3b5998 !important;
}

.v-toolbar__title {
  font-size: 1.15rem;
}

/* .v-icon.translation {
  color: #174629 !important;
} */
</style>
