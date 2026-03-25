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

const fixExpandButtons = function (
  className = "v-data-table__expand-icon",
  label = "Expand"
) {
  const els = document.getElementsByClassName(className);
  //console.log(els);
  for (let i = 0, len = els.length; i < len; ++i) {
    els[i].setAttribute("aria-label", label);
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

// Fix positive tabindex on figures from markdown-it-implicit-figures
const fixFigureTabindex = function () {
  const figures = document.querySelectorAll("figure[tabindex]");
  figures.forEach((fig) => {
    const val = parseInt(fig.getAttribute("tabindex"), 10);
    if (val > 0) {
      fig.setAttribute("tabindex", "0");
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

// Fix footnote links that are too small for touch targets (< 24px)
const fixFootnoteTargetSize = function () {
  const footnoteLinks = document.querySelectorAll(
    ".footnote-ref a, .footnote-backref, a[href^='#fn'], a[href^='#fnref']"
  );
  footnoteLinks.forEach((link) => {
    link.style.display = "inline-block";
    link.style.minWidth = "24px";
    link.style.minHeight = "24px";
    link.style.lineHeight = "24px";
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
const fixOverlayContainer = function () {
  const fix = () => {
    const overlays = document.querySelectorAll(
      "body > .v-overlay-container:not([role])"
    );
    overlays.forEach((overlay) => {
      overlay.setAttribute("role", "presentation");
    });
  };
  fix();
  // Watch for Vuetify adding overlay containers to body
  if (!window._overlayObserver) {
    window._overlayObserver = new MutationObserver(fix);
    window._overlayObserver.observe(document.body, { childList: true });
  }
};

// Fix nested-interactive: Vuetify v-select in data-table footer renders
// div[role="button"] wrapping a focusable <input>, which nests interactive controls.
// Remove the role and clean up ARIA attributes that depend on it.
const fixNestedInteractive = function () {
  const selects = document.querySelectorAll(
    'div[role="button"][aria-haspopup="listbox"]'
  );
  selects.forEach((el) => {
    el.removeAttribute("role");
    el.removeAttribute("aria-expanded");
    el.removeAttribute("aria-haspopup");
    el.removeAttribute("aria-owns");
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

// Strip ARIA attributes that are unsupported or prohibited on img-role elements.
// Vuetify 2.x adds aria-haspopup and aria-expanded on v-img (div[role="img"])
// when images are inside tooltip or menu activators. (SiteImprove ARIA attribute
// unsupported or prohibited)
const fixProhibitedAriaOnImg = function () {
  const imgs = document.querySelectorAll(
    '[role="img"][aria-haspopup], [role="img"][aria-expanded], img[aria-haspopup], img[aria-expanded]'
  );
  imgs.forEach((el) => {
    el.removeAttribute("aria-haspopup");
    el.removeAttribute("aria-expanded");
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
};

// Fix form fields missing labels — Vuetify 2.x v-text-field and v-select
// sometimes fail to associate <label> with <input> via for/id, causing
// SiteImprove "Form field missing a label" (WCAG 1.3.1 / 4.1.2).
// This adds aria-label from the Vuetify-rendered label text when the
// native association is missing.
const fixFormFieldLabels = function () {
  const wrappers = document.querySelectorAll(
    ".v-text-field, .v-select"
  );
  wrappers.forEach((wrapper) => {
    const input = wrapper.querySelector("input, select, textarea, [role='combobox']");
    if (!input) return;
    // Skip if already has a proper label association
    if (input.getAttribute("aria-label") || input.getAttribute("aria-labelledby")) return;
    if (input.id) {
      const associatedLabel = document.querySelector('label[for="' + input.id + '"]');
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

export {
  fixButtonText,
  fixBlankTableHeadings,
  fixNuxtContentHeadings,
  fixExpandButtons,
  fixCarouselArrows,
  fixTableRowKeyboard,
  fixFigureTabindex,
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
};
