<template>
  <div>
    <v-img
      :src="getImagePath(splash.url, 0, 0, 80)"
      :lazy-src="getImagePath(splash.formats.thumbnail.url)"
      contain
      class="mb-5"
      style="border: 0px solid #aaa; margin: 0 auto"
      aria-label="ICJIA Internet news item image"
      :alt="getAltText()"
      aspect-ratio="2"
      ><template v-slot:placeholder>
        <v-row class="fill-height ma-0" align="center" justify="center">
          <v-progress-circular
            indeterminate
            color="blue darken-3"
            aria-label="Progress bar: Loading"
          ></v-progress-circular>
        </v-row> </template
    ></v-img>
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
      default: 650,
    },
  },
};
</script>

<style>
.splash-caption {
  font-size: 12px;
  margin-top: -15px;
  margin-bottom: 25px;
  color: #222;
}
</style>
