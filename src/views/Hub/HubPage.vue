<template>
  <div>
    <BaseContent :error="error" :loading="loading">
      <template slot="content" v-if="!loading">
        <v-sheet color="white" class="pt-5 pb-12">
          <v-container class="markdown-body">
            <Splash
              v-if="content && content.splash"
              :splash="content.splash"
            ></Splash>
            <v-row>
              <v-col cols="12" :md="content.showTOC ? 9 : 12">
                <h1 v-html="render(content.title)"></h1>
                <div v-html="render(content.body)"></div>
              </v-col>
              <v-col
                cols="12"
                v-if="content && content.showTOC"
                md="3"
                class="px-3 hidden-sm-and-down"
                ><Toc :key="content.title"></Toc
              ></v-col>
            </v-row>
          </v-container>
        </v-sheet>
      </template>
    </BaseContent>
  </div>
</template>

<script>
import NProgress from "nprogress";
import { renderToHtml } from "@/services/Markdown";
import { GET_SINGLE_PAGE_QUERY } from "@/graphql/page";
import { EventBus } from "@/event-bus";
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
  watch: {
    // eslint-disable-next-line no-unused-vars
    loading(newValue, oldValue) {
      if (!newValue) {
        this.$nextTick(() => {
          let eventAnchors = document.querySelectorAll("[data-event-search]");
          for (const eventAnchor of eventAnchors) {
            eventAnchor.classList.add("event-anchor");
            eventAnchor.addEventListener("click", function (e) {
              e.preventDefault();
              let opts = {
                query: e.target.innerText,
                type: "hub",
              };
              EventBus.$emit("search", opts);
            });
          }
        });
      }
    },
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
  },
  mounted() {},
  apollo: {
    pages: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_SINGLE_PAGE_QUERY,
      variables() {
        return {
          slug: this.$route.params.slug,
        };
      },
      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        if (
          ApolloQueryResult.data &&
          ApolloQueryResult.data.pages.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
          });
        } else {
          //console.log(this.id);
          this.content = ApolloQueryResult.data.pages[0];
          this.loading = false;
          NProgress.done();
        }
      },
    },
  },
};
</script>

<style lang="scss" scoped></style>
