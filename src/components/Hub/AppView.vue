<template>
  <div>
    <v-container class="markdown-body pb-12">
      <v-row>
        <v-col cols="12">
          <v-card
            class="px-3 py-5"
            color="#fafafa"
            style="border: 1px solid #ddd"
          >
            <h1 style="border: 0px">{{ app.title }}</h1>

            <v-row class="py-10" style="margin-top: -55px">
              <v-col cols="12" md="4"
                ><v-img
                  :src="app.image"
                  :min-height="350"
                  style="border: 1px solid #eee"
                  class="mt-3"
                >
                  <template #placeholder>
                    <v-row class="fill-height" align="center" justify="center">
                      <v-progress-circular indeterminate aria-label="Loading image" />
                    </v-row>
                  </template> </v-img
              ></v-col>
              <v-col
                class="px-6 pb-6"
                :class="app.external ? 'pt-0' : 'pt-6'"
                cols="12"
                md="8"
              >
                <MarkerExternal v-if="app.external" />

                <BasePropDisplay name="Updated">
                  <template>{{ app.date }}</template>
                </BasePropDisplay>

                <BasePropDisplay name="Contributors">
                  <template v-if="app.contributors">
                    <span v-for="(contributor, i) in app.contributors" :key="i">
                      <template v-if="i > 1">{{
                        app.contributors.length > i + 1 ? ", " : " and "
                      }}</template>

                      <a
                        v-if="contributor.url"
                        :href="contributor.url"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <template>{{ contributor.title }}</template>
                      </a>
                      <template v-else>{{ contributor.title }}</template>
                    </span>
                  </template>

                  <template v-else>{{ "ICJIA R&A staff" }}</template>
                </BasePropDisplay>

                <BasePropDisplay v-if="app.categories" name="Categories">
                  <span>{{ app.categories }}</span>
                </BasePropDisplay>

                <BasePropDisplay v-if="app.tags" name="Tags">
                  <BasePropChip
                    v-for="tag in app.tags"
                    :key="tag"
                    @chip-click="$emit('tag-click', $event)"
                  >
                    <template>{{ tag }}</template>
                  </BasePropChip>
                </BasePropDisplay>

                <BasePropDisplay name="Description">
                  <template>{{ app.description }}</template>
                </BasePropDisplay>
                <BaseInfoBlock v-if="app.funding">
                  <template #title>{{ "Funding acknowledgment" }}</template>
                  <template #text>{{ app.funding }}</template>
                </BaseInfoBlock>

                <BaseInfoBlock v-if="app.citation">
                  <template #title>{{ "Suggested citation" }}</template>
                  <template #text>
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <span v-html="app.citation"></span>
                  </template>
                </BaseInfoBlock>

                <BaseInfoBlock v-if="hasRelated">
                  <template #title>{{ "Related contents" }}</template>
                  <template #text>
                    <ul class="font-lato">
                      <li
                        v-for="(article, i) in app.articles"
                        :key="`article${i}`"
                      >
                        <router-link
                          :to="
                            preview
                              ? ''
                              : `/researchhub/articles/${article.slug}/`
                          "
                        >
                          <template>{{
                            `[ARTICLE] ${article.title}`
                          }}</template>
                        </router-link>
                      </li>
                      <li
                        v-for="(dataset, i) in app.datasets"
                        :key="`dataset${i}`"
                      >
                        <router-link
                          :to="
                            preview
                              ? ''
                              : `/researchhub/datasets/${dataset.slug}/`
                          "
                        >
                          <template>{{
                            `[DATASET] ${dataset.title}`
                          }}</template>
                        </router-link>
                      </li>
                    </ul>
                  </template>
                </BaseInfoBlock>
              </v-col>
            </v-row>
            <v-row>
              <v-col class="text-center mb-12" style="margin-top: -25px"
                ><v-btn elevation="2" @click="launch(item)" x-large
                  >Launch the App<v-icon right>mdi-open-in-new</v-icon></v-btn
                >
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { format } from "@/utils/itemFormatter";

export default {
  props: {
    item: {
      type: Object,
      default() {
        return {
          articles: null,
          citation: null,
          contributors: null,
          categories: null,
          datasets: null,
          date: null,
          description: null,
          external: null,
          funding: null,
          image: null,
          tags: null,
          title: null,
          url: null,
        };
      },
    },
    preview: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    launch(item) {
      // console.log("-----");
      // console.log("url: ", item.url);
      // console.log("title: ", item.title);
      // console.log("page: ", `https://icjia.illinois.gov${this.$route.path}`);
      // console.log("-----");
      window.plausible("research_dashboard", {
        props: {
          dashboardTitle: item.title,
          dashboardDestinationURL: item.url,
          dashboardSourceURL: `https://icjia.illinois.gov${this.$route.path}`,
        },
      });

      window.open(item.url);
    },
  },
  computed: {
    app() {
      return format(this.item);
    },
    hasRelated() {
      const { articles, datasets } = this.item;
      return (articles && articles.length) || (datasets && datasets.length);
    },
    smAndDown() {
      return this.$vuetify.breakpoint.smAndDown;
    },
  },
};
</script>
