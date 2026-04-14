<template>
  <div class="markdown-body">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-container fluid v-if="allPrograms">
            <v-row>
              <v-col cols="12">
                <div class="page-heading">
                  <h1 id="icjia-grant-programs">Funded Programs</h1>
                </div>
                <p class="mb-8">
                  ICJIA administers a variety of federal grant programs. Most
                  federal awards to states may be spent over a three-year
                  period. Federal funds disbursed during the fiscal year may
                  differ from the total designated to each program.
                </p>
              </v-col>

              <v-col
                cols="12"
                class="mb-6 page-heading"
                style="margin-top: -25px"
              >
                <v-btn-toggle v-model="toggle_category" mandatory class="mb-4">
                  <v-btn small elevation="1" class="button-weight">
                    All Programs
                  </v-btn>

                  <v-btn small elevation="1" class="button-weight">
                    Federal
                  </v-btn>
                  <v-btn small elevation="1" class="button-weight">
                    State
                  </v-btn>
                </v-btn-toggle>

                <span class="hidden-sm-and-down"
                  >&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span
                >
                <v-btn-toggle v-model="toggle_status" mandatory class="mb-4">
                  <v-btn small elevation="1" class="button-weight">
                    Current
                  </v-btn>

                  <v-btn small elevation="1" class="button-weight">
                    Archived
                  </v-btn>
                </v-btn-toggle>
              </v-col>

              <v-col>
                <div
                  v-for="program in filteredAndSortedPrograms"
                  :key="program.id"
                  class="mb-6"
                >
                  <BaseCardExpandable
                    :item="program"
                    :openSearch="true"
                    :showLink="false"
                  ></BaseCardExpandable></div
              ></v-col>
            </v-row>
          </v-container>
          <v-container v-else>
            <v-row>
              <v-col>
                <Loader></Loader>
              </v-col>
            </v-row>
          </v-container>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import { attachInternalLinks } from "@/utils/dom";
import { EventBus } from "@/event-bus";
import { GET_ALL_PROGRAMS_QUERY } from "@/graphql/grants";
import { renderToHtml } from "@/services/Markdown";
import { getUnifiedTags } from "@/utils/content";
import _ from "lodash";
import NProgress from "@/services/Progress";

export default {
  name: "FSGUPrograms",
  metaInfo() {
    return {
      title: "Funded Programs",
    };
  },
  data() {
    return {
      contentLoading: true,
      content: null,
      unit: null,
      allPrograms: null,
      allGrants: null,
      filteredAndSortedPrograms: [],
      filteredAndSortedGrants: [],
      category: "all",
      toggle_category: 0,
      toggle_status: 0,
      toggle_nofoStatus: 0,
      status: "current",
    };
  },
  watch: {
    toggle_category(newVal) {
      if (newVal === 0) {
        this.category = "all";
        this.filterPrograms();
      }
      if (newVal === 1) {
        this.category = "federal";
        this.filterPrograms();
      }
      if (newVal === 2) {
        this.category = "state";
        this.filterPrograms();
      }
    },
    toggle_status(newVal) {
      if (newVal === 0) {
        this.status = "current";
        this.filterPrograms();
      }
      if (newVal === 1) {
        this.status = "archived";
        this.filterPrograms();
      }
    },
  },
  async mounted() {
    NProgress.start();
    //console.log("fetch here");
    EventBus.$emit("context-label", "Funded Programs");
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },

    filterPrograms() {
      this.filteredAndSortedPrograms = this.allPrograms.filter((program) => {
        if (this.category === "all") {
          return (this.filteredAndSortedPrograms =
            program.status === this.status);
        } else {
          return (
            program.category === this.category && program.status === this.status
          );
        }
      });
    },
  },
  apollo: {
    programs: {
      prefetch: true,

      query: GET_ALL_PROGRAMS_QUERY,
      variables() {
        return {};
      },
      error(error) {
        this.error = JSON.stringify(error.message);
        NProgress.done();
      },
      result(ApolloQueryResult) {
        if (
          ApolloQueryResult.data &&
          ApolloQueryResult.data.programs.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          //   this.$router.push("/404").catch((err) => {
          //     console.log(err);
          //   });
          console.log(ApolloQueryResult);
        } else {
          //console.log(this.id);

          this.allPrograms = _.orderBy(ApolloQueryResult.data.programs, [
            "title",
          ]);
          this.allPrograms = getUnifiedTags(this.allPrograms);
          this.allPrograms = this.allPrograms.map((e) => ({
            ...e,
            fullPath: `/grants/programs/${e.slug}/`,
            contentType: "program",
          }));

          this.filterPrograms();
          NProgress.done();
        }
      },
    },
  },
};
</script>
