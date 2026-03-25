<template>
  <div>
    <div v-if="!loading" class="mb-12 markdown-body">
      <v-container>
        <v-row>
          <v-col cols="12">
            <h1>Federal and State Grants Unit Staff</h1>
            <div v-html="render(unit.summary)"></div
          ></v-col>
          <v-col class="text-left" cols="12">
            <!-- <div style="font-weight: 900; font-size: 12px" class="mb-12">
              Showing: {{ content.length }} of {{ content.length }} R&A staff
              members
            </div> -->
          </v-col>
          <v-col v-for="(item, i) in content" :key="i" cols="12">
            <BiographyCard :item="item" />
          </v-col>
        </v-row>
      </v-container>
    </div>
    <div v-else>
      <Loader :repeat="1"></Loader>
    </div>
  </div>
</template>

<script>
import NProgress from "@/services/Progress";
import { EventBus } from "@/event-bus";
import { renderToHtml } from "@/services/Markdown";
import { GET_BIOGRAPHIES_BY_UNIT_QUERY } from "@/graphql/biographies";
import { GET_SINGLE_UNIT_QUERY } from "@/graphql/units";
import _ from "lodash";
export default {
  name: "FSGUStaff",
  metaInfo() {
    return {
      title: "Federal and State Grants Unit Staff",
    };
  },
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
  mounted() {
    EventBus.$emit("context-label", "Staff");
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
    search(name) {
      let opts = {
        query: name,
        type: "hub",
      };
      EventBus.$emit("search", opts);
    },
  },
  apollo: {
    units: {
      prefetch: true,

      query: GET_SINGLE_UNIT_QUERY,
      variables() {
        return {
          slug: "federal-and-state-grants-unit",
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
          shortName: "FSGU",
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
        }
      },
    },
  },
};
</script>
<style></style>
