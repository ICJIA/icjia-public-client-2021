<template>
  <!-- <div class="text-center mt-12">
    <h1>404 | Page not found</h1>
  </div> -->
  <v-container style="margin-top: 30px">
    <v-row>
      <v-flex class="text-center">
        <div style="margin-top: 0px">
          <div style="font-weight: 900; font-size: 120px; color: #0d4474" aria-hidden="true">
            Oops
          </div>
          <h1 style="font-weight: 700; font-size: 48px; margin: 0;" class="mt-0">
            404 | Page not found
          </h1>
          <div class="mt-12">
            <v-btn text color="grey darken-4" dark to="/" class="mr-2"
              >ICJIA Home&nbsp;&raquo;</v-btn
            >
            <v-btn
              text
              color="grey darken-4"
              dark
              to="/grants/funding/"
              class="mr-2"
              >Funding Opportunities&nbsp;&raquo;</v-btn
            >
            <v-btn
              text
              color="grey darken-4"
              dark
              to="/researchhub/"
              class="mr-2"
              >Research&nbsp;&raquo;</v-btn
            >
            <v-btn
              text
              color="grey darken-4"
              dark
              to="/news/meetings/"
              class="mr-2"
              >Meetings&nbsp;&raquo;</v-btn
            >
            <v-btn
              text
              color="grey darken-4"
              dark
              to="/about/contact/"
              class="mr-2"
              >Contact&nbsp;&raquo;</v-btn
            >
            <v-btn
              text
              color="grey darken-4"
              dark
              to="/news/press/"
              class="mr-2"
              >Press&nbsp;&raquo;</v-btn
            >
            <v-btn
              text
              color="grey darken-4"
              dark
              to="/about/employment/"
              class="mr-2"
              >Employment&nbsp;&raquo;</v-btn
            >
            <v-btn
              text
              color="grey darken-4"
              dark
              to="/innovation-and-digital-services/"
              class="mr-2"
              >Innovation and Digital Services&nbsp;&raquo;</v-btn
            >
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
  mounted() {
    window.plausible("404", { props: { path: document.location.pathname } });
  },
};
</script>

<style lang="scss" scoped></style>
