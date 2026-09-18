<template>
  <div
    class="home-splash"
    style="
      border-bottom: 1px solid #d8d8d8;
      margin-top: -15px;
      position: relative;
      height: 600px;
      overflow: hidden;
    "
  >
    <picture>
      <!-- AVIF first (smallest, modern browsers), then WebP fallback, then
           JPEG. All three were re-encoded as pre-grayscaled images so the
           previous CSS filter:grayscale(100%) is no longer needed (saves a
           compositor pass and ~20 KB per format). Sizes after v1.3.43:
             home-splash.avif  36 KB   (was no avif)
             home-splash.webp  53 KB   (was 94 KB,  -44%)
             home-splash.jpg   72 KB   (was 151 KB, -52%)
           Heavy overlay on top hides any quality artifacts. -->
      <source srcset="/home-splash.avif" type="image/avif" />
      <source srcset="/home-splash.webp" type="image/webp" />
      <img
        src="/home-splash.jpg"
        alt=""
        role="presentation"
        width="1000"
        height="667"
        fetchpriority="high"
        decoding="async"
        style="width: 100%; height: 600px; object-fit: cover; display: block"
      />
    </picture>
    <div
      style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(55, 90, 127, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
      "
    >
      <div
        class="px-6 px-sm-10 pt-4 pb-7"
        style="
          width: 90%;
          max-width: 700px;
          background: rgba(100, 100, 100, 0.9);
          text-align: center;
        "
      >
        <div class="text-center px-2 px-sm-5">
          <h1
            class="nofo-title mt-3"
            style="color: #fff; font-size: 24px; font-weight: bold"
          >
            Illinois Criminal Justice Information Authority
          </h1>
          <div class="nofo-tagline mt-4" style="font-size: 14px; color: #fff">
            Created in 1983, the Illinois Criminal Justice Information Authority
            (ICJIA) is a state agency dedicated to improving the administration
            of criminal justice. ICJIA works to ensure the criminal justice
            system in Illinois is efficient, effective, and equitable.
          </div>
          <!-- Search was only a magnifier icon in the header. The visitor is
               sent to the search page: the search index is not loaded here. -->
          <form
            role="search"
            class="splash-search mt-6"
            @submit.prevent="search"
          >
            <label for="splash-search-input" class="sr-only"
              >Search ICJIA</label
            >
            <input
              id="splash-search-input"
              v-model="query"
              type="search"
              placeholder="Search ICJIA"
              autocomplete="off"
              class="splash-search__input"
            />
            <v-btn
              type="submit"
              dark
              depressed
              color="#0d4474"
              height="40"
              class="splash-button splash-search__button"
              >Search</v-btn
            >
          </form>
          <div class="mt-7 hidden-md-and-up text-center">
            <v-btn
              dark
              small
              color="#0d4474"
              to="/grants/"
              class="splash-button mb-3"
              >Apply for funding</v-btn
            ><br />
            <v-btn
              dark
              small
              color="#0d4474"
              to="/forms/grant-status/"
              class="splash-button"
              >Grant Status Request
            </v-btn>
          </div>
          <div class="hidden-sm-and-down mt-7">
            <v-btn
              dark
              small
              color="#0d4474"
              to="/grants/"
              class="splash-button mr-2"
              >Apply for funding</v-btn
            >
            <v-btn
              dark
              small
              color="#0d4474"
              to="/forms/grant-status/"
              class="splash-button py-0 ml-11"
              >Grant Status Request
            </v-btn>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { goToSearch } from "@/utils/search";
export default {
  data() {
    return { query: "" };
  },
  methods: {
    search() {
      goToSearch(this.$router, { query: this.query });
    },
  },
  props: {
    slider: {
      type: Object,
      default: () => {},
    },
    buttons: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style>
.heavy {
  font-weight: 900;
}

/* v-btn renders as an <a> when :to is set, so the global `a:hover` rule in
   app.css (color: #000 !important) repaints these labels black on the navy
   background. Darken the button and hold the label white, same treatment as
   the news-archive button on Home.vue. */
.splash-button:hover {
  background-color: #092f51 !important;
  color: #fff !important;
}

/* The banner's search box: one row, the field taking the room the button
   leaves, at every width down to 320 px. */
.splash-search {
  display: flex;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}
.splash-search__input {
  flex: 1 1 auto;
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  font-size: 16px;
  color: #000;
  background: #fff;
  border: 1px solid #fff;
  border-radius: 4px 0 0 4px;
}
/* 7:1 on white; the browser's default placeholder grey does not reach 4.5:1. */
.splash-search__input::placeholder {
  color: #595959;
  opacity: 1;
}
.splash-search__input:focus-visible {
  outline: 3px solid #ffdd57;
  outline-offset: 1px;
}
.splash-search__button {
  border-radius: 0 4px 4px 0 !important;
}
</style>
