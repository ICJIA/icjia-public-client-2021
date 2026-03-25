/**
 * Lightweight drop-in replacement for NProgress.
 * Uses a CSS-animated top-of-page progress bar instead of the nprogress library.
 * Exposes the same start() / done() / configure() API so existing call sites
 * need only change their import path.
 */

let bar = null;
let timer = null;
let width = 0;

function getBar() {
  if (bar) return bar;
  bar = document.getElementById("app-progress-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "app-progress-bar";
    bar.style.cssText =
      "position:fixed;top:0;left:0;height:3px;background:#1565c0;" +
      "z-index:999999;transition:width .2s ease;width:0;pointer-events:none;";
    document.body.appendChild(bar);
  }
  return bar;
}

const Progress = {
  start() {
    width = 10;
    const el = getBar();
    el.style.opacity = "1";
    el.style.width = width + "%";
    clearInterval(timer);
    timer = setInterval(() => {
      if (width < 90) {
        width += Math.random() * 10;
        if (width > 90) width = 90;
        el.style.width = width + "%";
      }
    }, 300);
  },

  done() {
    clearInterval(timer);
    timer = null;
    const el = getBar();
    el.style.width = "100%";
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => {
        width = 0;
        el.style.width = "0";
      }, 200);
    }, 200);
  },

  inc() {
    if (width < 90) {
      width += Math.random() * 5;
      const el = getBar();
      el.style.width = width + "%";
    }
  },

  set(n) {
    width = n * 100;
    const el = getBar();
    el.style.width = width + "%";
  },

  configure() {
    // no-op for API compatibility
    return this;
  },

  remove() {
    clearInterval(timer);
    if (bar && bar.parentNode) {
      bar.parentNode.removeChild(bar);
      bar = null;
    }
  },
};

export default Progress;
