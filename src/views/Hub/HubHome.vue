<template>
  <div>
    <div v-if="loading">
      <Loader></Loader>
    </div>
    <div v-else>
      <v-carousel height="550">
        <v-carousel-item v-for="(article, i) in articles" :key="i">
          <v-card height="100%">
            <v-row no-gutters>
              <v-col md="12" cols="12">
                <v-img
                  v-if="article && article.splash"
                  :src="article.splash"
                  alt="ICJIA Research Hub page splash image"
                  height="550"
                >
                  <v-overlay absolute>
                    <div class="text-center px-10">
                      <div class="text-center px-12" style="min-width: 350px">
                        <h1
                          class=""
                          style="color: #fff; font-weight: 900; font-size: 36px"
                        >
                          {{ article.title }}
                        </h1>
                      </div>
                    </div>
                  </v-overlay>
                  <template v-slot:placeholder>
                    <v-row
                      class="fill-height ma-0"
                      align="center"
                      justify="center"
                    >
                      <v-progress-circular
                        indeterminate
                        color="grey lighten-5"
                      ></v-progress-circular>
                    </v-row>
                  </template>
                </v-img>
              </v-col>
            </v-row>
          </v-card>
        </v-carousel-item>
      </v-carousel>
    </div>
  </div>
</template>

<script>
import {
  getHubApplications,
  getHubArticles,
  getHubDatasets,
} from "@/services/ResearchHub";
export default {
  data() {
    return {
      apps: null,
      articles: null,
      datasets: null,
      loading: true,
    };
  },
  async mounted() {
    //console.log("fetch here");

    this.apps = await getHubApplications(2);
    this.apps = this.apps.map((e) => ({
      ...e,
      fullPath: `/researchhub/apps/${e.slug}/`,
      contentType: "app",
    }));
    this.articles = await getHubArticles(5);
    this.articles = this.articles.map((e) => ({
      ...e,
      fullPath: `/researchhub/articles/${e.slug}/`,
      contentType: "article",
    }));
    this.datasets = await getHubDatasets(2);
    this.datasets = this.datasets.map((e) => ({
      ...e,
      fullPath: `/researchhub/datasets/${e.slug}/`,
      contentType: "dataset",
    }));
    //console.log(this.hubArticles);
    this.loading = false;
  },
};
</script>

<style lang="scss" scoped></style>
