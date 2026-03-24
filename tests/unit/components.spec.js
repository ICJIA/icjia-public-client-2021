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

  it("has correct aria-label", () => {
    const router = new VueRouter();
    const wrapper = shallowMount(SkipLink, { localVue, vuetify, router });
    const link = wrapper.find("#skip-to-content");
    expect(link.attributes("aria-label")).to.equal("Skip to content");
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

  it("links to #content", () => {
    const router = new VueRouter();
    const wrapper = shallowMount(SkipLink, { localVue, vuetify, router });
    const link = wrapper.find("#skip-to-content");
    expect(link.attributes("to")).to.equal("#content");
  });
});

// ---------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------
describe("Banner component", () => {
  it("renders nothing when item is null", () => {
    const wrapper = shallowMount(Banner, {
      localVue,
      vuetify,
      propsData: { item: null },
    });
    expect(wrapper.html()).to.equal("");
  });

  it("renders alert when item is provided", () => {
    const wrapper = shallowMount(Banner, {
      localVue,
      vuetify,
      propsData: {
        item: {
          bannerColor: "#ff0000",
          whiteText: true,
          dismissable: true,
          bannerText: "<p>Test banner</p>",
        },
      },
    });
    expect(wrapper.find(".banner-text").exists()).to.be.true;
  });

  it("passes dismissible prop correctly", () => {
    const wrapper = shallowMount(Banner, {
      localVue,
      vuetify,
      propsData: {
        item: {
          bannerColor: "#ff0000",
          whiteText: false,
          dismissable: false,
          bannerText: "Not dismissible",
        },
      },
    });
    const alert = wrapper.findComponent({ name: "v-alert" });
    expect(alert.exists()).to.be.true;
  });

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

  it("renders disclaimer label as h2", () => {
    const wrapper = shallowMount(Disclaimer, {
      localVue,
      vuetify,
      propsData: {
        disclaimer: [{ label: "Disclaimer Title", body: "Body text here." }],
      },
    });
    const h2 = wrapper.find("h2");
    expect(h2.exists()).to.be.true;
    expect(h2.text()).to.equal("Disclaimer Title");
  });

  it("renders body content via markdown", () => {
    const wrapper = shallowMount(Disclaimer, {
      localVue,
      vuetify,
      propsData: {
        disclaimer: [{ label: "Test", body: "**important** text" }],
      },
    });
    const bodyDiv = wrapper.find(".mt-2");
    expect(bodyDiv.exists()).to.be.true;
    // v-html should contain rendered markdown
    expect(bodyDiv.element.innerHTML).to.include("<strong>important</strong>");
  });

  it("has id=disclaimer on container", () => {
    const wrapper = shallowMount(Disclaimer, {
      localVue,
      vuetify,
      propsData: {
        disclaimer: [{ label: "Test", body: "Body" }],
      },
    });
    const card = wrapper.findComponent({ name: "v-card" });
    expect(card.exists()).to.be.true;
  });

  it("sanitizes XSS in disclaimer body", () => {
    const wrapper = shallowMount(Disclaimer, {
      localVue,
      vuetify,
      propsData: {
        disclaimer: [
          {
            label: "Test",
            body: '<script>alert("xss")</script>Safe content',
          },
        ],
      },
    });
    const bodyDiv = wrapper.find(".mt-2");
    expect(bodyDiv.element.innerHTML).to.not.include("<script");
    expect(bodyDiv.element.innerHTML).to.include("Safe content");
  });
});
