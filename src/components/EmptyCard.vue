<template>
  <v-card
    class="hover event-card mr-2 mt-1 mb-1"
    :style="`height: ${height}px; overflow-y: auto`"
    elevation="0"
  >
    <v-container fill-height fluid>
      <v-row align="center" justify="center">
        <v-col class="text-center">
          <h2 style="font-size: 40px; margin-top: -70px">{{ text }}</h2>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      default: "This card is intentionally blank.",
    },
    height: {
      type: Number,
      default: 400,
    },
  },
};
</script>

<style lang="scss" scoped></style>
