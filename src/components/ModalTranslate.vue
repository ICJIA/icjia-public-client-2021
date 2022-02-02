<template>
  <v-dialog
    v-model="translate"
    ref="translateTop"
    style="z-index: 999999"
    width="60%"
  >
    <v-card class="">
      <v-card-title class="text-h5 grey lighten-2">
        <v-spacer class="hidden-md-and-up"></v-spacer>
        Website Translation Options<v-spacer></v-spacer
        ><v-btn small @click="translate = false" class="hidden-sm-and-down"
          >Close</v-btn
        >
      </v-card-title>
      <v-card-text class="mt-3">
        <v-container fluid>
          <v-row>
            <v-col cols="12" md="4">
              <v-btn small text @click="googleTranslate('es')">Spanish</v-btn>
              <br />
              <v-btn small text @click="googleTranslate('pt')">Portugese</v-btn>
              <br />
              <v-btn small text @click="googleTranslate('fr')">French</v-btn>
              <br />
              <v-btn small text @click="googleTranslate('pl')">Polish</v-btn>
              <br />
              <v-btn small text @click="googleTranslate('ru')">Russian</v-btn>
              <br />
              <v-btn small text @click="googleTranslate('it')">Italian</v-btn>
              <br />
            </v-col>
            <v-col cols="12" md="4">
              <v-btn small text @click="googleTranslate('ar')">Arabic</v-btn>
              <br />
              <v-btn small text @click="googleTranslate('hy')">Armenian</v-btn>
              <br />
              <v-btn small text @click="googleTranslate('de')">German</v-btn>
              <br />

              <v-btn small text @click="googleTranslate('zh-TW')"
                >Chinese (Traditional)</v-btn
              >
              <br />
              <v-btn small text @click="googleTranslate('zh-CN')"
                >Chinese (Simplified)</v-btn
              >
              <br />

              <v-btn small text @click="googleTranslate('sr')">Serbian</v-btn>
              <br />
            </v-col>
            <v-col cols="12" md="4">
              <v-btn small text @click="googleTranslate('iw')">Hebrew</v-btn>
              <br />
              <v-btn small text @click="googleTranslate('hu')">Hungarian</v-btn>
              <br />
              <v-btn small text @click="googleTranslate('is')">Icelandic</v-btn>
              <br />
              <v-btn small text @click="googleTranslate('lv')">Latvian</v-btn>
              <br />
              <v-btn small text @click="googleTranslate('fa')">Persian</v-btn>
              <br />
              <v-btn small text @click="googleTranslate('tr')">Turkish</v-btn>
              <br />
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <!-- <v-card-title class="headline grey lighten-2">
        Translate: {{ page }}
      </v-card-title> -->

      <v-divider></v-divider>

      <!-- <v-card-actions class="mt-1">
        <v-spacer></v-spacer>
        <v-btn small text @click="show = !show">
          Disclaimer
          <v-icon right>{{
            show ? "mdi-chevron-up" : "mdi-chevron-down"
          }}</v-icon>
        </v-btn>

       
      </v-card-actions> -->
      <v-expand-transition>
        <div v-show="show">
          <!-- <v-divider></v-divider> -->

          <v-card-text style="font-size: 14px">
            {{ showDisclaimer("translation")[0]["body"] }}
          </v-card-text>
        </div>
      </v-expand-transition>
    </v-card>
  </v-dialog>
</template>

<script>
import { EventBus } from "@/event-bus";
export default {
  methods: {
    showDisclaimer(id) {
      return this.$myApp.disclaimers.filter((disclaimer) => {
        if (id === disclaimer.id) {
          return disclaimer;
        }
      });
    },
    googleTranslate(lang) {
      console.log(lang);
      window.plausible("translation_conversion", { props: { lang: lang } });
      const route = `${this.$myApp.config.api.baseClient}${this.$route.fullPath}`;
      const url =
        `https://translate.google.com/translate?hl=en&sl=en&u=${route}&tl=` +
        lang;
      this.translate = false;
      window.open(url);
    },
  },
  mounted() {
    EventBus.$on("translate", (page) => {
      this.translate = true;
      if (!page) {
        this.translate = false;
        return;
      }
      this.page = this.$myApp.config.clientBase + page;
    });
  },
  data() {
    return {
      translate: false,
      page: null,
      show: true,
    };
  },
};
</script>

<style lang="scss" scoped></style>
