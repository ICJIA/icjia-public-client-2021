/**
 * Keyboard focus and card-click helpers (WCAG 2.1.1 Keyboard, 2.4.3 Focus
 * Order).
 */

/**
 * Move keyboard focus to an in-page target — the heading a table-of-contents
 * link points to, a footnote, or the reference a footnote links back to — so
 * the next Tab continues from there instead of from the link that was
 * activated. A target that cannot take focus (a heading, a list item) gets
 * tabindex="-1" while it holds focus. It does not scroll: the caller scrolls.
 */
export function moveFocusTo(el) {
  if (!el || typeof el.focus !== "function") return;
  if (!el.hasAttribute("tabindex") && el.tabIndex < 0) {
    el.setAttribute("tabindex", "-1");
    el.addEventListener("blur", () => el.removeAttribute("tabindex"), {
      once: true,
    });
  }
  el.focus({ preventScroll: true });
}

/**
 * True when a click on a card landed on a link inside it: the card's title
 * link, or a tag or category link. The link handles the click itself. A click
 * anywhere else on the card still opens the card's page, as it did when the
 * whole card was the click target. (Buttons inside these cards stop the click
 * from reaching the card themselves, and a badge button without a handler
 * still opens the page as before.)
 */
export function isClickOnLink(event) {
  const target = event && event.target;
  return Boolean(target && target.closest && target.closest("a[href]"));
}
