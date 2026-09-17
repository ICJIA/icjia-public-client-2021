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

    <v-main id="main-content" tabindex="-1" style="background: #fcfcfc">
      <AppNavContext
        :contextMenu="topContextMenu"
        v-if="topContextMenu"
        id="context-bar"
        :key="`top-context-${$route.fullPath}`"
      ></AppNavContext>
      <div id="content" tabindex="-1">
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
      <div
        aria-live="polite"
        role="status"
        class="sr-only"
        id="route-announcer"
      >
        {{ routeAnnouncement }}
      </div>
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
  </v-app>
</template>

<script>
// import { EventBus } from "@/event-bus";
import { sanitizeText } from "@/utils/contentSanitizer";
import {
  fixBlankTableHeadings,
  fixExpandButtons,
  fixCarouselArrows,
  fixTableRowKeyboard,
  fixChipContrast,
  fixHeadingOrder,
  fixEmptyTableHeaders,
  fixFootnoteTargetSize,
  fixLinksInTextBlocks,
  fixNavHeaderRoles,
  fixOverlayContainer,
  fixNestedInteractive,
  fixInvalidRoles,
  fixProhibitedAriaOnImg,
  fixCarouselItemRoles,
  fixLabelInName,
  fixFormFieldLabels,
  fixTableCellContext,
  fixAriaRoleAttribute,
  fixProhibitedAriaOnLinks,
  fixEmptyContainers,
  fixInlineColorContrast,
  fixDataTableHeaders,
  fixAriaHiddenFocus,
  fixEmptyAriaLabel,
  fixVuetifyEmptyContainers,
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
    // Uses function form to run CMS titles through the content sanitizer
    titleTemplate(chunk) {
      return chunk ? `ICJIA | ${sanitizeText(chunk)}` : "ICJIA";
    },
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
      // vue-meta sets document.title only once the new page's metaInfo
      // resolves — for CMS pages, after their content has loaded, which is
      // often well past any fixed delay. The old 300 ms timer therefore
      // announced the previous page's title or the bare "ICJIA" placeholder.
      // Instead, wait for the title to settle on the new page's own value,
      // with a fallback so every navigation is still announced.
      const isHome = this.$route.path === "/";
      if (this.titleObserver) this.titleObserver.disconnect();
      clearTimeout(this.titleSettleTimer);
      clearTimeout(this.titleFallbackTimer);

      const announce = () => {
        if (this.titleObserver) this.titleObserver.disconnect();
        this.titleObserver = null;
        clearTimeout(this.titleSettleTimer);
        clearTimeout(this.titleFallbackTimer);
        this.lastAnnouncedTitle = document.title;
        // Clear first, so a live region hears a change even when two pages
        // share a title.
        this.routeAnnouncement = "";
        this.$nextTick(() => {
          this.routeAnnouncement = document.title;
        });
      };
      // While a page loads, vue-meta shows a placeholder: the bare "ICJIA", or
      // this component's default "ICJIA | Illinois Criminal Justice
      // Information Authority". Neither is the new page's title, so wait
      // past both (1.5.67 waited past only the first, and slower pages
      // announced the default title). A page whose title really is the
      // default is still announced by the fallback below.
      const { title: defaultTitle, titleTemplate } = this.$options.metaInfo;
      const placeholders = [titleTemplate(""), titleTemplate(defaultTitle)];
      const titleIsNew = () =>
        document.title !== this.lastAnnouncedTitle &&
        (isHome || !placeholders.includes(document.title));
      const onTitleChange = () => {
        clearTimeout(this.titleSettleTimer);
        if (titleIsNew()) this.titleSettleTimer = setTimeout(announce, 250);
      };

      if (typeof MutationObserver !== "undefined") {
        this.titleObserver = new MutationObserver(onTitleChange);
        this.titleObserver.observe(document.head, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      }
      onTitleChange();
      this.titleFallbackTimer = setTimeout(announce, 3000);
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
        fixChipContrast();
        fixEmptyTableHeaders();
        fixLinksInTextBlocks();
        fixNavHeaderRoles();
        fixOverlayContainer();
        fixNestedInteractive();
        fixInvalidRoles();
        fixAriaRoleAttribute();
        fixProhibitedAriaOnImg();
        fixProhibitedAriaOnLinks();
        fixCarouselItemRoles();
        fixLabelInName();
        fixFormFieldLabels();
        fixDataTableHeaders();
        fixEmptyAriaLabel();
        fixVuetifyEmptyContainers();
        // Must run AFTER fixVuetifyEmptyContainers so any focusable
        // descendants of newly-aria-hidden containers get tabindex=-1
        // in the same pass (otherwise sia-r17 "Hidden element has
        // focusable content" fires until the next route change).
        fixAriaHiddenFocus();
        // Delayed fixes for CMS content that loads asynchronously
        setTimeout(() => {
          fixHeadingOrder();
          fixFootnoteTargetSize();
          fixEmptyTableHeaders();
          fixChipContrast();
          fixOverlayContainer();
          fixNavHeaderRoles();
          fixNestedInteractive();
          fixInvalidRoles();
          fixAriaRoleAttribute();
          fixProhibitedAriaOnImg();
          fixProhibitedAriaOnLinks();
          fixCarouselItemRoles();
          fixLabelInName();
          fixFormFieldLabels();
          fixTableCellContext();
          fixEmptyContainers();
          fixInlineColorContrast();
          fixDataTableHeaders();
          fixEmptyAriaLabel();
          fixVuetifyEmptyContainers();
          fixAriaHiddenFocus();
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
    this.lastAnnouncedTitle = document.title;
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
