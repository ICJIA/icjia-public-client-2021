<template>
  <div style="background: #fff">
    <div v-if="loading" style="background: #f3f3f3; margin-top: 8px">
      <Loader
        loaderType="skeleton"
        :repeat="1"
        loaderDisplayType="card, article, article, article, article, article"
      ></Loader>
    </div>
    <ArticleView
      v-if="article"
      :item="article"
      :downloader="downloader"
      @hook:mounted="childMounted"
      :key="article.title"
      id="article-view"
    />
  </div>
</template>

<script>
import NProgress from "nprogress";
import { renderToHtml } from "@/services/Markdown";
//import { EventBus } from "@/event-bus";
const axios = require("axios");
const api = axios.create({
  baseURL: "https://researchhub.icjia-api.cloud",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  NProgress.start();
  return config;
});

api.interceptors.response.use((response) => {
  NProgress.done();
  return response;
});
export default {
  watch: {
    // eslint-disable-next-line no-unused-vars
    $route(to, from) {
      NProgress.start();
      this.fetchContent();
    },
  },
  data() {
    return {
      article: null,
      error: null,
      loading: true,

      imageOK: true,
      html: null,
      activeHeading: "introduction",
      isTOCSticky: false,
    };
  },
  methods: {
    childMounted() {
      console.log("child mounted");
    },
    async fetchContent() {
      const query = `query {
      articles (where: { status: "published", slug: "${this.$route.params.slug}" }) {
      id
      mainfiletype
      mainfile {
        name
        hash
        ext
        url
      }
      extrafile {
        name
        hash
        ext
        url
      }
      title
      status
      slug
      date
      external
      categories
      tags
      authors
      images
      abstract
      markdown
      splash
      thumbnail
      citation
      funding
  }
 
}`;
      try {
        let article = await api.post("/graphql", {
          query,
          validateStatus: function (status) {
            return status >= 200 && status < 300;
          },
        });
        this.article = article.data.data.articles[0];
        if (this.article.images) {
          this.article.md = this.addImages(
            this.article.images,
            this.article.markdown
          );
        } else {
          this.article.md = this.article.markdown;
        }
        this.article.html = this.render(this.article.md);
        NProgress.done();
        this.loading = false;
      } catch (e) {
        console.log(e);
        this.error = e;
        NProgress.done();
        this.loading = false;
      }
    },
    addImages(images, markdown) {
      return `${markdown}${images
        .map((i) => `\n\n[${i.title}]: ${i.src}`)
        .join("\n")}`;
    },
    render(content) {
      let html = renderToHtml(content);
      return html;
    },
    async downloader(type) {
      const { hash, ext } = this.article[`${type}file`];
      window.open(
        `https://icjia.illinois.gov/researchhub/files/${hash}${ext}`,
        "_blank"
      );
      // console.log(hash, ext);
      //console.log(type, this.article);
    },
  },

  async mounted() {
    this.fetchContent();
  },
};
</script>
