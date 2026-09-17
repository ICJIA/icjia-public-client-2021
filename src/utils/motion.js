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

/**
 * Settings for Vuetify's $vuetify.goTo(): the page jumps instead of scrolling
 * for 500 ms when reduced motion is requested.
 */
export function goToOptions(options = {}) {
  return prefersReducedMotion() ? { ...options, duration: 0 } : options;
}
