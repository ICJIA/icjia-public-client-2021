<template>
  <div>
    <v-card
      elevation="2"
      class="mb-2 py-8 px-2"
      style="border-bottom: 1px solid #eee"
      v-if="item"
      :color="color"
    >
      <div class="d-flex flex-no-wrap">
        <v-avatar
          class="ma-3 hidden-sm-and-down"
          size="125"
          tile
          v-if="item.headshot && item.headshot.url"
        >
          <v-img
            :src="`https://agency.icjia-api.cloud${item.headshot.formats.thumbnail.url}`"
            :lazy-src="`https://agency.icjia-api.cloud${item.headshot.formats.thumbnail.url}`"
          ></v-img>
        </v-avatar>
        <span>
          <span
            class="text-h5 author-name hover ml-3"
            @click="search(item.fullName)"
            >{{ item.fullName }}<span v-if="item.suffix">,&nbsp;</span
            >{{ item.suffix }}
          </span>
          <span v-if="showLink">
            <span>&nbsp;|&nbsp;</span>
            <v-btn
              style="margin-bottom: 4px !important; margin-left: -3px"
              :to="`/about/biographies/${item.slug}`"
              text
              x-small
              ><v-icon>link</v-icon></v-btn
            >
          </span>

          <v-card-subtitle style="margin-top: -10px">
            <span
              style="font-weight: 700"
              v-if="item && item.unit && item.unit.title"
              >{{ item.unit.title }}&nbsp;|&nbsp;</span
            >
            <span style="font-weight: 700; color: #444" v-if="item.title">{{
              item.title
            }}</span>
          </v-card-subtitle>
          <v-card-text class="text-left" v-html="item.body"></v-card-text>
        </span>
      </div>
    </v-card>
  </div>
</template>

<script>
import { EventBus } from "@/event-bus";
export default {
  methods: {
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
    showLink: {
      type: Boolean,
      default: true,
    },
    color: {
      type: String,
      default: "white",
    },
  },
};
</script>

<style lang="scss" scoped></style>
