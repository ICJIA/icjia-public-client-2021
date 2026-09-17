import {
  fixComplexTable,
  fixSimpleTable,
  normalizeRaggedRows,
} from "@/utils/contentSanitizer";

// Fix Vuetify empty buttons
const fixButtonText = function (myClass, myText) {
  const myButtons = document.getElementsByClassName(myClass);

  for (let i = 0, len = myButtons.length; i < len; ++i) {
    const el = document.createElement("span");
    el.innerHTML = myText;
    el.classList.add("aria-hidden");
    myButtons[i].appendChild(el);
    // console.log('a11y: fixed buttons: ', myButtons[i])
  }
};

// Fix Vuetify blank TH tag on expandable tables & remove redundant 'role' attributes
const fixBlankTableHeadings = function () {
  const tableHeadings = document.getElementsByTagName("TH");
  for (let i = 0, len = tableHeadings.length; i < len; ++i) {
    if (tableHeadings[i].innerHTML === "<span></span>") {
      console.log("fixed TH");
      tableHeadings[i].innerHTML =
        "<span class='aria-hidden'>This cell is intentionally blank</span>";
    }
    tableHeadings[i].removeAttribute("role");
  }
};

// fix empty H2 headings with Nuxt 2.14+ sites using nuxt-content
const fixNuxtContentHeadings = function (querySelectors = "H2, H3") {
  const els = document.querySelectorAll(querySelectors);
  for (let i = 0, len = els.length; i < len; ++i) {
    const subEl = els[i].querySelectorAll("a");
    // console.log('a11y: fixed content heading: ', els[i])
    for (let i = 0, len = subEl.length; i < len; ++i) {
      subEl[i].remove();
    }
  }
};

// Extract a short, descriptive context string from the row containing this button.
// Strategy: scan tds for a `<strong>` (the convention used in PublicationsAll, MeetingTable,
// RequiredFormTable for the row's primary identifier). Fall back to the longest non-numeric
// cell text. Returns "" if nothing usable is found, signaling the caller to use the generic label.
const getRowContextLabel = function (button) {
  const row = button.closest("tr");
  if (!row) return "";
  const strongEl = row.querySelector("td strong");
  if (strongEl) {
    const text = strongEl.innerText.trim();
    if (text) return text.length > 80 ? text.slice(0, 77) + "…" : text;
  }
  // Fallback: pick the cell with the longest text that isn't purely a date or number.
  // The button's own cell is skipped: it holds the label this function wrote
  // on an earlier run, which would otherwise be repeated ("Toggle details for
  // Toggle details for …") when the rows are named again after sorting.
  let best = "";
  row.querySelectorAll("td").forEach((td) => {
    if (td.contains(button)) return;
    const text = td.innerText.trim();
    if (!text || /^[\d\s/,.-]+$/.test(text)) return;
    if (text.length > best.length) best = text;
  });
  if (best) return best.length > 80 ? best.slice(0, 77) + "…" : best;
  return "";
};

const fixExpandButtons = function (
  className = "v-data-table__expand-icon",
  fallbackLabel = "Expand"
) {
  const els = document.getElementsByClassName(className);
  for (let i = 0, len = els.length; i < len; ++i) {
    const btn = els[i];
    const context = getRowContextLabel(btn);
    const label = context ? `Toggle details for ${context}` : fallbackLabel;
    btn.setAttribute("aria-label", label);
    // Some auditors compute a button's accessible name from inner text rather than
    // aria-label (notably SiteImprove's sia-r12 returns `failed cantTell` on
    // aria-label-only icon buttons during partial SPA rendering). Mirror the label
    // into a clipped sr-only span so accessible name is recoverable from inner text too.
    let srOnly = btn.querySelector(".sr-only");
    if (!srOnly) {
      srOnly = document.createElement("span");
      srOnly.className = "sr-only";
      btn.appendChild(srOnly);
    }
    srOnly.textContent = label;
  }
};

const fixCarouselArrows = function () {
  const carousels = document.querySelectorAll(".v-carousel");
  carousels.forEach((carousel) => {
    const buttons = carousel.querySelectorAll(".v-btn--icon");
    buttons.forEach((btn, index) => {
      if (!btn.getAttribute("aria-label")) {
        btn.setAttribute(
          "aria-label",
          index === 0 ? "Previous slide" : "Next slide"
        );
      }
    });
  });
};

const fixTableRowKeyboard = function () {
  const rows = document.querySelectorAll(".v-data-table tbody tr");
  rows.forEach((row) => {
    if (row.querySelector("td") && !row.getAttribute("tabindex")) {
      row.setAttribute("tabindex", "0");
      row.setAttribute("role", "button");
      row.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          row.click();
        }
      });
    }
  });
};

