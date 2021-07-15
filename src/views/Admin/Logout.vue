<template>
  <div class="text-center mt-12">
    <h1>LOGGGED OUT</h1>
    <router-link to="/admin/login">Login</router-link>
  </div>
</template>

<script>
export default {
  created() {
    this.$store.dispatch("auth/logout");
  },
};
</script>
