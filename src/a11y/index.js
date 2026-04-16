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
// Strapi authors sometimes use "color: red" or other low-contrast inline
// colors. Replace with black (#000) to guarantee maximum contrast.
const fixInlineColorContrast = function () {
  const containers = document.querySelectorAll(
    ".article-body, .markdown-body, .v-card__text"
  );
  // Check if an element or any ancestor has a dark background
  const onDarkBackground = (el) => {
    let node = el.parentElement;
    while (node && node !== document.body) {
      const bg = window.getComputedStyle(node).backgroundColor;
      const rgb = bg.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const lum =
          (0.2126 * +rgb[0] + 0.7152 * +rgb[1] + 0.0722 * +rgb[2]) / 255;
        if (lum < 0.4) return true;
      }
      node = node.parentElement;
    }
    return false;
  };
  containers.forEach((container) => {
    // Skip disclaimer and overlays — they use white text on dark backgrounds intentionally
    if (container.closest("#disclaimer")) return;
    container.querySelectorAll("[style]").forEach((el) => {
      if (el.closest("#disclaimer") || el.closest(".v-overlay")) return;
      // Skip chips — they have intentional background+text color pairings
      if (el.closest(".v-chip") || el.classList.contains("v-chip")) return;
      const style = el.getAttribute("style") || "";
      if (/color\s*:/i.test(style) && !/background/i.test(style)) {
        // Skip elements on dark backgrounds — white text is intentional there
        if (onDarkBackground(el)) return;
        // Strip any inline color declaration, let inherited #000 apply
        el.style.color = "#000";
      }
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

// Fix nested-interactive: Vuetify v-select in data-table footer renders
// div[role="button"] wrapping a focusable <input>, which nests interactive controls.
// Remove the role and clean up ARIA attributes that depend on it.
// Uses MutationObserver because Vuetify re-renders these after async data loads.
// Once the observer is installed, subsequent calls are no-ops.
const fixNestedInteractive = function () {
  if (window._nestedInteractiveObserver) return;
  const fix = () => {
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
  fix();
  window._nestedInteractiveObserver = new MutationObserver(fix);
  window._nestedInteractiveObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["role"],
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

// Fix prohibited `aria-haspopup` on plain links — Vuetify 2.x v-tooltip injects
// `aria-haspopup="true"` and `aria-expanded` on activator elements via v-bind="attrs".
// These attributes are invalid on <a> elements (WAI-ARIA only allows them on
// button, combobox, gridcell, menuitem, row, tab, textbox, and treeitem roles).
const fixProhibitedAriaOnLinks = function () {
  const links = document.querySelectorAll("a[aria-haspopup], a[aria-expanded]");
  links.forEach((el) => {
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
// CMS authors sometimes emit a single-cell row in a multi-column
// table as visual continuation of the previous row's data. If that
// lone cell is <th>, fixComplexTable will assign it an id, creating
// an orphan header with no data cells referencing it — SiteImprove
// sia-r46 flags that. Convert single-cell rows to <td colspan="N">
// so they remain data, governed by the column headers above.
const normalizeRaggedRows = function (table) {
  const allRows = Array.from(table.querySelectorAll("tr"));
  if (allRows.length < 2) return;
  let maxCols = 0;
  allRows.forEach((row) => {
    let count = 0;
    row.querySelectorAll("th, td").forEach((cell) => {
      count += parseInt(cell.getAttribute("colspan") || "1", 10);
    });
    if (count > maxCols) maxCols = count;
  });
  if (maxCols < 2) return;
  allRows.forEach((row) => {
    const cells = row.querySelectorAll("th, td");
    if (cells.length !== 1) return;
    const cell = cells[0];
    const currentSpan = parseInt(cell.getAttribute("colspan") || "1", 10);
    if (currentSpan >= maxCols) return;
    if (cell.tagName === "TH") {
      const td = document.createElement("td");
      td.innerHTML = cell.innerHTML;
      for (const attr of cell.attributes) {
        if (attr.name === "scope" || attr.name === "id") continue;
        td.setAttribute(attr.name, attr.value);
      }
      td.setAttribute("colspan", String(maxCols));
      cell.parentNode.replaceChild(td, cell);
    } else {
      cell.setAttribute("colspan", String(maxCols));
    }
  });
};

const fixTableCellContext = function () {
  const tables = document.querySelectorAll(
    ".article-body table, .markdown-body table"
  );
  tables.forEach((table, tableIndex) => {
    // Normalize single-cell continuation rows before any promotion or
    // header/id attribution runs.
    normalizeRaggedRows(table);
    // Always run the simple-table pass first — it promotes row-label
    // <td>s to <th scope="row"> and ensures <th scope="col"> on the
    // header row. Then always run the complex-table pass to assign
    // explicit id/headers attributes on every cell. This satisfies
    // SiteImprove sia-r46 "No data cells assigned to table header"
    // across all tables, not just those with rowspan/colspan.
    fixSimpleTable(table);
    fixComplexTable(table, tableIndex);
  });
};

// Promote every <td> in a row to <th scope="col">, preserving attributes.
// Used for header rows that were rendered as styled <td> cells by a CMS.
// Skips "No data" filler cells — they are corner/spacer positions (e.g.
// the intersection of row headers and column headers in a two-level
// header), not semantic column headers. Leaving them as <td> avoids
// creating orphan <th> cells that axe `th-has-data-cells` and
// SiteImprove sia-r46 would flag.
function promoteRowTdsToColumnHeaders(row) {
  row.querySelectorAll("td").forEach((td) => {
    const sr = td.querySelector(".sr-only");
    if (sr && sr.textContent.trim() === "No data") return;
    const th = document.createElement("th");
    th.innerHTML = td.innerHTML;
    for (const attr of td.attributes) {
      th.setAttribute(attr.name, attr.value);
    }
    if (!th.getAttribute("scope")) th.setAttribute("scope", "col");
    td.parentNode.replaceChild(th, td);
  });
  row.querySelectorAll("th").forEach((th) => {
    if (!th.getAttribute("scope")) th.setAttribute("scope", "col");
  });
}

// Heuristic for detecting a column-header row that was rendered as
// <td> cells. Two strong signals: bgcolor styling (Word/Excel-style
// export), and a row of uniformly short bold cells. "No data" filler
// cells are ignored when evaluating the bold-and-short signal.
function isLikelyHeaderRow(row) {
  const cells = Array.from(row.querySelectorAll("td, th"));
  if (cells.length < 2) return false;
  if (cells.some((c) => c.hasAttribute("bgcolor"))) return true;
  const nonFiller = cells.filter((c) => {
    const sr = c.querySelector(".sr-only");
    return !(sr && sr.textContent.trim() === "No data");
  });
  if (nonFiller.length < 2) return false;
  const allBolded = nonFiller.every((c) => c.querySelector("strong, b"));
  if (!allBolded) return false;
  const avgLen =
    nonFiller.reduce((a, c) => a + (c.textContent || "").trim().length, 0) /
    nonFiller.length;
  return avgLen < 15;
}

// Simple tables: add scope="col" to column headers, scope="row" to row headers
function fixSimpleTable(table) {
  // Anything inside <thead> is a column header by definition. Some CMS
  // exports wrap header cells in <td> — promote those to <th scope="col">.
  table.querySelectorAll("thead tr").forEach(promoteRowTdsToColumnHeaders);

  // Two-level / styled-td header pattern: CMS tables sometimes render
  // column headers as the first <tbody> row using styled <td> cells
  // (bgcolor, or all-bolded short text). Promote that row if it looks
  // like headers AND the row after it looks like a data row.
  const firstTbodyRow = table.querySelector("tbody tr");
  let promotedFirstTbody = false;
  if (firstTbodyRow && !firstTbodyRow.querySelector("th")) {
    if (isLikelyHeaderRow(firstTbodyRow)) {
      const next = firstTbodyRow.nextElementSibling;
      const nextFirst = next ? next.querySelector("td, th") : null;
      const nextText = nextFirst ? (nextFirst.textContent || "").trim() : "";
      if (nextText && !/^\d+[\d,.%$]*$/.test(nextText)) {
        promoteRowTdsToColumnHeaders(firstTbodyRow);
        promotedFirstTbody = true;
      }
    }
  }

  // Find column headers — in <thead>, or first row if no <thead>
  let headerRow = table.querySelector("thead tr");
  if (!headerRow) {
    // No <thead>: check if first row contains <th> elements
    const firstRow = table.querySelector("tr");
    if (firstRow && firstRow.querySelector("th")) {
      headerRow = firstRow;
    }
  }
  if (headerRow) {
    headerRow.querySelectorAll("th").forEach((th) => {
      if (!th.getAttribute("scope")) {
        th.setAttribute("scope", "col");
      }
    });
  }

  // Row headers: first cell in each body row that is <th>, or convert <td>
  // to <th> when the first cell contains non-numeric label text
  const bodyRows = table.querySelectorAll("tbody tr");
  const rows = bodyRows.length ? bodyRows : table.querySelectorAll("tr");
  rows.forEach((row) => {
    // Skip the header row we already handled
    if (row === headerRow) return;
    if (promotedFirstTbody && row === firstTbodyRow) return;
    const firstCell = row.querySelector("td:first-child, th:first-child");
    if (!firstCell) return;
    if (firstCell.tagName === "TH") {
      if (!firstCell.getAttribute("scope")) {
        firstCell.setAttribute("scope", "row");
      }
    } else {
      // Convert <td> to <th scope="row"> if it looks like a label.
      // Skip cells whose only content is the "No data" filler span
      // inserted by fixEmptyContainers / fixCmsEmptyTableCells —
      // those are placeholders for genuinely empty cells, not row
      // labels, and promoting them creates phantom header rows.
      const srOnly = firstCell.querySelector(".sr-only");
      if (srOnly && srOnly.textContent.trim() === "No data") return;
      // Don't promote the sole cell of a single-cell row. Such rows
      // are visual continuations of the previous row's data (already
      // spanned across all columns by normalizeRaggedRows), not row
      // labels. Promoting them creates orphan headers that SiteImprove
      // sia-r46 flags as "no data cells assigned".
      if (row.querySelectorAll("th, td").length < 2) return;
      const text = (firstCell.textContent || "").trim();
      if (text.length > 0 && !/^\d+[\d,.%$]*$/.test(text)) {
        const th = document.createElement("th");
        th.innerHTML = firstCell.innerHTML;
        for (const attr of firstCell.attributes) {
          th.setAttribute(attr.name, attr.value);
        }
        th.setAttribute("scope", "row");
        firstCell.parentNode.replaceChild(th, firstCell);
      }
    }
  });
}

// Complex tables (rowspan/colspan): generate unique IDs on <th> cells and
// explicit headers attributes on <td> cells to satisfy sia-r77.
function fixComplexTable(table, tableIndex) {
  const prefix = "tbl" + tableIndex + "-";
  // Collect all rows in order
  const allRows = table.querySelectorAll("tr");
  const numCols = getColumnCount(table);

  // Build a grid that maps each (row, col) to the <th> that owns it,
  // accounting for rowspan/colspan.
  const headerGrid = []; // headerGrid[row][col] = th id
  const cellGrid = []; // cellGrid[row][col] = element (for rowspan tracking)

  // Initialize grids
  allRows.forEach(() => {
    headerGrid.push(new Array(numCols).fill(null));
    cellGrid.push(new Array(numCols).fill(null));
  });

  // Fill cellGrid to track which cell occupies each position
  let thCounter = 0;
  allRows.forEach((row, rowIdx) => {
    let colIdx = 0;
    const cells = row.querySelectorAll("th, td");
    cells.forEach((cell) => {
      // Find next available column
      while (colIdx < numCols && cellGrid[rowIdx][colIdx] !== null) colIdx++;
      const rs = parseInt(cell.getAttribute("rowspan") || "1", 10);
      const cs = parseInt(cell.getAttribute("colspan") || "1", 10);

      // Assign ID to <th> elements. Keep any existing scope attr —
      // scope and id/headers can coexist and some scanners accept
      // either as a programmatic header-to-cell association.
      if (cell.tagName === "TH") {
        if (!cell.getAttribute("id")) {
          const id = prefix + "h" + thCounter++;
          cell.setAttribute("id", id);
        }
      }

      // Fill grid for all positions this cell spans
      for (let r = 0; r < rs && rowIdx + r < allRows.length; r++) {
        for (let c = 0; c < cs && colIdx + c < numCols; c++) {
          cellGrid[rowIdx + r][colIdx + c] = cell;
        }
      }
      colIdx += cs;
    });
  });

  // For each <td>, find all <th> cells that share a row or column position
  allRows.forEach((row, rowIdx) => {
    let colIdx = 0;
    const cells = row.querySelectorAll("th, td");
    cells.forEach((cell) => {
      while (colIdx < numCols && cellGrid[rowIdx][colIdx] !== cell) colIdx++;
      if (cell.tagName === "TD") {
        const cs = parseInt(cell.getAttribute("colspan") || "1", 10);
        const headerIds = new Set();
        // Collect column headers: scan upward in same column(s). Include
        // every <th> above, not just the closest — in a two-level header
        // (group header spanning several sub-headers) data cells need to
        // reference both levels, otherwise the group header becomes an
        // orphan that sia-r46 / axe `th-has-data-cells` flags.
        for (let c = colIdx; c < colIdx + cs && c < numCols; c++) {
          let lastSeen = null;
          for (let r = rowIdx - 1; r >= 0; r--) {
            const above = cellGrid[r][c];
            if (
              above &&
              above !== lastSeen &&
              above.tagName === "TH" &&
              above.getAttribute("id")
            ) {
              headerIds.add(above.getAttribute("id"));
              lastSeen = above;
            }
          }
        }
        // Collect row headers: scan leftward in same row
        for (let c = colIdx - 1; c >= 0; c--) {
          const left = cellGrid[rowIdx][c];
          if (left && left.tagName === "TH" && left.getAttribute("id")) {
            headerIds.add(left.getAttribute("id"));
            break;
          }
        }
        if (headerIds.size) {
          cell.setAttribute("headers", [...headerIds].join(" "));
        }
      }
      colIdx += parseInt(cell.getAttribute("colspan") || "1", 10);
    });
  });
}

// Count the number of columns in a table by examining the first row
function getColumnCount(table) {
  const firstRow = table.querySelector("tr");
  if (!firstRow) return 0;
  let count = 0;
  firstRow.querySelectorAll("th, td").forEach((cell) => {
    count += parseInt(cell.getAttribute("colspan") || "1", 10);
  });
  return count;
}
