import { VChip, VDataTable } from "vuetify/lib";
import VDataTableHeaderMobile from "vuetify/lib/components/VDataTable/VDataTableHeaderMobile";

// v-data-table, with the sort chip of its phone-width header made a button
// (WCAG 2.1.1, 4.1.2). Below 600 px the column headers give way to a "Sort
// by" select, and the chosen column shows as a chip whose arrow reverses the
// sort. The chip took no keyboard focus and had no role, name or state, so
// the sort direction could be changed with a mouse only. Here the chip is a
// button: Tab reaches it, Enter or Space changes the sort exactly as a click
// does, and its name says how the table is sorted and what the next press
// does, in the words the column headers use at wider widths ("Date: Sorted
// descending. Activate to remove sorting."). When a press removes the
// sorting the chip goes away, and focus moves to the "Sort by" select. The
// select's name includes the column chosen ("Sort by Date"), as other
// selects' names include their value: it was "Sort by" whatever the choice.
// Everything else is v-data-table's own. Used by PublicationsAll,
// MeetingTable and RequiredFormTable.
const DataTableHeaderMobile = VDataTableHeaderMobile.extend({
  name: "data-table-header-mobile",

  methods: {
    genSortChip(props) {
      const sortIndex = this.options.sortBy.findIndex(
        (k) => k === props.item.value
      );
      const beingSorted = sortIndex >= 0;
      const isDesc = this.options.sortDesc[sortIndex];
      const $t = (key) =>
        this.$vuetify.lang.t(`$vuetify.dataTable.ariaLabel.${key}`);
      let state = [$t("sortNone"), $t("activateAscending")];
      if (beingSorted && isDesc) {
        state = [
          $t("sortDescending"),
          $t(this.options.mustSort ? "activateAscending" : "activateNone"),
        ];
      } else if (beingSorted) {
        state = [$t("sortAscending"), $t("activateDescending")];
      }
      const sort = () => this.$emit("sort", props.item.value);

      const chip = this.$createElement(
        VChip,
        {
          staticClass: "sortable",
          attrs: { role: "button", tabindex: 0 },
          on: {
            click: (e) => {
              e.stopPropagation();
              sort();
            },
            keydown: (e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              e.stopPropagation();
              const clears = beingSorted && isDesc && !this.options.mustSort;
              sort();
              if (!clears) return;
              this.$nextTick(() => {
                const select = this.$el.querySelector(
                  ".v-select input:not([type='hidden'])"
                );
                if (select) select.focus();
              });
            },
          },
        },
        [
          props.item.text,
          // Hidden text, not aria-label: src/a11y's fixLabelInName removes an
          // aria-label that repeats the visible text and adds to it.
          this.$createElement("span", { staticClass: "sr-only" }, [
            `: ${state.join(" ")}`,
          ]),
          this.$createElement(
            "div",
            {
              staticClass: "v-chip__close",
              class: {
                sortable: true,
                active: beingSorted,
                asc: beingSorted && !isDesc,
                desc: beingSorted && isDesc,
              },
            },
            [this.genSortIcon()]
          ),
        ]
      );
      // The column's name as the select's chosen value, in hidden text:
      // fixNestedInteractive (src/a11y) adds a select's values to its name.
      const value = this.$createElement(
        "span",
        { staticClass: "v-select__selection sr-only" },
        [props.item.text]
      );
      return [chip, value];
    },
  },
});

export default VDataTable.extend({
  name: "data-table",

  created() {
    // More rows per page push the footer down the page, and with it the
    // "Rows per page" select holding focus: on Meetings, 100 rows left focus
    // on the select below the window (WCAG 2.4.7). Chosen from the keyboard,
    // the select is scrolled back into view. Chosen with a mouse or a finger,
    // the page stays where it was.
    this.$on("update:items-per-page", () => {
      const active = document.activeElement;
      if (!active || !active.closest(".v-data-footer")) return;
      if (!this.$el.contains(active) || this.lastInput !== "keyboard") return;
      this.$nextTick(() => active.scrollIntoView({ block: "nearest" }));
    });
  },

  mounted() {
    // How the table was last used. The select's menu is outside the table,
    // but the key or pointer press that opened it was inside.
    this.$el.addEventListener(
      "keydown",
      () => (this.lastInput = "keyboard"),
      true
    );
    this.$el.addEventListener(
      "pointerdown",
      () => (this.lastInput = "pointer"),
      true
    );
  },

  methods: {
    genHeaders(props) {
      const children = VDataTable.options.methods.genHeaders.call(this, props);
      if (!this.isMobile) return children;
      // Swap Vuetify's phone-width header for the one above, with the same
      // props and listeners.
      return children.map((vnode) => {
        const options = vnode && vnode.componentOptions;
        if (!options || options.Ctor !== VDataTableHeaderMobile) return vnode;
        return this.$createElement(DataTableHeaderMobile, {
          props: options.propsData,
          on: options.listeners,
        });
      });
    },
  },
});
