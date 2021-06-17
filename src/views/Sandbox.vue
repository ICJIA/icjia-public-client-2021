<template>
  <div>
    <div v-if="content">
      content:<br />
      {{ content }}
    </div>
    <div v-else>
      <Loader></Loader>
    </div>
  </div>
</template>

<script>
import NProgress from "nprogress";
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
      content: null,
    };
  },
  async mounted() {
    let content = await api.get("/articles");
    this.content = content.data.data;
  },
};
</script>
