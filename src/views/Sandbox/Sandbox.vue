<template>
  <div></div>
</template>

<script>
export default {
  data() {
    return {
      search: null,
    };
  },
  async mounted() {
    // const myInit = {
    //   mode: "no-cors",
    // };
    // let searchURL;
    // searchURL = `https://icjia-public.netlify.app/.netlify/functions/search`;
    // let response = await fetch(searchURL, {
    //   mode: "n"
    // });
    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`);
    // }
    // this.search = await response.json();
    // console.log(this.search);
    fetch("https://icjia-public.netlify.app/.netlify/functions/search")
      .then((response) => response.json())
      .then((data) => console.log(data));
  },
};
</script>

<style lang="scss" scoped></style>
