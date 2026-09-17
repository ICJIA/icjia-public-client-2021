<template>
  <div>
    <v-card
      :elevation="elevation"
      class="pt-8 px-3 pb-6 card"
      color="#fff"
      style="border: 1px solid #ddd"
    >
      <div
        class="d-flex mb-8"
        style="text-transform: uppercase; font-weight: 900; margin-top: -10px"
      >
        <span
          style="font-size: 14px; color: #222"
          v-if="item.category === 'nofo'"
          >NOTICE OF FUNDING OPPORTUNITY
        </span>
        <span style="font-size: 14px; color: #222" v-else
          >{{ item.category }} PROGRAM</span
        >

        <v-spacer></v-spacer>

        <div v-if="item.status && item.status.length">
          <v-chip
            v-if="item.contentType === 'program' && item.status != 'current'"
            :class="{
              green: item.status === 'current',
            }"
            :style="{
              fontSize: '12px',
              fontWeight: '700',
              backgroundColor: item.status === 'archived' ? '#000' : undefined,
              color: item.status === 'archived' ? '#fff' : undefined,
            }"
          >
            <span>{{ item.status }}</span>
          </v-chip>
        </div>

        <div v-else>
          <v-chip
            small
            color="green darken-4"
            text-color="white"
            style="font-size: 12px; font-weight: 700"
            v-if="new Date(addOneDayToDate(item.end)) >= new Date()"
            >&nbsp;Deadline: {{ item.end | dateFormatAlt }}&nbsp;</v-chip
          >
          <v-chip
            small
            style="font-size: 12px; font-weight: 700"
            color="red darken-4"
            text-color="white"
            v-if="new Date(addOneDayToDate(item.end)) < new Date()"
          >
            &nbsp;Expired: {{ item.end | dateFormatAlt }} &nbsp;
          </v-chip>
        </div>
      </div>
      <!-- The title is a plain heading (WCAG 4.1.2); it used to be a focusable
           heading that ran a search or opened the item. Where it opened the
           item, the title is now a link inside the heading; where it ran a
           search, the search is the separate link below it. -->
      <div style="margin-top: 35px">
        <h2
          class="program-title"
          :class="{ hover: openSearch !== true }"
          style="
            line-height: 1.3em;
            margin: 0;
            font-weight: 900;
            font-size: 22px;
          "
        >
          <router-link
            v-if="openSearch !== true"
            :to="item.fullPath"
            class="card-title-link"
            >{{ item.title }}</router-link
          >
          <template v-else>{{ item.title }}</template>
        </h2>
        <span v-if="showLink">
          |
          <v-icon class="link" @click.stop.prevent="$router.push(item.fullPath)"
            >link</v-icon
          ></span
        >
        <div v-if="openSearch === true" class="title-search">
          <router-link :to="searchLink(item.title)"
            >Search ICJIA for {{ item.title }}</router-link
          >
        </div>
      </div>
      <div
        v-if="item.start && item.end"
        class="mb-3 mt-3"
        style="font-size: 12px; font-weight: 900"
      >
        <span>{{ item.start | format }} to {{ item.end | format }}</span>
      </div>
      <div
        v-if="item.summary && summaryOnly"
        v-html="render(item.summary)"
        class="pl-3 pt-3"
      ></div>
      <div
        v-if="item.body && !summaryOnly"
        v-html="render(item.body)"
        class="pl-3 pt-3"
      ></div>
      <div class="ml-2">
        <BasePropDisplay v-if="item.tags" name="">
          <BasePropChip
            v-for="(tag, index) in item.tags"
            :key="index"
            class="mt-0 mb-5"
          >
            <template>{{ tag }}</template>
          </BasePropChip>
        </BasePropDisplay>
        <AttachmentList
          :items="item.attachments"
          v-if="item.attachments && item.attachments.length"
          class="mt-1 pl-0"
          :key="item.slug"
          :baseItemPublished="item.published_at"
        ></AttachmentList>
      </div>
      <v-card-actions v-if="showReadMore" class="mt-3">
        <v-btn
          dark
          color="blue darken-4"
          @click.stop.prevent="$router.push(item.fullPath)"
          small
          v-html="readMoreText"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
const addOneDayToDate = function (date) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + 1);
  return newDate;
};
import { renderToHtml } from "@/services/Markdown";
import { searchLocation } from "@/utils/search";
import { isRelatedContent } from "@/utils/content";
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
export default {
  mounted() {
    attachInternalLinks(this);

    attachSearchEvents(this);
    this.isRelated = isRelatedContent(this.item);
  },
  data() {
    return {
      show: false,
      addOneDayToDate,
    };
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
    searchLink(name) {
      return searchLocation({ query: name, type: "general" });
    },
  },
  props: {
    item: {
      type: Object,
      default: () => {},
    },
    summaryOnly: {
      type: Boolean,
      default: false,
    },
    openSearch: {
      type: Boolean,
      default: true,
    },
    showLink: {
      type: Boolean,
      default: true,
    },
    showReadMore: {
      type: Boolean,
      default: false,
    },
    readMoreText: {
      type: String,
      default: "Read More&nbsp;&raquo;",
    },
    showStatus: {
      type: Boolean,
      default: true,
    },
    elevation: {
      type: Number,
      default: 0,
    },
  },
};
</script>

<style>
.red {
  background: #ad2e2e;
}

.green {
  background: green;
}

.red,
.green {
  color: white !important;
}
.program-title,
.link {
  text-decoration: none;
}
.program-title.hover:hover,
.link:hover {
  text-decoration: underline;
}
</style>
