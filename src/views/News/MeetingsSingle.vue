<template>
  <div class="markdown-body">
    <BaseContent :error="error" :loading="$apollo.loading">
      <template slot="content">
        <v-container v-if="meeting">
          <v-row>
            <v-col>
              <h1>ICJIA Meetings</h1>
              <MeetingCard
                :item="meeting"
                class="mx-2 my-4"
                :key="meeting.title"
              ></MeetingCard>
              <div class="mt-5 text-right">
                <v-btn small text to="/news/meetings/"
                  >View all meetings&nbsp;&raquo;</v-btn
                >
              </div>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </BaseContent>
  </div>
</template>

<script>
import NProgress from "nprogress";
import { renderToHtml } from "@/services/Markdown";
import { GET_SINGLE_MEETING_QUERY } from "@/graphql/meetings";
import { EventBus } from "@/event-bus";
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
// eslint-disable-next-line no-unused-vars
import { getUnifiedTags } from "@/utils/content";
export default {
  data() {
    return {
      error: null,
      meeting: null,
    };
  },
  computed: {},
  created() {
    NProgress.start();
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
  },
  apollo: {
    meetings: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_SINGLE_MEETING_QUERY,
      variables() {
        return {
          slug: this.$route.params.slug,
        };
      },
      error(error) {
        this.error = JSON.stringify(error.message);

        NProgress.done();
      },
      result(ApolloQueryResult) {
        if (
          ApolloQueryResult.data &&
          ApolloQueryResult.data.meetings.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
          });
        } else {
          //console.log(this.id);

          let meetings = ApolloQueryResult.data.meetings;
          console.log("meetings fetch here");
          meetings = getUnifiedTags(meetings);
          this.meeting = meetings[0];
          NProgress.done();
          EventBus.$emit("context-label", this.meeting.title);
          attachInternalLinks(this);
          attachSearchEvents(this);
        }
      },
    },
  },
};
</script>
