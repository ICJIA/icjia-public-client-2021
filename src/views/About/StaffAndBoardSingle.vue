<template>
  <div>
    <v-container v-if="item">
      <v-row>
        <v-col cols="12" class="mt-5">
          <h1 class="mb-4">{{ item.fullName }}<span v-if="item.suffix">, {{ item.suffix }}</span></h1>
          <BiographyCard :item="item" :showLink="false" :showName="false"></BiographyCard>

          <StaticSearch
            :query="item.fullName"
            :threshold="0.2"
            class="mt-10"
            :showStaticSearch="true"
            :hideBiography="true"
            :title="`Related Web Content`"
          ></StaticSearch>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import NProgress from "@/services/Progress";
// import { EventBus } from "@/event-bus";
import { renderToHtml } from "@/services/Markdown";
import { GET_SINGLE_BIOGRAPHY_QUERY } from "@/graphql/biographies";
import { attachInternalLinks, attachSearchEvents } from "@/utils/dom.js";
export default {
  name: "StaffSingle",
  metaInfo() {
    return {
      title: this.item && this.item.fullName ? this.item.fullName : null,
    };
  },
  data() {
    return {
      loading: true,
      error: null,
      item: null,
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
    biographies: {
      prefetch: true,

      query: GET_SINGLE_BIOGRAPHY_QUERY,
      variables() {
        return {
          slug: this.$route.params.slug,
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
          ApolloQueryResult.data.biographies.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
            this.loading = false;
            NProgress.done();
          });
        } else {
          //console.log(this.id);
          this.item = ApolloQueryResult.data.biographies[0];
          NProgress.done();
          attachInternalLinks(this);
          attachSearchEvents(this);
        }
      },
    },
  },
};
</script>
