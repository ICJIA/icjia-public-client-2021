<template>
  <v-app-bar
    flat
    color="white"
    style="border-top: 1px solid #ccc !important"
    class="mb-0"
  >
    <h2
      style="
        font-size: 26px;
        font-weight: 900;
        text-transform: uppercase;
        margin: 0;
      "
      v-if="
        $vuetify.breakpoint.md ||
        $vuetify.breakpoint.lg ||
        ($vuetify.breakpoint.xl && mobileTitle)
      "
    >
      {{ title }}
    </h2>
    <h2
      style="
        font-size: 26px;
        font-weight: 900;
        text-transform: uppercase;
        margin: 0;
      "
      v-else-if="
        $vuetify.breakpoint.sm || ($vuetify.breakpoint.xs && mobileTitle)
      "
    >
      {{ mobileTitle }}
    </h2>
    <h2
      style="
        font-size: 26px;
        font-weight: 900;
        text-transform: uppercase;
        margin: 0;
      "
      v-else
    >
      {{ title }}
    </h2>
    <v-spacer></v-spacer>
    <!-- A menu button (src/utils/menuButton.js): opened from the keyboard,
         focus moves into the menu, and Vuetify's aria-activedescendant on the
         button is no longer used. -->
    <v-menu v-if="menuItems && menuItems.length > 1" disable-keys ref="menu">
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          text
          large
          v-bind="attrs"
          v-on="on"
          style="margin-right: 0px !important; font-weight: 900"
          @click="onMenuButtonClick($event, $refs.menu)"
          @keydown="onMenuButtonKeydown($event, $refs.menu)"
        >
          MENU
          <v-icon right>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>

      <v-list @keydown.native="onMenuKeydown($event, $refs.menu)">
        <div v-for="(item, idx) in menuItems" :key="`menu-${idx}`">
          <v-list-item :to="item.url" v-if="item.type != 'external'">
            <v-list-item-title class="hover">{{
              item.label
            }}</v-list-item-title>
          </v-list-item>
          <v-list-item :href="item.url" v-if="item.type === 'external'">
            <v-list-item-title class="hover">{{
              item.label
            }}</v-list-item-title>
          </v-list-item>
        </div>
      </v-list>
    </v-menu>
    <v-btn
      large
      text
      style="font-weight: 900"
      :to="menuItems[0].url"
      v-if="menuItems && menuItems.length === 1"
      >{{ menuItems[0].label }}&nbsp;&raquo;</v-btn
    ></v-app-bar
  >
</template>

<script>
import {
  onMenuButtonClick,
  onMenuButtonKeydown,
  onMenuKeydown,
} from "@/utils/menuButton";
export default {
  methods: {
    onMenuButtonClick,
    onMenuButtonKeydown,
    onMenuKeydown,
  },
  props: {
    title: {
      type: String,
      default: "Untitled",
    },
    mobileTitle: {
      type: String,
      default: null,
    },
    menuItems: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style lang="scss" scoped></style>
