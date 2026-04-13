<template>
  <div class="markdown-body mt-8">
    <DatasetView v-if="dataset" :downloader="downloader" :item="dataset" />
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import NProgress from "@/services/Progress";
import { renderToHtml, parseHeadings } from "@/services/Markdown";
import { getImageURL } from "@/services/Image";
import { EventBus } from "@/event-bus";
import { sanitizeResponse } from "@/utils/contentSanitizer";
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
      dataset: null,
      html: null,
    };
  },
  methods: {
    async fetchContent() {
      const slug = this.$route.params.slug.replace(/[^a-zA-Z0-9_-]/g, "");
      const query = `query {
      datasets (where: { status: "published", slug: "${slug}" }) {
        id
        title
        date
        slug
        description
        status
        external
        categories
        tags
        project
        timeperiod
        sources
        notes
        variables
        funding
        citation
        datafile {
          hash
          name
          ext
          url
        }
        createdAt
        updatedAt
        apps {
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
        this.dataset = content.data.data.datasets[0];

        NProgress.done();
        this.loading = false;
        EventBus.$emit("context-label", this.dataset.title);
      } catch (e) {
        console.log(e);
        this.error = e;
        NProgress.done();
        this.loading = false;
      }
    },
    async downloader() {
      const { hash, ext } = this.item.datafile;

      window.open(
        `https://researchhub.icjia-api.cloud/uploads/${hash}${ext}`,
        "_blank",
        "noopener,noreferrer"
      );
    },
  },
  async mounted() {
    this.fetchContent();
  },
};
</script>
