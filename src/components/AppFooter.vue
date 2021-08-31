<template>
  <v-footer dark class="">
    <v-card
      flat
      tile
      width="100%"
      class="text-center markdown-body pb-4"
      style="background: #0d4474"
    >
      <v-container class="mt-0" fill-height>
        <v-row align="center" justify="center">
          <!-- <v-col cols="12" md="6" class="text-center mt-2">
            <img src="/icjia-logo.png" alt="Footer logo" />
          </v-col> -->
          <v-col
            cols="12"
            md="12"
            class="text-center mt-2"
            style="color: white"
          >
            <div>
              <img
                src="/icjia-logo.png"
                alt="Footer logo"
                width="100"
                style="border: 0px solid #ddd; display: inline"
              />
            </div>
            <div class="pb-6">
              <span class="v-icon fab fa-twitter mr-4"></span
              ><span class="v-icon fab fa-facebook mr-4"></span>
              <span class="v-icon fab fa-youtube"></span>
            </div>
            <div style="font-size: 12px; font-weight: 400">
              <router-link to="/about/" style="color: #fff; background: none"
                >About</router-link
              >
              |
              <router-link
                to="/about/privacy/"
                style="color: #fff; background: none"
                >Privacy</router-link
              >
              |
              <router-link
                to="/about/contact/"
                style="color: #fff; background: none"
                >Contact</router-link
              >
              <!-- |
              <router-link to="/sitemap" style="color: #fff; background: none"
                >Sitemap</router-link
              >
              |
              <router-link to="/rss" style="color: #fff; background: none"
                >RSS</router-link
              > -->

              |
              <router-link
                to="/about/covid-19/"
                style="color: #fff; background: none"
              >
                Covid-19 Response</router-link
              >
              |
              <router-link to="/foia/" style="color: #fff; background: none">
                FOIA</router-link
              >
              |
              <a
                href="https://archive.icjia.cloud"
                style="color: #fff; background: none"
                target="_blank"
                >Document Archive</a
              >
              |
              <a
                href="https://github.com/ICJIA/icjia-public-2021"
                style="color: #fff; background: none"
                target="_blank"
                >Github</a
              >
            </div>

            <div
              class="mt-3"
              style="font-size: 12px; font-weight: 300; color: #ccc"
            >
              <strong
                >&#169; {{ new Date().getFullYear() }} Illinois Criminal Justice
                Information Authority</strong
              >
            </div></v-col
          >
        </v-row>
      </v-container>
    </v-card>
  </v-footer>
</template>

<script>
import { EventBus } from "@/event-bus";
export default {
  mounted() {
    EventBus.$on("show-footer", () => {
      console.log("show-footer event");
      this.showFooter = true;
    });
  },
  data() {
    return {
      showFooter: false,
    };
  },
};
</script>

<style>
.router-link-exact-active {
  color: #fff !important;
  font-weight: 900;
}
</style>
