<template>
  <div class="">
    <v-card class="px-5 py-5 markdown-body reduce-90" :color="color">
      <h2
        @click="routeTo(item)"
        class="policy-title"
        style="border: none; font-size: 26px"
      >
        {{ item.title }}
      </h2>

      <!-- <div>
        <span>{{ displayStatus(item.published_at, item.updated_at) }}</span>
      </div> -->

      <div v-html="render(item.body)" class="px-3 mt-5"></div>

      <div class="mb-0" style="margin-top: -10px">
        <AttachmentList
          :items="item.attachments"
          v-if="item.attachments && item.attachments.length"
          class="mt-8 pl-3"
          :key="item.slug"
          :baseItemPublished="item.published_at"
          label="Download"
        ></AttachmentList>
        <div class="pl-3 mt-6">
          <BasePropDisplay v-if="item.tags" name="">
            <BasePropChip
              v-for="(tag, index) in item.tags"
              :key="index"
              class="mt-1 mb-5"
            >
              <template>{{ tag }}</template>
            </BasePropChip>
          </BasePropDisplay>
        </div>
      </div>
      <!-- <div class="mt-10 text-right" style="font-size: 10px; font-weight: 700">
        {{
          daysBetween({
            publishedAt: item.published_at,
            updatedAt: item.updated_at,
          }) >= 1
            ? `Last Updated: ${formatDate(item.updated_at)}`
            : `Published: ${formatDate(item.published_at)}`
        }}
      </div> -->
    </v-card>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import { renderToHtml } from "@/services/Markdown";
import dayjs from "@/plugins/dayjs";
import _ from "lodash";
import { isRelatedContent } from "@/utils/content";
export default {
  // write function to create human readable date in javascript

  mounted() {
    attachInternalLinks(this);
    attachSearchEvents(this);
    this.isRelated = isRelatedContent(this.item);
  },
  data() {
    return {
      isRelated: false,
    };
  },
  methods: {
    formatDate(date) {
      return dayjs(date).format("MMM D, YYYY");
    },
    daysBetween({ publishedAt, updatedAt }) {
      const start = dayjs(publishedAt);
      const end = dayjs(updatedAt);
      const duration = end.diff(start, "days");
      return `${duration}`;
    },
    routeTo(item) {
      this.$router.push(`/grants/policies/${item.slug}`).catch((err) => {
        this.$vuetify.goTo(0);
      });
    },
    render(content) {
      return renderToHtml(content);
    },
    displayStatus(published, updated) {
      return `${dayjs(published).format("MMM Do YYYY")}`;
    },
    displayCategory(category) {
      let categoryMap = this.$myApp.config.maps.policies;
      let obj = categoryMap.find((o) => o.category === category);
      if (_.isEmpty(obj)) {
        return "Special";
      } else {
        return obj.label;
      }
    },
    displayDate(s, e) {
      var start = dayjs(s); //todays date
      var end = dayjs(e); // another date
      var duration = dayjs.duration(end.diff(start));
      var days = duration.asDays();
      if (days > 1) {
        return `${start.format("MMM Do")} - ${end.format("MMM Do")}`;
      } else {
        return `<span class='policy-date'><span>${start.format(
          "dddd MMM DD, yyyy"
        )}</span>, ${start.format("hh:mm A")} - ${end.format(
          "hh:mm A"
        )}</span>`;
      }
    },
  },
  props: {
    color: { type: String, default: "white" },
    item: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>

<style>
.policy-date,
.meeting-date {
  font-size: 14px;
  font-weight: 400;
}
.policy-title:hover,
.meeting-title:hover {
  cursor: pointer;
  text-decoration: underline;
}
</style>
