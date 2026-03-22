<template>
  <v-card
    elevation="2"
    style="
      background: #31597a;
      border-top: 1px solid #aaa;

      color: #fff !important;
      z-index: 99999;
    "
    class="px-5 py-5 my-0"
    v-if="disclaimer && disclaimer.length"
    id="disclaimer"
  >
    <v-container>
      <v-row>
        <v-col class="markdown-body font-lato">
          <h2 style="font-size: 20px; font-weight: 900; color: #fff; margin: 0;">
            {{ disclaimer[0].label }}
          </h2>
          <div
            style="font-size: 13px; color: #fff"
            class="mt-2"
            v-html="render(disclaimer[0].body)"
          ></div>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script>
import { renderToHtml } from "@/services/Markdown";
export default {
  methods: {
    render(content) {
      return renderToHtml(content);
    },
  },
  props: {
    disclaimer: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style scoped>
* >>> a {
  color: #fff !important;
  font-weight: bold;
  text-decoration: underline;
}
* >>> a:hover {
  color: #bbb !important;
  text-decoration: none;
}
</style>
