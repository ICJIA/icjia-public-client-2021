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
        btn.setAttribute("aria-label", index === 0 ? "Previous slide" : "Next slide");
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
  const chips = document.querySelectorAll(
    ".v-chip.grey, .v-chip.grey--text"
  );
  chips.forEach((chip) => {
    const content = chip.querySelector(".v-chip__content");
    if (content) {
      const style = window.getComputedStyle(content);
      const bg = window.getComputedStyle(chip).backgroundColor;
      // If background is light grey and text is white, darken text
      if (bg && content.style) {
        content.style.color = "#333";
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
};
