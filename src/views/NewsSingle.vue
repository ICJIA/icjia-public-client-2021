<template>
  <div>
    <BaseContent :error="error" :loading="loading">
      <template slot="content" v-if="!loading">
        <v-container>
          <v-card class="px-5 py-5 mx-5 my-5" elevation="0">
            {{ news }}
            <NewsSplash
              v-if="news && news.splash"
              :splash="news.splash"
              caption="This is a sample caption"
            ></NewsSplash>
            <v-row>
              <v-col cols="12" :md="news.showTOC ? 9 : 12">
                <h1 v-html="render(news.title)"></h1>
                <div v-html="render(news.body)"></div>
              </v-col>
              <v-col cols="12" v-if="news && news.showTOC" md="3" class="px-3"
                ><Toc></Toc
              ></v-col>
            </v-row>
          </v-card>
        </v-container>
      </template>
    </BaseContent>
  </div>
</template>

<script>
import NProgress from "nprogress";
import { renderToHtml } from "@/services/Markdown";
import { GET_SINGLE_POST_QUERY } from "@/graphql/news";
export default {
  data() {
    return {
      loading: true,
      error: null,
      news: null,
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
    posts: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_SINGLE_POST_QUERY,
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
          ApolloQueryResult.data.posts.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
          });
        } else {
          //console.log(this.id);
          this.news = ApolloQueryResult.data.posts[0];
          this.loading = false;
          NProgress.done();
        }
      },
    },
  },
};
</script>
