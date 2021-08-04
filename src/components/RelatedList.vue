<template>
  <v-sheet :color="background" :class="indentation" v-if="relatedList">
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
    <ul v-for="(item, index) in relatedList" :key="index" class="mt-3">
      <li class="related-link">
        <router-link :to="`${item.fullPath}`">{{
          item.displayTitle
        }}</router-link>
      </li>
    </ul>
  </v-sheet>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import _ from "lodash";
export default {
  data() {
    return {
      relatedList: null,
    };
  },
  mounted() {
    // eslint-disable-next-line no-unused-vars
    let events = [];
    let posts = [];
    let meetings = [];
    let grants = [];
    let programs = [];

    if (this.content.events && this.content.events.length) {
      let relatedType = "Event";
      events = this.content.events.map((e) => ({
        ...e,
        relatedType,
        fullPath: `/events/${e.slug}`,
        displayTitle: `[${relatedType}]: ${e.title}`,
      }));
      //console.log(events);
    }
    if (this.content.posts && this.content.posts.length) {
      let relatedType = "News";
      posts = this.content.posts.map((e) => ({
        ...e,
        relatedType,
        fullPath: `/news/${e.slug}/`,
        displayTitle: `[${relatedType}]: ${e.title}`,
      }));
      //console.log("posts: ", posts);
    }
    if (this.content.meetings && this.content.meetings.length) {
      let relatedType = "Meeting";
      meetings = this.content.meetings.map((e) => ({
        ...e,
        relatedType,
        fullPath: `/news/meetings/${e.slug}/`,
        displayTitle: `[${relatedType}]: ${e.title}`,
      }));
      //console.log("meetings: ", meetings);
    }

    if (this.content.grants && this.content.grants.length) {
      let relatedType = "Funding";
      grants = this.content.grants.map((e) => ({
        ...e,
        relatedType,
        fullPath: `/grants/funding/${e.slug}/`,
        displayTitle: `[${relatedType}]: ${e.title}`,
      }));
      //console.log("meetings: ", grants);
    }

    if (this.content.programs && this.content.programs.length) {
      let relatedType = "Program";
      programs = this.content.programs.map((e) => ({
        ...e,
        relatedType,
        fullPath: `/grants/programs/${e.slug}/`,
        displayTitle: `[${relatedType}]: ${e.title}`,
      }));
      //console.log("meetings: ", grants);
    }

    let relatedList = [
      ...events,
      ...meetings,
      ...posts,
      ...grants,
      ...programs,
    ];
    console.log(relatedList);
    this.relatedList = _.orderBy(relatedList, "displayTitle", "asc");
  },
  props: {
    title: {
      type: String,
      default: "",
    },
    background: {
      type: String,
      default: "grey lighten-4",
    },
    indentation: {
      type: String,
      default: "px-2 py-4",
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
