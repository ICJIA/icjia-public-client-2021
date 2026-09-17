// =============================================================================
// contentSanitizer plugin tests
// Exercises the HTML pipeline plugins that fix SiteImprove-flagged issues at
// pre-render time (tables, empty containers, link alt text, duplicate link
// text, Word-blue contrast).
// =============================================================================
import { expect } from "chai";
import {
  fixCmsTables,
  fixCmsEmptyContainers,
  fixCmsLinkAltText,
  fixCmsDuplicateLinkText,
  fixCmsSameHrefLinkLabels,
  fixCmsContrast,
  sanitizeContent,
  deepSanitize,
  wrapCmsTables,
} from "@/utils/contentSanitizer";
import { renderToHtml } from "@/services/Markdown";

describe("fixCmsTables — simple tables", () => {
  it("promotes <td> first cell to <th scope=row> when label is non-numeric", () => {
    const html =
      "<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody>" +
      "<tr><td>Illinois</td><td>42</td></tr></tbody></table>";
    const out = fixCmsTables(html);
    expect(out).to.match(/<th scope="row"[^>]*>Illinois<\/th>/);
  });

  it("adds scope=col to existing thead th cells", () => {
    const html =
      "<table><thead><tr><th>A</th><th>B</th></tr></thead>" +
      "<tbody><tr><td>1</td><td>2</td></tr></tbody></table>";
    const out = fixCmsTables(html);
    expect(out).to.match(/<th scope="col"[^>]*>A<\/th>/);
    expect(out).to.match(/<th scope="col"[^>]*>B<\/th>/);
  });

  it("wraps loose <tr> rows in <tbody>", () => {
    const html =
      "<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>";
    const out = fixCmsTables(html);
    expect(out).to.include("<tbody>");
  });
});

describe("fixCmsTables — complex tables", () => {
  it("assigns id to <th> and headers attribute to <td> for colspan tables", () => {
    const html =
      '<table><thead><tr><th colspan="2">Group</th></tr>' +
      "<tr><th>A</th><th>B</th></tr></thead>" +
      "<tbody><tr><td>1</td><td>2</td></tr></tbody></table>";
    const out = fixCmsTables(html);
    expect(out).to.match(/<th[^>]*id="cmstbl\d+-h\d+"/);
    expect(out).to.match(/<td[^>]*headers="cmstbl\d+-h\d+( cmstbl\d+-h\d+)*"/);
  });

  it("assigns id to <th> and headers to <td> on rowspan tables", () => {
    const html =
      '<table><tbody><tr><th scope="col" rowspan="2">X</th><td>1</td></tr>' +
      "<tr><td>2</td></tr></tbody></table>";
    const out = fixCmsTables(html);
    // The complex pass assigns an explicit id to each <th> and writes that id
    // into a headers="..." attribute on the governed <td> cells (WCAG H43).
    // scope is intentionally retained alongside headers (belt-and-suspenders).
    expect(out).to.match(/<th[^>]*id="cmstbl\d+-h\d+"[^>]*>X<\/th>/);
    expect(out).to.match(/<td[^>]*headers="cmstbl\d+-h\d+"[^>]*>1<\/td>/);
  });
});

describe("fixCmsTables — orphan headers", () => {
  it("marks header-only tables (no <td>) as presentational", () => {
    const html = "<table><thead><tr><th>A</th><th>B</th></tr></thead></table>";
    const out = fixCmsTables(html);
    expect(out).to.include('role="presentation"');
  });

  it("leaves normal (multi-column) tables without role=presentation", () => {
    const html =
      "<table><thead><tr><th>A</th><th>B</th></tr></thead>" +
      "<tbody><tr><td>1</td><td>2</td></tr></tbody></table>";
    const out = fixCmsTables(html);
    expect(out).to.not.include('role="presentation"');
  });

  it("marks single-column tables presentational (a list, not tabular data)", () => {
    const html =
      "<table><thead><tr><th>A</th></tr></thead>" +
      "<tbody><tr><td>1</td></tr></tbody></table>";
    const out = fixCmsTables(html);
    expect(out).to.include('role="presentation"');
  });

  it("removes empty <tr> rows (sia-r68) and unblocks header assignment", () => {
    const html =
      "<table><thead><tr><th>A</th><th>B</th></tr></thead>" +
      "<tbody><tr></tr><tr><td>Illinois</td><td>42</td></tr></tbody></table>";
    const out = fixCmsTables(html);
    expect(out).to.not.include("<tr></tr>");
    expect(out).to.match(/<th scope="row"[^>]*>Illinois<\/th>/);
  });

  it("demotes empty <th> corner cells to presentational spacer <td>", () => {
    const html =
      "<table><thead><tr><th></th><th>Score</th></tr></thead>" +
      "<tbody><tr><td>Illinois</td><td>42</td></tr></tbody></table>";
    const out = fixCmsTables(html);
    // The empty header becomes a presentational <td>, not an orphan <th>.
    expect(out).to.match(
      /<td[^>]*role="presentation"[^>]*><\/td>|<td[^>]*><\/td>/
    );
    expect(out).to.not.match(/<th[^>]*>\s*<\/th>/);
  });
});

