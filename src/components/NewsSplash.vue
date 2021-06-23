<template>
  <div>
    <v-img
      :src="getImagePath(splash.url, 0, 0, 50)"
      :lazy-src="getImagePath(splash.formats.thumbnail.url)"
      width="100%"
      height="400"
      class="mb-5"
      style="border: 1px solid #fafafa"
      aria-label="ICJIA Internet news item image"
      :alt="getAltText()"
      ><template v-slot:placeholder>
        <v-row class="fill-height ma-0" align="center" justify="center">
          <v-progress-circular
            indeterminate
            color="blue darken-3"
            aria-label="Progress bar: Loading"
          ></v-progress-circular>
        </v-row> </template
    ></v-img>
    <div class="splash-caption">{{ caption }}</div>
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
    caption: {
      type: String,
      default: "Default caption",
    },
  },
};
</script>

<style>
.splash-caption {
  font-size: 14px;
  margin-top: -15px;
  margin-bottom: 25px;
}
</style>
