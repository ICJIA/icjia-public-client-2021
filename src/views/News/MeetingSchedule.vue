<template>
  <div>
    <v-container v-if="myData"
      ><v-row
        ><v-col cols="12">
          <h1>Meeting Schedules</h1>
          <p>Published beginning of fiscal year 2024.</p>

          <div class="mt-10 pl-2">
            <ul>
              <li
                v-for="attachment in myData.pages[0].attachments"
                :key="attachment.id"
                style="font-size: 14px"
              >
                <a
                  target="_blank"
                  :href="'https://agency.icjia-api.cloud' + attachment.url"
                  >{{ attachment.name }}
                </a>
              </li>
            </ul>
          </div></v-col
        ></v-row
      ></v-container
    >
  </div>
</template>
<script>
import NProgress from "nprogress";
import { renderToHtml } from "@/services/Markdown";
import { GET_SINGLE_PAGE_QUERY } from "@/graphql/page";

// import { th } from "date-fns/locale";
// const _ = require("lodash");
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
      hideUpdated: false,
      myData: null,
      mySortedData: null,
      myTitles: null,
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
  mounted() {},
  apollo: {
    pages: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_SINGLE_PAGE_QUERY,
      variables() {
        return {
          slug: "meeting-schedules",
        };
      },

      /*************  ✨ Codeium Command 🌟  *************/
      result(ApolloQueryResult) {
        let sortedAttachments = [];
        if (ApolloQueryResult && ApolloQueryResult.data) {
          console.log("Result:", ApolloQueryResult.data);
          this.myData = ApolloQueryResult.data;
          // this.Mydata = this.myData.pages[0].attachments[2].name = "test title";

          sortedAttachments = this.myData.pages[0].attachments.sort((a, b) => {
            return a.name.localeCompare(b.name);
          });
        } else {
          console.error("ApolloQueryResult or data is null");
          this.error = "Failed to load data";
        }
        console.log("Sorted Attachments:", sortedAttachments);
        NProgress.done();
      },
      /******  430c8a6c-1a7e-4617-bff2-0782bf521f19  *******/
      error(error) {
        this.error = JSON.stringify(error.message);
        this.loading = false;
        NProgress.done();
      },
    },
  },
};
</script>
