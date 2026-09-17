import Vue from "vue";
import Vuetify from "vuetify/lib/framework";

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    themes: {
      light: {
        primary: "#1565c0", // Darker blue for WCAG AA contrast compliance (4.54:1 ratio)
        // Form error text and labels: 7.33:1 on white. Vuetify's default,
        // #ff5252, is 3.19:1 (WCAG 1.4.3 needs 4.5:1).
        error: "#b00020",
      },
    },
  },
});
