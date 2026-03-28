<template>
  <div>
    <v-btn-toggle v-model="icon" mandatory>
      <v-btn value="list" small aria-label="List view" elevation="1">
        <span class="hidden-sm-and-down button-weight">List</span>

        <span aria-hidden="true" class="mdi mdi-format-list-bulleted"> </span>
      </v-btn>

      <v-btn value="grid" small elevation="1" aria-label="Grid view">
        <span class="hidden-sm-and-down button-weight">Grid</span>

        <span class="mdi mdi-view-module" aria-hidden="true"> </span>
      </v-btn>
    </v-btn-toggle>
  </div>
</template>

<script>
export default {
  data() {
    return {
      icon: "grid",
    };
  },
  watch: {
    icon(newValue, oldValue) {
      if (!newValue) {
        this.$emit("toggle", oldValue);
      } else {
        this.$emit("toggle", newValue);
      }
    },
  },
};
</script>

<style lang="scss" scoped></style>
