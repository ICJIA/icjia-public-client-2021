<template>
  <v-footer dark style="z-index: 10000 !important">
    <v-card
      flat
      tile
      width="100%"
      class="text-center pt-12 pb-4 markdown-body"
      style="background: #0d4474; border-top: 2px solid #888 !important"
    >
      <v-container>
        <v-row>
          <v-col cols="12" md="4" style="color: white">
            <h3 style="color: white" class="mb-3 h2">Footer Heading 1</h3>
            <p class="text-left" style="font-size: 13px">
              Lorem markdownum nunc, virginea ornabant hanc, Lelex etiam
              postibus ire, adspicio. Vidit novissima nihil in tamen Plena at
              lumina adfixa nocuisse quos deceptam utque stravit Philemon et?
              Questus subibis quoque, formosior committat insignis, cumque nam.
            </p>
          </v-col>
          <v-col cols="12" md="4" style="color: white">
            <h3 style="color: white" class="mb-3 h2">Footer Heading 2</h3>
            <p class="text-left" style="font-size: 13px">
              Blandis fateor causamque membris pulsa quaecumque perosus accedere
              Aeson adflabitur. Nocebit distent in faciem obsequio in nescit
              ecce morsa hoc prima exosus. Ortus ferus, quidem! Ostendens
              longeque maris volucresque, amictu penitus flectit infantem et
              loca demissaque non.
            </p>
          </v-col>
          <v-col cols="12" md="4" style="color: white">
            <h3 style="color: white" class="mb-3 h2">Footer Heading 3</h3>
            <p class="text-left" style="font-size: 13px">
              Lorem markdownum nunc, virginea ornabant hanc, Lelex etiam
              postibus ire, adspicio. Vidit novissima nihil in tamen Plena at
              lumina adfixa nocuisse quos deceptam utque stravit Philemon et?
              Questus subibis quoque, formosior committat insignis, cumque nam.
            </p>
          </v-col>
        </v-row>
      </v-container>
      <v-container class="mt-3" style="border-top: 1px solid #fff" fill-height>
        <v-row align="center" justify="center">
          <v-col cols="12" md="6" class="text-center mt-2">
            <img src="/icjia-logo.png" alt="Footer logo" />
          </v-col>
          <v-col cols="12" md="6" class="text-center mt-2" style="color: white">
            <div class="py-4">
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
              |
              <router-link to="/sitemap" style="color: #fff; background: none"
                >Sitemap</router-link
              >
              |
              <router-link to="/rss" style="color: #fff; background: none"
                >RSS</router-link
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

<style>
.router-link-exact-active {
  color: #fff !important;
  font-weight: 900;
}
</style>
