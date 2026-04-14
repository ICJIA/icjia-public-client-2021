<template>
  <v-footer dark class="">
    <v-card
      flat
      tile
      width="100%"
      class="text-center pb-4"
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
              <router-link
                to="/"
                aria-label="ICJIA Home"
                style="text-decoration: none"
              >
                <img
                  src="/icjia-logo.png"
                  alt=""
                  width="100"
                  height="70"
                  loading="lazy"
                  decoding="async"
                  style="border: 0px solid #ddd; display: inline"
                />
                <span class="sr-only">ICJIA Home</span>
              </router-link>
            </div>
            <div class="pb-6" aria-hidden="true"></div>
            <div style="font-size: 12px; font-weight: 400; color: #fff">
              <router-link to="/about/" style="color: #fff; background: none"
                >About</router-link
              >

              |
              <router-link
                to="/about/contact/"
                style="color: #fff; background: none"
                >Contact</router-link
              >

              |
              <router-link to="/search/" style="color: #fff; background: none">
                Search</router-link
              >

              <!-- |
              <router-link to="/sitemap" style="color: #fff; background: none"
                >Sitemap</router-link
              > -->

              |
              <!-- <router-link
                to="/about/covid-19/"
                style="color: #fff; background: none"
              >
                Covid-19 Response</router-link
              >
              | -->
              <a
                href="https://archive.icjia.cloud"
                style="color: #fff; background: none"
                target="_blank"
                rel="noopener noreferrer"
                >Document Archive</a
              >

              |
              <router-link to="/foia/" style="color: #fff; background: none">
                FOIA</router-link
              >

              |
              <router-link
                to="/forms/lap-request/"
                style="color: #fff; background: none"
              >
                Language Access Request</router-link
              >
              |

              <router-link
                to="/about/privacy/"
                style="color: #fff; background: none"
                >Privacy</router-link
              >
              |
              <router-link
                to="/forms/grant-status/"
                style="color: #fff; background: none"
                >Grant Status Request</router-link
              >
              |
              <a
                href="https://visitor.r20.constantcontact.com/manage/optin?v=001MqUcqqvjwLCJXlLMSWbTe3zHHmEQgFeBuHvBcJWTbwgrxFbDSGx4HSUPpI6DJWMUPgbljtLxffqIcGFTgCnr-auak88ybvRxpoJlTMGPtZs%3D"
                style="color: #fff; background: none"
                target="_blank"
                rel="noopener noreferrer"
                >Subscribe to CJ Dispatch</a
              >
              |
              <button
                type="button"
                style="
                  color: #fff;
                  background: none;
                  border: none;
                  cursor: pointer;
                  font-size: inherit;
                  font-family: inherit;
                  padding: 0;
                  text-decoration: underline;
                "
                @click="openTranslationModal"
              >
                Translate Site
              </button>
            </div>

            <div
              class="mt-3"
              style="font-size: 12px; font-weight: 300; color: #fff"
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
  methods: {
    openTranslationModal() {
      EventBus.$emit("translate", this.$route.fullPath);
    },
  },
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
