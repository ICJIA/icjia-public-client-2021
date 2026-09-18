/* eslint-env mocha */
// =============================================================================
// The attachments table at phone width (v1.5.94)
//
// Below 600 px v-data-table stacks each row's cells, each under its own label,
// and drops the header row. The meetings and publications tables keep one
// header cell there (their "Sort by" control); the attachments table has
// sorting off (1.5.69), so at phone width it was a table with no header cell at
// all: Lighthouse, td-has-header, "some non-empty data cells do not have table
// headers" (WCAG 1.3.1), on every page with attachments. Stacked, it is a list
// of labelled values ("Filename: notice.pdf"), not a grid, and says so.
// =============================================================================
import { expect } from "chai";
import AttachmentList from "@/components/AttachmentList.vue";

const tableWith = (stacked) => {
  const attrs = {};
  const table = {
    querySelector: (sel) =>
      sel === ".v-data-table__mobile-table-row" && stacked ? {} : null,
    setAttribute: (name, value) => (attrs[name] = value),
    removeAttribute: (name) => delete attrs[name],
  };
  return { table, attrs };
};
const mark = (tables) =>
  AttachmentList.methods.markStackedTables.call({
    $el: { querySelectorAll: () => tables },
  });

describe("Attachment list: the table stacked at phone width", () => {
  it("is presentational while it is stacked", () => {
    const { table, attrs } = tableWith(true);
    mark([table]);
    expect(attrs).to.deep.equal({ role: "presentation" });
  });

  it("is a table again when the header row is back", () => {
    const { table, attrs } = tableWith(false);
    attrs.role = "presentation";
    mark([table]);
    expect(attrs).to.deep.equal({});
  });

  it("is checked when the list appears and when the window's width changes", () => {
    expect(AttachmentList.watch).to.have.property("$vuetify.breakpoint.width");
    expect(String(AttachmentList.mounted)).to.include("markStackedTables");
  });

  it("does nothing before the component has an element", () => {
    expect(() =>
      AttachmentList.methods.markStackedTables.call({ $el: undefined })
    ).to.not.throw();
  });
});
