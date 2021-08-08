<template>
  <div>
    <v-card
      :elevation="elevation"
      class="pt-8 px-3"
      @click="isClickable ? routeTo(item.fullPath) : null"
      color="#fff"
      style="border: 1px solid #ddd"
      :class="{ card: isClickable }"
      :ripple="isClickable ? true : false"
    >
      <div
        class="d-flex mb-8"
        style="text-transform: uppercase; font-weight: 900; margin-top: -10px"
      >
        <!-- <span style="font-size: 14px; color: #666"
          >{{ item.category }} EMPLOYMENT</span
        > -->
        <span class="mb-8" style="font-size: 14px"
          >{{ getCategory(item.category).toUpperCase() }} EMPLOYMENT</span
        >

        <span
          v-if="
            item.start &&
            item.end &&
            new Date(addOneDayToDate(item.end)) >= new Date()
          "
          style="font-size: 14px; font-weight: 900; color: #666"
          class="mb-8"
          >&nbsp;|&nbsp;
          <span>Accepting applications through {{ item.end | format }}</span>
        </span>

        <v-spacer></v-spacer>

        <div>
          <!-- <v-chip
            small
            style="
              font-size: 12px;
              font-weight: 700;

              background: green;
              color: #fff;
            "
            v-if="new Date(addOneDayToDate(item.end)) >= new Date()"
            >&nbsp;Deadline: {{ item.end | dateFormatAlt }}&nbsp;</v-chip
          > -->
          <v-chip
            small
            style="
              font-size: 12px;
              font-weight: 700;
              background: red;
              color: #fff;
            "
            v-if="new Date(addOneDayToDate(item.end)) < new Date()"
          >
            &nbsp;Expired: {{ item.end | dateFormatAlt }} &nbsp;
          </v-chip>
        </div>
      </div>
      <div style="margin-top: -30px">
        <span
          @click.stop.prevent="
            openSearch === true ? search(item.title) : routeTo(item.fullPath)
          "
          class="hover program-title"
          style="
            line-height: 1.3em;

            font-weight: 900;
            font-size: 22px;
          "
        >
          {{ item.title }}</span
        >

        <span v-if="showLink">
          |
          <v-icon class="link" @click.stop.prevent="$router.push(item.fullPath)"
            >link</v-icon
          ></span
        >
      </div>
      <span
        class="mb-8"
        style="
           color: #666;
font-size: 14px
            font-weight: 400;
          "
      >
        Posted {{ item.start | format }}</span
      >

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
      <div class="ml-2" v-if="!summaryOnly">
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
          class="mt-8 pl-3"
          :key="item.slug"
        ></AttachmentList>
        <ExternalLinkList
          :items="item.external"
          v-if="item.external && item.external.length"
          class="mt-8 pl-3"
          :key="item.url"
        ></ExternalLinkList>
        <RelatedList
          :content="item"
          title="Related ICJIA Content"
          class="mt-12"
          v-if="isRelated"
          background="grey lighten-4"
          indentation="px-3 py-3"
        ></RelatedList>
      </div>
      <!-- <v-card-actions class="mt-3">
        <v-btn
          small
          outlined
          @click.stop.prevent="show = !show"
          v-if="item.attachments && item.attachments.length"
        >
          Attachments
          <v-icon right>{{
            show ? "mdi-chevron-up" : "mdi-chevron-down"
          }}</v-icon>
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn small :to="item.fullPath" v-if="showReadMore"
          >Read More&nbsp;&raquo;</v-btn
        >
      </v-card-actions> -->

      <v-expand-transition>
        <div v-show="show" class="pl-3 pr-3">
          <v-card-text>
            <ul>
              <li v-for="(doc, index) in item.attachments" :key="index">
                <a
                  :href="`https://agency.icjia-api.cloud${doc.url}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  >{{ doc.name }}</a
                >
              </li>
            </ul>
          </v-card-text>
        </div>
      </v-expand-transition>
      <div class="pb-6"></div>
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
import { EventBus } from "@/event-bus";
import { isRelatedContent, getProperCategory } from "@/utils/content";
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
      isRelated: false,
    };
  },
  methods: {
    getCategory(category) {
      return getProperCategory(this.$myApp.config.maps.employment, category);
    },
    routeTo(fullPath) {
      if (!fullPath) return;
      this.$router.push(fullPath);
    },
    render(content) {
      return renderToHtml(content);
    },
    search(name) {
      let opts = {
        query: name,
        type: "general",
      };
      EventBus.$emit("search", opts);
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
    showStatus: {
      type: Boolean,
      default: true,
    },
    elevation: {
      type: Number,
      default: 0,
    },
    isClickable: {
      type: Boolean,
      default: true,
    },
  },
};
</script>

<style>
.red {
  background: red;
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
.program-title:hover,
.link:hover {
  text-decoration: underline;
}
</style>
