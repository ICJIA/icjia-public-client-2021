<template>
  <div>
    <!-- <v-container fill-height fluid class="px-0" style="margin-top: -15px">
      <v-row no-gutters>
        <v-col
          cols="12"
          :md="getBoxSize"
          v-for="(box, index) in featureBoxes.box"
          :key="`box-${index}`"
        >
          <router-link :to="box.url" v-if="box.url">
            <v-card
              dark
              height="100%"
              class="elevation-0 px-10 py-8 box"
              :color="getFeatureBoxColor(index)"
            >
              <h2 class="text-center box-head">{{ box.title }}</h2>

              <v-card-text class="px-2 font-weight-light box-text">
                <span v-html="box.summary"></span>
              </v-card-text>
            </v-card>
          </router-link>
        </v-col>
      </v-row>
    </v-container> -->
    {{ clickThroughBoxes }}
  </div>
</template>

<script>
export default {
  computed: {
    // getBoxSize() {
    //   return 12 / this.clickThroughBoxes.box.length;
    // },
  },
  methods: {
    getFeatureBoxColor(index) {
      //TODO: Figure this out dynamically
      return this.colors[index];
    },
  },
  data() {
    return {
      colors: [
        "#442B99",
        "#7655E4",
        "#9274F7",
        "#442B99",
        "#7655E4",
        "#9274F7",
        "#442B99",
        "#7655E4",
        "#9274F7",
        "#442B99",
        "#7655E4",
        "#9274F7",
      ],
    };
  },
  props: {
    clickThroughBoxes: {
      type: Array,
      default: () => {},
    },
  },
};
</script>

<style scoped>
a {
  text-decoration: none !important;
}
.box:hover {
  background: #ccc !important;
}
.box:hover > * {
  color: #444;
  cursor: pointer;
}
.box-head {
  font-size: 28px;
  text-transform: uppercase;
  color: #fff;
  font-weight: 900;
}
.box-text {
  font-size: 18px;
  margin-top: 8px;
  color: #fff;
}
.rule {
  border-bottom: 1px solid #ccc !important;
  border-top: 1px solid #ccc !important;
}

.v-sheet.v-card {
  border-radius: 0px;
}
</style>
