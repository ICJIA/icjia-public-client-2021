<template>
  <div>
    <v-carousel
      height="550"
      hide-delimiter-background
      show-arrows-on-hover
      hide-delimiters
    >
      <v-carousel-item v-for="(slide, index) in slider.slide" :key="index">
        <v-card color="grey lighten-4" height="100%">
          <v-row class="fill-height" align="center" justify="center" no-gutters>
            <v-col md="12" cols="12">
              <v-img
                v-if="slide.image && slide.image.formats"
                :src="getImagePath(slide.image.url, 0, 0, 70, slide.grayscale)"
                :lazy-src="
                  getImagePath(slide.image.url, 0, 0, 1, slide.grayscale)
                "
                alt="ICJIA home page splash image"
                height="550"
              >
                <v-overlay
                  absolute
                  :opacity="slide.opacity"
                  :color="slide.tint"
                >
                  <div
                    class="text-center px-5"
                    style="background: rgba(125, 125, 125, 0.9); padding: 25px"
                    width="100% !important"
                  >
                    <div class="text-center px-5" style="min-width: 350px">
                      <h1 class="nofo-title mt-3" style="color: #fff">
                        {{ slide.title }}
                      </h1>
                      <div class="nofo-tagline" style="font-size: 14px">
                        {{ slide.teaser }}
                      </div>
                      <div class="mt-4">
                        <v-container>
                          <v-row>
                            <v-col
                              cols="12"
                              md="4"
                              v-for="(button, index) in buttons"
                              :key="`button-${index}`"
                            >
                              <v-menu
                                top
                                transition="slide-y-transition"
                                role="navigation"
                                id="button-2"
                                aria-label="Click this button for a menu of Y"
                                open-on-hover
                              >
                                <template v-slot:activator="{ on, attrs }">
                                  <v-btn
                                    outlined
                                    v-bind="attrs"
                                    v-on="on"
                                    large
                                    >{{ button.label }}</v-btn
                                  ></template
                                >
                                <v-list>
                                  <v-list-item
                                    v-for="(item, index) in button.menuItem"
                                    :key="index"
                                  >
                                    <v-list-item-title>{{
                                      item.label
                                    }}</v-list-item-title>
                                  </v-list-item>
                                </v-list>
                              </v-menu>
                            </v-col>
                          </v-row>
                        </v-container>
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
    <!-- {{ buttons }} -->
  </div>
</template>

<script>
import { getImageURL, getGrayscaleImageURL } from "@/services/Image";
export default {
  mounted() {},

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

      //console.log("grayscale", grayscale);
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
</style>
