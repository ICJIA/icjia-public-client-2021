<template>
  <div class="mt-10">
    <BaseContent :error="error" :loading="$apollo.loading">
      <template slot="content">
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-data-table
                :headers="meetingHeaders"
                :items="meetings"
                :single-expand="true"
                :expanded.sync="expanded"
                item-key="title"
                show-expand
                class="elevation-1 hover"
                :search="search"
                :sort-by.sync="sortBy"
                :sort-desc.sync="sortDesc"
                v-if="meetings"
                @click:row="clicked"
                :footer-props="{
                  'items-per-page-options': [100, 150, 200, 250],
                }"
                :items-per-page="150"
              >
                <template v-slot:item.start="{ item }">
                  <div
                    style="
                      width: 140px;
                      font-size: 14px;
                      font-weight: 700;
                      color: #555;
                    "
                  >
                    {{ item.start | dateFormat }}
                  </div>
                </template>
                <template v-slot:item.category="{ item }">
                  <div style="font-size: 14px; font-weight: 700; color: #555">
                    {{ getCleanCategory(item.category) }}
                  </div>
                </template>
                <template v-slot:expanded-item="{ headers, item }">
                  <td :colspan="headers.length">
                    <MeetingCard :item="item" class="mx-2 my-4"></MeetingCard>
                  </td>
                </template>

                <template v-slot:top>
                  <v-sheet class="px-5 py-5">
                    <h2>ICJIA Meetings</h2>
                    <v-text-field
                      v-model="search"
                      append-icon="mdi-magnify"
                      label="Search"
                      single-line
                      hide-details
                    ></v-text-field>
                  </v-sheet>
                </template>
              </v-data-table>
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

import { GET_ALL_MEETINGS_QUERY } from "@/graphql/meetings";

import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
import _ from "lodash";
export default {
  data() {
    return {
      sortBy: "start",
      sortDesc: true,
      search: "",
      loading: true,
      error: null,
      content: null,
      meetings: null,
      listing: null,
      units: null,
      tab: 0,
      staffToggle: 0,
      expanded: [],
      singleExpand: false,
      meetingHeaders: [
        { text: "Date", value: "start" },
        {
          text: "Category",
          align: "start",
          sortable: true,

          value: "category",
        },

        { text: "Title", value: "title" },
      ],
    };
  },

  created() {
    NProgress.start();
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
    getCleanCategory(category) {
      let categoryMap = this.$myApp.config.maps.meetings;
      let obj = categoryMap.find((o) => o.category === category);

      return obj.label;
    },
    clicked(value) {
      //console.log(value);
      if (value === this.expanded[0]) {
        this.expanded = [];
      } else {
        if (this.expanded.length) {
          this.expanded.shift();
          this.expanded.push(value);
        } else {
          this.expanded.push(value);
        }
      }
    },
  },
  apollo: {
    meetings: {
      prefetch: true,

      query: GET_ALL_MEETINGS_QUERY,
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
          ApolloQueryResult.data.meetings.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
            this.loading = false;
            NProgress.done();
          });
        } else {
          //console.log(this.id);
          this.meetings = ApolloQueryResult.data.meetings;
          this.meetings = _.orderBy(this.meetings, ["start"], ["desc"]);
          NProgress.done();
          attachInternalLinks(this);
          attachSearchEvents(this);
        }
      },
    },
  },
};
</script>
<style>
tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.02);
}
</style>
