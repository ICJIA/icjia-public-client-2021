<template>
  <div class="pb-12 markdown-body mt-2">
    <template>
      <div>
        <BaseContent :error="error" :loading="$apollo.loading">
          <template slot="content">
            <v-container v-if="unit">
              <v-row>
                <v-col cols="12">
                  <h1>Information Systems Unit Staff</h1>
                  <div v-html="render(unit.summary)"></div
                ></v-col>
                <v-col class="text-left" cols="12">
                  <!-- <div style="font-weight: 900; font-size: 12px" class="mb-12">
              Showing: {{ content.length }} of {{ content.length }} R&A staff
              members
            </div> -->
                </v-col>
                <v-col v-for="(item, i) in content" :key="i" cols="12">
                  <BiographyCard :item="item" />
                </v-col>
              </v-row>
            </v-container>
          </template>
        </BaseContent>
      </div>
    </template>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import { GET_BIOGRAPHIES_BY_UNIT_QUERY } from "@/graphql/biographies";
import { GET_SINGLE_UNIT_QUERY } from "@/graphql/units";
import { EventBus } from "@/event-bus";

import { renderToHtml } from "@/services/Markdown";
import _ from "lodash";
import NProgress from "nprogress";

export default {
  data() {
    return {
      page: null,
      error: null,
      unit: null,
      content: null,
    };
  },
  computed: {},
  async mounted() {
    NProgress.start();
    //console.log("fetch here");
    EventBus.$emit("context-label", "Staff");
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
    search(name) {
      let opts = {
        query: name,
        type: "information-systems",
      };
      EventBus.$emit("search", opts);
    },
  },
  apollo: {
    units: {
      prefetch: true,

      query: GET_SINGLE_UNIT_QUERY,
      variables() {
        return {
          slug: "information-systems-unit",
        };
      },
      error(error) {
        this.error = JSON.stringify(error.message);
        NProgress.done();
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
    biographies: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_BIOGRAPHIES_BY_UNIT_QUERY,
      variables() {
        return {
          shortName: "ISU",
        };
      },
      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        if (
          ApolloQueryResult.data &&
          ApolloQueryResult.data.biographies.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
          });
        } else {
          //console.log(this.id);
          this.content = ApolloQueryResult.data.biographies;

          this.content = _.orderBy(this.content, ["sortModifier"], ["asc"]);
          this.loading = false;
          NProgress.done();
        }
      },
    },
  },
};
</script>
