<template>
  <div>
    <v-container fluid style="margin: 0 !important; padding: 0 !important">
      <v-row no-gutters>
        <v-col cols="12" md="4">
          <v-card
            :color="getColor(n)"
            style="height: 250px"
            class="py-5 px-2 text-center info-card hover"
            :class="{ boxGutter: gutter }"
          >
            <router-link
              to="/"
              aria-label="Read more about this item."
              class="skiplink dark"
              title="Read more about this item."
              style="font-size: 12px; margin-top: 5px; margin-left: 5px"
            >
              Read more about this item
            </router-link>
            <v-container fill-height fluid>
              <v-row align="center" justify="center">
                <v-col
                  ><v-icon style="font-size: 70px" dark>{{
                    icons[n - 1]
                  }}</v-icon>
                  <h2
                    style="
                      color: #fff;

                      margin-bottom: 10px;
                      font-size: 24px;
                    "
                  >
                    Click through title here
                  </h2>
                  <p style="color: #fff; font-size: 14px" v-if="showTeaser">
                    Lorem markdownum ramis ratus iussit Echidnaea
                  </p></v-col
                >
              </v-row>
            </v-container>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card
            :color="getColor(n)"
            style="height: 250px"
            class="py-5 px-2 text-center info-card hover"
            :class="{ boxGutter: gutter }"
          >
            <router-link
              to="/"
              aria-label="Read more about this item."
              class="skiplink dark"
              title="Read more about this item."
              style="font-size: 12px; margin-top: 5px; margin-left: 5px"
            >
              Read more about this item
            </router-link>
            <v-container fill-height fluid>
              <v-row align="center" justify="center">
                <v-col
                  ><v-icon style="font-size: 70px" dark>{{
                    icons[n - 1]
                  }}</v-icon>
                  <h2
                    style="
                      color: #fff;

                      margin-bottom: 10px;
                      font-size: 24px;
                    "
                  >
                    Click through title here
                  </h2>
                  <p style="color: #fff; font-size: 14px" v-if="showTeaser">
                    Lorem markdownum ramis ratus iussit Echidnaea
                  </p></v-col
                >
              </v-row>
            </v-container>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card
            :color="getColor(n)"
            style="height: 250px"
            class="py-5 px-2 text-center info-card hover"
            :class="{ boxGutter: gutter }"
          >
            <router-link
              to="/"
              aria-label="Read more about this item."
              class="skiplink dark"
              title="Read more about this item."
              style="font-size: 12px; margin-top: 5px; margin-left: 5px"
            >
              Read more about this item
            </router-link>
            <v-container fill-height fluid>
              <v-row align="center" justify="center">
                <v-col
                  ><v-icon style="font-size: 70px" dark>{{
                    icons[n - 1]
                  }}</v-icon>
                  <h2
                    style="
                      color: #fff;

                      margin-bottom: 10px;
                      font-size: 24px;
                    "
                  >
                    Click through title here
                  </h2>
                  <p style="color: #fff; font-size: 14px" v-if="showTeaser">
                    Lorem markdownum ramis ratus iussit Echidnaea
                  </p></v-col
                >
              </v-row>
            </v-container>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
/* eslint-disable vue/no-use-v-if-with-v-for */
export default {
  data() {
    return {
      colors: ["#333", "#555"],
      icons: ["fact_check", "leaderboard", "map", "contact_mail"],
    };
  },
  methods: {
    getColor(index) {
      if (index % 2 == 0) {
        return this.colors[0];
      } else {
        return this.colors[1];
      }
    },
  },
  computed: {
    boxColumns() {
      return 12 / this.boxes;
    },
  },
  props: {
    boxes: {
      type: Number,
      default: 3,
    },
    secondRow: {
      type: Boolean,
      default: false,
    },
    gutter: {
      type: Boolean,
      default: true,
    },
    showTeaser: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped>
/* .boxGutter {
  margin-right: 2px;
  margin-left: 2px;
} */
</style>
