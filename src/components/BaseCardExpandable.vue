<template>
  <div>
    <v-card
      elevation="0"
      class="pt-8 px-3"
      @click="item.contentType === 'grant' ? routeTo(item.fullPath) : null"
    >
      <div
        class="d-flex mb-8"
        style="text-transform: uppercase; font-weight: 900; margin-top: -10px"
      >
        <span
          style="font-size: 14px; color: #666"
          v-if="item.category === 'nofo'"
          >NOTICE OF FUNDING OPPORTUNITY
        </span>
        <span style="font-size: 14px; color: #666" v-else>{{
          item.category
        }}</span>

        <v-spacer></v-spacer>

        <div v-if="item.status && item.status.length && item.status">
          <span
            style="
              font-size: 10px;
              font-weight: 700;
              padding: 2px 3px;
              border: 1px solid #ccc;
            "
          >
            {{ item.status }}
          </span>
        </div>

        <div v-else>
          <span
            style="
              font-size: 10px;
              font-weight: 700;
              padding: 2px 3px;
              border: 1px solid #ccc;
              background: green;
              color: #fff;
            "
            v-if="new Date(item.end) > new Date()"
          >
            Current
          </span>
          <span
            style="
              font-size: 10px;
              font-weight: 700;
              background: red;
              color: #fff;
              padding: 2px 3px;
              border: 1px solid #ccc;
            "
            v-if="new Date(item.end) < new Date()"
          >
            Expired
          </span>
        </div>
      </div>
      <h2
        style="margin-top: -5px"
        @click="
          openSearch === true ? search(item.title) : routeTo(item.fullPath)
        "
        class="hover program-title"
      >
        {{ item.title }}
      </h2>
      <div
        v-if="item.start && item.end"
        class="mb-3"
        style="margin-top: -10px; font-size: 12px; font-weight: 900"
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
      <v-card-actions v-if="item.attachments && item.attachments.length">
        <v-btn small color="grey lighten-4" @click="show = !show">
          Attachments
          <v-icon right>{{
            show ? "mdi-chevron-up" : "mdi-chevron-down"
          }}</v-icon>
        </v-btn>
      </v-card-actions>

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
import { renderToHtml } from "@/services/Markdown";
import { EventBus } from "@/event-bus";
export default {
  data() {
    return {
      show: false,
    };
  },
  methods: {
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
  },
};
</script>

<style>
.program-title {
  text-decoration: none;
}
.program-title:hover {
  text-decoration: underline;
}
</style>
