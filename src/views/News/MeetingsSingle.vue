<template>
  <div class="markdown-body">
    <BaseContent :error="error" :loading="$apollo.loading">
      <template slot="content">
        <v-container>
          <v-row>
            <v-col>
              <MeetingCard
                :item="meeting"
                class="mx-2 my-4"
                v-if="meeting"
              ></MeetingCard>
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

          this.meeting = ApolloQueryResult.data.meetings[0];
          NProgress.done();
        }
      },
    },
  },
};
</script>
