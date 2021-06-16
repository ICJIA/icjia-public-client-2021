<template>
  <div>
    <BaseContent :error="error" :loading="loading">
      <template slot="content" v-if="!loading">
        {{ article.splash }}
        <div v-html="render(markdown)" class="markdown-body"></div>
      </template>
    </BaseContent>
  </div>
</template>

<script>
import NProgress from "nprogress";
import { renderToHtml } from "@/services/Markdown";
import { GET_SINGLE_ARTICLE_QUERY } from "@/graphql/hub";
export default {
  data() {
    return {
      loading: true,
      error: null,
      article: null,
    };
  },
  created() {
    NProgress.start();
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
    // addImages(images, markdown) {
    //   return `${markdown}${images
    //     .map((i) => `\n\n[${i.title}]: ${i.src}`)
    //     .join("\n")}`;
    // },
  },
  apollo: {
    articles: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_SINGLE_ARTICLE_QUERY,
      context: {
        uri: "https://researchhub.icjia-api.cloud/graphql",
      },
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
          ApolloQueryResult.data.articles.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
          });
        } else {
          //console.log(this.id);
          this.article = ApolloQueryResult.data.articles[0];
          const md = this.article.markdown;
          let images = this.article.images.map((i) => {
            return `\n\n[${i.title}]: ${i.src}`;
          });
          this.markdown = md + images;

          this.loading = false;
          NProgress.done();
        }
      },
    },
  },
};
</script>

<style>
.article-figure {
  margin-left: auto !important;
  margin-right: auto !important;
  text-align: center !important;
  padding: 24px 12px !important;
}
</style>
