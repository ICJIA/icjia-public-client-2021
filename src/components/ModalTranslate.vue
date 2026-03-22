<template>
  <v-dialog
    v-model="translate"
    ref="translateTop"
    style="z-index: 999999"
    width="60%"
    aria-label="Translation options"
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
          <v-card-text style="font-size: 14px">
            The Illinois Criminal Justice Information Authority ('ICJIA') offers
            translations of the content through Google Translate. Because Google
            Translate is an external website, ICJIA does not control the quality
            or accuracy of translated content. All ICJIA content is filtered
            through Google Translate which may result in unexpected and
            unpredictable degradation of portions of text, images and the
            general appearance on translated pages. Google Translate may
            maintain unique privacy and use policies. These policies are not
            controlled by ICJIA and are not associated with ICJIA's privacy and
            use policies.
            <br />
            <br />
            ICJIA would like to ensure that it provides Limited English
            Proficiency (LEP) individuals with meaningful and universal access
            to ICJIA services, programs, and activities by all persons,
            including those who self-identify as an LEP individual or have a
            preference for information and materials in a language other than
            English. To support its goals of being inclusive and accessible to
            all, ICJIA provides free language assistance services to individuals
            whose primary language is not English. Language assistance services
            include providing qualified interpreters and translating documents
            to ease access to important information about ICJIA programs,
            benefits, and activities. <br />
            <br />If you need additional language access assistance, please fill
            out
            <a @click.stop.prevent="closeModal()">this online form.</a>
            <br />
            <br />
            For more information on ICJIA's language access plan, please see our
            <a @click.stop.prevent="closeModalLAP()"
              >language services announcement</a
            >.
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
    // showDisclaimer(id) {
    //   return this.$myApp.disclaimers.filter((disclaimer) => {
    //     if (id === disclaimer.id) {
    //       return disclaimer;
    //     }
    //   });
    // },
    closeModal() {
      this.translate = false;
      this.$router.push("/forms/lap-request/").catch(() => {
        this.$vuetify.goTo(0);
      });
    },
    closeModalLAP() {
      this.translate = false;
      this.$router.push("/news/language-services-announcement/").catch(() => {
        this.$vuetify.goTo(0);
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
