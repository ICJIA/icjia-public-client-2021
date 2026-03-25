/**
 * Lightweight drop-in replacement for NProgress.
 * Fixed-position top bar with pulsing glow, matching NProgress's visual style.
 * Exposes the same start() / done() / configure() API.
 */

let bar = null;
let spinner = null;
let timer = null;
let width = 0;
let styleInjected = false;

function injectStyles() {
  if (styleInjected) return;
  styleInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    #app-progress-bar {
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      background: #1565c0;
      z-index: 999999;
      width: 0;
      opacity: 0;
      pointer-events: none;
      transition: width .25s ease, opacity .15s ease;
      box-shadow: 0 0 8px rgba(21, 101, 192, 0.7), 0 0 3px rgba(21, 101, 192, 0.5);
    }
    #app-progress-bar.active {
      opacity: 1;
    }
    #app-progress-spinner {
      position: fixed;
      top: 8px;
      right: 8px;
      z-index: 999999;
      width: 20px;
      height: 20px;
      border: 2px solid transparent;
      border-top-color: #1565c0;
      border-left-color: #1565c0;
      border-radius: 50%;
      opacity: 0;
      pointer-events: none;
      animation: app-progress-spin .4s linear infinite;
      transition: opacity .15s ease;
    }
    #app-progress-spinner.active {
      opacity: 1;
    }
    @keyframes app-progress-spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

function getBar() {
  injectStyles();
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "app-progress-bar";
    document.body.appendChild(bar);
  }
  return bar;
}

function getSpinner() {
  injectStyles();
  if (!spinner) {
    spinner = document.createElement("div");
    spinner.id = "app-progress-spinner";
    document.body.appendChild(spinner);
  }
  return spinner;
}

const Progress = {
  start() {
    width = 8 + Math.random() * 7; // start between 8-15%
    const el = getBar();
    const sp = getSpinner();
    // Reset and show
    el.style.width = "0";
    el.style.transition = "none";
    // Force reflow so the reset takes effect before we animate
    void el.offsetWidth;
    el.style.transition = "width .25s ease, opacity .15s ease";
    el.classList.add("active");
    sp.classList.add("active");
    el.style.width = width + "%";
    // Trickle — slow increments that decelerate as they approach 90%
    clearInterval(timer);
    timer = setInterval(() => {
      if (width < 90) {
        const remaining = 90 - width;
        width += remaining * 0.04 + Math.random() * 2;
        if (width > 90) width = 90;
        el.style.width = width + "%";
      }
    }, 250);
  },

  done() {
    clearInterval(timer);
    timer = null;
    const el = getBar();
    const sp = getSpinner();
    // Quick fill to 100%
    el.style.width = "100%";
    sp.classList.remove("active");
    // Fade out after a brief pause
    setTimeout(() => {
      el.classList.remove("active");
      setTimeout(() => {
        width = 0;
        el.style.transition = "none";
        el.style.width = "0";
      }, 200);
    }, 300);
  },

  inc() {
    if (width < 90) {
      width += Math.random() * 3 + 1;
      if (width > 90) width = 90;
      const el = getBar();
      el.style.width = width + "%";
    }
  },

  set(n) {
    width = Math.max(0, Math.min(1, n)) * 100;
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
    if (spinner && spinner.parentNode) {
      spinner.parentNode.removeChild(spinner);
      spinner = null;
    }
  },
};

export default Progress;
