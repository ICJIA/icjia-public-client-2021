<template>
  <div>
    <v-card class="px-5 py-5 markdown-body" :color="color">
      <h2>{{ item.title }}</h2>
      <div>
        <span v-html="displayDate(item.start, item.end)"></span>
        <span style="font-weight: 400"
          >&nbsp;|&nbsp;{{ displayCategory(item.category) }}</span
        >
      </div>
      <div v-html="render(item.body)" class="px-3 mt-5"></div>

      <AttachmentList
        :items="item.attachments"
        v-if="item.attachments && item.attachments.length"
        class="mt-8 pl-3"
        :key="item.slug"
        title="Attachments"
      ></AttachmentList>
    </v-card>
  </div>
</template>

<script>
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import { renderToHtml } from "@/services/Markdown";
import moment from "moment";
import _ from "lodash";
export default {
  mounted() {
    attachInternalLinks(this);
    attachSearchEvents(this);
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
