<template>
  <div>
    <v-card
      elevation="0"
      class="mb-2 py-2 px-2"
      style="border-bottom: 1px solid #eee"
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
        <div>
          <v-card-title
            class="text-h5 author-name hover"
            @click="search(item.fullName)"
            >{{ item.fullName }}<span v-if="item.suffix">,&nbsp;</span
            >{{ item.suffix }}</v-card-title
          >

          <v-card-subtitle>
            <span>{{ item.title }}</span>
          </v-card-subtitle>
          <v-card-text class="text-left" v-html="item.body"></v-card-text>
        </div>
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
  },
};
</script>

<style lang="scss" scoped></style>
