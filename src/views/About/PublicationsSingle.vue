<template>
  <div class="markdown-body">
    <v-container>
      <v-row>
        <v-col>
          <h1 v-if="publication" class="sr-only">{{ publication.title }}</h1>
          <PublicationCard
            :item="publication"
            class="mt-8"
            v-if="publication"
          ></PublicationCard>
          <div class="mt-5 text-right">
            <v-btn small text to="/about/publications/"
              >View all publications&nbsp;&raquo;</v-btn
            >
          </div>
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
  name: "PublicationSingle",
  metaInfo() {
    return {
      title:
        this.publication && this.publication.title
          ? this.publication.title
          : null,
    };
  },
  data() {
    return {
      error: null,
      publication: null,
      allowedHost: "https://icjia.illinois.gov/researchhub",
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
          let publications = ApolloQueryResult.data.publications.map((e) => ({
            ...e,
            fullPath: `/about/publications/${e.slug}/`,
            contentType: "publication",
            localArticlePath:
              e.articleURL && e.articleURL.includes(this.allowedHost)
                ? e.articleURL.replace("https://icjia.illinois.gov", "")
                : null,
          }));

          //TODO: ad hoc mutations for URL capitalization
          publications.forEach((p) => {
            if (p.fileURL && p.fileURL.includes("/Compiler/")) {
              p.fileURL = p.fileURL.replace("/Compiler/", "/compiler/");
            }
            if (p.fileURL && p.fileURL.includes("/OGA/")) {
              p.fileURL = p.fileURL.replace("/OGA/", "/oga/");
            }
            if (p.fileURL && p.fileURL.includes("/researchreports/")) {
              p.fileURL = p.fileURL.replace(
                "/researchreports/",
                "/ResearchReports/"
              );
            }
          });
          this.publication = publications[0];
          NProgress.done();
        }
      },
    },
  },
};
</script>
