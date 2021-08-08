<template>
  <v-dialog v-model="translate" width="500">
    <v-card class="pt-4">
      <v-card-text>
        <v-container fluid>
          <v-row>
            <v-col>
              <v-btn small text @click="googleTranslate('es')">Spanish</v-btn>
              <v-btn small text @click="googleTranslate('pt')">Portugese</v-btn>
              <v-btn small text @click="googleTranslate('fr')">French</v-btn>
              <v-btn small text @click="googleTranslate('pl')">Polish</v-btn>
              <v-btn small text @click="googleTranslate('ru')">Russian</v-btn>
            </v-col>
            <v-col>
              <v-btn small text @click="googleTranslate('es')">Spanish</v-btn>
              <v-btn small text @click="googleTranslate('pt')">Portugese</v-btn>
              <v-btn small text @click="googleTranslate('fr')">French</v-btn>
              <v-btn small text @click="googleTranslate('pl')">Polish</v-btn>
              <v-btn small text @click="googleTranslate('ru')">Russian</v-btn>
            </v-col>
            <v-col>
              <v-btn small text @click="googleTranslate('es')">Spanish</v-btn>
              <v-btn small text @click="googleTranslate('pt')">Portugese</v-btn>
              <v-btn small text @click="googleTranslate('fr')">French</v-btn>
              <v-btn small text @click="googleTranslate('pl')">Polish</v-btn>
              <v-btn small text @click="googleTranslate('ru')">Russian</v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <!-- <v-card-title class="headline grey lighten-2">
        Translate: {{ page }}
      </v-card-title> -->

      <v-divider></v-divider>

      <v-card-actions class="mt-1">
        <v-btn x-small text @click="show = !show">
          Disclaimer
          <v-icon right>{{
            show ? "mdi-chevron-up" : "mdi-chevron-down"
          }}</v-icon>
        </v-btn>
        <v-spacer></v-spacer>

        <v-btn color="grey" dark @click="translate = false" small>
          Close
        </v-btn>
      </v-card-actions>
      <v-expand-transition>
        <div v-show="show">
          <v-divider></v-divider>

          <v-card-text style="font-size: 11px">
            The Illinois Criminal Justice Information Authority ("ICJIA") offers
            translations of the content through Google Translate. Because Google
            Translate is an external website, ICJIA does not control the quality
            or accuracy of translated content. All ICJIA content is filtered
            through Google Translate which may result in unexpected and
            unpredictable degradation of portions of text, images and the
            general appearance on translated pages. Google Translate may
            maintain unique privacy and use policies. These policies are not
            controlled by ICJIA and are not associated with ICJIA's privacy and
            use policies.
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
    googleTranslate(lang) {
      console.log(lang);
      const route = "https://agency.icjia.cloud" + this.$route.fullPath;

      const url =
        `http://translate.google.com/translate?hl=en&sl=en&u=${route}&tl=` +
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
      show: false,
    };
  },
};
</script>

<style lang="scss" scoped></style>
