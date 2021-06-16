<template>
  <div>
    <BaseContent :error="error" :loading="loading" style="background: #fff">
      <template slot="content" v-if="!loading">
        <v-img
          v-if="article && article.id"
          :src="article.splash"
          :lazy-src="article.thumbnail"
          width="150%"
          height="450"
          class="mb-5"
          :ref="'img_' + article.id"
          style="border: 1px solid #fafafa"
          alt="ICJIA Research Hub image"
          ><template #placeholder>
            <v-row class="fill-height ma-0" align="center" justify="center">
              <v-progress-circular
                indeterminate
                color="blue darken-3"
                aria-label="progress"
              ></v-progress-circular>
            </v-row>
          </template>
        </v-img>
        <v-container fluid>
          <v-row>
            <v-col cols="12" md="3">TOC HERE</v-col>
            <v-col cols="12" md="9">
              <h1>{{ article.title }}</h1>
              <div v-html="render(article.md)" class="markdown-body"></div
            ></v-col>
          </v-row>
        </v-container>
      </template>
    </BaseContent>
  </div>
</template>

<script>
import NProgress from "nprogress";
import { renderToHtml } from "@/services/Markdown";
import { getImageURL } from "@/services/Image";

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
      loading: true,
      error: null,
      article: null,
      imageOK: true,
    };
  },
  created() {
    NProgress.start();
  },
  async mounted() {
    let article = await api.get(`/articles?slug=${this.$route.params.slug}`);
    this.article = article.data[0];
    this.article.md = this.addImages(
      this.article.images,
      this.article.markdown
    );
    this.loading = false;
  },
  methods: {
    addImages(images, markdown) {
      return `${markdown}${images
        .map((i) => `\n\n[${i.title}]: ${i.src}`)
        .join("\n")}`;
    },
    render(content) {
      return renderToHtml(content);
    },
    getImagePath(url, imgWidth = 0, imgHeight = 0, imageQuality = 50) {
      let imgPath;

      imgPath = `${url}`;

      const thumborImgPath = getImageURL(
        imgPath,
        imgWidth,
        imgHeight,
        imageQuality
      );
      // console.log(thumborImgPath);
      return thumborImgPath;
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
