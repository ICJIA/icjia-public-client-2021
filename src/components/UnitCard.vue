<template>
  <div>
    <v-card elevation="1" color="white" class="px-4 py-8 markdown-body">
      <h2>{{ item.title }}</h2>
      <v-card-text v-if="item.body" v-html="render(item.body)"></v-card-text>
      <v-card-text v-else>No description available.</v-card-text>

      <v-card-actions>
        <v-btn text @click="item.show = !item.show">
          {{ item.shortName }} Staff
          <v-icon>{{
            item.show ? "mdi-chevron-up" : "mdi-chevron-down"
          }}</v-icon></v-btn
        >
        <v-spacer></v-spacer>
        <v-btn text :to="item.url" v-if="item.url"
          >Read more&nbsp;&raquo;</v-btn
        >
      </v-card-actions>
      <v-expand-transition>
        <div v-show="item.show">
          <v-divider></v-divider>

          <div v-if="staff">
            <div
              class="markdown-body px-2 mb-3"
              v-for="(item, i) in staff"
              :key="i"
            >
              <BiographyCard
                :item="item"
                color="grey lighten-5"
              ></BiographyCard>
            </div>
          </div>
        </div>
      </v-expand-transition>
    </v-card>
  </div>
</template>

<script>
import { GET_BIOGRAPHIES_BY_UNIT_QUERY } from "@/graphql/biographies";

import NProgress from "nprogress";
// import { EventBus } from "@/event-bus";
import { renderToHtml } from "@/services/Markdown";
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import _ from "lodash";
export default {
  data() {
    return {
      staff: null,
    };
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
  },
  props: {
    item: {
      type: Object,
      default: () => {},
    },
    shortName: {
      type: String,
      default: null,
    },
  },
  apollo: {
    biographies: {
      prefetch: true,
      query: GET_BIOGRAPHIES_BY_UNIT_QUERY,
      variables() {
        return {
          shortName: this.shortName,
        };
      },
      error(error) {
        this.error = JSON.stringify(error.message);
        this.loading = false;
        NProgress.done();
      },
      result(ApolloQueryResult) {
        //console.log(ApolloQueryResult);

        //console.log(this.id);
        this.staff = ApolloQueryResult.data.biographies;
        this.staff = _.orderBy(this.staff, ["sortModifier"], ["asc"]);

        NProgress.done();
        attachInternalLinks(this);
        attachSearchEvents(this);
      },
    },
  },
};
</script>

<style lang="scss" scoped></style>
