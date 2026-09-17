/**
 * Keyboard support for a Vuetify v-menu of links opened by a button: the
 * WAI-ARIA menu button pattern (WCAG 4.1.2, 2.1.1, 2.4.3).
 *
 * Vuetify kept keyboard focus on the button and pointed at the highlighted
 * item with aria-activedescendant, which is not supported on a button, so a
 * screen reader was not told which item was highlighted. With these handlers
 * (and `disable-keys` on the v-menu, which turns Vuetify's own list keys off):
 *   - Enter or Space on the button opens the menu and moves focus to the
 *     first item; Down Arrow does the same, Up Arrow to the last item;
 *   - in the menu, Down and Up Arrow move focus through the items (wrapping),
 *     Home and End to the first and last, Enter or Space follows the link;
 *   - Escape closes the menu and returns focus to the button (Vuetify);
 *   - Tab closes the menu and moves on from the button.
 * A mouse click opens the menu as before and leaves focus where it was.
 *
 * `menu` is the v-menu component instance (a ref).
 */

const menuItems = (menu) => {
  const content = menu && menu.$refs.content;
  if (!content) return [];
  return Array.from(content.querySelectorAll(".v-list-item")).filter(
    (item) =>
      item.getAttribute("tabindex") !== "-1" &&
      !item.classList.contains("v-list-item--disabled")
  );
};

// The menu's content is rendered, or shown again, a moment after it opens.
const focusMenuItem = (menu, which, attempts = 20) => {
  const content = menu.$refs.content;
  const items = menuItems(menu);
  const shown = content && window.getComputedStyle(content).display !== "none";
  if (!items.length || !shown) {
    if (attempts > 0) {
      setTimeout(() => focusMenuItem(menu, which, attempts - 1), 25);
    }
    return;
  }
  items[which === "last" ? items.length - 1 : 0].focus();
};

export function onMenuButtonKeydown(event, menu) {
  if (!menu) return;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    menu.isActive = true;
    focusMenuItem(menu, event.key === "ArrowUp" ? "last" : "first");
  } else if (event.key === "Escape" && menu.isActive) {
    menu.isActive = false;
  }
}

// Enter and Space on a button fire a click with no pointer detail.
export function onMenuButtonClick(event, menu) {
  if (!menu || event.detail !== 0) return;
  // Vuetify's own click handler toggles the menu; look once it has.
  setTimeout(() => {
    if (menu.isActive) focusMenuItem(menu, "first");
  }, 0);
}

export function onMenuKeydown(event, menu) {
  if (!menu) return;
  const items = menuItems(menu);
  const index = items.indexOf(document.activeElement);
  let next = null;
  switch (event.key) {
    case "ArrowDown":
      next = items[(index + 1) % items.length];
      break;
    case "ArrowUp":
      next = items[(index - 1 + items.length) % items.length];
      break;
    case "Home":
      next = items[0];
      break;
    case "End":
      next = items[items.length - 1];
      break;
    case " ":
      if (index < 0) return;
      event.preventDefault();
      items[index].click();
      return;
    case "Tab": {
      // Close, and let the browser move on from the button.
      const button = menu.getActivator && menu.getActivator();
      menu.isActive = false;
      if (button) button.focus();
      return;
    }
    default:
      return;
  }
  event.preventDefault();
  // Vuetify's own list navigation (which sets aria-activedescendant on the
  // button) would otherwise run as well.
  event.stopPropagation();
  if (next) next.focus();
}
