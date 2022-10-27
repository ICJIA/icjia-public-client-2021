<template>
  <div class="markdown-body">
    <BaseContent :error="error" :loading="loading">
      <div slot="content" v-if="!loading">
        <SplashText
          v-if="content && content.splash"
          :splash="content.splash"
          :splashHeight="600"
        ></SplashText>

        <HomeBoxesAlt
          style="margin-top: -18px"
          :secondRow="false"
          :boxes="3"
          :showTeaser="true"
          class="mb-5 card"
        ></HomeBoxesAlt>
        <!-- <v-container fluid>
          <v-row no-gutters>
            <v-col cols="12" md="6">col 1</v-col>
            <v-col cols="12" md="6">col 2</v-col>
          </v-row>
        </v-container> -->
        <v-container fluid style="margin: 0 !important; padding: 0 !important">
          <v-row v-if="content" no-gutters>
            <v-col cols="12" :md="content && content.showTOC ? 8 : 12">
              <h1 v-html="render(content.title)" v-if="!content.hideTitle"></h1>
              <div
                v-html="render(content.body)"
                style="font-size: 20px !important; color: #000 !important"
              ></div>
              <div>
                <BasePropDisplay v-if="content.tags" name="">
                  <BasePropChip
                    v-for="tag in content.tags"
                    :key="tag"
                    class="mt-0"
                  >
                    <template>{{ tag }}</template>
                  </BasePropChip>
                </BasePropDisplay>
                <AttachmentList
                  :items="content.attachments"
                  v-if="content.attachments && content.attachments.length"
                  class="mt-6 pl-0"
                  :key="content.attachments.title"
                  :baseItemPublished="content.published_at"
                  :label="
                    content.attachmentLabel && content.attachmentLabel.length
                      ? content.attachmentLabel
                      : ''
                  "
                ></AttachmentList>
              </div>
            </v-col>
            <v-col
              cols="12"
              v-if="content && content.showTOC"
              md="4"
              class="px-3 hidden-sm-and-down"
              ><Toc :key="content.title"></Toc
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
      </div>
    </BaseContent>
  </div>
</template>

<script>
import NProgress from "nprogress";
import { renderToHtml } from "@/services/Markdown";
import { GET_SINGLE_PAGE_QUERY } from "@/graphql/page";
import { getUnifiedTags } from "@/utils/content";
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import { EventBus } from "@/event-bus.js";
export default {
  name: "BasePage",
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
    test() {
      console.log("click");
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
          slug: "i2i-dev",
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
          let content = ApolloQueryResult.data.pages;
          content = getUnifiedTags(content);
          this.content = content[0];
          this.loading = false;

          NProgress.done();
          attachInternalLinks(this);
          attachSearchEvents(this);
          EventBus.$emit("context-label", this.content.title);
        }
      },
    },
  },
};
</script>

<style>
.info-card {
  border-radius: 0 !important;
}
</style>
