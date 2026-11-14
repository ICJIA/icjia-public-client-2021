<template>
  <div class="mt-12">
    <BaseContent :error="error" :loading="loading">
      <template slot="content" v-if="!loading">
        <v-container style="margin-top: -15px">
          <v-row
            ><v-col cols="12">
              <!-- The page's own title is its h1 (WCAG 1.3.1, 2.4.6), as on
                   ICJIA Meetings; the table gets no heading of its own. -->
              <div class="markdown-body mb-6 page-heading">
                <h1>IRB Meetings</h1>
              </div>
              <MeetingTable
                :items="content"
                v-if="content"
              ></MeetingTable> </v-col
          ></v-row>
        </v-container>
      </template>
    </BaseContent>
  </div>
</template>

<script>
import NProgress from "@/services/Progress";
import { renderToHtml } from "@/services/Markdown";
import { GET_MEETINGS_BY_CATEGORY_QUERY } from "@/graphql/meetings";
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import { EventBus } from "@/event-bus.js";
export default {
  metaInfo: {
    title: "IRB Meetings",
  },
  data() {
    return {
      loading: true,
      error: null,
      content: null,
    };
  },
  created() {
    NProgress.start();
  },

  methods: {
    render(content) {
      return renderToHtml(content);
    },
  },
  mounted() {},
  apollo: {
    meetings: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_MEETINGS_BY_CATEGORY_QUERY,
      variables() {
        return {
          category: "irb",
        };
      },
      error(error) {
        this.error = JSON.stringify(error.message);
        this.loading = false;
        NProgress.done();
      },
      result(ApolloQueryResult) {
        //console.log(this.id);
        this.content = ApolloQueryResult.data.meetings;
        this.loading = false;
        EventBus.$emit("context-label", "Meetings");
        NProgress.done();
        attachInternalLinks(this);
        attachSearchEvents(this);
      },
    },
  },
};
</script>
