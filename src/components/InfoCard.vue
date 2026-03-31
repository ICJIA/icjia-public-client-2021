<template>
  <div>
    <v-card
      outlined
      :to="item.fullPath"
      elevation="1"
      color="#fff"
      class="px-3 py-3 card"
    >
      <div style="font-size: 12px; margin-left: 15px">
        <v-chip
          v-if="isItNew(item)"
          label
          x-small
          color="#0A3A60"
          class="icjia-card mr-2"
          style="margin-top: -2px"
        >
          <span style="color: #fff !important; font-weight: 900"> NEW! </span>
        </v-chip>
        <span v-if="item.contentType" style="font-weight: 700"
          >{{ item.contentType }} &nbsp;|&nbsp;</span
        >{{ formatDate(item.publicationDate) }}
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
        class="mb-5"
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
      let targetDate;
      if (item.publicationDate) {
        targetDate = item.publicationDate;
      } else {
        targetDate = item.published_at;
      }

      const now = moment(new Date());
      const end = moment(targetDate); // another date
      const duration = moment.duration(now.diff(end));
      const days = duration.asDays();
      if (days <= this.$myApp.config.daysToShowNew) {
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
