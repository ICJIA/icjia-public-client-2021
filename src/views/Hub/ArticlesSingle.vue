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
      style="margin-top: -25px"
    />
  </div>
</template>

<script>
import NProgress from "@/services/Progress";
import { renderToHtml } from "@/services/Markdown";
import { sanitizeResponse } from "@/utils/contentSanitizer";
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
  return sanitizeResponse(response);
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
      const slug = this.$route.params.slug.replace(/[^a-zA-Z0-9_-]/g, "");
      const query = `query {
      articles (where: { status: "published", slug: "${slug}" }) {
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
      const { hash, ext, name: articleFilename } = this.article[`${type}file`];
      let articleFileURL = `https://researchhub.icjia-api.cloud/uploads/${hash}${ext}`;
      let articleURL = `https://icjia.illinois.gov/researchhub/articles/${this.article.slug}`;
      let articleTitle = this.article.title;

      window.plausible("research_article", {
        props: {
          articleTitle,
          articleURL,
          articleFilename,
          articleFileURL: encodeURI(articleFileURL),
        },
      });
      console.log("Stats:");
      console.log("filename: ", articleFilename);
      console.log("fileURL", encodeURI(articleFileURL));
      console.log("url: ", articleURL);
      console.log("title: ", articleTitle);
      console.log("---");
      window.open(
        `https://researchhub.icjia-api.cloud/uploads/${hash}${ext}`,
        "_blank",
        "noopener,noreferrer"
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