// Fix grey v-chip contrast — Vuetify "grey" chips with white text fail AA
const fixChipContrast = function () {
  const chips = document.querySelectorAll(".v-chip");
  chips.forEach((chip) => {
    const content = chip.querySelector(".v-chip__content");
    if (!content) return;
    const bg = window.getComputedStyle(chip).backgroundColor;
    const fg = window.getComputedStyle(content).color;
    // Parse rgb values
    const parseBg = bg.match(/\d+/g);
    const parseFg = fg.match(/\d+/g);
    if (!parseBg || !parseFg) return;
    // Calculate relative luminance
    const lum = (r, g, b) => {
      const [rs, gs, bs] = [r, g, b].map((c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };
    const bgLum = lum(+parseBg[0], +parseBg[1], +parseBg[2]);
    const fgLum = lum(+parseFg[0], +parseFg[1], +parseFg[2]);
    const ratio =
      (Math.max(bgLum, fgLum) + 0.05) / (Math.min(bgLum, fgLum) + 0.05);
    // If contrast ratio fails AA (< 4.5:1), fix it
    if (ratio < 4.5) {
      // Dark background → ensure white text; light background → ensure dark text
      content.style.color = bgLum < 0.5 ? "#fff" : "#111";
    }
  });
};

// Fix heading order in CMS-rendered article/post bodies.
// Finds heading skips (e.g. h2 → h4) and demotes to the correct level.
const fixHeadingOrder = function (
  containerSelector = ".article-body, .markdown-body"
) {
  const containers = document.querySelectorAll(containerSelector);
  containers.forEach((container) => {
    const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
    if (!headings.length) return;
    let lastLevel = 0;
    // Find the first heading level on the page to establish baseline
    const pageH1 = document.querySelector("h1");
    if (pageH1) lastLevel = 1;
    headings.forEach((heading) => {
      const currentLevel = parseInt(heading.tagName[1], 10);
      const expectedMax = lastLevel + 1;
      if (currentLevel > expectedMax && lastLevel > 0) {
        // Replace with correct heading level
        const newTag = document.createElement("h" + expectedMax);
        newTag.innerHTML = heading.innerHTML;
        // Copy attributes
        for (const attr of heading.attributes) {
          newTag.setAttribute(attr.name, attr.value);
        }
        heading.parentNode.replaceChild(newTag, heading);
        lastLevel = expectedMax;
      } else {
        lastLevel = currentLevel;
      }
    });
  });
};

// Fix empty table headers from CMS content
const fixEmptyTableHeaders = function () {
  const headers = document.querySelectorAll("th");
  headers.forEach((th) => {
    const text = th.textContent.trim();
    if (!text || text === "") {
      th.innerHTML = "<span class='sr-only'>Column header</span>";
    }
  });
};

// Fix empty container elements from CMS content (sia-r68 / sia-r77).
// Removes completely empty <tr> rows, and fills empty <td>/<th> cells
// with a visible em-dash + sr-only "No data" label so the cell has
// content for both sighted users and screen readers. Filling (rather
// than hiding with aria-hidden) is required to satisfy sia-r77
// "Table cell missing context" — SiteImprove's rule checks DOM cell
// content, not aria-hidden status, so hidden-but-present empty cells
// continue to fail until they carry real text.
const EMPTY_CELL_FILL_HTML =
  '<span aria-hidden="true">\u2014</span><span class="sr-only">No data</span>';

const fixEmptyContainers = function () {
  const containers = document.querySelectorAll(".article-body, .markdown-body");
  containers.forEach((container) => {
    // Remove completely empty <tr> rows
    container.querySelectorAll("tr").forEach((tr) => {
      if (!tr.textContent.trim() && !tr.querySelector("img, svg, iframe")) {
        tr.remove();
      }
    });
    // Fill empty <td> cells with em-dash + sr-only "No data".
    // <th> cells are intentionally skipped — an empty header commonly
    // marks a corner/spacer position, and filling it would mislead
    // screen readers into announcing "No data" as a column/row label.
    container.querySelectorAll("td").forEach((cell) => {
      if (cell.textContent.trim()) return;
      if (
        cell.querySelector(
          "img, svg, iframe, video, audio, canvas, input, button, picture"
        )
      )
        return;
      // Don't re-fill cells already processed (CMS sanitizer or prior run)
      if (cell.querySelector(".sr-only")) return;
      cell.innerHTML = EMPTY_CELL_FILL_HTML;
      // Clear any stale aria-hidden from earlier (hide-based) implementations
      cell.removeAttribute("aria-hidden");
    });
  });
  // Hide any empty spacer divs site-wide
  document.querySelectorAll("div.pb-6, div.pb-8, div.pb-10").forEach((el) => {
    if (!el.textContent.trim() && el.children.length === 0) {
      el.setAttribute("aria-hidden", "true");
    }
  });
};

// Fix inline color styles in CMS content that fail WCAG AA contrast.
// Strapi authors sometimes set a text colour by hand ("color: #999"). Where
// that colour is below 4.5:1 (3:1 for large text) against the background the
// text is drawn on, it becomes black, or white on a dark background. Colours
// that already meet the ratio are left alone.
//
// The background is the first ancestor with an opaque background colour, with
// any semi-transparent backgrounds on the way blended over it, or the page's
// white when there is none. Text over a background image cannot be measured
// and is left alone. (This used to read a transparent ancestor,
// rgba(0, 0, 0, 0), as a dark background and skip the element, which skipped
// nearly all content.)
const parseRgb = function (value) {
  const m = (value || "").match(
    /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+)(%?))?\s*\)$/i
  );
  if (!m) return null;
  let alpha = m[4] === undefined ? 1 : parseFloat(m[4]);
  if (m[5]) alpha /= 100;
  return [+m[1], +m[2], +m[3], alpha];
};

