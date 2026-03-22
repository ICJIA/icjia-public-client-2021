<template>
  <div class="pb-12">
    <v-container v-if="program" class="mt-8">
      <v-row>
        <v-col>
          <h1 class="sr-only">{{ program.title }}</h1>
          <BaseCardExpandable
            :item="program"
            :showLink="false"
          ></BaseCardExpandable>
          <StaticSearch
            :query="program.title"
            :threshold="0.3"
            class="mt-10"
            :showStaticSearch="true"
            :title="`Related to ${program.title}`"
          ></StaticSearch
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
  </div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import { attachInternalLinks } from "@/utils/dom";
import { EventBus } from "@/event-bus";
import { GET_SINGLE_PROGRAM_QUERY } from "@/graphql/grants";
import { renderToHtml } from "@/services/Markdown";
// import _ from "lodash";
import { getUnifiedTags } from "@/utils/content";
import NProgress from "nprogress";

export default {
  name: "ProgramSingle",
  metaInfo() {
    return {
      title: this.program && this.program.title ? this.program.title : null,
    };
  },
  data() {
    return {
      program: null,
    };
  },

  async mounted() {
    NProgress.start();
    //console.log("fetch here");
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
  },
  apollo: {
    programs: {
      prefetch: true,

      query: GET_SINGLE_PROGRAM_QUERY,
      variables() {
        return {
          slug: this.$route.params.slug,
        };
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
          this.$router.push("/404").catch((err) => {
            console.log(err);
          });
        } else {
          //console.log(this.id);

          this.program = this.programs.map((e) => ({
            ...e,
            fullPath: `/grants/programs/${e.slug}/`,
            contentType: "program",
          }));
          this.program = getUnifiedTags(this.program);
          this.program = this.program[0];
          EventBus.$emit("context-label", this.program.title);
          NProgress.done();
        }
      },
    },
  },
};
</script>
