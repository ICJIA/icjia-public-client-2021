<template>
  <div v-if="toc">
    <h2>Contents</h2>
    <div v-for="(item, index) in toc" :key="index">
      {{ item.innerHTML }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      toc: null,
    };
  },
  mounted() {
    let headings = document.getElementsByTagName("h2");

    let headingsArr = Array.prototype.slice.call(headings);
    if (!headingsArr.length) {
      this.toc === null;
    } else {
      this.toc = headingsArr;
    }
  },
};
</script>

<style lang="scss" scoped></style>
