<template>
  <div>
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <h2>For more information</h2>
        </v-col>

        <div class="flex-container">
          <v-card
            height="200px"
            class="flex-item"
            v-for="(box, index) in boxes"
            :key="index"
          >
            {{ box }}
          </v-card>
        </div>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  computed: {
    rows() {
      let numberOfBoxes = this.boxes.length;
      // given 3 boxes in a row, compute rows
      let rows = Math.ceil(numberOfBoxes / 3);
      return rows;
    },
  },
  data() {
    return {};
  },
  props: {
    boxes: {
      type: Array,
      default: () => [],
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

.flex-item {
  background: blue;

  margin: 1px;
  flex: 0 1 calc(33% - 3px); /* <-- adjusting for margin */
  flex-grow: 1;
}
</style>
