<template>
  <div class="markdown-body mt-4">
    <BaseContent :error="error" :loading="loading">
      <template slot="content" v-if="!loading">
        <Splash
          v-if="content && content.splash"
          :splash="content.splash"
        ></Splash>

        <v-container style="margin-top: -15px">
          <v-row v-if="content">
            <v-col cols="12" :md="content && content.showTOC ? 12 : 12">
              <h1 v-html="render(content.title)"></h1>
              <div v-html="render(content.body)"></div>
              <div class="text-center mt-10" style="font-weight: 900">
                Visit the new InfoNet website for more information:
                <a
                  href="https://infonet.icjia.illinois.gov"
                  style="text-decoration: underline"
                  >https://infonet.icjia.illinois.gov</a
                >
              </div>

              <!-- <h2 id="more-about-infonet">More About InfoNet</h2>
              <StaticSearch
                query="infonet"
                :threshold="0.2"
                class="mt-3"
              ></StaticSearch> -->
            </v-col>
            <!-- <v-col
              cols="12"
              v-if="content && content.showTOC"
              md="3"
              class="px-3 hidden-sm-and-down"
              ><Toc :key="content.title" :tocHeading="content.title"></Toc
            ></v-col> -->
          </v-row>
        </v-container>
        <v-container>
          <v-row>
            <v-col cols="12">
              <ClickthroughBoxes
                :boxes="content.clickthrough"
                v-if="content && content.clickthrough"
              ></ClickthroughBoxes>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </BaseContent>
  </div>
</template>

<script>
import NProgress from "@/services/Progress";
import { renderToHtml } from "@/services/Markdown";
import { GET_SINGLE_PAGE_QUERY } from "@/graphql/page";
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import { EventBus } from "@/event-bus.js";
export default {
  data() {
    return {
      loading: true,
      error: null,
      content: null,
    };
  },
  created() {
    NProgress.start();
  },

  methods: {
    render(content) {
      return renderToHtml(content);
    },
  },
  mounted() {
    EventBus.$emit("context-label", "InfoNet");
  },
  apollo: {
    pages: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_SINGLE_PAGE_QUERY,
      variables() {
        return {
          slug: "infonet",
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
          this.content = ApolloQueryResult.data.pages[0];
          this.loading = false;
          EventBus.$emit("context-label", this.content.title);
          NProgress.done();
          attachInternalLinks(this);
          attachSearchEvents(this);
        }
      },
    },
  },
};
</script>
