<template>
  <div class="pub-list-wrap text-left">
    <!-- Filters: native controls, each with a visible label (WCAG 1.3.1,
         2.4.6, 3.3.2, 4.1.2). Changing one narrows the list in place and
         says how many publications are left (role="status", WCAG 4.1.3). -->
    <div class="pub-filters">
      <div class="pub-field pub-field-search">
        <label for="pub-search">Search publications</label>
        <input
          id="pub-search"
          v-model="search"
          type="search"
          autocomplete="off"
          aria-describedby="pub-search-hint"
        />
        <p id="pub-search-hint" class="pub-hint">
          Searches titles, summaries, and topics.
        </p>
      </div>
      <div class="pub-field">
        <label for="pub-type">Type</label>
        <select id="pub-type" v-model="type">
          <option value="">All types</option>
          <option v-for="t in types" :key="t.value" :value="t.value">
            {{ t.text }}
          </option>
        </select>
      </div>
      <div class="pub-field">
        <label for="pub-year">Year</label>
        <select id="pub-year" v-model="year">
          <option value="">All years</option>
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
      <div class="pub-field">
        <label for="pub-sort">Sort by</label>
        <select id="pub-sort" v-model="sort">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title, A to Z</option>
        </select>
      </div>
      <div class="pub-field">
        <label for="pub-per-page">Show</label>
        <select id="pub-per-page" v-model.number="perPage">
          <option :value="25">25 a page</option>
          <option :value="50">50 a page</option>
          <option :value="100">100 a page</option>
        </select>
      </div>
    </div>

    <!-- What the reader sees of the results; pagination moves focus here, so
         the next page's range is read and Tab goes on to its first title
         (WCAG 2.4.3). -->
    <p ref="range" class="pub-range" tabindex="-1">{{ rangeText }}</p>
    <!-- What a screen reader hears when a filter changes, after typing pauses,
         so it isn't read at every keystroke (WCAG 4.1.3). -->
    <p class="sr-only" role="status">{{ announcement }}</p>

    <ul v-if="pageItems.length" class="pub-list" role="list">
      <li v-for="item in pageItems" :key="item.id" class="pub-item">
        <h2 class="pub-title">
          <router-link :to="item.fullPath">{{ item.title }}</router-link>
        </h2>
        <p class="pub-meta">
          <span v-if="isNew(item)" class="pub-new">New</span>
          <span v-if="item.publicationDate">{{
            item.publicationDate | dateFormatAlt
          }}</span>
          <span v-if="item.publicationDate"
            ><span aria-hidden="true"> · </span
            ><span class="sr-only">,&nbsp;</span></span
          >
          <span>{{ typeName(item.pubType) }}</span>
        </p>
        <p v-if="item.localArticlePath || item.fileURL" class="pub-links">
          <!-- The hidden title makes each link's name unique in a list of
               links, after its visible words (WCAG 2.4.4, 2.5.3). The site
               adds "(opens in new tab)" to a link that opens one. -->
          <router-link
            v-if="item.localArticlePath"
            :to="item.localArticlePath"
            @click.native="registerArticleView(item)"
            >Read the article<span class="sr-only"
              >: {{ item.title }}</span
            ></router-link
          >
          <a
            v-if="item.fileURL"
            :href="item.fileURL"
            target="_blank"
            rel="noopener noreferrer"
            @click="registerDownload(item)"
            >{{ fileWords(item)
            }}<span class="sr-only">: {{ item.title }}</span></a
          >
        </p>
        <!-- The summary is the browser's own disclosure: a button that says
             whether it's open, by keyboard and screen reader, with or without
             JavaScript (WCAG 2.1.1, 4.1.2). Its name says whose summary it is. -->
        <details class="pub-details">
          <summary>
            Summary<span class="sr-only">&nbsp;of {{ item.title }}</span>
          </summary>
          <div class="pub-details-body">
            <p v-if="item.summary && item.summary.length">{{ item.summary }}</p>
            <p v-else>No summary available.</p>
            <div v-if="item.tags && item.tags.length" class="pub-topics">
              <span class="pub-topics-label">Topics:</span>
              <ul role="list">
                <li v-for="(tag, index) of item.tags" :key="index">
                  {{ tag }}
                </li>
              </ul>
            </div>
          </div>
        </details>
      </li>
    </ul>
    <p v-else class="pub-none">
      No publications match. Try fewer words, or set Type and Year to all.
    </p>

    <nav
      v-if="totalPages > 1"
      class="pub-pages"
      aria-label="Pages of publications"
    >
      <button type="button" :disabled="page <= 1" @click="goTo(page - 1)">
        Previous page
      </button>
      <span>Page {{ page }} of {{ totalPages }}</span>
      <button
        type="button"
        :disabled="page >= totalPages"
        @click="goTo(page + 1)"
      >
        Next page
      </button>
    </nav>
  </div>
