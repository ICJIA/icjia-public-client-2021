<template>
  <v-app>
    <div
      role="navigation"
      style="z-index: 10000"
      aria-labelledby="skip-to-content"
    >
      <router-link
        to="#content"
        aria-label="Skip to content"
        class="skiplink"
        @click.native="scrollFix('#content')"
        title="Skip Navigation"
        style="font-size: 12px"
        id="skip-to-content"
      >
        Skip to content
      </router-link>
    </div>
    <AppNav @hook:mounted="fixA11y()"></AppNav>

    <v-main style="background: #f3f3f3">
      <AppNavContext
        :contextMenu="contextMenu"
        v-if="contextMenu"
        id="context-bar"
        :key="`context-${$route.fullPath}`"
      ></AppNavContext>
      <router-view
        :key="`routerView-${$route.fullPath}`"
        style="min-height: 97vh !important"
      ></router-view>
      <Disclaimer
        v-if="disclaimer"
        :disclaimer="disclaimer"
        id="disclaimer"
        :key="`disclaimer-${$route.fullPath}`"
      ></Disclaimer>
    </v-main>

    <ModalSearch></ModalSearch>
  </v-app>
</template>

<script>
export default {
  watch: {
    // eslint-disable-next-line no-unused-vars
    $route(to, from) {
      this.checkForContextMenu();
      this.checkForDisclaimer();
    },
  },
  name: "App",
  data() {
    return {
      contextMenu: null,
      disclaimer: null,
    };
  },
  methods: {
    fixA11y() {
      console.log("fix a11y here.");
    },
    scrollFix: function () {},
    checkForDisclaimer() {
      if (this.$route.fullPath === "/") {
        this.disclaimer = null;
        return;
      }
      //console.log("app path: ", this.$route.fullPath);
      let fullPath = this.$route.fullPath;
      fullPath += fullPath.endsWith("/") ? "" : "/";
      let context = fullPath.split("/").slice(1, -1);
      context = "/" + context.slice(0, 1).join("/") + "/";
      let disclaimer = this.$myApp.disclaimers.filter((obj) => {
        if (obj["pathPrefix"] === context) {
          return obj;
        }
      });
      if (disclaimer && disclaimer.length) {
        this.disclaimer = disclaimer;
      } else {
        this.disclaimer = null;
      }
    },
    checkForContextMenu() {
      if (this.$route.fullPath === "/") {
        this.contextMenu = null;
        return;
      }

      let fullPath = this.$route.fullPath;
      fullPath += fullPath.endsWith("/") ? "" : "/";
      let context = fullPath.split("/").slice(1, -1);
      context = "/" + context.slice(0, 1).join("/") + "/";

      let contextMenu = this.$myApp.context.filter((obj) => {
        if (obj["pathPrefix"] === context) {
          return obj;
        }
      });
      if (contextMenu && contextMenu.length) {
        this.contextMenu = contextMenu;
      } else {
        this.contextMenu = null;
      }
    },
  },

  mounted() {
    console.log(this.$myApp);
    this.checkForContextMenu();
    this.checkForDisclaimer();
  },
};
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition-duration: 0.2s;
  transition-property: opacity;
  transition-timing-function: ease;
}
.fade-enter,
.fade-leave-active {
  opacity: 0;
}
.container.full-width {
  width: 100%;
  padding: 0px !important;
}

.btn--context {
  border: 1px solid #fff !important;
}

#context-bar {
  position: sticky !important;
  top: 90px !important;
  z-index: 1000 !important;
}
</style>