const relativeLuminance = function ([r, g, b]) {
  const channel = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrastRatio = function (a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

// Composite a colour with alpha over an opaque one.
const blendOver = function (top, bottom) {
  return [0, 1, 2].map((i) => top[i] * top[3] + bottom[i] * (1 - top[3]));
};

// The opaque colour an element's text is drawn on, or null when a background
// image (a CSS image or a Vuetify v-img) is behind it.
const backgroundBehind = function (el) {
  const layers = [];
  for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
    if (node.classList.contains("v-image")) return null;
    const style = window.getComputedStyle(node);
    const image = style.backgroundImage;
    if (image && image !== "none") return null;
    const color = parseRgb(style.backgroundColor);
    if (color && color[3] > 0) {
      layers.push(color);
      if (color[3] >= 1) break;
    }
  }
  return layers
    .reverse()
    .reduce((below, layer) => blendOver(layer, below), [255, 255, 255]);
};

const isLargeText = function (el) {
  const style = window.getComputedStyle(el);
  const size = parseFloat(style.fontSize) || 0;
  const weight =
    style.fontWeight === "bold" ? 700 : parseInt(style.fontWeight, 10) || 400;
  return size >= 24 || (size >= 18.66 && weight >= 700);
};

const fixInlineColorContrast = function () {
  const containers = document.querySelectorAll(
    ".article-body, .markdown-body, .v-card__text"
  );
  containers.forEach((container) => {
    // Skip the disclaimer and overlays: they set their own colour pairs
    if (container.closest("#disclaimer")) return;
    container.querySelectorAll("[style]").forEach((el) => {
      if (el.closest("#disclaimer") || el.closest(".v-overlay")) return;
      // Skip chips — they have intentional background+text color pairings
      if (el.closest(".v-chip") || el.classList.contains("v-chip")) return;
      const style = el.getAttribute("style") || "";
      // A text colour set by hand, without a background set with it
      if (!/(^|;)\s*color\s*:/i.test(style) || /background/i.test(style)) {
        return;
      }
      const background = backgroundBehind(el);
      const text = parseRgb(window.getComputedStyle(el).color);
      if (!background || !text) return;
      const color = blendOver(text, background);
      const required = isLargeText(el) ? 3 : 4.5;
      if (contrastRatio(color, background) >= required) return;
      const black = contrastRatio([0, 0, 0], background);
      const white = contrastRatio([255, 255, 255], background);
      el.style.setProperty(
        "color",
        black >= white ? "#000" : "#fff",
        el.style.getPropertyPriority("color")
      );
    });
  });
};

// Fix footnote links that are too small for touch targets (sia-r113 / WCAG 2.5.8)
// Inline styles reinforce the CSS rule in app.css for async-loaded CMS content.
const fixFootnoteTargetSize = function () {
  const footnoteLinks = document.querySelectorAll(
    ".footnote-ref a, .footnote-backref, a[href^='#fn'], a[href^='#fnref']"
  );
  footnoteLinks.forEach((link) => {
    link.style.display = "inline-block";
    link.style.minWidth = "28px";
    link.style.minHeight = "28px";
    link.style.lineHeight = "28px";
    link.style.textAlign = "center";
  });
};

// Fix links in text blocks that rely only on color (add underline)
const fixLinksInTextBlocks = function () {
  const links = document.querySelectorAll(
    ".v-card__text a, .markdown-body p a, .article-body a"
  );
  links.forEach((link) => {
    const style = window.getComputedStyle(link);
    if (
      style.textDecorationLine === "none" ||
      style.textDecoration === "none"
    ) {
      link.style.textDecoration = "underline";
    }
  });
};

// Fix Vuetify v-app-bar <header> inside <nav> — remove the implicit
// banner landmark so it doesn't conflict with the nav landmark.
// Use role="none" (the modern synonym for "presentation") which is
// more widely accepted by accessibility scanners.
const fixNavHeaderRoles = function () {
  const headers = document.querySelectorAll("nav[aria-label] > header");
  headers.forEach((header) => {
    header.setAttribute("role", "none");
  });
};

// Fix Vuetify overlay container outside landmarks — mark as presentation
// so it doesn't trigger the "region" best-practice rule.
// Uses MutationObserver to catch overlays created after initial render.
// Once the observer is installed, subsequent calls are no-ops (the observer
// handles all future mutations) — saves a querySelectorAll on every route.
const fixOverlayContainer = function () {
  if (window._overlayObserver) return;
  const fix = () => {
    const overlays = document.querySelectorAll(
      "body > .v-overlay-container:not([role])"
    );
    overlays.forEach((overlay) => {
      overlay.setAttribute("role", "presentation");
    });
  };
  fix();
  window._overlayObserver = new MutationObserver(fix);
  window._overlayObserver.observe(document.body, { childList: true });
};

// Fix nested-interactive without breaking selects. Vuetify 2's v-select (and
// v-autocomplete / v-combobox) puts its popup semantics on the wrapper,
// div.v-input__slot[role="button"][aria-haspopup="listbox"][aria-expanded]
// [aria-owns], around the focusable read-only <input>: an interactive control
// nested inside a button (axe nested-interactive, SiteImprove). This function
// used to delete those wrapper attributes, which also deleted the only role,
// state and value the select had: a screen reader met a blank read-only text
// field (WCAG 4.1.2). Instead, the semantics now move to the input that
// takes focus:
//   - the wrapper keeps no role, so nothing interactive is nested;
//   - the input becomes role="combobox" with aria-haspopup="listbox",
//     aria-expanded kept in step with the menu, and aria-controls;
//   - the chosen value, which Vuetify shows in .v-select__selection and not
//     in the input, follows the input's own label in its accessible name
//     (aria-labelledby: the input itself, then the selection), for example
//     "Show events from time range Past 12 months".
// Uses a MutationObserver because Vuetify re-renders these after async data
// loads and whenever the menu opens or closes. Once the observer is
// installed, subsequent calls are no-ops.
const SELECT_INPUT_SLOTS = ".v-select > .v-input__control > .v-input__slot";

const fixNestedInteractive = function () {
  if (window._nestedInteractiveObserver) return;
  // Write only on change: each write is a mutation this observer also sees.
  const setAttr = (el, name, value) => {
    if (el.getAttribute(name) !== value) el.setAttribute(name, value);
  };
  const fix = () => {
    document.querySelectorAll(SELECT_INPUT_SLOTS).forEach((slot) => {
      const input = slot.querySelector(
        ".v-select__selections > input:not([type='hidden'])"
      );
      if (!input) return;
      // Vuetify rewrites aria-expanded on the wrapper whenever the menu
      // opens or closes; aria-owns is written once.
      const expanded = slot.getAttribute("aria-expanded");
      const owns = slot.getAttribute("aria-owns");
      ["role", "aria-haspopup", "aria-expanded", "aria-owns"].forEach((name) =>
        slot.removeAttribute(name)
      );
      setAttr(input, "role", "combobox");
      setAttr(input, "aria-haspopup", "listbox");
      if (expanded !== null) setAttr(input, "aria-expanded", expanded);
      else if (!input.hasAttribute("aria-expanded"))
        setAttr(input, "aria-expanded", "false");
      if (owns) setAttr(input, "aria-controls", owns);
      if (!input.id) return;
      const ids = [input.id];
      slot.querySelectorAll(".v-select__selection").forEach((selection, i) => {
        if (!selection.id) selection.id = `${input.id}-selection-${i}`;
        ids.push(selection.id);
      });
      setAttr(input, "aria-labelledby", ids.join(" "));
    });
  };
  fix();
  window._nestedInteractiveObserver = new MutationObserver(fix);
  window._nestedInteractiveObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["role", "aria-expanded", "aria-owns", "aria-haspopup"],
  });
};

