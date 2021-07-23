<template>
  <div>
    <v-btn-toggle v-model="icon" mandatory>
      <v-btn value="list" small aria-label="List view">
        <span class="hidden-sm-and-down">List</span>

        <span aria-hidden="true" class="mdi mdi-format-list-bulleted"> </span>
      </v-btn>

      <v-btn value="grid" small>
        <span class="hidden-sm-and-down" aria-label="Grid view">Grid</span>

        <span class="mdi mdi-view-module" aria-hidden="true"> </span>
      </v-btn>
    </v-btn-toggle>
  </div>
</template>

<script>
// import nprogress from "nprogress";
export default {
  data() {
    return {
      icon: "grid",
    };
  },
  watch: {
    icon(newValue, oldValue) {
      if (!newValue) {
        //nprogress.start();
        this.$emit("toggle", oldValue);
      } else {
        ///nprogress.start();
        this.$emit("toggle", newValue);
      }
    },
  },
};
</script>

<style lang="scss" scoped></style>
