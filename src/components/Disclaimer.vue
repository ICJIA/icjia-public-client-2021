<template>
  <div v-if="disclaimer && disclaimer.length">
    <div
      style="
        background: #eee;
        border-top: 1px solid #ddd;
        border-bottom: 1px solid #ddd;
      "
      class="px-5 py-5"
    >
      <v-container>
        <v-row>
          <v-col class="markdown-body font-lato">
            <div style="font-size: 20px; font-weight: 900">
              {{ disclaimer[0].label }}
            </div>
            <div
              style="font-size: 14px"
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

<style lang="scss" scoped></style>