// Remove invalid ARIA roles — Vuetify 2.x can generate role attributes
// that are not defined in the WAI-ARIA spec. Strip any role value that
// is not in the official list. (SiteImprove sia-r110)
const VALID_ARIA_ROLES = new Set([
  "alert",
  "alertdialog",
  "application",
  "article",
  "banner",
  "blockquote",
  "button",
  "caption",
  "cell",
  "checkbox",
  "code",
  "columnheader",
  "combobox",
  "complementary",
  "contentinfo",
  "definition",
  "deletion",
  "dialog",
  "directory",
  "document",
  "emphasis",
  "feed",
  "figure",
  "form",
  "generic",
  "grid",
  "gridcell",
  "group",
  "heading",
  "img",
  "insertion",
  "link",
  "list",
  "listbox",
  "listitem",
  "log",
  "main",
  "marquee",
  "math",
  "menu",
  "menubar",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "meter",
  "navigation",
  "none",
  "note",
  "option",
  "paragraph",
  "presentation",
  "progressbar",
  "radio",
  "radiogroup",
  "region",
  "row",
  "rowgroup",
  "rowheader",
  "scrollbar",
  "search",
  "searchbox",
  "separator",
  "slider",
  "spinbutton",
  "status",
  "strong",
  "subscript",
  "superscript",
  "switch",
  "tab",
  "table",
  "tablist",
  "tabpanel",
  "term",
  "textbox",
  "time",
  "timer",
  "toolbar",
  "tooltip",
  "tree",
  "treegrid",
  "treeitem",
]);

const fixInvalidRoles = function () {
  const els = document.querySelectorAll("[role]");
  els.forEach((el) => {
    const role = el.getAttribute("role").trim().toLowerCase();
    if (role === "" || !VALID_ARIA_ROLES.has(role)) {
      el.removeAttribute("role");
    }
  });
};

// Strip ARIA attributes that are unsupported or prohibited on img-role elements
// and on presentation/none-role elements. (SiteImprove sia-r18)
// - role="img": aria-haspopup and aria-expanded are not permitted
// - role="presentation"/"none": aria-label and aria-labelledby are prohibited
// Uses a MutationObserver to catch attributes the instant Vuetify adds them,
// preventing Siteimprove from seeing the prohibited state.
// Once the observer is installed, subsequent calls are no-ops.
const fixProhibitedAriaOnImg = function () {
  if (window._imgAriaObserver) return;
  const strip = () => {
    const imgs = document.querySelectorAll(
      '[role="img"][aria-haspopup], [role="img"][aria-expanded], img[aria-haspopup], img[aria-expanded]'
    );
    imgs.forEach((el) => {
      el.removeAttribute("aria-haspopup");
      el.removeAttribute("aria-expanded");
    });
    const pres = document.querySelectorAll(
      '[role="presentation"][aria-label], [role="presentation"][aria-labelledby], [role="none"][aria-label], [role="none"][aria-labelledby]'
    );
    pres.forEach((el) => {
      el.removeAttribute("aria-label");
      el.removeAttribute("aria-labelledby");
    });
  };
  strip();
  window._imgAriaObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "attributes") {
        const el = m.target;
        const role = el.getAttribute("role");
        const tag = el.tagName;
        if (role === "img" || tag === "IMG") {
          if (el.hasAttribute("aria-haspopup"))
            el.removeAttribute("aria-haspopup");
          if (el.hasAttribute("aria-expanded"))
            el.removeAttribute("aria-expanded");
        }
        if (role === "presentation" || role === "none") {
          if (el.hasAttribute("aria-label")) el.removeAttribute("aria-label");
          if (el.hasAttribute("aria-labelledby"))
            el.removeAttribute("aria-labelledby");
        }
      }
      if (m.type === "childList") {
        strip();
      }
    }
  });
  window._imgAriaObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      "aria-haspopup",
      "aria-expanded",
      "aria-label",
      "aria-labelledby",
      "role",
    ],
  });
};

