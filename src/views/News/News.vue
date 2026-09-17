<template>
  <div class="markdown-body">
    <BaseContent :error="error" :loading="$apollo.loading">
      <template slot="content">
        <v-container>
          <v-row class="mb-4 page-heading">
            <v-col cols="12">
              <h1>News & Information</h1>
            </v-col>
          </v-row>

          <!-- Featured Post (most recent). Its title is the card's link, so
               the link's name is the title (WCAG 2.5.3): as a link, the whole
               card was named by all its text except the "Read" button, which
               is hidden from assistive technology. A click anywhere else on
               the card still opens the post. -->
          <v-row v-if="featured" class="mb-6">
            <v-col cols="12">
              <v-card
                outlined
                elevation="2"
                class="featured-card hover title-link-card"
                ripple
                @click.native="onCardClick($event, featured.fullPath)"
              >
                <v-row no-gutters>
                  <v-col
                    v-if="featured.splash"
                    cols="12"
                    md="6"
                    class="featured-img-col"
                  >
                    <!-- Card images repeat the card's title: decorative
                         unless Strapi has alt text, and the loading spinner
                         stays out of the card's name (WCAG 1.1.1, 2.5.3). -->
                    <v-img
                      :src="`https://agency.icjia-api.cloud${
                        featured.splash.formats.medium
                          ? featured.splash.formats.medium.url
                          : featured.splash.url
                      }`"
                      :lazy-src="`https://agency.icjia-api.cloud${featured.splash.formats.thumbnail.url}`"
                      height="100%"
                      min-height="250"
                      max-height="320"
                      contain
                      position="center center"
                      :alt="featured.splash.alternativeText || ''"
                      class="grey lighten-4"
                    >
                      <template #placeholder>
                        <v-row
                          class="fill-height ma-0"
                          align="center"
                          justify="center"
                          aria-hidden="true"
                        >
                          <v-progress-circular
                            indeterminate
                            color="blue darken-3"
                            aria-label="Loading image"
                          ></v-progress-circular>
                        </v-row>
                      </template>
                    </v-img>
                  </v-col>
                  <v-col cols="12" :md="featured.splash ? 6 : 12">
                    <div class="pa-6">
                      <div class="featured-badge mb-3">FEATURED</div>
                      <div class="mt-1">
                        <span class="featured-category">{{
                          getProperCategory(
                            $myApp.config.maps.news,
                            featured.category
                          ).toUpperCase()
                        }}</span>
                        <span class="featured-date"
                          >&nbsp;|&nbsp;{{
                            featured.publicationDate | format
                          }}</span
                        >
                      </div>
                      <h2 class="featured-title mt-2 mb-3">
                        <router-link
                          :to="featured.fullPath"
                          class="card-title-link"
                          >{{ featured.title }}</router-link
                        >
                      </h2>
                      <p v-if="featured.summary" class="featured-summary">
                        {{ featured.summary }}
                      </p>
                      <div
                        v-if="featured.tags && featured.tags.length"
                        class="mt-3"
                      >
                        <v-chip
                          v-for="tag in featured.tags.slice(0, 4)"
                          :key="tag"
                          x-small
                          outlined
                          class="mr-1 mb-1"
                          >{{ tag }}</v-chip
                        >
                      </div>
                      <v-btn
                        small
                        color="#0D4474"
                        dark
                        class="mt-4"
                        tabindex="-1"
                        aria-hidden="true"
                        >Read: {{ featured.title }}</v-btn
                      >
                    </div>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
          </v-row>

          <!-- Category Filters. aria-pressed exposes the selected filter,
               which is otherwise shown only by its fill (WCAG 4.1.2). -->
          <v-row class="mb-2" ref="filters">
            <v-col cols="12">
              <v-btn
                small
                :outlined="activeCategory !== 'all'"
                :color="activeCategory === 'all' ? '#0D4474' : ''"
                :dark="activeCategory === 'all'"
                :aria-pressed="activeCategory === 'all' ? 'true' : 'false'"
                class="mr-2 mb-2"
                @click="resetToLatest"
                >All</v-btn
              >
              <v-btn
                v-for="cat in categories"
                :key="cat.category"
                small
                :outlined="activeCategory !== cat.category"
                :color="activeCategory === cat.category ? '#0D4474' : ''"
                :dark="activeCategory === cat.category"
                :aria-pressed="
                  activeCategory === cat.category ? 'true' : 'false'
                "
                class="mr-2 mb-2"
                @click="selectCategory(cat.category)"
                >{{ cat.label }}</v-btn
              >
            </v-col>
          </v-row>

          <!-- Grouped News List -->
          <div ref="newsList">
            <transition name="fade" mode="out-in" @after-enter="focusList">
              <div :key="activeCategory + '-' + currentPage">
                <div v-for="group in groupedNews" :key="group.label">
                  <v-row>
                    <v-col cols="12">
                      <h3 class="group-heading">{{ group.label }}</h3>
                      <v-divider class="mb-4"></v-divider>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col
                      v-for="item in group.items"
                      :key="item.id"
                      cols="12"
                      md="6"
                    >
                      <v-card
                        outlined
                        :to="item.fullPath"
                        class="news-list-item pa-0 fill-height"
                        elevation="1"
                      >
                        <v-row no-gutters align="center">
                          <v-col v-if="item.splash" cols="auto">
                            <v-img
                              :src="`https://agency.icjia-api.cloud${item.splash.formats.thumbnail.url}`"
                              width="90"
                              height="90"
                              contain
                              position="center center"
                              :alt="item.splash.alternativeText || ''"
                              class="news-thumb grey lighten-4"
                            ></v-img>
                          </v-col>
                          <v-col class="py-3 px-4">
                            <div class="news-meta">
                              <v-chip
                                v-if="isItNew(item)"
                                label
                                x-small
                                class="mr-2"
                                style="margin-top: -1px"
                              >
                                <span
                                  style="
                                    color: #000000 !important;
                                    font-weight: 700;
                                  "
                                  >NEW!</span
                                >
                              </v-chip>
                              <span class="news-category">{{
                                getProperCategory(
                                  $myApp.config.maps.news,
                                  item.category
                                ).toUpperCase()
                              }}</span>
                              <span class="news-date"
                                >&nbsp;|&nbsp;{{
                                  item.publicationDate | format
                                }}</span
                              >
                            </div>
                            <h4 class="news-title mt-1">{{ item.title }}</h4>
                            <p
                              v-if="item.summary"
                              class="news-summary mt-1 mb-0"
                            >
                              {{ truncate(item.summary, 25) }}
                            </p>
                          </v-col>
                        </v-row>
                      </v-card>
                    </v-col>
                  </v-row>
                </div>

                <!-- Empty state -->
                <v-row v-if="filteredNews && filteredNews.length === 0">
                  <v-col cols="12" class="text-center py-8">
                    <p class="grey--text">
                      No news items found for this category.
                    </p>
                  </v-col>
                </v-row>
              </div>
            </transition>
          </div>

          <!-- Pagination -->
          <v-row v-if="totalPages > 1" class="mt-4 mb-8" justify="center">
            <v-col cols="auto">
              <v-pagination
                v-model="currentPage"
                :length="totalPages"
                :total-visible="7"
                circle
                color="#0D4474"
                @input="focusListWhenShown = true"
              ></v-pagination>
            </v-col>
          </v-row>
        </v-container>
      </template>
    </BaseContent>
  </div>
