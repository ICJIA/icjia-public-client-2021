<template>
  <div>
    <v-container
      ><v-row
        ><v-col>
          <div v-if="unit" style="border: 1px solid #ccc">
            <h1 class="sr-only">{{ unit.title }}</h1>
            <UnitCard
              :item="unit"
              :shortName="unit.shortName"
              :showActions="false"
            ></UnitCard>
          </div>
          <div v-else>
            <Loader loaderType="skeleton"></Loader>
          </div> </v-col></v-row
    ></v-container>
  </div>
</template>

<script>
export default {};
</script>

<script>
/* eslint-disable no-unused-vars */
import NProgress from "@/services/Progress";

import { renderToHtml } from "@/services/Markdown";

import { GET_SINGLE_UNIT_QUERY } from "@/graphql/units";

import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import _ from "lodash";
export default {
  name: "UnitSingle",
  metaInfo() {
    return {
      title: this.unit && this.unit.title ? this.unit.title : null,
    };
  },
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
            show: true,
          }));

          this.unit = _.orderBy(this.unit, ["title"], ["asc"]);
          this.unit = this.unit[0];
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