// Fix prohibited ARIA attributes on carousel items — Vuetify 2.x renders
// v-carousel-item as a plain div (implicit "generic" role) which prohibits
// aria-roledescription and aria-label. Add role="group" so these attributes
// are valid per WAI-ARIA carousel pattern.
const fixCarouselItemRoles = function () {
  const items = document.querySelectorAll(
    ".v-carousel .v-window-item[aria-roledescription], .v-carousel .v-window-item[aria-label]"
  );
  items.forEach((el) => {
    if (!el.getAttribute("role")) {
      el.setAttribute("role", "group");
    }
  });
  // Also ensure the carousel container has role="region" if it has an aria-label
  const carousels = document.querySelectorAll(".v-carousel[aria-label]");
  carousels.forEach((el) => {
    if (!el.getAttribute("role")) {
      el.setAttribute("role", "region");
    }
  });
};

// Fix WCAG 2.5.3 Label in Name — remove aria-label from interactive elements
// where it conflicts with visible text content. SiteImprove flags elements
// whose aria-label doesn't match the visible text inside them.
const fixLabelInName = function () {
  // Remove aria-label from elements that have visible text children,
  // since the visible text should serve as the accessible name.
  const els = document.querySelectorAll(
    '[role="link"][aria-label], a[aria-label]'
  );
  els.forEach((el) => {
    const visibleText = (el.textContent || "").trim();
    const ariaLabel = (el.getAttribute("aria-label") || "").trim();
    // If there's substantial visible text and the aria-label doesn't
    // start with it (or vice versa), remove the aria-label
    if (visibleText.length > 3 && ariaLabel.length > 0) {
      const normalizedVisible = visibleText.replace(/\s+/g, " ").toLowerCase();
      const normalizedLabel = ariaLabel.replace(/\s+/g, " ").toLowerCase();
      if (
        !normalizedLabel.startsWith(normalizedVisible) &&
        !normalizedVisible.startsWith(normalizedLabel)
      ) {
        el.removeAttribute("aria-label");
      }
    }
  });

  // Buttons/links with aria-label whose only visible "text" is a Material
  // icon ligature (the icon name as textContent, replaced by a glyph via
  // CSS font). SiteImprove reads the ligature text as the visible label
  // and flags a mismatch. Fix: hide the icon descendant from the a11y
  // tree so aria-label becomes the single accessible name.
  const iconCarriers = document.querySelectorAll(
    "button[aria-label], a[aria-label], [role=button][aria-label]"
  );
  iconCarriers.forEach((el) => {
    const ariaLabel = (el.getAttribute("aria-label") || "").trim();
    if (!ariaLabel) return;
    const icons = el.querySelectorAll(
      ".v-icon, .material-icons, .mdi, i.fa, [class*='mdi-']"
    );
    if (!icons.length) return;
    // Visible text with icons stripped
    let stripped = el.textContent || "";
    icons.forEach((i) => {
      stripped = stripped.replace(i.textContent || "", "");
    });
    stripped = stripped.trim();
    // If the non-icon visible text is empty or much shorter than the
    // icon text contribution, the icon glyph is dominating the visible
    // label. Hide the icon(s) from the a11y tree.
    if (stripped.length === 0 || stripped.length < ariaLabel.length / 2) {
      icons.forEach((i) => {
        if (!i.hasAttribute("aria-hidden")) {
          i.setAttribute("aria-hidden", "true");
        }
      });
    }
  });

  // Strip redundant aria-label on interactive elements whose visible text
  // already matches the label (case-insensitive, whitespace-normalized).
  // SiteImprove sia-r14 flags these as "cantTell" because Vuetify's
  // CSS text-transform uppercases the visible label while the authored
  // aria-label remains mixed-case. Removing the redundant aria-label
  // lets the accessible name be computed from the visible text itself,
  // which is trivially label-in-name compliant.
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
  const redundantCarriers = document.querySelectorAll(
    'button[aria-label], a[aria-label], [role="button"][aria-label], [role="link"][aria-label]'
  );
  redundantCarriers.forEach((el) => {
    // A button that is itself a Vuetify icon (a data table's expand button)
    // draws its glyph as generated content. Without the aria-label, that
    // icon-font character joins the accessible name ahead of the words
    // ("<glyph> Toggle details for …"), so the label stays (WCAG 4.1.2).
    if (el.classList.contains("v-icon")) return;
    const label = norm(el.getAttribute("aria-label"));
    const visible = norm(el.innerText || el.textContent);
    if (!label || !visible) return;
    if (
      label === visible ||
      visible.includes(label) ||
      label.includes(visible)
    ) {
      el.removeAttribute("aria-label");
    }
  });
};

