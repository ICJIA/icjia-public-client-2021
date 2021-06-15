<template>
  <div v-if="toc" class="">
    <h2>Contents</h2>
    <ul>
      <li v-for="(item, index) in toc" :key="index" style="font-size: 14px">
        {{ item.innerHTML }}
      </li>
    </ul>
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
