<template>
  <div>
    <div
      class="pl-3 pr-9 py-3"
      style="
        background: #0d4474;
        color: #fff;

        font-size: 18px;
      "
      :class="{
        'text-left':
          $vuetify.breakpoint.md ||
          $vuetify.breakpoint.lg ||
          $vuetify.breakpoint.xl,
        'text-center': $vuetify.breakpoint.sm || $vuetify.breakpoint.xs,
      }"
    >
      <span>
        <span style="font-weight: 600">ICJIA Overview</span> &raquo;
        <span style="font-weight: 300">{{
          currentItem.replace("tab-", "")
        }}</span>
      </span>
    </div>
    <v-toolbar dense v-resize="onResize" color="#105a96" dark flat>
      <v-tabs
        v-model="currentItem"
        fixed-tabs
        slider-color="white"
        justify-end
        show-arrows
        row
        wrap
      >
        <v-tab
          v-for="(item, index) in tabs"
          :key="`context${index}`"
          :href="'#tab-' + item"
        >
          {{ item }}
        </v-tab>

        <v-menu v-if="more.length" bottom left>
          <template v-slot:activator="{ on }">
            <v-btn text class="align-self-center mr-4" v-on="on">
              more
              <v-icon right>mdi-menu-down</v-icon>
            </v-btn>
          </template>

          <v-list class="grey lighten-3">
            <v-list-item
              v-for="item in more"
              :key="`more${item}`"
              @click="addItem(item)"
            >
              {{ item }}
            </v-list-item>
          </v-list>
        </v-menu>
      </v-tabs>
    </v-toolbar>
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentItem: "tab-Web",
      items: ["Web", "Shopping", "Videos", "Images", "Tab 5", "Tab 6"],
      tabs: [],
      more: [],
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    };
  },
  methods: {
    addItem(item) {
      const removed = this.tabs.splice(this.tabs.length - 1, 1);
      this.tabs.push(...this.more.splice(this.more.indexOf(item), 1));
      this.more.push(...removed);
      this.$nextTick(() => {
        this.currentItem = "tab-" + item;
      });
    },
    onResize() {
      const temp = this.items.slice();
      this.tabs = temp.splice(0, window.innerWidth / 120 - 1);
      this.more = temp.splice(0);
    },
  },
};
</script>

<style lang="scss" scoped></style>