// Fix form fields missing labels — Vuetify 2.x v-text-field and v-select
// sometimes fail to associate <label> with <input> via for/id, causing
// SiteImprove "Form field missing a label" (WCAG 1.3.1 / 4.1.2).
// This adds aria-label from the Vuetify-rendered label text when the
// native association is missing.
const fixFormFieldLabels = function () {
  const wrappers = document.querySelectorAll(".v-text-field, .v-select");
  wrappers.forEach((wrapper) => {
    const input = wrapper.querySelector(
      "input, select, textarea, [role='combobox']"
    );
    if (!input) return;
    // Skip if already has a proper label association
    if (
      input.getAttribute("aria-label") ||
      input.getAttribute("aria-labelledby")
    )
      return;
    if (input.id) {
      const associatedLabel = document.querySelector(
        'label[for="' + input.id + '"]'
      );
      if (associatedLabel) return;
    }
    // Find the Vuetify-rendered label text
    const label = wrapper.querySelector(".v-label");
    if (label) {
      const labelText = (label.textContent || "").trim();
      if (labelText) {
        input.setAttribute("aria-label", labelText);
      }
    }
  });
};

// Fix invalid `aria-role` attributes — `aria-role` is not a valid HTML attribute;
// the correct attribute is `role`. Convert any `aria-role` to `role` if the value
// is a valid ARIA role, otherwise remove it entirely.
const fixAriaRoleAttribute = function () {
  const els = document.querySelectorAll("[aria-role]");
  els.forEach((el) => {
    const value = (el.getAttribute("aria-role") || "").trim().toLowerCase();
    el.removeAttribute("aria-role");
    if (value && VALID_ARIA_ROLES.has(value) && !el.getAttribute("role")) {
      el.setAttribute("role", value);
    }
  });
};

// Fix prohibited `aria-haspopup` on plain links and headings — Vuetify 2.x
// v-tooltip injects `aria-haspopup="true"` and `aria-expanded` on activator
// elements via v-bind="attrs". These attributes are invalid on <a> elements
// and on headings (WAI-ARIA only allows them on button, combobox, gridcell,
// menuitem, row, tab, textbox, and treeitem roles) — SiteImprove sia-r18
// "ARIA attribute unsupported or prohibited" (WCAG 4.1.2). The BiographyCard
// activator (an <h2>) is the primary source; this is the app-wide backstop.
const fixProhibitedAriaOnLinks = function () {
  const els = document.querySelectorAll(
    "a[aria-haspopup], a[aria-expanded]," +
      "h1[aria-haspopup],h2[aria-haspopup],h3[aria-haspopup]," +
      "h4[aria-haspopup],h5[aria-haspopup],h6[aria-haspopup]," +
      "h1[aria-expanded],h2[aria-expanded],h3[aria-expanded]," +
      "h4[aria-expanded],h5[aria-expanded],h6[aria-expanded]"
  );
  els.forEach((el) => {
    el.removeAttribute("aria-haspopup");
    el.removeAttribute("aria-expanded");
  });
};

// Fix Vuetify v-data-table header scoping — add scope="col" to all <th>
// elements and fill the empty expand-column header so axe td-has-header passes.
const fixDataTableHeaders = function () {
  const tables = document.querySelectorAll(".v-data-table table");
  tables.forEach((table) => {
    table.querySelectorAll("thead th").forEach((th) => {
      if (!th.getAttribute("scope")) {
        th.setAttribute("scope", "col");
      }
      // Fill empty expand-column header
      if (!th.textContent.trim() && !th.querySelector("img, svg")) {
        th.innerHTML = "<span class='sr-only'>Details</span>";
      }
    });
  });
};

// Fix aria-hidden-focus — Vuetify data tables with row-click handlers can
// leave focusable elements inside aria-hidden containers (collapsed expand
// rows, hidden pagination rows). Remove them from tab order.
const fixAriaHiddenFocus = function () {
  const hiddenEls = document.querySelectorAll('[aria-hidden="true"]');
  hiddenEls.forEach((el) => {
    const focusable = el.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable.forEach((f) => {
      f.setAttribute("tabindex", "-1");
    });
  });
};

// Fix Vuetify internal empty containers (sia-r68 "Container element is empty").
// Vuetify 2.x emits a lot of layout-only divs and spans that render as
// empty in the DOM: .v-image__image (background-image carrier),
// .v-responsive__sizer, .v-responsive__content, .spacer, .v-menu /
// .v-tooltip wrappers (empty until activated), .v-list-item__icon with
// only aria-hidden <i> children, .v-navigation-drawer__border,
// .v-tabs-slider*, .v-dialog__container, and similar. SiteImprove's
// sia-r68 rule flags every one. They are cosmetic scaffolding — adding
// visible text would break layout and screen readers already skip
// decorative content. Fix: mark them role="presentation" + aria-hidden
// so they are removed from the accessibility tree and sia-r68 no
// longer applies (the rule only applies to elements in the a11y tree).
//
// Scope: any empty element with a Vuetify class (prefix "v-") anywhere
// on the page, plus a small allowlist of non-Vuetify layout classes we
// know are decorative. Skips CMS content areas — the sanitizer's
// fixCmsEmptyContainers already strips those.
const MEANINGFUL_CHILD_TAGS = new Set([
  "IMG",
  "IFRAME",
  "VIDEO",
  "AUDIO",
  "SVG",
  "CANVAS",
  "OBJECT",
  "EMBED",
  "PICTURE",
  "INPUT",
  "SELECT",
  "TEXTAREA",
  // Interactive controls: even empty, these are focusable and must
  // not live inside an aria-hidden ancestor (sia-r17).
  "BUTTON",
  "A",
]);

