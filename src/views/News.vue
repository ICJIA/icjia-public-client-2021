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
      result(ApolloQueryResult) {},
    },
  },
};
</script>
