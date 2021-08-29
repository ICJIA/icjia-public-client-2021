<template>
  <v-app-bar
    flat
    color="white"
    style="border-top: 1px solid #ccc !important"
    class="mb-0"
  >
    <div
      style="font-size: 26px; font-weight: 900; text-transform: uppercase"
      v-if="
        $vuetify.breakpoint.md ||
        $vuetify.breakpoint.lg ||
        ($vuetify.breakpoint.xl && mobileTitle)
      "
    >
      {{ title }}
    </div>
    <div
      style="font-size: 26px; font-weight: 900; text-transform: uppercase"
      v-else-if="
        $vuetify.breakpoint.sm || ($vuetify.breakpoint.xs && mobileTitle)
      "
    >
      {{ mobileTitle }}
    </div>
    <div
      style="font-size: 26px; font-weight: 900; text-transform: uppercase"
      v-else
    >
      {{ title }}
    </div>
    <v-spacer></v-spacer>
    <v-menu v-if="menuItems && menuItems.length > 1">
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          text
          large
          v-bind="attrs"
          v-on="on"
          style="margin-right: 0px !important; font-weight: 900"
        >
          MENU
          <v-icon right>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>

      <v-list>
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
    <v-btn large text v-else style="font-weight: 900" :to="menuItems[0].url"
      >{{ menuItems[0].label }}&nbsp;&raquo;</v-btn
    ></v-app-bar
  >
</template>

<script>
export default {
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
