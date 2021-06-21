<template>
  <div>
    <AppView v-if="app" :downloader="downloader" :item="app" />
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import NProgress from "nprogress";
import { renderToHtml, parseHeadings } from "@/services/Markdown";
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
      app: null,
      html: null,
    };
  },
  methods: {
    async downloader() {
      const { hash, ext } = this.item.datafile;
      window.open(
        `https://icjia.illinois.gov/researchhub/files/${hash}${ext}`,
        "_blank"
      );
    },
  },
  async mounted() {
    const query = `query {
      apps (where: { status: "published", slug: "${this.$route.params.slug}" }) {
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
