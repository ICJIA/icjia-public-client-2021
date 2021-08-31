<template>
  <v-app>
    <SocialSharing></SocialSharing>
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

    <v-main style="background: #fcfcfc">
      <AppNavContext
        :contextMenu="topContextMenu"
        v-if="topContextMenu"
        id="context-bar"
        :key="`top-context-${$route.fullPath}`"
      ></AppNavContext>
      <router-view
        :key="`routerView-${$route.fullPath}`"
        class="page"
        style="margin-bottom: 20px"
        @hook:mounted="displayFooter()"
      ></router-view>
      <Disclaimer
        v-if="disclaimer"
        :disclaimer="disclaimer"
        id="disclaimer"
        :key="`disclaimer-${$route.fullPath}`"
      ></Disclaimer>
    </v-main>
    <ModalTranslate></ModalTranslate>
    <ModalSearch></ModalSearch>
    <AppFooter
      style="margin: 0; padding: 0"
      @hook:mounted="fixA11y()"
      v-if="showFooter"
    ></AppFooter>
  </v-app>
</template>

<script>
// import { EventBus } from "@/event-bus";
export default {
  watch: {
    // eslint-disable-next-line no-unused-vars
    $route(to, from) {
      this.checkForTopContextMenu();
      this.checkForDisclaimer();
      this.getBottomContextMenu();
    },
  },
  name: "App",
  metaInfo: {
    // if no subcomponents specify a metaInfo.title, this title will be used
    title: "Illinois Criminal Justice Information Authority",
    // all titles will be injected into this template
    titleTemplate: "ICJIA | %s",
  },
  data() {
    return {
      topContextMenu: null,
      disclaimer: null,
      showFooter: null,
      bottomContextMenu: null,
    };
  },

  methods: {
    getBottomContextMenu() {
      let bottomContextMenu = this.$myApp.context.filter((obj) => {
        if (obj["location"] === "bottom") {
          return obj;
        }
      });
      console.log("bottom context: ", bottomContextMenu);
    },
    displayFooter() {
      this.$nextTick(() => {
        this.showFooter = true;
      });
    },
    fixA11y() {
      console.log("Fix a11y here.");
    },
    scrollFix: function () {},
    checkForDisclaimer() {
      if (this.$route.fullPath === "/") {
        this.disclaimer = null;
        return;
      }
      console.log("app path: ", this.$route.fullPath);
      let fullPath = this.$route.fullPath;
      fullPath += fullPath.endsWith("/") ? "" : "/";
      // let context = fullPath.split("/").slice(1, -1);
      // context = "/" + context.slice(0, 1).join("/") + "/";
      // let altContext = this.$myApp.disclaimers.find(
      //   (o) => o.pathPrefix === fullPath
      // );
      // console.log(altContext);
      // let disclaimer = this.$myApp.disclaimers.filter((obj) => {
      //   if (obj["pathPrefix"].includes(context)) {
      //     return obj;
      //   }
      // });
      let disclaimer = this.$myApp.disclaimers.filter((obj) => {
        if (fullPath.includes(obj["pathPrefix"])) {
          return obj;
        }
      });

      if (disclaimer && disclaimer.length) {
        this.disclaimer = disclaimer;
      } else {
        this.disclaimer = null;
      }
    },
    checkForTopContextMenu() {
      if (this.$route.fullPath === "/") {
        this.topContextMenu = null;
        return;
      }

      let fullPath = this.$route.fullPath;
      fullPath += fullPath.endsWith("/") ? "" : "/";
      let context = fullPath.split("/").slice(1, -1);
      context = "/" + context.slice(0, 1).join("/") + "/";

      let topContextMenu = this.$myApp.context.filter((obj) => {
        if (obj["pathPrefix"] === context && obj["location"] === "top") {
          return obj;
        }
      });
      if (topContextMenu && topContextMenu.length) {
        this.topContextMenu = topContextMenu;
      } else {
        this.topContextMenu = null;
      }
    },
  },

  mounted() {
    console.dir(this.$myApp);
    this.checkForTopContextMenu();
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
