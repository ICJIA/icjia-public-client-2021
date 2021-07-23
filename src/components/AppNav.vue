<template>
  <div>
    <v-app-bar fixed app elevate-on-scroll color="white" height="90">
      <div
        class="hover hamburger text-center"
        v-if="$vuetify.breakpoint.sm || $vuetify.breakpoint.xs"
        @click="drawer = true"
      >
        <span class="v-icon mdi mdi-menu"></span>
        <div style="font-size: 10px; font-weight: 900">MENU</div>
      </div>

      <v-spacer
        v-if="$vuetify.breakpoint.sm || $vuetify.breakpoint.xs"
      ></v-spacer>
      <v-img
        alt="ICJIA Logo"
        class="shrink mr-2 hover"
        contain
        src="/icjia-logo.png"
        transition="scale-transition"
        width="90"
        style
        @click="
          $router.push('/').catch((err) => {
            $vuetify.goTo(0);
          })
        "
      />

      <div
        @click="
          $router.push('/').catch((err) => {
            $vuetify.goTo(0);
          })
        "
        style="font-size: 20px; font-weight: 900; margin-left: 10px"
        class="hover hidden-sm-and-down"
      >
        ILLINOIS CRIMINAL JUSTICE INFORMATION AUTHORITY
      </div>

      <v-spacer></v-spacer>

      <v-menu
        bottom
        offset-y
        origin="center center"
        transition="scale-transition"
        nudge-left="20px"
        style="z-index: 100000"
      >
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            text
            large
            class="hidden-sm-and-down navItem"
            v-bind="attrs"
            v-on="on"
            style="font-weight: 900 !important; font-size: 16px"
            >DEVELOPMENT MENU<v-icon right small>arrow_drop_down</v-icon>
          </v-btn>
        </template>
        <v-list nav dense elevation="2">
          <v-list-item class="appNav" to="/">
            <v-list-item-content class="hover">
              <v-list-item-title style="font-size: 12px !important"
                >Home</v-list-item-title
              >
            </v-list-item-content>
          </v-list-item>

          <v-list-item class="appNav" to="/about/">
            <v-list-item-content class="hover">
              <v-list-item-title style="font-size: 12px !important"
                >About ICJIA</v-list-item-title
              >
            </v-list-item-content>
          </v-list-item>

          <v-list-item class="appNav" to="/grants/">
            <v-list-item-content class="hover">
              <v-list-item-title style="font-size: 12px !important"
                >Federal and State Grants Unit</v-list-item-title
              >
            </v-list-item-content>
          </v-list-item>

          <v-list-item class="appNav" to="/information-systems/">
            <v-list-item-content class="hover">
              <v-list-item-title style="font-size: 12px !important"
                >Information Systems Unit</v-list-item-title
              >
            </v-list-item-content>
          </v-list-item>
          <v-list-item class="appNav" to="/researchhub/">
            <v-list-item-content class="hover">
              <v-list-item-title style="font-size: 12px !important"
                >Research Hub</v-list-item-title
              >
            </v-list-item-content>
          </v-list-item>
          <v-list-item class="appNav" to="/irb/">
            <v-list-item-content class="hover">
              <v-list-item-title style="font-size: 12px !important"
                >Institutional Review Board</v-list-item-title
              >
            </v-list-item-content>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item class="appNav" to="/news/">
            <v-list-item-content class="hover">
              <v-list-item-title style="font-size: 12px !important"
                >News & Information</v-list-item-title
              >
            </v-list-item-content>
          </v-list-item>
          <v-list-item class="appNav" to="/events/">
            <v-list-item-content class="hover">
              <v-list-item-title style="font-size: 12px !important"
                >Events</v-list-item-title
              >
            </v-list-item-content>
          </v-list-item>
          <v-list-item class="appNav" to="/news/meetings/">
            <v-list-item-content class="hover">
              <v-list-item-title style="font-size: 12px !important"
                >Meetings</v-list-item-title
              >
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-tooltip left>
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on" @click="openSearchModal()">
            <span class="v-icon mdi mdi-magnify"></span>
          </v-btn>
        </template>
        <span>Search</span>
      </v-tooltip>

      <!-- <span
        style="
          font-weight: 900;
          background: #0e4471;
          color: #fff;
          padding: 5px;
          font-size: 12px;
        "
        class="mr-3 ml-5"
        >THIS IS A DRAFT SITE</span
      > -->
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      app
      temporary
      disable-resize-watcher
      color="white"
      style="z-index: 99999"
      ><v-list class="mt-5">
        <div v-for="item in items" :key="item.title">
          <div v-if="item.items.length">
            <v-list-group v-model="item.active" no-action>
              <template v-slot:activator>
                <v-list-item-content>
                  <v-list-item-title
                    v-text="item.title"
                    style="font-size: 18px; font-weight: bold"
                  ></v-list-item-title>
                </v-list-item-content>
              </template>

              <v-list-item
                v-for="child in item.items"
                :key="child.title"
                exact
                @click="drawer = false"
              >
                <v-list-item-content style="margin-left: -40px">
                  <v-list-item-title
                    v-text="child.title"
                    style="
                      font-size: 14px !important;
                      font-weight: bold;
                      color: #555;
                    "
                  ></v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list-group>
          </div>
          <div v-else>
            <v-list-item
              style="margin-bottom: -5px"
              exact
              @click="drawer = false"
            >
              <v-list-item-title style="font-size: 18px; font-weight: bold">
                {{ item.title }}</v-list-item-title
              >
            </v-list-item>
          </div>
        </div>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>

<script>
import { EventBus } from "@/event-bus";
export default {
  methods: {
    openSearchModal() {
      EventBus.$emit("search");
    },
    openTranslationModal() {
      EventBus.$emit("translate", this.$route.fullPath);
    },
  },
  data() {
    return {
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
  z-index: 500000;
  background: #000;
}

.v-icon.twitter {
  color: #1da1f2 !important;
}

.v-icon.facebook {
  color: #3b5998 !important;
}

/* .v-icon.translation {
  color: #174629 !important;
} */
</style>
