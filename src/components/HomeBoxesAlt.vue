<template>
  <div>
    <v-container fluid style="margin: 0 !important; padding: 0 !important">
      <v-row no-gutters>
        <v-col cols="12" md="4">
          <v-card
            color="#3B5984"
            style="height: 250px"
            class="py-5 px-2 text-center info-card hover"
            :class="{ boxGutter: gutter }"
            @click="test('about')"
          >
            <v-container fill-height fluid>
              <v-row align="center" justify="center">
                <v-col
                  ><v-icon style="font-size: 70px; color: #fff" dark>{{
                    icons[0]
                  }}</v-icon>
                  <h2
                    style="
                      color: #fff;

                      margin-bottom: 10px;
                      font-size: 24px;
                    "
                  >
                    About i2i
                  </h2>
                  <p style="color: #fff; font-size: 14px" v-if="showTeaser">
                    i2i supports “grassroots” organizations and community
                    groups.
                  </p></v-col
                >
              </v-row>
            </v-container>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card
            color="#10366B"
            style="height: 250px"
            class="py-5 px-2 text-center info-card hover"
            :class="{ boxGutter: gutter }"
            @click="test('evidence')"
          >
            <v-container fill-height fluid>
              <v-row align="center" justify="center">
                <v-col
                  ><v-icon style="font-size: 70px; color: #fff" dark>{{
                    icons[2]
                  }}</v-icon>
                  <h2
                    style="
                      color: #fff;

                      margin-bottom: 10px;
                      font-size: 24px;
                    "
                  >
                    Our Approach
                  </h2>
                  <p style="color: #fff; font-size: 14px" v-if="showTeaser">
                    Find out more about our evidence-informed approach.
                  </p></v-col
                >
              </v-row>
            </v-container>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card
            color="#3B5984"
            style="height: 250px"
            class="py-5 px-2 text-center info-card hover"
            :class="{ boxGutter: gutter }"
            @click="test('capacity')"
          >
            <v-container fill-height fluid>
              <v-row align="center" justify="center">
                <v-col
                  ><v-icon style="font-size: 70px; color: #fff" dark>{{
                    icons[1]
                  }}</v-icon>
                  <h2
                    style="
                      color: #fff;

                      margin-bottom: 10px;
                      font-size: 24px;
                    "
                  >
                    Cohorts
                  </h2>
                  <p style="color: #fff; font-size: 14px" v-if="showTeaser">
                    Find out who's in the cohorts
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
    getColor() {
      return this.colors[1];
    },
    test(id) {
      //console.log("click: ", id);
      const test = document.getElementById(id);
      this.$vuetify.goTo(test, { offset: 15 });
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
