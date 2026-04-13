<template>
  <v-card
    elevation="2"
    class="pa-2 grid-item mb-3 card py-8 px-3 mx-1"
    outlined
    :min-height="orientation === 'grid' ? 400 : null"
    :height="cardHeight"
    :to="item.fullPath"
    style="width: 100%"
  >
    <v-card-text
      ><span v-if="!showUpdated" class="font-lato">{{
        item.date | format
      }}</span></v-card-text
    >
    <div>
      <v-chip
        v-if="isItNew(item.date)"
        label
        small
        color="#0D4474"
        class="mb-3 ml-3"
        style="margin-top: 0px"
      >
        <span style="color: #fff !important; font-weight: 400"> NEW! </span>
      </v-chip>
    </div>
    <v-card-text v-if="item.title"
      ><h2 style="margin-top: -20px; line-height: 25px">
        {{ item.title }}
      </h2></v-card-text
    >
    <v-card-text
      v-if="item.authors"
      style="font-weight: 700; color: #000; font-size: 12px; margin-top: -40px"
      >{{ displayAuthors(item.authors) }}</v-card-text
    >

    <div v-if="!textOnly">
      <v-img
        v-if="item.image"
        :src="item.image"
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
              aria-label="Loading image"
            ></v-progress-circular>
          </v-row>
        </template>
      </v-img>

      <v-img
        v-if="item.imagePath && !item.image && !textOnly && imageOK"
        :src="item.imagePath"
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
              aria-label="Loading image"
            ></v-progress-circular>
          </v-row>
        </template>
      </v-img>

      <v-img
        v-if="item.imagePath && !item.image && !textOnly && !imageOK"
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
              aria-label="Loading image"
            ></v-progress-circular>
          </v-row>
        </template>
      </v-img>
    </div>
    <v-card-text
      v-if="item.description"
      style="margin-top: -15px; color: #111"
      >{{ truncate(item.description, this.truncation) }}</v-card-text
    >
    <v-card-text v-else style="margin-top: -15px; color: #111">{{
      truncate(item.abstract, this.truncation)
    }}</v-card-text>

    <div class="ml-3">
      <BasePropDisplay name="Contributors" v-if="item.contributors">
        <template>
          <span v-for="(contributor, i) in item.contributors" :key="i">
            <template v-if="i > 1">{{
              app.contributors.length > i + 1 ? ", " : " and "
            }}</template>

            <a
              v-if="contributor.url"
              :href="contributor.url"
              target="_blank"
              rel="noreferrer"
            >
              <template>{{ contributor.title }}</template>
            </a>
            <template v-else>{{ contributor.title }}</template>
          </span>
        </template>
      </BasePropDisplay>

      <BasePropDisplay v-if="showUpdated" :name="updatedText">
        {{ item.date | format }}
      </BasePropDisplay>
      <BasePropDisplay
        v-if="item.categories && item.categories.length"
        name="Categories"
      >
        <span
          v-for="(category, index) in item.categories"
          :key="index"
          class="mr-1 category"
          style=""
          role="button"
          tabindex="0"
          @click.prevent.stop="categoryClick($event)"
          @keydown.enter.prevent.stop="categoryClick($event)"
          >{{ category.toUpperCase() }}</span
        >
      </BasePropDisplay>

      <BasePropDisplay v-if="item.tags" name="">
        <BasePropChip v-for="tag in item.tags" :key="tag">
          <template>{{ tag }}</template>
        </BasePropChip>
      </BasePropDisplay>
    </div>
  </v-card>
</template>

<script>
import { goToSearch } from "@/utils/search";
const arrford = require("arrford");
import { format, parseISO } from "date-fns";
import { getImageURL } from "@/services/Image";
import dayjs from "@/plugins/dayjs";
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
        return 250;
      } else {
        return 250;
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
    updatedText: {
      type: String,
      default: "Updated",
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
      goToSearch(this.$router, {
        query: e.target.innerText.toLowerCase(),
        type: "hub",
      });
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
    isItNew(itemDate) {
      const now = dayjs(new Date());
      const end = dayjs(itemDate); // another date
      const duration = dayjs.duration(now.diff(end));
      const days = duration.asDays();
      if (days <= this.$myApp.config.daysToShowNewResearch) {
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
      //console.log(thumborImgPath);
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

<style>
.category {
  font-size: 12px;
  color: #0e4471;
  cursor: pointer;
}
.category:hover {
  color: #000;
  text-decoration: underline;
}
</style>
