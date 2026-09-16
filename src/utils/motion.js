/**
 * True when the visitor's operating system asks for reduced motion.
 *
 * Checked at the moment of use rather than once at load, so a setting changed
 * mid-visit takes effect on the next scroll or slideshow start.
 */
export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** "smooth", or "auto" (an instant jump) when reduced motion is requested. */
export function scrollBehavior() {
  return prefersReducedMotion() ? "auto" : "smooth";
}
