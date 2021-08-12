<template>
  <div>
    <v-card
      class="ml-1 pt-1 hover card"
      elevation="0"
      color="#fff"
      min-height="150"
      :class="{ 'rule-top': index && index > 0 }"
      style="overflow-y: auto !important"
      @click="routeTo(item.fullPath)"
      v-resize="resize"
    >
      <v-container fluid>
        <v-row>
          <v-col cols="12" md="4">
            <v-img
              aria-label="News post image"
              :src="`${getImage(item.splash.formats)}`"
              :height="getHeight()"
              class=""
              style="border: 0px solid #fafafa"
              alt="ICJIA Intranet image"
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
              src="/icjia-half-splash-thumb.jpg"
              :height="getHeight()"
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
                  line-height: 24px;
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
import { EventBus } from "@/event-bus";
import { getProperCategory } from "@/utils/content";
import moment from "moment";
export default {
  data() {
    return {
      getProperCategory,
    };
  },
  methods: {
    isItNew(item) {
      const now = moment(new Date());
      const end = moment(item.publicationDate); // another date
      const duration = moment.duration(now.diff(end));
      const days = duration.asDays();
      if (days <= this.$myApp.config.daysToShowNew) {
        return true;
      } else {
        return false;
      }
    },
    resize() {
      this.getHeight();
      this.getImage(this.item.splash.formats);
      console.log("resize");
    },
    getImage(formats) {
      let base = this.$myApp.config.api.base;
      let imageURL;

      if (this.$vuetify.breakpoint.sm || this.$vuetify.breakpoint.xs) {
        imageURL = formats.small.url;
      } else {
        imageURL = formats.thumbnail.url;
      }
      //console.log(`${base}${imageURL}`);
      return `${base}${imageURL}`;
    },
    getHeight() {
      if (this.$vuetify.breakpoint.sm || this.$vuetify.breakpoint.xs) {
        return "225px";
      } else {
        return "100px;";
      }
    },
    search(name) {
      let opts = {
        query: name,
        type: "general",
      };
      EventBus.$emit("search", opts);
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
