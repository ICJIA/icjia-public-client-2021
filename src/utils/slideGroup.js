// Scrolling rows of links (the context bars' v-tabs; see
// src/components/ContextNavTabs.js).

/**
 * The bar's scroll offset that shows a link whole, 8 px clear of the bar's
 * edges when there is room, moving the bar as little as possible. A link as
 * wide as the bar is aligned with its start.
 *
 * link: { left, width } in the bar's content, as offsetLeft and clientWidth.
 * widths: { content, wrapper }, the scrolled content's and the bar's widths.
 */
export function revealOffset(link, widths, current, margin = 8) {
  const max = Math.max(0, widths.content - widths.wrapper);
  const room = Math.max(0, Math.min(margin, (widths.wrapper - link.width) / 2));
  let offset = current;
  if (link.left - room < current) {
    offset = link.left - room;
  } else if (link.left + link.width + room > current + widths.wrapper) {
    offset = Math.min(
      link.left - room,
      link.left + link.width + room - widths.wrapper
    );
  }
  return Math.max(0, Math.min(offset, max));
}
