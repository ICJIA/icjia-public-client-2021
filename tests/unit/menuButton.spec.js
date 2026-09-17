// =============================================================================
// Menu button keyboard support (src/utils/menuButton.js)
// A v-menu is stood in for by a plain object with the parts the helpers use:
// isActive, $refs.content and getActivator().
// =============================================================================
import { expect } from "chai";
import { onMenuButtonKeydown, onMenuKeydown } from "@/utils/menuButton";

const setup = () => {
  document.body.innerHTML =
    '<button id="button">About</button>' +
    '<div id="content" role="menu"><div class="v-list">' +
    '<a class="v-list-item" href="/about/" tabindex="0">Overview</a>' +
    '<div class="v-list-item__title">Section</div>' +
    '<a class="v-list-item" href="/about/board/" tabindex="0">Board</a>' +
    '<a class="v-list-item" href="/about/staff/" tabindex="0">Staff</a>' +
    "</div></div>";
  const button = document.getElementById("button");
  return {
    isActive: true,
    $refs: { content: document.getElementById("content") },
    getActivator: () => button,
  };
};
const key = (name, target) => {
  const event = new window.KeyboardEvent("keydown", {
    key: name,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
};
const items = () => Array.from(document.querySelectorAll("a.v-list-item"));

describe("menuButton — keys in the open menu", () => {
  let menu;
  let seenByParent;
  const listen = (event) => onMenuKeydown(event, menu);
  beforeEach(() => {
    menu = setup();
    seenByParent = [];
    menu.$refs.content.addEventListener("keydown", (e) =>
      seenByParent.push(e.key)
    );
    menu.$refs.content
      .querySelector(".v-list")
      .addEventListener("keydown", listen);
  });

  it("moves focus through the items with the arrow keys, wrapping, and Home and End", () => {
    items()[0].focus();
    key("ArrowDown", document.activeElement);
    expect(document.activeElement.textContent).to.equal("Board");
    key("ArrowDown", document.activeElement);
    key("ArrowDown", document.activeElement);
    expect(document.activeElement.textContent).to.equal("Overview");
    key("ArrowUp", document.activeElement);
    expect(document.activeElement.textContent).to.equal("Staff");
    key("Home", document.activeElement);
    expect(document.activeElement.textContent).to.equal("Overview");
    key("End", document.activeElement);
    expect(document.activeElement.textContent).to.equal("Staff");
    // Vuetify's own list keys (aria-activedescendant) never see them.
    expect(seenByParent).to.deep.equal([]);
  });

  it("follows the focused link with Space", () => {
    let clicked = null;
    items()[1].addEventListener("click", (e) => {
      e.preventDefault();
      clicked = e.currentTarget.textContent;
    });
    items()[1].focus();
    const event = key(" ", document.activeElement);
    expect(clicked).to.equal("Board");
    expect(event.defaultPrevented).to.equal(true);
  });

  it("closes the menu on Tab and returns focus to the button", () => {
    items()[2].focus();
    const event = key("Tab", document.activeElement);
    expect(menu.isActive).to.equal(false);
    expect(document.activeElement.id).to.equal("button");
    // The browser's own Tab then moves on from the button.
    expect(event.defaultPrevented).to.equal(false);
  });
});

describe("menuButton — keys on the button", () => {
  it("opens the menu with Down Arrow and focuses the first item", (done) => {
    const menu = setup();
    menu.isActive = false;
    const event = key("ArrowDown", menu.getActivator());
    onMenuButtonKeydown(event, menu);
    expect(menu.isActive).to.equal(true);
    setTimeout(() => {
      expect(document.activeElement.textContent).to.equal("Overview");
      done();
    }, 60);
  });

  it("opens the menu with Up Arrow and focuses the last item", (done) => {
    const menu = setup();
    menu.isActive = false;
    const event = key("ArrowUp", menu.getActivator());
    onMenuButtonKeydown(event, menu);
    setTimeout(() => {
      expect(document.activeElement.textContent).to.equal("Staff");
      done();
    }, 60);
  });

  it("closes an open menu with Escape", () => {
    const menu = setup();
    const event = key("Escape", menu.getActivator());
    onMenuButtonKeydown(event, menu);
    expect(menu.isActive).to.equal(false);
  });
});
