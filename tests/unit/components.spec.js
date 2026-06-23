// =============================================================================
// Vue component tests
// Validates rendering, props, a11y attributes, and behavior of key components.
// Requires: @vue/test-utils, chai, vuetify
// =============================================================================
import { expect } from "chai";
import { shallowMount, createLocalVue } from "@vue/test-utils";
import Vuetify from "vuetify";
import VueRouter from "vue-router";

import SkipLink from "@/components/SkipLink.vue";
import Banner from "@/components/Banner.vue";
import Disclaimer from "@/components/Disclaimer.vue";

const localVue = createLocalVue();
localVue.use(VueRouter);

// Vuetify must be instantiated per-test (not on localVue for Vuetify 2)
let vuetify;

beforeEach(() => {
  vuetify = new Vuetify();
});

// ---------------------------------------------------------------------------
// SkipLink
// ---------------------------------------------------------------------------
describe("SkipLink component", () => {
  it("renders a skip-to-content link", () => {
    const router = new VueRouter();
    const wrapper = shallowMount(SkipLink, { localVue, vuetify, router });
    const link = wrapper.find("#skip-to-content");
    expect(link.exists()).to.be.true;
  });

  it("exposes 'Skip to content' as the accessible name via visible text", () => {
    // The v1.5.3 rewrite removed aria-label because the visible text is
    // already "Skip to content" — carrying both would risk sia-r38
    // "Visible label and accessible name do not match" and adds nothing
    // for screen readers.
    const router = new VueRouter();
    const wrapper = shallowMount(SkipLink, { localVue, vuetify, router });
    const link = wrapper.find("#skip-to-content");
    expect(link.text().trim()).to.equal("Skip to content");
  });

  it("has correct text content", () => {
    const router = new VueRouter();
    const wrapper = shallowMount(SkipLink, { localVue, vuetify, router });
    expect(wrapper.text()).to.include("Skip to content");
  });

  it("is wrapped in a nav element", () => {
    const router = new VueRouter();
    const wrapper = shallowMount(SkipLink, { localVue, vuetify, router });
    expect(wrapper.element.tagName).to.equal("NAV");
  });

  it("links to #content via href (not router-link)", () => {
    // The v1.5.3 rewrite switched from <router-link to="#content"> to a
    // plain <a href="#content"> so the skip action doesn't trigger a
    // Vue Router navigation — hash-only navigation should stay within
    // the current route and let the @click handler manage focus.
    const router = new VueRouter();
    const wrapper = shallowMount(SkipLink, { localVue, vuetify, router });
    const link = wrapper.find("#skip-to-content");
    expect(link.attributes("href")).to.equal("#content");
  });
});

// ---------------------------------------------------------------------------
// Banner / Disclaimer — rendering tests
// ---------------------------------------------------------------------------
// These components use Vuetify 2 a-la-carte imports (v-alert, v-card, etc.)
// which are wired in by vuetify-loader at build time. vuetify-loader does
// not execute inside the mocha/webpack bundle, so Vue emits "template or
// render function not defined" for the Vuetify children and mount produces
// empty output. The real component rendering is exercised by the Playwright
// E2E suite; here we test only the pure-JS behavior (render() method, XSS
// sanitization via the renderToHtml() service).
describe("Banner component", () => {
  it("renders nothing when item is null", () => {
    const wrapper = shallowMount(Banner, {
      localVue,
      vuetify,
      propsData: { item: null },
    });
    expect(wrapper.html()).to.equal("");
  });

  // Skipped: requires vuetify-loader at test time (see block comment above)
  it.skip("renders alert when item is provided", () => {});

  // Skipped: requires vuetify-loader at test time (see block comment above)
  it.skip("passes dismissible prop correctly", () => {});

  it("has a render method that returns HTML string", () => {
    const wrapper = shallowMount(Banner, {
      localVue,
      vuetify,
      propsData: {
        item: {
          bannerColor: "#333",
          whiteText: true,
          dismissable: false,
          bannerText: "Test",
        },
      },
    });
    const result = wrapper.vm.render("**bold text**");
    expect(result).to.include("<strong>bold text</strong>");
  });

  it("render() method sanitizes XSS in markdown input", () => {
    const wrapper = shallowMount(Banner, {
      localVue,
      vuetify,
      propsData: {
        item: {
          bannerColor: "#333",
          whiteText: true,
          dismissable: false,
          bannerText: "Test",
        },
      },
    });
    const result = wrapper.vm.render('<script>alert("xss")</script>Safe');
    expect(result).to.not.include("<script");
    expect(result).to.include("Safe");
  });
});

// ---------------------------------------------------------------------------
// Disclaimer
// ---------------------------------------------------------------------------
describe("Disclaimer component", () => {
  it("renders nothing when disclaimer array is empty", () => {
    const wrapper = shallowMount(Disclaimer, {
      localVue,
      vuetify,
      propsData: { disclaimer: [] },
    });
    expect(wrapper.html()).to.equal("");
  });

  // Skipped: requires vuetify-loader at test time (see Banner block comment)
  it.skip("renders disclaimer label as h2", () => {});
  it.skip("renders body content via markdown", () => {});
  it.skip("has id=disclaimer on container", () => {});
  it.skip("sanitizes XSS in disclaimer body", () => {});
});

import EventToggle from "@/components/EventToggle.vue";

describe("EventToggle component", () => {
  it("emits toggleRange(0) on mount (current & ongoing default)", () => {
    const wrapper = shallowMount(EventToggle, { localVue, vuetify });
    expect(wrapper.emitted("toggleRange")[0]).to.deep.equal([0]);
  });

  it("emits toggleRange with the selected monthsBack on change", async () => {
    const wrapper = shallowMount(EventToggle, { localVue, vuetify });
    wrapper.vm.monthsBack = 12;
    await wrapper.vm.$nextTick();
    const emits = wrapper.emitted("toggleRange");
    expect(emits[emits.length - 1]).to.deep.equal([12]);
  });

  it("offers five range options (current + 6/12/18/24)", () => {
    const wrapper = shallowMount(EventToggle, { localVue, vuetify });
    expect(wrapper.vm.rangeItems.map((o) => o.monthsBack)).to.deep.equal([
      0, 6, 12, 18, 24,
    ]);
  });
});
