<template>
  <div><HomeSplash :slides="slides"></HomeSplash></div>
</template>

<script>
export default {
  data() {
    return {
      slides: null,
      error: null,
    };
  },
};
</script>

<style lang="scss" scoped></style>
