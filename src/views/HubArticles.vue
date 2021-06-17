<template>
  <div>
    <v-container :fluid="orientation === 'grid'">
      <v-row>
        <v-col cols="12">
          <div class="text-right">
            <v-btn-toggle v-model="orientation" borderless>
              <v-btn value="list" small aria-label="List view">
                <span class="hidden-sm-and-down">List</span>

                <span aria-hidden="true" class="mdi mdi-format-list-bulleted">
                </span>
              </v-btn>

              <v-btn value="grid" small>
                <span class="hidden-sm-and-down" aria-label="Grid view"
                  >Grid</span
                >

                <span class="mdi mdi-view-module" aria-hidden="true"> </span>
              </v-btn>
            </v-btn-toggle>
          </div>
        </v-col>
      </v-row>

      <v-row dense v-if="orientation === 'grid'">
        <v-col
          v-for="(item, index) in hubArticles"
          :key="index"
          class="child"
          cols="12"
          md="4"
        >
          <HubCard
            :item="item"
            :orientation="orientation"
            :textOnly="false"
          ></HubCard>
        </v-col>
      </v-row>
      <v-row dense v-else>
        <v-col cols="12" v-for="(item, index) in hubArticles" :key="index">
          <HubCard
            :item="item"
            :orientation="orientation"
            :textOnly="false"
          ></HubCard>
        </v-col>
      </v-row>
      <v-row>
        <v-col
          cols="12"
          class="text-center"
          v-if="start + articleLimit <= articleCount"
        >
          <v-btn @click="loadMore()">Load more </v-btn>
        </v-col>
        <v-col cols="12" class="text-center"
          ><div style="font-size: 10px; font-weight: 900; margin-top: -15px">
            <span v-if="start + articleLimit <= articleCount"
              >Showing {{ start + articleLimit }} of
              {{ articleCount }} articles</span
            >
            <span v-else>Showing all {{ articleCount }} articles</span>
          </div></v-col
        >
      </v-row>
    </v-container>
  </div>
</template>

<script>
import nprogress from "nprogress";
export default {
  name: "Articles",
  data() {
    return {
      hubArticles: [],
      start: 0,
      articleLimit: 30,
      articleCount: this.$myApp.hubArticles.length,
      orientation: "grid",
    };
  },

  methods: {
    toggle() {
      console.log("toggle view");
    },
    loadMore() {
      this.start = this.start + this.articleLimit;
      this.hubArticles.push(
        ...this.$myApp.hubArticles.slice(
          this.start,
          this.start + this.articleLimit
        )
      );
      //console.log("load more here ", this.start, this.articleLimit);
    },
  },

  mounted() {
    nprogress.start();
    this.hubArticles.push(
      ...this.$myApp.hubArticles.slice(this.start, this.articleLimit)
    );
    nprogress.done();
  },
};
</script>