describe("fixCmsTables — tables authored without <th>", () => {
  // Header text each data cell is associated with, via headers="…".
  const headersOf = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const out = {};
    doc.querySelectorAll("td").forEach((td) => {
      const text = td.textContent.trim();
      if (!text) return;
      out[text] = (td.getAttribute("headers") || "")
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => doc.getElementById(id).textContent.trim());
    });
    return { doc, out };
  };

  it("promotes a header row styled only by class, and keeps the first column as data", () => {
    // The shape of Table 1 in "Addressing Opioid Use Disorders in Corrections".
    const html =
      '<table><tbody><tr><td class="tg-0lax shaded bold">Methadone</td>' +
      '<td class="tg-0lax shaded bold">Buprenorphine</td>' +
      '<td class="tg-0lax shaded bold">Naltrexone</td></tr>' +
      "<tr><td>Full agonist</td><td>Partial agonist</td><td>Antagonist</td></tr>" +
      "<tr><td>Taken daily</td><td>Taken twice</td><td>Injectable</td></tr>" +
      "</tbody></table>";
    // Twice: later passes of the pipeline must keep the decision.
    const { doc, out } = headersOf(fixCmsTables(fixCmsTables(html)));
    expect(doc.querySelectorAll('th[scope="col"]').length).to.equal(3);
    expect(doc.querySelectorAll('th[scope="row"]').length).to.equal(0);
    expect(out["Full agonist"]).to.deep.equal(["Methadone"]);
    expect(out["Partial agonist"]).to.deep.equal(["Buprenorphine"]);
    expect(out["Injectable"]).to.deep.equal(["Naltrexone"]);
  });

  it("keeps row headers when the header row has a blank corner", () => {
    const html =
      "<table><tbody><tr><td><strong> </strong></td><td><strong>n</strong></td>" +
      "<td><strong>Percent</strong></td></tr>" +
      "<tr><td>Northern</td><td>10</td><td>27.8</td></tr>" +
      "<tr><td>Central</td><td>16</td><td>44.4</td></tr></tbody></table>";
    const { doc, out } = headersOf(fixCmsTables(html));
    expect(doc.querySelectorAll('th[scope="col"]').length).to.equal(2);
    expect(out["16"]).to.deep.equal(["n", "Central"]);
    expect(out["44.4"]).to.deep.equal(["Percent", "Central"]);
  });

  it("reads a two-row header with group headers, and keeps row headers", () => {
    // The shape of the drug-testing table: blank corner over two rows,
    // group headers spanning two columns, then n / Percent.
    const html =
      '<table><tbody><tr><td rowspan="2"></td><td colspan="2">Initial</td>' +
      '<td colspan="2">Sporadic</td></tr>' +
      "<tr><td>n</td><td>Percent</td><td>n</td><td>Percent</td></tr>" +
      "<tr><td>Sanctions</td><td>18</td><td>47%</td><td>21</td><td>57%</td></tr>" +
      "</tbody></table>";
    const { doc, out } = headersOf(fixCmsTables(fixCmsTables(html)));
    expect(doc.querySelectorAll('th[scope="col"]').length).to.equal(6);
    expect(out["47%"]).to.deep.equal(["Percent", "Initial", "Sanctions"]);
    expect(out["21"]).to.deep.equal(["n", "Sporadic", "Sanctions"]);
  });

  it("keeps row headers when text labels sit beside numbers", () => {
    const html =
      "<table><tbody><tr><td><b>Region</b></td><td><b>2019</b></td><td><b>2020</b></td></tr>" +
      "<tr><td>Cook</td><td>2,062</td><td>2,475</td></tr>" +
      "<tr><td>Collar</td><td>1,104</td><td>998</td></tr></tbody></table>";
    const { out } = headersOf(fixCmsTables(html));
    expect(out["2,475"]).to.deep.equal(["2020", "Cook"]);
  });

  it("keeps the decision through the content pipeline a CMS body takes", () => {
    // API responses are deep-sanitized before the markdown is rendered, and
    // the rendered HTML is sanitized again: the header row is inferred on the
    // first pass, and the later passes must not add row headers.
    const markdown =
      "Intro\n\n" +
      '<table><tbody><tr><td class="bold">Methadone</td><td class="bold">Naltrexone</td></tr>' +
      "<tr><td>Full agonist</td><td>Antagonist</td></tr></tbody></table>\n";
    const html = sanitizeContent(renderToHtml(deepSanitize(markdown)));
    const { doc, out } = headersOf(html);
    expect(doc.querySelectorAll('th[scope="row"]').length).to.equal(0);
    expect(out["Antagonist"]).to.deep.equal(["Naltrexone"]);
  });

  it("still gives row headers to a table with an authored header row", () => {
    const html =
      "<table><thead><tr><th>Housing authority</th><th>Region</th></tr></thead>" +
      "<tbody><tr><td>Adams County</td><td>Central</td></tr></tbody></table>";
    const { out } = headersOf(fixCmsTables(html));
    expect(out["Central"]).to.deep.equal(["Region", "Adams County"]);
  });
});

