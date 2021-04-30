<template>
  <div><HomeSplash :slides="slides" :loading="loading"></HomeSplash></div>
</template>

<script>
export default {
  data() {
    return {
      slides: null,
      error: null,
      loading: false,
    };
  },
};
</script>

<style lang="scss" scoped></style>
