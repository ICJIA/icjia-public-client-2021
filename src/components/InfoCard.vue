<template>
  <div>
    <v-card
      class="pa-2 grid-item mb-3 info-card py-3 px-3"
      outlined
      @click="$router.push(item.fullPath)"
      elevation="1"
      color="#fafafa"
    >
      <div style="font-size: 12px; margin-left: 15px">
        <v-chip
          v-if="isItNew(item)"
          label
          x-small
          color="#2296F3"
          class="icjia-card mr-2"
          style="margin-top: -2px"
        >
          <span style="color: #fff !important; font-weight: 900"> NEW! </span>
        </v-chip>
        <span v-if="item.contentType" style="font-weight: 700"
          >{{ item.contentType }} &nbsp;|&nbsp;</span
        >{{ formatDate(item.published_at) }}
      </div>
      <v-card-text v-if="item.title"
        ><h2 style="margin-top: -10px">
          {{ item.title }}
        </h2></v-card-text
      >

      <v-img
        v-if="item.splash && !textOnly"
        :src="getSplash(item)"
        :lazy-src="`https://agency.icjia-api.cloud${item.splash.formats.thumbnail.url}`"
        width="100%"
        :height="splashHeight"
        class="mb-5"
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
      <!-- <v-img
        aria-label="News post image"
        src="/icjia-half-splash-thumb.jpg"
        height="165px"
        class=""
        @load="resize"
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
      </v-img> -->

      <v-card-text v-if="item.summary" style="margin-top: -15px; color: #111">{{
        item.summary
      }}</v-card-text>
      <v-card-text>
        <div class="text-right">
          <v-btn
            small
            text
            :to="item.fullPath"
            :aria-label="`Read More about ${item.title} `"
          >
            {{ readMoreText }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { format, parseISO } from "date-fns";
import { getImageURL } from "@/services/Image";
import moment from "moment";
export default {
  props: {
    item: {
      type: Object,
      default: () => {},
    },
    textOnly: {
      type: Boolean,
      default: true,
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
      default: 250,
    },
  },
  mounted() {
    this.$emit("init");
  },

  methods: {
    getSplash(item) {
      if (this.view === "block") {
        return `https://agency.icjia-api.cloud${item.splash.formats.medium.url}`;
      } else {
        return `https://agency.icjia-api.cloud${item.splash.formats.large.url}`;
      }
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
    getImagePath(url, imgWidth = 0, imgHeight = 0, imageQuality = 50) {
      let imgPath;

      imgPath = `${this.$myApp.appConfig.clientURL}${url}`;

      const thumborImgPath = getImageURL(
        imgPath,
        imgWidth,
        imgHeight,
        imageQuality
      );
      // console.log(thumborImgPath)
      return thumborImgPath;
    },
    formatDate(d) {
      const temp = new Date(d).toJSON().split("T")[0];
      const myDate = `${temp}T23:59:59.000Z`;
      const formattedDate = format(parseISO(myDate), "MMMM dd, yyyy");
      return formattedDate;
    },
    resize() {
      console.log("image loaded");
      this.$emit("imageLoaded");
    },
  },
};
</script>

<style lang="scss" scoped></style>