describe("fixCmsTables — rows grouped under a label spanning them", () => {
  // The four Research Hub tables whose values were announced under other
  // rows' headers or without their group, as authored in the CMS (width,
  // valign and Word styles left out; they play no part in the decisions).
  const td = (content, attrs = "") =>
    `<td${attrs ? " " + attrs : ""}>${content}</td>`;
  const tr = (...cells) => `<tr>${cells.join("")}</tr>`;
  const p = (text) => `<p>${text}</p>`;
  const b = (text) => `<p><strong>${text}</strong></p>`;

  // "Addressing Opioid Use Disorders in Corrections", Table 3.
  const opioidTable3 =
    '<table align="center" class="tg"><tbody>' +
    tr(
      td(b("&nbsp;")),
      td(b("Medication"), 'class="tg-0lax"'),
      td(b("n"), 'class="tg-0lax"'),
      td(b("Percent"), 'class="tg-0lax"')
    ) +
    tr(
      td(
        p("Moderately or extremely open to offering MAT"),
        'class="tg-0lax shaded" rowspan="3"'
      ),
      td(p("methadone"), 'class="tg-0lax shaded"'),
      td(p("6"), 'class="tg-0lax shaded"'),
      td(p("16.7%"), 'class="tg-0lax shaded"')
    ) +
    tr(td(p("buprenorphine")), td(p("8")), td(p("22.1%"))) +
    tr(td(p("naltrexone")), td(p("9")), td(p("25.0%"))) +
    tr(
      td(
        p("May consider or definitely considering expanding MAT"),
        'class="tg-0lax" rowspan="3"'
      ),
      td(p("methadone")),
      td(p("3")),
      td(p("8.3%"))
    ) +
    tr(td(p("buprenorphine")), td(p("5")), td(p("13.8%"))) +
    tr(td(p("naltrexone")), td(p("7")), td(p("19.4%"))) +
    tr(
      td(p("Likely or very likely to introduce MAT"), 'colspan="2"'),
      td(p("8")),
      td(p("22.1%"))
    ) +
    tr(
      td(p("Likely or very likely to expand MAT"), 'colspan="2"'),
      td(p("6")),
      td(p("16.7%"))
    ) +
    tr(
      td(
        p("Interested or Extremely interested in training on MAT"),
        'colspan="2"'
      ),
      td(p("8")),
      td(p("22.1%"))
    ) +
    "</tbody></table>";

  // "Law Enforcement Response to Mental Health Crisis Incidents".
  const bg = (color) => `bgcolor="${color}"`;
  const group = (label, n, rows) =>
    rows
      .map((row, i) =>
        tr(
          ...(i === 0
            ? [
                td(
                  b(label) + b(`(n=${n})`),
                  `rowspan="${rows.length}" ${bg("#4F81BD")}`
                ),
              ]
            : []),
          ...row.map((text) => td(p(text), bg("#D0D8E8")))
        )
      )
      .join("");
  const mentalHealthTable =
    "<table><tbody>" +
    tr(
      td("", bg("#4F81BD")),
      td("", bg("#4F81BD")),
      td(b("n"), bg("#4F81BD")),
      td(b("Percent"), bg("#4F81BD"))
    ) +
    group("Department Type", 44, [
      ["Municipal Police Departments", "25", "56.8%"],
      ["Sheriff’s Offices", "16", "36.4%"],
      ["Other", "3", "6.8%"],
    ]) +
    group("Region", 44, [
      ["South", "4", "9.1%"],
      ["Central", "17", "38.6%"],
      ["North", "6", "13.6%"],
      ["Collar", "11", "25.0%"],
      ["Cook", "6", "13.6%"],
    ]) +
    group("Rurality", 56, [
      ["Mostly Urban", "27", "48.2%"],
      ["Mostly Rural", "24", "42.9%"],
      ["Completely Rural", "5", "8.9%"],
    ]) +
    tr(
      td(b("Counties Represented"), `colspan="2" ${bg("#4F81BD")}`),
      td(p("28"), bg("#E9EDF4")),
      td(p("27.5%"), bg("#E9EDF4"))
    ) +
    "</tbody></table>";

  // "Youth Development: An Overview of Related Factors and Interventions".
  const textGroup = (label, rows) =>
    rows
      .map((row, i) =>
        tr(
          ...(i === 0 ? [td(label, `rowspan="${rows.length}"`)] : []),
          ...row.map((text) => td(text))
        )
      )
      .join("");
  const youthTable =
    "<table><thead><tr><th>Domain</th><th>Risk Factors</th>" +
    "<th>Protective Factors</th></tr></thead><tbody>" +
    textGroup("Family", [
      [
        "Inconsistent/harsh punishment",
        "Reliable support and discipline from caregivers",
      ],
      [
        "Lack of parental supervision/monitoring",
        "Adequate socioeconomic resources",
      ],
      ["Low levels of family bonding", "High levels of family bonding"],
      ["High levels of family conflict", "Adequate parental supervision"],
    ]) +
    textGroup("School/Community", [
      [
        "Negative relationships with peers and teachers",
        "Positive relationships with peers and teachers",
      ],
      [
        "Involvement with antisocial activities and antisocial peers",
        "Involvement with prosocial activities and prosocial peers",
      ],
      [
        "Poor school performance/engagement",
        "Positive school performance/engagement",
      ],
    ]) +
    "</tbody></table>";

  // "Individual and Community Trauma": the Setting / Overall Goal table,
  // whose goal spans the rows of its setting too, and the Developmental
  // Domain / Reaction table, whose group rows hold a single cell.
  const traumaSettingsTable =
    "<table><thead><tr><th>Setting</th><th>Overall Goal</th><th>Strategies</th>" +
    "<th>Potential Application</th></tr></thead><tbody>" +
    tr(
      td("Physical", 'rowspan="2"'),
      td(
        "Safe spaces with cultural expression, quality housing, and availability of healthy products.",
        'rowspan="2"'
      ),
      td(
        "Reclaiming, improving, and maintaining the physical space of the community."
      ),
      td("Physically improving outdoor spaces and buildings.")
    ) +
    tr(
      td("Creating safer public spaces."),
      td(
        "Increasing and maintaining parks, quality housing, and reliable public transportation."
      )
    ) +
    tr(
      td("Social-Cultural", 'rowspan="2"'),
      td(
        "Counter community trauma symptoms, support connection and healing, and establish norms that encourage healthy behaviors.",
        'rowspan="2"'
      ),
      td("Rebuild social relationships, social networks, and social support."),
      td("Utilizing restorative justice within the community.")
    ) +
    tr(
      td("Promote social norms that encourage healthy behaviors."),
      td("Implementing positive youth development programming.")
    ) +
    "</tbody></table>";
  const traumaReactionsTable =
    "<table><thead><tr><th>Developmental Domain</th><th>Reaction</th></tr></thead><tbody>" +
    tr(
      td("Emotional", 'rowspan="2"'),
      td(
        "Difficulties regulating emotions such as anger, anxiety, shame, and sadness."
      )
    ) +
    tr(
      td(
        "Numbness, or detaching emotions from thoughts, behaviors, and memories."
      )
    ) +
    tr(
      td("Physical", 'rowspan="2"'),
      td("Bodily symptoms or dysfunctions that result from emotional distress.")
    ) +
    tr(td("Changes in the brain development and neurological functioning.")) +
    "</tbody></table>";

  const parse = (html) => new DOMParser().parseFromString(html, "text/html");
  const text = (el) => el.textContent.replace(/\s+/g, " ").trim();
  // Each cell's row, tag, scope and the header text its headers="…" name.
  const cellsOf = (html) => {
    const doc = parse(html);
    const out = [];
    Array.from(doc.querySelectorAll("tr")).forEach((row, r) =>
      Array.from(row.children).forEach((cell) =>
        out.push({
          r,
          tag: cell.tagName,
          scope: cell.getAttribute("scope"),
          colspan: cell.getAttribute("colspan"),
          text: text(cell),
          headers: (cell.getAttribute("headers") || "")
            .split(/\s+/)
            .filter(Boolean)
            .map((id) => text(doc.getElementById(id))),
        })
      )
    );
    return out;
  };
  const at = (cells, r, value) =>
    cells.find((c) => c.r === r && c.text === value);
  // On the table's grid: values under a row header of another row, values
  // missing a row header of their own row (their group's included), values
  // missing their column header.
  const gridCheck = (html) => {
    const doc = parse(html);
    const rows = Array.from(doc.querySelectorAll("tr"));
    const slots = rows.map(() => []);
    const pos = new Map();
    rows.forEach((row, r) => {
      let c = 0;
      Array.from(row.children).forEach((cell) => {
        while (slots[r][c]) c++;
        const rs = cell.rowSpan || 1;
        const cs = cell.colSpan || 1;
        pos.set(cell, { r, c, rs, cs });
        for (let i = 0; i < rs && r + i < rows.length; i++)
          for (let j = 0; j < cs; j++) slots[r + i][c + j] = cell;
        c += cs;
      });
    });
    const all = rows.flatMap((row) => Array.from(row.children));
    const ths = all.filter((cell) => cell.tagName === "TH");
    const covers = (h, r) =>
      r >= pos.get(h).r && r < pos.get(h).r + pos.get(h).rs;
    const result = { values: 0, foreign: 0, missingRow: 0, missingCol: 0 };
    all
      .filter((cell) => cell.tagName === "TD" && text(cell))
      .forEach((cell) => {
        result.values++;
        const where = pos.get(cell);
        const headers = (cell.getAttribute("headers") || "")
          .split(/\s+/)
          .filter(Boolean)
          .map((id) => doc.getElementById(id));
        const rowHeader = (h) => h.getAttribute("scope") === "row";
        if (headers.some((h) => rowHeader(h) && !covers(h, where.r)))
          result.foreign++;
        const own = ths.filter(
          (h) => rowHeader(h) && covers(h, where.r) && pos.get(h).c < where.c
        );
        if (own.some((h) => !headers.includes(h))) result.missingRow++;
        const cols = ths.filter(
          (h) =>
            h.getAttribute("scope") === "col" &&
            pos.get(h).r < where.r &&
            where.c >= pos.get(h).c &&
            where.c < pos.get(h).c + pos.get(h).cs
        );
        if (cols.length && !cols.some((h) => headers.includes(h)))
          result.missingCol++;
      });
    return result;
  };

  const TABLES = {
    opioidTable3,
    mentalHealthTable,
    youthTable,
    traumaSettingsTable,
    traumaReactionsTable,
  };
  Object.entries(TABLES).forEach(([name, html]) => {
    it(`gives every value its own row's headers and its group, and no other row's: ${name}`, () => {
      // Twice: later passes of the pipeline must keep the decisions.
      const once = fixCmsTables(html);
      const check = gridCheck(once);
      expect(check.values).to.be.greaterThan(0);
      expect(check).to.include({ foreign: 0, missingRow: 0, missingCol: 0 });
      expect(
        cellsOf(fixCmsTables(once)).map((c) => [c.tag, c.scope, c.headers])
      ).to.deep.equal(cellsOf(once).map((c) => [c.tag, c.scope, c.headers]));
    });
  });

  it("makes methadone a row header in both groups, like buprenorphine and naltrexone", () => {
    const cells = cellsOf(fixCmsTables(opioidTable3));
    [1, 4].forEach((r) =>
      expect(at(cells, r, "methadone")).to.include({ tag: "TH", scope: "row" })
    );
    expect(at(cells, 2, "buprenorphine")).to.include({
      tag: "TH",
      scope: "row",
    });
    expect(at(cells, 1, "6").headers).to.deep.equal([
      "n",
      "methadone",
      "Moderately or extremely open to offering MAT",
    ]);
    expect(at(cells, 2, "8").headers).to.deep.equal([
      "n",
      "buprenorphine",
      "Moderately or extremely open to offering MAT",
    ]);
    expect(at(cells, 5, "5").headers).to.deep.equal([
      "n",
      "buprenorphine",
      "May consider or definitely considering expanding MAT",
    ]);
    expect(at(cells, 6, "19.4%").headers).to.deep.equal([
      "Percent",
      "naltrexone",
      "May consider or definitely considering expanding MAT",
    ]);
    // A label spanning two columns is still the row's only row header.
    expect(at(cells, 7, "22.1%").headers).to.deep.equal([
      "Percent",
      "Likely or very likely to introduce MAT",
    ]);
  });

  it("gives the mental health survey's counts their department type, region or rurality", () => {
    const cells = cellsOf(fixCmsTables(mentalHealthTable));
    expect(at(cells, 2, "16").headers).to.deep.equal([
      "n",
      "Sheriff’s Offices",
      "Department Type(n=44)",
    ]);
    expect(at(cells, 8, "13.6%").headers).to.deep.equal([
      "Percent",
      "Cook",
      "Region(n=44)",
    ]);
    expect(at(cells, 9, "Mostly Urban")).to.include({
      tag: "TH",
      scope: "row",
    });
  });

  it("keeps text beside text as data under its column, in its group", () => {
    const cells = cellsOf(fixCmsTables(youthTable));
    const risk = at(cells, 2, "Lack of parental supervision/monitoring");
    expect(risk.tag).to.equal("TD");
    expect(risk.headers).to.deep.equal(["Risk Factors", "Family"]);
    expect(
      at(cells, 2, "Adequate socioeconomic resources").headers
    ).to.deep.equal(["Protective Factors", "Family"]);
    expect(
      at(cells, 5, "Negative relationships with peers and teachers").headers
    ).to.deep.equal(["Risk Factors", "School/Community"]);
  });

  it("does not take a group's goal or another row's strategy for a header", () => {
    const cells = cellsOf(fixCmsTables(traumaSettingsTable));
    expect(at(cells, 2, "Creating safer public spaces.")).to.deep.include({
      tag: "TD",
      headers: ["Strategies", "Physical"],
    });
    expect(
      at(
        cells,
        3,
        "Rebuild social relationships, social networks, and social support."
      ).headers
    ).to.deep.equal(["Strategies", "Social-Cultural"]);
  });

  it("does not widen the single-cell rows of a group into a column the table does not have", () => {
    const cells = cellsOf(fixCmsTables(traumaReactionsTable));
    const numbness = at(
      cells,
      2,
      "Numbness, or detaching emotions from thoughts, behaviors, and memories."
    );
    expect(numbness.colspan).to.equal(null);
    expect(numbness.headers).to.deep.equal(["Reaction", "Emotional"]);
  });

  it("still widens a continuation row, without the row headers above it", () => {
    // The shape of the NOFO timeline tables: a date carried onto a row of its own.
    const html =
      "<table><thead><tr><th>Task</th><th>Date</th></tr></thead><tbody>" +
      tr(td("Applications due"), td("April 23, 2024")) +
      tr(td("Performance Period"), td("July 1, 2024 to")) +
      tr(td("June 30, 2025")) +
      "</tbody></table>";
    const cells = cellsOf(fixCmsTables(html));
    expect(at(cells, 3, "June 30, 2025")).to.deep.include({
      tag: "TD",
      colspan: "2",
      headers: ["Task", "Date"],
    });
  });

  it("does not give an empty first cell the row headers above it", () => {
    // The shape of the regression tables: a row of standard errors under
    // each estimate.
    const html =
      "<table><thead><tr><th>Predictor Variables</th><th>ARI Program Completion Model</th></tr></thead><tbody>" +
      tr(td("Sex"), td("")) +
      tr(td("Male"), td("Reference")) +
      tr(td("Female"), td("-.097")) +
      tr(td(""), td("(.908)")) +
      "</tbody></table>";
    const doc = parse(fixCmsTables(html));
    const blank = doc.querySelectorAll("tr")[4].children[0];
    const named = (blank.getAttribute("headers") || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => text(doc.getElementById(id)));
    expect(named).to.not.include("Female");
    expect(named).to.not.include("Sex");
  });

  it("keeps the decisions through the content pipeline a Research Hub article takes", () => {
    const markdown = `Intro\n\n${opioidTable3}\n`;
    const html = sanitizeContent(renderToHtml(deepSanitize(markdown)));
    const check = gridCheck(html);
    expect(check).to.include({ foreign: 0, missingRow: 0, missingCol: 0 });
    const cells = cellsOf(html);
    expect(at(cells, 4, "methadone")).to.include({ tag: "TH", scope: "row" });
  });
});

