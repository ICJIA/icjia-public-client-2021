<template>
  <!-- Below 600 px the dialog fills the screen (WCAG 1.4.10). At 60% of a
       320 px window it was 192 px wide: its title broke inside "Translation",
       and "Chinese (Traditional)" and "Chinese (Simplified)" lost their last
       letters. -->
  <v-dialog
    v-model="translate"
    ref="translateTop"
    style="z-index: 999999"
    width="60%"
    :fullscreen="$vuetify.breakpoint.xsOnly"
    aria-label="Translation options"
    @keydown="keepFocusInDialog"
  >
    <!-- Exposed as a modal dialog named by its title (WCAG 4.1.2). Close is
         shown at every width: it used to be hidden below 960 px, where
         Vuetify's focus trap, which sends focus to the first button, then
         failed and let focus leave the open dialog (WCAG 2.4.3). -->
    <v-card
      class=""
      ref="dialogCard"
      role="dialog"
      aria-modal="true"
      aria-labelledby="translate-dialog-title"
    >
      <!-- Words wrap whole: a card title breaks them anywhere. -->
      <v-card-title class="text-h5 grey lighten-2" style="word-break: normal">
        <v-spacer class="hidden-md-and-up"></v-spacer>
        <span id="translate-dialog-title">Website Translation Options</span
        ><v-spacer></v-spacer
        ><v-btn small ref="closeButton" @click="translate = false">Close</v-btn>
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
            <router-link to="/forms/lap-request/" @click.native="followLink"
              >this online form.</router-link
            >
            <br />
            <br />
            For more information on ICJIA's language access plan, please see our
            <router-link
              to="/news/language-services-announcement/"
              @click.native="followLink"
              >language services announcement</router-link
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
    // Tab from the last link wraps to Close, and Shift+Tab from Close to the
    // last link (WCAG 2.4.3). Vuetify pulls focus back only after it has left
    // the dialog: Tab from the last link stopped once outside the page first,
    // and Shift+Tab from Close went to the dialog's outer container and then
    // straight back to Close, so the languages and links could not be
    // reached backwards.
    keepFocusInDialog(event) {
      if (event.key !== "Tab" || !this.$refs.dialogCard) return;
      const card = this.$refs.dialogCard.$el;
      const focusable = Array.from(
        card.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.disabled && el.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !card.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    // The two links in the dialog lead to other pages. Close the dialog
    // without sending focus back to the button that opened it, which belongs
    // to the page being left; the route change moves focus as usual.
    followLink() {
      const dialog = this.$refs.translateTop;
      if (dialog) dialog.previousActiveElement = null;
      this.translate = false;
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
  watch: {
    // Vuetify focuses the dialog's outer container, which is outside the
    // dialog role and has no name. Move focus to Close, inside the dialog,
    // once Vuetify has done that, so the dialog's role and name are announced.
    translate(isOpen) {
      if (!isOpen) return;
      setTimeout(() => {
        const close = this.$refs.closeButton && this.$refs.closeButton.$el;
        if (this.translate && close) close.focus();
      }, 0);
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
