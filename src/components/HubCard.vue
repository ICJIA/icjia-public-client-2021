<template>
  <div>
    <v-card
      class="pa-2 grid-item mb-3 info-card py-3 px-3"
      outlined
      :height="orientation === 'grid' ? 650 : null"
      @click="$router.push(item.fullPath)"
    >
      <v-card-text>{{ item.date | format }}</v-card-text>
      <v-card-text v-if="item.title"
        ><h2 style="margin-top: -20px; line-height: 25px">
          {{ item.title }}
        </h2></v-card-text
      >
      <v-card-text
        style="
          font-weight: 700;
          color: #888;
          font-size: 12px;
          margin-top: -25px;
        "
        >{{ displayAuthors(item.authors) }}</v-card-text
      >

      <v-img
        v-if="item.imagePath && !textOnly && imageOK"
        :src="getImagePath(item.imagePath, 0, 0, 40)"
        :lazy-src="getImagePath(item.imagePath, 0, 0, 1)"
        width="100%"
        :height="splashHeight"
        class="mb-5"
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

      <v-img
        v-else
        src="/icjia-half-splash-thumb.jpg"
        lazy-src="/icjia-half-splash-thumb.jpg"
        width="100%"
        :height="splashHeight"
        class="mb-5"
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

      <v-card-text
        v-if="item.abstract"
        style="margin-top: -15px; color: #111"
        >{{ truncate(item.abstract, this.truncation) }}</v-card-text
      >
    </v-card>
  </div>
</template>

<script>
const arrford = require("arrford");
import { format, parseISO } from "date-fns";
import { getImageURL } from "@/services/Image";
import moment from "moment";
export default {
  computed: {
    truncation() {
      if (this.orientation === "grid") {
        return 50;
      } else {
        return 999;
      }
    },
  },
  data() {
    return {
      imageOK: true,
    };
  },
  props: {
    orientation: {
      type: String,
      default: "grid",
    },
    item: {
      type: Object,
      default: () => {},
    },
    textOnly: {
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
    splashHeight: {
      type: Number,
      default: 150,
    },
  },
  mounted() {
    this.$emit("init");
  },

  methods: {
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
  },
};
</script>

<style lang="scss" scoped></style>
