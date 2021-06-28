<template>
  <div>
    <BaseContent :error="error" :loading="loading">
      <template slot="content" v-if="!loading">
        <v-sheet color="white">
          <v-container class="markdown-body">
            <v-row>
              <v-col cols="12" md="9" class="markdown-body">
                <h1 v-html="render(funding.title)"></h1>
                <div v-html="render(funding.body)"></div>
              </v-col>
              <v-col cols="12" md="3" class="px-3 hidden-sm-and-down"
                ><Toc :key="funding.title" :scrollOffset="55"></Toc
              ></v-col>
            </v-row>
          </v-container>
        </v-sheet>
      </template>
    </BaseContent>
  </div>
</template>

<script>
import NProgress from "nprogress";
import { renderToHtml } from "@/services/Markdown";
import { GET_SINGLE_FUNDING_QUERY } from "@/graphql/funding";
export default {
  data() {
    return {
      loading: true,
      error: null,
      funding: null,
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
  apollo: {
    grants: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_SINGLE_FUNDING_QUERY,
      variables() {
        return {
          slug: this.$route.params.slug,
        };
      },
      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        if (
          ApolloQueryResult.data &&
          ApolloQueryResult.data.grants.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
          });
        } else {
          //console.log(this.id);
          this.funding = ApolloQueryResult.data.grants[0];
          this.loading = false;
          NProgress.done();
        }
      },
    },
  },
};
</script>
