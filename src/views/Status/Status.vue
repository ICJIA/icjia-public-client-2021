<template>
  <div>
    <v-container class="markdown-body">
      <v-row>
        <v-col>
          <div v-if="!loading && items">
            <div
              class="text-left mb-2 mt-2"
              style="font-size: 14px; font-weight: 700"
            >
              Monitoring {{ statusLength }} ICJIA API servers and sites.
            </div>
            <v-data-table
              :headers="headers"
              :items="items"
              :items-per-page="-1"
              class="elevation-3 hover mb-8 statusTable"
              item-key="name"
              hide-default-footer
            >
              <template v-slot:item.name="{ item }">
                <strong>{{ item.name }}</strong>
              </template>

              <template v-slot:item.badgeID="{ item }">
                <img
                  v-if="item.badgeID"
                  :src="`https://api.netlify.com/api/v1/badges/${item.badgeID}/deploy-status`"
                  :alt="`Netlify build status image for ${item.name}`"
                />
              </template>

              <template v-slot:item.status="{ item }">
                <v-chip class="ma-2" dark :color="getStatusColor(item.status)">
                  <strong> {{ item.status }}</strong>
                </v-chip>
              </template>
            </v-data-table>
          </div>
          <div v-if="loading" class="text-center mt-12">
            <div style="font-weight: 900; font-size: 14px">Fetching status</div>
            <v-progress-circular
              indeterminate
              color="primary"
              size="50"
              class="mt-12"
            ></v-progress-circular>
          </div>
          <div v-if="errorMsg && !items" class="text-center">
            <v-alert type="error"> {{ errorMsg }} </v-alert>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */

import _ from "lodash";
import axios from "axios";
import NProgress from "nprogress";
// import { addButtonText, fixBlankTableHeadings } from "@/a11y";
export default {
  data() {
    return {
      alert: true,
      statusServerURL: "https://status.icjia-api.cloud",
      greenStatus: [200, 204, 301, 302],
      loading: true,
      items: null,
      errorMsg: null,
      expanded: [],
      singleExpand: true,
      statusLength: null,
      headers: [
        {
          text: "Name",
          align: "start",
          sortable: true,
          value: "name",
        },

        { text: "Status", value: "status", align: "center" },
        { text: "Response", value: "duration", align: "center" },
        { text: "Build Status", value: "badgeID", align: "center" },
        // { text: "Github", value: "github", align: "center" },
        // { text: "URL", value: "url", align: "center" },
      ],
    };
  },
  mounted() {},

  async created() {
    this.loading = true;
    NProgress.start();
    try {
      let { data } = await axios.get(`${this.statusServerURL}`);
      let status = data;

      let items = status.map((item) => {
        if (typeof item.status === "object") {
          if (item.status.code) {
            item.status = item.status.code;
          } else {
            item.status = null;
          }
        }

        item.url = `${item.proto}://${item.options.hostname}`;

        if (item.category !== "api") {
          item.url = item.url + item.options.path;
        }

        return item;
      });
      this.items = _.orderBy(items, "name", "asc");
      this.statusLength = this.items.length;
    } catch (e) {
      this.errorMsg = e.toString();
    }

    this.loading = false;

    NProgress.done();
  },
  watch: {
    async loading(newValue) {
      if (!newValue) {
        await this.$nextTick();
        this.fixA11Y();
      }
    },
  },
  methods: {
    fixA11Y() {
      // addButtonText("v-data-table__expand-icon", "Show/Hide information");
      // addButtonText("github", "Go to Github");
      // fixBlankTableHeadings();
      console.log("fix a11y for status here");
    },
    gotoSite(url) {
      window.open(url);
    },
    getStatusColor(status) {
      if (this.greenStatus.includes(status)) {
        return "green darken-4";
      } else {
        return "red darken-4";
      }
    },

    clicked(value) {
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
  props: {},
};
</script>

<style>
td {
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}
tr:nth-of-type(even) {
  background-color: rgba(0, 0, 0, 0.02);
}
.bold {
  font-weight: bold;
}
</style>
