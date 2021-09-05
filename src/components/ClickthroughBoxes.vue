<template>
  <div v-if="boxes && boxes.length">
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <h2 id="for-more-information">For more information</h2>
        </v-col>

        <v-col cols="12" xs="12" class="flex-container">
          <v-card
            class="elevation-1 px-8 py-10 box text-center hover card mr-1 my-1"
            style="border: 1px solid #ddd"
            v-for="(box, index) in boxes"
            :key="index"
            :color="getBoxColor(index)"
            @click="routeToURL(box.url)"
            :class="{
              'flex-item-3': boxesPerRow === 3,
              'flex-item-2': boxesPerRow === 2,
              'flex-item-1': boxesPerRow === 1,
            }"
          >
            <v-btn
              color="blue darken-3"
              fab
              dark
              absolute
              top
              left
              v-if="isItNew(box.datePosted)"
            >
              <span style="color: #fff !important"> NEW!</span>
            </v-btn>
            <v-icon style="font-size: 70px" v-if="box.icon">{{
              box.icon
            }}</v-icon>
            <v-icon style="font-size: 70px" v-else>dns</v-icon>
            <h3
              class="text-center box-head mt-3"
              style="
                color: black;
                border-bottom: 1px solid #aaa;
                padding-bottom: 10px;
                font-size: 30px;
              "
            >
              {{ box.title }}
            </h3>

            <v-card-text
              class="px-2 mt-1 font-weight-heavy box-text text-center"
              v-if="box.teaser && box.teaser.length"
            >
              <span v-html="render(box.teaser)" style="font-size: 14px"></span>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { renderToHtml } from "@/services/Markdown";
import moment from "moment";
export default {
  computed: {
    // rows() {
    //   let numberOfBoxes = this.boxes.length;
    //   // given 3 boxes in a row, compute rows
    //   let rows = Math.ceil(numberOfBoxes / 3);
    //   return rows;
    // },
  },
  data() {
    return {};
  },
  methods: {
    isItNew(datePosted) {
      if (!datePosted) return false;
      let now = moment(new Date()); //todays date
      let end = moment(datePosted); // another date
      let duration = moment.duration(now.diff(end));
      let days = duration.asDays();
      if (days <= this.$myApp.config.daysToShowNew) {
        return true;
      } else {
        return false;
      }
    },
    render(content) {
      return renderToHtml(content);
    },
    // eslint-disable-next-line no-unused-vars
    getAnimation() {
      if (this.disableAnimation) return null;
      return this.animation;
    },
    // eslint-disable-next-line no-unused-vars
    getBoxColor(index) {
      return "#fff";
    },
    routeToURL(originalURL) {
      const checkDomain = function (url) {
        if (url.indexOf("//") === 0) {
          url = location.protocol + url;
        }
        return url
          .toLowerCase()
          .replace(/([a-z])?:\/\//, "$1")
          .split("/")[0];
      };

      const isExternal = function (url) {
        return (
          (url.indexOf(":") > -1 || url.indexOf("//") > -1) &&
          checkDomain(location.href) !== checkDomain(url)
        );
      };
      if (isExternal(originalURL)) {
        window.open(originalURL, "noopener,resizable,scrollbars").focus();
      } else {
        this.$router.push(originalURL);
      }
    },
  },
  props: {
    boxes: {
      type: Array,
      default: () => [],
    },
    boxesPerRow: {
      type: Number,
      default: 3,
    },
    animation: {
      type: String,
      default: "zoom-in",
    },
    disableAnimation: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style></style>
