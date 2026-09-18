/* eslint-env mocha */
// =============================================================================
// A context bar that is gone does not measure itself (v1.5.92)
//
// App.vue rebuilds the context bars for every address, and Vuetify measures a
// bar in the next animation frame. On a first load the app renders once for
// the router's start address "/", builds a bar for it, and destroys it when the
// real address arrives; the measurement already queued then ran on the dead
// bar. With no current link to select, Vuetify's scrollIntoView reads
// this.$refs.wrapper, which no longer exists: "Cannot read properties of
// undefined (reading 'getBoundingClientRect')", seen as the dev server's red
// overlay on about one load in twenty. A probe caught it: destroyed, no wrapper
// ref, 12 items, none selected, created for "/" while the route was /search/R3.
// =============================================================================
import { expect } from "chai";
import { ContextTabsBar } from "@/components/ContextNavTabs";

const scrollIntoView = ContextTabsBar.options.methods.scrollIntoView;
const rect = { left: 0, right: 100 };

describe("Context bar: measuring after it is gone", () => {
  it("does nothing once the bar's DOM is gone", () => {
    const bar = {
      selectedItem: undefined,
      items: [{ $el: { getBoundingClientRect: () => rect } }],
      $refs: {},
      $vuetify: { rtl: false },
    };
    expect(() => scrollIntoView.call(bar)).to.not.throw();
  });

  it("still measures a living bar, as Vuetify does", () => {
    let scrolled = null;
    const bar = {
      selectedItem: undefined,
      items: [
        { $el: { getBoundingClientRect: () => ({ left: -40, right: 60 }) } },
      ],
      $refs: { wrapper: { getBoundingClientRect: () => rect } },
      $vuetify: { rtl: false },
      scrollTo: (where) => (scrolled = where),
    };
    scrollIntoView.call(bar);
    expect(scrolled).to.equal("prev");
  });
});
