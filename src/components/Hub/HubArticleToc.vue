<template>
  <div id="article-toc">
    <h3 class="text-uppercase font-oswald mb-2">Table of contents</h3>

    <v-divider></v-divider>

    <v-list>
      <v-list-item
        v-for="heading in headings"
        :key="heading.id"
        class="pa-0"
        dense
      >
        <div
          class="font-lato toc-item py-2 pl-6 hover"
          :class="{ 'toc-item-active': heading.id === activeHeading }"
          @click="scrollTo(heading.id)"
          style="font-size: 16px"
        >
          {{ heading.innerText }}
        </div>
      </v-list-item>
    </v-list>
  </div>
</template>

<script>
export default {
  methods: {
    scrollTo(id) {
      //console.log(id);
      this.$vuetify.goTo(`#${id}`);
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
