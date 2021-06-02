<template>
  <div>
    <div
      class="text-center my-12"
      :style="{ 'min-height': `${height}px` }"
      v-if="loaderType === 'progress'"
    >
      <v-progress-circular
        indeterminate
        aria-label="Progress bar: Loading"
        color="primary"
        :size="size"
      ></v-progress-circular>
      <div class="mt-12" style="font-size: 12px; font-weight: bold">
        {{ loaderText }}
      </div>
    </div>
    <div v-if="loaderType === 'skeleton'">
      <div class="text-center">
        <v-skeleton-loader
          :boilerplate="false"
          class="mb-4"
          elevation="2"
          :type="loaderDisplayType"
          v-for="n in repeat"
          :key="n"
        ></v-skeleton-loader>
      </div>
    </div>
    <div v-if="loaderType === 'skeletonColumns'">
      <v-container fluid
        ><v-row v-for="idx in stacks" :key="idx">
          <v-col cols="12" :md="12 / repeat" v-for="n in repeat" :key="n">
            <v-skeleton-loader
              :boilerplate="false"
              elevation="2"
              :type="loaderDisplayType"
              :height="height"
            ></v-skeleton-loader
          ></v-col> </v-row
      ></v-container>
    </div>
  </div>
</template>

<script>
export default {
  mounted() {},
  data() {
    return {};
  },
  props: {
    size: {
      type: String,
      default: "100",
    },
    height: {
      type: String,
      default: "500",
    },
    loaderText: {
      type: String,
      default: "LOADING...",
    },
    loaderType: {
      type: String,
      default: "progress",
    },
    loaderDisplayType: {
      type: String,
      default: "card, article, actions",
    },
    repeat: {
      type: Number,
      default: 3,
    },
    stacks: {
      type: Number,
      default: 2,
    },
  },
};
</script>

<style lang="scss" scoped></style>
