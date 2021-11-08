<template>
  <!-- eslint-disable vue/no-v-html -->
  <div>
    <v-img :height="splashHeight" :src="article.splash">
      <template #placeholder>
        <v-row class="fill-height" align="center" justify="center">
          <v-progress-circular indeterminate />
        </v-row>
      </template>
    </v-img>

    -
    <!-- <img
      :src="article.splash"
      style="width: 100%; object-fit: cover; height: 400px"
    /> -->

    <v-row no-gutters>
      <v-col md="4" lg="3" class="hidden-sm-and-down">
        <div
          class="article-toc text-center"
          :class="{ 'article-toc-sticky': isTOCSticky }"
        >
          <ArticleToc
            v-if="headings && headings.length"
            v-scroll="onScrollTOC"
            class="mb-12 text-left"
            :headings="headings"
            :active-heading="activeHeading"
          />

          <v-btn
            v-if="article.mainfile"
            class="article-download"
            @click="downloadHelper('main')"
          >
            <template>{{ article.mainfiletype }}</template>
            <v-icon>download</v-icon>
          </v-btn>

          <v-btn
            v-if="article.extrafile"
            class="article-download"
            @click="downloadHelper('extra')"
          >
            <template>{{ "appendix" }}</template>
            <v-icon>download</v-icon>
          </v-btn>
        </div>
      </v-col>

      <v-col id="article-content" class="pt-6 article-content" md="8" lg="9">
        <v-col cols="12" sm="10" lg="9" offset-sm="1" offset-md="0">
          <v-row align="center" justify="space-between" no-gutters>
            <div>
              <!-- <span class="font-lato text-uppercase">{{
                article.categories
              }}</span> -->
              <span v-if="item.categories && item.categories.length">
                <span
                  v-for="(category, index) in item.categories"
                  :key="index"
                  class="mr-1 category"
                  style="font-size: 14px; font-weight: 900"
                  @click.prevent.stop="categoryClick($event)"
                  >{{ category.toUpperCase() }}</span
                >
              </span>

              <template v-if="article.tags">
                <span class="mx-2">|</span>

                <BasePropChip v-for="tag of article.tags" :key="tag">
                  <template>{{ tag }}</template>
                </BasePropChip>
              </template>
            </div>
          </v-row>

          <MarkerExternal v-if="article.external" />

          <h1 class="article-title">{{ article.title }}</h1>

          <div
            class="article-abstract my-6 px-5 py-5"
            style=""
            v-html="article.abstract"
          ></div>

          <div class="mb-4 text-uppercase font-oswald">
            <span v-for="(author, i) in article.authors" :key="i">
              <template v-if="i > 0">{{
                article.authors.length > i + 1 ? ", " : " and "
              }}</template>
              <a @click="openSearch(author.title)">{{ author.title }}</a>
            </span>

            <span v-if="article.date">
              <span class="mx-2">|</span>
              <template>{{ article.date }}</template>
            </span>

            <span class="mx-2">|</span>
            <v-icon
              class="article-print"
              aria-label="Print"
              @click="printArticle"
            >
              <template>printer</template>
            </v-icon>
          </div>

          <v-divider></v-divider>

          <div
            v-scroll="onScroll"
            class="article-body"
            v-html="article.html"
            ref="main"
          />

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
                      <template>{{ `[DATASET] ${dataset.title}` }}</template>
                    </router-link>
                  </li>
                </ul>
              </template>
            </BaseInfoBlock>
          </div>
        </v-col>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { format } from "@/utils/itemFormatter";
import { createMarkdownUtils, initMarkdownIt } from "@/utils/markdownIt";
import { initTexmath } from "@/utils/texmath";
import { EventBus } from "@/event-bus";

