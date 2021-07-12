<template>
  <div>
    <v-card elevation="0" class="py-8 px-3">
      <div
        class="d-flex"
        style="text-transform: uppercase; font-weight: 900; margin-top: -10px"
      >
        <span style="font-size: 14px; color: #666"> {{ item.category }} </span>

        <v-spacer></v-spacer>
        <div
          v-if="item.status"
          style="
            font-size: 12px;
            font-weight: 300;
            padding: 2px 3px;
            border: 1px solid #ccc;
          "
        >
          {{ item.status }}
        </div>
      </div>
      <h2 style="margin-top: 10px">{{ item.title }}</h2>
      <div v-if="item.body" v-html="render(item.body)" class="pl-3 pt-3"></div>
      <v-card-actions v-if="item.attachments && item.attachments.length">
        <v-btn small color="blue darken-2" dark @click="show = !show">
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
                {{ doc.name }}
              </li>
            </ul>
          </v-card-text>
        </div>
      </v-expand-transition>
    </v-card>
  </div>
</template>

<script>
import { renderToHtml } from "@/services/Markdown";
export default {
  data() {
    return {
      show: false,
    };
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
  },
  props: {
    item: {
      type: Object,
      default: () => {},
    },
  },
};
</script>

\
