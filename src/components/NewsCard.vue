<template>
  <v-card
    elevation="1"
    class="pa-2 card py-8 px-3 mx-1"
    outlined
    min-width="300px"
    @click.prevent="$router.push(item.fullPath)"
  >
    <v-card-text>
      <span
        style="font-weight: 700"
        class="category"
        @click.stop.prevent="
          search(getProperCategory($myApp.config.maps.news, item.category))
        "
        >{{
          getProperCategory(
            $myApp.config.maps.news,
            item.category
          ).toUpperCase()
        }}</span
      >&nbsp;|&nbsp;<span v-if="!showUpdated" class="font-lato">{{
        item.publicationDate | format
      }}</span></v-card-text
    >
    <v-card-text v-if="item.title"
      ><h2 style="margin-top: -20px; line-height: 25px">
        {{ item.title }}
      </h2></v-card-text
    >
    <v-card-text
      v-if="item.authors"
      style="font-weight: 700; color: #888; font-size: 12px; margin-top: -25px"
      >{{ displayAuthors(item.authors) }}</v-card-text
    >
    <div v-if="item.splash">
      <v-img
        :src="`https://agency.icjia-api.cloud${item.splash.formats.small.url}`"
        :lazy-src="`https://agency.icjia-api.cloud${item.splash.formats.thumbnail.url}`"
        width="100%"
        height="250"
        class="mb-8"
        :ref="'img_' + item.id"
        @error="errorHandler(item.id)"
        style="border: 1px solid #fafafa"
        alt="ICJIA News image"
        @load="resize"
        ><template #placeholder>
          <v-row class="fill-height ma-0" align="center" justify="center">
            <v-progress-circular
              indeterminate
              color="blue darken-3"
              aria-label="progress"
            ></v-progress-circular>
          </v-row>
        </template>
      </v-img>
    </div>

    <div v-else>
      <span style="width: 100% !important">&nbsp;</span>
    </div>

    <v-card-text v-if="item.summary" style="margin-top: -35px; color: #111"
      >{{ item.summary }}
    </v-card-text>

    <div class="ml-3">
      <BasePropDisplay v-if="item.tags" name="">
        <BasePropChip v-for="tag in item.tags" :key="tag">
          <template>{{ tag }}</template>
        </BasePropChip>
      </BasePropDisplay>
    </div>
  </v-card>
</template>

<script>
import { EventBus } from "@/event-bus";
const arrford = require("arrford");
import { format, parseISO } from "date-fns";
import { getImageURL } from "@/services/Image";
import { getProperCategory } from "@/utils/content";
import moment from "moment";
export default {
  computed: {
    truncation() {
      if (this.orientation === "grid") {
        return 30;
      } else {
        return 999;
      }
    },
    splashHeight() {
      if (this.orientation === "grid") {
        return 150;
      } else {
        return 225;
      }
    },
  },
  data() {
    return {
      imageOK: true,
      getProperCategory,
    };
  },
  props: {
    orientation: {
      type: String,
      default: "grid",
    },
    animation: {
      type: String,
      default: "zoom-in",
    },
    item: {
      type: Object,
      default: () => {},
    },
    textOnly: {
      type: Boolean,
      default: false,
    },
    showUpdated: {
      type: Boolean,
      default: false,
    },
    readMoreText: {
      type: String,
      default: "Read more",
    },
    view: {
      type: String,
      require: true,
      default: null,
    },
    cardHeight: {
      type: Number,
      default: null,
    },
    // splashHeight: {
    //   type: Number,
    //   default: 150,
    // },
  },
  mounted() {
    this.$emit("init");
  },

  methods: {
    categoryClick(e) {
      //console.log("chip click: ", e.target.innerHTML);
      let opts = {
        query: e.target.innerText.toLowerCase(),
        type: "hub",
      };
      EventBus.$emit("search", opts);
    },
    errorHandler(id) {
      console.log("error for image: ", id);
      console.log(this.$refs["img_" + id].src);
      // this.$refs["img_" + id].src = "https://via.placeholder.com/400x200";
      this.imageOK = false;
    },
    displayAuthors(arr) {
      let authors = arr.map((a) => {
        return a.title;
      });
      return arrford(authors);
    },
    getSplash(item) {
      return `${item.imagePath}`;
    },
    isItNew(item) {
      const now = moment(new Date());
      const end = moment(item.published_at); // another date
      const duration = moment.duration(now.diff(end));
      const days = duration.asDays();
      if (days <= 14) {
        return true;
      } else {
        return false;
      }
    },
    truncate(string, maxWords = 30) {
      if (!string) return "";
      var strippedString = string.trim();
      var array = strippedString.split(" ");
      var wordCount = array.length;
      string = array.splice(0, maxWords).join(" ");

      if (wordCount > maxWords) {
        string += "...";
      }

      return string;
    },
    getImagePath(url, imgWidth = 0, imgHeight = 0, imageQuality = 50) {
      let imgPath;

      imgPath = `${url}`;

      const thumborImgPath = getImageURL(
        imgPath,
        imgWidth,
        imgHeight,
        imageQuality
      );
      // console.log(thumborImgPath);
      return thumborImgPath;
    },
    formatDate(d) {
      const temp = new Date(d).toJSON().split("T")[0];
      const myDate = `${temp}T23:59:59.000Z`;
      const formattedDate = format(parseISO(myDate), "MMMM dd, yyyy");
      return formattedDate;
    },
    resize() {
      //console.log("image loaded");
      this.$emit("resize");
    },
    search(name) {
      let opts = {
        query: name,
        type: "general",
      };
      EventBus.$emit("search", opts);
    },
  },
};
</script>

<style></style>
