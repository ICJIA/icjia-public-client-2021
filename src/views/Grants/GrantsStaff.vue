<template>
  <div>
    <v-container class="pt-10 pb-12 markdown-body">
      <v-row>
        <v-col>
          <h1>Federal and State Grants Unit Staff</h1>
        </v-col>
      </v-row>
    </v-container>

    <div v-if="!loading" class="mb-12 markdown-body">
      <v-container>
        <v-row>
          <v-col class="text-left" style="margin-top: -35px">
            <div style="font-weight: 900; font-size: 12px" class="mb-12">
              Showing: {{ content.length }} of {{ content.length }} R&A staff
              members
            </div>
          </v-col>
          <v-col v-for="(item, i) in content" :key="i" cols="12">
            <v-card elevation="0" data-aos="fade-up">
              <div class="d-flex flex-no-wrap">
                <v-avatar
                  class="ma-3"
                  size="125"
                  tile
                  v-if="item.headshot && item.headshot.url"
                >
                  <v-img
                    :src="`https://agency.icjia-api.cloud${item.headshot.formats.thumbnail.url}`"
                    :lazy-src="`https://agency.icjia-api.cloud${item.headshot.formats.thumbnail.url}`"
                  ></v-img>
                </v-avatar>
                <div>
                  <v-card-title
                    class="text-h5 author-name hover"
                    @click="search(item.fullName)"
                    >{{ item.fullName }}<span v-if="item.suffix">,&nbsp;</span
                    >{{ item.suffix }}</v-card-title
                  >

                  <v-card-subtitle v-text="item.title"></v-card-subtitle>
                  <v-card-text class="text-left">{{ item.body }} </v-card-text>
                </div>
              </div>
            </v-card>
            <!-- <div v-if="item.sortModifier < 100" class="mt-1"></div> -->
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
import NProgress from "nprogress";
import { EventBus } from "@/event-bus";
import { renderToHtml } from "@/services/Markdown";
import { GET_BIOGRAPHIES_BY_UNIT_QUERY } from "@/graphql/biographies";
import _ from "lodash";
export default {
  data() {
    return {
      loading: true,
      error: null,
      content: null,
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
      let opts = {
        query: name,
        type: "hub",
      };
      EventBus.$emit("search", opts);
    },
  },
  apollo: {
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
