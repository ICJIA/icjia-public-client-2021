<template>
  <div>
    <div v-if="content">
      <div v-for="(bio, index) in content" :key="index">
        {{ bio.fullName }}{{ bio.sortModifier }}
      </div>
    </div>
    <div v-else>
      <Loader loaderType="skeleton" :repeat="1"></Loader>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import NProgress from "nprogress";
import { EventBus } from "@/event-bus";
import { renderToHtml } from "@/services/Markdown";
import { GET_ALL_BIOGRAPHIES_QUERY } from "@/graphql/biographies";
import _ from "lodash";
export default {
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
    search(name) {
      let opts = {
        query: name,
        type: "hub",
      };
      EventBus.$emit("search", opts);
    },
  },
  apollo: {
    biographies: {
      prefetch: true,
      //   fetchPolicy: "no-cache",
      query: GET_ALL_BIOGRAPHIES_QUERY,
      variables() {
        return {};
      },
      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        if (
          ApolloQueryResult.data &&
          ApolloQueryResult.data.biographies.length > 0 === false
        ) {
          this.$router.push("/404").catch((err) => {
            console.log(err);
            this.loading = false;
            NProgress.done();
          });
          console.log(ApolloQueryResult);
        } else {
          this.content = ApolloQueryResult.data.biographies;

          this.content = _.orderBy(this.content, ["sortModifier"], ["asc"]);
          this.loading = false;
          NProgress.done();
        }
      },
    },
  },
};
</script>
<style></style>