describe("wrapCmsTables — tables scroll sideways in their own region", () => {
  const parse = (html) => new DOMParser().parseFromString(html, "text/html");

  it("wraps a table in a focusable region named by its column headers", () => {
    const doc = parse(
      wrapCmsTables(
        "<p>Intro</p><table><thead><tr><th>Date</th><th>Location</th></tr></thead>" +
          "<tbody><tr><td>May 1</td><td>Chicago</td></tr></tbody></table>"
      )
    );
    const region = doc.querySelector(".table-scroll");
    expect(region).to.not.equal(null);
    expect(region.getAttribute("role")).to.equal("region");
    expect(region.getAttribute("tabindex")).to.equal("0");
    expect(region.getAttribute("aria-label")).to.equal("Table: Date, Location");
    expect(region.firstElementChild.tagName).to.equal("TABLE");
  });

  it("names the region by the table's caption", () => {
    const doc = parse(
      wrapCmsTables(
        "<table><caption>Awards by region</caption><tr><th>Region</th></tr>" +
          "<tr><td>Cook</td></tr></table>"
      )
    );
    const region = doc.querySelector(".table-scroll");
    const caption = doc.querySelector("caption");
    expect(caption.id).to.match(/^cms-table-caption-\d+$/);
    expect(region.getAttribute("aria-labelledby")).to.equal(caption.id);
    expect(region.hasAttribute("aria-label")).to.equal(false);
  });

  it("names the region by a Research Hub caption above the table", () => {
    const doc = parse(
      wrapCmsTables(
        '<div class="article-table"><p class="article-caption article-caption--h4">Table 1</p>' +
          "<table><tr><td>Methadone</td><td>Naltrexone</td></tr></table>" +
          '<p class="article-caption article-caption--h6">Source: SAMHSA</p></div>'
      )
    );
    const region = doc.querySelector(".table-scroll");
    const label = doc.getElementById(region.getAttribute("aria-labelledby"));
    expect(label.textContent).to.equal("Table 1");
  });

  it("falls back to 'Table' when there is nothing to name it by", () => {
    const doc = parse(
      wrapCmsTables("<table><tr><td>1</td><td>2</td></tr></table>")
    );
    expect(
      doc.querySelector(".table-scroll").getAttribute("aria-label")
    ).to.equal("Table");
  });

  it("leaves layout tables and tables inside tables alone, and wraps once", () => {
    const html =
      '<table role="presentation"><tr><td>Layout</td></tr></table>' +
      "<table><tr><th>Outer</th></tr><tr><td><table><tr><th>Inner</th></tr>" +
      "<tr><td>1</td></tr></table></td></tr></table>";
    const doc = parse(wrapCmsTables(wrapCmsTables(html)));
    const regions = doc.querySelectorAll(".table-scroll");
    expect(regions.length).to.equal(1);
    expect(regions[0].getAttribute("aria-label")).to.equal("Table: Outer");
  });

  it("returns HTML without a table unchanged", () => {
    const html = "<p>No tables here</p>";
    expect(wrapCmsTables(html)).to.equal(html);
  });
});

