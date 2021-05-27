<template>
  <div>
    <div v-if="!loading">
      <div v-for="(item, index) in items" :key="`newsCard-${index}`">
        <HomeCardNews :item="item" :index="index"></HomeCardNews>
      </div>
    </div>
    <div v-if="loading">
      <Loader
        loaderType="skeleton"
        :repeat="4"
        loaderDisplayType="list-item-avatar-three-line, list-item-three-line"
      ></Loader>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: true,
    },
  },
};
</script>

<style lang="scss" scoped></style>
