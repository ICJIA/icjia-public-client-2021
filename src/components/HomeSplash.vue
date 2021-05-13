<template>
  <div>
    <v-carousel
      height="500"
      hide-delimiter-background
      show-arrows-on-hover
      hide-delimiters
      style="margin-top: -12px"
    >
      <v-carousel-item v-for="(slide, index) in slider.slide" :key="index">
        <v-card color="grey lighten-4" height="100%">
          <v-row class="fill-height" align="center" justify="center" no-gutters>
            <v-col md="12" cols="12">
              <v-img
                v-if="slide.image && slide.image.formats"
                :src="getImagePath(`${slide.image.url}`, 0, 0, 60, true)"
                :lazy-src="getImagePath(`${slide.image.url}`, 0, 0, 1, true)"
                alt="ICJIA home page splash image"
                height="450"
              >
                <v-overlay absolute opacity=".3" color="blue lighten-3">
                  <div
                    class="text-center px-5"
                    style="background: rgba(125, 125, 125, 0.9); padding: 25px"
                    width="100% !important"
                  >
                    <div class="text-center px-5" style="min-width: 350px">
                      <h1 class="nofo-title mt-3" style="color: #1b69bc">
                        Title 1 here
                      </h1>
                      <div class="nofo-tagline">Teaser here</div>
                      <div class="mt-4">
                        <v-container fluid
                          ><v-row>
                            <v-col cols="12" md="4">
                              <v-btn outlined class="mr-3">Button here</v-btn>
                            </v-col>
                            <v-col cols="12" md="4">
                              <v-btn outlined class="mr-3">Button here</v-btn>
                            </v-col>
                            <v-col cols="12" md="4">
                              <v-btn outlined class="mr-3">Button here</v-btn>
                            </v-col></v-row
                          ></v-container
                        >
                      </div>
                    </div>
                  </div>
                </v-overlay>
                <template v-slot:placeholder>
                  <v-row
                    class="fill-height ma-0"
                    align="center"
                    justify="center"
                  >
                    <v-progress-circular
                      indeterminate
                      color="grey lighten-5"
                    ></v-progress-circular>
                  </v-row>
                </template>
              </v-img>
            </v-col>
          </v-row>
        </v-card>
      </v-carousel-item>
    </v-carousel>
  </div>
</template>

<script>
import { getImageURL, getGrayscaleImageURL } from "@/services/Image";
export default {
  mounted() {},
  methods: {
    route(url) {
      var r = new RegExp("^(?:[a-z]+:)?//", "i");
      if (r.test(url)) {
        window.open(url);
      } else {
        // eslint-disable-next-line no-unused-vars
        this.$router.push(url).catch((err) => {
          this.$vuetify.goTo(0);
        });
      }
    },
    getImagePath(
      url,
      imgWidth = 0,
      imgHeight = 0,
      imageQuality = 50,
      grayscale = false
    ) {
      let imgPath;
      imgPath = `${this.$myApp.config.api.base}${url}`;
      let thumborImgPath;
      if (grayscale) {
        thumborImgPath = getGrayscaleImageURL(
          imgPath,
          imgWidth,
          imgHeight,
          imageQuality
        );
      } else {
        thumborImgPath = getImageURL(
          imgPath,
          imgWidth,
          imgHeight,
          imageQuality
        );
      }

      console.log("splash path: ", thumborImgPath);
      return thumborImgPath;
    },
  },
  props: {
    slider: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      base: this.$myApp.config.api.base,
    };
  },
};
</script>

<style>
.heavy {
  font-weight: 900;
}
</style>
