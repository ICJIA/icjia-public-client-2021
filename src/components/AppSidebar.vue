<template>
  <div>
    <v-navigation-drawer
      v-model="drawer"
      app
      temporary
      disable-resize-watcher
      color="grey lighten-4"
      style="z-index: 500"
    >
      <v-list class="mt-5">
        <div v-for="(menu, index) in $myApp.menus.menu" :key="index">
          <v-list-group v-model="menu.active" no-action v-if="menu.children">
            <template v-slot:activator>
              <v-list-item-content>
                <v-list-item-title
                  v-text="menu.main"
                  style="font-size: 18px; font-weight: bold"
                ></v-list-item-title>
              </v-list-item-content>
            </template>

            <span v-for="child in menu.children" :key="child.title">
              <v-divider v-if="child.divider"></v-divider>
              <div
                v-if="child.section"
                style="
                  margin-top: 10px;
                  font-weight: 700;
                  color: #222;
                  font-size: 14px;
                  line-height: 26px;
                "
                class="ml-6 pr-5 mb-1"
              >
                {{ child.section }}
              </div>
              <span v-if="child.title">
                <v-list-item
                  exact
                  @click="drawer = false"
                  :to="isLinkExternal(child.link) ? null : child.link"
                  :href="isLinkExternal(child.link) ? child.link : null"
                  :target="isLinkExternal(child.link) ? '_blank' : null"
                  :rel="
                    isLinkExternal(child.link) ? 'noopener noreferrer' : null
                  "
                  class="ml-7"
                  style="color: #111"
                >
                  <v-list-item-content>
                    <v-list-item-title
                      style="
                        font-size: 13px !important;
                        font-weight: bold;
                        color: #111;
                      "
                      >{{ child.title
                      }}<v-icon v-if="child.icon" small right color="black">{{
                        child.icon
                      }}</v-icon></v-list-item-title
                    >
                  </v-list-item-content>
                </v-list-item>
              </span>
            </span>
          </v-list-group>
          <div v-if="!menu.children">
            <v-list-item
              @click="drawer = false"
              :to="isLinkExternal(menu.link) ? null : menu.link"
              :href="isLinkExternal(menu.link) ? menu.link : null"
              :target="isLinkExternal(menu.link) ? '_blank' : null"
              :rel="isLinkExternal(menu.link) ? 'noopener noreferrer' : null"
            >
              <v-list-item-content>
                <v-list-item-title style="font-size: 18px; font-weight: bold"
                  >{{ menu.main
                  }}<v-icon v-if="menu.icon" small right color="black">{{
                    menu.icon
                  }}</v-icon></v-list-item-title
                >
              </v-list-item-content></v-list-item
            >
          </div>
        </div>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>

<script>
import { EventBus } from "@/event-bus";
export default {
  drawer: false,
  data() {
    return {
      drawer: false,
    };
  },
  methods: {
    isLinkExternal(originalURL) {
      const checkDomain = function (url) {
        if (url.indexOf("//") === 0) {
          url = location.protocol + url;
        }
        return url
          .toLowerCase()
          .replace(/([a-z])?:\/\//, "$1")
          .split("/")[0];
      };
      const isExternal = function (url) {
        return (
          (url.indexOf(":") > -1 || url.indexOf("//") > -1) &&
          checkDomain(location.href) !== checkDomain(url)
        );
      };
      return isExternal(originalURL);
    },
    // Keyboard a11y for the navigation drawer (v1.5.1):
    //   - Esc closes the drawer
    //   - Tab / Shift+Tab cycle only within drawer contents (focus trap)
    // v-navigation-drawer does not handle either on its own.
    handleKeydown(e) {
      if (!this.drawer) return;
      if (e.key === "Escape") {
        this.drawer = false;
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = Array.from(
        this.$el.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
  },
  watch: {
    drawer(isOpen) {
      if (isOpen) {
        // Remember the element that opened the drawer so focus can
        // return there when the drawer closes (WCAG 2.4.3 Focus Order).
        this._prevFocus = document.activeElement;
        this.$nextTick(() => {
          const first = this.$el.querySelector(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (first) first.focus();
        });
        document.addEventListener("keydown", this.handleKeydown);
      } else {
        document.removeEventListener("keydown", this.handleKeydown);
        if (this._prevFocus && typeof this._prevFocus.focus === "function") {
          this._prevFocus.focus();
        }
      }
    },
  },
  mounted() {
    EventBus.$on("toggleSidebar", () => {
      this.drawer = !this.drawer;
      EventBus.$emit("sidebarToggled", this.drawer);
    });
  },
  beforeDestroy() {
    document.removeEventListener("keydown", this.handleKeydown);
  },
};
</script>

<style lang="scss" scoped></style>
