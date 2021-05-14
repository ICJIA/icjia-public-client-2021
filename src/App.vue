<template>
  <v-app>
    <v-main style="background: #fafafa">
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
