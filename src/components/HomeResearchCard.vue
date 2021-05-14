<template>
  <div>
    <v-card
      class="grid-item markdown-body hover card info-card mr-1 ml-1 px-3 py-3"
      elevation="0"
      color="#fff"
      style="border: 1px solid #ccc"
      :height="getCardHeight(type)"
    >
      <v-img
        :src="
          getImagePath(
            `https://icjia.illinois.gov/researchhub/images/${item.id}-splash.jpeg`
          )
        "
        :lazy-src="item.thumbnail"
        aria-label="ResearchHub content image"
        width="100%"
        height="250"
        class=""
        style="border: 0px solid #fafafa"
        alt="ResearchHub content image"
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
          this.truncate(item.abstract)
        }}</v-card-text>
        <v-card-text v-if="item.description" style="margin-top: -15px">{{
          this.truncate(item.description)
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
    getCardHeight(type) {
      if (type === "dataset") {
        return 300;
      } else {
        return 575;
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
    truncate(string, maxWords = 40) {
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
