// =============================================================================
// Focus containment (src/utils/focus.js) and reduced-motion scrolling
// (src/utils/motion.js), as used by the Events calendar's details dialog and
// by the contents lists, footnotes and context bars.
// =============================================================================
import { expect } from "chai";
import { keepFocusWithin, moveFocusTo } from "@/utils/focus";
import { goToOptions } from "@/utils/motion";
import { revealOffset } from "@/utils/slideGroup";

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

describe("moveFocusTo — the start of a new page of results", () => {
  it("focuses a heading for as long as it holds focus", () => {
    document.body.innerHTML = '<h3 id="h">Earlier</h3><a href="/x">Next</a>';
    const heading = document.getElementById("h");
    moveFocusTo(heading);
    expect(document.activeElement).to.equal(heading);
    expect(heading.getAttribute("tabindex")).to.equal("-1");
    document.querySelector("a").focus();
    expect(heading.hasAttribute("tabindex")).to.equal(false);
  });

  it("does nothing without a target", () => {
    expect(() => moveFocusTo(null)).to.not.throw();
  });
});

// A context bar 247 px wide (at 375 px) scrolling 1,596 px of links.
describe("revealOffset — a context bar's link reached by Tab is shown whole", () => {
  const widths = { content: 1596, wrapper: 247 };

  it("leaves a link already in view where it is", () => {
    expect(revealOffset({ left: 20, width: 131 }, widths, 0)).to.equal(0);
  });

  it("brings a link past the right edge in, 8 px clear of it", () => {
    // "Staff Organization", 206 px at 400 px: Vuetify scrolled to 441.4,
    // which hid its first 41 px.
    const offset = revealOffset({ left: 400, width: 206 }, widths, 260.6);
    expect(offset).to.equal(400 + 206 + 8 - 247);
    expect(400 - offset).to.be.at.least(8);
    expect(400 + 206 - offset).to.be.at.most(247 - 8);
  });

  it("brings a link past the left edge in, 8 px clear of it", () => {
    expect(revealOffset({ left: 131, width: 200 }, widths, 300)).to.equal(123);
  });

  it("shows the start of a link as wide as the bar", () => {
    expect(revealOffset({ left: 980, width: 247 }, widths, 700)).to.equal(980);
    expect(revealOffset({ left: 980, width: 247 }, widths, 1200)).to.equal(980);
  });

  it("keeps less room when the link nearly fills the bar", () => {
    // 236 px in 247: 5.5 px each side.
    expect(revealOffset({ left: 500, width: 236 }, widths, 0)).to.equal(494.5);
  });

  it("stays within the content", () => {
    expect(revealOffset({ left: 2, width: 100 }, widths, 50)).to.equal(0);
    expect(revealOffset({ left: 1489, width: 107 }, widths, 1000)).to.equal(
      1349
    );
  });
});
