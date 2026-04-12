// Global test setup for Mocha/Chai + Vue Test Utils
// Loaded before every test via --require (see package.json "tests" script).
//
// @vue/cli-plugin-unit-mocha already installs jsdom-global, which sets up
// window and document on the global scope. However, it doesn't copy every
// jsdom-provided constructor (DOMParser, MutationObserver, etc.) to globals,
// so code under test that references them unqualified fails with
// ReferenceError. This file bridges that gap.

if (typeof window !== "undefined") {
  // jsdom already installed by @vue/cli-plugin-unit-mocha/setup.js
  if (typeof global.DOMParser === "undefined" && window.DOMParser) {
    global.DOMParser = window.DOMParser;
  }
  if (
    typeof global.MutationObserver === "undefined" &&
    window.MutationObserver
  ) {
    global.MutationObserver = window.MutationObserver;
  }
  if (typeof global.HTMLElement === "undefined" && window.HTMLElement) {
    global.HTMLElement = window.HTMLElement;
  }
  if (typeof global.getComputedStyle === "undefined" && window.getComputedStyle) {
    global.getComputedStyle = window.getComputedStyle;
  }
} else {
  // Fallback: set up a fresh jsdom if vue-cli's setup didn't run
  const { JSDOM } = require("jsdom");
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost:8080",
  });
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.DOMParser = dom.window.DOMParser;
  global.MutationObserver = dom.window.MutationObserver;
  global.HTMLElement = dom.window.HTMLElement;
  global.getComputedStyle = dom.window.getComputedStyle;
}
