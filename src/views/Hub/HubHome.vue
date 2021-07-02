<template>
  <div class="pb-12">
    <div class="markdown-body">
      <div
        style="background: #31597a; border-bottom: 1px solid #ccc"
        class="pt-6 pb-8"
        data-aos="fade-in"
      >
        <v-container v-if="unit">
          <v-row>
            <v-col cols="12">
              <h1 style="color: #fff" v-html="render(unit.title)"></h1>
              <div v-html="render(unit.summary)" style="color: #fff"></div>
            </v-col>
          </v-row>
        </v-container>
        <v-container v-else>
          <Loader loaderType="skeleton"></Loader>
        </v-container>
      </div>

      <v-container class="markdown-body" style="margin-bottom: 25px">
        <v-row style="border-bottom: 1px solid #ccc">
          <v-col cols="12" md="6"
            ><div style="font-size: 28px; font-weight: 900">
              Latest Articles
            </div>
          </v-col>
          <v-col cols="12" md="6" class="text-right" style="margin-top: 5px"
            ><v-btn outlined small to="/researchhub/articles/"
              >See more&nbsp;&raquo;</v-btn
            ></v-col
          >
        </v-row>
      </v-container>
      <div v-if="!hubLoading">
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
                    class="hover"
                    @click="
                      $router.push(`/researchhub/articles/${article.slug}`)
                    "
                  >
                    <v-overlay absolute>
                      <div class="text-center px-5">
                        <div
                          class="text-center px-12"
                          style="min-width: 350px; max-width: 850px"
                        >
                          <div class="text-center hidden-sm-and-down" style="">
                            <h3 style="font-size: 18px; font-weight: 300: ">
                              {{ article.date | format }}
                            </h3>
                          </div>
                          <h1
                            class=""
                            style="
                              color: #fff;
                              font-weight: 900;
                              font-size: 36px;
                              margin-top: -5px;
                            "
                          >
                            {{ article.title }}
                          </h1>

                          <div
                            style="margin-top: -10px"
                            class="hidden-sm-and-down"
                          >
                            <span
                              v-for="(author, i) in article.authors"
                              :key="i"
                            >
                              <template v-if="i > 0">{{
                                article.authors.length > i + 1 ? ", " : " and "
                              }}</template>
                              {{ author.title }}
                            </span>
                          </div>
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
        <v-container class="markdown-body" style="margin-bottom: 25px">
          <v-row style="border-bottom: 1px solid #ccc" class="mb-10">
            <v-col cols="12" md="6"
              ><div style="font-size: 28px; font-weight: 900">
                Latest Datasets
              </div>
            </v-col>
            <v-col cols="12" md="6" class="text-right" style="margin-top: 5px"
              ><v-btn outlined small to="/researchhub/datasets/"
                >See more&nbsp;&raquo;</v-btn
              ></v-col
            >
          </v-row>
          <v-row no-gutters>
            <v-col
              cols="12"
              md="4"
              v-for="(dataset, index) in datasets"
              :key="`dataset-${index}`"
              style="border-right: 1px solid #e8e8e8"
            >
              <HubCard
                :item="dataset"
                :textOnly="true"
                orientation="grid"
                :showUpdated="true"
              ></HubCard>
            </v-col>
          </v-row>
        </v-container>
        <v-container class="markdown-body" style="margin-bottom: 25px">
          <v-row style="border-bottom: 1px solid #ccc" class="mb-10">
            <v-col cols="12" md="6"
              ><div style="font-size: 28px; font-weight: 900">
                Latest Web Applications
              </div>
            </v-col>
            <v-col cols="12" md="6" class="text-right" style="margin-top: 5px"
              ><v-btn outlined small to="/researchhub/apps/"
                >See more&nbsp;&raquo;</v-btn
              ></v-col
            >
          </v-row>
          <v-row no-gutters>
            <v-col
              cols="12"
              md="4"
              v-for="(app, index) in apps"
              :key="`app-${index}`"
              style="border-right: 1px solid #e8e8e8"
            >
              <HubCard
                :item="app"
                :textOnly="false"
                orientation="grid"
                :showUpdated="true"
              ></HubCard>
            </v-col>
          </v-row>
        </v-container>
      </div>
      <div v-else>
        <Loader
          loaderType="skeleton"
          :repeat="1"
          loaderDisplayType="card, article, article, article, article, article"
        ></Loader>
      </div>
    </div>
  </div>
</template>

<script>
import { attachInternalLinks } from "@/utils/dom";

import { GET_SINGLE_UNIT_QUERY } from "@/graphql/units";
import { renderToHtml } from "@/services/Markdown";
import NProgress from "nprogress";
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
      hubLoading: true,
      contentLoading: true,
      content: null,
      appModel: null,
      datasetModel: null,
      unit: null,
    };
  },
  async mounted() {
    NProgress.start();
    //console.log("fetch here");

    this.apps = await getHubApplications(3);
    this.apps = this.apps.map((e) => ({
      ...e,
      fullPath: `/researchhub/apps/${e.slug}/`,
      contentType: "app",
    }));
    this.articles = await getHubArticles(10);
    this.articles = this.articles.map((e) => ({
      ...e,
      fullPath: `/researchhub/articles/${e.slug}/`,
      contentType: "article",
    }));
    this.datasets = await getHubDatasets(3);
    this.datasets = this.datasets.map((e) => ({
      ...e,
      fullPath: `/researchhub/datasets/${e.slug}/`,
      contentType: "dataset",
    }));

    this.hubLoading = false;
    NProgress.done();
    this.$nextTick(() => {
      attachInternalLinks(this);
    });
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
  },
  apollo: {
    units: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_SINGLE_UNIT_QUERY,
      variables() {
        return {
          slug: "research-and-analysis-unit",
        };
      },
      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        if (
          ApolloQueryResult.data &&
          ApolloQueryResult.data.units.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
          });
        } else {
          //console.log(this.id);
          this.unit = ApolloQueryResult.data.units[0];

          NProgress.done();
        }
      },
    },
  },
};
</script>

<style lang="scss" scoped></style>
