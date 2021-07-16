<template>
  <div style="background: #fafafa">
    <v-container v-if="$apollo.loading">
      <v-row>
        <v-col>
          <Loader loaderType="skeleton"></Loader>
        </v-col>
      </v-row>
    </v-container>
    <v-container class="pt-10 pb-12 markdown-body" v-if="pageContent">
      <v-row>
        <v-col>
          <h1>{{ pageContent.title }}</h1>
        </v-col>
      </v-row>
    </v-container>
    <v-container style="margin-top: -25px">
      <v-row>
        <v-col
          cols="12"
          :md="pageContent && pageContent.showTOC ? 12 : 12"
          class="markdown-body"
          style="margin-top: -40px"
        >
          <div v-if="pageContent" v-html="render(pageContent.body)"></div>
          <div v-else><Loader loaderType="skeleton"></Loader></div>

          <v-container class="mt-10 mb-8">
            <v-row>
              <v-col cols="12" md="6">
                <h2 v-if="staffToggle === 1">ICJIA Units</h2>
                <h2 v-else>All ICJIA Staff</h2>
              </v-col>
              <v-col cols="12" md="6" class="text-right">
                <v-btn-toggle
                  v-model="staffToggle"
                  mandatory
                  style="margin-top: 25px"
                >
                  <v-btn small> All Staff </v-btn>
                  <v-btn small>By Unit </v-btn>
                </v-btn-toggle>
              </v-col>
            </v-row>
          </v-container>

          <div v-if="staffToggle === 1 && units">
            <div v-for="unit in units" :key="unit.title" class="mb-2">
              <UnitCard :item="unit" :shortName="unit.shortName"></UnitCard>
            </div>
          </div>

          <div v-if="staffToggle === 0 && content">
            <div class="markdown-body" v-for="(item, i) in content" :key="i">
              <BiographyCard :item="item"></BiographyCard>
            </div>
          </div>
        </v-col>
        <!-- <v-col cols="12" md="3" v-if="pageContent && pageContent.showTOC"
          ><Toc :key="pageContent.title" :tocHeading="pageContent.title"></Toc
        ></v-col> -->
      </v-row>
    </v-container>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import NProgress from "nprogress";
import { EventBus } from "@/event-bus";
import { renderToHtml } from "@/services/Markdown";
import { GET_ALL_BIOGRAPHIES_QUERY } from "@/graphql/biographies";
import { GET_ALL_UNITS_QUERY } from "@/graphql/units";
import { GET_SINGLE_PAGE_QUERY } from "@/graphql/page";
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
      units: null,
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
    pages: {
      prefetch: true,

      query: GET_SINGLE_PAGE_QUERY,
      variables() {
        return {
          slug: "icjia-staff",
        };
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
          this.pageContent = ApolloQueryResult.data.pages[0];
          NProgress.done();
          attachInternalLinks(this);
          attachSearchEvents(this);
        }
      },
    },
    biographies: {
      prefetch: true,
      //   fetchPolicy: "no-cache",
      query: GET_ALL_BIOGRAPHIES_QUERY,
      variables() {
        return {};
      },
      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        if (
          ApolloQueryResult.data &&
          ApolloQueryResult.data.biographies.length > 0 === false
        ) {
          this.$router.push("/404").catch((err) => {
            console.log(err);
            this.loading = false;
            NProgress.done();
          });
          console.log(ApolloQueryResult);
        } else {
          this.content = ApolloQueryResult.data.biographies;

          this.content = _.orderBy(this.content, ["sortModifier"], ["asc"]);
          this.content = this.content.filter((item) => {
            if (item.affiliation === "staff") {
              return item;
            }
          });

          this.loading = false;
          NProgress.done();
        }
      },
    },
    units: {
      prefetch: true,
      //   fetchPolicy: "no-cache",
      query: GET_ALL_UNITS_QUERY,
      variables() {
        return {};
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
          this.units = ApolloQueryResult.data.units;
          this.units = this.units.map((u) => ({
            ...u,
            fullPath: `/about/units/${u.slug}/`,
            contentType: "unit",
            show: false,
          }));

          this.units = _.orderBy(this.units, ["title"], ["asc"]);
        }

        NProgress.done();
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