</template>

<script>
import NProgress from "@/services/Progress";
import { GET_ALL_NEWS_QUERY } from "@/graphql/news";
import { EventBus } from "@/event-bus";
import {
  getUnifiedTags,
  getPublicationDate,
  getProperCategory,
} from "@/utils/content";
import _ from "lodash";
import dayjs from "@/plugins/dayjs";
import { scrollBehavior } from "@/utils/motion";
import { isClickOnLink, moveFocusTo } from "@/utils/focus";

const ITEMS_PER_PAGE = 15;

export default {
  metaInfo: {
    title: "News & Information",
  },
  name: "News",
  data() {
    return {
      error: null,
      allNews: null,
      activeCategory: "all",
      currentPage: 1,
      focusListWhenShown: false,
      getProperCategory,
    };
  },
  computed: {
    featured() {
      if (!this.allNews || !this.allNews.length) return null;
      return this.allNews[0];
    },
    filteredNews() {
      if (!this.allNews || this.allNews.length < 2) return [];
      const rest = this.allNews.slice(1);
      if (this.activeCategory === "all" || !this.activeCategory) {
        return rest;
      }
      return rest.filter((item) => item.category === this.activeCategory);
    },
    totalPages() {
      if (!this.filteredNews) return 0;
      return Math.ceil(this.filteredNews.length / ITEMS_PER_PAGE);
    },
    paginatedNews() {
      if (!this.filteredNews) return [];
      const start = (this.currentPage - 1) * ITEMS_PER_PAGE;
      return this.filteredNews.slice(start, start + ITEMS_PER_PAGE);
    },
    categories() {
      if (!this.allNews || this.allNews.length < 2) return [];
      const rest = this.allNews.slice(1);
      const usedCategories = new Set(rest.map((item) => item.category));
      return (this.$myApp.config.maps.news || []).filter((cat) =>
        usedCategories.has(cat.category)
      );
    },
    groupedNews() {
      if (!this.paginatedNews || !this.paginatedNews.length) return [];
      const now = dayjs();
      const groups = {
        thisMonth: { label: "This Month", items: [] },
        lastMonth: { label: "Last Month", items: [] },
        earlier: { label: "Earlier", items: [] },
      };

      this.paginatedNews.forEach((item) => {
        const pubDate = dayjs(item.publicationDate);
        if (pubDate.isSame(now, "month")) {
          groups.thisMonth.items.push(item);
        } else if (pubDate.isSame(now.clone().subtract(1, "month"), "month")) {
          groups.lastMonth.items.push(item);
        } else {
          groups.earlier.items.push(item);
        }
      });

      return Object.values(groups).filter((g) => g.items.length > 0);
    },
  },
  watch: {
    activeCategory() {
      this.currentPage = 1;
    },
    currentPage() {
      this.scrollToList();
    },
  },
  methods: {
    onCardClick(e, fullPath) {
      if (isClickOnLink(e)) return;
      this.$router.push(fullPath);
    },
    isItNew(item) {
      const now = dayjs(new Date());
      const end = dayjs(item.publicationDate || item.published_at);
      const duration = dayjs.duration(now.diff(end));
      const days = duration.asDays();
      return days <= this.$myApp.config.daysToShowNew;
    },
    // The filters and the start of the list come into view, the filters 170
    // px from the top: clear of the fixed header and the context bar (161
    // px). The list used to stop at 130 px, which left the filter button just
    // pressed under the bars.
    scrollToList() {
      this.$nextTick(() => {
        const el = this.$refs.filters;
        if (el) {
          const top = el.getBoundingClientRect().top + window.pageYOffset - 170;
          window.scrollTo({
            top: Math.max(0, top),
            behavior: scrollBehavior(),
          });
        }
      });
    },
    // After a page is chosen, once it is shown, focus moves to its first
    // heading ("This Month", "Earlier"), the start of the page's news: it
    // stayed on the page's button, which the scroll had left below the
    // window (WCAG 2.4.3).
    focusList() {
      if (!this.focusListWhenShown) return;
      this.focusListWhenShown = false;
      const list = this.$refs.newsList;
      moveFocusTo(list && list.querySelector(".group-heading"));
    },
    resetToLatest() {
      this.activeCategory = "all";
      this.currentPage = 1;
      this.scrollToList();
    },
    selectCategory(category) {
      this.activeCategory = category;
      this.currentPage = 1;
      this.scrollToList();
    },
    truncate(string, maxWords = 30) {
      if (!string) return "";
      var array = string.trim().split(" ");
      var wordCount = array.length;
      string = array.splice(0, maxWords).join(" ");
      if (wordCount > maxWords) {
        string += "...";
      }
      return string;
    },
  },
  apollo: {
    posts: {
      prefetch: true,
      query: GET_ALL_NEWS_QUERY,
      variables() {
        return {};
      },
      error(error) {
        this.error = JSON.stringify(error.message);
      },
      result(ApolloQueryResult) {
        let posts = ApolloQueryResult.data.posts.map((e) => ({
          ...e,
          fullPath: `/news/${e.slug}/`,
          contentType: "News",
        }));
        posts = getUnifiedTags(posts);
        posts = getPublicationDate(posts);
        this.allNews = _.orderBy(posts, ["publicationDate"], ["desc"]);
        EventBus.$emit("context-label", "News & Information");
        NProgress.done();
      },
    },
  },
};
</script>

