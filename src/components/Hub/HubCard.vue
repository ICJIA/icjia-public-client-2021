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
        class="mb-3 ml-3"
        style="margin-top: 0px"
      >
        <span style="color: #000000 !important; font-weight: 700">NEW!</span>
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
        @error="errorHandler"
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
        :src="splashSrc"
        width="100%"
        :height="splashHeight"
        class="mb-5"
        :ref="'img_' + item.id"
        @error="errorHandler"
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
        @error="errorHandler"
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
import { splashCandidates } from "@/utils/hubImage";
const arrford = require("arrford");
import { format, parseISO } from "date-fns";
import dayjs from "@/plugins/dayjs";
export default {
  computed: {
    // Hub images are pre-generated under their original extension (.jpeg or
    // .png); offer the built URL first, then the alternate format, so PNG
    // splashes render like JPEGs. See utils/hubImage.js +
    // generators/generateImagesHub.js.
    splashUrls() {
      return splashCandidates(this.item && this.item.imagePath);
    },
    splashSrc() {
      return this.splashUrls[this.splashAttempt] || this.item.imagePath;
    },
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
      splashAttempt: 0,
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
    errorHandler() {
      // Hub images are written under their original extension; walk the
      // candidate list (original ext -> alternate) before surrendering to the
      // default placeholder. See utils/hubImage.js.
      if (this.splashAttempt < this.splashUrls.length - 1) {
        this.splashAttempt += 1;
        return;
      }
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
