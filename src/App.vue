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
        class="context-bar"
      ></AppNavContext>
      <router-view :key="$route.fullPath"></router-view>
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
    },
  },
  name: "App",
  data() {
    return {
      contextMenu: null,
    };
  },
  methods: {
    fixA11y() {
      console.log("fix a11y here.");
    },
    scrollFix: function () {},
    checkForContextMenu() {
      if (this.$route.fullPath === "/") {
        this.contextMenu = null;
        return;
      }
      //console.log("app path: ", this.$route.fullPath);
      let fullPath = this.$route.fullPath;
      fullPath += fullPath.endsWith("/") ? "" : "/";
      let context = fullPath.split("/").slice(1, -1);
      context = "/" + context.slice(0, 1).join("/") + "/";
      //console.log("search for context:", context);
      //console.log("context json: ", this.$myApp.context);
      // const key = "pathPrefix";

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

.context-bar {
  position: sticky !important;
  top: -1px !important;
  z-index: 1000 !important;
}
.btn--context {
  border: 1px solid #fff !important;
}
</style>
