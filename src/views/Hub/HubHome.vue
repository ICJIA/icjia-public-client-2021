<template>
  <div class="pb-12 markdown-body">
    <div>
      <v-container class="markdown-body" style="margin-bottom: 25px">
        <v-row class="mb-8">
          <v-col cols="12">
            <h1 v-html="render(page.title)" v-if="page"></h1>
            <div v-html="render(page.body)" v-if="page"></div>
          </v-col>
        </v-row>
        <v-row style="border-bottom: 1px solid #ccc">
          <v-col cols="12" md="6"
            ><h2 style="font-size: 28px; font-weight: 900; margin: 0">
              Latest Articles
            </h2>
          </v-col>
          <v-col cols="12" md="6" class="text-right" style="margin-top: 5px"
            ><v-btn outlined small to="/researchhub/articles/"
              >All articles&nbsp;&raquo;</v-btn
            ></v-col
          >
        </v-row>
      </v-container>
      <div v-if="!hubLoading">
        <v-carousel
          height="650"
          :cycle="true"
          aria-label="Latest research articles slideshow"
        >
          <v-carousel-item
            v-for="(article, i) in articles"
            :key="i"
            aria-roledescription="slide"
            :aria-label="'Slide ' + (i + 1) + ': ' + article.title"
          >
            <v-card height="100%">
              <v-row no-gutters>
                <v-col md="12" cols="12">
                  <v-img
                    v-if="article && article.splash"
                    :src="article.splash"
                    alt="ICJIA Research Hub page splash image"
                    height="650"
                    class="hover"
                    tabindex="0"
                    role="link"
                    :aria-label="'Read article: ' + article.title"
                    @click="
                      $router.push(`/researchhub/articles/${article.slug}`)
                    "
                    @keydown.enter="
                      $router.push(`/researchhub/articles/${article.slug}`)
                    "
                  >
                    <v-overlay absolute :opacity="0.7">
                      <div class="text-center px-5">
                        <div
                          class="text-center px-12"
                          style="min-width: 350px; max-width: 850px"
                        >
                          <v-chip
                            v-if="isItNew(article.date)"
                            label
                            small
                            color="#0D4474"
                            class="mr-2"
                            style="margin-top: 0px"
                          >
                            <span
                              style="color: #fff !important; font-weight: 400"
                            >
                              NEW!
                            </span>
                          </v-chip>
                          <div class="text-center hidden-sm-and-down" style="">
                            <h2
                              style="
                                font-size: 18px;
                                font-weight: 300;
                                color: #fff;
                              "
                            >
                              {{ article.date | format }}
                            </h2>
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
              ><h2 style="font-size: 28px; font-weight: 900; margin: 0">
                Latest Web Applications
              </h2>
            </v-col>
            <v-col cols="12" md="6" class="text-right" style="margin-top: 5px"
              ><v-btn outlined small to="/researchhub/apps/"
                >All web apps&nbsp;&raquo;</v-btn
              ></v-col
            >
          </v-row>

          <v-row no-gutters>
            <v-col
              cols="12"
              md="4"
              v-for="(app, index) in apps"
              :key="`app-${index}`"
              class="flex-container"
            >
              <HubCard
                class="px-2 flex-item"
                :item="app"
                :textOnly="false"
                orientation="grid"
                :showUpdated="true"
              ></HubCard>
            </v-col>
          </v-row>
          <v-row style="border-bottom: 1px solid #ccc" class="mb-10">
            <v-col cols="12" md="6"
              ><h2 style="font-size: 28px; font-weight: 900; margin: 0">
                Latest Datasets
              </h2>
            </v-col>
            <v-col cols="12" md="6" class="text-right" style="margin-top: 5px"
              ><v-btn outlined small to="/researchhub/datasets/"
                >All datasets&nbsp;&raquo;</v-btn
              ></v-col
            >
          </v-row>
          <v-row no-gutters>
            <v-col
              cols="12"
              md="4"
              v-for="(dataset, index) in datasets"
              :key="`dataset-${index}`"
              class="flex-container"
            >
              <HubCard
                class="px-2 flex-item"
                :item="dataset"
                :textOnly="true"
                orientation="grid"
                :showUpdated="true"
                updatedText="Final date reflected in dataset"
              ></HubCard>
            </v-col>
          </v-row>
        </v-container>
        <v-container>
          <v-row>
            <v-col cols="12">
              <ClickthroughBoxes
                :boxes="page.clickthrough"
                v-if="page && page.clickthrough"
              ></ClickthroughBoxes>
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
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom";
import { EventBus } from "@/event-bus";
import { GET_SINGLE_PAGE_QUERY } from "@/graphql/page";
import { renderToHtml } from "@/services/Markdown";
import NProgress from "nprogress";
import moment from "moment";
import {
  getHubApplications,
  getHubArticlesForBanner,
  getHubDatasets,
} from "@/services/ResearchHub";

export default {
  sync: false,
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
      page: null,
    };
  },
  async mounted() {
    NProgress.start();
    //console.log("fetch here");
    EventBus.$emit("context-label", "Home");

    this.apps = await getHubApplications(this.$myApp.config.hub.splashApps);
    this.apps = this.apps.map((e) => ({
      ...e,
      fullPath: `/researchhub/apps/${e.slug}/`,
      contentType: "app",
    }));
    this.articles = await getHubArticlesForBanner(
      this.$myApp.config.hub.splashArticles
    );
    this.articles = this.articles.map((e) => ({
      ...e,
      fullPath: `/researchhub/articles/${e.slug}/`,
      contentType: "article",
    }));
    this.datasets = await getHubDatasets(this.$myApp.config.hub.splashDatasets);
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
    isItNew(articleDate) {
      const now = moment(new Date());
      const end = moment(articleDate); // another date
      const duration = moment.duration(now.diff(end));
      const days = duration.asDays();
      if (days <= this.$myApp.config.daysToShowNewResearch) {
        return true;
      } else {
        return false;
      }
    },
    render(content) {
      return renderToHtml(content);
    },
  },
  apollo: {
    pages: {
      prefetch: true,
      // fetchPolicy: "no-cache",
      query: GET_SINGLE_PAGE_QUERY,
      variables() {
        return {
          slug: "hub-home",
        };
      },
      error(error) {
        this.error = JSON.stringify(error.message);
        this.loading = false;
        NProgress.done();
      },
      result(ApolloQueryResult) {
        if (
          ApolloQueryResult.data &&
          ApolloQueryResult.data.pages.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
            this.loading = false;
            NProgress.done();
          });
        } else {
          //console.log(this.id);
          this.page = ApolloQueryResult.data.pages[0];
          this.loading = false;
          NProgress.done();
          attachInternalLinks(this);
          attachSearchEvents(this);
          EventBus.$emit("context-label", "Research Hub");
        }
      },
    },
  },
};
</script>

<style lang="scss" scoped></style>
