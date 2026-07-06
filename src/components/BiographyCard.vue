<template>
  <div>
    <v-card
      :to="`/about/biographies/${item.slug}`"
      elevation="1"
      class="mb-2 py-8 px-2"
      style="border: 1px solid #ddd"
      v-if="item"
      :color="color"
    >
      <div class="d-flex flex-no-wrap">
        <v-avatar
          class="ma-3 hidden-sm-and-down"
          size="125"
          tile
          v-if="item.headshot && item.headshot.url"
        >
          <v-img
            :src="`https://agency.icjia-api.cloud${item.headshot.formats.thumbnail.url}`"
            :lazy-src="`https://agency.icjia-api.cloud${item.headshot.formats.thumbnail.url}`"
            :alt="item.fullName + ' headshot'"
          ></v-img>
        </v-avatar>
        <span>
          <v-tooltip top v-if="showName">
            <template v-slot:activator="{ on, attrs }">
              <h2
                :id="item.slug ? `bio-${item.slug}` : undefined"
                class="text-h5 author-name hover ml-3"
                style="cursor: pointer"
                tabindex="0"
                @click.stop.prevent="search(item.fullName)"
                @keydown.enter.stop.prevent="search(item.fullName)"
                v-bind="attrs"
                v-on="on"
              >
                {{ item.fullName }}<span v-if="item.suffix">,&nbsp;</span
                >{{ item.suffix }}
              </h2>
            </template>
            <span>Search ICJIA for {{ item.fullName }}</span>
          </v-tooltip>

          <v-card-subtitle style="margin-top: -10px">
            <span
              style="font-weight: 700"
              class=""
              v-if="item && item.unit && item.unit.title"
              >{{ item.unit.title }}&nbsp;|&nbsp;</span
            >

            <span style="font-weight: 700; color: #222" v-if="item.title"
              >{{ item.title }}
              <!-- <span v-if="item && item.affiliation === 'board'"> | </span> -->
            </span>
            <!-- <span
              v-if="item && item.affiliation === 'board'"
              style="font-weight: 700; color: #222"
            >
              ICJIA Board
            </span> -->
            <!-- <span
              v-if="item && item.affiliation === 'staff'"
              style="font-weight: 700; color: #222"
            >
              ICJIA Staff
            </span> -->
          </v-card-subtitle>
          <v-card-text
            class="text-left"
            v-if="item.body && item.body.length"
            v-html="render(item.body)"
          ></v-card-text>
        </span>
      </div>
    </v-card>
  </div>
</template>

<script>
import { renderToHtml } from "@/services/Markdown";
import { goToSearch } from "@/utils/search";
export default {
  mounted() {
    // Vuetify's v-tooltip injects aria-expanded AND aria-haspopup="true" onto
    // the activator via v-bind="attrs". On these <h2> author names that yields
    // ARIA the heading role does not support — SiteImprove sia-r18 "ARIA
    // attribute unsupported or prohibited" (WCAG 4.1.2) on /about/composition-
    // and-membership/ and /about/units/*. Strip both; the tooltip still works.
    const els = document.getElementsByClassName("author-name");
    for (let i = 0, len = els.length; i < len; ++i) {
      els[i].removeAttribute("aria-expanded");
      els[i].removeAttribute("aria-haspopup");
    }
  },
  methods: {
    search(name) {
      // Was: EventBus.$emit("search", { query: name }) — opened the modal.
      // Users asked to land on /search so they could see all hits for the
      // name, open a specific one in a new tab, and come back here.
      goToSearch(this.$router, { query: name, type: "general" });
    },
    render(content) {
      return renderToHtml(content);
    },
  },
  props: {
    item: {
      type: Object,
      default: () => {},
    },
    showName: {
      type: Boolean,
      default: true,
    },
    color: {
      type: String,
      default: "#fff",
    },
    showStaticSearch: {
      type: Boolean,
      default: false,
    },
    hideBiography: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style>
.unit-title {
  text-decoration: underline;
}
.unit-title:hover {
  text-decoration: none;
  cursor: pointer;
}
/* Vuetify :to prop turns v-card into an <a> tag, causing text color
   to inherit from link styles (white/transparent on certain states).
   Force black text on biography cards in all states. */
a.v-card .v-card__text,
a.v-card:link .v-card__text,
a.v-card:visited .v-card__text,
a.v-card:hover .v-card__text,
a.v-card:active .v-card__text,
a.v-card:focus .v-card__text {
  color: #000 !important;
}
a.v-card .v-card__subtitle,
a.v-card:link .v-card__subtitle,
a.v-card:visited .v-card__subtitle,
a.v-card:hover .v-card__subtitle,
a.v-card:active .v-card__subtitle,
a.v-card:focus .v-card__subtitle {
  color: #222 !important;
}
a.v-card .author-name,
a.v-card:link .author-name,
a.v-card:visited .author-name,
a.v-card:hover .author-name,
a.v-card:active .author-name,
a.v-card:focus .author-name {
  color: #222 !important;
}
</style>
