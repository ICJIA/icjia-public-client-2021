<template>
  <div class="markdown-body">
    <v-container>
      <v-row>
        <v-col>
          <PublicationCard :item="publication" class="mt-8"></PublicationCard>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import NProgress from "nprogress";
import { renderToHtml } from "@/services/Markdown";
import { GET_SINGLE_PUBLICATION_QUERY } from "@/graphql/publications";
export default {
  data() {
    return {
      error: null,
      publication: null,
    };
  },
  computed: {},
  created() {
    NProgress.start();
  },
  methods: {
    render(content) {
      return renderToHtml(content);
    },
  },
  apollo: {
    publications: {
      prefetch: true,
      fetchPolicy: "no-cache",
      query: GET_SINGLE_PUBLICATION_QUERY,
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
          ApolloQueryResult.data.publications.length > 0 === false
        ) {
          // eslint-disable-next-line no-unused-vars
          this.$router.push("/404").catch((err) => {
            console.log(err);
          });
        } else {
          //console.log(this.id);
          let publications = ApolloQueryResult.data.publications;
          this.publication = publications.map((e) => ({
            ...e,
            fullPath: `/about/publications/${e.slug}/`,
            contentType: "publication",
            localArticlePath:
              e.articleURL &&
              e.articleURL.includes("https://icjia.illinois.gov/researchhub")
                ? e.articleURL.replace("https://icjia.illinois.gov", "")
                : null,
          }));
          this.publication = this.publication[0];
          NProgress.done();
        }
      },
    },
  },
};
</script>
