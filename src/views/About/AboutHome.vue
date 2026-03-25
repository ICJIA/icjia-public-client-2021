<template>
  <div class="markdown-body">
    <BaseContent
      :error="error"
      :loading="$apollo.loading"
      style="margin-top: -35px"
    >
      <template slot="content">
        <v-container class="">
          <v-row v-if="content">
            <v-col cols="12" :md="content && content.showTOC ? 8 : 12">
              <h1
                v-html="render(content.title)"
                style="color: #000"
                v-if="content.title"
              ></h1>
              <div v-html="render(content.body)"></div>
            </v-col>
            <v-col
              cols="12"
              v-if="content && content.showTOC"
              md="4"
              class="px-3 hidden-sm-and-down"
              ><Toc :key="content.title" :title="content.title"></Toc
            ></v-col>
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
import { EventBus } from "@/event-bus";
import { renderToHtml } from "@/services/Markdown";
import { GET_SINGLE_PAGE_QUERY } from "@/graphql/page";
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
export default {
  name: "About",
  metaInfo() {
    return {
      title: this.content && this.content.title ? this.content.title : null,
    };
  },
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
    EventBus.$emit("context-label", "About");
  },
  apollo: {
    pages: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_SINGLE_PAGE_QUERY,
      variables() {
        return {
          slug: "about-the-authority",
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
          NProgress.done();
          attachInternalLinks(this);
          attachSearchEvents(this);
        }
      },
    },
  },
};
</script>

<style></style>
