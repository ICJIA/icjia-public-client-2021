<template>
  <v-app>
    <v-main style="background: #f3f3f3">
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: "App",

  mounted() {
    console.log(this.$myApp);
  },
};
</script>
