<template>
  <div>
    <v-carousel
      height="600"
      hide-delimiter-background
      show-arrows-on-hover
      hide-delimiters
      style="border-bottom: 1px solid #d8d8d8; margin-top: -15px"
      aria-label="Featured content slideshow"
    >
      <v-carousel-item
        v-for="(slide, index) in slider.slide"
        :key="index"
        aria-roledescription="slide"
        :aria-label="'Slide ' + (index + 1) + ': ' + slide.title"
      >
        <v-card color="grey lighten-4" height="100%">
          <v-row class="fill-height" align="center" justify="center" no-gutters>
            <v-col md="12" cols="12">
              <v-img
                v-if="slide.image && slide.image.formats"
                :src="
                  getImagePath(
                    slide.image.formats.large.url,
                    0,
                    0,
                    85,
                    slide.grayscale
                  )
                "
                :lazy-src="
                  getImagePath(
                    slide.image.formats.thumbnail.url,
                    0,
                    0,
                    100,
                    slide.grayscale
                  )
                "
                alt="ICJIA home page splash image"
                height="600"
                role="presentation"
              >
                <v-overlay
                  absolute
                  :opacity="slide.opacity"
                  :color="slide.tint"
                  class="text-center"
                >
                  <div
                    class="px-10 pt-4 pb-7"
                    style="
                      width: 65%;
                      background: rgba(100, 100, 100, 0.9);
                      display: table;
                      margin: 0 auto;
                    "
                  >
                    <div class="text-center px-5" style="min-width: 350px">
                      <h1
                        class="nofo-title mt-3"
                        style="color: #fff; font-size: 24px; font-weight: bold"
                      >
                        {{ slide.title }}
                      </h1>
                      <div class="nofo-tagline mt-4" style="font-size: 14px">
                        {{ slide.teaser }}
                      </div>
                      <div class="mt-7 hidden-md-and-up">
                        <v-container>
                          <v-row>
                            <v-col>
                              <v-btn small color="#0d4474" to="/grants/"
                                >Apply for funding</v-btn
                              >
                            </v-col>
                            <v-col>
                              <v-btn
                                dark
                                small
                                color="#0d4474"
                                to="/forms/grant-status/"
                                class="splash-button py-0 ml-11"
                                >Grant Status Request
                              </v-btn>
                              <v-chip
                                class="ma-2"
                                style="
                                  color: #fff;
                                  background: purple;
                                  margin-top: -19px !important;
                                  margin-left: -14px !important;
                                  padding-top: 3px;
                                "
                                x-small
                                >NEW!</v-chip
                              >
                            </v-col>
                            <!-- <v-col>
                              <v-btn
                                dark
                                small
                                color="#0d4474"
                                to="/about/"
                                class="splash-button"
                                >About ICJIA</v-btn
                              >
                            </v-col> -->
                          </v-row>
                        </v-container>
                      </div>
                      <div class="hidden-sm-and-down mt-7">
                        <v-btn
                          small
                          color="#0d4474"
                          to="/grants/"
                          class="splash-button mr-2"
                          >Apply for funding</v-btn
                        >
                        <v-btn
                          dark
                          small
                          color="#0d4474"
                          to="/forms/grant-status/"
                          class="splash-button py-0 ml-11"
                          >Grant Status Request
                        </v-btn>
                        <v-chip
                          class="ma-2"
                          style="
                            color: #fff;
                            background: purple;
                            margin-top: -19px !important;
                            margin-left: -14px !important;
                            padding-top: 3px;
                          "
                          x-small
                          >NEW!</v-chip
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
                      aria-label="Loading image"
                    ></v-progress-circular>
                  </v-row>
                </template>
              </v-img>
            </v-col>
          </v-row>
        </v-card>
      </v-carousel-item>
    </v-carousel>
    <!-- {{ buttons }} -->
  </div>
</template>

<script>
import { getImageURL, getGrayscaleImageURL } from "@/services/Image";
export default {
  mounted() {
    //console.log(this.slider);
  },

  methods: {
    getButtonSize() {
      return 12 / this.buttons.length;
    },
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
      grayscale
    ) {
      let imgPath;
      imgPath = `${this.base}${url}`;
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

      return thumborImgPath;
    },
  },
  props: {
    slider: {
      type: Object,
      default: () => {},
    },
    buttons: {
      type: Array,
      default: () => [],
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

.splash-button:hover {
  color: #ccc !important;
}
</style>