</template>

<script>
import { getPublicationType } from "@/lib/utils";
import { moveFocusTo } from "@/utils/focus";
import { goToOptions } from "@/utils/motion";
import dayjs from "@/plugins/dayjs";

export default {
  name: "PublicationList",
  props: {
    publications: { type: Array, default: () => [] },
  },
  data() {
    return {
      search: "",
      type: "",
      year: "",
      sort: "newest",
      perPage: 25,
      page: 1,
      announcement: "",
      announceTimer: null,
    };
  },
  computed: {
    // What a search looks through, lower-cased once per publication.
    haystacks() {
      const map = new Map();
      this.publications.forEach((p) => {
        map.set(
          p.id,
          [p.title, p.summary, ...(p.tags || [])]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
        );
      });
      return map;
    },
    types() {
      const seen = new Map();
      this.publications.forEach((p) => {
        if (p.pubType && !seen.has(p.pubType)) {
          seen.set(p.pubType, this.typeName(p.pubType));
        }
      });
      return [...seen]
        .map(([value, text]) => ({ value, text }))
        .sort((a, b) => a.text.localeCompare(b.text));
    },
    years() {
      const set = new Set();
      this.publications.forEach((p) => {
        const y = this.yearOf(p);
        if (y) set.add(y);
      });
      return [...set].sort((a, b) => b - a);
    },
    filtered() {
      const words = this.search
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      return this.publications.filter((p) => {
        if (this.type && p.pubType !== this.type) return false;
        if (this.year && this.yearOf(p) !== this.year) return false;
        if (!words.length) return true;
        const hay = this.haystacks.get(p.id) || "";
        return words.every((w) => hay.includes(w));
      });
    },
    sorted() {
      const list = [...this.filtered];
      const date = (p) => String(p.publicationDate || p.created_at || "");
      if (this.sort === "title") {
        list.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        const dir = this.sort === "oldest" ? 1 : -1;
        list.sort((a, b) => date(a).localeCompare(date(b)) * dir);
      }
      return list;
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.sorted.length / this.perPage));
    },
    pageItems() {
      const start = (this.page - 1) * this.perPage;
      return this.sorted.slice(start, start + this.perPage);
    },
    rangeText() {
      const total = this.sorted.length;
      if (!total) return "No publications match.";
      const start = (this.page - 1) * this.perPage + 1;
      const end = Math.min(total, this.page * this.perPage);
      const of =
        total === 1
          ? "1 publication"
          : `${total.toLocaleString()} publications`;
      return `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${of}`;
    },
  },
  watch: {
    search() {
      this.filtersChanged();
    },
    type() {
      this.filtersChanged();
    },
    year() {
      this.filtersChanged();
    },
    sort() {
      this.filtersChanged();
    },
    perPage() {
      this.filtersChanged();
    },
  },
  beforeDestroy() {
    clearTimeout(this.announceTimer);
  },
  methods: {
    typeName(type) {
      return getPublicationType(type) || "Publication";
    },
    yearOf(p) {
      const d = p.publicationDate || p.created_at;
      return d ? dayjs(d).year() : null;
    },
    isNew(item) {
      const target = item.publicationDate || item.created_at;
      if (!target) return false;
      const days = dayjs
        .duration(dayjs(new Date()).diff(dayjs(target)))
        .asDays();
      return days <= this.$myApp.config.daysToShowNew;
    },
    fileType(url) {
      return url.split(/[#?]/)[0].split(".").pop().trim().toUpperCase();
    },
    fileWords(item) {
      if (item.pubType === "application") return "Open the application";
      const type = this.fileType(item.fileURL);
      return type === "PDF"
        ? "Download the PDF"
        : `Download the file (${type})`;
    },
    filtersChanged() {
      this.page = 1;
      clearTimeout(this.announceTimer);
      this.announceTimer = setTimeout(() => {
        this.announcement = this.rangeText;
      }, 700);
    },
    goTo(page) {
      this.page = Math.min(Math.max(1, page), this.totalPages);
      this.$nextTick(() => {
        this.$vuetify.goTo(this.$refs.range, goToOptions({ offset: 120 }));
        moveFocusTo(this.$refs.range);
      });
    },
    registerArticleView(item) {
      if (typeof window.plausible !== "function") return;
      window.plausible("publicationList_article_view", {
        props: { url: item.articleURL },
      });
    },
    registerDownload(item) {
      if (typeof window.plausible !== "function") return;
      window.plausible("publicationList_file_download", {
        props: { url: item.fileURL },
      });
    },
  },
};
</script>

<style scoped>
.pub-list-wrap {
  max-width: 960px;
  margin: 0 auto;
}
.pub-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 12px 16px;
  align-items: start;
  margin: 8px 0 16px;
}
.pub-field-search {
  grid-column: 1 / -1;
}
.pub-field label {
  display: block;
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 4px;
  color: #222;
}
.pub-field input,
.pub-field select {
  width: 100%;
  min-height: 44px;
  padding: 8px 10px;
  font-size: 16px;
  color: #222;
  background: #fff;
  border: 1px solid #6b6b6b;
  border-radius: 4px;
}
.pub-field input:focus-visible,
.pub-field select:focus-visible,
.pub-list-wrap a:focus-visible,
.pub-list-wrap summary:focus-visible,
.pub-pages button:focus-visible,
.pub-range:focus-visible {
  outline: 3px solid #0d4474;
  outline-offset: 2px;
}
.pub-hint {
  margin: 4px 0 0 !important;
  font-size: 14px;
  color: #555;
}
.pub-range {
  font-weight: 700;
  margin: 8px 0 !important;
  color: #222;
}
.pub-list {
  list-style: none;
  margin: 0 !important;
  padding: 0 !important;
}
.pub-item {
  border-top: 1px solid #d0d0d0;
  padding: 18px 0;
}
.pub-title {
  font-size: 20px !important;
  line-height: 1.3 !important;
  margin: 0 0 6px !important;
  border: 0 !important;
  padding: 0 !important;
}
.pub-title a {
  color: #0d4474;
}
.pub-meta {
  margin: 0 0 8px !important;
  font-size: 15px;
  color: #444;
}
.pub-new {
  display: inline-block;
  margin-right: 8px;
  padding: 0 6px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: #0d4474;
  border-radius: 3px;
}
.pub-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin: 0 0 8px !important;
  font-size: 15px;
}
.pub-links a {
  color: #0d4474;
  font-weight: 700;
}
.pub-details summary {
  cursor: pointer;
  font-weight: 700;
  color: #0d4474;
  padding: 4px 0;
  min-height: 24px;
}
.pub-details-body {
  margin-top: 8px;
  padding: 12px 16px;
  background: #f5f5f5;
  border-left: 4px solid #0d4474;
}
.pub-details-body p {
  margin: 0 0 8px !important;
}
.pub-topics {
  font-size: 14px;
}
.pub-topics-label {
  font-weight: 700;
  margin-right: 6px;
}
.pub-topics ul {
  display: inline;
  margin: 0 !important;
  padding: 0 !important;
  list-style: none;
}
.pub-topics li {
  display: inline;
}
.pub-topics li:not(:last-child)::after {
  content: " · ";
  content: " · " / "";
}
.pub-none {
  padding: 24px 0;
}
.pub-pages {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px 20px;
  margin-top: 16px;
}
.pub-pages button {
  min-height: 44px;
  padding: 8px 16px;
  font-weight: 700;
  color: #fff;
  background: #0d4474;
  border-radius: 4px;
}
.pub-pages button:disabled {
  color: #555;
  background: #e0e0e0;
  cursor: not-allowed;
}
</style>
