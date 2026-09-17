<template>
  <div>
    <!-- The title is the card's link (WCAG 2.1.1, 4.1.2); the card used to be a
         focusable <div> that ignored Enter. A click anywhere else on the card
         still opens the post. The category is its own link, outside the
         title link. -->
    <v-card
      class="ml-1 pt-1 hover card title-link-card"
      elevation="0"
      color="#fff"
      min-height="150"
      :class="{ 'rule-top': index && index > 0 }"
      style="overflow-y: none"
      @click.native="onCardClick"
      ripple
    >
      <v-container fluid>
        <v-row>
          <v-col cols="12" md="4">
            <!-- Thumbnails repeat the card's title: decorative, loading
                 spinner included (WCAG 1.1.1). -->
            <v-img
              :src="`${getImage(item.splash.formats)}`"
              width="100%"
              class=""
              style="border: 0px solid #fafafa; max-height: 200px !important"
              alt=""
              contain
              v-if="item.splash"
            >
              <template v-slot:placeholder>
                <v-row
                  class="fill-height ma-0"
                  align="center"
                  justify="center"
                  aria-hidden="true"
                >
                  <v-progress-circular
                    indeterminate
                    aria-label="Progress bar: Loading"
                    color="blue darken-3"
                  ></v-progress-circular>
                </v-row>
              </template>
            </v-img>
            <v-img
              src="/icjia-half-splash-thumb-v2.jpg"
              width="100%"
              class=""
              style="border: 0px solid #fafafa"
              alt=""
              v-else
            >
              <template v-slot:placeholder>
                <v-row
                  class="fill-height ma-0"
                  align="center"
                  justify="center"
                  aria-hidden="true"
                >
                  <v-progress-circular
                    indeterminate
                    aria-label="Progress bar: Loading"
                    color="blue darken-3"
                  ></v-progress-circular>
                </v-row>
              </template>
            </v-img>
          </v-col>
          <v-col cols="12" md="8"
            ><v-card-text
              style="
                font-size: 14px;
                margin-top: -25px;
                color: #000;
                font-weight: 400;
              "
            >
              <router-link
                style="font-weight: 700"
                class="category"
                :to="
                  searchLink(
                    getProperCategory($myApp.config.maps.news, item.category)
                  )
                "
                >{{
                  getProperCategory(
                    $myApp.config.maps.news,
                    item.category
                  ).toUpperCase()
                }}</router-link
              >&nbsp;|&nbsp;{{ item.publicationDate | format }}
            </v-card-text>

            <v-card-text
              ><div
                style="
                  margin-top: -25px;
                  font-size: 18px;
                  font-weight: 700;
                  line-height: 28px;
                "
              >
                <h2 style="font-size: 18px" class="mt-1">
                  <v-chip
                    v-if="isItNew(item)"
                    label
                    small
                    class="mr-2"
                    style="margin-top: 0px"
                  >
                    <span style="color: #000000 !important; font-weight: 700"
                      >NEW!</span
                    > </v-chip
                  ><router-link :to="item.fullPath" class="card-title-link">{{
                    item.title
                  }}</router-link>
                </h2>
              </div></v-card-text
            >

            <v-card-text style="margin-top: -15px"
              ><div>
                <p>
                  {{ truncate(item.summary) }}
                </p>
              </div></v-card-text
            >
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </div>
</template>

<script>
import { searchLocation } from "@/utils/search";
import { isClickOnLink } from "@/utils/focus";
import { getProperCategory } from "@/utils/content";
import dayjs from "@/plugins/dayjs";
export default {
  data() {
    return {
      getProperCategory,
    };
  },
  methods: {
    isItNew(item) {
      const now = dayjs(new Date());
      const end = dayjs(item.publicationDate); // another date
      const duration = dayjs.duration(now.diff(end));
      const days = duration.asDays();
      if (days <= this.$myApp.config.daysToShowNew) {
        return true;
      } else {
        return false;
      }
    },
    resize() {
      // this.getHeight();
      // if (this.item && this.item.splash && this.item.splash.formats) {
      //   this.getImage(this.item.splash.formats);
      // }
      console.log("resize");
    },
    getImage(formats) {
      const base = this.$myApp.config.api.base;
      // Mobile cards stack to full-width (~360-400px rendered). Strapi's
      // thumbnail variant (~245px) is the right fit; small (~500px) is
      // oversized and costs ~30 KiB per image on the homepage. Fall back
      // to small if the CMS didn't generate a thumbnail for this item.
      const isMobile =
        this.$vuetify.breakpoint.xs || this.$vuetify.breakpoint.sm;
      const target =
        isMobile && formats.thumbnail ? formats.thumbnail : formats.small;
      return `${base}${target.url}`;
    },
    getHeight() {
      if (this.$vuetify.breakpoint.sm || this.$vuetify.breakpoint.xs) {
        return "200px";
      } else {
        return "180px;";
      }
    },
    searchLink(name) {
      return searchLocation({ query: name, type: "general" });
    },
    onCardClick(e) {
      if (isClickOnLink(e)) return;
      this.routeTo(this.item.fullPath);
    },
    routeTo(fullPath) {
      //console.log(fullPath);
      this.$router.push(fullPath);
    },
    truncate(string, maxWords = 30) {
      var strippedString = string.trim();
      var array = strippedString.split(" ");
      var wordCount = array.length;
      string = array.splice(0, maxWords).join(" ");

      if (wordCount > maxWords) {
        string += "...";
      }

      return string;
    },
  },
  props: {
    item: {
      type: Object,
      default: () => {},
    },
    index: {
      type: Number,
      default: null,
    },
  },
};
</script>

<style>
.rule-top {
  border-top: 1px solid #e8e8e8 !important;
}
</style>
