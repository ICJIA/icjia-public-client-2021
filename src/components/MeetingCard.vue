<template>
  <div class="">
    <div
      v-if="item.isCancelled"
      class="text-center"
      style="background: #b71c1c; color: #fff; padding-left: -30px"
    >
      THIS MEETING IS CANCELLED
    </div>
    <v-card class="px-5 py-5 markdown-body reduce-90" :color="color">
      <!-- A heading is not a control (WCAG 2.1.1, 4.1.2): a click on the
           title opened the meeting, and a keyboard could not. In the meetings
           table the title is a link inside the heading; on the meeting's own
           page it is the page's heading and links nowhere. -->
      <component
        :is="titleTag"
        class="meeting-title"
        :class="{ 'meeting-title--link': linkTitle }"
        :style="item.isCancelled ? 'text-decoration: line-through' : null"
      >
        <router-link
          v-if="linkTitle"
          :to="`/news/meetings/${item.slug}`"
          class="card-title-link"
          >{{ item.title }}</router-link
        >
        <template v-else>{{ item.title }}</template>
      </component>

      <div v-if="!item.isCancelled">
        <span v-html="displayDate(item.start, item.end)"></span>
        <span style="font-weight: 400"
          >&nbsp;|&nbsp;{{ displayCategory(item.category) }}</span
        >
      </div>

      <div
        v-if="!item.isCancelled"
        v-html="render(item.body)"
        class="px-3 mt-5"
      ></div>
      <!-- TODO: Add option for cancellation message here. -->
      <div v-else class="px-3 mt-5">This meeting is cancelled.</div>
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
          :baseItemPublished="item.published_at"
        ></AttachmentList>
        <RelatedList
          :content="item"
          title="Related Web Content"
          class="mt-5"
          v-if="isRelated"
          background="grey lighten-4"
          indentation="mt-8 px-5 py-5"
        ></RelatedList>
        <ExternalLinkList
          :items="item.external"
          v-if="item.external && item.external.length"
          class="mt-4 pl-3"
          :key="item.title"
        ></ExternalLinkList>
      </div>
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
      var start = dayjs(s); //todays date
      var end = dayjs(e); // another date
      var duration = dayjs.duration(end.diff(start));
      var days = duration.asDays();
      if (days > 1) {
        return `${start.format("MMM Do")} - ${end.format("MMM Do")}`;
      } else {
        return `<span class='meeting-date'><span>${start.format(
          "dddd MMM DD, YYYY"
        )}</span>, ${start.format("hh:mm A")} - ${end.format(
          "hh:mm A"
        )}</span>`;
      }
    },
  },
  props: {
    color: { type: String, default: "white" },
    // The meeting's own page: its title is the page's heading, not a link.
    titleTag: { type: String, default: "h2" },
    linkTitle: { type: Boolean, default: true },
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
.meeting-title--link:hover {
  cursor: pointer;
  text-decoration: underline;
}
/* On the meeting's page the title is an h1 with the look of the h2 it was
   (github-markdown.css). */
.markdown-body h1.meeting-title {
  font-size: 1.6em;
  font-weight: 700;
  line-height: 1.25;
  margin-bottom: 16px;
  padding-bottom: 0.3em;
  border-bottom-color: #eaecef;
  color: #000;
}
</style>
