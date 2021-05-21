<template>
  <v-app-bar
    flat
    dense
    color="grey lighten-4"
    style="border-top: 1px solid #d8d8d8 !important"
  >
    <div style="font-size: 22px; font-weight: 900; text-transform: uppercase">
      {{ title }}
    </div>
    <v-spacer></v-spacer>
    <v-menu>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          text
          small
          v-bind="attrs"
          v-on="on"
          style="margin-right: 0px !important; font-weight: 900"
        >
          MENU
          <v-icon right>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>

      <v-list>
        <v-list-item v-for="(item, idx) in menuItems" :key="`menu-${idx}`">
          <v-list-item-title class="hover" :to="item.url">{{
            item.label
          }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu></v-app-bar
  >
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: "Untitled",
    },
    menuItems: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style lang="scss" scoped></style>
