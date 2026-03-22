<template>
  <v-app>
    <SkipLink></SkipLink>
    <!-- <SocialSharing></SocialSharing> -->
    <!-- <div
      role="navigation"
      style="z-index: 10000"
      aria-labelledby="skip-to-content"
    ></div> -->
    <AppNav @hook:mounted="fixA11y()"></AppNav>
    <AppSidebar></AppSidebar>

    <v-main style="background: #fcfcfc">
      <AppNavContext
        :contextMenu="topContextMenu"
        v-if="topContextMenu"
        id="context-bar"
        :key="`top-context-${$route.fullPath}`"
      ></AppNavContext>
      <div id="content">
        <router-view
          :key="`routerView-${$route.fullPath}`"
          class="page mb-12"
          style="margin-bottom: 20px"
          @hook:mounted="displayFooter()"
        ></router-view>
      </div>
      <Disclaimer
        v-if="disclaimer"
        :disclaimer="disclaimer"
        id="disclaimer"
        :key="`disclaimer-${$route.fullPath}`"
      ></Disclaimer>
    </v-main>
    <ModalTranslate></ModalTranslate>
    <ModalSearch></ModalSearch>
    <AppNavContextBottom
      :contextMenu="bottomContextMenu"
      id="context-bar-bottom"
      v-if="bottomContextMenu"
      :key="`bottom-context-${$route.fullPath}`"
    ></AppNavContextBottom>
    <AppFooter
      style="margin: 0; padding: 0"
      @hook:mounted="fixA11y()"
      v-if="showFooter"
    ></AppFooter>
    <div aria-live="polite" role="status" class="sr-only" id="route-announcer">
      {{ routeAnnouncement }}
    </div>
  </v-app>
</template>

<script>
// import { EventBus } from "@/event-bus";
import {
  fixBlankTableHeadings,
  fixExpandButtons,
  fixCarouselArrows,
  fixTableRowKeyboard,
  fixFigureTabindex,
  fixChipContrast,
  fixHeadingOrder,
  fixEmptyTableHeaders,
  fixFootnoteTargetSize,
  fixLinksInTextBlocks,
  fixNavHeaderRoles,
  fixOverlayContainer,
} from "@/a11y";

export default {
  watch: {
    // eslint-disable-next-line no-unused-vars
    $route(to, from) {
      this.checkForTopContextMenu();
      this.checkForDisclaimer();
      this.getBottomContextMenu();
      this.fixA11y();
      this.announceRoute();
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
      routeAnnouncement: "",
    };
  },

  methods: {
    getBottomContextMenu() {
      let bottomContextMenu = this.$myApp.context.filter((obj) => {
        if (obj["location"] === "bottom") {
          return obj;
        }
      });
      this.bottomContextMenu = bottomContextMenu;
    },
    announceRoute() {
      setTimeout(() => {
        this.routeAnnouncement = document.title;
      }, 300);
    },
    displayFooter() {
      this.$nextTick(() => {
        this.showFooter = true;
      });
    },
    fixA11y() {
      this.$nextTick(() => {
        fixBlankTableHeadings();
        fixExpandButtons();
        fixCarouselArrows();
        fixTableRowKeyboard();
        fixFigureTabindex();
        fixChipContrast();
        fixEmptyTableHeaders();
        fixLinksInTextBlocks();
        fixNavHeaderRoles();
        fixOverlayContainer();
        // Delayed fixes for CMS content that loads asynchronously
        setTimeout(() => {
          fixFigureTabindex();
          fixHeadingOrder();
          fixFootnoteTargetSize();
          fixEmptyTableHeaders();
          fixChipContrast();
          fixOverlayContainer();
          fixNavHeaderRoles();
        }, 2000);
      });
    },

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

  async mounted() {
    console.log("$myApp: ", this.$myApp);
    this.checkForTopContextMenu();
    this.getBottomContextMenu();
    this.checkForDisclaimer();
    this.fixA11y();
  },
  async created() {},
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
