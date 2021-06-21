<template>
  <div id="article-view">
    <BaseContent
      :error="error"
      :loading="loading"
      style="background: #fff; height: 100vh"
      loaderType="skeleton"
    >
      <template slot="content" v-if="!loading">
        <v-img
          v-if="article && article.id"
          :src="article.splash"
          :lazy-src="article.thumbnail"
          width="150%"
          :height="splashHeight"
          class="mb-5"
          :ref="'img_' + article.id"
          style="border: 1px solid #fafafa"
          alt="ICJIA Research Hub image"
          ><template #placeholder>
            <v-row class="fill-height ma-0" align="center" justify="center">
              <v-progress-circular
                indeterminate
                color="blue darken-3"
                aria-label="progress"
              ></v-progress-circular>
            </v-row>
          </template>
        </v-img>
        <v-container fluid>
          <v-row>
            <v-col cols="12" md="3">
              <div class="article-toc">
                <HubArticleToc
                  v-if="
                    headings &&
                    headings.length &&
                    !$vuetify.breakpoint.sm &&
                    !$vuetify.breakpoint.xs
                  "
                  class="mb-12"
                  :headings="headings"
                  :active-heading="activeHeading"
                />

                <v-btn
                  v-if="article.mainfile"
                  outlined
                  block
                  elevation="2"
                  class="article-download"
                  @click="downloadHelper('main')"
                  style="font-weight: 900; background: #eee"
                >
                  <template>Download {{ article.mainfiletype }}</template>
                  <v-icon right>download</v-icon>
                </v-btn>

                <v-btn
                  v-if="article.extrafile"
                  elevation="2"
                  outlined
                  block
                  class="article-download"
                  style="font-weight: 900; background: #eee"
                  @click="downloadHelper('extra')"
                >
                  <template>{{ "appendix" }}</template>
                  <v-icon right>download</v-icon>
                </v-btn>
              </div>
            </v-col>
            <v-col
              cols="12"
              md="9"
              id="article-content"
              class="article-content"
            >
              <h1 class="article-title">{{ article.title }}</h1>
              <div class="article-abstract px-5 py-5 my-6">
                {{ article.abstract }}
              </div>
              <div class="mb-4 text-uppercase font-oswald">
                <span v-for="(author, i) in article.authors" :key="i">
                  <template v-if="i > 0">{{
                    article.authors.length > i + 1 ? ", " : " and "
                  }}</template>
                  <a @click="$emit('author-click', $event)">{{
                    author.title
                  }}</a>
                </span>

                <span v-if="article.date">
                  <span class="mx-2">|</span>
                  <template>{{ article.date | format }}</template>
                </span>

                <span class="mx-2">|</span>
                <v-icon
                  class="article-print"
                  aria-label="Print"
                  @click="printArticle"
                  >print</v-icon
                >
              </div>
              <div v-html="html" class="article-body" v-scroll="onScroll"></div>

              <div class="my-12">
                <BaseInfoBlock v-if="hasAuthorInfo" :large="true">
                  <template #title>{{
                    `About the author${article.authors.length > 1 ? "s" : ""}`
                  }}</template>
                  <template #text>
                    <p
                      v-for="(author, i) in article.authors"
                      :key="`authorinfo${i}`"
                    >
                      <template>{{ author.description }}</template>
                    </p>
                  </template>
                </BaseInfoBlock>
                <BaseInfoBlock v-if="article.funding" :large="true">
                  <template #title>{{ "Funding acknowledgment" }}</template>
                  <template #text>{{ article.funding }}</template>
                </BaseInfoBlock>

                <BaseInfoBlock v-if="article.citation" :large="true">
                  <template #title>{{ "Suggested citation" }}</template>
                  <template #text>
                    <span v-html="article.citation"></span>
                    <a
                      v-if="article.doi"
                      :href="article.doi"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <template>{{ ` ${article.doi}` }}</template>
                    </a>
                  </template>
                </BaseInfoBlock>

                <BaseInfoBlock v-if="hasRelated" :large="true">
                  <template #title>{{ "Related contents" }}</template>
                  <template #text>
                    <ul>
                      <li v-for="(app, i) in article.apps" :key="`app${i}`">
                        <router-link :to="preview ? '' : `/apps/${app.slug}`">
                          <template>{{ `[APP] ${app.title}` }}</template>
                        </router-link>
                      </li>
                      <li
                        v-for="(dataset, i) in article.datasets"
                        :key="`dataset${i}`"
                      >
                        <router-link
                          :to="preview ? '' : `/datasets/${dataset.slug}`"
                        >
                          <template>{{
                            `[DATASET] ${dataset.title}`
                          }}</template>
                        </router-link>
                      </li>
                    </ul>
                  </template>
                </BaseInfoBlock>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </BaseContent>
  </div>
</template>

<script>
import NProgress from "nprogress";
import { renderToHtml, parseHeadings } from "@/services/Markdown";
import { getImageURL } from "@/services/Image";
const axios = require("axios");
const api = axios.create({
  baseURL: "https://researchhub.icjia-api.cloud",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  NProgress.start();
  return config;
});

