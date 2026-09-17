// =============================================================================
// Focus containment (src/utils/focus.js) and reduced-motion scrolling
// (src/utils/motion.js), as used by the Events calendar's details dialog and
// by the contents lists, footnotes and context bars.
// =============================================================================
import { expect } from "chai";
import { keepFocusWithin } from "@/utils/focus";
import { goToOptions } from "@/utils/motion";

const tab = (target, shiftKey = false) => {
  const event = new window.KeyboardEvent("keydown", {
    key: "Tab",
    shiftKey,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
};

describe("keepFocusWithin — Tab stays inside an open dialog", () => {
  let dialog;
  beforeEach(() => {
    document.body.innerHTML =
      '<button id="outside">Outside</button>' +
      '<div id="dialog"><div tabindex="0" id="card">Entry</div>' +
      '<button id="close">Close</button><a href="/x" id="link">Tag</a></div>';
    dialog = document.getElementById("dialog");
    // jsdom has no layout: every element reports a client rect here.
    Array.from(dialog.querySelectorAll("*")).forEach((el) => {
      el.getClientRects = () => [{}];
    });
    dialog.addEventListener("keydown", (e) => keepFocusWithin(e, dialog));
  });

  it("wraps Tab from the last element to the first", () => {
    document.getElementById("link").focus();
    const event = tab(document.activeElement);
    expect(event.defaultPrevented).to.equal(true);
    expect(document.activeElement.id).to.equal("card");
  });

  it("wraps Shift+Tab from the first element to the last", () => {
    document.getElementById("card").focus();
    const event = tab(document.activeElement, true);
    expect(event.defaultPrevented).to.equal(true);
    expect(document.activeElement.id).to.equal("link");
  });

  it("leaves Tab between the elements inside to the browser", () => {
    document.getElementById("card").focus();
    const event = tab(document.activeElement);
    expect(event.defaultPrevented).to.equal(false);
    expect(document.activeElement.id).to.equal("card");
  });

  it("ignores other keys", () => {
    document.getElementById("link").focus();
    const event = new window.KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    document.activeElement.dispatchEvent(event);
    expect(event.defaultPrevented).to.equal(false);
  });
});

describe("goToOptions — scripted scrolling and reduced motion", () => {
  let matchMedia;
  const prefer = (reduce) => {
    window.matchMedia = (query) => ({
      matches: reduce && /prefers-reduced-motion: reduce/.test(query),
    });
  };
  beforeEach(() => {
    matchMedia = window.matchMedia;
  });
  afterEach(() => {
    window.matchMedia = matchMedia;
  });

  it("jumps (duration 0) when reduced motion is requested, keeping the offset", () => {
    prefer(true);
    expect(goToOptions({ offset: 80 })).to.deep.equal({
      offset: 80,
      duration: 0,
    });
    expect(goToOptions()).to.deep.equal({ duration: 0 });
  });

  it("leaves Vuetify's animation alone otherwise", () => {
    prefer(false);
    expect(goToOptions({ offset: 80 })).to.deep.equal({ offset: 80 });
    expect(goToOptions()).to.deep.equal({});
  });
});
