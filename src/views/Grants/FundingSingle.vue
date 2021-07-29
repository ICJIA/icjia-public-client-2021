<template>
  <div>
    <BaseContent :error="error" :loading="loading">
      <template slot="isExpired" v-if="!loading && isExpired"
        ><div
          style="
            background: red;
            color: #fff;
            padding: 15px 10px;
            font-weight: 900;
            font-size: 18px;
          "
          class="text-center"
        >
          This Funding Opportunity Expired on
          {{ funding.end | format }}
        </div></template
      >
      <template slot="content" v-if="!loading">
        <v-sheet color="white">
          <v-container class="markdown-body">
            <v-row>
              <v-col cols="12" md="9" class="markdown-body">
                <div v-if="funding.category === 'nofo'">
                  <div style="font-weight: 900; font-size: 18px; color: #555">
                    Notice of Funding Opportunity
                  </div>
                </div>
                <h1 v-html="render(funding.title)" style="margin-top: 5px"></h1>
                <div v-html="render(funding.body)"></div>
                <div class="my-5">
                  <AttachmentList
                    :items="funding.attachments"
                    v-if="funding.attachments && funding.attachments.length"
                    class="mt-8 pl-3"
                    :key="funding.slug"
                    title="Attachments"
                  ></AttachmentList>
                  <RelatedList
                    :content="funding"
                    title="Related Web Content"
                    class="mt-5"
                    v-if="isRelated"
                    background="grey lighten-4"
                    indentation="mt-8 px-5 py-5"
                  ></RelatedList>
                  <BasePropDisplay v-if="funding.tags" name="">
                    <BasePropChip
                      v-for="(tag, index) in funding.tags"
                      :key="index"
                      class="mt-3"
                    >
                      <template>{{ tag }}</template>
                    </BasePropChip>
                  </BasePropDisplay>
                </div>
              </v-col>
              <v-col cols="12" md="3" class="hidden-sm-and-down"
                ><Toc :key="funding.title" :scrollOffset="55"></Toc
              ></v-col>
            </v-row>
          </v-container>
        </v-sheet>
      </template>
    </BaseContent>
  </div>
</template>

<script>
const addOneDayToDate = function (date) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + 1);
  return newDate;
};
import NProgress from "nprogress";
import { renderToHtml } from "@/services/Markdown";
import { GET_SINGLE_FUNDING_QUERY } from "@/graphql/grants";
import { EventBus } from "@/event-bus";
import { getUnifiedTags, isRelatedContent } from "@/utils/content";
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
export default {
  data() {
    return {
      loading: true,
      error: null,
      funding: null,
    };
  },
  computed: {
    // add one day to js to get the correct date
    isExpired() {
      if (new Date(addOneDayToDate(this.funding.end)) < new Date()) {
        return true;
      } else {
        return false;
      }
    },
  },
  created() {
    NProgress.start();
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
  },
  apollo: {
    grants: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_SINGLE_FUNDING_QUERY,
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
          ApolloQueryResult.data.grants.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
          });
        } else {
          //console.log(this.id);
          let funding = ApolloQueryResult.data.grants;
          funding = getUnifiedTags(funding);
          this.isRelated = isRelatedContent(funding);

          attachInternalLinks(this);
          attachSearchEvents(this);
          this.funding = funding[0];
          this.loading = false;
          NProgress.done();
          EventBus.$emit("context-label", this.funding.title);
        }
      },
    },
  },
};
</script>