export default {
  sync: false,
  watch: {
    // eslint-disable-next-line no-unused-vars
    $route(to, from) {
      console.log("article component here");
    },
  },
  props: {
    item: {
      type: Object,
      default() {
        return {
          abstract: null,
          apps: null,
          authors: null,
          categories: null,
          citation: null,
          datasets: null,
          date: null,
          doi: null,
          external: null,
          extrafile: null,
          funding: null,
          images: null,
          mainfile: null,
          mainfiletype: null,
          markdown: null,
          splash: null,
          tags: null,
          title: null,
        };
      },
    },
    downloader: {
      type: Function,
      default() {},
    },
    preview: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      activeHeading: "introduction",
      baseUrl: "localhost:8080/",
      isTOCSticky: false,
      markdownUtils: {},
      viewTitleHeight: 60 + 80,
    };
  },
  computed: {
    article() {
      return format(this.item);
    },

    hasAuthorInfo() {
      const { authors } = this.item;
      return authors.filter((el) => el.description).length > 0;
    },
    hasRelated() {
      const { apps, datasets } = this.item;
      return (apps && apps.length) || (datasets && datasets.length);
    },
    headings() {
      const { markdown } = this.item;
      const { parseHeadings } = this.markdownUtils;
      let headings = markdown && parseHeadings ? parseHeadings(markdown) : null;
      return headings;
    },

    splashHeight() {
      const { xs, sm } = this.$vuetify.breakpoint;

      if (xs) return 240;
      else if (sm) return 360;
      else return 480;
    },
  },
  async created() {
    await initTexmath();
    // eslint-disable-next-line no-undef
    const md = initMarkdownIt().use(texmath.use(katex));
    this.markdownUtils = createMarkdownUtils(md);
  },
  methods: {
    openSearch(item) {
      let opts = {
        query: item,
        type: "hub",
      };
      EventBus.$emit("search", opts);
    },
    categoryClick(e) {
      //console.log("chip click: ", e.target.innerHTML);
      let opts = {
        query: e.target.innerText.toLowerCase(),
        type: "hub",
      };
      EventBus.$emit("search", opts);
    },
    async downloadHelper(type) {
      await this.downloader(type);
    },
    onScroll(e) {
      if (typeof window === "undefined" || this.headings === null) return;

      const top = window.pageYOffset || e.target.scrollTop || 0;
      const headings = this.headings;

      if (headings.length && top === 0) {
        this.activeHeading = headings[0].id;
      } else {
        headings.forEach((heading) => {
          let elHeading = this.$el.querySelector(`#${heading.id}`);
          let rect = elHeading.getBoundingClientRect();
          if (rect.top < 181 && this.activeHeading !== heading.id) {
            this.activeHeading = heading.id;
          }
        });
      }
    },
    onScrollTOC(e) {
      if (typeof window === "undefined") return;
      const top = window.pageYOffset || e.target.scrollTop || 0;
      const threshold = this.splashHeight + this.viewTitleHeight + 20;

      this.isTOCSticky = top > threshold;
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
  },
  beforeDestroy() {
    window.jQuery('[id*="fnref"]').off("click", (e) => {
      e.preventDefault();
      this.$vuetify.goTo(`#${e.target.href.split("#").pop()}`, { offset: 50 });
    });
    window.jQuery(".footnote-backref").off("click", (e) => {
      e.preventDefault();
      this.$vuetify.goTo(`#${e.target.href.split("#").pop()}`, { offset: 50 });
    });
    console.log("click events removed");
  },
  async mounted() {
    EventBus.$emit("context-label", this.item.title);
    await this.$nextTick(() => {
      window.jQuery('[id*="fnref"]').on("click", (e) => {
        e.preventDefault();
        this.$vuetify.goTo(`#${e.target.href.split("#").pop()}`, {
          offset: 50,
        });
      });
      window.jQuery(".footnote-backref").on("click", (e) => {
        e.preventDefault();
        this.$vuetify.goTo(`#${e.target.href.split("#").pop()}`, {
          offset: 50,
        });
      });
    });
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
