<template>
  <div>
    <!-- The title is the card's link (WCAG 2.1.1, 4.1.2); the card used to be a
         focusable <div> that ignored Enter. A click anywhere else on the card
         still opens the page. -->
    <v-card
      class="grid-item markdown-body hover card mr-1 ml-1 px-3 py-1 flex-grow-1 title-link-card"
      elevation="0"
      color="#fff"
      @click.native="onCardClick"
      ripple
    >
      <!-- Thumbnails repeat the card's title: decorative, loading spinner
           included (WCAG 1.1.1). -->
      <v-img
        :src="item.splash"
        :lazy-src="item.thumbnail"
        width="100%"
        height="250"
        class=""
        style="border: 0px solid #fafafa"
        alt=""
        v-if="type === 'article'"
      >
        <!-- <v-chip
          dark
          color="#0D4474"
          style="margin-top: -1px !important"
          v-if="isItNew(item)"
          class="icjia-card"
        >
          NEW!
        </v-chip> -->
        <!-- <v-btn
          v-if="isItNew(item)"
          dark
          elevation="2"
          fab
          absolute
          small
          class="mt-3 ml-3"
          color="#0D4474"
          >NEW!</v-btn
        > -->

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
        :src="item.image"
        width="100%"
        height="250"
        class=""
        style="border: 0px solid #fafafa"
        alt=""
        v-if="type === 'app'"
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

      <div class="px-5">
        <v-card-text style="font-size: 12px">{{
          item.date | format
        }}</v-card-text>

        <v-card-text
          ><div
            style="
              margin-top: -20px;
              font-size: 22px;
              font-weight: bold;
              line-height: 28px;
            "
          >
            <v-chip
              v-if="isItNew(item)"
              label
              small
              class="mr-1"
              style="margin-top: -2px"
            >
              <span style="color: #000000 !important; font-weight: 700"
                >NEW!</span
              >
            </v-chip>
            <router-link :to="item.fullPath" class="card-title-link">
              {{ item.title }}
            </router-link>
          </div></v-card-text
        >
        <v-card-text
          v-if="item.authors"
          style="
            font-weight: 700;
            color: #222;
            font-size: 12px;
            margin-top: -25px;
          "
          >{{ displayAuthors(item.authors) }}</v-card-text
        >

        <v-card-text v-if="item.abstract" style="margin-top: -15px">{{
          item.abstract | truncateBySentence(2, "")
        }}</v-card-text>
        <v-card-text v-if="item.description" style="margin-top: -15px">{{
          item.description | truncateBySentence(2, "")
        }}</v-card-text>
      </div>
    </v-card>
  </div>
</template>

<script>
const arrford = require("arrford");
import dayjs from "@/plugins/dayjs";
import { isClickOnLink } from "@/utils/focus";
export default {
  props: {
    item: {
      type: Object,
      default: null,
    },
    type: {
      type: String,
      default: "",
    },
  },
  methods: {
    displayAuthors(arr) {
      let authors = arr.map((a) => {
        return a.title;
      });
      return arrford(authors);
    },
    isItNew(item) {
      let now = dayjs(new Date()); //todays date
      let end = dayjs(item.date); // another date
      let duration = dayjs.duration(now.diff(end));
      let days = duration.asDays();
      if (days <= this.$myApp.config.daysToShowNewResearch) {
        return true;
      } else {
        return false;
      }
    },
    onCardClick(e) {
      if (isClickOnLink(e)) return;
      this.routeTo(this.item);
    },
    routeTo(item) {
      console.log(item);
      this.$router.push(`${item.fullPath}`);
    },
    getCardHeight(type) {
      if (type === "dataset") {
        return 300;
      } else {
        return 525;
      }
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
  data() {
    return {};
  },
};
</script>

<style lang="scss" scoped></style>
