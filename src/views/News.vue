<template>
  <div>
    <!-- {{ posts }}
    <div>
      {{ $apollo.error }}
    </div> -->
    <BaseContent :error="error" :loading="$apollo.loading">
      <template slot="content">
        {{ news }}
      </template>
    </BaseContent>
  </div>
</template>

<script>
import { GET_ALL_NEWS_QUERY } from "@/graphql/news";
// import moment from "moment";
// import _ from "lodash";

export default {
  name: "News",
  data() {
    return {
      filteredPosts: null,
      error: null,
      news: null,
    };
  },
  methods: {
    // eslint-disable-next-line no-unused-vars
    mergePostsAndMeetings(posts, meetings) {
      let news = posts.concat(meetings);
      news.sort((b, a) => {
        return a.published_at.localeCompare(b.published_at);
      });
      this.news = news.slice(0, this.totalNewsItems);
    },
  },
  apollo: {
    posts: {
      prefetch: true,
      query: GET_ALL_NEWS_QUERY,
      variables() {
        return {};
      },

      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        const posts = ApolloQueryResult.data.posts;
        const meetings = ApolloQueryResult.data.meetings;
        this.mergePostsAndMeetings(posts, meetings);
      },
    },
  },
};
</script>
