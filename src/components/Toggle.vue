<template>
  <div>
    <v-btn-toggle v-model="icon" borderless>
      <v-btn value="list" small aria-label="List view">
        <span class="hidden-sm-and-down">List</span>

        <span aria-hidden="true" class="mdi mdi-format-list-bulleted"> </span>
      </v-btn>

      <v-btn value="block" small>
        <span class="hidden-sm-and-down" aria-label="Block view">Block</span>

        <span class="mdi mdi-view-module" aria-hidden="true"> </span>
      </v-btn>
    </v-btn-toggle>
  </div>
</template>

<script>
export default {
  data() {
    return {
      icon: "block",
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
