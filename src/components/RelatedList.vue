<template>
  <v-sheet v-if="relatedList" color="grey lighten-5" class="px-8 py-8">
    <div
      style="
        font-weight: 700;
        border-bottom: 1px solid #ccc;
        padding-bottom: 8px;
        text-transform: uppercase;
      "
      v-if="title && title.length"
    >
      {{ title }}
    </div>
    <ul v-for="(item, index) in relatedList" :key="index" class="mt-6">
      <li class="related-link">
        <router-link :to="`${item.fullPath}`">{{
          item.displayTitle
        }}</router-link>
      </li>
    </ul>
  </v-sheet>
</template>

<script>
import _ from "lodash";
export default {
  data() {
    return {
      relatedList: null,
    };
  },
  mounted() {
    // eslint-disable-next-line no-unused-vars
    let events, posts, meetings;
    if (this.content.events) {
      let relatedType = "Event";
      events = this.content.events.map((e) => ({
        ...e,
        relatedType,
        fullPath: `/events/${e.slug}`,
        displayTitle: `[${relatedType}]: ${e.title}`,
      }));
    }

    if (this.content.posts) {
      console.log("has posts");
    }

    if (this.content.meetings) {
      let relatedType = "Meeting";
      meetings = this.content.meetings.map((e) => ({
        ...e,
        relatedType,
        fullPath: `/news/meetings/${e.slug}`,
        displayTitle: `[${relatedType}]: ${e.title}`,
      }));
    }
    // console.log(events);
    this.relatedList = [...events, ...meetings];
    this.relatedList = _.orderBy(this.relatedList, "displayTitle", "asc");
  },
  props: {
    title: {
      type: String,
      default: "",
    },
    content: {
      type: Object,
      default: () => {},
    },
  },
};
</script>

<style lang="scss" scoped>
.related-link {
  font-size: 14px;
}
</style>
