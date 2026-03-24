<template>
  <div class="markdown-body mt-8">
    <AppView v-if="app" :downloader="downloader" :item="app" />
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import NProgress from "nprogress";
import { renderToHtml, parseHeadings } from "@/services/Markdown";
import { getImageURL } from "@/services/Image";
import { EventBus } from "@/event-bus";
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
      console.log("route change");
      this.fetchContent();
    },
  },
  data() {
    return {
      app: null,
      html: null,
    };
  },
  methods: {
    async downloader() {
      const { hash, ext } = this.item.datafile;

      window.open(
        `https://researchhub.icjia-api.cloud/uploads/${hash}${ext}`,
        "_blank"
      );
    },
    async fetchContent() {
      const slug = this.$route.params.slug.replace(/[^a-zA-Z0-9_-]/g, "");
      const query = `query {
      apps (where: { status: "published", slug: "${slug}" }) {
        id
        title
        slug
        date
        description
        contributors
        image
        status
        external
        categories
        tags
        url
        funding
        citation
        createdAt
        updatedAt
        datasets {
            title
            slug
        }
        articles {
            title
            slug
        }
 }
}`;
      try {
        let content = await api.post("/graphql", {
          query,
          validateStatus: function (status) {
            return status >= 200 && status < 300;
          },
        });
        this.app = content.data.data.apps[0];
        EventBus.$emit("context-label", this.app.title);
        NProgress.done();
        this.loading = false;
      } catch (e) {
        console.log(e);
        this.error = e;
        NProgress.done();
        this.loading = false;
      }
    },
  },
  async mounted() {
    this.fetchContent();
  },
};
</script>