describe("fixCmsEmptyContainers", () => {
  it("removes empty <p> elements", () => {
    const out = fixCmsEmptyContainers("<div><p></p><p>Hello</p></div>");
    expect(out).to.include("<p>Hello</p>");
    expect(out.match(/<p>/g)).to.have.lengthOf(1);
  });

  it("removes empty headings", () => {
    const out = fixCmsEmptyContainers("<h2></h2><h3>Real heading</h3>");
    expect(out).to.not.include("<h2");
    expect(out).to.include("<h3>Real heading</h3>");
  });

  it("preserves containers that wrap images", () => {
    const out = fixCmsEmptyContainers('<p><img src="foo.png" alt="foo"></p>');
    expect(out).to.include("<img");
    expect(out).to.include("<p>");
  });

  it("removes nested empty containers", () => {
    const out = fixCmsEmptyContainers("<div><div><p></p></div></div>");
    expect(out).to.not.include("<p>");
  });
});

describe("fixCmsLinkAltText", () => {
  it("adds aria-label from img alt for image-only links", () => {
    const out = fixCmsLinkAltText(
      '<a href="/foo"><img alt="Interactive dashboard" src="/x.png"></a>'
    );
    expect(out).to.include('aria-label="Interactive dashboard"');
  });

  it("derives label from href when img alt is empty", () => {
    const out = fixCmsLinkAltText(
      '<a href="/grants/fy25-applications"><img alt="" src="/x.png"></a>'
    );
    expect(out).to.match(/aria-label="[^"]+"/);
  });

  it("leaves links with visible text untouched", () => {
    const out = fixCmsLinkAltText('<a href="/foo">Click here</a>');
    expect(out).to.not.include("aria-label");
  });
});

