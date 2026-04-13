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
      Skip to content
    </a>
  </nav>
</template>

<script>
export default {
  methods: {
    onSkip(e) {
      // The router-link version of this component only scrolled — focus
      // stayed on the skip link, so the next Tab went back into the
      // header menu instead of into the main content. Fix: scroll to
      // #content, then programmatically move focus there. #content has
      // tabindex="-1" in App.vue so focus() actually takes effect.
      if (e) e.preventDefault();
      const target = document.getElementById("content");
      if (!target) return;
      // Use native scroll so we don't depend on Vuetify's goTo resolving
      // across route changes or dialog contexts.
      try {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (_err) {
        target.scrollIntoView();
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
