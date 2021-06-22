<template>
  <div>
    <v-card
      class="grid-item markdown-body hover card mr-1 ml-1 px-3 py-1 flex-grow-1"
      elevation="0"
      color="#fff"
      @click="routeTo(item)"
    >
      <v-img
        :src="
          getImagePath(
            `https://icjia.illinois.gov/research/images/${item.id}-splash.jpeg`
          )
        "
        :lazy-src="item.thumbnail"
        aria-label="research content image"
        width="100%"
        height="250"
        class=""
        style="border: 0px solid #fafafa"
        alt="research content image"
        v-if="type === 'article'"
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
        :src="item.image"
        aria-label="ResearchHub content image"
        width="100%"
        height="250"
        class=""
        style="border: 0px solid #fafafa"
        alt="ResearchHub content image"
        v-if="type === 'app'"
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
            {{ item.title }}
          </div></v-card-text
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
import { getImageURL, getGrayscaleImageURL } from "@/services/Image";
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
    getImagePath(
      url,
      imgWidth = 0,
      imgHeight = 0,
      imageQuality = 50,
      grayscale
    ) {
      let imgPath;
      imgPath = `${url}`;
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
