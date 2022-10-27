<template>
  <div>
    <v-img
      :src="getImagePath(splash.url, 0, 0, 80)"
      :lazy-src="getImagePath(splash.formats.thumbnail.url)"
      width="100%"
      :height="splashHeight"
      class="mb-5"
      style="border: 1px solid #aaa"
      aria-label="ICJIA Internet news item image"
      :alt="getAltText()"
      ><template v-slot:placeholder>
        <v-row class="fill-height ma-0" align="center" justify="center">
          <v-progress-circular
            indeterminate
            color="blue darken-3"
            aria-label="Progress bar: Loading"
          ></v-progress-circular>
        </v-row>
      </template>

      <v-row align="center">
        <div class="banner">
          <v-col cols="12" class="text-center">
            <h1 class="" style="color: #fff">Institute 2 Innovate</h1>

            <div class="" style="color: #fff">
              i2i supports “grassroots” organizations and community groups
              committed to changing the circumstance of violence in their
              communities.
            </div>
            <v-btn
              class="mt-6"
              color="white"
              @click="$vuetify.goTo('#about', { offset: 20 })"
              >Learn More</v-btn
            >&nbsp;&nbsp;
            <v-btn
              class="mt-6"
              outlined
              color="white"
              @click="$vuetify.goTo('#contact', { offset: 20 })"
              >Contact</v-btn
            >
          </v-col>
        </div>
      </v-row>
    </v-img>
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

.banner {
  width: 100%;
  background: rgba(79, 80, 79, 0.7);
  padding: 30px;
  margin-top: 250px;
}
@media only screen and (max-width: 600px) {
  .banner {
    height: 100%;
    background: rgba(79, 80, 79, 0.5);
  }
}
</style>
