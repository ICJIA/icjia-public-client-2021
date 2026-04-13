<template>
  <div>
    <v-card
      class="ml-1 pt-1 hover card"
      elevation="0"
      color="#fff"
      min-height="150"
      :class="{ 'rule-top': index && index > 0 }"
      style="overflow-y: none"
      @click="routeTo(item.fullPath)"
    >
      <v-container fluid>
        <v-row>
          <v-col cols="12" md="4">
            <v-img
              aria-label="News post image"
              :src="`${getImage(item.splash.formats)}`"
              width="100%"
              class=""
              style="border: 0px solid #fafafa; max-height: 200px !important"
              alt="ICJIA Intranet image"
              contain
              v-if="item.splash"
            >
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular
                    indeterminate
                    aria-label="Progress bar: Loading"
                    color="blue darken-3"
                  ></v-progress-circular>
                </v-row>
              </template>
            </v-img>
            <v-img
              aria-label="News post image"
              src="/icjia-half-splash-thumb-v2.jpg"
              width="100%"
              class=""
              style="border: 0px solid #fafafa"
              alt="ICJIA Intranet image"
              v-else
            >
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
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
              <span
                style="font-weight: 700"
                class="category"
                @click.stop.prevent="
                  search(
                    getProperCategory($myApp.config.maps.news, item.category)
                  )
                "
                >{{
                  getProperCategory(
                    $myApp.config.maps.news,
                    item.category
                  ).toUpperCase()
                }}</span
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
                    color="#0D4474"
                    class="mr-2"
                    style="margin-top: 0px"
                  >
                    <span style="color: #fff !important; font-weight: 400">
                      NEW!
                    </span> </v-chip
                  >{{ item.title }}
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
import { goToSearch } from "@/utils/search";
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
    search(name) {
      goToSearch(this.$router, { query: name, type: "general" });
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
