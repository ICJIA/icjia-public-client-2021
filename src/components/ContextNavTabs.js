import { VTabs } from "vuetify/lib";
import VTabsBar from "vuetify/lib/components/VTabs/VTabsBar";
import { convertToUnit } from "vuetify/lib/util/helpers";
import { revealOffset } from "@/utils/slideGroup";

// The scrolling row of links in a context navigation bar (AppNavContext,
// AppNavContextBottom): v-tabs, except that a link reached by Tab is scrolled
// wholly into the bar. Vuetify's bar scrolled a link at its right edge 40% of
// the link's width further than needed, so a link wider than about 70% of the
// bar went past its left edge instead: at 375 px, Tab left a link partly
// hidden, and partly under a scroll arrow, in 5 of the 6 bars tried ("Funded
// Programs", "Web Applications", "Staff Organization").

const ContextTabsBar = VTabsBar.extend({
  name: "context-tabs-bar",

  methods: {
    // Vuetify's handler, with revealOffset (src/utils/slideGroup.js). Widths
    // are read now: fonts that load after the bar is measured change them.
    onFocusin(e) {
      if (!this.isOverflowing) return;
      const item = this.items.find((vm) => vm.$el.contains(e.target));
      if (!item) return;
      this.scrollOffset = revealOffset(
        { left: item.$el.offsetLeft, width: item.$el.clientWidth },
        {
          content: this.$refs.content.clientWidth,
          wrapper: this.$refs.wrapper.clientWidth,
        },
        this.scrollOffset
      );
    },
  },
});

export default VTabs.extend({
  name: "context-nav-tabs",

  methods: {
    // VTabs' own genBar, with the bar above.
    genBar(items, slider) {
      const data = {
        style: {
          height: convertToUnit(this.height),
        },
        props: {
          activeClass: this.activeClass,
          centerActive: this.centerActive,
          dark: this.dark,
          light: this.light,
          mandatory: !this.optional,
          mobileBreakpoint: this.mobileBreakpoint,
          nextIcon: this.nextIcon,
          prevIcon: this.prevIcon,
          showArrows: this.showArrows,
          value: this.internalValue,
        },
        on: {
          "call:slider": this.callSlider,
          change: (val) => {
            this.internalValue = val;
          },
        },
        ref: "items",
      };
      this.setTextColor(this.computedColor, data);
      this.setBackgroundColor(this.backgroundColor, data);
      return this.$createElement(ContextTabsBar, data, [
        this.genSlider(slider),
        items,
      ]);
    },
  },
});
