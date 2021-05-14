<template>
  <div>
    <v-container fill-height fluid class="px-0" style="margin-top: -10px">
      <v-row no-gutters>
        <v-col
          cols="12"
          :md="getBoxSize"
          v-for="(box, index) in boxes"
          :key="`box-${index}`"
        >
          <router-link :to="box.url" v-if="box.url">
            <v-card
              dark
              height="300px"
              class="elevation-0 px-8 py-10 box text-center"
              :color="getFeatureBoxColor(index)"
              :class="{ mr1: index > -1 && index < boxes.length - 1 }"
            >
              <v-icon style="font-size: 70px" dark>{{ box.icon }}</v-icon>
              <h2 class="text-center box-head mt-3">{{ box.title }}</h2>

              <v-card-text
                class="px-2 mt-1 font-weight-light box-text text-center"
              >
                <span v-html="box.teaser" style="font-size: 16px"></span>
              </v-card-text>
            </v-card>
          </router-link>
        </v-col>
      </v-row>
    </v-container>
    <!-- Boxes: {{ boxes }} -->
  </div>
</template>

<script>
export default {
  computed: {
    getBoxSize() {
      return 12 / this.boxes.length;
    },
  },
  methods: {
    getFeatureBoxColor(index) {
      //TODO: Figure this out dynamically
      return this.colors[index];
    },
  },
  data() {
    return {
      colors: ["#003784", "#002a8c", "#003784", "#003d7a"],
    };
  },
  props: {
    boxes: {
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
  color: #000 !important;
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
.box-text:hover {
  color: #000 !important;
}
.rule {
  border-bottom: 1px solid #ccc !important;
  border-top: 1px solid #ccc !important;
}

.v-sheet.v-card {
  border-radius: 0px;
}

.mr1 {
  margin-right: 2px;
}

.ml1 {
  margin-left: 2px;
}
</style>
