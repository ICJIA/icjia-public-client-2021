<template>
  <div id="article-toc">
    <h3 class="text-uppercase font-oswald mb-2" style="font-weight: 700">
      Table of contents
    </h3>

    <v-divider></v-divider>

    <v-list>
      <v-list-item
        v-for="heading in headings"
        :key="heading.id"
        class="pa-0"
        dense
      >
        <div
          class="font-lato toc-item pl-6 hover"
          :class="{ 'toc-item-active': heading.id === activeHeading }"
          @click="scrollTo(heading.id)"
          style="font-size: 14px"
        >
          {{ heading.innerText }}
        </div>
      </v-list-item>
    </v-list>
  </div>
</template>

<script>
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
    scrollTo(id) {
      //console.log(id);
      this.$vuetify.goTo(`#${id}`, { offset: 80 });
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
