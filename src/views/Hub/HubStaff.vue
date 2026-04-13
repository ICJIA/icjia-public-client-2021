<template>
  <div>
    <v-container class="markdown-body">
      <v-row>
        <v-col>
          <h1>Research & Analysis Staff</h1>
        </v-col>
      </v-row>
    </v-container>

    <div v-if="!loading" class="mb-12 markdown-body">
      <v-container>
        <v-row>
          <v-col class="text-left" style="margin-top: -50px">
            <div v-if="unit" v-html="render(unit.body)"></div>
            <!-- <div style="font-weight: 900; font-size: 12px" class="mb-12">
              Showing: {{ content.length }} of {{ content.length }} R&A staff
              members
            </div> -->
          </v-col>
          <v-col v-for="(item, i) in content" :key="i" cols="12">
            <BiographyCard :item="item" class="mb-0"></BiographyCard>
          </v-col>
        </v-row>
      </v-container>
    </div>
    <div v-else>
      <Loader loaderType="skeleton" :repeat="1"></Loader>
    </div>
  </div>
</template>

<script>
import NProgress from "@/services/Progress";
import { EventBus } from "@/event-bus";
import { goToSearch } from "@/utils/search";
import { renderToHtml } from "@/services/Markdown";
import { GET_BIOGRAPHIES_BY_UNIT_QUERY } from "@/graphql/biographies";
import { GET_SINGLE_UNIT_QUERY } from "@/graphql/units";
import _ from "lodash";
import BiographyCard from "../../components/BiographyCard.vue";
export default {
  components: { BiographyCard },
  data() {
    return {
      loading: true,
      error: null,
      content: null,
      unit: null,
    };
  },
  created() {
    NProgress.start();
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
    search(name) {
      goToSearch(this.$router, { query: name, type: "hub" });
    },
  },
  apollo: {
    units: {
      prefetch: true,

      query: GET_SINGLE_UNIT_QUERY,
      variables() {
        return {
          slug: "research-and-analysis-unit",
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
      //   fetchPolicy: "no-cache",
      query: GET_BIOGRAPHIES_BY_UNIT_QUERY,
      variables() {
        return {
          shortName: "R&A",
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
          EventBus.$emit("context-label", "Staff");
        }
      },
    },
  },
};
</script>
