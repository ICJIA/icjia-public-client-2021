<template>
  <div style="background: #fff" id="article-view">
    <ArticleView
      v-if="article"
      :item="article"
      :downloader="downloader"
      class=""
    />
  </div>
</template>

<script>
import NProgress from "nprogress";
import { renderToHtml } from "@/services/Markdown";
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
    init() {},
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
};
</script>