<style lang="scss" scoped>
.featured-card {
  overflow: hidden;
  transition: box-shadow 0.2s;
  // The card's text keeps the weight it had when the whole card was a link.
  font-weight: 900;
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  }
}

.featured-badge {
  display: inline-block;
  background-color: #0d4474;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 4px 12px;
  text-transform: uppercase;
}

.featured-title {
  font-size: 1.5rem;
  line-height: 1.8rem;
  color: #111;
}

.featured-summary {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #333;
}

.featured-category {
  font-weight: 700;
  font-size: 12px;
  color: #555;
}

.featured-date {
  font-size: 12px;
  color: #555;
}

.group-heading {
  font-size: 1rem;
  font-weight: 700;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.news-list-item {
  overflow: hidden;
  transition: box-shadow 0.2s, background-color 0.2s;
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12) !important;
    background-color: #fafafa;
  }
}

.news-thumb {
  border-right: 1px solid #eee;
}

.news-meta {
  font-size: 12px;
}

.news-category {
  font-weight: 700;
  color: #555;
}

.news-date {
  color: #555;
}

.news-title {
  font-size: 1rem;
  line-height: 1.35rem;
  color: #111;
}

.news-summary {
  font-size: 0.85rem;
  line-height: 1.4;
  color: #555;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
