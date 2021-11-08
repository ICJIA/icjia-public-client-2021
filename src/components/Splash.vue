<template>
  <div>
    <img
      :src="getImagePath(splash.url, 0, 0, 80)"
      width="100%"
      :height="splashHeight"
      class="mb-5"
      style="border: 1px solid #aaa"
      aria-label="ICJIA Internet news item image"
      :alt="getAltText()"
    />
    <div class="splash-caption font-lato" v-if="splash.caption">
      {{ splash.caption }}
    </div>
  </div>
</template>

<script>
import { getImageURL } from "@/services/Image";
export default {
  methods: {
    getImagePath(url) {
      let imgPath;
      imgPath = `${this.$myApp.config.api.base}${url}`;
      const thumborImgPath = getImageURL(imgPath);
      return thumborImgPath;
    },
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
      default: 450,
    },
  },
};
</script>

<style>
.splash-caption {
  font-size: 12px;
  margin-top: -15px;
  margin-bottom: 25px;
  color: #777;
}
</style>
