<template>
  <div>
    <h1>Static Search/Tag search here</h1>
    <div v-if="$route.params.query">
      <h2>Search query: {{ $route.params.query }}</h2>
    </div>
  </div>
</template>

<script>
export default {};
</script>

<style lang="scss" scoped></style>
