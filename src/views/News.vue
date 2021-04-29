<template>
  <div>
    <!-- {{ posts }}
    <div>
      {{ $apollo.error }}
    </div> -->
    <BaseContent :error="error" :loading="$apollo.loading">
      <template slot="content">
        {{ posts }}
      </template>
    </BaseContent>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import { GET_ALL_POSTS_QUERY } from "@/graphql/posts";
import moment from "moment";
import _ from "lodash";

export default {
  name: "News",
  data() {
    return {
      filteredPosts: null,
      error: null,
    };
  },
  apollo: {
    posts: {
      prefetch: true,
      query: GET_ALL_POSTS_QUERY,
      variables() {
        return {};
      },
      // context: {
      //   uri: "http://127.0.0.1:8000/graphql/countries",
      // },
      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        // this.filteredPosts = ApolloQueryResult.data.posts;
        // this.posts = ApolloQueryResult.data.posts.map((p) => {
        //   return {
        //     ...p,
        //     search: `${p.title.toLowerCase()} ${p.summary.toLowerCase()} ${p.units[0][
        //       "title"
        //     ].toLowerCase()} ${p.units[0]["shortname"].toLowerCase()} ${moment(
        //       p.published_at
        //     )
        //       .format("MMMM DD, YYYY")
        //       .toLowerCase()}`,
        //   };
        // });
        // this.filteredPosts = this.posts;
      },
    },
  },
};
</script>
