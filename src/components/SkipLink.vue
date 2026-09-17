<template>
  <nav aria-label="Skip navigation">
    <a
      href="#content"
      class="skiplink"
      id="skip-to-content"
      @click="onSkip"
      @keydown.enter.prevent="onSkip"
      @keydown.space.prevent="onSkip"
    >
      Skip to main content
    </a>
  </nav>
</template>

<script>
import { scrollBehavior } from "@/utils/motion";

export default {
  methods: {
    onSkip(e) {
      // The router-link version of this component only scrolled — focus
      // stayed on the skip link, so the next Tab went back into the
      // header menu instead of into the main content. Fix: scroll to
      // #content, then programmatically move focus there. #content has
      // tabindex="-1" in App.vue so focus() actually takes effect.
      //
      // The target is #content, the page's own content, not <main>: main
      // also holds the breadcrumb bar and the section links, which a
      // keyboard user would otherwise still have to Tab through.
      if (e) e.preventDefault();
      const target = document.getElementById("content");
      if (!target) return;
      // The fixed header and the sticky context bar cover the top of the
      // window, so the content is scrolled to just below them. Native
      // scrolling, so we don't depend on Vuetify's goTo resolving across
      // route changes or dialog contexts.
      const covered = ["header.v-app-bar", "#context-bar"]
        .map((selector) => document.querySelector(selector))
        .filter(Boolean)
        .reduce(
          (max, el) => Math.max(max, el.getBoundingClientRect().bottom),
          0
        );
      const top =
        target.getBoundingClientRect().top + window.pageYOffset - covered;
      try {
        window.scrollTo({ top: Math.max(0, top), behavior: scrollBehavior() });
      } catch (_err) {
        window.scrollTo(0, Math.max(0, top));
      }
      // Focus without scrolling again — the scroll above handles it.
      // preventScroll is supported in all evergreen browsers.
      target.focus({ preventScroll: true });
      // Update the URL hash without triggering a router navigation so
      // the location bar reflects the anchor and the Back button works
      // as users expect.
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", "#content");
      }
    },
  },
};
</script>

<style lang="scss" scoped></style>
