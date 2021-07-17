<template>
  <div>
    <v-container
      ><r-row
        ><v-col>
          <div v-if="unit">
            <UnitCard :item="unit[0]" :shortName="unit[0].shortName"></UnitCard>
          </div>
          <div v-else>
            <Loader loaderType="skeleton"></Loader>
          </div> </v-col></r-row
    ></v-container>
  </div>
</template>

<script>
export default {};
</script>

<script>
/* eslint-disable no-unused-vars */
import NProgress from "nprogress";

import { renderToHtml } from "@/services/Markdown";

import { GET_SINGLE_UNIT_QUERY } from "@/graphql/units";

import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import _ from "lodash";
export default {
  data() {
    return {
      loading: true,
      error: null,
      content: null,
      pageContent: null,
      listing: null,
      unit: null,
      tab: 0,
      staffToggle: 0,
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
  apollo: {
    units: {
      prefetch: true,
      //   fetchPolicy: "no-cache",
      query: GET_SINGLE_UNIT_QUERY,
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
          ApolloQueryResult.data.units.length > 0 === false
        ) {
          this.$router.push("/404").catch((err) => {
            console.log(err);
            this.loading = false;
            NProgress.done();
          });
          console.log(ApolloQueryResult);
        } else {
          this.unit = ApolloQueryResult.data.units[0];
          this.unit = this.units.map((u) => ({
            ...u,
            fullPath: `/about/units/${u.slug}/`,
            contentType: "unit",
            show: false,
          }));

          this.unit = _.orderBy(this.unit, ["title"], ["asc"]);
        }

        NProgress.done();
        attachInternalLinks(this);
        attachSearchEvents(this);
      },
    },
  },
};
</script>
<style>
a.unit {
  font-weight: bold;
}
</style>
