<template>
  <div class="">
    <v-card class="px-5 py-5 markdown-body reduce-90" :color="color">
      <h2>{{ item.title }}</h2>
      <div>
        <span v-html="displayDate(item.start, item.end)"></span>
        <span style="font-weight: 400"
          >&nbsp;|&nbsp;{{ displayCategory(item.category) }}</span
        >
      </div>
      <div v-html="render(item.body)" class="px-3 mt-5"></div>

      <div class="mb-5">
        <BasePropDisplay v-if="item.tags" name="">
          <BasePropChip
            v-for="(tag, index) in item.tags"
            :key="index"
            class="mt-8"
          >
            <template>{{ tag }}</template>
          </BasePropChip>
        </BasePropDisplay>
        <AttachmentList
          :items="item.attachments"
          v-if="item.attachments && item.attachments.length"
          class="mt-8 pl-3"
          :key="item.slug"
        ></AttachmentList>
        <RelatedList
          :content="item"
          title="Related Web Content"
          class="mt-5"
          v-if="isRelated"
          background="grey lighten-4"
          indentation="mt-8 px-5 py-5"
        ></RelatedList>
      </div>
    </v-card>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import { renderToHtml } from "@/services/Markdown";
import moment from "moment";
import _ from "lodash";
import { isRelatedContent } from "@/utils/content";
export default {
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
    render(content) {
      return renderToHtml(content);
    },
    displayCategory(category) {
      let categoryMap = this.$myApp.config.maps.meetings;
      let obj = categoryMap.find((o) => o.category === category);
      if (_.isEmpty(obj)) {
        return "Special";
      } else {
        return obj.label;
      }
    },
    displayDate(s, e) {
      var start = moment(s); //todays date
      var end = moment(e); // another date
      var duration = moment.duration(end.diff(start));
      var days = duration.asDays();
      if (days > 1) {
        return `${start.format("MMM Do")} - ${end.format("MMM Do")}`;
      } else {
        return `<span class='meeting-date'><span>${start.format(
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
.meeting-date {
  font-size: 14px;
  font-weight: 400;
}
</style>