describe("fixCmsDuplicateLinkText", () => {
  it("disambiguates duplicate link text with href-derived qualifier", () => {
    const html =
      "<ul>" +
      '<li><a href="/feeds/news.xml">RSS</a></li>' +
      '<li><a href="/feeds/funding.xml">RSS</a></li>' +
      "</ul>";
    const out = fixCmsDuplicateLinkText(html);
    expect(out).to.match(/aria-label="RSS: news"/i);
    expect(out).to.match(/aria-label="RSS: funding"/i);
  });

  it("leaves unique links untouched", () => {
    const html = '<p><a href="/a">First</a> and <a href="/b">Second</a></p>';
    const out = fixCmsDuplicateLinkText(html);
    expect(out).to.not.include("aria-label");
  });
});

describe("fixCmsSameHrefLinkLabels", () => {
  it("normalizes aria-label when unifying stays label-in-name safe", () => {
    // Both links share the href; the shorter link's visible text ("Annual
    // Report") is contained in the canonical ("Annual Report 2024"), so
    // adopting it as the accessible name does not violate WCAG 2.5.3.
    const html =
      "<ul>" +
      '<li><a href="/article/x">Annual Report 2024</a></li>' +
      '<li><a href="/article/x">Annual Report</a></li>' +
      "</ul>";
    const out = fixCmsSameHrefLinkLabels(html);
    expect(out).to.include('aria-label="Annual Report 2024"');
    // Only the shorter link gets the aria-label
    expect((out.match(/aria-label=/g) || []).length).to.equal(1);
  });

  it("does NOT unify when it would break label-in-name (WCAG 2.5.3)", () => {
    // "Read more" is not contained in "Annual Report 2024", so overriding its
    // accessible name would make the visible label absent from the accessible
    // name — the exact SiteImprove sia-r14 failure. Leave it alone.
    const html =
      "<ul>" +
      '<li><a href="/article/x">Annual Report 2024</a></li>' +
      '<li><a href="/article/x">Read more</a></li>' +
      "</ul>";
    const out = fixCmsSameHrefLinkLabels(html);
    expect(out).to.not.include('aria-label="Annual Report 2024"');
  });

  it("does not touch different-href links with different text", () => {
    const html = '<p><a href="/a">Alpha</a> and <a href="/b">Beta</a></p>';
    const out = fixCmsSameHrefLinkLabels(html);
    expect(out).to.not.include("aria-label");
  });

  it("does not touch same-href links with identical text", () => {
    const html = '<p><a href="/x">Same</a> and <a href="/x">Same</a></p>';
    const out = fixCmsSameHrefLinkLabels(html);
    expect(out).to.not.include("aria-label");
  });
});

