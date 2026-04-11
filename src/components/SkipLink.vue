<template>
  <nav>
    <router-link
      to="#content"
      aria-label="Skip to content"
      class="skiplink"
      @click.stop.prevent="$vuetify.goTo('#content')"
      title="Skip to content"
      style="font-size: 12px; color: #000 !important"
      id="skip-to-content"
    >
      Skip to content
    </router-link>
  </nav>
</template>

<script>
export default {
  methods: {
    skipLink: function () {
      this.$vuetify.goTo(500);
    },
  },
};
</script>

<style lang="scss" scoped></style>