api.interceptors.response.use((response) => {
  NProgress.done();
  return response;
});
export default {
  data() {
    return {
      article: null,
      error: null,
      loading: true,

      imageOK: true,
      html: null,
      activeHeading: "introduction",
      isTOCSticky: false,
    };
  },
  methods: {
    async downloadHelper(type) {
      const { hash, ext } = this.article[`${type}file`];
      window.open(
        `https://icjia.illinois.gov/researchhub/files/${hash}${ext}`,
        "_blank"
      );
      // console.log(hash, ext);
      //console.log(type, this.article);
    },
    onScroll(e) {
      // console.log("onScroll");
      if (typeof window === "undefined" || this.headings === null) return;
      const top = window.pageYOffset || e.target.scrollTop || 0;
      const headings = this.headings;
      if (headings.length && top === 0) {
        this.activeHeading = headings[0].id;
      } else {
        headings.forEach((heading) => {
          let elHeading = this.$el.querySelector(`#${heading.id}`);
          let rect = elHeading.getBoundingClientRect();
          if (rect.top < 91 && this.activeHeading !== heading.id) {
            this.activeHeading = heading.id;
          }
        });
      }
    },

    printArticle() {
      const fonts =
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Gentium+Book+Basic&amp;display=swap">' +
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Lato:300,400&display=swap">' +
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Oswald&display=swap">';
      const nodes = document.querySelectorAll('link[rel="stylesheet"], style');
      const style = Array.from(nodes)
        .map((el) => el.outerHTML)
        .join("");
      const content = document.getElementById("article-content").innerHTML;
      this.printWindow({ head: fonts + style, body: content });
    },
    printWindow({ head, body }) {
      const win = window.open("", "");
      const toWrite =
        `<head>${head}</head>` +
        `<body><div id="app" class="v-application"><div id="article-view">${body}</div></div></body>`;
      `<script>window.print();<` + `/script>`;
      win.document.write(toWrite);
      win.document.close();
      win.focus();
    },
    async downloader(type) {
      // const { hash, ext } = this.item[`${type}file`]
      // window.open(process.env.BASE_URL + `files/${hash}${ext}`, '_blank')
      console.log(type);
    },
    addImages(images, markdown) {
      return `${markdown}${images
        .map((i) => `\n\n[${i.title}]: ${i.src}`)
        .join("\n")}`;
    },
    render(content) {
      let html = renderToHtml(content);
      return html;
    },
    getImagePath(url, imgWidth = 0, imgHeight = 0, imageQuality = 50) {
      let imgPath;

      imgPath = `${url}`;

      const thumborImgPath = getImageURL(
        imgPath,
        imgWidth,
        imgHeight,
        imageQuality
      );
      // console.log(thumborImgPath);
      return thumborImgPath;
    },
  },
  beforeDestroy() {
    window.jQuery('[id*="fnref"]').off("click", (e) => {
      e.preventDefault();
      this.$vuetify.goTo(`#${e.target.href.split("#").pop()}`);
    });
    window.jQuery(".footnote-backref").off("click", (e) => {
      e.preventDefault();
      this.$vuetify.goTo(`#${e.target.href.split("#").pop()}`);
    });
    console.log("click events removed");
  },
  computed: {
    splashHeight() {
      const { xs, sm } = this.$vuetify.breakpoint;
      if (xs) return 240;
      else if (sm) return 360;
      else return 480;
    },
    headings() {
      let headings = parseHeadings(this.article.md);
      return headings;
    },
    hasAuthorInfo() {
      const { authors } = this.article;
      return authors.filter((el) => el.description).length > 0;
    },
    hasRelated() {
      const { apps, datasets } = this.article;
      return (apps && apps.length) || (datasets && datasets.length);
    },
  },
  async mounted() {
    const query = `query {
      articles (where: { status: "published", slug: "${this.$route.params.slug}" }) {
      id
      mainfiletype
      mainfile {
        name
        hash
        ext
        url
      }
      extrafile {
        name
        hash
        ext
        url
      }
      title
      status
      slug
      date
      external
      categories
      tags
      authors
      images
      abstract
      markdown
      splash
      thumbnail
      citation
      funding
  }
 
}`;
    try {
      let article = await api.post("/graphql", {
        query,
        validateStatus: function (status) {
          return status >= 200 && status < 300;
        },
      });
      this.article = article.data.data.articles[0];

      if (this.article.images) {
        this.article.md = this.addImages(
          this.article.images,
          this.article.markdown
        );
      } else {
        this.article.md = this.article.markdown;
      }
      this.html = this.render(this.article.md);

      NProgress.done();
      this.loading = false;
      await this.$nextTick(() => {
        window.jQuery('[id*="fnref"]').on("click", (e) => {
          e.preventDefault();
          this.$vuetify.goTo(`#${e.target.href.split("#").pop()}`);
        });
        window.jQuery(".footnote-backref").on("click", (e) => {
          e.preventDefault();
          this.$vuetify.goTo(`#${e.target.href.split("#").pop()}`);
        });
      });
    } catch (e) {
      console.log(e);
      this.error = e;
      NProgress.done();
      this.loading = false;
    }
  },
};
</script>

<style>
.article-figure {
  margin-left: auto !important;
  margin-right: auto !important;
  text-align: center !important;
  padding: 24px 12px !important;
}
@import url("https://fonts.googleapis.com/css2?family=Gentium+Book+Basic:ital@0;1&family=Lato:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=Oswald:wght@400;500;600;700&display=swap");
</style>