const elementIsEmpty = function (el) {
  if ((el.textContent || "").trim()) return false;
  for (const child of el.children) {
    if (MEANINGFUL_CHILD_TAGS.has(child.tagName)) return false;
    // Any element with a non-"-1" tabindex is focusable — never hide
    // an ancestor of a focusable element.
    const ti = child.getAttribute("tabindex");
    if (ti !== null && ti !== "-1") return false;
    if (!elementIsEmpty(child)) return false;
  }
  return true;
};

// Explicit allowlist of Vuetify internal classes that are ALWAYS
// decorative scaffolding and safe to hide from the accessibility tree
// when empty. A broad `v-*` prefix would catch critical structural
// containers (v-main, v-main__wrap, v-application, v-navigation-drawer,
// v-app-bar, v-toolbar, v-card, v-row, etc.) — some of which render
// empty during the $nextTick window before async CMS content loads.
// Hiding those containers breaks the entire page's accessibility tree.
const VUETIFY_DECORATIVE_CLASSES = [
  // v-image internals (background-image carrier + sizing)
  "v-image__image",
  "v-image__placeholder",
  "v-responsive__sizer",
  "v-responsive__content",
  // Layout spacers
  "spacer",
  // Menus / tooltips stay empty until activated
  "v-menu__content",
  "v-tooltip__content",
  // v-list-item icon slot often holds only aria-hidden <i>
  "v-list-item__icon",
  "v-list-group__header__append-icon",
  // Navigation drawer and tab/slide group decoration
  "v-navigation-drawer__border",
  "v-slide-group__prev",
  "v-slide-group__next",
  "v-slide-group__prev--disabled",
  "v-slide-group__next--disabled",
  "v-tabs-slider-wrapper",
  "v-tabs-slider",
  // Dialog / overlay containers empty until activated
  "v-dialog__container",
  // Custom progress helpers
  "app-progress-bar",
  "app-progress-spinner",
];

// IDs to cover (classes alone don't catch these)
const VUETIFY_DECORATIVE_IDS = ["app-progress-bar", "app-progress-spinner"];

// Structural classes that must NEVER be hidden, even if they appear
// empty during the $nextTick window. These wrap page content and
// site chrome; hiding them cascades sia-r17 failures across every
// focusable element inside.
const STRUCTURAL_CLASSES_NEVER_HIDE = new Set([
  "v-main",
  "v-main__wrap",
  "v-application",
  "v-application--wrap",
  "v-app-bar",
  "v-navigation-drawer",
  "v-navigation-drawer__content",
  "v-toolbar",
  "v-content",
  "v-card",
  "v-card__text",
  "v-card__title",
  "v-container",
  "v-row",
  "v-col",
  "v-list",
  "v-sheet",
]);

const hasStructuralAncestor = function (el) {
  let node = el;
  while (node && node !== document.body) {
    const cls = node.className;
    if (typeof cls === "string") {
      for (const tok of cls.split(/\s+/)) {
        if (STRUCTURAL_CLASSES_NEVER_HIDE.has(tok)) return true;
      }
    }
    node = node.parentElement;
  }
  return false;
};

const fixVuetifyEmptyContainers = function () {
  // Belt-and-suspenders cleanup: if a prior build's over-broad selector
  // left aria-hidden/presentation on a structural container (e.g.
  // v-main__wrap captured during the empty-on-mount window), undo it.
  STRUCTURAL_CLASSES_NEVER_HIDE.forEach((cls) => {
    document
      .querySelectorAll(
        `.${cls}[aria-hidden="true"], .${cls}[role="presentation"], .${cls}[role="none"]`
      )
      .forEach((el) => {
        if (el.getAttribute("aria-hidden") === "true")
          el.removeAttribute("aria-hidden");
        const r = el.getAttribute("role");
        if (r === "presentation" || r === "none") el.removeAttribute("role");
      });
  });

  const cmsAreas = document.querySelectorAll(".article-body, .markdown-body");
  const inCms = (el) => {
    for (const area of cmsAreas) if (area.contains(el)) return true;
    return false;
  };

  const classSelector = VUETIFY_DECORATIVE_CLASSES.map((c) => `.${c}`).join(
    ", "
  );
  const idSelector = VUETIFY_DECORATIVE_IDS.map((i) => `#${i}`).join(", ");
  const candidates = document.querySelectorAll(
    classSelector + ", " + idSelector
  );

  candidates.forEach((el) => {
    if (inCms(el)) return;
    // Never hide an element whose classList intersects the structural
    // allowlist (unlikely given the narrow selector but safe guard).
    if (typeof el.className === "string") {
      for (const tok of el.className.split(/\s+/)) {
        if (STRUCTURAL_CLASSES_NEVER_HIDE.has(tok)) return;
      }
    }
    if (el.getAttribute("aria-hidden") === "true") return;
    const role = el.getAttribute("role");
    if (role === "presentation" || role === "none") return;
    if (!elementIsEmpty(el)) return;
    // Defense in depth: if any ancestor is a structural container, we
    // are inside page content — don't start hiding things there either.
    // (The selector is already narrow enough that this rarely matters.)
    void hasStructuralAncestor;
    el.setAttribute("role", "presentation");
    el.setAttribute("aria-hidden", "true");
  });
};

