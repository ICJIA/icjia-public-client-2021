<template>
  <!-- <div class="text-center mt-12">
    <h1>404 | Page not found</h1>
  </div> -->
  <v-container fill-height style="height: 85vh !important">
    <v-row row wrap align-center>
      <v-flex class="text-center">
        <div>
          <div style="font-weight: 300; font-size: 50px; color: #777">Oops</div>
          <div style="font-weight: 700; font-size: 22px" class="mt-2">
            404 | Page not found
          </div>
          <div class="mt-5">
            <v-btn x-small to="/" class="mr-2">Back to home page</v-btn>
            <!-- <v-btn x-small to="/web-support/" class="ml-2"
              >Contact web support</v-btn
            > -->
          </div>
        </div>
      </v-flex>
    </v-row>
  </v-container>
</template>

<script>
export default {
  created() {},
};
</script>

<style lang="scss" scoped></style>
