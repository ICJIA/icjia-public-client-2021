<template functional>
  <div class="font-lato mt-1" :class="props.dense ? 'dense' : ''">
    <span v-if="props.name" class="small font-weight-bold pr-2">{{
      props.name
    }}</span>
    <!-- A space between the label and its value for assistive technology:
         only padding separates them on screen, and a card link's name read
         "ContributorsICJIA R&A staff" (WCAG 2.5.3). -->
    <span v-if="props.name" class="sr-only"> </span>
    <template v-if="props.name == 'Tags'">
      <slot></slot>
    </template>
    <span v-else class="small"><slot></slot></span>
  </div>
</template>

<script>
export default {
  props: {
    name: {
      type: String,
      default: "",
    },
    dense: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped>
.dense {
  line-height: 1.2;
}
</style>
