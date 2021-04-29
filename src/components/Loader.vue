<template>
  <div class="text-center my-12" :style="{ 'min-height': `${height}px` }">
    <v-progress-circular
      indeterminate
      aria-label="Progress bar: Loading"
      color="primary"
      :size="size"
    ></v-progress-circular>
    <div class="mt-12" style="font-size: 12px; font-weight: bold">
      {{ loadingText }}
    </div>
  </div>
</template>

<script>
export default {
  mounted() {},
  props: {
    size: {
      type: String,
      default: "100",
    },
    height: {
      type: String,
      default: "500",
    },
    loadingText: {
      type: String,
      default: "LOADING...",
    },
  },
};
</script>

<style lang="scss" scoped></style>