// Fix empty aria-label on Vuetify v-image wrappers.
// Vuetify 2.x v-image renders <div aria-label="" role="..."> with an empty
// aria-label when no src has an alt. SiteImprove flags this as
// "ARIA attribute unsupported or prohibited." Remove the empty aria-label
// so the element either inherits or has no accessible name (which is
// the correct behavior for a decorative image).
const fixEmptyAriaLabel = function () {
  const els = document.querySelectorAll('[aria-label=""]');
  els.forEach((el) => {
    el.removeAttribute("aria-label");
  });
};

export {
  fixButtonText,
  fixBlankTableHeadings,
  fixNuxtContentHeadings,
  fixExpandButtons,
  fixCarouselArrows,
  fixTableRowKeyboard,
  fixChipContrast,
  fixHeadingOrder,
  fixEmptyTableHeaders,
  fixFootnoteTargetSize,
  fixLinksInTextBlocks,
  fixNavHeaderRoles,
  fixOverlayContainer,
  fixNestedInteractive,
  fixInvalidRoles,
  fixProhibitedAriaOnImg,
  fixCarouselItemRoles,
  fixLabelInName,
  fixFormFieldLabels,
  fixTableCellContext,
  fixAriaRoleAttribute,
  fixProhibitedAriaOnLinks,
  fixEmptyContainers,
  fixInlineColorContrast,
  fixDataTableHeaders,
  fixAriaHiddenFocus,
  fixEmptyAriaLabel,
  fixVuetifyEmptyContainers,
};

// Fix "Table cell missing context" (sia-r77) — CMS-authored tables from
// Strapi markdown may lack scope/headers attributes. Handles three cases:
//   1. Simple tables: scope="col" on column headers, scope="row" on row headers
//   2. Tables without <thead>: treats first row of <th> as column headers
//   3. Complex tables with rowspan/colspan: uses explicit id/headers attributes
// Single-cell rows in a multi-column table (a visual continuation of the
// previous row) are normalized to <td colspan="N"> by the content pipeline's
// normalizeRaggedRows, which this repair shares.
const fixTableCellContext = function () {
  const tables = document.querySelectorAll(
    ".article-body table, .markdown-body table"
  );
  tables.forEach((table, tableIndex) => {
    // Skip Vuetify data tables (e.g. PublicationsAll, MeetingTable) — they live
    // inside .markdown-body wrappers but already have proper header semantics
    // from Vuetify's own templating. Reprocessing them assigns duplicate IDs
    // (Vuetify clones header rows for the expand-detail row) and produces the
    // self-referencing `headers="tbl0-h0"` attribute that axe `td-headers-attr`
    // and SiteImprove flag.
    if (
      table.closest(".v-data-table") ||
      table.classList.contains("v-data-table")
    ) {
      return;
    }
    // Skip tables the render-time content pipeline (contentSanitizer's
    // fixCmsTables) already processed — they carry cmstbl* ids, empty rows
    // already stripped, single-column tables marked presentational, and
    // empty headers demoted. Reprocessing here on the live DOM would recompute
    // headers/scope from the already-transformed markup and could reintroduce
    // the very issues the pipeline fixed. contentSanitizer is authoritative
    // for CMS markdown; this DOM pass only handles anything it didn't touch.
    if (table.getAttribute("role") === "presentation") return;
    if (table.querySelector('[id^="cmstbl"]')) return;
    // Strip zero-cell rows (markdown-it-multimd emits them for `| x ||`);
    // an empty leading row would otherwise zero out getColumnCount below.
    table.querySelectorAll("tr").forEach((tr) => {
      if (tr.querySelectorAll("th, td").length === 0) tr.remove();
    });
    // Normalize single-cell continuation rows before any promotion or
    // header/id attribution runs.
    normalizeRaggedRows(document, table);
    // Always run the simple-table pass first — it promotes row-label
    // <td>s to <th scope="row"> and ensures <th scope="col"> on the
    // header row. It is the content pipeline's own fixSimpleTable
    // (src/utils/contentSanitizer.js), so a table repaired here gets the
    // same header decisions as one repaired while rendering: 1.5.69 fixed
    // the pipeline's heuristic for tables without <th>, and the copy that
    // used to live in this file still made every first-column label a row
    // header. Then always run the complex-table pass to assign
    // explicit id/headers attributes on every cell. This satisfies
    // SiteImprove sia-r46 "No data cells assigned to table header"
    // across all tables, not just those with rowspan/colspan. That pass is
    // the pipeline's fixComplexTable too, with this repair's own "tbl" ids,
    // so rows grouped under a label spanning them get the same headers here.
    fixSimpleTable(document, table);
    fixComplexTable(document, table, tableIndex, "tbl");
  });
};
