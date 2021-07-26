<template>
  <div>
    <v-card class="px-5 py-5 markdown-body">
      <h2>{{ item.title }}</h2>
      <div v-html="displayDate(item.start, item.end)"></div>
      <div v-html="render(item.body)" class="px-3 mt-5"></div>
      <AttachmentList
        :items="item.attachments"
        v-if="item.attachments && item.attachments.length"
        class="mt-8"
        :key="item.slug"
      ></AttachmentList>
    </v-card>
  </div>
</template>

<script>
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import { renderToHtml } from "@/services/Markdown";
import moment from "moment";
export default {
  mounted() {
    attachInternalLinks(this);
    attachSearchEvents(this);
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
    displayDate(s, e) {
      var start = moment(s); //todays date
      var end = moment(e); // another date
      var duration = moment.duration(end.diff(start));
      var days = duration.asDays();
      if (days > 1) {
        return `${start.format("MMM Do")} - ${end.format("MMM Do")}`;
      } else {
        return `<div class='meeting-date'><span>${start.format(
          "dddd MMM DD, yyyy"
        )}</span>, ${start.format("hh:mm A")} - ${end.format("hh:mm A")}</div>`;
      }
    },
  },
  props: {
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
  font-weight: 700;
}
</style>
