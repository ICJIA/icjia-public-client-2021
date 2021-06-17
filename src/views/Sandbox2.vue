<template>
  <div>
    <v-container fluid>
      <v-row v-if="loading">
        <v-col cols="12">
          <Loader loaderType="skeleton" :repeat="1"></Loader>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <div v-if="article">
            {{ article }}
          </div>
          <div v-if="error" class="text-center error" style="font-size: 20px">
            {{ error }}
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
const axios = require("axios");
import NProgress from "nprogress";
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
      slug: "examining-the-experiences-of-women-police-leaders-in-illinois",
    };
  },
  async mounted() {
    const query = `query {
  articles (where: { status: "published", slug: "${this.slug}" }) {
     id
      title
      status
      slug
      date
      external
      thumbnail
      categories
      tags
      authors
      images
      apps {
        title
        slug
     }
      datasets {
        title
       slug
     }
      abstract
      markdown
      mainfile {
        name
        url
      }
      extrafile {
        name
        url
      }
   
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
