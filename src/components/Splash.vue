<template>
  <div>
    <div class="splash-wrap mb-5">
      <img
        :src="splashSrc"
        :alt="getAltText()"
        loading="lazy"
        decoding="async"
        class="splash-img"
      />
    </div>
    <div class="splash-caption font-lato" v-if="splash.caption">
      {{ splash.caption }}
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    // Prefer Strapi's pre-sized "large" (1000px) so it stays sharp within the
    // capped display width; step down to medium/small, then the original
    // (smaller or SVG sources won't have a "large").
    splashSrc() {
      const formats = (this.splash && this.splash.formats) || {};
      const best = formats.large || formats.medium || formats.small || null;
      const path = best ? best.url : this.splash && this.splash.url;
      return `${this.$myApp.config.api.base}${path}`;
    },
  },
  methods: {
    getAltText() {
      if (this.splash.alternativeText) {
        return this.splash.alternativeText;
      } else {
        return "ICJIA Internet news item image";
      }
    },
  },
  props: {
    splash: {
      type: Object,
      default: () => {},
    },
    splashHeight: {
      type: Number,
      default: 650,
    },
  },
};
</script>

<style>
.splash-wrap {
  max-width: 750px;
  margin: 0 auto;
}
.splash-img {
  display: block;
  width: 100%;
  height: auto;
}
.splash-caption {
  font-size: 12px;
  margin-top: -15px;
  margin-bottom: 25px;
  color: #222;
}
</style>
