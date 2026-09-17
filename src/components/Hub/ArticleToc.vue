<template>
  <div id="article-toc">
    <p class="font-oswald mb-2" style="font-weight: 700; font-size: 1.17em">
      TABLE OF CONTENTS
    </p>

    <v-divider></v-divider>

    <v-list>
      <v-list-item
        v-for="heading in headings"
        :key="heading.id"
        class="pa-0"
        dense
      >
        <!-- A real link to the section (WCAG 2.1.1); it used to be a <div>
             with a click handler, which a keyboard cannot reach. The href
             carries the page's path: index.html sets <base href="/">. -->
        <a
          :href="`${$route.path}#${heading.id}`"
          class="font-lato toc-item pl-6 hover"
          :class="{ 'toc-item-active': heading.id === activeHeading }"
          @click.prevent="scrollTo(heading.id)"
          style="font-size: 14px"
        >
          {{ heading.innerText }}
        </a>
      </v-list-item>
    </v-list>
  </div>
</template>

<script>
import { moveFocusTo } from "@/utils/focus";
import { goToOptions } from "@/utils/motion";
export default {
  mounted() {
    const disclaimer = document.querySelector("#disclaimer");
    const toc = document.querySelector(".article-toc");
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        //console.log(entry.boundingClientRect.top);
        if (entry.isIntersecting) {
          console.log("Disclaimer Enter");
          toc.classList.remove("article-toc-sticky");
          return;
        }
        // TODO:fix to replace TOC if user is scrolled down far enough
        console.log("Disclaimer Leave");
      },
      {
        root: null,
        threshold: 0,
      }
    );
    observer.observe(disclaimer);
  },
  methods: {
    // Scroll to the section and move keyboard focus to its heading (WCAG
    // 2.4.3). The link's default jump is prevented: in this app a hash change
    // is a route change, which would re-render the article. The heading
    // lands below the fixed header and the context bar; the page jumps
    // there when reduced motion is requested.
    scrollTo(id) {
      const target = id && document.getElementById(id);
      if (!target) return;
      this.$vuetify.goTo(target, goToOptions({ offset: 80 }));
      moveFocusTo(target);
    },
  },
  props: {
    headings: NodeList,
    activeHeading: {
      type: String,
      default: null,
    },
  },
};
</script>
