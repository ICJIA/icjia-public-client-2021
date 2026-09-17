<template>
  <div>
    <!-- MENU in AppNav.vue controls this drawer (aria-controls="site-menu"). -->
    <v-navigation-drawer
      v-model="drawer"
      id="site-menu"
      app
      temporary
      disable-resize-watcher
      color="grey lighten-4"
      style="z-index: 500"
    >
      <!-- Below 960 px the menu opens as a modal panel over the page, so its
           contents are a modal dialog named "Site menu" (WCAG 4.1.2). The role
           sits on this wrapper, not the drawer: role="dialog" is not allowed
           on <nav>, and the drawer must stay a <nav> for Vuetify to render
           its items as plain links. -->
      <div role="dialog" aria-modal="true" aria-label="Site menu">
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
                    @click="closeForLink"
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
                @click="closeForLink"
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
      </div>
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
    focusables() {
      return Array.from(
        this.$el.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);
    },
    // Move focus to the first item once the drawer can take it. The drawer is
    // visibility: hidden until its opening transition starts, and focus() on
    // a hidden element does nothing, so a single call on $nextTick left focus
    // on MENU and the next Tab went to the page behind the drawer (WCAG 2.4.3,
    // F85). Retry on each animation frame, for up to a second.
    focusFirstItem(attempt = 0) {
      if (!this.drawer) return;
      const first = this.focusables()[0];
      if (first) first.focus();
      if ((!first || document.activeElement !== first) && attempt < 60) {
        requestAnimationFrame(() => this.focusFirstItem(attempt + 1));
      }
    },
    // A link in the menu was activated. A link to another page changes the
    // route, and the route change moves focus, so focus does not go back to
    // MENU. (Sending it to MENU as the menu closed also moved the Enter key's
    // keypress to MENU, which reopened the menu instead of following the
    // link.) A link to the current page or to a new tab leaves this page in
    // place, so focus returns to MENU as when the menu is dismissed. The
    // flag is set here, before the menu closes, because by keyboard the menu
    // closes before navigation starts.
    closeForLink(e) {
      const link = e && e.currentTarget;
      this._followedLink = Boolean(
        link &&
          link.getAttribute("target") !== "_blank" &&
          link.pathname !== this._openedOnPath
      );
      this.drawer = false;
    },
    // Keyboard a11y for the navigation drawer (v1.5.1):
    //   - Esc closes the drawer
    //   - Tab / Shift+Tab cycle only within drawer contents (focus trap)
    // v-navigation-drawer does not handle either on its own. Focus that is
    // somehow outside the open drawer is brought back in on the next Tab.
    handleKeydown(e) {
      if (!this.drawer) return;
      if (e.key === "Escape") {
        this.drawer = false;
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = this.focusables();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const nav = this.$el.querySelector(".v-navigation-drawer");
      if (!nav || !nav.contains(document.activeElement)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && document.activeElement === first) {
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
      // Keep MENU's aria-expanded true to the drawer however it opens or
      // closes: MENU, Escape, the scrim, or following a link.
      EventBus.$emit("sidebarToggled", isOpen);
      if (isOpen) {
        // Remember the element that opened the drawer so focus can
        // return there when the drawer closes (WCAG 2.4.3 Focus Order).
        this._prevFocus = document.activeElement;
        this._followedLink = false;
        this._openedOnPath = window.location.pathname;
        this.$nextTick(() => this.focusFirstItem());
        document.addEventListener("keydown", this.handleKeydown);
      } else {
        document.removeEventListener("keydown", this.handleKeydown);
        const prev = this._prevFocus;
        // A mouse click can finish the route change first; the drawer then
        // closes itself on the new route.
        const followedLink =
          this._followedLink || window.location.pathname !== this._openedOnPath;
        if (!followedLink && prev && typeof prev.focus === "function") {
          // After the key event that closed the menu has finished.
          setTimeout(() => prev.focus(), 0);
        }
        this._followedLink = false;
      }
    },
  },
  mounted() {
    EventBus.$on("toggleSidebar", () => {
      this.drawer = !this.drawer;
    });
  },
  beforeDestroy() {
    document.removeEventListener("keydown", this.handleKeydown);
  },
};
</script>

<style lang="scss" scoped></style>