describe("fixCmsContrast — Word-blue tables", () => {
  it("replaces #4F81BD bgcolor attribute with darker shade", () => {
    const out = fixCmsContrast('<th bgcolor="#4F81BD">Header</th>');
    expect(out).to.include('bgcolor="#2E5E97"');
    expect(out).to.not.include("#4F81BD");
  });

  it("replaces #4F81BD in inline style", () => {
    const out = fixCmsContrast(
      '<th style="background:#4F81BD;color:#fff">X</th>'
    );
    expect(out).to.include("#2E5E97");
    expect(out).to.not.include("#4F81BD");
  });

  it("replaces rgb form", () => {
    const out = fixCmsContrast(
      '<th style="background: rgb(79, 129, 189)">X</th>'
    );
    expect(out).to.include("rgb(46, 94, 151)");
  });
});

describe("sanitizeContent — full pipeline", () => {
  it("runs all plugins without throwing and returns a string", () => {
    const html =
      '<p></p><a href="/x"><img alt="" src="/y.png"></a>' +
      "<table><tr><th>X</th><td>1</td></tr></table>" +
      '<th bgcolor="#4F81BD">Header</th>';
    const out = sanitizeContent(html);
    expect(out).to.be.a("string");
    expect(out.length).to.be.greaterThan(0);
  });
});
