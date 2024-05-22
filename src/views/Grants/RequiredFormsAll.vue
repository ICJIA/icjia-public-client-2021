<template>
  <div class="mt-10 mb-12">
    <BaseContent :error="error" :loading="$apollo.loading">
      <template slot="content">
        <v-container style="margin-top: -25px">
          <v-row>
            <v-col cols="12">
              <div class="markdown-body mb-12 page-heading">
                <h1>Required Forms</h1>
              </div>
            </v-col>
          </v-row>
        </v-container>
        <v-container style="margin-top: -25px">
          <v-row>
            <v-col cols="12" md="12">
              <RequiredFormTable
                v-if="requiredForms"
                :items="requiredForms"
                heading=""
                :text="null"
                class="elevation-1"
              ></RequiredFormTable>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </BaseContent>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import NProgress from "nprogress";
import { EventBus } from "@/event-bus";
import { renderToHtml } from "@/services/Markdown";

import { GET_ALL_REQUIRED_FORMS_QUERY } from "@/graphql/requiredForms";
import { getUnifiedTags } from "@/utils/content";

import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import _ from "lodash";
export default {
  data() {
    return {
      viewToggle: "all",
      loading: true,
      error: null,
      content: null,
      requiredForms: null,
    };
  },

  created() {
    NProgress.start();
  },
  mounted() {
    EventBus.$emit("context-label", "Policies");
  },
  methods: {},
  apollo: {
    requiredForms: {
      prefetch: true,

      query: GET_ALL_REQUIRED_FORMS_QUERY,
      variables() {
        return {};
      },
      error(error) {
        this.error = JSON.stringify(error.message);
        this.loading = false;
        NProgress.done();
      },
      result(ApolloQueryResult) {
        //console.log(ApolloQueryResult);
        if (
          ApolloQueryResult.data &&
          ApolloQueryResult.data.requiredForms.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
            this.loading = false;
            NProgress.done();
          });
        } else {
          //console.log(this.id);
          let requiredForms = ApolloQueryResult.data.requiredForms;
          console.log("requiredForms fetch here");
          requiredForms = getUnifiedTags(requiredForms);

          this.requiredForms = requiredForms;
          NProgress.done();
          // attachInternalLinks(this);
          // attachSearchEvents(this);
          this.loading = false;
        }
      },
    },
  },
};
</script>
