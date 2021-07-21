<template>
  <div v-if="boxes && boxes.length">
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <h2 id="for-more-information">For more information</h2>
        </v-col>

        <div class="flex-container">
          <v-card
            class="elevation-2 px-8 py-10 box text-center hover info-card"
            style="border: 1px solid #ddd"
            v-for="(box, index) in boxes"
            :data-aos="getAnimation()"
            :key="index"
            :color="getBoxColor(index)"
            @click="routeToURL(box.url)"
            :class="{
              'flex-item-3': boxesPerRow === 3,
              'flex-item-2': boxesPerRow === 2,
            }"
          >
            <v-icon style="font-size: 70px" v-if="box.icon">{{
              box.icon
            }}</v-icon>
            <v-icon style="font-size: 70px" v-else>dns</v-icon>
            <h3
              class="text-center box-head mt-3"
              style="
                color: black;
                border-bottom: 1px solid #aaa;
                padding-bottom: 10px;
                font-size: 30px;
              "
            >
              {{ box.title }}
            </h3>

            <v-card-text
              class="px-2 mt-1 font-weight-heavy box-text text-center"
              v-if="box.teaser"
            >
              <span v-html="box.teaser" style="font-size: 14px"></span>
            </v-card-text>
          </v-card>
        </div>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  computed: {
    // rows() {
    //   let numberOfBoxes = this.boxes.length;
    //   // given 3 boxes in a row, compute rows
    //   let rows = Math.ceil(numberOfBoxes / 3);
    //   return rows;
    // },
  },
  data() {
    return {};
  },
  methods: {
    // eslint-disable-next-line no-unused-vars
    getAnimation() {
      if (this.disableAnimation) return null;
      return this.animation;
    },
    // eslint-disable-next-line no-unused-vars
    getBoxColor(index) {
      return "#f1f1f1";
    },
    routeToURL(url) {
      if (url.indexOf("http") === 0) {
        //external
        window.open(url, "noopener,resizable,scrollbars").focus();
      } else {
        this.$router.push(url).catch(() => {
          this.$vuetify.goTo(0);
        });
      }
    },
  },
  props: {
    boxes: {
      type: Array,
      default: () => [],
    },
    boxesPerRow: {
      type: Number,
      default: 3,
    },
    animation: {
      type: String,
      default: "zoom-in",
    },
    disableAnimation: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style>
.flex-container {
  width: 100%;

  display: flex;
  flex-flow: row wrap;
  position: relative;
}

.flex-item-2 {
  background: blue;

  margin: 5px;
  flex: 0 1 calc(50% - 15px); /* <-- adjusting for margin */
  flex-grow: 1;
}

.flex-item-3 {
  background: blue;

  margin: 5px;
  flex: 0 1 calc(33% - 15px); /* <-- adjusting for margin */
  flex-grow: 1;
}

@media only screen and (max-width: 600px) {
  .flex-item {
    background: blue;

    margin: 0px;
    margin-top: 10px;
    flex: 0 1 calc(100%); /* <-- adjusting for margin */
    flex-grow: 1;
  }
}
</style>
