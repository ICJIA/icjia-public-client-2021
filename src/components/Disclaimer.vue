<template>
  <div v-if="disclaimer && disclaimer.length" id="disclaimer">
    <div
      style="
        background: #31597a;
        border-top: 1px solid #ddd;
        border-bottom: 1px solid #ddd;
        color: #fff !important;
        z-index: 99999;
      "
      class="px-5 py-5"
    >
      <v-container>
        <v-row>
          <v-col class="markdown-body font-lato">
            <div style="font-size: 20px; font-weight: 900; color: #fff">
              {{ disclaimer[0].label }}
            </div>
            <div
              style="font-size: 14px; color: #fff"
              class="mt-2"
              v-html="render(disclaimer[0].body)"
            ></div>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
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
